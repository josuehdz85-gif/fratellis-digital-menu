"use client";

import { useEffect, useMemo, useState } from "react";
import { ALLERGENS, FILTER_TAGS, tagByCode } from "@/lib/catalog";
import { dict, fmt, tx } from "@/lib/i18n";
import type { Item, Lang } from "@/lib/types";
import { ItemCard } from "./ItemCard";

const ALLERGY_KEY = "fm_allergies";

/** Category item list with dietary filters and "hide my allergens". */
export function ItemBrowser({
  items,
  lang,
  allergenStandard,
  specialPrices,
}: {
  items: Item[];
  lang: Lang;
  allergenStandard: "us9" | "eu14";
  specialPrices: Record<string, number | null>;
}) {
  const t = dict(lang);
  const [tags, setTags] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ALLERGY_KEY) ?? "[]");
      if (Array.isArray(saved)) setAllergies(saved.filter((x) => typeof x === "string"));
    } catch {
      /* ignore */
    }
  }, []);

  const saveAllergies = (next: string[]) => {
    setAllergies(next);
    try {
      localStorage.setItem(ALLERGY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const availableTags = useMemo(
    () => FILTER_TAGS.filter((code) => items.some((i) => i.tags.includes(code))),
    [items],
  );
  const allergenOptions = ALLERGENS.filter((a) => (allergenStandard === "eu14" ? a.eu14 : a.us9));

  const shown = items.filter((i) => {
    if (tags.length && !tags.every((tag) => i.tags.includes(tag))) return false;
    if (allergies.length) {
      if (!i.allergens_set) return false; // unknown allergens: hide to be safe
      if (i.allergens.some((a) => allergies.includes(a))) return false;
    }
    return true;
  });
  const hidden = items.length - shown.length;
  const active = tags.length + allergies.length;

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t.filterDiet}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="allergy-panel"
          className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${
            allergies.length ? "border-pomodoro bg-pomodoro/10 text-pomodoro" : "border-line bg-white text-ink"
          }`}
        >
          <span aria-hidden>⚠️</span> {t.allergens}
          {allergies.length ? <span className="rounded-full bg-pomodoro px-1.5 text-xs text-white">{allergies.length}</span> : null}
        </button>
        {availableTags.map((code) => {
          const on = tags.includes(code);
          return (
            <button
              key={code}
              type="button"
              aria-pressed={on}
              onClick={() => setTags(on ? tags.filter((x) => x !== code) : [...tags, code])}
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${
                on ? "border-basil bg-basil text-white" : "border-line bg-white text-ink"
              }`}
            >
              <span aria-hidden>{tagByCode[code].icon}</span> {tx(tagByCode[code].name, lang)}
            </button>
          );
        })}
        {active ? (
          <button
            type="button"
            onClick={() => {
              setTags([]);
              saveAllergies([]);
            }}
            className="flex h-10 shrink-0 items-center px-3 text-sm font-semibold text-pomodoro underline"
          >
            {t.clearFilters}
          </button>
        ) : null}
      </div>

      {open ? (
        <fieldset id="allergy-panel" className="card mt-3 p-4">
          <legend className="sr-only">{t.filterAllergens}</legend>
          <p className="font-semibold">{t.filterAllergens}</p>
          <p className="mt-1 text-xs text-ink-soft">{t.filterAllergensHelp}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {allergenOptions.map((a) => {
              const on = allergies.includes(a.code);
              return (
                <label
                  key={a.code}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${
                    on ? "border-pomodoro bg-pomodoro/5" : "border-line"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => saveAllergies(on ? allergies.filter((x) => x !== a.code) : [...allergies, a.code])}
                    className="size-4 accent-pomodoro"
                  />
                  <span aria-hidden>{a.icon}</span>
                  {tx(a.name, lang)}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {hidden > 0 ? (
        <p className="mt-3 text-sm text-ink-soft" role="status">
          {fmt(t.hiddenByFilter, { n: hidden })}
        </p>
      ) : null}

      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {shown.map((item, i) => (
          <li key={item.id}>
            <ItemCard item={item} lang={lang} priority={i < 2} specialPrice={specialPrices[item.id]} />
          </li>
        ))}
      </ul>
      {!shown.length ? <p className="card mt-3 p-6 text-center text-ink-soft">{t.noMatches}</p> : null}
    </div>
  );
}
