import type { Metadata } from "next";
import { dict, isLang, tx } from "@/lib/i18n";
import { loadPage } from "@/lib/page";
import { CategoryBar } from "@/components/menu/CategoryBar";
import { ItemCard } from "@/components/menu/ItemCard";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? { title: dict(lang).dailySpecials } : {};
}

export default async function SpecialsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, t, chips, specials } = await loadPage(params);
  return (
    <>
      <CategoryBar lang={lang} chips={chips} active="__specials" showSpecials />
      <h1 className="pb-3 pt-5 font-display text-3xl font-semibold">⭐ {t.dailySpecials}</h1>
      {specials.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {specials.map(({ item, special }) => (
            <li key={special.id}>
              {tx(special.note, lang) ? <p className="mb-1 text-sm font-semibold text-pomodoro">{tx(special.note, lang)}</p> : null}
              <ItemCard item={item} lang={lang} specialPrice={special.special_price} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="card p-6 text-center text-ink-soft">{t.noSpecials}</p>
      )}
    </>
  );
}
