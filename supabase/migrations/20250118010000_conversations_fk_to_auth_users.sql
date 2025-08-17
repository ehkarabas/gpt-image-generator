-- Migrate conversations.user_id FK to auth.users to eliminate profile creation race

alter table public.conversations
  drop constraint if exists conversations_user_fk;

alter table public.conversations
  add constraint conversations_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

-- RLS policies already use auth.uid(), no change required
-- Index already exists on conversations(user_id)


