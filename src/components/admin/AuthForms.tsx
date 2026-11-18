"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Result } from "@/app/admin/actions";

type Action = (prev: unknown, form: FormData) => Promise<Result>;

export function AuthForm({
  action,
  fields,
  submit,
  done,
  footer,
}: {
  action: Action;
  fields: { name: string; label: string; type: string; autoComplete?: string; inputMode?: "numeric" }[];
  submit: string;
  done?: string;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null as Result | null);
  if (state?.ok && done) return <p className="rounded-lg bg-basil/10 p-4 text-sm text-basil">{done}</p>;
  return (
    <form action={formAction} className="space-y-4">
      {fields.map((f) => (
        <label key={f.name} className="block">
          <span className="label">{f.label}</span>
          <input
            name={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            inputMode={f.inputMode}
            required
            className="field"
          />
        </label>
      ))}
      {state && !state.ok ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p> : null}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : submit}</button>
      {footer}
    </form>
  );
}

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="gingham flex min-h-dvh items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6">
        <p className="text-center font-display text-sm uppercase tracking-widest text-pomodoro">Menu admin</p>
        <h1 className="mb-5 mt-1 text-center font-display text-2xl font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function BackToLogin() {
  return (
    <p className="text-center text-sm">
      <Link href="/admin/login" className="font-semibold text-pomodoro">Back to sign in</Link>
    </p>
  );
}
