import { EDITORS, requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { SITE_URL } from "@/lib/config";
import { QrManager } from "@/components/admin/QrManager";

export const metadata = { title: "QR codes" };

export default async function QrPage() {
  await requireRole(EDITORS);
  const store = await adminStore();
  const [tables, restaurant] = await Promise.all([store.list("tables", { order: "created_at" }), store.get("restaurant", 1)]);
  return <QrManager tables={tables} siteUrl={SITE_URL} logo={restaurant?.logo_url ?? null} name={restaurant?.name ?? ""} />;
}
