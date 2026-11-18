"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EDITORS, OWNER, getSession, localDemoAllowed, localSignIn, requireRole, signOutAll } from "@/lib/auth";
import { SITE_URL, USE_SUPABASE } from "@/lib/config";
import { adminStore, systemStore } from "@/lib/store";
import { serviceClient, userClient } from "@/lib/store/supabase";
import { applyTranslations, type Translatable } from "@/lib/translate";
import { refreshRates } from "@/lib/rates";
import { isLang } from "@/lib/i18n";
import type { Banner, Category, Item, Lang, Restaurant, Role, Special, TableQR } from "@/lib/types";

export type Result<T = unknown> = { ok: true; data?: T; warning?: string } | { ok: false; error: string };

const fail = (e: unknown): Result<never> => ({ ok: false, error: e instanceof Error ? e.message : String(e) });
const live = () => revalidatePath("/", "layout");

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";

function uniqueSlug(base: string, taken: string[], own?: string) {
  let slug = slugify(base);
  let n = 2;
  while (taken.includes(slug) && slug !== own) slug = `${slugify(base)}-${n++}`;
  return slug;
}

// ================================================================ auth

const attempts = new Map<string, { n: number; at: number }>();
function tooManyAttempts(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.at > 15 * 60_000) {
    attempts.set(key, { n: 1, at: now });
    return false;
  }
  a.n++;
  return a.n > 8;
}

export async function signInAction(_: unknown, form: FormData): Promise<Result> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (tooManyAttempts(`${ip}:${email}`)) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  if (!USE_SUPABASE) {
    if (!localDemoAllowed()) return { ok: false, error: "Sign-in is not configured." };
    if (!(await localSignIn(email, password))) return { ok: false, error: "Wrong email or password." };
    redirect("/admin");
  }
  const sb = await userClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: "Wrong email or password." };
  const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!profile?.role) {
    await sb.auth.signOut();
    return { ok: false, error: "This account doesn't have access to the menu admin. Ask the owner to invite you." };
  }
  redirect("/admin");
}

/** First-run only: creates the owner account when nobody has signed up yet. */
type Svc = NonNullable<ReturnType<typeof serviceClient>>;

/** Gives a user a menu role (or removes it with null). Never touches other columns of profiles. */
async function setMenuRole(svc: Svc, userId: string, email: string | undefined, role: Role | null) {
  const { data: updated, error } = await svc.from("profiles").update({ role }).eq("id", userId).select("id");
  if (error) throw new Error(error.message);
  if (!updated?.length && role) {
    const { error: insErr } = await svc.from("profiles").insert({ id: userId, email: email ?? null, role });
    if (insErr) throw new Error(insErr.message);
  }
}

async function findUserByEmail(svc: Svc, email: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ownerExists(svc: Svc) {
  const { count } = await svc.from("profiles").select("id", { count: "exact", head: true }).eq("role", "owner");
  return Boolean(count);
}

/**
 * First-run only: makes the menu owner. Works with a brand-new email, or with an account that
 * already exists in this Supabase project (the correct password is required).
 */
export async function createOwnerAction(_: unknown, form: FormData): Promise<Result> {
  const svc = serviceClient();
  if (!svc) return { ok: false, error: "SUPABASE_SECRET_KEY is not configured." };
  if (await ownerExists(svc)) return { ok: false, error: "The menu already has an owner. Sign in instead." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { ok: false, error: "Use a password of at least 10 characters." };
  const sb = await userClient();
  const existing = await findUserByEmail(svc, email);
  let userId: string;
  if (existing) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false, error: "That email already has an account here. Enter its current password to make it the menu owner." };
    userId = data.user.id;
  } else {
    const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return { ok: false, error: error?.message ?? "Could not create the account." };
    userId = data.user.id;
    await sb.auth.signInWithPassword({ email, password });
  }
  await setMenuRole(svc, userId, email, "owner");
  redirect("/admin");
}

