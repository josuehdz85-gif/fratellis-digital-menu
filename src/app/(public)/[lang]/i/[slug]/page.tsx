import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dict, fmt, isLang, tx } from "@/lib/i18n";
import { allergenByCode, tagByCode } from "@/lib/catalog";
import { getMenu } from "@/lib/menu";
import { hreflang, loadPage } from "@/lib/page";
import { Price } from "@/components/menu/prefs";
import { ApproxNote } from "@/components/menu/switchers";
import { PhotoCarousel } from "@/components/menu/PhotoCarousel";
import { itemPrice } from "@/lib/price";
import { Track } from "@/components/menu/client-bits";

export const revalidate = 60;

type Params = Promise<{ lang: string; slug: string }>;

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  try {
    const menu = await getMenu();
    return menu.items.map((x) => ({ lang: params.lang, slug: x.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const menu = await getMenu();
  const item = menu.items.find((i) => i.slug === slug);
  if (!item) return {};
  return {
    title: tx(item.name, lang),
    description: tx(item.description, lang) || undefined,
    alternates: { canonical: `/${lang}/i/${slug}`, languages: hreflang(`/i/${slug}`, menu.restaurant.enabled_languages) },
    openGraph: { images: item.photos.slice(0, 1) },
  };
}

export default async function ItemPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { lang, menu, specialPrices } = await loadPage(params);
  const item = menu.items.find((i) => i.slug === slug);
  if (!item) notFound();
  const t = dict(lang);
  const cat = menu.categories.find((c) => c.id === item.category_id);
  const name = tx(item.name, lang);
  const p = itemPrice(item);
  const special = specialPrices[item.id];

  return (
    <article className="pt-3">
      <Track type="view_item" refId={item.slug} />
      {cat ? (
        <Link href={`/${lang}/c/${cat.slug}`} className="tap -ml-2 mb-2 inline-flex items-center gap-1 px-2 text-sm font-semibold text-pomodoro">
          <span aria-hidden>←</span> {tx(cat.name, lang)}
        </Link>
      ) : null}

      <div className="relative">
        <PhotoCarousel photos={item.photos} alt={name} lang={lang} soldOut={item.sold_out} />
        {item.sold_out ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-sm font-bold uppercase tracking-wide text-white">
            {t.soldOut}
          </span>
        ) : null}
      </div>

      <header className="mt-4">
        <h1 className="font-display text-3xl font-semibold leading-tight">{name}</h1>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          {special != null && special !== undefined ? (
            <>
              <Price amount={special} className="text-2xl font-bold text-pomodoro" />
              <Price amount={p.amount} from={p.from} className="text-lg text-ink-soft line-through" />
              <span className="rounded-full bg-pomodoro/10 px-2 py-0.5 text-xs font-bold text-pomodoro">{t.specialPrice}</span>
            </>
          ) : !item.sizes.length ? (
            <Price amount={p.amount} className="text-2xl font-bold" />
          ) : null}
        </div>
        <ApproxNote className="mt-1" />
      </header>

      {tx(item.description, lang) ? <p className="mt-3 text-lg leading-relaxed text-ink">{tx(item.description, lang)}</p> : null}

      {item.tags.length ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={t.dietary}>
          {item.tags.filter((c) => tagByCode[c]).map((c) => (
            <li key={c} className="inline-flex items-center gap-1.5 rounded-full bg-basil/10 px-3 py-1 text-sm font-semibold text-basil">
              <span aria-hidden>{tagByCode[c].icon}</span>
              {tx(tagByCode[c].name, lang)}
            </li>
          ))}
        </ul>
      ) : null}

      {item.sizes.length ? (
        <section className="card mt-5 p-4" aria-labelledby="sizes-h">
          <h2 id="sizes-h" className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t.sizes}</h2>
          <ul className="mt-2 divide-y divide-line">
            {item.sizes.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <span className="font-semibold">{tx(s.label, lang)}</span>
                <Price amount={s.price} className="font-bold" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {item.modifiers.map((g) => (
        <section key={g.id} className="card mt-4 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-semibold">{tx(g.name, lang)}</h2>
            <span className="text-xs font-semibold text-ink-soft">
              {g.required ? t.required : t.optional} · {g.max <= 1 ? t.pickOne : fmt(t.pickUpTo, { n: g.max })}
            </span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {g.options.map((o) => (
              <li key={o.id} className="rounded-full border border-line bg-cream px-3 py-1.5 text-sm">
                {tx(o.name, lang)}
                {o.price ? (
                  <span className="ml-1 font-semibold text-ink-soft">
                    +<Price amount={o.price} />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {item.addons.length ? (
        <section className="card mt-4 p-4" aria-labelledby="addons-h">
          <h2 id="addons-h" className="font-semibold">{t.addons}</h2>
          <ul className="mt-2 divide-y divide-line">
            {item.addons.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{tx(a.name, lang)}</span>
                <span className="shrink-0 font-semibold">+<Price amount={a.price} /></span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-4 rounded-card border border-pomodoro/20 bg-pomodoro/5 p-4" aria-labelledby="allergens-h">
        <h2 id="allergens-h" className="font-semibold">⚠️ {t.allergens}</h2>
        {!item.allergens_set ? (
          <p className="mt-1 text-sm">{t.allergensUnknown}</p>
        ) : item.allergens.length ? (
          <>
            <p className="mt-1 text-sm text-ink-soft">{t.contains}:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {item.allergens.filter((a) => allergenByCode[a]).map((a) => (
                <li key={a} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold">
                  <span aria-hidden>{allergenByCode[a].icon}</span>
                  {tx(allergenByCode[a].name, lang)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-sm">{t.noAllergensListed}</p>
        )}
        <p className="mt-2 text-xs text-ink-soft">{t.allergyWarning}</p>
      </section>

      {item.modifiers.length || item.addons.length || item.sizes.length ? (
        <p className="mt-4 text-center text-sm text-ink-soft">{t.infoOnly}</p>
      ) : null}
    </article>
  );
}
