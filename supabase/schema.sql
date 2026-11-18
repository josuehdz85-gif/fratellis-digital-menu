-- Fratelli's Digital Menu — Supabase schema
-- Run once in the Supabase SQL editor (or `supabase db push`), then run `npm run seed:supabase`.
-- One Supabase project per restaurant is recommended; the script is also safe in a project shared
-- with another app (all functions/triggers are prefixed menu_, and admin roles are opt-in).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- roles
-- Menu admin access lives in profiles.role. It is OPT-IN: a user with no role (for example a
-- user of another app sharing this Supabase project) has no access to the menu admin.
-- Roles are only ever set by the app (owner setup, Team page), never automatically on sign-up.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text check (role in ('owner','manager','staff')),
  created_at timestamptz not null default now()
);

-- If the project already had a "profiles" table (many Supabase templates create one),
-- add the columns this app needs instead of failing.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles alter column role drop not null;
alter table public.profiles alter column role drop default;
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('owner','manager','staff'));
  end if;
  -- Before an owner exists, nobody should hold a menu role (undoes the old 'staff' default).
  if not exists (select 1 from public.profiles where role = 'owner') then
    update public.profiles set role = null where role is not null;
  end if;
end $$;

create or replace function public.menu_my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.menu_is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('owner','manager') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.menu_is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'owner' from public.profiles where id = auth.uid()), false)
$$;

-- Only the menu owner (or the server with the secret key / SQL editor) may set or change a menu role.
-- This matters when another app lets users edit their own profiles row.
create or replace function public.menu_guard_role() returns trigger
language plpgsql set search_path = public as $$
begin
  if (tg_op = 'INSERT' and new.role is not null) or (tg_op = 'UPDATE' and new.role is distinct from old.role) then
    if current_user in ('anon', 'authenticated') and not public.menu_is_owner() then
      raise exception 'Only the menu owner can change menu admin roles';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists menu_guard_role on public.profiles;
create trigger menu_guard_role before insert or update on public.profiles
  for each row execute function public.menu_guard_role();

-- Earlier versions of this script added a sign-up trigger; it is no longer used.
drop trigger if exists menu_on_auth_user_created on auth.users;
drop function if exists public.menu_handle_new_user();

-- ---------------------------------------------------------------- menu
create table if not exists public.restaurant (
  id int primary key default 1 check (id = 1),
  name text not null,
  tagline jsonb not null default '{}',
  logo_url text,
  brand_primary text not null default '#b8262b',
  brand_accent text not null default '#2f6b2f',
  base_currency text not null default 'USD',
  default_language text not null default 'en',
  enabled_languages text[] not null default '{en,es}',
  enabled_currencies text[] not null default '{USD}',
  timezone text not null default 'America/Los_Angeles',
  hours jsonb not null default '[]',
  address text not null default '',
  map_url text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  website text not null default '',
  social jsonb not null default '{}',
  rate_max_age_hours int not null default 48,
  allergen_standard text not null default 'us9' check (allergen_standard in ('us9','eu14')),
  glossary text[] not null default '{}',
  tr jsonb not null default '{"source":"en","status":{}}',
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}',
  description jsonb not null default '{}',
  image_url text,
  sort int not null default 0,
  visible boolean not null default true,
  hours_from text,
  hours_to text,
  tr jsonb not null default '{"source":"en","status":{}}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid not null references public.categories(id) on delete restrict,
  name jsonb not null default '{}',
  description jsonb not null default '{}',
  price numeric(10,2) not null default 0,
  sizes jsonb not null default '[]',
  photos text[] not null default '{}',
  allergens text[] not null default '{}',
  allergens_set boolean not null default false,
  tags text[] not null default '{}',
  modifiers jsonb not null default '[]',
  addons jsonb not null default '[]',
  sort int not null default 0,
  visible boolean not null default true,
  sold_out boolean not null default false,
  featured boolean not null default false,
  tr jsonb not null default '{"source":"en","status":{}}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_category_idx on public.items(category_id, sort);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title jsonb not null default '{}',
  subtitle jsonb not null default '{}',
  link_type text not null default 'none' check (link_type in ('none','category','item','url')),
  link_ref text not null default '',
  sort int not null default 0,
  active boolean not null default true,
  starts_on date,
  ends_on date,
  tr jsonb not null default '{"source":"en","status":{}}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.specials (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  days int[] not null default '{}',
  starts_on date,
  ends_on date,
  special_price numeric(10,2),
  note jsonb not null default '{}',
  active boolean not null default true,
  tr jsonb not null default '{"source":"en","status":{}}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rates (
  currency text primary key,
  rate numeric(18,8),
  manual_rate numeric(18,8),
  updated_at timestamptz
);

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code text not null unique,
  scans int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cookie-free usage events (no personal data).
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('view_home','view_category','view_item','scan','search')),
  ref text,
  lang text,
  currency text,
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx on public.events(created_at);

