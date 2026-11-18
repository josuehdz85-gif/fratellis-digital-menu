import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { TableName } from "../types";
import { SUPABASE_PUBLIC_KEY, SUPABASE_SECRET_KEY, SUPABASE_URL, STORAGE_BUCKET } from "../config";
import { keyOf, type ListOptions, type Row, type Store } from "./types";

/** Client with no user session: what diners see (RLS: public read only). */
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client acting as the signed-in admin user (RLS applies with their role). */
export async function userClient(): Promise<SupabaseClient> {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // called from a Server Component: the proxy refreshes the session instead
        }
      },
    },
  });
}

/** Server-only client that bypasses RLS. Used for the rate refresh job and team invites. */
export function serviceClient(): SupabaseClient | null {
  if (!SUPABASE_SECRET_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fail(table: string, error: { message: string } | null): never {
  throw new Error(`Supabase ${table}: ${error?.message ?? "unknown error"}`);
}

export function supabaseStore(client: SupabaseClient): Store {
  return {
    kind: "supabase",

    async list<T extends TableName>(table: T, opts: ListOptions = {}) {
      let q = client.from(table).select("*");
      if (opts.since) q = q.gte("created_at", opts.since);
      if (opts.order) {
        const desc = opts.order.startsWith("-");
        q = q.order(desc ? opts.order.slice(1) : opts.order, { ascending: !desc });
      }
      q = q.limit(opts.limit ?? 10000);
      const { data, error } = await q;
      if (error) fail(table, error);
      return (data ?? []) as Row<T>[];
    },

    async get<T extends TableName>(table: T, id: string | number) {
      const { data, error } = await client.from(table).select("*").eq(keyOf(table), id).maybeSingle();
      if (error) fail(table, error);
      return (data ?? null) as Row<T> | null;
    },

    async insert<T extends TableName>(table: T, row: Partial<Row<T>>) {
      const { data, error } = await client.from(table).insert(row as never).select().single();
      if (error) fail(table, error);
      return data as Row<T>;
    },

    async update<T extends TableName>(table: T, id: string | number, patch: Partial<Row<T>>) {
      const { data, error } = await client.from(table).update(patch as never).eq(keyOf(table), id).select().single();
      if (error) fail(table, error);
      return data as Row<T>;
    },

    async upsert<T extends TableName>(table: T, rows: Partial<Row<T>>[]) {
      if (!rows.length) return;
      const { error } = await client.from(table).upsert(rows as never, { onConflict: keyOf(table) });
      if (error) fail(table, error);
    },

    async remove<T extends TableName>(table: T, id: string | number) {
      const { error } = await client.from(table).delete().eq(keyOf(table), id);
      if (error) fail(table, error);
    },

    async incrementScan(code: string) {
      const { data, error } = await client.rpc("increment_scan", { p_code: code });
      if (error) return false;
      return Boolean(data);
    },

    async upload(path: string, data: Blob, contentType: string) {
      const { error } = await client.storage
        .from(STORAGE_BUCKET)
        .upload(path, data, { contentType, upsert: false, cacheControl: "31536000" });
      if (error) fail("storage", error);
      return client.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
    },
  };
}
