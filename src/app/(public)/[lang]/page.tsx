import Image from "next/image";
import Link from "next/link";
import { fmt, LANG_META, tx } from "@/lib/i18n";
import { loadPage } from "@/lib/page";
import { formatTime } from "@/lib/time";
import { BannerCarousel, type Slide } from "@/components/menu/BannerCarousel";
import { CategoryBar } from "@/components/menu/CategoryBar";
import { ItemCard } from "@/components/menu/ItemCard";
import { LangToggle } from "@/components/menu/switchers";
import { OpenStatus, Track } from "@/components/menu/client-bits";

export const revalidate = 60;

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, menu, t, specials, chips } = await loadPage(params);
  const { restaurant, categories, items } = menu;
  const loc = LANG_META[lang].locale;

  const slides: Slide[] = menu.banners.map((b) => {
    let href: string | null = null;
    if (b.link_type === "category" && categories.some((c) => c.slug === b.link_ref)) href = `/${lang}/c/${b.link_ref}`;
    if (b.link_type === "item" && items.some((i) => i.slug === b.link_ref)) href = `/${lang}/i/${b.link_ref}`;
    if (b.link_type === "url" && /^https?:\/\//.test(b.link_ref)) href = b.link_ref;
    return { id: b.id, image: b.image_url, title: tx(b.title, lang), subtitle: tx(b.subtitle, lang), href };
  });
  const featured = items.filter((i) => i.featured && !i.sold_out).slice(0, 10);
  const countBy = (id: string) => items.filter((i) => i.category_id === id).length;
  const social = Object.entries(restaurant.social ?? {}).filter(([, url]) => url);
  const whatsapp = restaurant.whatsapp?.replace(/[^\d]/g, "");

  return (
    <>
      <Track type="view_home" />
      <div className="flex flex-col items-center gap-3 pb-4 pt-4 text-center">
        <LangToggle langs={restaurant.enabled_languages} />
        <p className="max-w-md font-display text-lg italic text-ink-soft">{tx(restaurant.tagline, lang)}</p>
        <Link
          href={`/${lang}/search`}
          className="flex h-12 w-full items-center gap-3 rounded-full border border-line bg-white px-4 text-left text-ink-soft shadow-card"
        >
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          {t.searchPlaceholder}
        </Link>
      </div>

      <BannerCarousel slides={slides} lang={lang} />

      <div className="mt-4">
        <CategoryBar lang={lang} chips={chips} showSpecials={specials.length > 0} />
      </div>

      {specials.length ? (
        <section className="mt-6" aria-labelledby="specials-h">
          <div className="flex items-baseline justify-between">
            <h2 id="specials-h" className="font-display text-2xl font-semibold">⭐ {t.todaysSpecials}</h2>
            <Link href={`/${lang}/specials`} className="text-sm font-semibold text-pomodoro">{t.viewAll}</Link>
          </div>
          <ul className="mt-3 grid gap-3">
            {specials.map(({ item, special }) => (
              <li key={special.id}>
                {tx(special.note, lang) ? <p className="mb-1 text-sm font-semibold text-pomodoro">{tx(special.note, lang)}</p> : null}
                <ItemCard item={item} lang={lang} specialPrice={special.special_price} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {featured.length ? (
        <section className="mt-8" aria-labelledby="popular-h">
          <h2 id="popular-h" className="font-display text-2xl font-semibold">{t.featured}</h2>
          <ul className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {featured.map((item) => (
              <li key={item.id} className="w-40 shrink-0 snap-start">
                <Link href={`/${lang}/i/${item.slug}`} className="card block overflow-hidden">
                  <div className="relative aspect-square bg-crust">
                    {item.photos[0] ? (
                      <Image src={item.photos[0]} alt={tx(item.name, lang)} fill sizes="160px" className="object-cover" />
                    ) : (
                      <div className="gingham absolute inset-0" />
                    )}
                  </div>
                  <p className="line-clamp-2 p-2.5 text-sm font-semibold leading-snug">{tx(item.name, lang)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="cats-h">
        <h2 id="cats-h" className="font-display text-2xl font-semibold">{t.menu}</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link href={`/${lang}/c/${c.slug}`} className="card group block overflow-hidden">
                <div className="relative aspect-[4/3] bg-crust">
                  {c.image_url ? (
                    <Image src={c.image_url} alt="" fill sizes="(max-width: 640px) 50vw, 240px" priority={i < 2} className="object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="gingham absolute inset-0" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-display text-base font-semibold leading-tight">{tx(c.name, lang)}</h3>
                  <p className="mt-0.5 text-xs text-ink-soft">{fmt(t.items, { n: countBy(c.id) })}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-8 p-5" aria-labelledby="info-h">
        <h2 id="info-h" className="font-display text-2xl font-semibold">{t.info}</h2>
        <div className="mt-3">
          <OpenStatus hours={restaurant.hours} timeZone={restaurant.timezone} lang={lang} />
        </div>
        <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-ink-soft">{t.hours}</h3>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {restaurant.hours.map((h, i) => (
            <div key={i} className="contents">
              <dt className="font-semibold">
                {h.days.length > 1 && h.days.every((d, j) => j === 0 || d === h.days[j - 1] + 1)
                  ? `${t.daysShort[h.days[0]]}–${t.daysShort[h.days[h.days.length - 1]]}`
                  : h.days.map((d) => t.daysShort[d]).join(", ")}
              </dt>
              <dd>{formatTime(h.open, loc)} – {formatTime(h.close, loc)}</dd>
            </div>
          ))}
        </dl>
        {restaurant.address ? (
          <>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-ink-soft">{t.address}</h3>
            <p className="mt-1 text-sm">{restaurant.address}</p>
          </>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {restaurant.map_url ? (
            <a href={restaurant.map_url} target="_blank" rel="noopener noreferrer" className="btn-ghost">📍 {t.directions}</a>
          ) : null}
          {restaurant.phone ? (
            <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`} className="btn-ghost">📞 {t.call}</a>
          ) : null}
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">💬 {t.whatsapp}</a>
          ) : null}
          {restaurant.website ? (
            <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="btn-ghost">🌐 {t.website}</a>
          ) : null}
        </div>
        {social.length ? (
          <>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-ink-soft">{t.followUs}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {social.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost capitalize">{name}</a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </>
  );
}
