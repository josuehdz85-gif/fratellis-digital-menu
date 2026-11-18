import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { I18n, Lang, TrMeta, TrStatus } from "./types";
import { LANG_META } from "./i18n";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export function translationProvider(): "claude" | "deepl" | null {
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.DEEPL_API_KEY) return "deepl";
  return null;
}

const SYSTEM = `You translate restaurant menu text for diners.
Rules:
- Translate each input string into the target language. Keep the same order and the same number of strings.
- Write natural, appetizing menu language a local diner would expect. Keep it short; do not add information.
- Keep every glossary term exactly as written (dish names such as "Alfredo" or "Calzone" stay in their original form). You may add a very short explanation in parentheses only if a term would be unclear.
- Keep prices, numbers, sizes, units, brand names and the restaurant's name unchanged.
- An empty string stays empty.`;

async function claudeTranslate(strings: string[], from: Lang, to: Lang, glossary: string[]): Promise<string[]> {
  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: { translations: { type: "array", items: { type: "string" } } },
          required: ["translations"],
          additionalProperties: false,
        },
      },
    },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          from: LANG_META[from].label,
          to: LANG_META[to].label,
          glossary,
          strings,
        }),
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("Translation was declined");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No translation returned");
  const parsed = JSON.parse(text.text) as { translations: string[] };
  if (!Array.isArray(parsed.translations) || parsed.translations.length !== strings.length) {
    throw new Error("Translation count mismatch");
  }
  return parsed.translations;
}

async function deeplTranslate(strings: string[], from: Lang, to: Lang): Promise<string[]> {
  const key = process.env.DEEPL_API_KEY!;
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: strings, source_lang: from.toUpperCase(), target_lang: to === "en" ? "EN-US" : to.toUpperCase() }),
  });
  if (!res.ok) throw new Error(`DeepL ${res.status}`);
  const json = (await res.json()) as { translations: { text: string }[] };
  return json.translations.map((t) => t.text);
}

export async function translateStrings(strings: string[], from: Lang, to: Lang, glossary: string[]): Promise<string[]> {
  if (!strings.length) return [];
  const provider = translationProvider();
  if (provider === "claude") return claudeTranslate(strings, from, to, glossary);
  if (provider === "deepl") return deeplTranslate(strings, from, to);
  throw new Error("No translation API key configured");
}

/** Every translatable field of a record, as live references that can be filled in place. */
export type Translatable = "item" | "category" | "banner" | "special" | "restaurant";

export function i18nRefs(kind: Translatable, row: Record<string, unknown>): I18n[] {
  const r = row as Record<string, unknown> & {
    sizes?: { label: I18n }[];
    modifiers?: { name: I18n; options: { name: I18n }[] }[];
    addons?: { name: I18n }[];
  };
  const ensure = (k: string) => (r[k] ??= {}) as I18n;
  switch (kind) {
    case "item":
      return [
        ensure("name"),
        ensure("description"),
        ...(r.sizes ?? []).map((s) => (s.label ??= {})),
        ...(r.modifiers ?? []).flatMap((g) => [(g.name ??= {}), ...(g.options ?? []).map((o) => (o.name ??= {}))]),
        ...(r.addons ?? []).map((a) => (a.name ??= {})),
      ];
    case "category":
      return [ensure("name"), ensure("description")];
    case "banner":
      return [ensure("title"), ensure("subtitle")];
    case "special":
      return [ensure("note")];
    case "restaurant":
      return [ensure("tagline")];
  }
}

export interface TranslateOptions {
  source: Lang;
  /** languages the owner edited by hand in this save */
  touched: Lang[];
  langs: Lang[];
  glossary: string[];
}

/**
 * Fills in translations for a record being saved and updates its per-language status.
 * - Languages edited by hand are locked ("edited").
 * - If the source text changes later, locked languages become "needs review" instead of being overwritten.
 * - Missing strings are always filled (machine translated, or copied from the source if no API key).
 */
export async function applyTranslations<T extends { tr?: TrMeta }>(
  kind: Translatable,
  next: T,
  prev: T | null,
  opts: TranslateOptions,
): Promise<{ row: T; warning?: string }> {
  const { source } = opts;
  const nextRefs = i18nRefs(kind, next as Record<string, unknown>);
  const prevRefs = prev ? i18nRefs(kind, structuredClone(prev) as Record<string, unknown>) : [];
  const srcOf = (refs: I18n[]) => JSON.stringify(refs.map((r) => (r[source] ?? "").trim()));
  const sourceChanged = !prev || srcOf(nextRefs) !== srcOf(prevRefs);
  const status: Partial<Record<Lang, TrStatus>> = { ...(prev?.tr?.source === source ? prev?.tr?.status : {}) };
  if (prev?.tr && prev.tr.source !== source) {
    // The owner switched the language they write in: keep earlier statuses for other languages.
    Object.assign(status, prev.tr.status);
  }
  status[source] = "source";
  let warning: string | undefined;

  for (const lang of opts.langs) {
    if (lang === source) continue;
    const locked = opts.touched.includes(lang) || status[lang] === "edited" || status[lang] === "review";

    // Reuse earlier translations of identical source strings.
    const memory = new Map<string, string>();
    prevRefs.forEach((r) => {
      if (r[source] && r[lang]) memory.set(r[source]!.trim(), r[lang]!);
    });

    const todo: I18n[] = [];
    for (const ref of nextRefs) {
      const src = (ref[source] ?? "").trim();
      if (!src) {
        if (!locked) ref[lang] = "";
        continue;
      }
      if (locked) {
        if (!ref[lang]) todo.push(ref);
        continue;
      }
      const remembered = memory.get(src);
      if (remembered && status[lang] !== "review") ref[lang] = remembered;
      else todo.push(ref);
    }

    if (opts.touched.includes(lang)) status[lang] = "edited";
    else if (locked) {
      if (sourceChanged) status[lang] = "review";
    } else status[lang] = "auto";

    if (todo.length) {
      try {
        const out = await translateStrings(todo.map((r) => r[source]!), source, lang, opts.glossary);
        todo.forEach((r, i) => (r[lang] = out[i]));
      } catch (e) {
        todo.forEach((r) => (r[lang] = r[source]));
        status[lang] = "review";
        warning = `Automatic translation to ${LANG_META[lang].label} failed (${(e as Error).message}). The text was copied and marked "needs review".`;
      }
    }
  }

  next.tr = { source, status };
  return { row: next, warning };
}
