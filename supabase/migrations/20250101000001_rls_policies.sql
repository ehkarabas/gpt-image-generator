-- Foreign keys with IF NOT EXISTS checks
DO $$
BEGIN
  -- Check and add conversations_user_fk if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_user_fk'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_user_fk 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Check and add messages_conversation_fk if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_fk'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_conversation_fk 
      FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
  
  -- Check and add images_user_fk if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'images_user_fk'
  ) THEN
    ALTER TABLE public.images
      ADD CONSTRAINT images_user_fk 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Check and add images_message_fk if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'images_message_fk'
  ) THEN
    ALTER TABLE public.images
      ADD CONSTRAINT images_message_fk 
      FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS enable
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.images enable row level security;

-- Profiles policies: user can read/update own profile
drop policy if exists "Profiles: select own" on public.profiles;
create policy "Profiles: select own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Conversations policies: owner-only CRUD
drop policy if exists "Conversations: select own" on public.conversations;
create policy "Conversations: select own" on public.conversations
  for select using (user_id = auth.uid());

drop policy if exists "Conversations: insert own" on public.conversations;
create policy "Conversations: insert own" on public.conversations
  for insert with check (user_id = auth.uid());

drop policy if exists "Conversations: update own" on public.conversations;
create policy "Conversations: update own" on public.conversations
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Conversations: delete own" on public.conversations;
create policy "Conversations: delete own" on public.conversations
  for delete using (user_id = auth.uid());

-- Messages policies: allowed if conversation belongs to user
drop policy if exists "Messages: select via conversation" on public.messages;
create policy "Messages: select via conversation" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Messages: insert via conversation" on public.messages;
create policy "Messages: insert via conversation" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Messages: update via conversation" on public.messages;
create policy "Messages: update via conversation" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Messages: delete via conversation" on public.messages;
create policy "Messages: delete via conversation" on public.messages
  for delete using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- Images policies: owner-only CRUD
drop policy if exists "Images: select own" on public.images;
create policy "Images: select own" on public.images
  for select using (user_id = auth.uid());

drop policy if exists "Images: insert own" on public.images;
create policy "Images: insert own" on public.images
  for insert with check (user_id = auth.uid());

drop policy if exists "Images: update own" on public.images;
create policy "Images: update own" on public.images
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Images: delete own" on public.images;
create policy "Images: delete own" on public.images
  for delete using (user_id = auth.uid());

-- Profile auto-create trigger on new auth user
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
