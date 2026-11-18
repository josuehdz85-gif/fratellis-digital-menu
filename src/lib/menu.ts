import "server-only";
import { cache } from "react";
import { after } from "next/server";
import { publicStore, systemStore } from "./store";
import { effectiveRates, ratesNeedRefresh, refreshRates } from "./rates";
import { nowIn } from "./time";
import type { Banner, Category, Item, Restaurant, Special } from "./types";

export interface MenuData {
  restaurant: Restaurant;
  categories: Category[];
  items: Item[];
  banners: Banner[];
  specials: Special[];
  rates: Record<string, number>;
}

let refreshing = false;

/** Everything a diner can see, loaded once per request. */
export const getMenu = cache(async (): Promise<MenuData> => {
  const store = publicStore();
  const [restaurant, categories, items, banners, specials, rates] = await Promise.all([
    store.get("restaurant", 1),
    store.list("categories", { order: "sort" }),
    store.list("items", { order: "sort" }),
    store.list("banners", { order: "sort" }),
    store.list("specials"),
    store.list("rates"),
  ]);
  if (!restaurant) throw new Error("Restaurant not set up. Run the seed (see README).");

  // Refresh exchange rates in the background when they are a few hours old.
  if (!refreshing && ratesNeedRefresh(restaurant, rates)) {
    const sys = systemStore();
    if (sys) {
      refreshing = true;
      try {
        after(async () => {
          try {
            await refreshRates(sys);
          } finally {
            refreshing = false;
          }
        });
      } catch {
        refreshing = false;
      }
    }
  }

  const today = nowIn(restaurant.timezone).date;
  const visibleCats = categories.filter((c) => c.visible);
  const catIds = new Set(visibleCats.map((c) => c.id));
  return {
    restaurant,
    categories: visibleCats,
    items: items.filter((i) => i.visible && catIds.has(i.category_id)),
    banners: banners.filter(
      (b) => b.active && (!b.starts_on || b.starts_on <= today) && (!b.ends_on || b.ends_on >= today),
    ),
    specials: specials.filter((s) => s.active),
    rates: effectiveRates(restaurant, rates),
  };
});

export interface TodaysSpecial {
  special: Special;
  item: Item;
}

export function todaysSpecials(menu: MenuData, at = new Date()): TodaysSpecial[] {
  const now = nowIn(menu.restaurant.timezone, at);
  return menu.specials
    .filter((s) => {
      if (s.starts_on && s.starts_on > now.date) return false;
      if (s.ends_on && s.ends_on < now.date) return false;
      return s.days.length === 0 || s.days.includes(now.day);
    })
    .map((special) => ({ special, item: menu.items.find((i) => i.id === special.item_id)! }))
    .filter((s) => s.item);
}
