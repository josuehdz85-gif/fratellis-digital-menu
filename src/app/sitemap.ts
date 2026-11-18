import type { MetadataRoute } from "next";
import { getMenu } from "@/lib/menu";
import { SITE_URL } from "@/lib/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { restaurant, categories, items } = await getMenu();
  const langs = restaurant.enabled_languages;
  const entry = (p: string): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}/${langs[0]}${p}`,
    changeFrequency: "daily",
    alternates: { languages: Object.fromEntries(langs.map((l) => [l, `${SITE_URL}/${l}${p}`])) },
  });
  return [entry(""), ...categories.map((c) => entry(`/c/${c.slug}`)), ...items.map((i) => entry(`/i/${i.slug}`))];
}
