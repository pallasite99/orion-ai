'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { InboxService } from '@/services/inbox.service';
import { getInboxItems } from '@/lib/mvp-store';
import type { InboxItem, InboxItemType } from '@/types/inbox';

const TYPE_META: Record<InboxItemType, { label: string; color: string }> = {
  task: { label: 'Task', color: 'text-cyan-200' },
  reminder: { label: 'Reminder', color: 'text-amber-200' },
  note: { label: 'Note', color: 'text-emerald-200' },
  link: { label: 'Link', color: 'text-violet-200' },
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>(() => getInboxItems());
  const [text, setText] = useState('');
  const [type, setType] = useState<InboxItemType>('note');
  const [title, setTitle] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const refresh = () => setItems(getInboxItems());

  const stats = useMemo(
    () => [
      { label: 'Total', value: items.length },
      { label: 'New', value: items.filter((item) => item.status === 'new').length },
      { label: 'Triaged', value: items.filter((item) => item.status === 'triaged').length },
      { label: 'Archived', value: items.filter((item) => item.status === 'archived').length },
    ],
    [items]
  );

  const submitCapture = () => {
    if (!text.trim()) return;
    InboxService.capture(
      {
        type,
        title: title.trim() || text.trim().slice(0, 60),
        content: text.trim(),
        source: 'manual',
      },
      'user-placeholder'
    );
    setText('');
    setTitle('');
    setType('note');
    refresh();
  };

  const quickCapture = () => {
    if (!text.trim()) return;
    InboxService.captureFromText(text.trim(), 'user-placeholder');
    setText('');
    setTitle('');
    refresh();
  };

  const triage = (item: InboxItem, action: 'task' | 'reminder' | 'memory' | 'archive') => {
    setLoadingId(item.id);
    try {
      if (action === 'task') InboxService.triageToTask(item.id, 'user-placeholder');
      if (action === 'reminder') InboxService.triageToReminder(item.id, 'user-placeholder');
      if (action === 'memory') InboxService.triageToMemory(item.id, 'user-placeholder');
      if (action === 'archive') InboxService.archive(item.id);
      refresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-cyan-200">
          Capture inbox
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Inbox</h1>
          <p className="max-w-3xl text-gray-400">
            Collect ideas, tasks, links, reminders, and notes in one place. Triage them into Orion&apos;s working memory when ready.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{stat.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Quick capture</h2>
              <p className="mt-1 text-sm text-gray-400">
                Add structured items or let Orion infer the type from the text.
              </p>
            </div>
            <Button variant="outline" onClick={quickCapture} disabled={!text.trim()}>
              Infer type
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-2xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InboxItemType)}
              className="w-full rounded-2xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="note">Note</option>
              <option value="task">Task</option>
              <option value="reminder">Reminder</option>
              <option value="link">Link</option>
            </select>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Capture a task, note, reminder, or link..."
            className="mt-4 w-full rounded-2xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="bg-cyan-600 font-semibold text-black hover:bg-cyan-700" onClick={submitCapture} disabled={!text.trim()}>
              Save to inbox
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setText('');
                setTitle('');
                setType('note');
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">Triage tips</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-300">
            <li>Use the inbox to capture ideas in seconds, then refine them later.</li>
            <li>Turn an item into a task, reminder, or memory when it becomes actionable.</li>
            <li>Archive noise quickly so the inbox stays usable.</li>
            <li>Use infer mode when you want Orion to decide the best item type.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Inbox items</h2>
            <p className="mt-1 text-sm text-gray-400">Newest items appear first.</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {items.length ? (
            items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-medium text-white">{item.title}</h3>
                      <span className={`text-xs uppercase tracking-[0.2em] ${TYPE_META[item.type].color}`}>
                        {TYPE_META[item.type].label}
                      </span>
                      <span className="rounded-full border border-gray-800 bg-black/50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-400">
                        {item.status}
                      </span>
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-gray-400">{item.content}</p>
                    <div className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triage(item, 'task')}
                      disabled={loadingId === item.id}
                    >
                      Task
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triage(item, 'reminder')}
                      disabled={loadingId === item.id}
                    >
                      Reminder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triage(item, 'memory')}
                      disabled={loadingId === item.id}
                    >
                      Memory
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triage(item, 'archive')}
                      disabled={loadingId === item.id}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="Inbox is empty"
              description="Capture a few notes, tasks, or reminders to start building the queue."
            />
          )}
        </div>
      </section>
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
