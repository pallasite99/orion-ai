-- ORION - Supabase Database Schema

-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Enable full-text search
create extension if not exists pg_trgm;

-- Auth users table (extended profile)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar unique not null,
  display_name varchar,
  avatar_url varchar,
  preferences jsonb default '{"theme": "dark", "orion_tone": "friendly", "voice_enabled": false, "memory_enabled": true}',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Chats
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title varchar,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role varchar check (role in ('user', 'assistant')) not null,
  content text not null,
  metadata jsonb,
  created_at timestamp default now()
);

-- Memories
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type varchar check (type in ('fact', 'preference', 'task', 'project', 'file', 'note')) not null,
  title varchar not null,
  content text not null,
  tags varchar[] default '{}',
  source varchar,
  importance_score int default 5 check (importance_score >= 0 and importance_score <= 10),
  embedding vector(1536),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title varchar not null,
  description text,
  status varchar default 'todo' check (status in ('todo', 'in_progress', 'done', 'blocked')),
  priority int default 2 check (priority in (1, 2, 3, 4, 5)),
  due_date date,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar not null,
  description text,
  status varchar default 'active' check (status in ('active', 'completed', 'archived')),
  color varchar,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Files
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar not null,
  file_type varchar,
  storage_url varchar,
  extracted_text text,
  status varchar default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamp default now()
);

-- File Chunks
create table if not exists file_chunks (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references files(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamp default now()
);

-- Reminders
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  title varchar not null,
  description text,
  due_at timestamp,
  status varchar default 'active' check (status in ('active', 'completed', 'dismissed')),
  created_at timestamp default now()
);

-- Focus Sessions
create table if not exists focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  duration_minutes int,
  notes text,
  summary text,
  started_at timestamp,
  ended_at timestamp
);

-- Automation Events
create table if not exists automation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  action varchar not null,
  status varchar not null default 'info' check (status in ('success', 'error', 'info')),
  title varchar not null,
  details text,
  created_at timestamp default now()
);

-- Indexes for performance

-- Chats
create index idx_chats_user_id_created on chats(user_id, created_at desc);

-- Messages
create index idx_messages_chat_id_created on messages(chat_id, created_at asc);
create index idx_messages_user_id_created on messages(user_id, created_at desc);

-- Memories
create index idx_memories_user_id_type on memories(user_id, type);
create index idx_memories_user_id_created on memories(user_id, created_at desc);
create index idx_memories_user_id_importance on memories(user_id, importance_score desc);
create index idx_memories_content_text_search on memories using gin (to_tsvector('english', content));

-- Tasks
create index idx_tasks_user_id_status on tasks(user_id, status);
create index idx_tasks_user_id_due_date on tasks(user_id, due_date asc);
create index idx_tasks_project_id on tasks(project_id);

-- Projects
create index idx_projects_user_id_status on projects(user_id, status);

-- Files
create index idx_files_user_id_created on files(user_id, created_at desc);

-- File Chunks
create index idx_file_chunks_file_id on file_chunks(file_id);
create index idx_file_chunks_user_id on file_chunks(user_id);

-- Reminders
create index idx_reminders_user_id_due on reminders(user_id, due_at asc);
create index idx_reminders_user_id_status on reminders(user_id, status);

-- Focus Sessions
create index idx_focus_sessions_user_id_started on focus_sessions(user_id, started_at desc);

-- Automation Events
create index idx_automation_events_user_id_created on automation_events(user_id, created_at desc);

-- Row Level Security (RLS)

-- Enable RLS on all tables
alter table users enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table memories enable row level security;
alter table tasks enable row level security;
alter table projects enable row level security;
alter table files enable row level security;
alter table file_chunks enable row level security;
alter table reminders enable row level security;
alter table focus_sessions enable row level security;
alter table automation_events enable row level security;

-- Policies

-- Users can only read/update their own profile
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

-- Users can only access their own chats
create policy "Users can view own chats" on chats
  for select using (auth.uid() = user_id);

create policy "Users can create own chats" on chats
  for insert with check (auth.uid() = user_id);

create policy "Users can update own chats" on chats
  for update using (auth.uid() = user_id);

create policy "Users can delete own chats" on chats
  for delete using (auth.uid() = user_id);

-- Users can only access their own messages
create policy "Users can view own messages" on messages
  for select using (auth.uid() = user_id);

create policy "Users can create own messages" on messages
  for insert with check (auth.uid() = user_id);

-- Users can only access their own memories
create policy "Users can view own memories" on memories
  for select using (auth.uid() = user_id);

create policy "Users can create own memories" on memories
  for insert with check (auth.uid() = user_id);

create policy "Users can update own memories" on memories
  for update using (auth.uid() = user_id);

create policy "Users can delete own memories" on memories
  for delete using (auth.uid() = user_id);

-- Users can only access their own tasks
create policy "Users can view own tasks" on tasks
  for select using (auth.uid() = user_id);

create policy "Users can create own tasks" on tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- Users can only access their own projects
create policy "Users can view own projects" on projects
  for select using (auth.uid() = user_id);

create policy "Users can create own projects" on projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on projects
  for delete using (auth.uid() = user_id);

-- Similar policies for files, reminders, focus_sessions
create policy "Users can view own files" on files
  for select using (auth.uid() = user_id);

create policy "Users can create own files" on files
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own files" on files
  for delete using (auth.uid() = user_id);

create policy "Users can view own file chunks" on file_chunks
  for select using (auth.uid() = user_id);

create policy "Users can view own reminders" on reminders
  for select using (auth.uid() = user_id);

create policy "Users can manage own reminders" on reminders
  for insert with check (auth.uid() = user_id);

create policy "Users can update own reminders" on reminders
  for update using (auth.uid() = user_id);

create policy "Users can view own focus sessions" on focus_sessions
  for select using (auth.uid() = user_id);

create policy "Users can create own focus sessions" on focus_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can view own automation events" on automation_events
  for select using (auth.uid() = user_id);

create policy "Users can create own automation events" on automation_events
  for insert with check (auth.uid() = user_id);

-- Vector search function for memories
create or replace function search_memories(
  user_id_input uuid,
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 10
)
returns table (
  id uuid,
  user_id uuid,
  type varchar,
  title varchar,
  content text,
  tags varchar[],
  source varchar,
  importance_score int,
  embedding vector(1536),
  created_at timestamp,
  updated_at timestamp,
  relevance_score float
) as $$
begin
  return query
  select 
    m.id,
    m.user_id,
    m.type,
    m.title,
    m.content,
    m.tags,
    m.source,
    m.importance_score,
    m.embedding,
    m.created_at,
    m.updated_at,
    (1 - (m.embedding <=> query_embedding)) as relevance_score
  from memories m
  where m.user_id = user_id_input
    and (1 - (m.embedding <=> query_embedding)) > match_threshold
  order by relevance_score desc
  limit match_count;
end;
$$ language plpgsql;

-- Triggers for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger update_chats_updated_at before update on chats
  for each row execute function update_updated_at_column();

create trigger update_memories_updated_at before update on memories
  for each row execute function update_updated_at_column();

create trigger update_tasks_updated_at before update on tasks
  for each row execute function update_updated_at_column();

create trigger update_projects_updated_at before update on projects
  for each row execute function update_updated_at_column();
