import { OWNER, requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireRole(OWNER);
  const store = await adminStore();
  const [restaurant, rates] = await Promise.all([store.get("restaurant", 1), store.list("rates")]);
  return <SettingsForm restaurant={restaurant!} rates={rates} mode={session.mode} mfaEnrolled={Boolean(session.mfaEnrolled)} />;
}
