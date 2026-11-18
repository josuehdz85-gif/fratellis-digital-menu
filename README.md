# Fratelli's Digital Menu

Mobile-first QR menu with an owner dashboard. Built from `PRD — Digital Menu Web App.md`.
Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Vercel.

> **Keep this folder off Google Drive.** npm can't install into the Drive virtual filesystem (EBADF errors).
> Back the code up with Git/GitHub instead (Vercel deploys from GitHub anyway).

## Run it locally (no keys needed)

```bash
npm install
npm run dev
```

- Diner menu: http://localhost:3000 (redirects to `/en` or `/es` from the phone's language)
- Admin: http://localhost:3000/admin — in **local demo mode** sign in with `LOCAL_ADMIN_EMAIL` / `LOCAL_ADMIN_PASSWORD`
  from `.env.example` (override them in `.env.local`).

With no Supabase keys the app stores everything in `data/local-db.json` (created from `data/seed.json`) and
uploaded photos in `data/uploads/`. `npm run seed:local` resets the demo data.

## Go live (Supabase + Vercel)

1. **Supabase** → create a project → SQL Editor → paste and run `supabase/schema.sql`.
2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`.
3. `npm run seed:supabase` — loads the Fratelli's menu (12 categories, 145 dishes, banners, 13 table QR codes).
4. `npm run dev`, open `/admin/login` → **Create the owner account** (only shown while no account exists).
5. Supabase → Authentication → URL Configuration: set **Site URL** to your domain and add
   `https://YOUR-DOMAIN/admin/auth/callback` to Redirect URLs (password reset and invites).
6. Push to GitHub → import in Vercel → add the same env vars + `NEXT_PUBLIC_SITE_URL` + `CRON_SECRET` +
   `ANTHROPIC_API_KEY` → deploy → add the custom domain.
7. Print QR codes from Admin → QR codes **after** `NEXT_PUBLIC_SITE_URL` points at the real domain.

## How it works

| Area | Where |
| --- | --- |
| Public pages (`/[lang]`, `/[lang]/c/[slug]`, `/[lang]/i/[slug]`, search, specials) | `src/app/(public)/[lang]` |
| Admin (dashboard, menu, dish editor, sold out, specials, banners, QR, insights, settings, team) | `src/app/admin` + `src/components/admin` |
| Data access (Supabase or local JSON, same interface) | `src/lib/store` |
| Auto-translation (Claude, or DeepL) with locked hand edits and "needs review" | `src/lib/translate.ts` |
| Exchange rates (open.er-api.com free feed, or Open Exchange Rates) | `src/lib/rates.ts`, `/api/cron/rates` |
| Interface text (not AI) | `src/i18n/en.json`, `src/i18n/es.json` |
| Database, roles, row-level security, storage bucket | `supabase/schema.sql` |
| Starting menu | `scripts/menu-source.mjs` → `npm run seed:build` → `data/seed.json` |

- **Live within a minute:** pages are pre-rendered and refreshed every 60 s; every admin save also refreshes them immediately.
- **Prices** are stored once in the base currency. Other currencies are display-only, rounded for MXN/JPY/etc., with an
  "approximate price" note. Rates refresh every few hours in the background (plus a daily Vercel cron); a manual rate always wins;
  a currency disappears from the selector if its rate is older than the limit in Settings.
- **Allergens:** a dish without allergen info says "ask your server" and is hidden by the diner's allergy filter.
  Seed data has **no allergens filled in** on purpose — the restaurant must enter them.
- **Roles:** Owner (everything), Manager (menu, specials, banners, QR), Staff (sold out only — also enforced in the database).
- **Adding a language later:** add the code to `LANGS` in `src/lib/types.ts`, add `src/i18n/<code>.json` and an entry in
  `LANG_META` (`src/lib/i18n.ts`), then enable it in Settings.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | Type-check |
| `npm run seed:build` | Rebuild `data/seed.json` from `scripts/menu-source.mjs` |
| `npm run seed:local` | Reset local demo data |
| `npm run seed:supabase` | Load the seed into Supabase (`-- --force` replaces an existing menu) |
