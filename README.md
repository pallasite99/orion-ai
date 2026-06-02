# ORION

> Personal AI operating system for chat, memory, tasks, files, voice, automation, inbox capture, and self-learning.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-compatible-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-6e9f18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

## What It Is

ORION is a software-first personal intelligence layer. It keeps context, organizes work, searches files, records voice input, automates repetitive actions, captures incoming work in an inbox, and learns from feedback so responses improve over time.

<img width="1131" height="787" alt="image" src="https://github.com/user-attachments/assets/411d69b3-530f-417b-936a-4ed28d17c2cd" />


## Why It Stands Out

- Built as a command-center, not a generic chat app
- Memory-aware chat with retrieval and extraction
- Task, project, file, and reminder workflows in one place
- Automation that can create work items from conversation
- Feedback loop that stores lessons and helpful patterns
- Capture inbox for fast triage of ideas, tasks, links, and reminders
- Local MVP mode works without cloud setup

## Feature Snapshot

| Area | What it does |
| --- | --- |
| Chat | Markdown responses, memory context, voice input |
| Memory | Persistent facts, preferences, and lessons |
| Today | Daily briefing, priorities, reminders, focus cues |
| Tasks | Create, update, and manage work items |
| Files | Upload, chunk, search, and ask questions |
| Focus | Pomodoro-style sessions with summaries |
| Search | Unified search across tasks, memories, projects, and files |
| Settings | Tone, language, timezone, voice, memory, learning |
| Learning | Feedback capture and self-reflection notes |
| Inbox | Quick capture and triage for tasks, notes, reminders, and links |

## Screens At a Glance

- `app/(app)/chat/page.tsx` for conversational workflow and feedback teaching
- `app/(app)/today/page.tsx` for the daily briefing dashboard
- `app/(app)/memory/page.tsx` for memory review and editing
- `app/(app)/files/page.tsx` for uploads, chunking, and file Q&A
- `app/(app)/inbox/page.tsx` for capture and triage
- `app/(app)/learning/page.tsx` for feedback and lessons
- `app/(app)/settings/page.tsx` for personalization and learning controls

<img width="1123" height="870" alt="image" src="https://github.com/user-attachments/assets/3f20e6bf-66cd-4eac-831c-a50d9f451203" />
<img width="990" height="616" alt="image" src="https://github.com/user-attachments/assets/0dc443cb-7384-4b03-8359-f8c1062750f1" />
<img width="998" height="762" alt="image" src="https://github.com/user-attachments/assets/aa867cf4-5994-40d6-8714-f0c53577d93c" />
<img width="1101" height="846" alt="image" src="https://github.com/user-attachments/assets/00c59894-5c3e-48b3-9cf6-f2cb4838c06a" />


## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Next.js route handlers
- Storage: local MVP store with Supabase-compatible abstractions
- AI: mock, Groq, or OpenAI depending on environment variables
- Testing: Vitest

## Quick Start

```bash
npm install

cp .env.example .env.local

# Safe local default:
# AI_PROVIDER=mock

npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `AI_PROVIDER` - `mock`, `groq`, or `openai`
- `GROQ_API_KEY` - optional live model key
- `OPENAI_API_KEY` - optional fallback key
- `NEXT_PUBLIC_SUPABASE_URL` - optional real Supabase connection
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

## Development

```bash
npx tsc --noEmit
npm test
npm run build
```

## API Routes

- `POST /api/chat`
- `GET /api/memory`
- `POST /api/memory`
- `GET /api/files`
- `POST /api/files`
- `GET /api/search`
- `POST /api/voice/transcribe`

## Project Structure

```text
app/
  api/         # API routes
  (app)/       # Authenticated app shell
components/    # UI and layout components
lib/           # Shared data layer and AI helpers
services/      # Business logic
types/         # TypeScript types
supabase/      # SQL migrations
tests/         # Vitest coverage
```

## Supabase Setup

1. Create a Supabase project
2. Enable the `pgvector` extension
3. Run `supabase/migrations/001_init_schema.sql`
4. Enable Row-Level Security policies
5. Add the Supabase keys to `.env.local`

## Current Phases

- Phase 2: Memory system
- Phase 3: Daily OS and task management
- Phase 4: File upload and search
- Phase 5: Voice interface
- Phase 6: Automation workflows
- Phase 7: Learning from self and user feedback
- Phase 8: Unified inbox and learning surfaces

## Known Limitations

- Single-user MVP
- No calendar or email integration yet
- Real AI requires valid API keys
- Server-side Supabase persistence is optional
- Learning is local and feedback-driven, not model fine-tuning
- Inbox is local-first capture and triage, not a full email client

## Contributing

If you want to help, the best entry points are:

1. Improve UX polish in the app shell and dashboard.
2. Expand automation rules and reminder workflows.
3. Tighten the learning loop and feedback history.
4. Add more test coverage around the app routes and services.
5. Expand the inbox into a true triage workspace with shortcuts and filters.

## License

MIT

---

Built with Next.js, Supabase-compatible storage, and OpenAI-ready AI helpers.
