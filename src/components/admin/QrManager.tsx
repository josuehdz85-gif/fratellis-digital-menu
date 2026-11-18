"use client";

import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TableQR } from "@/lib/types";
import { createTableAction, deleteRowAction } from "@/app/admin/actions";
import { PageTitle, useRun } from "./ui";

/** Draws a QR with the restaurant logo in the middle (high error correction keeps it scannable). */
async function drawQr(canvas: HTMLCanvasElement, url: string, logo: string | null, size = 600) {
  await QRCode.toCanvas(canvas, url, { errorCorrectionLevel: "H", margin: 2, width: size, color: { dark: "#24160f", light: "#ffffff" } });
  canvas.style.width = "";
  canvas.style.height = "";
  if (!logo) return;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = logo;
  await img.decode().catch(() => undefined);
  if (!img.naturalWidth) return;
  const ctx = canvas.getContext("2d")!;
  const box = size * 0.26;
  const x = (size - box) / 2;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(x - 6, x - 6, box + 12, box + 12, 12);
  ctx.fill();
  const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
}

function QrCard({ table, siteUrl, logo, onDelete }: { table: TableQR; siteUrl: string; logo: string | null; onDelete: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const url = `${siteUrl}/t/${table.code}`;
  useEffect(() => {
    if (ref.current) drawQr(ref.current, url, logo);
  }, [url, logo]);
  const download = () => {
    const a = document.createElement("a");
    a.href = ref.current!.toDataURL("image/png");
    a.download = `qr-${table.code}.png`;
    a.click();
  };
  return (
    <li className="card flex flex-col items-center p-3 text-center">
      <canvas ref={ref} className="h-auto w-full max-w-[180px]" aria-label={`QR code for ${table.label}`} />
      <p className="mt-2 font-semibold">{table.label}</p>
      <p className="text-xs text-ink-soft">{table.scans} scans</p>
      <p className="mt-1 break-all text-[11px] text-ink-soft">{url}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        <button type="button" className="btn-ghost" onClick={download}>PNG</button>
        <a className="btn-ghost" href={`/admin/qr/pdf?format=tent&ids=${table.id}`} target="_blank">PDF</a>
        <button type="button" className="btn-danger" aria-label={`Delete ${table.label}`} onClick={onDelete}>🗑</button>
      </div>
    </li>
  );
}

export function QrManager({ tables, siteUrl, logo, name }: { tables: TableQR[]; siteUrl: string; logo: string | null; name: string }) {
  const router = useRouter();
  const { run, busy } = useRun();
  const [label, setLabel] = useState("");
  return (
    <>
      <PageTitle title="QR codes">
        <a className="btn-ghost" href="/admin/qr/pdf?format=tent" target="_blank">🖨 Table tents (PDF)</a>
        <a className="btn-ghost" href="/admin/qr/pdf?format=sticker" target="_blank">🖨 Stickers (PDF)</a>
      </PageTitle>
      <p className="mb-4 text-sm text-ink-soft">
        Each code opens {name}&apos;s menu in the diner&apos;s language and counts scans per table. Use “Whole restaurant” for the door or
        window; one code per table is ready for table ordering later.
      </p>
      {siteUrl.includes("localhost") ? (
        <p className="mb-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">These codes point to {siteUrl}. Set NEXT_PUBLIC_SITE_URL to your real domain before printing.</p>
      ) : null}
      <form
        className="mb-5 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await run(() => createTableAction(label), "QR code added");
          if (r?.ok) {
            setLabel("");
            router.refresh();
          }
        }}
      >
        <input className="field max-w-xs" placeholder="e.g. Table 13 or Patio 2" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="New table name" />
        <button className="btn-primary" disabled={busy}>＋ Add</button>
      </form>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tables.map((t) => (
          <QrCard
            key={t.id}
            table={t}
            siteUrl={siteUrl}
            logo={logo}
            onDelete={async () => {
              if (!confirm(`Delete the QR code for ${t.label}? Printed copies will stop counting scans (they still open the menu home page).`)) return;
              await run(() => deleteRowAction("tables", t.id), "Deleted");
              router.refresh();
            }}
          />
        ))}
      </ul>
    </>
  );
}
