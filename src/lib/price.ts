import type { Item } from "./types";

/** Lowest price shown for an item ("from $X" when sizes differ). Shared by server and client. */
export function itemPrice(item: Item): { amount: number; from: boolean } {
  if (item.sizes?.length) {
    const prices = item.sizes.map((s) => s.price);
    const min = Math.min(...prices);
    return { amount: min, from: prices.some((p) => p !== min) };
  }
  return { amount: Number(item.price), from: false };
}
