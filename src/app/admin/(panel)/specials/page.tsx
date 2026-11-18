import { EDITORS, requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { SpecialsManager } from "@/components/admin/SpecialsManager";

export const metadata = { title: "Specials" };

export default async function SpecialsPage() {
  await requireRole(EDITORS);
  const store = await adminStore();
  const [specials, items, restaurant] = await Promise.all([store.list("specials"), store.list("items", { order: "sort" }), store.get("restaurant", 1)]);
  return <SpecialsManager specials={specials} items={items} restaurant={restaurant!} />;
}
