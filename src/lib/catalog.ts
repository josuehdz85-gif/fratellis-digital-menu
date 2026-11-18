import type { I18n } from "./types";

export interface CatalogEntry {
  code: string;
  name: I18n;
  icon: string; // short glyph shown in badges
}

/** Union of the US "top 9" and the EU 14. The restaurant setting picks which list the admin shows. */
export const ALLERGENS: (CatalogEntry & { us9: boolean; eu14: boolean })[] = [
  { code: "gluten", name: { en: "Gluten / wheat", es: "Gluten / trigo" }, icon: "🌾", us9: true, eu14: true },
  { code: "milk", name: { en: "Milk / dairy", es: "Leche / lácteos" }, icon: "🥛", us9: true, eu14: true },
  { code: "eggs", name: { en: "Eggs", es: "Huevo" }, icon: "🥚", us9: true, eu14: true },
  { code: "fish", name: { en: "Fish", es: "Pescado" }, icon: "🐟", us9: true, eu14: true },
  { code: "shellfish", name: { en: "Shellfish", es: "Mariscos" }, icon: "🦐", us9: true, eu14: true },
  { code: "tree_nuts", name: { en: "Tree nuts", es: "Nueces" }, icon: "🌰", us9: true, eu14: true },
  { code: "peanuts", name: { en: "Peanuts", es: "Cacahuate" }, icon: "🥜", us9: true, eu14: true },
  { code: "soy", name: { en: "Soy", es: "Soya" }, icon: "🫘", us9: true, eu14: true },
  { code: "sesame", name: { en: "Sesame", es: "Ajonjolí" }, icon: "⚪", us9: true, eu14: true },
  { code: "celery", name: { en: "Celery", es: "Apio" }, icon: "🥬", us9: false, eu14: true },
  { code: "mustard", name: { en: "Mustard", es: "Mostaza" }, icon: "🟡", us9: false, eu14: true },
  { code: "sulphites", name: { en: "Sulphites", es: "Sulfitos" }, icon: "🍷", us9: false, eu14: true },
  { code: "lupin", name: { en: "Lupin", es: "Altramuz" }, icon: "🌼", us9: false, eu14: true },
  { code: "molluscs", name: { en: "Molluscs", es: "Moluscos" }, icon: "🦪", us9: false, eu14: true },
];

export const DIETARY_TAGS: CatalogEntry[] = [
  { code: "vegetarian", name: { en: "Vegetarian", es: "Vegetariano" }, icon: "🌱" },
  { code: "vegan", name: { en: "Vegan", es: "Vegano" }, icon: "🥦" },
  { code: "gluten_free", name: { en: "Gluten-free", es: "Sin gluten" }, icon: "GF" },
  { code: "spicy", name: { en: "Spicy", es: "Picante" }, icon: "🌶️" },
  { code: "kids", name: { en: "Kids' favorite", es: "Favorito de niños" }, icon: "🧒" },
  { code: "house", name: { en: "House specialty", es: "Especialidad de la casa" }, icon: "⭐" },
];

/** Tags diners can filter by on category pages. */
export const FILTER_TAGS = ["vegetarian", "vegan", "gluten_free", "spicy"];

export function allergenList(standard: "us9" | "eu14") {
  return ALLERGENS.filter((a) => (standard === "eu14" ? a.eu14 : a.us9));
}

export const tagByCode = Object.fromEntries(DIETARY_TAGS.map((t) => [t.code, t]));
export const allergenByCode = Object.fromEntries(ALLERGENS.map((a) => [a.code, a]));
