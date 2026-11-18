-- One-time fix for a Supabase project SHARED with another app, where the first version of
-- schema.sql was run. Run this AFTER running the current schema.sql again.
--
-- The first version installed public.handle_new_user() + trigger on_auth_user_created on
-- auth.users. Those are common template names, so it may have replaced the other app's own
-- sign-up function. It also gave menu roles automatically to every new sign-up.
--
-- This replaces it with a neutral version that:
--   * creates the user's profiles row (id, email) like the usual Supabase template does,
--   * never gives a menu role,
--   * can never make a sign-up fail.
-- If your other app's original function filled more columns (nombre, idioma, ...), restore
-- that original version from the other app's code instead of running this.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.profiles (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  exception when others then
    null; -- never block a sign-up
  end;
  return new;
end $$;

-- Make sure the trigger exists and points at the function above.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