export async function needsOwnerSetup(): Promise<boolean> {
  if (!USE_SUPABASE) return false;
  const svc = serviceClient();
  if (!svc) return false;
  return !(await ownerExists(svc));
}

export async function forgotPasswordAction(_: unknown, form: FormData): Promise<Result> {
  if (!USE_SUPABASE) return { ok: false, error: "Password reset needs Supabase. In demo mode the password is in .env.local." };
  const email = String(form.get("email") ?? "").trim();
  const sb = await userClient();
  await sb.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/admin/auth/callback?next=/admin/reset` });
  return { ok: true }; // same answer whether or not the email exists
}

export async function resetPasswordAction(_: unknown, form: FormData): Promise<Result> {
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { ok: false, error: "Use a password of at least 10 characters." };
  const sb = await userClient();
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  redirect("/admin");
}

export async function signOutAction() {
  await signOutAll();
  redirect("/admin/login");
}

// ---- two-step verification (TOTP authenticator app)
export async function mfaEnrollAction(): Promise<Result<{ factorId: string; qr: string; secret: string }>> {
  await requireRole();
  const sb = await userClient();
  const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` });
  if (error) return fail(error);
  return { ok: true, data: { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret } };
}

export async function mfaVerifyAction(factorId: string, code: string): Promise<Result> {
  const sb = await userClient();
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
  if (error) return { ok: false, error: "That code didn't work. Try the newest code." };
  return { ok: true };
}

export async function mfaChallengeAction(_: unknown, form: FormData): Promise<Result> {
  const sb = await userClient();
  const { data } = await sb.auth.mfa.listFactors();
  const factor = data?.totp?.find((f) => f.status === "verified");
  if (!factor) redirect("/admin");
  const r = await mfaVerifyAction(factor.id, String(form.get("code") ?? ""));
  if (!r.ok) return r;
  redirect("/admin");
}

export async function mfaDisableAction(): Promise<Result> {
  await requireRole();
  const sb = await userClient();
  const { data } = await sb.auth.mfa.listFactors();
  for (const f of data?.all ?? []) await sb.auth.mfa.unenroll({ factorId: f.id });
  return { ok: true };
}

// ================================================================ photos

const IMAGE_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

export async function uploadPhotoAction(form: FormData): Promise<Result<string>> {
  try {
    await requireRole(EDITORS);
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "items").replace(/[^a-z]/g, "") || "items";
    if (!(file instanceof Blob)) return { ok: false, error: "No file" };
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { ok: false, error: "Use a JPG, PNG or WebP image." };
    if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Image is larger than 5 MB." };
    // Check the file really is an image (magic bytes), not just its declared type.
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isJpg = head[0] === 0xff && head[1] === 0xd8;
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isWebp = String.fromCharCode(...head.slice(0, 4)) === "RIFF" && String.fromCharCode(...head.slice(8, 12)) === "WEBP";
    if (!isJpg && !isPng && !isWebp) return { ok: false, error: "That file is not a valid image." };
    const store = await adminStore();
    const url = await store.upload(`${folder}/${randomUUID()}.${ext}`, file, file.type);
    return { ok: true, data: url };
  } catch (e) {
    return fail(e);
  }
}

// ================================================================ translations helper

async function translateRow<T extends { tr?: Item["tr"] }>(
  kind: Translatable,
  next: T,
  prev: T | null,
  source: Lang,
  touched: Lang[],
) {
  const store = await adminStore();
  const r = await store.get("restaurant", 1);
  return applyTranslations(kind, next, prev, {
    source,
    touched: touched.filter(isLang),
    langs: r?.enabled_languages ?? ["en", "es"],
    glossary: r?.glossary ?? [],
  });
}

// ================================================================ categories

