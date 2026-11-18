// Loads data/seed.json into Supabase. Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
// Run after supabase/schema.sql:   npm run seed:supabase
// Pass --force to replace an existing menu.
import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
const force = process.argv.includes("--force");
const db = createClient(url, key, { auth: { persistSession: false } });
const seed = JSON.parse(readFileSync("data/seed.json", "utf8"));

const { count } = await db.from("items").select("id", { count: "exact", head: true });
if (count && !force) {
  console.error(`The database already has ${count} items. Re-run with --force to replace the menu.`);
  process.exit(1);
}
if (force) {
  for (const t of ["specials", "items", "categories", "banners", "tables"]) {
    const { error } = await db.from(t).delete().not("id", "is", null);
    if (error) throw new Error(`${t}: ${error.message}`);
  }
}

const strip = (rows) => rows.map(({ created_at, updated_at, ...r }) => r);
for (const t of ["restaurant", "categories", "items", "banners", "specials", "rates", "tables"]) {
  const rows = strip(seed[t] ?? []);
  if (!rows.length) continue;
  const { error } = await db.from(t).upsert(rows, { onConflict: t === "rates" ? "currency" : "id" });
  if (error) throw new Error(`${t}: ${error.message}`);
  console.log(`${t}: ${rows.length}`);
}
console.log("Done. Now create the owner account: open /admin/login and use “Create the owner account”, or invite from the Supabase dashboard.");
