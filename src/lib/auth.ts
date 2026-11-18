import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USE_SUPABASE } from "./config";
import { userClient } from "./store/supabase";
import type { Role } from "./types";

export interface Session {
  userId: string;
  email: string;
  role: Role;
  mode: "supabase" | "local";
  mfaEnrolled?: boolean;
}

// ---------------------------------------------------------------- local demo mode
const LOCAL_COOKIE = "fm_admin";
const localSecret = () => process.env.LOCAL_AUTH_SECRET || "local-demo-secret-change-me";
export const localDemoAllowed = () => process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_DEMO === "1";

function sign(payload: string) {
  return createHmac("sha256", localSecret()).update(payload).digest("base64url");
}

export async function localSignIn(email: string, password: string): Promise<boolean> {
  const wantEmail = (process.env.LOCAL_ADMIN_EMAIL || "owner@demo.local").toLowerCase();
  const wantPass = process.env.LOCAL_ADMIN_PASSWORD || "fratellis-demo";
  const a = Buffer.from(password);
  const b = Buffer.from(wantPass);
  if (email.toLowerCase() !== wantEmail || a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const payload = Buffer.from(JSON.stringify({ email: wantEmail, exp: Date.now() + 7 * 864e5 })).toString("base64url");
  (await cookies()).set(LOCAL_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 86400,
  });
  return true;
}

async function localSession(): Promise<Session | null> {
  const raw = (await cookies()).get(LOCAL_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email: string; exp: number };
  if (data.exp < Date.now()) return null;
  return { userId: "local-owner", email: data.email, role: "owner", mode: "local" };
}

// ---------------------------------------------------------------- shared
export async function getSession(): Promise<Session | null> {
  if (!USE_SUPABASE) return localDemoAllowed() ? localSession() : null;
  const sb = await userClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await sb.from("profiles").select("role,email").eq("id", data.user.id).maybeSingle();
  return {
    userId: data.user.id,
    email: data.user.email ?? profile?.email ?? "",
    role: (profile?.role as Role) ?? "staff",
    mode: "supabase",
    mfaEnrolled: (data.user.factors ?? []).some((f) => f.status === "verified"),
  };
}

/** Redirects to sign-in (or MFA challenge) unless the user has one of the roles. */
export async function requireRole(roles: Role[] = ["owner", "manager", "staff"]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.mode === "supabase") {
    const sb = await userClient();
    const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data && data.nextLevel === "aal2" && data.currentLevel !== "aal2") redirect("/admin/mfa");
  }
  if (!roles.includes(session.role)) redirect(session.role === "staff" ? "/admin/sold-out" : "/admin");
  return session;
}

export async function signOutAll() {
  if (USE_SUPABASE) await (await userClient()).auth.signOut();
  (await cookies()).delete(LOCAL_COOKIE);
}

export const EDITORS: Role[] = ["owner", "manager"];
export const OWNER: Role[] = ["owner"];