export async function saveCategoryAction(input: { category: Category; source: Lang; touched: Lang[] }): Promise<Result<Category>> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    const all = await store.list("categories");
    const isNew = !input.category.id || input.category.id === "new";
    const prev = isNew ? null : all.find((c) => c.id === input.category.id) ?? null;
    const { row, warning } = await translateRow("category", structuredClone(input.category), prev, input.source, input.touched);
    const name = row.name[input.source] || row.name.en || "category";
    const data = {
      name: row.name,
      description: row.description,
      image_url: row.image_url || null,
      visible: row.visible,
      hours_from: row.hours_from || null,
      hours_to: row.hours_to || null,
      tr: row.tr,
      slug: prev?.slug ?? uniqueSlug(row.slug || name, all.map((c) => c.slug)),
    };
    const saved = isNew
      ? await store.insert("categories", { ...data, sort: all.length })
      : await store.update("categories", row.id, data);
    live();
    return { ok: true, data: saved, warning };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    const items = await store.list("items");
    if (items.some((i) => i.category_id === id)) return { ok: false, error: "Move or delete the dishes in this category first." };
    await store.remove("categories", id);
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderAction(table: "categories" | "items" | "banners", ids: string[]): Promise<Result> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    await Promise.all(ids.map((id, sort) => store.update(table, id, { sort })));
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleAction(
  table: "categories" | "items" | "banners" | "specials",
  id: string,
  field: "visible" | "featured" | "active",
  value: boolean,
): Promise<Result> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    await store.update(table, id, { [field]: value } as never);
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ================================================================ items

export async function saveItemAction(input: { item: Item; source: Lang; touched: Lang[] }): Promise<Result<Item>> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    const all = await store.list("items");
    const isNew = !input.item.id || input.item.id === "new";
    const prev = isNew ? null : all.find((i) => i.id === input.item.id) ?? null;
    const next = structuredClone(input.item);
    next.price = Math.max(0, Number(next.price) || 0);
    next.sizes = (next.sizes ?? []).filter((s) => s.label?.[input.source]?.trim()).map((s) => ({ ...s, price: Math.max(0, Number(s.price) || 0) }));
    if (next.sizes.length) next.price = Math.min(...next.sizes.map((s) => s.price));
    next.addons = (next.addons ?? []).filter((a) => a.name?.[input.source]?.trim()).map((a) => ({ ...a, price: Number(a.price) || 0 }));
    next.modifiers = (next.modifiers ?? [])
      .filter((g) => g.name?.[input.source]?.trim())
      .map((g) => ({
        ...g,
        min: Math.max(0, Number(g.min) || 0),
        max: Math.max(1, Number(g.max) || 1),
        options: (g.options ?? []).filter((o) => o.name?.[input.source]?.trim()).map((o) => ({ ...o, price: Number(o.price) || 0 })),
      }));
    next.photos = (next.photos ?? []).filter(Boolean).slice(0, 5);
    const { row, warning } = await translateRow("item", next, prev, input.source, input.touched);
    const name = row.name[input.source] || row.name.en || "dish";
    const data: Partial<Item> = {
      category_id: row.category_id,
      name: row.name,
      description: row.description,
      price: row.price,
      sizes: row.sizes,
      photos: row.photos,
      allergens: row.allergens,
      allergens_set: row.allergens_set,
      tags: row.tags,
      modifiers: row.modifiers,
      addons: row.addons,
      visible: row.visible,
      sold_out: row.sold_out,
      featured: row.featured,
      tr: row.tr,
      slug: prev?.slug ?? uniqueSlug(name, all.map((i) => i.slug)),
    };
    let saved: Item;
    if (isNew) {
      const sort = all.filter((i) => i.category_id === row.category_id).length;
      saved = await store.insert("items", { ...data, sort });
    } else {
      if (prev && prev.category_id !== row.category_id) {
        data.sort = all.filter((i) => i.category_id === row.category_id).length;
      }
      saved = await store.update("items", row.id, data);
    }
    live();
    return { ok: true, data: saved, warning };
  } catch (e) {
    return fail(e);
  }
}

