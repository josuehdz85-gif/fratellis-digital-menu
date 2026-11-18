import { requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { SoldOutBoard } from "@/components/admin/SoldOutBoard";

export const metadata = { title: "Sold out" };

export default async function SoldOutPage() {
  await requireRole(["owner", "manager", "staff"]);
  const store = await adminStore();
  const [categories, items] = await Promise.all([store.list("categories", { order: "sort" }), store.list("items", { order: "sort" })]);
  return <SoldOutBoard categories={categories} items={items.filter((i) => i.visible)} />;
}
