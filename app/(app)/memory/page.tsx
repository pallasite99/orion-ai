'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { APIResponse } from '@/types/api';
import type { Memory, MemoryCreateRequest, MemoryType, MemoryUpdateRequest } from '@/types/memory';

const MEMORY_TYPES: MemoryType[] = ['fact', 'preference', 'task', 'project', 'file', 'note'];

const EMPTY_FORM = {
  title: '',
  content: '',
  type: 'note' as MemoryType,
  tags: '',
  importance_score: '5',
  source: 'manual',
};

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function readJson<T>(response: Response): Promise<APIResponse<T>> {
  return response.json();
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MemoryType>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filteredMemories = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return memories.filter((memory) => {
      const matchesQuery =
        !normalized ||
        memory.title.toLowerCase().includes(normalized) ||
        memory.content.toLowerCase().includes(normalized) ||
        memory.type.toLowerCase().includes(normalized) ||
        memory.tags.some((tag) => tag.toLowerCase().includes(normalized));
      const matchesType = typeFilter === 'all' || memory.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [memories, query, typeFilter]);

  const stats = useMemo(
    () => [
      { label: 'Total', value: memories.length },
      { label: 'Facts', value: memories.filter((memory) => memory.type === 'fact').length },
      {
        label: 'Preferences',
        value: memories.filter((memory) => memory.type === 'preference').length,
      },
      { label: 'Notes', value: memories.filter((memory) => memory.type === 'note').length },
    ],
    [memories]
  );

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/memory?limit=200', { cache: 'no-store' });
      const payload = await readJson<{ memories: Memory[]; total: number }>(response);

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || 'Failed to load memories.');
      }

      setMemories(payload.data.memories);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load memories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const beginCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const beginEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setForm({
      title: memory.title,
      content: memory.content,
      type: memory.type,
      tags: memory.tags.join(', '),
      importance_score: String(memory.importance_score),
      source: memory.source || 'manual',
    });
  };

  const submitMemory = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload: MemoryCreateRequest | MemoryUpdateRequest = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      tags: parseTags(form.tags),
      importance_score: Number(form.importance_score),
    };

    try {
      const response = await fetch(editingId ? `/api/memory/${editingId}` : '/api/memory', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingId ? payload : { ...payload, source: form.source }),
      });
      const result = await readJson<Memory>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save memory.');
      }

      await refresh();
      beginCreate();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save memory.');
    } finally {
      setSaving(false);
    }
  };

  const removeMemory = async (memory: Memory) => {
    if (!window.confirm(`Delete "${memory.title}"?`)) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/memory/${memory.id}`, {
        method: 'DELETE',
      });
      const result = await readJson<{ deleted: boolean }>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete memory.');
      }

      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete memory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Memory</h1>
        <p className="max-w-2xl text-gray-400">
          A persistent memory bank for facts, preferences, notes, and recurring context.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{stat.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit memory' : 'Add memory'}
              </h2>
              <p className="text-sm text-gray-500">
                {editingId ? 'Update an existing memory entry.' : 'Capture a new memory manually.'}
              </p>
            </div>
            {editingId ? (
              <Button variant="outline" size="sm" type="button" onClick={beginCreate}>
                Cancel
              </Button>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Title"
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Memory content"
              rows={6}
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as MemoryType }))}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              >
                {MEMORY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                max={10}
                value={form.importance_score}
                onChange={(e) => setForm((prev) => ({ ...prev, importance_score: e.target.value }))}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <input
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="Tags, comma separated"
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <input
              value={form.source}
              onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))}
              placeholder="Source"
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <Button
              onClick={submitMemory}
              className="w-full bg-cyan-400 text-black hover:bg-cyan-300"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingId ? 'Update memory' : 'Save memory'}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Memory list</h2>
              <p className="text-sm text-gray-500">Filter, edit, and delete memory entries.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search memories"
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none md:w-64"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | MemoryType)}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none md:w-40"
              >
                <option value="all">All</option>
                {MEMORY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <LoadingState />
            ) : filteredMemories.length ? (
              filteredMemories.map((memory) => (
                <article key={memory.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium text-white">{memory.title}</h3>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                          {memory.type}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">
                          {memory.importance_score}/10
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-gray-400">{memory.content}</p>
                      <div className="flex flex-wrap gap-2">
                        {memory.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-gray-800 bg-black/50 px-3 py-1 text-xs text-gray-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        Source: {memory.source || 'manual'} · Updated{' '}
                        {new Date(memory.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => beginEdit(memory)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={() => void removeMemory(memory)}
                        disabled={saving}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                title="No matching memories"
                description="Add a memory or adjust the search filter."
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-800 bg-black/30 p-6 text-center text-sm text-gray-500">
      Loading memories...
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-800 bg-black/30 p-6 text-center">
      <div className="font-medium text-white">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{description}</div>
    </div>
  );
}
