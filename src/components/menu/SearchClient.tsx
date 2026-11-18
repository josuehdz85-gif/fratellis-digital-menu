"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dict, fmt, tx } from "@/lib/i18n";
import type { Item, Lang } from "@/lib/types";
import { ItemCard } from "./ItemCard";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function SearchClient({ items, lang, categoryNames }: { items: Item[]; lang: Lang; categoryNames: Record<string, string> }) {
  const t = dict(lang);
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  const index = useMemo(
    () =>
      items.map((i) => ({
        item: i,
        // search the chosen language first, plus the other languages so "lasagna" finds "lasaña"
        hay: norm([tx(i.name, lang), tx(i.description, lang), i.name.en, i.name.es, categoryNames[i.category_id] ?? ""].join(" ")),
        name: norm(tx(i.name, lang)),
      })),
    [items, lang, categoryNames],
  );

  const terms = norm(q).split(/\s+/).filter(Boolean);
  const results = terms.length
    ? index
        .filter((r) => terms.every((term) => r.hay.includes(term)))
        .sort((a, b) => Number(b.name.includes(terms[0])) - Number(a.name.includes(terms[0])))
        .map((r) => r.item)
    : [];

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          router.replace(`?q=${encodeURIComponent(q)}`);
          input.current?.blur();
        }}
      >
        <label htmlFor="q" className="sr-only">{t.search}</label>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">🔍</span>
          <input
            ref={input}
            id="q"
            type="search"
            inputMode="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-12 w-full rounded-full border border-line bg-white pl-11 pr-4 text-base shadow-card focus:border-pomodoro focus:outline-none focus:ring-2 focus:ring-pomodoro/20"
          />
        </div>
      </form>
      <div aria-live="polite" className="mt-4">
        {!terms.length ? <p className="text-ink-soft">{t.searchHint}</p> : null}
        {terms.length && !results.length ? <p className="card p-6 text-center text-ink-soft">{fmt(t.searchNoResults, { q })}</p> : null}
        <ul className="grid gap-3 md:grid-cols-2">
          {results.slice(0, 60).map((item) => (
            <li key={item.id}>
              <ItemCard item={item} lang={lang} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
