import "../../globals.css";
import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bodoni, figtree } from "../../fonts";
import { dict, isLang, tx } from "@/lib/i18n";
import { getMenu } from "@/lib/menu";
import { SITE_URL } from "@/lib/config";
import { LANGS, type Lang } from "@/lib/types";
import { PrefsProvider } from "@/components/menu/prefs";
import { ApproxNote, HeaderSelectors } from "@/components/menu/switchers";
import { PwaBits } from "@/components/menu/client-bits";

export const revalidate = 60;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#b8262b",
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const { restaurant } = await getMenu();
  const title = `${dict(lang).menu} · ${restaurant.name}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${restaurant.name}` },
    description: tx(restaurant.tagline, lang),
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: restaurant.name, statusBarStyle: "default" },
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(restaurant.enabled_languages.map((l) => [l, `/${l}`])),
    },
    openGraph: { title, siteName: restaurant.name, images: restaurant.logo_url ? [restaurant.logo_url] : [] },
  };
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const menu = await getMenu();
  const { restaurant } = menu;
  const lang: Lang = restaurant.enabled_languages.includes(raw) ? raw : restaurant.default_language;
  const t = dict(lang);
  const brand = {
    "--color-pomodoro": restaurant.brand_primary,
    "--color-pomodoro-deep": `color-mix(in srgb, ${restaurant.brand_primary} 78%, black)`,
    "--color-basil": restaurant.brand_accent,
  } as React.CSSProperties;

  return (
    <html lang={lang} className={`${bodoni.variable} ${figtree.variable}`}>
      <body style={brand} className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          {t.skip}
        </a>
        <PrefsProvider lang={lang} base={restaurant.base_currency} rates={menu.rates}>
          <PwaBits lang={lang} />
          <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
            <div className="mx-auto flex h-[60px] max-w-3xl items-center gap-2 px-4">
              <Link href={`/${lang}`} className="flex shrink-0 items-center" aria-label={`${restaurant.name} – ${t.home}`}>
                {restaurant.logo_url ? (
                  <Image src={restaurant.logo_url} alt="" width={80} height={48} priority className="h-11 w-auto object-contain" />
                ) : (
                  <span className="font-display text-lg font-semibold text-pomodoro">{restaurant.name}</span>
                )}
              </Link>
              <div className="ml-auto flex items-center gap-2">
                <Link
                  href={`/${lang}/search`}
                  aria-label={t.search}
                  className="tap flex items-center justify-center rounded-full border border-line bg-white text-lg shadow-sm"
                >
                  <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                </Link>
                <HeaderSelectors langs={restaurant.enabled_languages} />
              </div>
            </div>
          </header>
          <ApproxNote className="mx-auto max-w-3xl px-4 pt-2 text-center" />
          <main id="main" className="mx-auto max-w-3xl px-4 pb-16">
            {children}
          </main>
          <footer className="border-t border-line bg-white">
            <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-ink-soft">
              <p>{t.pricesNote} {t.allergyWarning}</p>
              <p className="mt-2">© {new Date().getFullYear()} {restaurant.name}</p>
            </div>
          </footer>
        </PrefsProvider>
      </body>
    </html>
  );
}
