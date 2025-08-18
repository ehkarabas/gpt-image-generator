-- Core application schema: profiles, conversations, messages, images

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  user_id uuid not null,
  summary text,
  message_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  content text not null,
  role text not null check (role in ('user','assistant')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Images
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message_id uuid,
  prompt text not null,
  image_url text not null,
  thumbnail_url text,
  size varchar(20) not null,
  model varchar(20) not null,
  quality varchar(10),
  style varchar(20),
  revised_prompt text,
  generation_time_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Basic indexes
create index if not exists idx_conversations_user on public.conversations(user_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_images_user on public.images(user_id);
create index if not exists idx_images_message on public.images(message_id);