export async function duplicateItemAction(id: string): Promise<Result<Item>> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    const all = await store.list("items");
    const src = all.find((i) => i.id === id);
    if (!src) return { ok: false, error: "Not found" };
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = src as Item & { created_at?: string };
    void _id; void _c; void _u;
    const copy: Partial<Item> = {
      ...rest,
      name: Object.fromEntries(Object.entries(src.name).map(([k, v]) => [k, `${v} (copy)`])),
      slug: uniqueSlug(`${src.name.en || src.slug}-copy`, all.map((i) => i.slug)),
      visible: false,
      sort: src.sort + 1,
    };
    const saved = await store.insert("items", copy);
    live();
    return { ok: true, data: saved };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteItemAction(id: string): Promise<Result> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    for (const s of await store.list("specials")) if (s.item_id === id) await store.remove("specials", s.id);
    await store.remove("items", id);
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Staff, managers and owners can mark dishes sold out. */
export async function setSoldOutAction(id: string, soldOut: boolean): Promise<Result> {
  try {
    await requireRole(["owner", "manager", "staff"]);
    const store = await adminStore();
    await store.update("items", id, { sold_out: soldOut });
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ================================================================ specials & banners

export async function saveSpecialAction(input: { special: Special; source: Lang; touched: Lang[] }): Promise<Result<Special>> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    const isNew = !input.special.id || input.special.id === "new";
    const prev = isNew ? null : await store.get("specials", input.special.id);
    const { row, warning } = await translateRow("special", structuredClone(input.special), prev, input.source, input.touched);
    const data: Partial<Special> = {
      item_id: row.item_id,
      days: row.days,
      starts_on: row.starts_on || null,
      ends_on: row.ends_on || null,
      special_price: row.special_price === null || (row.special_price as unknown) === "" ? null : Number(row.special_price),
      note: row.note,
      active: row.active,
      tr: row.tr,
    };
    const saved = isNew ? await store.insert("specials", data) : await store.update("specials", row.id, data);
    live();
    return { ok: true, data: saved, warning };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteRowAction(table: "specials" | "banners" | "tables", id: string): Promise<Result> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    await store.remove(table, id);
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveBannerAction(input: { banner: Banner; source: Lang; touched: Lang[] }): Promise<Result<Banner>> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    const isNew = !input.banner.id || input.banner.id === "new";
    const prev = isNew ? null : await store.get("banners", input.banner.id);
    const { row, warning } = await translateRow("banner", structuredClone(input.banner), prev, input.source, input.touched);
    if (!row.image_url) return { ok: false, error: "Add an image for the slide." };
    const data: Partial<Banner> = {
      image_url: row.image_url,
      title: row.title,
      subtitle: row.subtitle,
      link_type: row.link_type,
      link_ref: row.link_ref ?? "",
      active: row.active,
      starts_on: row.starts_on || null,
      ends_on: row.ends_on || null,
      tr: row.tr,
    };
    const count = (await store.list("banners")).length;
    const saved = isNew ? await store.insert("banners", { ...data, sort: count }) : await store.update("banners", row.id, data);
    live();
    return { ok: true, data: saved, warning };
  } catch (e) {
    return fail(e);
  }
}

// ================================================================ settings & rates

