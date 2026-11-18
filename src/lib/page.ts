import "server-only";
import { notFound } from "next/navigation";
import { dict, isLang, tx } from "./i18n";
import { getMenu, todaysSpecials } from "./menu";
import type { Lang } from "./types";

export async function loadPage(params: Promise<{ lang: string }>) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const menu = await getMenu();
  const lang: Lang = menu.restaurant.enabled_languages.includes(raw) ? raw : menu.restaurant.default_language;
  const specials = todaysSpecials(menu);
  const chips = menu.categories.map((c) => ({ slug: c.slug, name: tx(c.name, lang) }));
  const specialPrices = Object.fromEntries(specials.map((s) => [s.item.id, s.special.special_price]));
  return { lang, menu, t: dict(lang), specials, chips, specialPrices };
}

export function hreflang(path: string, langs: Lang[]) {
  return Object.fromEntries(langs.map((l) => [l, `/${l}${path}`]));
}
