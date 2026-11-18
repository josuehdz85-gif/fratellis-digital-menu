import type { Metadata } from "next";
import { Suspense } from "react";
import { dict, isLang, tx } from "@/lib/i18n";
import { loadPage } from "@/lib/page";
import { SearchClient } from "@/components/menu/SearchClient";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? { title: dict(lang).search, robots: { index: false } } : {};
}

export default async function SearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t, menu } = await loadPage(params);
  const categoryNames = Object.fromEntries(menu.categories.map((c) => [c.id, tx(c.name, lang)]));
  return (
    <div className="pt-5">
      <h1 className="mb-4 font-display text-3xl font-semibold">{t.search}</h1>
      <Suspense>
        <SearchClient items={menu.items} lang={lang} categoryNames={categoryNames} />
      </Suspense>
    </div>
  );
}
