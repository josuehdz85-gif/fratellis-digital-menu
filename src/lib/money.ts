import type { Lang } from "./types";

/** Currencies the owner can offer. Whole-unit currencies are rounded. */
export const CURRENCIES: Record<string, { label: string; flag: string; whole?: boolean }> = {
  USD: { label: "US dollar", flag: "🇺🇸" },
  MXN: { label: "Mexican peso", flag: "🇲🇽", whole: true },
  EUR: { label: "Euro", flag: "🇪🇺" },
  CAD: { label: "Canadian dollar", flag: "🇨🇦" },
  GBP: { label: "British pound", flag: "🇬🇧" },
  BRL: { label: "Brazilian real", flag: "🇧🇷" },
  JPY: { label: "Japanese yen", flag: "🇯🇵", whole: true },
  CNY: { label: "Chinese yuan", flag: "🇨🇳" },
  KRW: { label: "Korean won", flag: "🇰🇷", whole: true },
  COP: { label: "Colombian peso", flag: "🇨🇴", whole: true },
  GTQ: { label: "Guatemalan quetzal", flag: "🇬🇹" },
  AUD: { label: "Australian dollar", flag: "🇦🇺" },
  CHF: { label: "Swiss franc", flag: "🇨🇭" },
};

const LOCALE: Record<Lang, string> = { en: "en-US", es: "es-MX" };

export function formatMoney(amount: number, currency: string, lang: Lang): string {
  const whole = CURRENCIES[currency]?.whole;
  const value = whole ? Math.round(amount) : amount;
  try {
    return new Intl.NumberFormat(LOCALE[lang] ?? "en-US", {
      style: "currency",
      currency,
      currencyDisplay: currency === "USD" || currency === "EUR" || currency === "GBP" ? "narrowSymbol" : "symbol",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(whole ? 0 : 2)}`;
  }
}

export function currencySymbol(currency: string, lang: Lang): string {
  try {
    const parts = new Intl.NumberFormat(LOCALE[lang] ?? "en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}
