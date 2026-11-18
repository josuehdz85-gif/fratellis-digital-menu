"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadPhotoAction } from "@/app/admin/actions";
import { useToast } from "./ui";

/** Crops to the standard ratio, resizes and converts to WebP in the browser before upload. */
async function prepare(file: File, ratio: number, maxW: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions).catch(() =>
    createImageBitmap(file),
  );
  const srcRatio = bitmap.width / bitmap.height;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (srcRatio > ratio) sw = Math.round(sh * ratio);
  else sh = Math.round(sw / ratio);
  const sx = Math.round((bitmap.width - sw) / 2);
  const sy = Math.round((bitmap.height - sh) / 2);
  const w = Math.min(maxW, sw);
  const h = Math.round(w / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.82));
  if (blob && blob.type === "image/webp") return blob;
  // Older Safari can't encode WebP: fall back to JPEG.
  return (await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85)))!;
}

export function PhotoUploader({
  photos,
  onChange,
  max = 5,
  ratio = 4 / 3,
  folder = "items",
  label = "Photos",
}: {
  photos: string[];
  onChange: (p: string[]) => void;
  max?: number;
  ratio?: number;
  folder?: string;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, max - photos.length)) {
        if (!file.type.startsWith("image/")) {
          toast("error", `${file.name} is not an image.`);
          continue;
        }
        const blob = await prepare(file, ratio, 1600);
        const fd = new FormData();
        fd.append("file", blob, file.name.replace(/\.\w+$/, blob.type === "image/webp" ? ".webp" : ".jpg"));
        fd.append("folder", folder);
        const r = await uploadPhotoAction(fd);
        if (r.ok && r.data) added.push(r.data);
        else if (!r.ok) toast("error", r.error);
      }
      if (added.length) onChange([...photos, ...added]);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <span className="label">{label} <span className="font-normal text-ink-soft">({photos.length}/{max}, first one is the cover)</span></span>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {photos.map((src, i) => (
          <li key={src + i} className="relative overflow-hidden rounded-lg border border-line bg-crust" style={{ aspectRatio: String(ratio) }}>
            <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="h-8 w-8 rounded text-white disabled:opacity-30" aria-label="Move left">◀</button>
              <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} className="h-8 w-8 rounded text-white" aria-label="Remove photo">✕</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="h-8 w-8 rounded text-white disabled:opacity-30" aria-label="Move right">▶</button>
            </div>
          </li>
        ))}
        {photos.length < max ? (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-line text-sm font-semibold text-ink-soft hover:border-pomodoro hover:text-pomodoro"
              style={{ aspectRatio: String(ratio) }}
            >
              {busy ? "Uploading…" : <><span className="text-2xl">＋</span>Add photo</>}
            </button>
          </li>
        ) : null}
      </ul>
      <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => upload(e.target.files)} />
      <p className="mt-1 text-xs text-ink-soft">Take a photo or pick from your gallery. It is cropped to a standard shape and compressed automatically.</p>
    </div>
  );
}
