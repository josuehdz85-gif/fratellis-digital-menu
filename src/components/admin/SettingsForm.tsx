"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LANG_META } from "@/lib/i18n";
import { CURRENCIES } from "@/lib/money";
import { LANGS, type HoursRule, type Lang, type Rate, type Restaurant } from "@/lib/types";
import { mfaDisableAction, mfaEnrollAction, mfaVerifyAction, refreshRatesAction, saveManualRatesAction, saveSettingsAction } from "@/app/admin/actions";
import { PhotoUploader } from "./PhotoUploader";
import { LangTabs, PageTitle, TrInput, useRun, useTr } from "./ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function HoursEditor({ hours, onChange }: { hours: HoursRule[]; onChange: (h: HoursRule[]) => void }) {
  return (
    <div className="space-y-2">
      {hours.map((h, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2">
          <div className="flex flex-wrap gap-1">
            {DAYS.map((d, di) => {
              const on = h.days.includes(di);
              return (
                <button key={d} type="button" aria-pressed={on}
                  onClick={() => onChange(hours.map((x, xi) => (xi === i ? { ...x, days: on ? x.days.filter((y) => y !== di) : [...x.days, di].sort() } : x)))}
                  className={`h-10 w-11 rounded-md border text-xs font-semibold ${on ? "border-pomodoro bg-pomodoro text-white" : "border-line"}`}>{d}</button>
              );
            })}
          </div>
          <input type="time" className="field w-auto" value={h.open} aria-label="Opens" onChange={(e) => onChange(hours.map((x, xi) => (xi === i ? { ...x, open: e.target.value } : x)))} />
          –
          <input type="time" className="field w-auto" value={h.close} aria-label="Closes" onChange={(e) => onChange(hours.map((x, xi) => (xi === i ? { ...x, close: e.target.value } : x)))} />
          <button type="button" className="tap text-ink-soft" aria-label="Remove hours row" onClick={() => onChange(hours.filter((_, xi) => xi !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn-ghost" onClick={() => onChange([...hours, { days: [], open: "11:00", close: "21:00" }])}>＋ Hours row</button>
    </div>
  );
}

function Security({ mode, enrolled }: { mode: string; enrolled: boolean }) {
  const { run, busy } = useRun();
  const router = useRouter();
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  if (mode !== "supabase") return <p className="text-sm text-ink-soft">Two-step verification is available once Supabase is connected.</p>;
  if (enrolled)
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">✅ Two-step verification is on.</p>
        <button type="button" className="btn-danger" disabled={busy} onClick={async () => { if (confirm("Turn off two-step verification?")) { await run(mfaDisableAction, "Turned off"); router.refresh(); } }}>Turn off</button>
      </div>
    );
  return enroll ? (
    <div className="space-y-3">
      <p className="text-sm">Scan this with Google Authenticator, Authy or 1Password, then type the 6-digit code.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enroll.qr} alt="Two-step verification QR code" width={180} height={180} className="rounded-lg border border-line bg-white p-2" />
      <p className="break-all text-xs text-ink-soft">Can&apos;t scan? Key: {enroll.secret}</p>
      <div className="flex gap-2">
        <input className="field max-w-[10rem]" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="6-digit code" />
        <button type="button" className="btn-primary" disabled={busy} onClick={async () => { const r = await run(() => mfaVerifyAction(enroll.factorId, code), "Two-step verification is on"); if (r?.ok) { setEnroll(null); router.refresh(); } }}>Verify</button>
      </div>
    </div>
  ) : (
    <button type="button" className="btn-ghost" disabled={busy} onClick={async () => { const r = await run(mfaEnrollAction); if (r?.ok && r.data) setEnroll(r.data); }}>Turn on two-step verification</button>
  );
}

export function SettingsForm({ restaurant, rates, mode, mfaEnrolled }: { restaurant: Restaurant; rates: Rate[]; mode: string; mfaEnrolled: boolean }) {
  const router = useRouter();
  const { run, busy } = useRun();
  const [r, setR] = useState(restaurant);
  const { tr, setTr, touch } = useTr(restaurant.enabled_languages, restaurant.tr, restaurant.default_language);
  const [manual, setManual] = useState<Record<string, string>>(Object.fromEntries(rates.map((x) => [x.currency, x.manual_rate ? String(x.manual_rate) : ""])));
  const [glossary, setGlossary] = useState(restaurant.glossary.join(", "));
  const set = <K extends keyof Restaurant>(k: K, v: Restaurant[K]) => setR((x) => ({ ...x, [k]: v }));

  const save = async () => {
    const payload = { ...r, glossary: glossary.split(",").map((s) => s.trim()).filter(Boolean) };
    const res = await run(() => saveSettingsAction({ restaurant: payload, source: tr.source, touched: tr.touched }), "Settings saved");
    if (res?.ok) router.refresh();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5">
      <PageTitle title="Settings">
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
      </PageTitle>

      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Restaurant profile</h2>
        <Field label="Restaurant name" value={r.name} onChange={(v) => set("name", v)} />
        <LangTabs tr={tr} setTr={setTr} />
        <TrInput label="Tagline" value={r.tagline} onChange={(v) => set("tagline", v)} tr={tr} touch={touch} />
        <PhotoUploader photos={r.logo_url ? [r.logo_url] : []} onChange={(p) => set("logo_url", p[0] ?? null)} max={1} ratio={5 / 3} folder="brand" label="Logo" />
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">Main color</span><input type="color" className="h-11 w-full rounded-lg border border-line" value={r.brand_primary} onChange={(e) => set("brand_primary", e.target.value)} /></label>
          <label className="block"><span className="label">Accent color</span><input type="color" className="h-11 w-full rounded-lg border border-line" value={r.brand_accent} onChange={(e) => set("brand_accent", e.target.value)} /></label>
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Contact & location</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone" value={r.phone} onChange={(v) => set("phone", v)} type="tel" />
          <Field label="WhatsApp number (with country code)" value={r.whatsapp} onChange={(v) => set("whatsapp", v)} type="tel" placeholder="+1 818 555 0100" />
          <Field label="Email" value={r.email} onChange={(v) => set("email", v)} type="email" />
          <Field label="Website" value={r.website} onChange={(v) => set("website", v)} type="url" />
        </div>
        <Field label="Address" value={r.address} onChange={(v) => set("address", v)} />
        <Field label="Map link" value={r.map_url} onChange={(v) => set("map_url", v)} type="url" />
        <div className="grid gap-3 sm:grid-cols-3">
          {["instagram", "facebook", "tiktok", "yelp", "x"].map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)} value={r.social?.[k] ?? ""} type="url" onChange={(v) => set("social", { ...r.social, [k]: v })} />
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Opening hours</h2>
        <HoursEditor hours={r.hours} onChange={(h) => set("hours", h)} />
        <Field label="Time zone" value={r.timezone} onChange={(v) => set("timezone", v)} placeholder="America/Los_Angeles" />
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Languages</h2>
        <div className="flex flex-wrap gap-4">
          {LANGS.map((l) => (
            <label key={l} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-pomodoro" checked={r.enabled_languages.includes(l)}
                onChange={(e) => set("enabled_languages", e.target.checked ? [...r.enabled_languages, l] : r.enabled_languages.filter((x) => x !== l))} />
              {LANG_META[l].label}
            </label>
          ))}
        </div>
        <label className="block max-w-xs"><span className="label">Default language</span>
          <select className="field" value={r.default_language} onChange={(e) => set("default_language", e.target.value as Lang)}>
            {r.enabled_languages.map((l) => <option key={l} value={l}>{LANG_META[l].label}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">Translation glossary (names kept as they are, comma separated)</span>
          <textarea className="field" rows={3} value={glossary} onChange={(e) => setGlossary(e.target.value)} />
        </label>
        <label className="block max-w-xs"><span className="label">Allergen list</span>
          <select className="field" value={r.allergen_standard} onChange={(e) => set("allergen_standard", e.target.value as Restaurant["allergen_standard"])}>
            <option value="us9">US top 9</option>
            <option value="eu14">EU 14</option>
          </select>
        </label>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Currencies</h2>
        <label className="block max-w-xs"><span className="label">Base currency (prices are entered in this)</span>
          <select className="field" value={r.base_currency} onChange={(e) => set("base_currency", e.target.value)}>
            {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c} – {CURRENCIES[c].label}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(CURRENCIES).map(([c, meta]) => (
            <label key={c} className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm">
              <input type="checkbox" className="size-4 accent-pomodoro" checked={r.enabled_currencies.includes(c)} disabled={c === r.base_currency}
                onChange={(e) => set("enabled_currencies", e.target.checked ? [...r.enabled_currencies, c] : r.enabled_currencies.filter((x) => x !== c))} />
              {meta.flag} {c}
            </label>
          ))}
        </div>
        <Field label="Hide a currency when its rate is older than (hours)" type="number" value={String(r.rate_max_age_hours)} onChange={(v) => set("rate_max_age_hours", Number(v) || 48)} />
      </section>

      <section className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Exchange rates (1 {r.base_currency} = …)</h2>
          <button type="button" className="btn-ghost" disabled={busy} onClick={async () => { await run(refreshRatesAction, "Rates refreshed"); router.refresh(); }}>↻ Refresh now</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-ink-soft"><th className="py-1">Currency</th><th>Automatic</th><th>Updated</th><th>Manual override</th></tr></thead>
          <tbody>
            {rates.filter((x) => x.currency !== r.base_currency).map((x) => (
              <tr key={x.currency} className="border-t border-line">
                <td className="py-2 font-semibold">{x.currency}</td>
                <td className="tabular-nums">{x.rate ? Number(x.rate).toFixed(4) : "—"}</td>
                <td className="text-xs text-ink-soft">{x.updated_at ? new Date(x.updated_at).toLocaleString() : "never"}</td>
                <td><input className="field w-28 py-1.5" type="number" step="0.0001" min="0" value={manual[x.currency] ?? ""} placeholder="auto" aria-label={`Manual rate ${x.currency}`} onChange={(e) => setManual({ ...manual, [x.currency]: e.target.value })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="btn-ghost" disabled={busy}
          onClick={async () => { await run(() => saveManualRatesAction(Object.fromEntries(Object.entries(manual).map(([k, v]) => [k, v ? Number(v) : null]))), "Manual rates saved"); router.refresh(); }}>
          Save manual rates
        </button>
        <p className="text-xs text-ink-soft">Rates refresh automatically every few hours. A manual rate (for example the rate you accept for cash) always wins. Save settings first if you just enabled a currency.</p>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Security</h2>
        <Security mode={mode} enrolled={mfaEnrolled} />
      </section>
    </form>
  );
}
