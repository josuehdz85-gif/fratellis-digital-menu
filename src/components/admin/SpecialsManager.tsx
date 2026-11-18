"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { tx } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type { Item, Restaurant, Special } from "@/lib/types";
import { deleteRowAction, saveSpecialAction, toggleAction } from "@/app/admin/actions";
import { LangTabs, PageTitle, Toggle, TrInput, useRun, useTr } from "./ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SpecialForm({ initial, items, restaurant, onDone }: { initial: Special; items: Item[]; restaurant: Restaurant; onDone: () => void }) {
  const { run, busy } = useRun();
  const [s, setS] = useState(initial);
  const { tr, setTr, touch } = useTr(restaurant.enabled_languages, initial.tr, restaurant.default_language);
  const [byDate, setByDate] = useState(Boolean(initial.starts_on || initial.ends_on));

  const save = async () => {
    if (!s.item_id) return alert("Pick a dish.");
    const payload: Special = { ...s, days: byDate ? [] : s.days, starts_on: byDate ? s.starts_on : null, ends_on: byDate ? s.ends_on : null };
    const r = await run(() => saveSpecialAction({ special: payload, source: tr.source, touched: tr.touched }), "Special saved");
    if (r?.ok) onDone();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="card space-y-4 p-4">
      <label className="block">
        <span className="label">Dish</span>
        <select className="field" value={s.item_id} onChange={(e) => setS({ ...s, item_id: e.target.value })}>
          <option value="">Choose a dish…</option>
          {items.map((i) => <option key={i.id} value={i.id}>{tx(i.name, "en")}</option>)}
        </select>
      </label>
      <div className="flex gap-2">
        <button type="button" className={byDate ? "btn-ghost" : "btn-primary"} onClick={() => setByDate(false)}>Days of the week</button>
        <button type="button" className={byDate ? "btn-primary" : "btn-ghost"} onClick={() => setByDate(true)}>Date range</button>
      </div>
      {byDate ? (
        <div className="flex flex-wrap gap-3">
          <label className="text-sm">From <input type="date" className="field" value={s.starts_on ?? ""} onChange={(e) => setS({ ...s, starts_on: e.target.value || null })} /></label>
          <label className="text-sm">To <input type="date" className="field" value={s.ends_on ?? ""} onChange={(e) => setS({ ...s, ends_on: e.target.value || null })} /></label>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Days">
          {DAYS.map((d, i) => {
            const on = s.days.includes(i);
            return (
              <button key={d} type="button" aria-pressed={on} onClick={() => setS({ ...s, days: on ? s.days.filter((x) => x !== i) : [...s.days, i].sort() })}
                className={`h-11 w-14 rounded-lg border text-sm font-semibold ${on ? "border-pomodoro bg-pomodoro text-white" : "border-line bg-white"}`}>{d}</button>
            );
          })}
          <p className="w-full text-xs text-ink-soft">No days selected = every day.</p>
        </div>
      )}
      <label className="block max-w-xs">
        <span className="label">Special price ({restaurant.base_currency}, optional)</span>
        <input type="number" step="0.01" min="0" inputMode="decimal" className="field" value={s.special_price ?? ""} onChange={(e) => setS({ ...s, special_price: e.target.value === "" ? null : Number(e.target.value) })} />
      </label>
      <LangTabs tr={tr} setTr={setTr} />
      <TrInput label="Note (optional)" value={s.note} onChange={(v) => setS({ ...s, note: v })} tr={tr} touch={touch} placeholder="e.g. Tuesday special" />
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save special"}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

export function SpecialsManager({ specials, items, restaurant }: { specials: Special[]; items: Item[]; restaurant: Restaurant }) {
  const router = useRouter();
  const { run } = useRun();
  const [editing, setEditing] = useState<Special | null>(null);
  const done = () => {
    setEditing(null);
    router.refresh();
  };
  const blank: Special = { id: "new", item_id: "", days: [], starts_on: null, ends_on: null, special_price: null, note: {}, active: true, tr: { source: restaurant.default_language, status: {} } };

  return (
    <>
      <PageTitle title="Daily specials">
        {!editing ? <button className="btn-primary" onClick={() => setEditing(blank)}>＋ New special</button> : null}
      </PageTitle>
      {editing ? <SpecialForm key={editing.id} initial={editing} items={items} restaurant={restaurant} onDone={done} /> : null}
      <ul className="mt-4 space-y-2">
        {specials.map((s) => {
          const item = items.find((i) => i.id === s.item_id);
          const when = s.starts_on || s.ends_on ? `${s.starts_on ?? "…"} → ${s.ends_on ?? "…"}` : s.days.length ? s.days.map((d) => DAYS[d]).join(", ") : "Every day";
          return (
            <li key={s.id} className="card flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{tx(item?.name, "en") || "(deleted dish)"}</p>
                <p className="text-sm text-ink-soft">
                  {when}
                  {s.special_price != null ? ` · ${formatMoney(s.special_price, restaurant.base_currency, "en")}` : ""}
                  {tx(s.note, "en") ? ` · ${tx(s.note, "en")}` : ""}
                </p>
              </div>
              <Toggle checked={s.active} label="Active" onChange={async (v) => { await run(() => toggleAction("specials", s.id, "active", v)); router.refresh(); }} />
              <button className="btn-ghost" onClick={() => setEditing(s)}>Edit</button>
              <button className="btn-danger" onClick={async () => { if (confirm("Delete this special?")) { await run(() => deleteRowAction("specials", s.id), "Deleted"); router.refresh(); } }}>Delete</button>
            </li>
          );
        })}
      </ul>
      {!specials.length && !editing ? <p className="card p-6 text-center text-ink-soft">No specials yet.</p> : null}
    </>
  );
}
