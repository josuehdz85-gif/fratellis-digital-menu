"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { dict, fmt } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/** Swipeable photos on the item page. */
export function PhotoCarousel({ photos, alt, lang, soldOut }: { photos: string[]; alt: string; lang: Lang; soldOut?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const t = dict(lang);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!photos.length) {
    return (
      <div className="gingham -mx-4 flex aspect-[4/3] items-center justify-center sm:mx-0 sm:rounded-card">
        <span className="rounded-full bg-white/90 px-4 py-2 font-display text-lg text-pomodoro shadow-card">Fratelli&apos;s</span>
      </div>
    );
  }

  return (
    <div className="relative -mx-4 sm:mx-0">
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-card" aria-label={t.photos}>
        {photos.map((src, i) => (
          <div key={src + i} className="relative aspect-[4/3] w-full shrink-0 snap-center bg-crust">
            <Image
              src={src}
              alt={photos.length > 1 ? `${alt} – ${fmt(t.photoOf, { i: i + 1, n: photos.length })}` : alt}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 768px"
              className={`object-cover ${soldOut ? "grayscale" : ""}`}
            />
          </div>
        ))}
      </div>
      {photos.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
          {photos.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-2 bg-white/60"}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
