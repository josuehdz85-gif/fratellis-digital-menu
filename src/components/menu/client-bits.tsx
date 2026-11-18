"use client";

import { useEffect, useState } from "react";
import { dict, fmt, LANG_META } from "@/lib/i18n";
import { formatTime, nowIn, openState, withinHours } from "@/lib/time";
import type { EventType, HoursRule, Lang } from "@/lib/types";
import { usePrefs } from "./prefs";

/** Live "Open now / Closed" badge computed in the restaurant's time zone. */
export function OpenStatus({ hours, timeZone, lang }: { hours: HoursRule[]; timeZone: string; lang: Lang }) {
  const [label, setLabel] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => {
    const t = dict(lang);
    const loc = LANG_META[lang].locale;
    const update = () => {
      const s = openState(hours, nowIn(timeZone));
      if (s.open) setLabel({ open: true, text: fmt(t.openNow, { time: formatTime(s.until, loc) }) });
      else if (s.at) {
        const day = s.nextDay === "today" ? t.today : s.nextDay === "tomorrow" ? t.tomorrow : t.days[s.nextDay as number];
        setLabel({ open: false, text: `${t.closedNow} · ${fmt(t.opensAt, { day, time: formatTime(s.at, loc) })}` });
      } else setLabel({ open: false, text: t.closedNow });
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [hours, timeZone, lang]);
  if (!label) return <span className="inline-block h-7" />;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
        label.open ? "bg-basil/10 text-basil" : "bg-ink/5 text-ink-soft"
      }`}
    >
      <span aria-hidden className={`size-2 rounded-full ${label.open ? "bg-basil" : "bg-ink-soft/60"}`} />
      {label.text}
    </span>
  );
}

/** Badge for categories that are only served at certain hours. */
export function HoursNote({ from, to, timeZone, lang }: { from: string; to: string; timeZone: string; lang: Lang }) {
  const [available, setAvailable] = useState(true);
  useEffect(() => setAvailable(withinHours(from, to, nowIn(timeZone))), [from, to, timeZone]);
  const t = dict(lang);
  const loc = LANG_META[lang].locale;
  return (
    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${available ? "bg-crust text-ink" : "bg-ink text-white"}`}>
      🕒 {fmt(t.availableHours, { from: formatTime(from, loc), to: formatTime(to, loc) })}
      {!available ? ` · ${t.notAvailableNow}` : ""}
    </p>
  );
}

/** Cookie-free usage event (no personal data). */
export function Track({ type, refId }: { type: EventType; refId?: string }) {
  const { lang, currency } = usePrefs();
  useEffect(() => {
    const key = `fm_t_${type}_${refId ?? ""}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    const body = JSON.stringify({ type, ref: refId ?? null, lang, currency });
    try {
      if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) {
        fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
      }
    } catch {
      /* ignore */
    }
  }, [type, refId, lang, currency]);
  return null;
}

/** Registers the service worker (offline menu) and shows an offline notice. */
export function PwaBits({ lang }: { lang: Lang }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const on = () => setOffline(!navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="bg-ink px-4 py-2 text-center text-sm text-white">
      {dict(lang).offline}
    </div>
  );
}
