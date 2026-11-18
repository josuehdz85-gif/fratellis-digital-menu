"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { LANG_META } from "@/lib/i18n";
import type { I18n, Lang, TrMeta, TrStatus } from "@/lib/types";

// ---------------------------------------------------------------- toasts
type Toast = { id: number; kind: "ok" | "error" | "warn"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "ok" ? 2500 : 7000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
              t.kind === "ok" ? "bg-basil text-white" : t.kind === "warn" ? "bg-amber-100 text-amber-900" : "bg-red-700 text-white"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/** Runs a server action, shows a toast for the result, returns the result. */
export function useRun() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <R extends { ok: boolean; error?: string; warning?: string }>(fn: () => Promise<R>, okText?: string): Promise<R | null> => {
      setBusy(true);
      try {
        const r = await fn();
        if (!r.ok) toast("error", r.error ?? "Something went wrong");
        else {
          if (r.warning) toast("warn", r.warning);
          if (okText) toast("ok", okText);
        }
        return r;
      } catch (e) {
        toast("error", (e as Error).message);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { run, busy };
}

// ---------------------------------------------------------------- toggle
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? "bg-basil" : "bg-ink/20"}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

// ---------------------------------------------------------------- translation editing
const STATUS_LABEL: Record<TrStatus, { text: string; cls: string }> = {
  source: { text: "Original", cls: "bg-ink/10 text-ink" },
  auto: { text: "Auto", cls: "bg-blue-100 text-blue-800" },
  edited: { text: "Edited", cls: "bg-basil/15 text-basil" },
  review: { text: "Needs review", cls: "bg-amber-100 text-amber-900" },
};

export function StatusBadge({ status }: { status?: TrStatus }) {
  if (!status) return <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">New</span>;
  const s = STATUS_LABEL[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.text}</span>;
}

export interface TrState {
  source: Lang;
  view: Lang;
  touched: Lang[];
  langs: Lang[];
  status: TrMeta["status"];
}

export function useTr(langs: Lang[], tr: TrMeta | undefined, fallback: Lang) {
  const source = tr?.source && langs.includes(tr.source) ? tr.source : fallback;
  const [state, setState] = useState<TrState>({ source, view: source, touched: [], langs, status: tr?.status ?? {} });
  const touch = useCallback(
    (lang: Lang) => setState((s) => (lang === s.source || s.touched.includes(lang) ? s : { ...s, touched: [...s.touched, lang] })),
    [],
  );
  return { tr: state, setTr: setState, touch };
}

/** Language tabs for an editor: which language you are viewing and which one you write in. */
export function LangTabs({ tr, setTr }: { tr: TrState; setTr: (fn: (s: TrState) => TrState) => void }) {
  return (
    <div className="card flex flex-wrap items-center gap-3 p-3">
      <div role="tablist" aria-label="Language" className="flex gap-1 rounded-lg bg-cream p-1">
        {tr.langs.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={tr.view === l}
            onClick={() => setTr((s) => ({ ...s, view: l }))}
            className={`flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold ${tr.view === l ? "bg-white shadow" : "text-ink-soft"}`}
          >
            {LANG_META[l].short}
            <StatusBadge status={tr.touched.includes(l) ? "edited" : l === tr.source ? "source" : tr.status[l]} />
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-soft">I write in</span>
        <select
          className="field w-auto py-1.5"
          value={tr.source}
          onChange={(e) => {
            const v = e.target.value as Lang;
            setTr((s) => ({ ...s, source: v, view: v, touched: s.touched.filter((x) => x !== v) }));
          }}
        >
          {tr.langs.map((l) => (
            <option key={l} value={l}>{LANG_META[l].label}</option>
          ))}
        </select>
      </label>
      <p className="w-full text-xs text-ink-soft">
        Write in your language; the others are translated when you save. Fix any translation by hand in its tab — it is then locked
        and marked “Needs review” if you change the original later.
      </p>
    </div>
  );
}

/** A text input bound to one language of an I18n value. */
export function TrInput({
  value,
  onChange,
  tr,
  touch,
  label,
  multiline,
  placeholder,
  required,
}: {
  value: I18n | undefined;
  onChange: (v: I18n) => void;
  tr: TrState;
  touch: (l: Lang) => void;
  label?: string;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const v = value?.[tr.view] ?? "";
  const hint = tr.view !== tr.source && !v ? value?.[tr.source] : undefined;
  const set = (text: string) => {
    if (tr.view !== tr.source) touch(tr.view);
    onChange({ ...(value ?? {}), [tr.view]: text });
  };
  const common = {
    value: v,
    placeholder: hint ? `(translated on save) ${hint}` : placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(e.target.value),
    className: "field",
    lang: tr.view,
    required: required && tr.view === tr.source,
  };
  const input = multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />;
  if (!label) return input;
  return (
    <label className="block">
      <span className="label">
        {label} <span className="font-normal text-ink-soft">({LANG_META[tr.view].short})</span>
      </span>
      {input}
    </label>
  );
}

// ---------------------------------------------------------------- sortable list (mouse + touch)
export function useSortable<T extends { id: string }>(items: T[], onDrop: (next: T[]) => void) {
  const [order, setOrder] = useState(items);
  const [dragging, setDragging] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLElement>());
  useEffect(() => setOrder(items), [items]);

  const handleProps = (id: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(id);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (dragging !== id) return;
      const y = e.clientY;
      setOrder((cur) => {
        const from = cur.findIndex((x) => x.id === id);
        let to = from;
        cur.forEach((x, i) => {
          const el = refs.current.get(x.id);
          if (!el || x.id === id) return;
          const r = el.getBoundingClientRect();
          if (i < from && y < r.top + r.height / 2) to = Math.min(to, i);
          if (i > from && y > r.top + r.height / 2) to = Math.max(to, i);
        });
        if (to === from) return cur;
        const next = [...cur];
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        return next;
      });
    },
    onPointerUp: () => {
      if (dragging !== id) return;
      setDragging(null);
      setOrder((cur) => {
        if (cur.map((x) => x.id).join() !== items.map((x) => x.id).join()) onDrop(cur);
        return cur;
      });
    },
    style: { touchAction: "none" as const, cursor: "grab" },
    "aria-label": "Drag to reorder",
  });

  const move = (id: string, dir: -1 | 1) => {
    const i = order.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    onDrop(next);
  };

  const rowRef = (id: string) => (el: HTMLElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  };

  return { order, dragging, handleProps, move, rowRef };
}

export function DragHandle(props: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className="flex h-11 w-8 shrink-0 items-center justify-center text-ink-soft">
      <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden>
        {[3, 10, 17].map((y) => [4, 10].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
      </svg>
    </button>
  );
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-2xl font-semibold md:text-3xl">{title}</h1>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
