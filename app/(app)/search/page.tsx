'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { APIResponse } from '@/types/api';
import type { FileRecord } from '@/types/file';
import type { Memory } from '@/types/memory';
import type { Project, Task } from '@/types/task';

interface SearchResult<T> {
  item: T;
  relevance_score: number;
  snippet: string;
}

interface SearchPayload {
  tasks: SearchResult<Task>[];
  memories: SearchResult<Memory>[];
  projects: SearchResult<Project>[];
  files: SearchResult<FileRecord>[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchPayload>({
    tasks: [],
    memories: [],
    projects: [],
    files: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, limit: 5 }),
        });
        const payload = (await response.json()) as APIResponse<SearchPayload>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message || 'Failed to search.');
        }
        setResults(payload.data);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to search.');
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const counts = useMemo(
    () => [
      { label: 'Tasks', value: results.tasks.length },
      { label: 'Memories', value: results.memories.length },
      { label: 'Projects', value: results.projects.length },
      { label: 'Files', value: results.files.length },
    ],
    [results]
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Search</h1>
        <p className="text-gray-400 max-w-2xl">
          Search across tasks, memories, projects, and files using ORION&apos;s unified index.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, memories, projects, files..."
          className="w-full rounded-2xl border border-gray-800 bg-black/50 px-4 py-4 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {counts.map((count) => (
          <div key={count.label} className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{count.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{count.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ResultPanel title="Tasks" count={results.tasks.length} loading={loading}>
          {results.tasks.length ? (
            results.tasks.map((task) => (
              <ResultCard key={task.item.id} title={task.item.title} subtitle={`${task.item.status} · P${task.item.priority}`}>
                {task.snippet || task.item.description || 'No description'}
              </ResultCard>
            ))
          ) : (
            <EmptyState title="No tasks" />
          )}
        </ResultPanel>

        <ResultPanel title="Files" count={results.files.length} loading={loading}>
          {results.files.length ? (
            results.files.map((file) => (
              <ResultCard key={file.item.id} title={file.item.name} subtitle={`${file.item.file_type} · ${file.item.status}`}>
                {file.snippet || file.item.extracted_text || 'No extracted text'}
              </ResultCard>
            ))
          ) : (
            <EmptyState title="No files" />
          )}
        </ResultPanel>

        <ResultPanel title="Memories" count={results.memories.length} loading={loading}>
          {results.memories.length ? (
            results.memories.map((memory) => (
              <ResultCard key={memory.item.id} title={memory.item.title} subtitle={`${memory.item.type} · ${memory.item.importance_score}/10`}>
                {memory.snippet || memory.item.content}
              </ResultCard>
            ))
          ) : (
            <EmptyState title="No memories" />
          )}
        </ResultPanel>

        <ResultPanel title="Projects" count={results.projects.length} loading={loading}>
          {results.projects.length ? (
            results.projects.map((project) => (
              <ResultCard key={project.item.id} title={project.item.name} subtitle={project.item.status}>
                {project.snippet || project.item.description || 'No description'}
              </ResultCard>
            ))
          ) : (
            <EmptyState title="No projects" />
          )}
        </ResultPanel>
      </section>
    </div>
  );
}

function ResultPanel({
  title,
  count,
  children,
  loading,
}: {
  title: string;
  count: number;
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="text-sm text-gray-500">{loading ? '...' : count}</span>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function ResultCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-gray-800 bg-black/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-white">{title}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200">{subtitle}</div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-400">{children}</p>
    </article>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-800 bg-black/30 p-5 text-center text-sm text-gray-500">
      {title}
    </div>
  );
}
