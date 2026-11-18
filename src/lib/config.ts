export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** With no Supabase keys the app runs in "local demo" mode on a JSON file. */
export const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const STORAGE_BUCKET = "menu";

/** Public pages are regenerated at most this often (seconds); admin saves also revalidate instantly. */
export const REVALIDATE_SECONDS = 60;
