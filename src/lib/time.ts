import type { HoursRule } from "./types";

export interface ZonedNow {
  day: number; // 0 = Sunday
  minutes: number; // minutes since midnight
  date: string; // YYYY-MM-DD in the restaurant's time zone
}

export function nowIn(timeZone: string, at: Date = new Date()): ZonedNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: days.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export function formatTime(hhmm: string, locale: string) {
  const mins = toMinutes(hhmm);
  const d = new Date(Date.UTC(2000, 0, 1, Math.floor(mins / 60), mins % 60));
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(d);
}

export function hoursForDay(hours: HoursRule[], day: number): HoursRule | undefined {
  return hours.find((h) => h.days.includes(day));
}

export type OpenState =
  | { open: true; until: string }
  | { open: false; nextDay: "today" | "tomorrow" | number; at: string }
  | { open: false; nextDay: null; at: null };

export function openState(hours: HoursRule[], now: ZonedNow): OpenState {
  const today = hoursForDay(hours, now.day);
  if (today) {
    const o = toMinutes(today.open);
    const c = toMinutes(today.close);
    if (now.minutes >= o && now.minutes < c) return { open: true, until: today.close };
    if (now.minutes < o) return { open: false, nextDay: "today", at: today.open };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (now.day + i) % 7;
    const h = hoursForDay(hours, d);
    if (h) return { open: false, nextDay: i === 1 ? "tomorrow" : d, at: h.open };
  }
  return { open: false, nextDay: null, at: null };
}

/** Is a category with optional hours available right now? */
export function withinHours(from: string | null, to: string | null, now: ZonedNow): boolean {
  if (!from || !to) return true;
  const f = toMinutes(from);
  const t = toMinutes(to);
  return f <= t ? now.minutes >= f && now.minutes < t : now.minutes >= f || now.minutes < t;
}
