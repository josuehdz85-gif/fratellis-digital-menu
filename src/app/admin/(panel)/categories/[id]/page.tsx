import { notFound } from "next/navigation";
import { EDITORS, requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import type { Category } from "@/lib/types";

export const metadata = { title: "Category" };

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(EDITORS);
  const { id } = await params;
  const store = await adminStore();
  const restaurant = await store.get("restaurant", 1);
  if (!restaurant) notFound();
  let cat: Category | null;
  if (id === "new") {
    cat = { id: "new", slug: "", name: {}, description: {}, image_url: null, sort: 0, visible: true, hours_from: null, hours_to: null, tr: { source: restaurant.default_language, status: {} } };
  } else {
    cat = await store.get("categories", id);
    if (!cat) notFound();
  }
  return <CategoryEditor key={cat.id} initial={cat} restaurant={restaurant} />;
}
