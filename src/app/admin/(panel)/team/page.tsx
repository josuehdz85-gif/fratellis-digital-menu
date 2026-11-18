import { OWNER, requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { TeamManager } from "@/components/admin/TeamManager";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireRole(OWNER);
  const store = await adminStore();
  const profiles = me.mode === "supabase" ? (await store.list("profiles", { order: "email" })).filter((p) => p.role) : [];
  return <TeamManager profiles={profiles} me={me.userId} mode={me.mode} />;
}
