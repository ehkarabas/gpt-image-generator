# GPT Image Generator

Local-first GPT-4o chat and image generation app. Built on Next.js (App Router), TypeScript, and Supabase. The app:

- Streams chat responses via OpenAI Responses API (GPT-4o)
- Generates images via `gpt-image-1` (image generation/edits)
- Persists auth, profiles, conversations, messages, and image metadata in Supabase
- Stores binary image files in Supabase Storage
- Uses MCP-backed workflows in Cursor for dev ergonomics (optional)

---

## Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Architecture](#architecture)
  - [Frontend Stack](#frontend-stack)
  - [Backend Stack](#backend-stack)
  - [Infrastructure & DevOps](#infrastructure--devops)
  - [Database Schema](#database-schema)
  - [API Design](#api-design)
  - [WebSocket Events](#websocket-events)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Local Development](#local-development)
- [Supabase Migrations](#supabase-migrations)
- [Dual-Configuration Git Workflow](#dual-configuration-git-workflow)
- [Quality & Testing](#quality--testing)
- [Keep-Alive Strategy](#keep-alive-strategy)
- [Real-time (Optional)](#real-time-optional)
- [CI/CD](#cicd)
- [Security](#security)
- [Deployment](#deployment)
- [Success Criteria & KPIs](#success-criteria--kpis)
- [License](#license)

---

## About

GPT Image Generator is a local-first GPT-4o chat and image generation app. It lets users:

- Chat with GPT-4o and stream assistant responses
- Generate, edit, and download images using OpenAI's Image API (`gpt-image-1`)
- Save conversation history and image metadata to Supabase
- Store generated image files in Supabase Storage

### Problem Statement

- Builders want a minimal, local-first starter to prototype chat + image generation quickly
- Starters often mix unrelated features and lack end-to-end streaming and image workflows
- Environment/config drift between local and production complicates Supabase setup

### Solution Vision

- Streaming chat with GPT-4o (App Router + route handlers)
- Image generation and editing with `gpt-image-1`
- Persisted conversations/messages and image metadata in Supabase
- Production-ready env/migrations flow with Supabase CLI

---

## Key Features

- Streaming chat (low-latency assistant responses)
- Image generation and edits (mask/reference)
- Supabase Storage for images; metadata in Postgres
- Supabase Auth for authentication; `profiles` table for user profile data
- Saved conversations, messages, and images

---

## Architecture

### Frontend Stack

```ts
// Core Framework
Framework: Next.js 15 (App Router)
Runtime: React 19
Language: TypeScript 5.0+

// UI & Styling
UI Library: ShadCN/UI + Radix UI
Styling: Tailwind CSS 4.0+
Icons: Lucide React
Animations: Framer Motion

// State Management & Data
Server State: React Query v5 (TanStack Query)
Client State: Zustand
Form Handling: React Hook Form + Zod
Date Handling: date-fns

// Error Handling & Quality
Error Boundaries: React Error Boundary
Error Tracking: Sentry
Testing: Playwright (E2E), Jest (Unit)
Code Quality: ESLint, Prettier, TypeScript
```

### Backend Stack

```ts
// Core Runtime
Runtime: Node.js 22+
API Pattern (dev): Next.js App Router route handlers (streaming responses)

// Database & Migrations
Database: Supabase PostgreSQL (local + production)
Migrations: Supabase CLI SQL migrations

// Authentication & Storage
Auth: Supabase Auth
Storage: Supabase Storage (generated images)

// OpenAI
Chat: GPT-4o (Responses API / streaming)
Images: gpt-image-1 (image generation/edits)
```

Note: In production, OpenAI calls and storage ops can be moved to Supabase Edge Functions if desired; local/dev uses Next.js route handlers.

### Infrastructure & DevOps

```yaml
# Development Environment
Local DB: Supabase local stack (Dockerized Postgres) via Supabase CLI
Services: Supabase Studio, Auth, Storage, Postgres
Environment: Dual-configuration Git workflow

# Production Environment
Frontend: Vercel (App Router)
Backend: Supabase Edge Functions (for OpenAI/storage ops) or Next.js server
Database: Supabase PostgreSQL
CDN: Vercel Edge Network
Monitoring: Supabase Analytics + Sentry

# CI/CD Pipeline
Version Control: Git + GitHub
CI/CD: GitHub Actions
Testing: Automated E2E, Unit, Integration
Deployment: Automated via Git workflow
```

### Database Schema

```sql
-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

-- Messages (chat transcript)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content jsonb not null, -- { type: 'text' | 'image', text?: string, image_id?: uuid }
  created_at timestamptz default now()
);

-- Images (metadata; binary stored in Supabase Storage)
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  storage_path text not null, -- e.g. images/{user_id}/{id}.png
  prompt text not null,
  negative_prompt text,
  model text not null default 'gpt-image-1',
  size text not null default '1024x1024',
  quality text not null default 'high',
  background text default 'opaque', -- 'transparent' | 'opaque'
  width int,
  height int,
  created_at timestamptz default now()
);

-- Helpful index
create index if not exists idx_images_owner_created on public.images(owner_id, created_at desc);
```

### API Design

```ts
// Chat
POST   /api/chat/stream            // Stream GPT-4o responses

// Images
POST   /api/images/generate        // Generate image via gpt-image-1
POST   /api/images/edit            // Edit image with mask/references

// Conversations
GET    /api/conversations          // List conversations (user)
POST   /api/conversations          // Create conversation
GET    /api/conversations/:id      // Conversation details
DELETE /api/conversations/:id      // Delete conversation

// Messages
GET    /api/conversations/:id/messages    // List messages
POST   /api/conversations/:id/messages    // Add user message

// System
GET    /api/health                 // Health check
```

### WebSocket Events

```ts
interface WebSocketEvents {
  // Connection Management
  'user:online': { userId: string; timestamp: string }
  'user:offline': { userId: string; timestamp: string }

  // Conversations
  'conversation:created': { conversationId: string; title?: string }
  'conversation:renamed': { conversationId: string; title: string }
  'conversation:deleted': { conversationId: string }

  // Messages
  'message:created': { conversationId: string; message: Message }
  'assistant:delta': { conversationId: string; token: string }

  // Image jobs
  'image:started': { conversationId?: string; imageId: string; prompt: string }
  'image:progress': { imageId: string; percent: number }
  'image:completed': { imageId: string; storagePath: string }

  // Typing Indicators
  'typing:start': { userId: string; conversationId: string }
  'typing:stop': { userId: string; conversationId: string }
}
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm (or pnpm)
- Docker & Docker Compose
- Supabase CLI

```sh
node --version
npm -v
docker --version
docker compose version
npx supabase --version
```

### Installation

```sh
git clone https://github.com/ehkarabas/gpt-image-generator.git
cd gpt-image-generator
```

### Environment Configuration

Local Development (`.env.local`):

```env
DATABASE_URL="file:./local.db"
NODE_ENV="development"
DEPLOYMENT_ENV="local"
NEXT_PUBLIC_API_URL="http://localhost:3001"
SOCKET_URL="http://localhost:3001"

# Supabase (local stack will inject service URLs; add if you use client SDK locally)
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="anon-dev-key"
```

Production (`.env.production`):

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@[host].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
NEXT_PUBLIC_API_URL="https://gpt-image-generator-ehkarabas.onrender.com"
SOCKET_URL="https://gpt-image-generator-ehkarabas.onrender.com"
NODE_ENV="production"
DEPLOYMENT_ENV="remote"
```

### Local Development

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Supabase Migrations

Idempotent SQL migrations are under `supabase/migrations`.

```sh
# Create a new migration
npx supabase migration new init_schema

# Apply locally
npx supabase migration up

# Link and push to your hosted project (after testing locally)
npx supabase link
npx supabase db push
```

Include appropriate RLS policies in migrations (see Security below).

---

## Dual-Configuration Git Workflow

Branch model to separate environment configuration from product code while keeping `main` deployable:

```
main                 # Development workbench & deployment branch
├── config/local     # Local development configuration
└── config/remote    # Production configuration
```

Typical flow:

```sh
git checkout main
# Switch to local configuration
# (merge with --no-ff to preserve branch history)
git merge --no-ff config/local -m 'deploy: Switch to local configuration'

# Switch to remote configuration
git checkout main
git merge --no-ff config/remote -m 'deploy: Switch to remote configuration'

# Keep config branches in sync with main
git checkout config/local
git merge --no-ff main -m 'chore(config/local): sync with main'

git checkout config/remote
git merge --no-ff main -m 'chore(config/remote): sync with main'

git checkout main
```

In Cursor, use the Toolbox wrapper to invoke `git-mcp-server` tools (do not register the server directly due to tool limits). See `docs/personal-notes/gptImageGenerator_comprehensive_prd.md` for full examples.

---

## Quality & Testing

- Unit tests: Jest + Testing Library
- E2E: Playwright
- Type checking: TypeScript
- Linting: ESLint + Prettier

Common commands:

```sh
npm run type-check
npm run lint
npm run test
npm run test:e2e
```

Initial coverage focus:

- Task board interactions (if UI variants exist)
- Task CRUD and details
- Real-time updates and comments
- Role-based UI behaviors

---

## Keep-Alive Strategy

Health check endpoint example (App Router):

```ts
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'gpt-image-generator-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: await checkDatabaseHealth(),
  })
}

async function checkDatabaseHealth() {
  try {
    // Example: perform a lightweight DB check (adjust for your ORM/client)
    // await db.select().from(users).limit(1)
    return 'connected'
  } catch (error) {
    return 'disconnected'
  }
}
```

Optionally poll this from the frontend on a long interval in production.

---

## Real-time (Optional)

WebSocket server and client hooks can be added for assistant token deltas and image job progress. See `docs/personal-notes/gptImageGenerator_comprehensive_prd.md` §5.4 for server and hook examples.

---

## CI/CD

GitHub Actions pipeline outline:

- Install deps (root/app)
- Type-check, lint, unit test
- Build app
- E2E with Playwright
- Deploy (Vercel for frontend; Render/Railway or Supabase Edge Functions for backend if used)

See PRD §6.3 for a complete workflow YAML example.

---

## Security

Use Supabase Auth and Row Level Security. Example RLS policies for `public.images`:

```sql
alter table public.images enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'images' and polname = 'Allow owners to read own images'
  ) then
    create policy "Allow owners to read own images" on public.images
      for select using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'images' and polname = 'Allow owners to insert images'
  ) then
    create policy "Allow owners to insert images" on public.images
      for insert with check (auth.uid() = owner_id);
  end if;
end $$;
```

Add basic API hardening (rate limiters, security headers) as needed.

---

## Deployment

- Frontend: Vercel (configure env vars for production)
- Backend:
  - Option A: Keep Next.js route handlers (Serverless/Edge)
  - Option B: Move OpenAI and storage operations to Supabase Edge Functions
- Database: Supabase hosted Postgres

Production env vars (minimum):

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `SOCKET_URL`

---

## Success Criteria & KPIs

- Performance: Lighthouse score > 90 (all categories)
- Availability: 99.9% uptime (monthly)
- API p95 latency < 200ms
- Error rate < 0.1%
- Frontend bundle < 500KB gzipped
- > 90% test coverage on critical paths
- Onboarding: < 5 minutes to first generated image
- Time to first image: < 30s from prompt to gallery

---

## License

MIT
