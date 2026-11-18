import { EDITORS, requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { BannersManager } from "@/components/admin/BannersManager";

export const metadata = { title: "Banners" };

export default async function BannersPage() {
  await requireRole(EDITORS);
  const store = await adminStore();
  const [banners, categories, items, restaurant] = await Promise.all([
    store.list("banners", { order: "sort" }),
    store.list("categories", { order: "sort" }),
    store.list("items", { order: "sort" }),
    store.get("restaurant", 1),
  ]);
  return <BannersManager banners={banners} categories={categories} items={items} restaurant={restaurant!} />;
}
