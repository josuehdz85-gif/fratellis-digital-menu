import { requireRole, EDITORS } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { MenuManager } from "@/components/admin/MenuManager";

export const metadata = { title: "Menu" };

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ filter?: string; category?: string }> }) {
  await requireRole(EDITORS);
  const { filter, category } = await searchParams;
  const store = await adminStore();
  const [categories, items] = await Promise.all([store.list("categories", { order: "sort" }), store.list("items", { order: "sort" })]);
  return <MenuManager categories={categories} items={items} filter={filter ?? null} initialCategory={category ?? null} />;
}
