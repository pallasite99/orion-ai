# ORION - Personal AI Operating System

> An intelligent, context-aware assistant that acts like a personal intelligence layer across your digital life.

## Overview

ORION is a software-first personal AI operating system. It combines AI chat with long-term memory, task management, file search, voice input, automation, and a feedback-driven learning loop.

## Features

- **Persistent AI Chat** - Continuous conversations with Markdown responses
- **Long-term Memory** - Automatic memory extraction and semantic retrieval
- **Daily Briefing** - Personalized summaries and task prioritization
- **Task & Project Management** - Organize work with smart workflows
- **File & Knowledge Search** - Upload and search documents
- **Voice Input** - Push-to-talk transcription in chat
- **Focus Mode** - Session-based distraction-free productivity
- **Automation Layer** - Create tasks, reminders, and activity logs from chat
- **Learning Loop** - Save feedback, capture lessons, and improve responses over time
- **Settings Console** - Tune tone, memory, voice, language, timezone, and learning
- **Command-Center UI** - Premium, minimal, futuristic design

## Tech Stack

- **Frontend**: Next.js 16+, React 19+, TypeScript, TailwindCSS
- **Backend**: Next.js API routes, local MVP store, Supabase-compatible client
- **Database**: PostgreSQL with `pgvector` support when Supabase is enabled
- **AI**: Mock, Groq, or OpenAI depending on environment variables
- **Desktop** (Optional): Tauri

## Quick Start

### Prerequisites

- Node.js 18+
- Optional Supabase account if you want real persistence
- Optional Groq or OpenAI API key for live AI responses

### Setup

```bash
npm install

cp .env.example .env.local

# Add your API keys to .env.local
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_KEY=...
# GROQ_API_KEY=...
# AI_PROVIDER=mock
# OPENAI_API_KEY=... # optional fallback

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Supabase Setup

1. Create a Supabase project
2. Enable the `pgvector` extension
3. Run `supabase/migrations/001_init_schema.sql`
4. Enable Row-Level Security policies
5. Set the Supabase keys in `.env.local`

## Project Structure

```text
app/                    # Next.js app directory
├── api/                # API routes
├── (app)/              # Authenticated routes with sidebar
│   ├── page.tsx        # Dashboard
│   ├── chat/           # Chat interface
│   ├── today/          # Daily briefing
│   ├── tasks/          # Task management
│   └── ...
└── auth/               # Auth pages

components/             # React components
lib/                    # Utilities and shared data layer
services/               # Business logic
types/                  # TypeScript types
```

## Development

```bash
npm run build
npx tsc --noEmit
npm run dev
```

## API Routes

- `POST /api/chat` - Send a message and get a generated reply
- `GET /api/memory` - List memories
- `POST /api/memory` - Create memory
- `GET /api/files` - List files
- `POST /api/files` - Upload file
- `GET /api/search` - Global search
- `POST /api/voice/transcribe` - Transcribe audio

## Deployment

### GitHub / Netlify / Vercel

Push to `main` for CI or deployment flows configured in your host.

### Environment Variables

Set these in your deployment environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GROQ_API_KEY`
- `AI_PROVIDER` (`mock`, `groq`, or `openai`)
- `OPENAI_API_KEY`

## Configuration

### Customize UI Theme

Edit `app/globals.css`. ORION uses a dark command-center style with cyan accents.

### AI Models

- Chat: `llama-3.1-8b-instant` on Groq or `gpt-4o` on OpenAI
- Embeddings: `text-embedding-3-small`
- Voice: Whisper and TTS

## Known Limitations

- MVP scope: single user
- No calendar or email integration yet
- Real AI requires valid API keys
- Server-side Supabase persistence is optional
- Learning is local and feedback-driven, not model fine-tuning

## Current Status

- Phase 2: Memory system
- Phase 3: Daily OS and task management
- Phase 4: File upload and search
- Phase 5: Voice interface
- Phase 6: Automation workflows
- Phase 7: Learning from self and user feedback

## Contributing

Contributions welcome. Check GitHub issues for follow-up work.

## License

MIT

---

**ORION v0.1.0** - Built with Next.js, Supabase, and OpenAI
