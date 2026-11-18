"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tx } from "@/lib/i18n";
import type { Banner, Category, Item, Restaurant } from "@/lib/types";
import { deleteRowAction, reorderAction, saveBannerAction, toggleAction } from "@/app/admin/actions";
import { PhotoUploader } from "./PhotoUploader";
import { DragHandle, LangTabs, PageTitle, Toggle, TrInput, useRun, useSortable, useTr } from "./ui";

function BannerForm({ initial, categories, items, restaurant, onDone }: { initial: Banner; categories: Category[]; items: Item[]; restaurant: Restaurant; onDone: () => void }) {
  const { run, busy } = useRun();
  const [b, setB] = useState(initial);
  const { tr, setTr, touch } = useTr(restaurant.enabled_languages, initial.tr, restaurant.default_language);
  const save = async () => {
    const r = await run(() => saveBannerAction({ banner: b, source: tr.source, touched: tr.touched }), "Slide saved");
    if (r?.ok) onDone();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="card space-y-4 p-4">
      <PhotoUploader photos={b.image_url ? [b.image_url] : []} onChange={(p) => setB({ ...b, image_url: p[0] ?? "" })} max={1} ratio={16 / 10} folder="banners" label="Slide image" />
      <LangTabs tr={tr} setTr={setTr} />
      <TrInput label="Title" value={b.title} onChange={(v) => setB({ ...b, title: v })} tr={tr} touch={touch} />
      <TrInput label="Subtitle" value={b.subtitle} onChange={(v) => setB({ ...b, subtitle: v })} tr={tr} touch={touch} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Tapping the slide opens</span>
          <select className="field" value={b.link_type} onChange={(e) => setB({ ...b, link_type: e.target.value as Banner["link_type"], link_ref: "" })}>
            <option value="none">Nothing</option>
            <option value="category">A category</option>
            <option value="item">A dish</option>
            <option value="url">A web link</option>
          </select>
        </label>
        {b.link_type === "category" ? (
          <label className="block"><span className="label">Category</span>
            <select className="field" value={b.link_ref} onChange={(e) => setB({ ...b, link_ref: e.target.value })}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{tx(c.name, "en")}</option>)}
            </select></label>
        ) : b.link_type === "item" ? (
          <label className="block"><span className="label">Dish</span>
            <select className="field" value={b.link_ref} onChange={(e) => setB({ ...b, link_ref: e.target.value })}>
              <option value="">Choose…</option>
              {items.map((i) => <option key={i.id} value={i.slug}>{tx(i.name, "en")}</option>)}
            </select></label>
        ) : b.link_type === "url" ? (
          <label className="block"><span className="label">Link</span>
            <input className="field" type="url" placeholder="https://" value={b.link_ref} onChange={(e) => setB({ ...b, link_ref: e.target.value })} /></label>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">Show from <input type="date" className="field" value={b.starts_on ?? ""} onChange={(e) => setB({ ...b, starts_on: e.target.value || null })} /></label>
        <label className="text-sm">until <input type="date" className="field" value={b.ends_on ?? ""} onChange={(e) => setB({ ...b, ends_on: e.target.value || null })} /></label>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save slide"}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

export function BannersManager({ banners, categories, items, restaurant }: { banners: Banner[]; categories: Category[]; items: Item[]; restaurant: Restaurant }) {
  const router = useRouter();
  const { run } = useRun();
  const [editing, setEditing] = useState<Banner | null>(null);
  const sort = useSortable(banners, async (next) => {
    await run(() => reorderAction("banners", next.map((b) => b.id)), "Order saved");
    router.refresh();
  });
  const done = () => { setEditing(null); router.refresh(); };
  const blank: Banner = { id: "new", image_url: "", title: {}, subtitle: {}, link_type: "none", link_ref: "", sort: 0, active: true, starts_on: null, ends_on: null, tr: { source: restaurant.default_language, status: {} } };

  return (
    <>
      <PageTitle title="Home banners">
        {!editing ? <button className="btn-primary" onClick={() => setEditing(blank)}>＋ New slide</button> : null}
      </PageTitle>
      {editing ? <BannerForm key={editing.id} initial={editing} categories={categories} items={items} restaurant={restaurant} onDone={done} /> : null}
      <ul className="mt-4 space-y-2">
        {sort.order.map((b) => (
          <li key={b.id} ref={sort.rowRef(b.id)} className="card flex items-center gap-2 p-2">
            <DragHandle {...sort.handleProps(b.id)} />
            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-crust">
              {b.image_url ? <Image src={b.image_url} alt="" fill sizes="96px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{tx(b.title, "en") || "(no title)"}</p>
              <p className="truncate text-xs text-ink-soft">{b.starts_on || b.ends_on ? `${b.starts_on ?? "…"} → ${b.ends_on ?? "…"}` : "Always"}</p>
            </div>
            <Toggle checked={b.active} label="Active" onChange={async (v) => { await run(() => toggleAction("banners", b.id, "active", v)); router.refresh(); }} />
            <button className="btn-ghost" onClick={() => setEditing(b)}>Edit</button>
            <button className="btn-danger" aria-label="Delete slide" onClick={async () => { if (confirm("Delete this slide?")) { await run(() => deleteRowAction("banners", b.id), "Deleted"); router.refresh(); } }}>🗑</button>
          </li>
        ))}
      </ul>
    </>
  );
}
