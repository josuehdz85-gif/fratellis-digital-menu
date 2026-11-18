"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export interface CategoryChip {
  slug: string;
  name: string;
}

/** Sticky, horizontally scrolling category bar. */
export function CategoryBar({
  lang,
  chips,
  active,
  showSpecials,
}: {
  lang: Lang;
  chips: CategoryChip[];
  active?: string;
  showSpecials?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = dict(lang);

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>("[aria-current='page']");
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const all = showSpecials ? [{ slug: "__specials", name: `⭐ ${t.dailySpecials}` }, ...chips] : chips;

  return (
    <nav
      aria-label={t.categories}
      className="sticky top-[60px] z-20 -mx-4 border-b border-line bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80"
    >
      <div ref={ref} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
        {all.map((c) => {
          const href = c.slug === "__specials" ? `/${lang}/specials` : `/${lang}/c/${c.slug}`;
          const isActive = active === c.slug;
          return (
            <Link
              key={c.slug}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition ${
                isActive
                  ? "border-pomodoro bg-pomodoro text-white"
                  : "border-line bg-white text-ink hover:border-pomodoro/40"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