export async function saveSettingsAction(input: { restaurant: Restaurant; source: Lang; touched: Lang[] }): Promise<Result<Restaurant>> {
  try {
    await requireRole(OWNER);
    const store = await adminStore();
    const prev = await store.get("restaurant", 1);
    const r = structuredClone(input.restaurant);
    r.enabled_languages = r.enabled_languages.filter(isLang);
    if (!r.enabled_languages.length) r.enabled_languages = ["en"];
    if (!r.enabled_languages.includes(r.default_language)) r.default_language = r.enabled_languages[0];
    if (!r.enabled_currencies.includes(r.base_currency)) r.enabled_currencies = [r.base_currency, ...r.enabled_currencies];
    const { row, warning } = await applyTranslations("restaurant", r, prev, {
      source: input.source,
      touched: input.touched,
      langs: r.enabled_languages,
      glossary: r.glossary,
    });
    const { id: _id, updated_at: _u, ...data } = row;
    void _id; void _u;
    const saved = await store.update("restaurant", 1, data);
    // make sure every enabled currency has a rate row
    const rates = await store.list("rates");
    const missing = saved.enabled_currencies.filter((c) => c !== saved.base_currency && !rates.some((x) => x.currency === c));
    if (missing.length) await store.upsert("rates", missing.map((currency) => ({ currency, rate: null, manual_rate: null, updated_at: null })));
    live();
    return { ok: true, data: saved, warning };
  } catch (e) {
    return fail(e);
  }
}

export async function saveManualRatesAction(manual: Record<string, number | null>): Promise<Result> {
  try {
    await requireRole(OWNER);
    const store = await adminStore();
    const rates = await store.list("rates");
    await store.upsert(
      "rates",
      Object.entries(manual).map(([currency, v]) => {
        const r = rates.find((x) => x.currency === currency);
        return { currency, rate: r?.rate ?? null, updated_at: r?.updated_at ?? null, manual_rate: v && v > 0 ? v : null };
      }),
    );
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function refreshRatesAction(): Promise<Result> {
  try {
    await requireRole(OWNER);
    const store = systemStore();
    if (!store) return { ok: false, error: "SUPABASE_SECRET_KEY is needed to save fetched rates." };
    const r = await refreshRates(store);
    if (r.error) return { ok: false, error: r.error };
    live();
    return { ok: true, data: r.updated };
  } catch (e) {
    return fail(e);
  }
}

// ================================================================ QR tables

export async function createTableAction(label: string): Promise<Result<TableQR>> {
  try {
    await requireRole(EDITORS);
    const store = await adminStore();
    const all = await store.list("tables");
    const clean = label.trim().slice(0, 40) || `Table ${all.length}`;
    const code = uniqueSlug(clean.toLowerCase().replace(/^table\s*/i, "t"), all.map((t) => t.code));
    const saved = await store.insert("tables", { label: clean, code, scans: 0 });
    return { ok: true, data: saved };
  } catch (e) {
    return fail(e);
  }
}

// ================================================================ team (owner)

export async function inviteUserAction(email: string, role: Role): Promise<Result> {
  try {
    await requireRole(OWNER);
    const svc = serviceClient();
    if (!svc) return { ok: false, error: "Team invites need SUPABASE_SECRET_KEY." };
    const clean = email.trim().toLowerCase();
    const existing = await findUserByEmail(svc, clean);
    if (existing) {
      // Already has an account in this project (maybe from another app): just grant menu access.
      await setMenuRole(svc, existing.id, clean, role);
      return { ok: true, warning: `${clean} already had an account, so no email was sent. They can sign in with their existing password.` };
    }
    const { data, error } = await svc.auth.admin.inviteUserByEmail(clean, {
      redirectTo: `${SITE_URL}/admin/auth/callback?next=/admin/reset`,
    });
    if (error) return fail(error);
    if (data.user) await setMenuRole(svc, data.user.id, clean, role);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setRoleAction(userId: string, role: Role): Promise<Result> {
  try {
    const me = await requireRole(OWNER);
    if (userId === me.userId) return { ok: false, error: "You can't change your own role." };
    const store = await adminStore();
    await store.update("profiles", userId, { role });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function removeUserAction(userId: string): Promise<Result> {
  try {
    const me = await requireRole(OWNER);
    if (userId === me.userId) return { ok: false, error: "You can't remove yourself." };
    const svc = serviceClient();
    if (!svc) return { ok: false, error: "Needs SUPABASE_SECRET_KEY." };
    // Only remove menu access; never delete the account (it may be used by another app).
    await setMenuRole(svc, userId, undefined, null);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function whoAmI() {
  return getSession();
}
