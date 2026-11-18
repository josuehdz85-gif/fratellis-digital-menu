import { EDITORS, requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { tx } from "@/lib/i18n";
import { nowIn } from "@/lib/time";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Insights" };

function Ranking({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  return (
    <section className="card p-4">
      <h2 className="font-semibold">{title}</h2>
      {rows.length ? (
        <ol className="mt-3 space-y-2">
          {rows.map(([label, n]) => (
            <li key={label} className="text-sm">
              <div className="flex justify-between gap-2"><span className="truncate">{label}</span><span className="tabular-nums text-ink-soft">{n}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-cream"><div className="h-1.5 rounded-full bg-pomodoro" style={{ width: `${Math.max(3, (n / Math.max(1, total)) * 100)}%` }} /></div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">No data yet.</p>
      )}
    </section>
  );
}

const count = (values: (string | null)[]) => {
  const m = new Map<string, number>();
  values.forEach((v) => v && m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireRole(EDITORS);
  const days = Math.min(90, Math.max(7, Number((await searchParams).days) || 30));
  const store = await adminStore();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const [events, items, categories, restaurant, tables] = await Promise.all([
    store.list("events", { since, limit: 100000 }),
    store.list("items"),
    store.list("categories"),
    store.get("restaurant", 1),
    store.list("tables"),
  ]);
  const tz = restaurant?.timezone ?? "UTC";
  const byDay = new Map<string, { views: number; scans: number }>();
  for (let i = days - 1; i >= 0; i--) byDay.set(nowIn(tz, new Date(Date.now() - i * 864e5)).date, { views: 0, scans: 0 });
  for (const e of events) {
    const d = nowIn(tz, new Date(e.created_at!)).date;
    const row = byDay.get(d);
    if (!row) continue;
    if (e.type === "scan") row.scans++;
    else if (e.type === "view_home" || e.type === "view_category" || e.type === "view_item") row.views++;
  }
  const series = [...byDay.entries()];
  const max = Math.max(1, ...series.map(([, v]) => Math.max(v.views, v.scans)));
  const views = events.filter((e) => e.type !== "scan");
  const itemName = (slug: string) => tx(items.find((i) => i.slug === slug)?.name, "en") || slug;
  const catName = (slug: string) => tx(categories.find((c) => c.slug === slug)?.name, "en") || slug;
  const topItems = count(events.filter((e) => e.type === "view_item").map((e) => e.ref)).slice(0, 10).map(([k, n]) => [itemName(k), n] as [string, number]);
  const topCats = count(events.filter((e) => e.type === "view_category").map((e) => e.ref)).slice(0, 10).map(([k, n]) => [catName(k), n] as [string, number]);
  const langs = count(views.map((e) => e.lang)).map(([k, n]) => [k.toUpperCase(), n] as [string, number]);
  const curr = count(views.map((e) => e.currency));
  const scansByTable = count(events.filter((e) => e.type === "scan").map((e) => e.ref)).map(([k, n]) => [tables.find((t) => t.code === k)?.label ?? k, n] as [string, number]);
  const sessions = events.filter((e) => e.type === "view_home").length;
  const switched = views.filter((e) => e.lang && e.lang !== restaurant?.default_language).length;
  const otherCurrency = views.filter((e) => e.currency && e.currency !== restaurant?.base_currency).length;

  return (
    <>
      <PageTitle title="Insights">
        {[7, 30, 90].map((d) => (
          <a key={d} href={`?days=${d}`} className={d === days ? "btn-primary" : "btn-ghost"}>{d} days</a>
        ))}
      </PageTitle>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Menu views", views.length],
          ["QR scans", events.filter((e) => e.type === "scan").length],
          ["Other language", views.length ? `${Math.round((switched / views.length) * 100)}%` : "—"],
          ["Other currency", views.length ? `${Math.round((otherCurrency / views.length) * 100)}%` : "—"],
        ].map(([l, v]) => (
          <li key={l as string} className="card p-4">
            <p className="text-2xl font-bold tabular-nums">{v}</p>
            <p className="text-sm text-ink-soft">{l}</p>
          </li>
        ))}
      </ul>

      <section className="card mt-4 p-4">
        <h2 className="font-semibold">Per day</h2>
        <div className="mt-2 flex items-center gap-4 text-xs text-ink-soft">
          <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-pomodoro" /> Views</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-basil" /> Scans</span>
          <span className="ml-auto">{sessions} visits to the home page</span>
        </div>
        <div className="mt-3 flex h-40 items-end gap-[2px]" role="img" aria-label={`Views and scans per day over the last ${days} days`}>
          {series.map(([d, v]) => (
            <div key={d} className="flex h-full flex-1 items-end gap-px" title={`${d}: ${v.views} views, ${v.scans} scans`}>
              <div className="flex-1 rounded-t-sm bg-pomodoro" style={{ height: `${(v.views / max) * 100}%` }} />
              <div className="flex-1 rounded-t-sm bg-basil" style={{ height: `${(v.scans / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-ink-soft"><span>{series[0]?.[0]}</span><span>{series.at(-1)?.[0]}</span></div>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Ranking title="Most viewed dishes" rows={topItems} total={topItems[0]?.[1] ?? 1} />
        <Ranking title="Most viewed categories" rows={topCats} total={topCats[0]?.[1] ?? 1} />
        <Ranking title="Languages" rows={langs} total={views.length} />
        <Ranking title="Currencies" rows={curr} total={views.length} />
        <Ranking title="Scans by table" rows={scansByTable} total={scansByTable[0]?.[1] ?? 1} />
      </div>
      <p className="mt-4 text-xs text-ink-soft">Cookie-free: no personal data or IP addresses are stored.</p>
    </>
  );
}
