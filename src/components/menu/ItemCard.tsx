"use client";

import Image from "next/image";
import Link from "next/link";
import { dict, tx } from "@/lib/i18n";
import { tagByCode } from "@/lib/catalog";
import type { Item, Lang } from "@/lib/types";
import { itemPrice } from "@/lib/price";
import { Price } from "./prefs";

export function TagIcons({ tags, lang }: { tags: string[]; lang: Lang }) {
  const shown = tags.filter((t) => tagByCode[t]);
  if (!shown.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((t) => (
        <span
          key={t}
          title={tx(tagByCode[t].name, lang)}
          className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-ink-soft"
        >
          <span aria-hidden>{tagByCode[t].icon}</span>
          <span>{tx(tagByCode[t].name, lang)}</span>
        </span>
      ))}
    </span>
  );
}

export function ItemCard({
  item,
  lang,
  specialPrice,
  priority = false,
}: {
  item: Item;
  lang: Lang;
  specialPrice?: number | null;
  priority?: boolean;
}) {
  const t = dict(lang);
  const name = tx(item.name, lang);
  const desc = tx(item.description, lang);
  const photo = item.photos?.[0];
  const p = itemPrice(item);
  return (
    <Link
      href={`/${lang}/i/${item.slug}`}
      className={`card group flex gap-3 p-3 transition active:scale-[0.99] ${item.sold_out ? "opacity-70" : ""}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <h3 className="font-display text-[1.07rem] font-semibold leading-snug text-ink">{name}</h3>
          {item.featured && !item.sold_out ? (
            <span className="mt-0.5 shrink-0 rounded-full bg-basil/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-basil">
              {t.featured}
            </span>
          ) : null}
        </div>
        {desc ? <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-soft">{desc}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2">
          {specialPrice != null ? (
            <span className="flex items-baseline gap-2">
              <Price amount={specialPrice} className="text-base font-bold text-pomodoro" />
              <Price amount={p.amount} className="text-sm text-ink-soft line-through" />
            </span>
          ) : (
            <Price amount={p.amount} from={p.from} className="text-base font-bold text-ink" />
          )}
          {item.sold_out ? (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              {t.soldOut}
            </span>
          ) : null}
          <TagIcons tags={item.tags} lang={lang} />
        </div>
      </div>
      {photo ? (
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-crust sm:size-28">
          <Image
            src={photo}
            alt={name}
            fill
            sizes="112px"
            priority={priority}
            className={`object-cover transition group-hover:scale-105 ${item.sold_out ? "grayscale" : ""}`}
          />
        </div>
      ) : null}
    </Link>
  );
}
