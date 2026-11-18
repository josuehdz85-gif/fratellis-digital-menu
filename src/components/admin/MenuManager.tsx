"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { tx } from "@/lib/i18n";
import { itemPrice } from "@/lib/price";
import { formatMoney } from "@/lib/money";
import type { Category, Item } from "@/lib/types";
import {
  deleteCategoryAction,
  deleteItemAction,
  duplicateItemAction,
  reorderAction,
  saveItemAction,
  setSoldOutAction,
  toggleAction,
} from "@/app/admin/actions";
import { DragHandle, PageTitle, Toggle, useRun, useSortable } from "./ui";

const needsReview = (r: { tr?: Item["tr"] }) => Object.values(r.tr?.status ?? {}).includes("review");

export function MenuManager({
  categories,
  items,
  filter,
  initialCategory,
}: {
  categories: Category[];
  items: Item[];
  filter: string | null;
  initialCategory: string | null;
}) {
  const router = useRouter();
  const { run, busy } = useRun();
  const [catId, setCatId] = useState<string | null>(initialCategory ?? categories[0]?.id ?? null);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<string | null>(filter);

  const cats = useSortable(categories, async (next) => {
    await run(() => reorderAction("categories", next.map((c) => c.id)), "Order saved");
    router.refresh();
  });

  const listed = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term) return items.filter((i) => `${i.name.en} ${i.name.es}`.toLowerCase().includes(term));
    if (mode === "allergens") return items.filter((i) => i.visible && !i.allergens_set);
    if (mode === "review") return items.filter(needsReview);
    return items.filter((i) => i.category_id === catId);
  }, [items, q, mode, catId]);
  const sortableItems = !q && !mode;

  const its = useSortable(listed, async (next) => {
    if (!sortableItems) return;
    await run(() => reorderAction("items", next.map((i) => i.id)), "Order saved");
    router.refresh();
  });

  const act = async (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) => {
    await run(fn, ok);
    router.refresh();
  };

  const currentCat = categories.find((c) => c.id === catId);
  const reviewCats = categories.filter(needsReview);

  return (
    <>
      <PageTitle title="Menu">
        <Link href="/admin/categories/new" className="btn-ghost">＋ Category</Link>
        <Link href={`/admin/items/new${catId ? `?category=${catId}` : ""}`} className="btn-primary">＋ Dish</Link>
      </PageTitle>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Categories */}
        <section aria-labelledby="cats-h" className="min-w-0">
          <h2 id="cats-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">Categories</h2>
          <ul className="card divide-y divide-line">
            {cats.order.map((c) => {
              const count = items.filter((i) => i.category_id === c.id).length;
              const active = c.id === catId && !mode && !q;
              return (
                <li key={c.id} ref={cats.rowRef(c.id)} className={`flex items-center gap-1 pr-2 ${cats.dragging === c.id ? "bg-crust" : ""} ${active ? "bg-pomodoro/5" : ""}`}>
                  <DragHandle {...cats.handleProps(c.id)} />
                  <button
                    type="button"
                    onClick={() => {
                      setCatId(c.id);
                      setMode(null);
                      setQ("");
                    }}
                    className={`min-h-12 flex-1 text-left text-sm ${active ? "font-bold text-pomodoro" : "font-semibold"} ${c.visible ? "" : "opacity-50"}`}
                  >
                    {tx(c.name, "en")} <span className="font-normal text-ink-soft">({count})</span>
                    {needsReview(c) ? <span className="ml-1 text-xs text-amber-700">• review</span> : null}
                  </button>
                  <Toggle checked={c.visible} label={`Show ${tx(c.name, "en")}`} disabled={busy} onChange={(v) => act(() => toggleAction("categories", c.id, "visible", v))} />
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-ink-soft">Drag ⋮⋮ to reorder. The switch hides a category from diners.</p>
          {reviewCats.length ? (
            <p className="mt-2 text-xs text-amber-800">Categories needing translation review: {reviewCats.map((c) => tx(c.name, "en")).join(", ")}</p>
          ) : null}
        </section>

        {/* Items */}
        <section aria-labelledby="items-h" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search all dishes"
              className="field max-w-xs flex-1"
              aria-label="Search all dishes"
            />
            <select className="field w-auto" value={mode ?? ""} onChange={(e) => setMode(e.target.value || null)} aria-label="Filter">
              <option value="">By category</option>
              <option value="allergens">Missing allergen info</option>
              <option value="review">Translation needs review</option>
            </select>
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="items-h" className="font-display text-xl font-semibold">
              {q ? `Results for “${q}”` : mode === "allergens" ? "Missing allergen info" : mode === "review" ? "Needs translation review" : tx(currentCat?.name, "en")}
            </h2>
            {currentCat && !q && !mode ? (
              <div className="flex gap-2">
                <Link href={`/admin/categories/${currentCat.id}`} className="btn-ghost">Edit category</Link>
                {listed.length === 0 ? (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => confirm(`Delete category “${tx(currentCat.name, "en")}”?`) && act(() => deleteCategoryAction(currentCat.id), "Category deleted")}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <ul className="space-y-2">
            {(sortableItems ? its.order : listed).map((item) => {
              const p = itemPrice(item);
              return (
                <li key={item.id} ref={its.rowRef(item.id)} className={`card flex items-center gap-2 p-2 ${its.dragging === item.id ? "ring-2 ring-pomodoro" : ""}`}>
                  {sortableItems ? <DragHandle {...its.handleProps(item.id)} /> : null}
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-crust">
                    {item.photos[0] ? <Image src={item.photos[0]} alt="" fill sizes="56px" className="object-cover" /> : null}
                  </div>
                  <Link href={`/admin/items/${item.id}`} className={`min-w-0 flex-1 ${item.visible ? "" : "opacity-50"}`}>
                    <p className="truncate font-semibold">
                      {item.featured ? "⭐ " : ""}
                      {tx(item.name, "en")}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {p.from ? "from " : ""}
                      {formatMoney(p.amount, "USD", "en")}
                      {!item.visible ? " · hidden" : ""}
                      {!item.allergens_set ? " · no allergen info" : ""}
                      {needsReview(item) ? " · review translation" : ""}
                    </p>
                  </Link>
                  <label className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-ink-soft">
                    <Toggle checked={item.sold_out} label={`Sold out: ${tx(item.name, "en")}`} disabled={busy} onChange={(v) => act(() => setSoldOutAction(item.id, v))} />
                    Sold out
                  </label>
                  <details className="relative">
                    <summary className="tap flex cursor-pointer list-none items-center justify-center rounded-lg text-xl text-ink-soft" aria-label="More actions">⋯</summary>
                    <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-line bg-white p-1 shadow-lg">
                      <Link href={`/admin/items/${item.id}`} className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-cream">✏️ Edit</Link>
                      <button type="button" className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm hover:bg-cream" onClick={() => act(() => toggleAction("items", item.id, "featured", !item.featured))}>
                        {item.featured ? "☆ Unmark featured" : "⭐ Mark featured"}
                      </button>
                      <button type="button" className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm hover:bg-cream" onClick={() => act(() => toggleAction("items", item.id, "visible", !item.visible))}>
                        {item.visible ? "🙈 Hide from menu" : "👁 Show on menu"}
                      </button>
                      <button type="button" className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm hover:bg-cream" onClick={() => act(() => duplicateItemAction(item.id), "Duplicated (hidden until you show it)")}>
                        ⧉ Duplicate
                      </button>
                      <label className="block px-3 py-2 text-xs text-ink-soft">
                        Move to
                        <select
                          className="field mt-1 py-1.5 text-sm"
                          value={item.category_id}
                          onChange={(e) => act(() => saveItemAction({ item: { ...item, category_id: e.target.value }, source: item.tr?.source ?? "en", touched: [] }), "Moved")}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{tx(c.name, "en")}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm text-red-700 hover:bg-red-50"
                        onClick={() => confirm(`Delete “${tx(item.name, "en")}”? This can't be undone.`) && act(() => deleteItemAction(item.id), "Deleted")}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
          {!listed.length ? <p className="card p-6 text-center text-ink-soft">No dishes here yet.</p> : null}
        </section>
      </div>
    </>
  );
}
