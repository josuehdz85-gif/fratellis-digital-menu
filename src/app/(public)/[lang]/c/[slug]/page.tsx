import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tx } from "@/lib/i18n";
import { getMenu } from "@/lib/menu";
import { hreflang, loadPage } from "@/lib/page";
import { isLang } from "@/lib/i18n";
import { CategoryBar } from "@/components/menu/CategoryBar";
import { ItemBrowser } from "@/components/menu/ItemBrowser";
import { HoursNote, Track } from "@/components/menu/client-bits";

export const revalidate = 60;

type Params = Promise<{ lang: string; slug: string }>;

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  try {
    const menu = await getMenu();
    return menu.categories.map((x) => ({ lang: params.lang, slug: x.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const menu = await getMenu();
  const cat = menu.categories.find((c) => c.slug === slug);
  if (!cat) return {};
  return {
    title: tx(cat.name, lang),
    description: tx(cat.description, lang),
    alternates: { canonical: `/${lang}/c/${slug}`, languages: hreflang(`/c/${slug}`, menu.restaurant.enabled_languages) },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { lang, menu, chips, specials, specialPrices } = await loadPage(params);
  const cat = menu.categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const items = menu.items.filter((i) => i.category_id === cat.id);

  return (
    <>
      <Track type="view_category" refId={cat.slug} />
      <CategoryBar lang={lang} chips={chips} active={cat.slug} showSpecials={specials.length > 0} />
      <header className="pb-3 pt-5">
        <h1 className="font-display text-3xl font-semibold">{tx(cat.name, lang)}</h1>
        {tx(cat.description, lang) ? <p className="mt-1 text-ink-soft">{tx(cat.description, lang)}</p> : null}
        {cat.hours_from && cat.hours_to ? (
          <HoursNote from={cat.hours_from} to={cat.hours_to} timeZone={menu.restaurant.timezone} lang={lang} />
        ) : null}
      </header>
      <ItemBrowser items={items} lang={lang} allergenStandard={menu.restaurant.allergen_standard} specialPrices={specialPrices} />
    </>
  );
}
