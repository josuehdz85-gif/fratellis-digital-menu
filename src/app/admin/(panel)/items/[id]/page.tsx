import { notFound } from "next/navigation";
import { EDITORS, requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { blankItem } from "@/lib/blank";

export const metadata = { title: "Dish" };

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  await requireRole(EDITORS);
  const { id } = await params;
  const { category } = await searchParams;
  const store = await adminStore();
  const [categories, restaurant] = await Promise.all([store.list("categories", { order: "sort" }), store.get("restaurant", 1)]);
  if (!restaurant || !categories.length) notFound();
  let item;
  if (id === "new") {
    item = blankItem(category && categories.some((c) => c.id === category) ? category : categories[0].id);
    item.tr = { source: restaurant.default_language, status: {} };
  } else {
    item = await store.get("items", id);
    if (!item) notFound();
  }
  return <ItemEditor key={item.id} initial={item} categories={categories} restaurant={restaurant} />;
}
