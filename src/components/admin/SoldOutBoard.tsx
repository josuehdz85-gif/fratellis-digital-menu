"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { tx } from "@/lib/i18n";
import type { Category, Item } from "@/lib/types";
import { setSoldOutAction } from "@/app/admin/actions";
import { PageTitle, Toggle, useRun } from "./ui";

/** Fast screen for service: flip dishes sold out / back in stock. */
export function SoldOutBoard({ categories, items }: { categories: Category[]; items: Item[] }) {
  const router = useRouter();
  const { run } = useRun();
  const [q, setQ] = useState("");
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const term = q.trim().toLowerCase();
  const soldOut = (i: Item) => local[i.id] ?? i.sold_out;

  const flip = async (i: Item, v: boolean) => {
    setLocal((l) => ({ ...l, [i.id]: v }));
    const r = await run(() => setSoldOutAction(i.id, v), v ? `${tx(i.name, "en")} marked sold out` : `${tx(i.name, "en")} is back`);
    if (!r?.ok) setLocal((l) => ({ ...l, [i.id]: !v }));
    router.refresh();
  };

  const out = items.filter(soldOut);
  return (
    <>
      <PageTitle title="Sold out" />
      <p className="mb-3 text-sm text-ink-soft">Changes show on the public menu within a minute.</p>
      <input type="search" className="field mb-4" placeholder="Find a dish" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a dish" />
      {out.length && !term ? (
        <section className="card mb-5 border-pomodoro/30 p-3">
          <h2 className="px-1 font-semibold text-pomodoro">Sold out now ({out.length})</h2>
          <ul>
            {out.map((i) => (
              <li key={i.id} className="flex min-h-12 items-center justify-between gap-3 px-1">
                <span className="text-sm font-semibold">{tx(i.name, "en")}</span>
                <button type="button" className="btn-ghost" onClick={() => flip(i, false)}>Back in stock</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {categories.map((c) => {
        const list = items.filter((i) => i.category_id === c.id && (!term || `${i.name.en} ${i.name.es}`.toLowerCase().includes(term)));
        if (!list.length) return null;
        return (
          <section key={c.id} className="mb-4">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink-soft">{tx(c.name, "en")}</h2>
            <ul className="card divide-y divide-line">
              {list.map((i) => (
                <li key={i.id} className="flex min-h-12 items-center justify-between gap-3 px-3">
                  <span className={`text-sm ${soldOut(i) ? "font-semibold text-pomodoro line-through" : ""}`}>{tx(i.name, "en")}</span>
                  <Toggle checked={soldOut(i)} onChange={(v) => flip(i, v)} label={`Sold out: ${tx(i.name, "en")}`} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
