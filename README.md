# GPT Image Generator

Modern, responsive GPT-4o chat and AI image generation workspace built with Next.js 15, TypeScript, and Supabase. Each user gets their own personal workspace with conversation management and image gallery.

![GPT Image Generator Preview](./public/images/README_thumbnail.png)

*Experience the modern, responsive chat interface with AI-powered conversations and image generation capabilities.*

## 🔗 Live Demo

Experience GPT Image Generator in action! The application is deployed and ready to explore:

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-GPTImageGenerator-blue?style=for-the-badge&logo=vercel&logoColor=white)](https://gpt-image-generator-ehkarabas.vercel.app/)

**✨ Try it now:** [https://gpt-image-generator-ehkarabas.vercel.app/](https://gpt-image-generator-ehkarabas.vercel.app/)

---

## ✨ Key Features

<div align="center">
  
| Desktop Experience | Mobile Responsive | Dark Mode |
|:---:|:---:|:---:|
| Full-featured chat with sidebar | Hamburger navigation | Elegant dark theme |
| *Conversation management & AI chat* | *Touch-optimized mobile UI* | *Comprehensive theme system* |

</div>

### 🎨 **Personal AI Workspace**
- **Individual Image Generation Workspace**: Each user gets their own dedicated space for AI image creation
- **Personal Gallery**: Organized collection of all generated images with metadata and download capabilities
- **Conversation Management**: Create, rename, delete, and organize multiple chat conversations (searching included)
- **Persistent Sessions**: Active conversation is preserved across page refreshes for seamless UX

### 🚀 **Modern, Responsive UI/UX**
- **Adaptive Layout**: Seamless responsive design from mobile (320px) to ultra-wide displays (2560px+)
- **Dynamic Animations**: Smooth Framer Motion animations with spring physics for interactive elements
- **Theme System**: Comprehensive light/dark mode with carefully crafted color schemes
- **Mobile-First**: Hamburger navigation, touch-optimized interactions, and mobile sidebar overlays

### 🤖 **Advanced AI Integration**
- **Streaming Chat**: Real-time GPT-4o responses with smooth typing indicators
- **DALL-E 3 Image Generation**: High-quality AI image creation with customizable parameters
- **Image Proxy System**: Bypass 1-hour URL expiration through intelligent proxy download system
- **Conversation Context**: AI maintains context across conversation history

### 🔐 **Production-Ready Authentication**
- **Supabase Auth**: Complete authentication system with email/password and OAuth
- **Password Reset Flow**: Secure password recovery with email validation
- **Social OAuth**: Google, GitHub, Discord integration ready for production
- **Profile Management**: User settings page with name changes and account deletion

### 📱 **Superior User Experience**
- **Persistent Navigation**: Active conversation highlighting with subtle glow effects
- **Smart Scrolling**: Auto-scroll to latest messages with manual override capability
- **Toast Notifications**: Success/error feedback with responsive design (disabled on small screens)
- **Loading States**: Comprehensive loading indicators and skeleton components

---

## 🏗️ Architecture & Tech Stack

<div align="center">
  
### 🎯 **Modern Full-Stack Architecture**

```mermaid
graph TB
    A[User] --> B[Next.js 15 Frontend]
    B --> C[Supabase Database]
    B --> D[OpenAI API]
    C --> E[Real-time Auth]
    C --> F[PostgreSQL]
    D --> G[GPT-4o Chat]
    D --> H[DALL-E 3 Images]
    
    style B fill:#0070f3
    style C fill:#3ecf8e
    style D fill:#74aa9c
```

*Scalable, modern architecture with real-time capabilities*

</div>

### Frontend Excellence
```ts
Framework: Next.js 15 (App Router)
Runtime: React 19
Language: TypeScript 5.0+
UI Library: shadcn/ui + Radix UI
Styling: Tailwind CSS 4.0
Animations: Framer Motion
State: React Query v5 + Zustand
Forms: React Hook Form + Zod
```

### Backend & Database
```ts
Database: Supabase PostgreSQL
Auth: Supabase Auth (email + OAuth)
Storage: Supabase Storage (image files)
AI APIs: OpenAI GPT-4o + DALL-E 3
Runtime: Node.js 22+ / Edge Functions
```

### Key Architectural Decisions
- **Server Components First**: Optimal performance with selective client components
- **Monorepo Structure**: Clean separation with npm workspaces
- **Dual-Branch Git Workflow**: Separate local/production configurations
- **Image Proxy System**: Seamless image downloads without expiration limits

---

## 📁 Project Structure

```text
.
├── frontend/                    # Next.js App Router workspace
│   ├── app/                     # Routes and API handlers
│   │   ├── api/                 # API routes (auth, chat, images)
│   │   ├── auth/                # Authentication pages
│   │   ├── gallery/             # Image gallery interface
│   │   └── profile/             # User profile management
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── chat/                # Chat interface components
│   │   ├── gallery/             # Gallery components
│   │   ├── auth/                # Authentication forms
│   │   └── profile/             # Profile settings
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-auth.ts          # Authentication management
│   │   ├── use-conversations.ts # Conversation state
│   │   ├── use-messages.ts      # Message handling
│   │   └── use-gallery.ts       # Gallery management
│   └── lib/                     # Utilities and services
│       ├── db/                  # Database schema & types
│       ├── supabase/            # Supabase client config
│       ├── services/            # API service layers
│       └── validations/         # Zod validation schemas
├── supabase/                    # Supabase backend
│   ├── migrations/              # Database migrations
│   └── queries/                 # SQL utility queries
├── tests/                       # Testing suite
│   ├── unit/                    # Component unit tests
│   ├── integration/             # API integration tests
│   └── e2e/                     # End-to-end tests
└── scripts/                     # Development utilities
    ├── dev/                     # Development tools
    └── ci/                      # CI/CD utilities
```

---

## 🗄️ Database Schema

```sql
-- User Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New Conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz -- Soft delete support
);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'image')),
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- Images
create table public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  prompt text not null,
  image_url text not null,
  storage_path text,
  model text default 'dall-e-3',
  size text default '1024x1024',
  quality text default 'standard',
  created_at timestamptz default now(),
  deleted_at timestamptz
);
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- Supabase CLI
- OpenAI API Key

### Quick Setup

```bash
# 1. Clone and install
git clone https://github.com/ehkarabas/gpt-image-generator.git
cd gpt-image-generator
npm install

# 2. Environment setup
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 3. Start Supabase
npx supabase start

# 4. Start development
npm run dev
```

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-key-here

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

---

## 🧪 Development & Testing

**Quick Commands:**
```bash
npm run dev          # Start development server
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run lint         # Code quality checks
```

**Git Workflow:**
- `config/local`: Development branch (active work)
- `config/remote`: Production configuration
- `main`: Deployment branch

**Development Approach:** This project was built using MVP-focused rapid development with modern UI/UX prioritization. Testing and CI/CD workflows are available but were simplified for faster iteration during the development phase.

---

## 🔮 Future Enhancements

### Phase 2 Roadmap
- **Enhanced Image Management**: Server-side image storage for permanent availability
- **Advanced Authentication**: Server-side auth, email notifications, OTP support
- **Performance Optimization**: Rate limiting, caching, CDN integration
- **Collaboration Features**: Shared workspaces, conversation sharing
- **Advanced AI Features**: Image editing, style transfer, batch operations

### Scalability Considerations
- **Load Balancing**: Traefik integration for high availability
- **Caching Strategy**: Redis for session and API response caching  
- **Image Processing**: Background job queues for heavy operations
- **Monitoring**: Comprehensive analytics and error tracking

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with modern web technologies and AI APIs:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [OpenAI](https://openai.com/) - AI models (GPT-4o, DALL-E 3)
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library