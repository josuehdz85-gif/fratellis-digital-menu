"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dict, fmt } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  href: string | null;
}

export function BannerCarousel({ slides, lang }: { slides: Slide[]; lang: Lang }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const t = dict(lang);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + slides.length) % slides.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => go(index + 1), 5500);
    return () => clearInterval(id);
  });

  if (!slides.length) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.todaysSpecials}
      className="relative -mx-4 sm:mx-0"
      onPointerDown={() => setPaused(true)}
      onFocus={() => setPaused(true)}
    >
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-card">
        {slides.map((s, i) => {
          const body = (
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-chianti sm:aspect-[21/9]">
              <Image
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 640px) 100vw, 768px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 pb-8 text-white">
                <h2 className="font-display text-2xl font-semibold leading-tight drop-shadow sm:text-3xl">{s.title}</h2>
                {s.subtitle ? <p className="mt-1 max-w-md text-sm text-white/90">{s.subtitle}</p> : null}
              </div>
            </div>
          );
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={fmt(t.slide, { i: i + 1 })}
              className="w-full shrink-0 snap-center"
            >
              {s.href ? (
                s.href.startsWith("http") ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer">{body}</a>
                ) : (
                  <Link href={s.href}>{body}</Link>
                )
              ) : (
                body
              )}
            </div>
          );
        })}
      </div>
      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setPaused(true);
                go(i);
              }}
              aria-label={fmt(t.slide, { i: i + 1 })}
              aria-current={i === index ? "true" : undefined}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span className={`block h-2 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-2 bg-white/60"}`} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
