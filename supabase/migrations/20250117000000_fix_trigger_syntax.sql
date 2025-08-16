-- Fix trigger function syntax error

-- Drop existing function and trigger
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Recreate with proper syntax
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, created_at, updated_at)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', 'User'), now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Recreate trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
