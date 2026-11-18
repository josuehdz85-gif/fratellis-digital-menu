"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { signOutAction } from "@/app/admin/actions";

const LINKS: { href: string; label: string; icon: string; roles: Role[]; mobile?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: "🏠", roles: ["owner", "manager"], mobile: true },
  { href: "/admin/menu", label: "Menu", icon: "📋", roles: ["owner", "manager"], mobile: true },
  { href: "/admin/sold-out", label: "Sold out", icon: "🚫", roles: ["owner", "manager", "staff"], mobile: true },
  { href: "/admin/specials", label: "Specials", icon: "⭐", roles: ["owner", "manager"], mobile: true },
  { href: "/admin/banners", label: "Banners", icon: "🖼️", roles: ["owner", "manager"] },
  { href: "/admin/qr", label: "QR codes", icon: "🔳", roles: ["owner", "manager"] },
  { href: "/admin/insights", label: "Insights", icon: "📈", roles: ["owner", "manager"] },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", roles: ["owner"], mobile: true },
  { href: "/admin/team", label: "Team", icon: "👥", roles: ["owner"] },
];

export function AdminNav({ role, email, demo }: { role: Role; email: string; demo: boolean }) {
  const path = usePathname();
  const links = LINKS.filter((l) => l.roles.includes(role));
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
        <div className="p-5">
          <p className="font-display text-xl font-semibold text-pomodoro">Menu admin</p>
          <p className="truncate text-xs text-ink-soft">{email} · {role}</p>
          {demo ? <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Local demo mode</p> : null}
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${active(l.href) ? "bg-pomodoro/10 text-pomodoro" : "text-ink hover:bg-cream"}`}
            >
              <span aria-hidden>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 p-3">
          <a href="/" target="_blank" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-cream">
            <span aria-hidden>↗</span> View public menu
          </a>
          <form action={signOutAction}>
            <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-cream">
              <span aria-hidden>⎋</span> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile: top bar + bottom tabs */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-2 md:hidden">
        <p className="font-display text-lg font-semibold text-pomodoro">Menu admin</p>
        <details className="relative">
          <summary className="tap flex cursor-pointer list-none items-center justify-center rounded-lg border border-line px-3 text-sm font-semibold">More ▾</summary>
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-line bg-white p-2 shadow-lg">
            <p className="truncate px-3 py-1 text-xs text-ink-soft">{email} · {role}</p>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-cream">
                <span aria-hidden>{l.icon}</span> {l.label}
              </Link>
            ))}
            <a href="/" target="_blank" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-cream">↗ View public menu</a>
            <form action={signOutAction}>
              <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-cream">⎋ Sign out</button>
            </form>
          </div>
        </details>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {links.filter((l) => l.mobile).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active(l.href) ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center text-[11px] font-semibold ${active(l.href) ? "text-pomodoro" : "text-ink-soft"}`}
          >
            <span aria-hidden className="text-lg">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
