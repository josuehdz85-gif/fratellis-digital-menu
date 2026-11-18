import "server-only";
import { USE_SUPABASE } from "../config";
import { localStore } from "./local";
import { anonClient, serviceClient, supabaseStore, userClient } from "./supabase";
import type { Store } from "./types";

export type { Store } from "./types";

/** Read-only public data (what diners see). */
export function publicStore(): Store {
  return USE_SUPABASE ? supabaseStore(anonClient()) : localStore;
}

/** Acting as the signed-in admin; RLS enforces their role. */
export async function adminStore(): Promise<Store> {
  return USE_SUPABASE ? supabaseStore(await userClient()) : localStore;
}

/** Privileged background jobs (exchange-rate refresh). Null when no secret key is configured. */
export function systemStore(): Store | null {
  if (!USE_SUPABASE) return localStore;
  const c = serviceClient();
  return c ? supabaseStore(c) : null;
}
