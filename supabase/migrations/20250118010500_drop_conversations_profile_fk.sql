-- Temporarily drop conversations.user_id FK to unblock race; will re-add to auth.users after verification
alter table public.conversations
  drop constraint if exists conversations_user_fk;


