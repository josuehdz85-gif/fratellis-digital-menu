"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/types";
import { formatMoney } from "@/lib/money";

interface Prefs {
  lang: Lang;
  base: string;
  currency: string;
  currencies: string[];
  rates: Record<string, number>;
  setCurrency: (c: string) => void;
  convert: (amount: number) => number;
  format: (amount: number) => string;
}

const Ctx = createContext<Prefs | null>(null);
const KEY = "fm_currency";

export function PrefsProvider({
  lang,
  base,
  rates,
  children,
}: {
  lang: Lang;
  base: string;
  rates: Record<string, number>;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState(base);
  const currencies = useMemo(() => Object.keys(rates), [rates]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && rates[saved]) setCurrencyState(saved);
      else if (saved && !rates[saved]) localStorage.removeItem(KEY);
    } catch {
      /* storage blocked */
    }
  }, [rates]);

  const setCurrency = useCallback(
    (c: string) => {
      if (!rates[c]) return;
      setCurrencyState(c);
      try {
        localStorage.setItem(KEY, c);
      } catch {
        /* storage blocked */
      }
    },
    [rates],
  );

  const value = useMemo<Prefs>(() => {
    const rate = rates[currency] ?? 1;
    const cur = rates[currency] ? currency : base;
    return {
      lang,
      base,
      currency: cur,
      currencies,
      rates,
      setCurrency,
      convert: (a) => a * rate,
      format: (a) => formatMoney(a * rate, cur, lang),
    };
  }, [lang, base, currency, currencies, rates, setCurrency]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): Prefs {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs outside PrefsProvider");
  return v;
}

/** Price in the diner's chosen currency. */
export function Price({ amount, from, className }: { amount: number; from?: boolean; className?: string }) {
  const { format, lang } = usePrefs();
  const label = lang === "es" ? "desde" : "from";
  return (
    <span className={className}>
      {from ? <span className="text-[0.8em] font-normal text-ink-soft">{label} </span> : null}
      <span className="tabular-nums">{format(amount)}</span>
    </span>
  );
}
