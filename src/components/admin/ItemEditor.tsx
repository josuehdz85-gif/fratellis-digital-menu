"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { allergenList, DIETARY_TAGS } from "@/lib/catalog";
import { tx } from "@/lib/i18n";
import type { Addon, Category, I18n, Item, Lang, ModifierGroup, Restaurant } from "@/lib/types";
import { saveItemAction } from "@/app/admin/actions";
import { PhotoUploader } from "./PhotoUploader";
import { LangTabs, PageTitle, Toggle, TrInput, useRun, useTr } from "./ui";

const uid = () => Math.random().toString(36).slice(2, 9);


function MoneyInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">$</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="field pl-7"
          aria-label={label}
        />
      </div>
    </label>
  );
}

export function ItemEditor({ initial, categories, restaurant }: { initial: Item; categories: Category[]; restaurant: Restaurant }) {
  const router = useRouter();
  const { run, busy } = useRun();
  const [item, setItem] = useState<Item>(initial);
  const { tr, setTr, touch } = useTr(restaurant.enabled_languages, initial.tr, restaurant.default_language);
  const set = <K extends keyof Item>(k: K, v: Item[K]) => setItem((i) => ({ ...i, [k]: v }));
  const isNew = item.id === "new";

  const save = async () => {
    if (!item.name[tr.source]?.trim()) {
      alert(`Add the dish name in ${tr.source.toUpperCase()} first.`);
      return;
    }
    const r = await run(() => saveItemAction({ item, source: tr.source, touched: tr.touched }), "Saved — live on the menu");
    if (r?.ok && r.data) {
      setItem(r.data);
      setTr((s) => ({ ...s, touched: [], status: r.data!.tr.status }));
      if (isNew) router.replace(`/admin/items/${r.data.id}`);
      router.refresh();
    }
  };

  const updateGroup = (gid: string, patch: Partial<ModifierGroup>) =>
    set("modifiers", item.modifiers.map((g) => (g.id === gid ? { ...g, ...patch } : g)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <PageTitle title={isNew ? "New dish" : tx(item.name, tr.source) || "Edit dish"}>
        <Link href={`/admin/menu?category=${item.category_id}`} className="btn-ghost">Back</Link>
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </PageTitle>

      <LangTabs tr={tr} setTr={setTr} />

      <section className="card space-y-4 p-4">
        <TrInput label="Name" value={item.name} onChange={(v) => set("name", v)} tr={tr} touch={touch} required />
        <TrInput label="Description" value={item.description} onChange={(v) => set("description", v)} tr={tr} touch={touch} multiline />
        <label className="block">
          <span className="label">Category</span>
          <select className="field" value={item.category_id} onChange={(e) => set("category_id", e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{tx(c.name, "en")}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-semibold"><Toggle checked={item.visible} onChange={(v) => set("visible", v)} label="Visible" /> Visible on menu</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><Toggle checked={item.sold_out} onChange={(v) => set("sold_out", v)} label="Sold out" /> Sold out</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><Toggle checked={item.featured} onChange={(v) => set("featured", v)} label="Featured" /> Featured (Popular)</label>
        </div>
      </section>

      <section className="card p-4">
        <PhotoUploader photos={item.photos} onChange={(p) => set("photos", p)} />
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Price ({restaurant.base_currency})</h2>
        {item.sizes.length === 0 ? (
          <div className="max-w-xs">
            <MoneyInput value={item.price} onChange={(n) => set("price", n)} label="Price" />
          </div>
        ) : null}
        {item.sizes.map((s, i) => (
          <div key={s.id} className="grid grid-cols-[1fr_8rem_auto] items-center gap-2">
            <TrInput value={s.label} onChange={(v) => set("sizes", item.sizes.map((x) => (x.id === s.id ? { ...x, label: v } : x)))} tr={tr} touch={touch} placeholder={`Size ${i + 1}, e.g. Large`} />
            <MoneyInput value={s.price} onChange={(n) => set("sizes", item.sizes.map((x) => (x.id === s.id ? { ...x, price: n } : x)))} label="Size price" />
            <button type="button" className="tap text-ink-soft" aria-label="Remove size" onClick={() => set("sizes", item.sizes.filter((x) => x.id !== s.id))}>✕</button>
          </div>
        ))}
        <button type="button" className="btn-ghost" onClick={() => set("sizes", [...item.sizes, { id: uid(), label: {}, price: item.price }])}>
          ＋ {item.sizes.length ? "Add size" : "Use sizes (e.g. Medium / Large)"}
        </button>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Dietary tags</h2>
        <div className="flex flex-wrap gap-2">
          {DIETARY_TAGS.map((t) => {
            const on = item.tags.includes(t.code);
            return (
              <button
                key={t.code}
                type="button"
                aria-pressed={on}
                onClick={() => set("tags", on ? item.tags.filter((x) => x !== t.code) : [...item.tags, t.code])}
                className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${on ? "border-basil bg-basil text-white" : "border-line bg-white"}`}
              >
                {t.icon} {tx(t.name, "en")}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Allergens ({restaurant.allergen_standard === "eu14" ? "EU 14" : "US top 9"})</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {allergenList(restaurant.allergen_standard).map((a) => {
            const on = item.allergens.includes(a.code);
            return (
              <label key={a.code} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm ${on ? "border-pomodoro bg-pomodoro/5" : "border-line"}`}>
                <input
                  type="checkbox"
                  checked={on}
                  className="size-4 accent-pomodoro"
                  onChange={() =>
                    setItem((i) => ({ ...i, allergens_set: true, allergens: on ? i.allergens.filter((x) => x !== a.code) : [...i.allergens, a.code] }))
                  }
                />
                {a.icon} {tx(a.name, "en")}
              </label>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-basil" checked={item.allergens_set} onChange={(e) => set("allergens_set", e.target.checked)} />
          Allergen info checked for this dish {item.allergens_set && item.allergens.length === 0 ? "(contains none of these)" : ""}
        </label>
        {!item.allergens_set ? <p className="text-xs text-amber-800">Until this is checked, diners see “Ask your server” and allergy filters hide this dish.</p> : null}
      </section>

      <section className="card space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Choices (modifiers)</h2>
          <button type="button" className="btn-ghost" onClick={() => set("modifiers", [...item.modifiers, { id: uid(), name: {}, required: true, min: 1, max: 1, options: [{ id: uid(), name: {}, price: 0 }] }])}>
            ＋ Group
          </button>
        </div>
        {item.modifiers.map((g) => (
          <div key={g.id} className="space-y-2 rounded-lg border border-line p-3">
            <div className="flex items-center gap-2">
              <div className="flex-1"><TrInput value={g.name} onChange={(v) => updateGroup(g.id, { name: v })} tr={tr} touch={touch} placeholder="Group name, e.g. Choice of pasta" /></div>
              <button type="button" className="tap text-ink-soft" aria-label="Remove group" onClick={() => set("modifiers", item.modifiers.filter((x) => x.id !== g.id))}>✕</button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2"><Toggle checked={g.required} onChange={(v) => updateGroup(g.id, { required: v, min: v ? Math.max(1, g.min) : 0 })} label="Required" /> Required</label>
              <label className="flex items-center gap-2">Pick up to <input type="number" min={1} value={g.max} onChange={(e) => updateGroup(g.id, { max: Number(e.target.value) })} className="field w-20 py-1.5" /></label>
            </div>
            {g.options.map((o) => (
              <div key={o.id} className="grid grid-cols-[1fr_7rem_auto] items-center gap-2">
                <TrInput value={o.name} onChange={(v: I18n) => updateGroup(g.id, { options: g.options.map((x) => (x.id === o.id ? { ...x, name: v } : x)) })} tr={tr} touch={touch} placeholder="Option, e.g. Penne" />
                <MoneyInput value={o.price} onChange={(n) => updateGroup(g.id, { options: g.options.map((x) => (x.id === o.id ? { ...x, price: n } : x)) })} label="Extra price" />
                <button type="button" className="tap text-ink-soft" aria-label="Remove option" onClick={() => updateGroup(g.id, { options: g.options.filter((x) => x.id !== o.id) })}>✕</button>
              </div>
            ))}
            <button type="button" className="text-sm font-semibold text-pomodoro" onClick={() => updateGroup(g.id, { options: [...g.options, { id: uid(), name: {}, price: 0 }] })}>＋ Option</button>
          </div>
        ))}
      </section>

      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Add-ons</h2>
          <button type="button" className="btn-ghost" onClick={() => set("addons", [...item.addons, { id: uid(), name: {}, price: 1 }])}>＋ Add-on</button>
        </div>
        {item.addons.map((a: Addon) => (
          <div key={a.id} className="grid grid-cols-[1fr_7rem_auto] items-center gap-2">
            <TrInput value={a.name} onChange={(v) => set("addons", item.addons.map((x) => (x.id === a.id ? { ...x, name: v } : x)))} tr={tr} touch={touch} placeholder="e.g. Extra cheese" />
            <MoneyInput value={a.price} onChange={(n) => set("addons", item.addons.map((x) => (x.id === a.id ? { ...x, price: n } : x)))} label="Add-on price" />
            <button type="button" className="tap text-ink-soft" aria-label="Remove add-on" onClick={() => set("addons", item.addons.filter((x) => x.id !== a.id))}>✕</button>
          </div>
        ))}
        {!item.addons.length ? <p className="text-sm text-ink-soft">None. Diners see add-ons for information only.</p> : null}
      </section>

      <div className="sticky bottom-16 z-10 flex justify-end md:bottom-4">
        <button className="btn-primary shadow-lg" disabled={busy}>{busy ? "Saving…" : "Save dish"}</button>
      </div>
    </form>
  );
}

export type { Lang };
