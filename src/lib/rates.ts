import "server-only";
import type { Rate, Restaurant } from "./types";
import type { Store } from "./store";

const REFRESH_AFTER_HOURS = 6;

/** Currency -> multiplier from the base currency. Base is always 1. Stale rates are dropped. */
export function effectiveRates(restaurant: Restaurant, rates: Rate[], at = Date.now()): Record<string, number> {
  const out: Record<string, number> = { [restaurant.base_currency]: 1 };
  const maxAge = (restaurant.rate_max_age_hours || 48) * 3600_000;
  for (const cur of restaurant.enabled_currencies) {
    if (cur === restaurant.base_currency) continue;
    const r = rates.find((x) => x.currency === cur);
    if (!r) continue;
    if (r.manual_rate && r.manual_rate > 0) out[cur] = Number(r.manual_rate);
    else if (r.rate && r.updated_at && at - new Date(r.updated_at).getTime() < maxAge) out[cur] = Number(r.rate);
  }
  return out;
}

export function ratesNeedRefresh(restaurant: Restaurant, rates: Rate[], at = Date.now()): boolean {
  return restaurant.enabled_currencies
    .filter((c) => c !== restaurant.base_currency)
    .some((c) => {
      const r = rates.find((x) => x.currency === c);
      return !r?.updated_at || at - new Date(r.updated_at).getTime() > REFRESH_AFTER_HOURS * 3600_000;
    });
}

async function fetchRates(base: string): Promise<Record<string, number>> {
  const oxr = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (oxr) {
    // Open Exchange Rates (free plan is USD-based; cross rates computed here).
    const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${encodeURIComponent(oxr)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Open Exchange Rates ${res.status}`);
    const json = (await res.json()) as { rates: Record<string, number> };
    const b = json.rates[base];
    if (!b) throw new Error(`No rate for ${base}`);
    return Object.fromEntries(Object.entries(json.rates).map(([k, v]) => [k, v / b]));
  }
  // Free, no key: https://www.exchangerate-api.com/docs/free
  const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`open.er-api.com ${res.status}`);
  const json = (await res.json()) as { result: string; rates: Record<string, number> };
  if (json.result !== "success") throw new Error("Rate API returned an error");
  return json.rates;
}

/** Fetch fresh rates and save them. On failure the last good rates stay in place. */
export async function refreshRates(store: Store): Promise<{ updated: string[]; error?: string }> {
  const restaurant = await store.get("restaurant", 1);
  if (!restaurant) return { updated: [], error: "No restaurant row" };
  const wanted = restaurant.enabled_currencies.filter((c) => c !== restaurant.base_currency);
  if (!wanted.length) return { updated: [] };
  try {
    const all = await fetchRates(restaurant.base_currency);
    const now = new Date().toISOString();
    const existing = await store.list("rates");
    const rows = wanted
      .filter((c) => all[c])
      .map((c) => ({
        currency: c,
        rate: all[c],
        manual_rate: existing.find((r) => r.currency === c)?.manual_rate ?? null,
        updated_at: now,
      }));
    await store.upsert("rates", rows);
    return { updated: rows.map((r) => r.currency) };
  } catch (e) {
    return { updated: [], error: (e as Error).message };
  }
}