-- updated_at triggers
create or replace function public.menu_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$
declare t text;
begin
  foreach t in array array['restaurant','categories','items','banners','specials','tables'] loop
    execute format('drop trigger if exists menu_touch_%1$s on public.%1$s', t);
    execute format('create trigger menu_touch_%1$s before update on public.%1$s for each row execute function public.menu_touch_updated_at()', t);
  end loop;
end $$;

-- Remove triggers left by the first version of this script (menu tables only).
do $
declare t text;
begin
  foreach t in array array['restaurant','categories','items','banners','specials','tables'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
  end loop;
end $;
drop trigger if exists guard_staff_items on public.items;

-- QR scan counter callable by anyone (only increments).
create or replace function public.increment_scan(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.tables set scans = scans + 1 where code = p_code;
  return found;
end $$;
grant execute on function public.increment_scan(text) to anon, authenticated;

-- Staff may only flip sold_out. Enforced in the database, not just the UI.
create or replace function public.menu_guard_staff_item_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.menu_my_role() = 'staff' then
    if (to_jsonb(new) - 'sold_out' - 'updated_at') is distinct from (to_jsonb(old) - 'sold_out' - 'updated_at') then
      raise exception 'Staff can only change sold out';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists menu_guard_staff_items on public.items;
create trigger menu_guard_staff_items before update on public.items
  for each row execute function public.menu_guard_staff_item_update();

-- ---------------------------------------------------------------- row level security
alter table public.profiles   enable row level security;
alter table public.restaurant enable row level security;
alter table public.categories enable row level security;
alter table public.items      enable row level security;
alter table public.banners    enable row level security;
alter table public.specials   enable row level security;
alter table public.rates      enable row level security;
alter table public.tables     enable row level security;
alter table public.events     enable row level security;

-- Profiles: everyone signed in sees their own row; owner manages all.
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid() or public.menu_is_owner());
drop policy if exists profiles_owner on public.profiles;
create policy profiles_owner on public.profiles for update to authenticated using (public.menu_is_owner()) with check (public.menu_is_owner());
-- Menu owners never delete profile rows (they may belong to another app); access is removed by clearing role.
drop policy if exists profiles_owner_delete on public.profiles;

-- Restaurant: public read, owner write.
drop policy if exists restaurant_read on public.restaurant;
create policy restaurant_read on public.restaurant for select using (true);
drop policy if exists restaurant_write on public.restaurant;
create policy restaurant_write on public.restaurant for all to authenticated using (public.menu_is_owner()) with check (public.menu_is_owner());

-- Menu content: public reads visible rows; editors (owner, manager) read and write everything.
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (visible or public.menu_is_editor() or public.menu_my_role() = 'staff');
drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories for all to authenticated using (public.menu_is_editor()) with check (public.menu_is_editor());

drop policy if exists items_read on public.items;
create policy items_read on public.items for select using (visible or public.menu_my_role() is not null);
drop policy if exists items_write on public.items;
create policy items_write on public.items for all to authenticated using (public.menu_is_editor()) with check (public.menu_is_editor());
drop policy if exists items_staff_update on public.items;
create policy items_staff_update on public.items for update to authenticated using (public.menu_my_role() = 'staff') with check (public.menu_my_role() = 'staff');

drop policy if exists banners_read on public.banners;
create policy banners_read on public.banners for select using (active or public.menu_is_editor());
drop policy if exists banners_write on public.banners;
create policy banners_write on public.banners for all to authenticated using (public.menu_is_editor()) with check (public.menu_is_editor());

drop policy if exists specials_read on public.specials;
create policy specials_read on public.specials for select using (active or public.menu_is_editor());
drop policy if exists specials_write on public.specials;
create policy specials_write on public.specials for all to authenticated using (public.menu_is_editor()) with check (public.menu_is_editor());

-- Rates: public read; owner sets manual overrides; the refresh job uses the secret key.
drop policy if exists rates_read on public.rates;
create policy rates_read on public.rates for select using (true);
drop policy if exists rates_write on public.rates;
create policy rates_write on public.rates for all to authenticated using (public.menu_is_owner()) with check (public.menu_is_owner());

-- Tables / QR: editors only (scan counter goes through increment_scan()).
drop policy if exists tables_rw on public.tables;
create policy tables_rw on public.tables for all to authenticated using (public.menu_is_editor()) with check (public.menu_is_editor());

-- Events: anyone may insert; only editors read.
drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert to anon, authenticated with check (true);
drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated using (public.menu_is_editor());

-- ---------------------------------------------------------------- storage (photos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu', 'menu', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/webp','image/jpeg','image/png'];

drop policy if exists menu_public_read on storage.objects;
create policy menu_public_read on storage.objects for select using (bucket_id = 'menu');
drop policy if exists menu_editor_write on storage.objects;
create policy menu_editor_write on storage.objects for insert to authenticated with check (bucket_id = 'menu' and public.menu_is_editor());
drop policy if exists menu_editor_delete on storage.objects;
create policy menu_editor_delete on storage.objects for delete to authenticated using (bucket_id = 'menu' and public.menu_is_editor());
