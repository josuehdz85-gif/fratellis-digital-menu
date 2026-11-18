"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANG_META, dict, fmt } from "@/lib/i18n";
import { CURRENCIES, currencySymbol } from "@/lib/money";
import type { Lang } from "@/lib/types";
import { usePrefs } from "./prefs";

function remember(lang: Lang) {
  try {
    document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
    localStorage.setItem("fm_lang", lang);
  } catch {
    /* ignore */
  }
}

function useSwap() {
  const pathname = usePathname() || "/";
  return (to: Lang) => pathname.replace(/^\/(en|es)(?=\/|$)/, `/${to}`);
}

/** Big EN | ES toggle on the home page. */
export function LangToggle({ langs }: { langs: Lang[] }) {
  const { lang } = usePrefs();
  const swap = useSwap();
  const t = dict(lang);
  return (
    <nav aria-label={t.language} className="inline-flex rounded-full border border-line bg-white p-1 shadow-card">
      {langs.map((l) => {
        const active = l === lang;
        return (
          <Link
            key={l}
            href={swap(l)}
            hrefLang={l}
            lang={l}
            onClick={() => remember(l)}
            aria-current={active ? "true" : undefined}
            className={`tap flex items-center justify-center rounded-full px-5 text-sm font-bold tracking-wide transition ${
              active ? "bg-pomodoro text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            <span aria-hidden className="mr-1.5">{LANG_META[l].flag}</span>
            {LANG_META[l].short}
            <span className="sr-only"> – {LANG_META[l].label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Compact header selectors: language (flag + code) and currency. */
export function HeaderSelectors({ langs }: { langs: Lang[] }) {
  const { lang, currency, currencies, setCurrency } = usePrefs();
  const swap = useSwap();
  const t = dict(lang);
  const selectCls =
    "tap appearance-none rounded-full border border-line bg-white pl-3 pr-7 text-sm font-semibold text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-pomodoro/30 select-arrow";
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="lang-select">{t.language}</label>
      <select
        id="lang-select"
        className={selectCls}
        value={lang}
        onChange={(e) => {
          const l = e.target.value as Lang;
          remember(l);
          window.location.assign(swap(l));
        }}
      >
        {langs.map((l) => (
          <option key={l} value={l}>
            {LANG_META[l].flag} {LANG_META[l].short}
          </option>
        ))}
      </select>
      {currencies.length > 1 ? (
        <>
          <label className="sr-only" htmlFor="currency-select">{t.currency}</label>
          <select
            id="currency-select"
            className={selectCls}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c} {currencySymbol(c, lang)}
              </option>
            ))}
          </select>
        </>
      ) : null}
    </div>
  );
}

/** "Approximate price" note, shown only when a non-base currency is selected. */
export function ApproxNote({ className = "" }: { className?: string }) {
  const { lang, currency, base } = usePrefs();
  if (currency === base) return null;
  return (
    <p role="status" className={`text-xs text-ink-soft ${className}`}>
      <span aria-hidden>{CURRENCIES[currency]?.flag ?? "💱"} </span>
      {fmt(dict(lang).approxNote, { base })}
    </p>
  );
}
