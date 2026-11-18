import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { SUPABASE_SECRET_KEY, USE_SUPABASE } from "@/lib/config";
import { translationProvider } from "@/lib/translate";
import { effectiveRates } from "@/lib/rates";
import { tx } from "@/lib/i18n";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const session = await requireRole();
  if (session.role === "staff") redirect("/admin/sold-out");
  const store = await adminStore();
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const [restaurant, items, categories, rates, events] = await Promise.all([
    store.get("restaurant", 1),
    store.list("items"),
    store.list("categories"),
    store.list("rates"),
    store.list("events", { since }),
  ]);
  if (!restaurant) return <p>Restaurant not set up. Run the seed (see README).</p>;
  const review = [...items, ...categories].filter((r) => Object.values(r.tr?.status ?? {}).includes("review")).length;
  const noAllergens = items.filter((i) => i.visible && !i.allergens_set).length;
  const soldOut = items.filter((i) => i.sold_out);
  const live = effectiveRates(restaurant, rates);
  const missingRates = restaurant.enabled_currencies.filter((c) => !live[c]);
  const scans = events.filter((e) => e.type === "scan").length;
  const views = events.filter((e) => e.type !== "scan").length;

  const stats = [
    { label: "Dishes", value: items.filter((i) => i.visible).length, href: "/admin/menu" },
    { label: "Sold out now", value: soldOut.length, href: "/admin/sold-out" },
    { label: "Menu views (7 days)", value: views, href: "/admin/insights" },
    { label: "QR scans (7 days)", value: scans, href: "/admin/insights" },
  ];

  const setup = [
    { ok: USE_SUPABASE, text: "Supabase connected (database, sign-in, photo storage)", hint: "Running in local demo mode on a JSON file." },
    { ok: !USE_SUPABASE || Boolean(SUPABASE_SECRET_KEY), text: "Supabase secret key set (exchange-rate job, team invites)", hint: "" },
    { ok: Boolean(translationProvider()), text: "Automatic translation (Claude or DeepL API key)", hint: "Without a key, new text is copied and marked “Needs review”." },
    { ok: missingRates.length === 0, text: "Exchange rates up to date", hint: missingRates.length ? `Not available yet: ${missingRates.join(", ")}` : "" },
  ];

  return (
    <>
      <PageTitle title={`Hi, ${restaurant.name.split(" ")[0]}`}>
        <Link href="/admin/items/new" className="btn-primary">＋ New dish</Link>
      </PageTitle>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="card block p-4">
              <p className="text-3xl font-bold tabular-nums">{s.value}</p>
              <p className="text-sm text-ink-soft">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      {review || noAllergens ? (
        <section className="mt-6 space-y-2">
          <h2 className="font-semibold">To do</h2>
          {noAllergens ? (
            <Link href="/admin/menu?filter=allergens" className="card flex items-center gap-3 border-amber-300 p-4">
              <span aria-hidden className="text-xl">⚠️</span>
              <span><strong>{noAllergens} dishes</strong> have no allergen information yet. Diners are told to ask their server.</span>
            </Link>
          ) : null}
          {review ? (
            <Link href="/admin/menu?filter=review" className="card flex items-center gap-3 p-4">
              <span aria-hidden className="text-xl">🌐</span>
              <span><strong>{review} translations</strong> need review.</span>
            </Link>
          ) : null}
        </section>
      ) : null}

      {soldOut.length ? (
        <section className="mt-6">
          <h2 className="font-semibold">Sold out right now</h2>
          <p className="mt-1 text-sm text-ink-soft">{soldOut.map((i) => tx(i.name, "en")).join(", ")}</p>
        </section>
      ) : null}

      <section className="card mt-6 p-4">
        <h2 className="font-semibold">Setup</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {setup.map((s) => (
            <li key={s.text} className="flex gap-2">
              <span aria-hidden>{s.ok ? "✅" : "⬜"}</span>
              <span>
                {s.text}
                {!s.ok && s.hint ? <span className="block text-ink-soft">{s.hint}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
