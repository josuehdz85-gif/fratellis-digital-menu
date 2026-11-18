"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile, Role } from "@/lib/types";
import { inviteUserAction, removeUserAction, setRoleAction } from "@/app/admin/actions";
import { PageTitle, useRun } from "./ui";

const ROLES: { value: Role; label: string; help: string }[] = [
  { value: "owner", label: "Owner", help: "Everything, including settings and team" },
  { value: "manager", label: "Manager", help: "Menu, specials, banners, QR codes" },
  { value: "staff", label: "Staff", help: "Mark dishes sold out only" },
];

export function TeamManager({ profiles, me, mode }: { profiles: Profile[]; me: string; mode: string }) {
  const router = useRouter();
  const { run, busy } = useRun();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");

  if (mode !== "supabase") {
    return (
      <>
        <PageTitle title="Team" />
        <p className="card p-4 text-sm">Team members and roles work once Supabase is connected. Local demo mode has a single owner sign-in.</p>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Team" />
      <form
        className="card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_10rem_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await run(() => inviteUserAction(email, role), `Invitation sent to ${email}`);
          if (r?.ok) {
            setEmail("");
            router.refresh();
          }
        }}
      >
        <input className="field" type="email" required placeholder="Email to invite" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email to invite" />
        <select className="field" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Role">
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button className="btn-primary" disabled={busy}>Invite</button>
      </form>
      <ul className="card divide-y divide-line">
        {profiles.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
            <span className="min-w-0 flex-1 truncate font-semibold">{p.email}{p.id === me ? " (you)" : ""}</span>
            <select className="field w-auto" value={p.role} disabled={p.id === me || busy} aria-label={`Role for ${p.email}`}
              onChange={async (e) => { await run(() => setRoleAction(p.id, e.target.value as Role), "Role updated"); router.refresh(); }}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {p.id !== me ? (
              <button className="btn-danger" disabled={busy} onClick={async () => { if (confirm(`Remove ${p.email}? They will lose access.`)) { await run(() => removeUserAction(p.id), "Removed"); router.refresh(); } }}>Remove</button>
            ) : null}
          </li>
        ))}
      </ul>
      <ul className="mt-4 space-y-1 text-sm text-ink-soft">
        {ROLES.map((r) => <li key={r.value}><strong className="text-ink">{r.label}:</strong> {r.help}</li>)}
      </ul>
    </>
  );
}
