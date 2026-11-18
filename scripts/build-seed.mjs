// Builds data/seed.json from scripts/menu-source.mjs.
// Run: node scripts/build-seed.mjs
import { writeFileSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
import { banners, categories, items, restaurant, specials } from "./menu-source.mjs";

const now = new Date().toISOString();
const tr = () => ({ source: "en", status: { en: "source", es: "edited" } });

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const catRows = categories.map((c, i) => ({
  id: randomUUID(),
  slug: c.slug,
  name: c.name,
  description: c.description,
  image_url: c.image ?? null,
  sort: i,
  visible: true,
  hours_from: c.hours_from ?? null,
  hours_to: c.hours_to ?? null,
  tr: tr(),
  created_at: now,
}));
const catBySlug = Object.fromEntries(catRows.map((c) => [c.slug, c]));

const used = new Set();
const sortByCat = {};
const itemRows = items.map((it) => {
  let slug = slugify(it.name.en);
  if (used.has(slug)) slug = `${slug}-${it.category}`;
  used.add(slug);
  const cat = catBySlug[it.category];
  if (!cat) throw new Error(`Unknown category ${it.category}`);
  const sizes = Array.isArray(it.price) ? it.price : [];
  const price = Array.isArray(it.price) ? Math.min(...it.price.map((s) => s.price)) : it.price;
  sortByCat[it.category] = (sortByCat[it.category] ?? -1) + 1;
  const hasDesc = it.description.en || it.description.es;
  return {
    id: randomUUID(),
    slug,
    category_id: cat.id,
    name: it.name,
    description: hasDesc ? it.description : {},
    price,
    sizes,
    photos: it.image ? [it.image] : [],
    allergens: [],
    allergens_set: false,
    tags: it.tags ?? [],
    modifiers: it.modifiers ?? [],
    addons: it.addons ?? [],
    sort: sortByCat[it.category],
    visible: it.visible ?? true,
    sold_out: false,
    featured: Boolean(it.featured),
    tr: tr(),
    created_at: now,
    updated_at: now,
  };
});

const bannerRows = banners.map((b, i) => ({
  id: randomUUID(),
  image_url: b.image,
  title: b.title,
  subtitle: b.subtitle,
  link_type: b.link_type,
  link_ref: b.link_ref,
  sort: i,
  active: true,
  starts_on: null,
  ends_on: null,
  tr: tr(),
  created_at: now,
}));

const specialRows = specials.map((s) => {
  const item = itemRows.find((i) => i.name.en === s.item);
  if (!item) throw new Error(`Special item not found: ${s.item}`);
  return {
    id: randomUUID(),
    item_id: item.id,
    days: s.days,
    starts_on: null,
    ends_on: null,
    special_price: s.special_price ?? null,
    note: s.note ?? {},
    active: true,
    tr: tr(),
    created_at: now,
  };
});

const rateRows = restaurant.enabled_currencies
  .filter((c) => c !== restaurant.base_currency)
  .map((currency) => ({ currency, rate: null, manual_rate: null, updated_at: null }));

const seed = {
  restaurant: [{ id: 1, ...restaurant, tr: tr(), updated_at: now }],
  categories: catRows,
  items: itemRows,
  banners: bannerRows,
  specials: specialRows,
  rates: rateRows,
  tables: [
    { id: randomUUID(), label: "Whole restaurant", code: "main", scans: 0, created_at: now },
    ...Array.from({ length: 12 }, (_, i) => ({ id: randomUUID(), label: `Table ${i + 1}`, code: `t${i + 1}`, scans: 0, created_at: now })),
  ],
  events: [],
  profiles: [],
};

mkdirSync("data", { recursive: true });
writeFileSync("data/seed.json", JSON.stringify(seed, null, 1));
console.log(`seed.json: ${catRows.length} categories, ${itemRows.length} items, ${bannerRows.length} banners, ${specialRows.length} specials`);
