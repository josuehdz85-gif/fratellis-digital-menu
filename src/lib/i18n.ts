import { LANGS, type I18n, type Lang } from "./types";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";

export type Dict = typeof en;
const DICTS: Record<Lang, Dict> = { en, es };

export const LANG_META: Record<Lang, { label: string; flag: string; locale: string; short: string }> = {
  en: { label: "English", flag: "🇺🇸", locale: "en-US", short: "EN" },
  es: { label: "Español", flag: "🇲🇽", locale: "es-MX", short: "ES" },
};

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

export function dict(lang: Lang): Dict {
  return DICTS[lang] ?? DICTS.en;
}

/** Pick the text for a language, falling back to any language that has text. */
export function tx(value: I18n | null | undefined, lang: Lang, fallback: Lang = "en"): string {
  if (!value) return "";
  return value[lang] || value[fallback] || Object.values(value).find(Boolean) || "";
}

/** Replace {name} placeholders. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

/** Best match for an Accept-Language header among enabled languages. */
export function pickLang(header: string | null, enabled: Lang[], fallback: Lang): Lang {
  if (!header) return fallback;
  const prefs = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const p of prefs) if (isLang(p.tag) && enabled.includes(p.tag)) return p.tag;
  return fallback;
}
