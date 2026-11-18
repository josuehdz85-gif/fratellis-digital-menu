import type { Item } from "./types";

/** Empty dish used by the admin "New dish" screen. */
export function blankItem(categoryId: string): Item {
  return {
    id: "new",
    slug: "",
    category_id: categoryId,
    name: {},
    description: {},
    price: 0,
    sizes: [],
    photos: [],
    allergens: [],
    allergens_set: false,
    tags: [],
    modifiers: [],
    addons: [],
    sort: 0,
    visible: true,
    sold_out: false,
    featured: false,
    tr: { source: "en", status: {} },
  };
}
