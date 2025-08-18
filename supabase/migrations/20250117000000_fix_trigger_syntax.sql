-- Fix trigger function syntax error

-- Drop existing function and trigger
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, created_at, updated_at)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', 'User'), now(), now())
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    updated_at = now();
  return new;
end;
$$;

-- Recreate trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing auth users
insert into public.profiles (id, email, display_name, created_at, updated_at)
select au.id, au.email, coalesce(au.raw_user_meta_data->>'display_name','User'), now(), now()
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null;
