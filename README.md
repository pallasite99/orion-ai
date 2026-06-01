# ORION - Personal AI Operating System

> An intelligent, context-aware AI assistant that feels like a personal intelligence layer across your digital life.

## Overview

ORION is an MVP (Minimum Viable Product) of a software-first personal AI operating system. It combines intelligent AI conversations with long-term memory, task management, file search, voice interaction, and more.

## Features

- **Persistent AI Chat** - Continuous conversations with streaming responses
- **Long-term Memory** - Automatic memory extraction and semantic retrieval
- **Daily Briefing** - Personalized summaries and task prioritization
- **Task & Project Management** - Organize work with smart features
- **File & Knowledge Search** - Upload and search documents
- **Voice Input/Output** - Push-to-talk interaction
- **Focus Mode** - Distraction-free productivity
- **Command-Center UI** - Premium, minimal, futuristic design

## Tech Stack

- **Frontend**: Next.js 16+, React 19+, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL with pgvector
- **AI**: Groq free tier by default, with OpenAI support as a fallback
- **Desktop** (Optional): Tauri

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Groq API key for the free-tier chat path, or OpenAI API key if you want the original provider

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your API keys to .env.local
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_KEY=...
# GROQ_API_KEY=...
# AI_PROVIDER=groq
# OPENAI_API_KEY=... # optional fallback

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Supabase Setup

1. Create a Supabase project
2. Enable pgvector extension
3. Run SQL migrations from `supabase/migrations/001_init_schema.sql`
4. Enable Row-Level Security (RLS) policies

## Project Structure

```
app/                    # Next.js app directory
├── api/               # API routes
├── (app)/             # Authenticated routes with sidebar
│   ├── page.tsx       # Dashboard
│   ├── chat/          # Chat interface
│   ├── today/         # Daily briefing
│   ├── tasks/         # Task management
│   └── ...
└── auth/              # Auth pages

components/           # React components
lib/                  # Utilities & services
services/             # Business logic
types/                # TypeScript types
```

## Development

```bash
# Build
npm run build

# Type check
npx tsc --noEmit

# Development with hot reload
npm run dev
```

## API Routes

- `POST /api/chat` - Send message and get a generated reply
- `GET /api/memory` - List memories
- `POST /api/memory` - Create memory
- `GET /api/tasks` - List tasks
- `POST /api/files` - Upload file
- `POST /api/search` - Global search

## Deployment

### Vercel
```bash
git push origin main  # Auto-deploys to Vercel
```

### Environment Variables
Set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GROQ_API_KEY`
- `AI_PROVIDER` (`groq`, `openai`, or `mock`)
- `OPENAI_API_KEY`

## Configuration

### Customize UI Theme
Edit `app/globals.css` - ORION uses black & white command-center style with cyan accents

### AI Models
- Chat: `llama-3.1-8b-instant` on Groq or `gpt-4o` on OpenAI
- Embeddings: `text-embedding-3-small`
- Voice: Whisper & TTS

## Known Limitations

- MVP scope: single user
- No calendar/email integration yet
- Vector search requires pgvector
- Memory extraction is rule-based

## Next Steps

- [ ] Phase 2: Memory system implementation
- [ ] Phase 3: Daily OS and task management
- [ ] Phase 4: File upload and search
- [ ] Phase 5: Voice interface
- [ ] Phase 6: Automation workflows

## Contributing

Contributions welcome! Check GitHub issues for tasks.

## License

MIT

---

**ORION v0.1.0** - Built with Next.js, Supabase, and OpenAI
