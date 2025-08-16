# GPT Image Generator

Local-first GPT-4o chat and image generation app built with **monorepo architecture**. Built on Next.js (App Router), TypeScript, and Supabase with a dual-configuration Git workflow. The app:

- Streams chat responses via OpenAI GPT-4o API  
- Generates images via DALL-E 3 API (image generation/edits)
- Persists auth, profiles, conversations, messages, and image metadata in Supabase
- Stores binary image files in Supabase Storage
- Uses Task Master AI MCP tools for development workflows
- Follows Test-Driven Development (TDD) with comprehensive testing
- Implements dual-branch Git strategy for local/production environments

## 🔗 Live Demo

Experience GPT Image Generator in action! The application is deployed and ready to check, consider it is still in development stage:

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-GPTImageGenerator-blue?style=for-the-badge&logo=vercel&logoColor=white)](https://gpt-image-generator-ehkarabas.vercel.app/)

**✨ Try it now:** [https://gpt-image-generator-ehkarabas.vercel.app/](https://gpt-image-generator-ehkarabas.vercel.app/)

---

## GitHub Actions CI/CD Integration

This project implements comprehensive CI/CD automation through GitHub Actions with strict TDD enforcement and environment validation.

### Automated Workflow Matrix

| Branch | Workflow File | Validation Level | Automated Checks |
|--------|---------------|------------------|------------------|
| `config/local` | `ci-config-local.yml` | Development | Unit tests, TDD compliance, code quality, environment validation |
| `config/remote` | `ci-config-remote.yml` | Production Prep | E2E tests, DB validation, security scans, AI services testing |
| `main` | `ci-main-deployment.yml` | Deployment | Health checks, Vercel deployment, post-deployment monitoring |
| `Pull Requests` | `pr-validation.yml` | Merge Validation | Branch strategy, test coverage, security scanning |

### GitHub Actions Workflows

```text
.github/workflows/
├── ci-config-local.yml      # Development validation workflow
├── ci-config-remote.yml     # Production preparation workflow
├── ci-main-deployment.yml   # Automated deployment workflow
└── pr-validation.yml        # Pull request validation workflow
```

### Required GitHub Secrets

Configure these secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

**Production Environment Secrets:**
```env
SUPABASE_URL_PROD=https://[your-project-ref].supabase.co
SUPABASE_ANON_KEY_PROD=[your-production-anon-key]
SUPABASE_SERVICE_ROLE_KEY_PROD=[your-production-service-role-key]
DATABASE_URL_PROD=[your-production-database-url]
OPENAI_API_KEY_PROD=[your-production-openai-key]
```

**Development Environment Secrets:**
```env
SUPABASE_URL_LOCAL=http://127.0.0.1:54321
SUPABASE_ANON_KEY_LOCAL=[your-local-anon-key]
SUPABASE_SERVICE_ROLE_KEY_LOCAL=[your-local-service-role-key]
```

**Shared Secrets:**
```env
OPENAI_API_KEY=[your-openai-api-key]
ANTHROPIC_API_KEY=[your-anthropic-api-key]
CODECOV_TOKEN=[your-codecov-token]  # Optional
```

### Branch Protection Rules

GitHub branch protection is automatically configured:

- **main branch**: Only accepts merges from `config/remote`, requires all status checks to pass
- **config/remote branch**: Requires E2E tests and production validation to pass
- **config/local branch**: Requires unit tests and TDD compliance checks to pass

### Automated TDD Enforcement Features

- ✅ **Environment Validation**: Tests FAIL (never skip) when .env files are missing
- ✅ **Anti-Skip Detection**: Automatically detects and prevents test.skip() violations
- ✅ **Test Coverage Enforcement**: Maintains minimum coverage thresholds
- ✅ **Security Scanning**: Automated vulnerability detection and prevention
- ✅ **Deployment Safety**: Production health checks and automatic rollback capability
- ✅ **Branch Strategy Enforcement**: Prevents direct commits to protected branches

### CI/CD Pipeline Flow

```mermaid
graph LR
    A[config/local Push] -->|Triggers| B[Development Validation]
    B --> C[Unit Tests + TDD]
    C --> D[Code Quality]
    D --> E[Ready for config/remote]
    
    F[config/remote Push] -->|Triggers| G[Production Preparation]
    G --> H[E2E Tests + DB Validation]
    H --> I[Security + Performance]
    I --> J[Ready for main]
    
    K[main Push] -->|Triggers| L[Deployment Pipeline]
    L --> M[Health Checks]
    M --> N[Vercel Deployment]
    N --> O[Post-deployment Monitoring]
```

### Setup Instructions

1. **Configure GitHub Secrets**: Add all required secrets to your repository
2. **Set Branch Protection**: Enable protection rules for main, config/remote, and config/local branches
3. **Enable GitHub Actions**: Ensure Actions are enabled in repository settings
4. **Review Workflows**: Examine workflow files in `.github/workflows/` directory

**Complete Setup Guide**: See [`.github/GITHUB_ACTIONS_SETUP.md`](.github/GITHUB_ACTIONS_SETUP.md) for detailed configuration instructions.

### Monitoring and Troubleshooting

**Dashboard Links:**
- GitHub Actions: `https://github.com/[username]/[repo]/actions`
- Vercel Deployments: `https://vercel.com/dashboard`
- Supabase Dashboard: `https://app.supabase.com/projects`

**Common Issues:**
- Workflow fails with "Secret not found": Verify secret names match exactly
- Environment validation fails: Check all required secrets are configured
- Branch protection blocks merge: Ensure all status checks pass
- Deployment fails: Check Vercel deployment logs and environment variables

---

## Table of Contents

- [About](#about)
- [Key Features](#key-features) 
- [Project Structure (Monorepo)](#project-structure-monorepo)
  - [Directory Overview](#directory-overview)
  - [Path Aliases](#path-aliases)
- [Git Workflow Strategy](#git-workflow-strategy)
  - [Branch Structure](#branch-structure)
  - [Development Flow](#development-flow)
  - [Commit Standards](#commit-standards)
- [Architecture](#architecture)
  - [Frontend Stack](#frontend-stack)
  - [Backend Stack](#backend-stack)
  - [Infrastructure & DevOps](#infrastructure--devops)
  - [Database Schema](#database-schema)
  - [API Design](#api-design)
- [Development Guidelines](#development-guidelines)
  - [TDD Approach](#tdd-approach)
  - [Task Master AI Workflow](#task-master-ai-workflow)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup & TDD Compliance](#environment-setup--tdd-compliance)
  - [Local Development](#local-development)
- [Testing Strategy](#testing-strategy)
- [Supabase Setup & Migrations](#supabase-setup--migrations)
- [Quality & Testing](#quality--testing)
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

## Project Structure (Monorepo)

This project uses **npm workspaces** to organize code into a clean monorepo structure with separated concerns.

### Directory Overview

```text
.
├── frontend/                    # Next.js App Router workspace
│   ├── app/                     # Routes, layouts, route handlers
│   │   ├── (dashboard)/         # Main chat interface
│   │   ├── actions/             # Server Actions  
│   │   └── api/                 # Route handlers
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # ShadCN/UI primitives
│   │   ├── chat/                # Chat-specific components
│   │   ├── images/              # Image-related components
│   │   └── forms/               # Form components
│   ├── hooks/                   # React hooks
│   └── lib/                     # Domain, infra and utilities
│       ├── db/                  # Database schema & queries
│       ├── supabase/            # Supabase client utilities
│       ├── openai/              # OpenAI API integration
│       └── validations/         # Zod schemas
├── supabase/                    # Supabase backend
│   ├── functions/               # Edge Functions
│   └── migrations/              # SQL migrations
├── tests/                       # Centralized testing (AT ROOT)
│   ├── unit/                    # Vitest unit tests
│   ├── integration/             # API + DB tests
│   ├── e2e/                     # Playwright E2E tests
│   └── fixtures/                # Test data
├── package.json                 # Monorepo root dependencies
└── frontend/package.json        # Frontend workspace
```

### Path Aliases

**CRITICAL**: All `@/` path aliases are defined in the root `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./frontend/*"],
      "@/lib/*": ["./frontend/lib/*"],
      "@/components/*": ["./frontend/components/*"],
      "@/hooks/*": ["./frontend/hooks/*"],
      "@/app/*": ["./frontend/app/*"],
      "@supabase/*": ["./supabase/functions/*"]
    }
  }
}
```

**Testing Commands** (run from root):
```bash
npm run test          # Unit tests (vitest)
npm run test:e2e      # E2E tests (playwright)  
npm run test:coverage # Coverage report
```

---

## Git Workflow Strategy

This project uses a **dual-configuration branch strategy** to manage development and production environments separately.

### Branch Structure

```
main                 # 🚫 Production deployment (NEVER commit directly)
├── config/local     # 🔧 Local development (Docker PostgreSQL)
└── config/remote    # 🌐 Production config (Supabase PostgreSQL)
```

### CI/CD Development Flow

1. **Feature Development** (config/local):
   ```bash
   git checkout config/local
   # Develop features with TDD approach
   npm run test
   git add .
   git commit -m "feat(chat): implement real-time messaging"
   ```

2. **CI/CD Pipeline** (config/remote):
   ```bash
   git checkout config/remote
   git merge config/local --no-ff
   
   # Automated CI/CD pipeline execution
   npm run ci:deploy:pipeline
   # - Copies .env.production to frontend
   # - Tests remote database connection
   # - Validates database migrations
   # - Builds production frontend
   # - Runs E2E tests with production config
   
   # Manual production optimizations
   git commit -m "config(prod): optimize for production"
   git push origin config/remote
   ```

3. **Automated Deployment** (main):
   ```bash
   # Automated via CI/CD pipeline
   npm run ci:auto:merge:main
   # - Merges config/remote to main
   # - Pushes to main (triggers Vercel deployment)
   # - Runs post-deployment verification
   
   # Return to development cycle
   git checkout config/local
   ```

### Commit Standards

All commits follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

Examples:
feat(chat): add streaming message support
fix(images): resolve DALL-E rate limiting
test(ui): add chat input component tests
docs(readme): update monorepo setup guide
```

**Commit Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`

---

## CI/CD Pipeline

This project implements a comprehensive CI/CD pipeline for seamless development-to-production deployment.

### Pipeline Overview

```mermaid
graph LR
    A[config/local] -->|Development| B[Unit Tests]
    B --> C[Feature Complete]
    C --> D[config/remote]
    D --> E[CI/CD Pipeline]
    E --> F[Production Tests]
    F --> G[main branch]
    G --> H[Vercel Deployment]
    H --> I[Health Checks]
```

### CI/CD Scripts

**Core Pipeline Commands:**
```bash
# Full CI/CD pipeline execution
npm run ci:deploy:pipeline

# Individual pipeline steps
npm run ci:prepare:production    # Copy .env.production
npm run db:test:remote          # Test remote database
npm run db:migrate:test         # Validate migrations
npm run deploy:verify           # Post-deployment checks

# Automated deployment
npm run ci:auto:merge:main      # Merge and deploy to main
```

**Pipeline Features:**
- **Environment Isolation**: Automatic .env.production copying
- **Database Validation**: Remote connection and migration testing
- **Comprehensive Testing**: Unit, integration, and E2E tests
- **Automated Deployment**: GitHub hook triggers for Vercel
- **Health Monitoring**: Post-deployment verification
- **Rollback Support**: Emergency rollback procedures

### Pipeline Stages

1. **Development Phase** (config/local)
   - Local development with Docker/Supabase
   - Unit tests with Vitest
   - TDD implementation cycle

2. **CI/CD Pipeline** (config/remote)
   - Environment configuration copying
   - Remote database connectivity testing
   - Schema migration validation
   - Production build verification
   - E2E testing with production config

3. **Automated Deployment** (main)
   - Automatic merge from config/remote
   - Vercel GitHub hook deployment
   - Live health checks and verification
   - Service monitoring and alerting

### Error Handling & Rollback

```bash
# Emergency rollback
git checkout main
git revert HEAD --no-edit
git push origin main

# Targeted rollback
git checkout config/remote
git reset --hard <previous-hash>
git push --force-with-lease origin config/remote
```

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
Soft Delete: `deleted_at` (and optional `deleted_by`) pattern across tables

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
Environment: Local (Docker/Supabase) and Remote (Supabase hosted)

# Production Environment
Frontend: Vercel (App Router)
Backend: Supabase Edge Functions (for OpenAI/storage ops) or Next.js server
Database: Supabase PostgreSQL
CDN: Vercel Edge Network
Monitoring: Supabase Analytics + Sentry

# CI/CD Pipeline
Testing: Automated E2E, Unit, Integration
Deployment: Platform-specific pipeline
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

## Development Guidelines

### TDD Approach

This project follows **Test-Driven Development** for all UI components and features:

1. **Write Tests First**: Create comprehensive test files before implementing components
2. **Implement Feature**: Build the component to pass the tests  
3. **Run Tests**: Verify implementation with `npm run test`
4. **Refactor**: Improve code while maintaining test coverage

**Test Structure**:
```bash
tests/unit/frontend/components/chat/
├── chat-input.test.tsx      # ✅ 11 tests passing
├── generated-image.test.tsx # ✅ 14 tests passing  
├── message-item.test.tsx    # ✅ 16 tests passing
└── message-list.test.tsx    # 🔄 Next to implement
```

### Task Master AI Workflow

Development is managed through **Task Master AI MCP tools** for structured, task-driven development:

- **Task Planning**: Use `parse_prd` to generate tasks from requirements
- **Task Management**: `get_tasks`, `next_task`, `expand_task` for organization
- **Implementation Tracking**: `update_subtask` to log progress with timestamps
- **Quality Assurance**: `set_task_status` to mark completion after testing

### Core Principles

- **React Query v5**: Centralized `QueryClient`, sensible `staleTime`, selective invalidation, optimistic updates for critical mutations
- **Server Components First**: Fetch on the server; use Client Components only for interactivity. Use Server Actions for mutations
- **Suspense + Error Boundaries**: Small, purpose-driven boundaries; pair React Query `suspense: true` with boundaries; provide stable skeletons
- **Database Schema as SSoT**: Keep schema definitions centralized in `frontend/lib/db/schema.ts`; use safe, idempotent SQL migrations
- **Monorepo Testing**: All tests run from root directory using npm workspaces
- **Git Workflow Compliance**: Always work on `config/local` branch, follow conventional commits

---

## Getting Started

### Prerequisites

**Required Tools:**
- Node.js 22+
- npm (monorepo workspace support)
- Docker & Docker Compose
- Supabase CLI
- Git (for dual-branch workflow)

**API Keys:**
- OpenAI API Key (GPT-4o + DALL-E 3)
- Anthropic API Key (for Task Master AI)

**Development Tools:**
- Task Master AI (MCP Tool for Cursor)
- Cursor IDE (recommended for MCP integration)

**Verification:**
```sh
node --version        # v22+
npm -v               # 10+
docker --version     # 24+
docker compose version
npx supabase --version
git --version
```

### Installation

**1. Clone and Setup Monorepo:**
```bash
git clone https://github.com/ehkarabas/gpt-image-generator.git
cd gpt-image-generator

# Install all workspace dependencies
npm install
```

**2. Git Workflow Setup:**
```bash
# Verify you're on the correct branch
git branch                    # Should show: config/local
git checkout config/local     # Switch if needed

# Verify branch structure
git branch -a                 # Should show: config/local, config/remote, main
```

**3. Task Master AI Setup:**

Configure Task Master AI MCP tools in Cursor:

1. **Install Task Master AI**: Follow [Task Master AI Setup Guide](https://github.com/eyaltoledano/claude-task-master)
2. **Configure MCP in Cursor**: Add to `.cursor/mcp.json`:
   ```json
   {
     "mcpServers": {
       "task-master": {
         "command": "npx",
         "args": ["task-master-ai", "server"],
         "env": {
           "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
         }
       }
     }
   }
   ```

**4. Verify Monorepo Structure:**
```bash
# Check workspace configuration
npm run test          # Unit tests from root
npm run test:e2e      # E2E tests from root
npm run dev           # Frontend development server
```

### Backend Setup

1. **Install Docker**: Download Docker according to your system [Docker](https://docs.docker.com/get-started/get-docker/)

2. **Install Supabase CLI**: [Supabase CLI Install](https://supabase.com/docs/guides/local-development/cli/getting-started)

3. **Configure OpenAI Keys**: 
   - In the `supabase/functions/` folder, rename `.env.example` to `.env`
   - Add your OpenAI API key: [Get OpenAI Keys](http://platform.openai.com/account/)

4. **Start Supabase Local Stack**:
   ```sh
   npx supabase start
   ```
   Note: If you change your `supabase/functions/.env` file locally, restart with:
   ```sh
   npx supabase stop && npx supabase start
   ```

5. **Update Environment Variables**: After starting Supabase, update your `.env.local` file with the local URLs:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   ```

6. **Serve Edge Functions Locally**:
   ```sh
   npx supabase functions serve --import-map ./supabase/functions/import_map.json
   ```

7. **Test Edge Functions**: Test the `hello-world` edge function:
   ```sh
   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
     --header 'Authorization: Bearer SUPABASE_ANON_KEY' \
     --header 'Content-Type: application/json' \
     --data '{"name":"Functions"}'
   ```

### Environment Setup & TDD Compliance

**CRITICAL**: This project enforces strict TDD compliance for environment configuration. Tests MUST FAIL (never skip) when environment is misconfigured.

#### Environment File Structure

```text
.
├── .env.local                   # Local development (gitignored)
├── .env.local.example          # Template for local setup  
├── .env.production             # Production config (gitignored)
├── .env.production.example     # Template for production
└── frontend/
    ├── .env                    # Active env (auto-copied)
    ├── .env.local             # Frontend local (auto-copied)
    └── .env.production        # Frontend prod (auto-copied)
```

#### TDD Environment Validation Commands

**🚫 NEVER use these commands (creates false positives)**:
```bash
# ❌ FORBIDDEN - No environment validation
playwright test
npm run test:e2e
test.skip(!process.env.VAR, 'Not configured')
```

**✅ ALWAYS use these commands (proper TDD validation)**:
```bash
# ✅ CORRECT - Validates environment first
npm run test:e2e:local      # For local development
npm run test:e2e:remote     # For production validation
npm run ci:prepare:local    # Manual environment preparation
```

#### Environment Setup Process

**Step 1: Create Local Environment**
```bash
# Copy example files
cp .env.local.example .env.local
cp .env.production.example .env.production

# Validate environment setup
npm run ci:prepare:local
# ✅ Should show: "Local environment prepared successfully!"
# ❌ If fails: Fix missing variables and retry
```

**Step 2: Configure API Keys**

Edit `.env.local` with your actual keys:
```env
# Required Keys
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE

# Supabase Configuration (from supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Development Configuration
DEBUG=false
DEPLOYMENT_ENV=local
OPENAI_MODEL_CHAT=gpt-4o
OPENAI_MODEL_IMAGE=dall-e-3
```

**Step 3: Test Environment Configuration**
```bash
# Verify environment validation works
npm run test:e2e:local
# ✅ Should run tests successfully
# ❌ If fails with env errors: Check your .env.local file
```

#### Production Environment Setup

Edit `.env.production` with production values:
```env
# Required Keys (from secrets)
OPENAI_API_KEY=${OPENAI_API_KEY_PROD}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY_PROD}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_PROJECT_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
DATABASE_URL=${SUPABASE_DATABASE_URL}

# Production Configuration
DEBUG=false
LOG_LEVEL=warn
DEPLOYMENT_ENV=remote
NODE_ENV=production

# Production Settings
RATE_LIMIT_REQUESTS_CHAT=30
RATE_LIMIT_REQUESTS_IMAGE=5
CONTENT_FILTER_LEVEL=high
```

#### Environment Validation Scripts

The project includes comprehensive validation scripts that ensure TDD compliance:

**scripts/ci/prepare-local.js**: Validates local environment
- ❌ **FAILS** tests if .env.local missing
- ❌ **FAILS** tests if required variables missing
- ✅ **PASSES** only when environment is complete

**scripts/ci/prepare-production.js**: Validates production environment  
- ❌ **FAILS** tests if .env.production missing
- ❌ **FAILS** tests if production variables missing
- ✅ **PASSES** only when production environment is complete

#### Troubleshooting Environment Issues

**Error: ".env.local not found"**
```bash
# Solution:
cp .env.local.example .env.local
# Edit .env.local with your actual API keys
npm run ci:prepare:local
```

**Error: "Missing environment variables"**
```bash
# Check which variables are missing:
npm run ci:prepare:local
# Add missing variables to .env.local
# Required: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

**Error: "E2E tests skipping"**
```bash
# This indicates TDD violation - tests should FAIL, not skip
# Always use proper validation commands:
npm run test:e2e:local    # Not: playwright test
npm run test:e2e:remote   # Not: npm run test:e2e
```

#### Agent/Developer Guidelines

**For AI Agents working on this project**:
- ✅ **ALWAYS** validate environment before running tests
- ✅ **ALWAYS** use `npm run ci:prepare:local` before E2E tests
- ❌ **NEVER** use `test.skip()` for environment issues
- ❌ **NEVER** proceed when environment validation fails

**For Developers**:
- Follow the setup process exactly as documented
- Never commit .env.local or .env.production files
- Use the validation scripts to ensure proper setup
- Report environment issues immediately - do not work around them

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

## Testing Strategy

This project follows **Test-Driven Development (TDD)** with comprehensive testing at all levels.

### Test Structure (Monorepo)

```text
tests/                        # All tests at ROOT level
├── unit/                     # Vitest unit tests
│   ├── frontend/             # Frontend component/hook tests
│   │   ├── components/       # UI component tests
│   │   │   ├── chat/         # Chat component tests
│   │   │   └── images/       # Image component tests
│   │   ├── hooks/            # React hook tests
│   │   └── lib/              # Utility function tests
│   └── functions/            # Supabase Edge Function tests
├── integration/              # API + DB integration tests
│   ├── frontend-api/         # API endpoint tests
│   └── supabase-db/          # Database operation tests
├── e2e/                      # Playwright E2E tests
│   ├── frontend/             # User workflow tests
│   └── auth/                 # Authentication flow tests
└── fixtures/                 # Shared test data
```

### TDD Workflow - E2E Tests MANDATORY

**CRITICAL REQUIREMENT**: ALL features MUST follow TDD approach with E2E tests written BEFORE implementation.

1. **Create E2E Test FIRST (MANDATORY)**:
   ```bash
   # STEP 1: Create E2E test file BEFORE any feature work
   touch tests/e2e/frontend/[feature-name].spec.ts
   # Write comprehensive E2E test scenarios first (Red phase)
   ```

2. **Verify Test Fails (TDD Red Phase)**:
   ```bash
   # STEP 2: Ensure E2E test fails before implementation
   npm run test:e2e
   echo "E2E test failing as expected - proceeding with implementation"
   ```

3. **Implement Feature (TDD Green Phase)**:
   ```bash
   # STEP 3: Build component/feature to pass E2E tests
   # Implementation goes here...
   
   # STEP 4: Verify E2E test passes
   npm run test:e2e
   echo "E2E test passing - feature ready for production"
   ```

4. **Production Validation**:
   ```bash
   # STEP 5: MANDATORY before config/remote merge
   npm run test:e2e:remote     # Production config E2E tests
   npm run test:coverage       # Coverage requirements
   ```

**Unit Test TDD (Secondary)**:
1. **Write Unit Test First**:
   ```bash
   # Create unit test file after E2E tests
   tests/unit/frontend/components/chat/new-component.test.tsx
   ```

2. **Implement Component**:
   ```bash
   # Build component to pass unit tests
   frontend/components/chat/new-component.tsx
   ```

3. **Run All Tests**:
   ```bash
   npm run test                    # Unit tests
   npm run test:e2e                # E2E tests (MANDATORY)
   npm run test:coverage           # Coverage validation
   ```

### Current Test Coverage

**Chat Components** (Phase 1):
- ✅ ChatInput: 11 tests passing
- ✅ GeneratedImage: 14 tests passing  
- ✅ MessageItem: 16 tests passing
- 🔄 MessageList: Next to implement
- 🔄 ChatInterface: Next to implement

**Test Commands** (run from root):
```bash
npm run test                 # All unit tests (vitest)
npm run test:watch          # Watch mode for development
npm run test:coverage       # Coverage report
npm run test:e2e           # E2E tests (playwright)
npm run test:e2e:ui        # Playwright UI mode
```

---

## Quality & Testing

**Testing Framework**:
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright (cross-browser)
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript strict mode

**Quality Commands** (run from root):
```bash
npm run lint              # ESLint + Prettier
npm run type-check        # TypeScript validation
npm run test              # Unit tests (vitest)
npm run test:coverage     # Coverage report
npm run test:e2e          # E2E tests (playwright)
npm run test:e2e:ui       # Playwright UI mode
```

**Coverage Focus**:
- ✅ **Chat Components**: TDD implementation with comprehensive tests
- 🔄 **API Routes**: Streaming chat flows and image generation endpoints
- 🔄 **Database Operations**: Conversation, message, and image CRUD
- 🔄 **Authentication Flows**: Supabase Auth integration
- 🔄 **Error Boundaries**: Component error handling

**Quality Gates - MANDATORY ENFORCEMENT**:
- **E2E Tests MANDATORY**: NO feature can proceed to config/remote without comprehensive E2E test coverage
- **Test-First Development**: E2E tests must be written BEFORE feature implementation (TDD)
- **Production Readiness**: E2E tests required before production deployment (ZERO TOLERANCE)
- **Code Coverage**: Minimum 80% for critical paths
- **Type Safety**: Zero TypeScript errors tolerated
- **CI/CD Gate**: All tests must pass before merging to `config/remote`

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
