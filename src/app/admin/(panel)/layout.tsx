import { requireRole } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole();
  return (
    <div className="min-h-dvh md:flex">
      <AdminNav role={session.role} email={session.email} demo={session.mode === "local"} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-4xl px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-8">{children}</main>
      </div>
    </div>
  );
}
