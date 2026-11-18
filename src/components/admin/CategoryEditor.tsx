"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tx } from "@/lib/i18n";
import type { Category, Restaurant } from "@/lib/types";
import { saveCategoryAction } from "@/app/admin/actions";
import { PhotoUploader } from "./PhotoUploader";
import { LangTabs, PageTitle, Toggle, TrInput, useRun, useTr } from "./ui";

export function CategoryEditor({ initial, restaurant }: { initial: Category; restaurant: Restaurant }) {
  const router = useRouter();
  const { run, busy } = useRun();
  const [cat, setCat] = useState(initial);
  const { tr, setTr, touch } = useTr(restaurant.enabled_languages, initial.tr, restaurant.default_language);
  const set = <K extends keyof Category>(k: K, v: Category[K]) => setCat((c) => ({ ...c, [k]: v }));
  const [timed, setTimed] = useState(Boolean(initial.hours_from && initial.hours_to));

  const save = async () => {
    if (!cat.name[tr.source]?.trim()) return alert("Add a category name first.");
    const payload = { ...cat, hours_from: timed ? cat.hours_from : null, hours_to: timed ? cat.hours_to : null };
    const r = await run(() => saveCategoryAction({ category: payload, source: tr.source, touched: tr.touched }), "Saved — live on the menu");
    if (r?.ok && r.data) {
      setCat(r.data);
      setTr((s) => ({ ...s, touched: [], status: r.data!.tr.status }));
      router.push(`/admin/menu?category=${r.data.id}`);
      router.refresh();
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5">
      <PageTitle title={cat.id === "new" ? "New category" : tx(cat.name, tr.source)}>
        <Link href="/admin/menu" className="btn-ghost">Back</Link>
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </PageTitle>
      <LangTabs tr={tr} setTr={setTr} />
      <section className="card space-y-4 p-4">
        <TrInput label="Name" value={cat.name} onChange={(v) => set("name", v)} tr={tr} touch={touch} required />
        <TrInput label="Description" value={cat.description} onChange={(v) => set("description", v)} tr={tr} touch={touch} multiline />
        <label className="flex items-center gap-2 text-sm font-semibold"><Toggle checked={cat.visible} onChange={(v) => set("visible", v)} label="Visible" /> Visible on menu</label>
      </section>
      <section className="card p-4">
        <PhotoUploader photos={cat.image_url ? [cat.image_url] : []} onChange={(p) => set("image_url", p[0] ?? null)} max={1} folder="categories" label="Category photo" />
      </section>
      <section className="card space-y-3 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <Toggle checked={timed} onChange={setTimed} label="Only at certain hours" /> Only served at certain hours
        </label>
        {timed ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">From <input type="time" className="field w-auto" value={cat.hours_from ?? "07:00"} onChange={(e) => set("hours_from", e.target.value)} /></label>
            <label className="flex items-center gap-2">to <input type="time" className="field w-auto" value={cat.hours_to ?? "11:00"} onChange={(e) => set("hours_to", e.target.value)} /></label>
          </div>
        ) : null}
        <p className="text-xs text-ink-soft">The category stays visible all day, with a note showing when it is served.</p>
      </section>
    </form>
  );
}
