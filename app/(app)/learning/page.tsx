'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAutomationEvents, getFeedbackEntries, getMemories } from '@/lib/mvp-store';
import type { AutomationEvent } from '@/types/automation';
import type { FeedbackEntry } from '@/types/feedback';
import type { Memory } from '@/types/memory';

export default function LearningPage() {
  const [feedback] = useState<FeedbackEntry[]>(() => getFeedbackEntries());
  const [events] = useState<AutomationEvent[]>(() =>
    getAutomationEvents().filter((event) => event.action === 'learn_from_feedback' || event.action === 'self_reflection')
  );
  const [memories] = useState<Memory[]>(() =>
    getMemories().filter((memory) => String(memory.source || '').startsWith('feedback:') || String(memory.source || '').startsWith('self-reflection'))
  );

  const stats = useMemo(
    () => [
      { label: 'Feedback', value: feedback.length },
      { label: 'Lessons', value: memories.length },
      { label: 'Learning events', value: events.length },
    ],
    [feedback.length, memories.length, events.length]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-cyan-200">
          Learning system
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Learning</h1>
          <p className="max-w-3xl text-gray-400">
            Review what Orion has learned from its own responses and from your feedback.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{stat.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent feedback</h2>
              <p className="mt-1 text-sm text-gray-400">Human feedback that Orion can learn from.</p>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                Learning settings
              </Button>
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {feedback.length ? (
              feedback.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-white">
                      {entry.rating === 'helpful' ? 'Helpful' : 'Needs work'}
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {entry.note || entry.user_message || 'Feedback recorded.'}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState
                title="No feedback yet"
                description="Use the chat feedback panel to teach Orion what worked."
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">Lessons learned</h2>
            <p className="mt-1 text-sm text-gray-400">
              Self-reflection notes and feedback-derived memories appear here.
            </p>

            <div className="mt-4 space-y-3">
              {memories.length ? (
                memories.map((memory) => (
                  <article key={memory.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-white">{memory.title}</div>
                      <span className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                        {memory.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{memory.content}</p>
                    <div className="mt-3 text-xs uppercase tracking-[0.25em] text-gray-500">
                      {memory.source || 'learning'}
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No lessons yet"
                  description="Ask Orion a few questions or leave feedback to build this log."
                />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">Learning events</h2>
            <div className="mt-4 space-y-3">
              {events.length ? (
                events.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                    <div className="font-medium text-white">{event.title}</div>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{event.details || event.action}</p>
                    <div className="mt-3 text-xs uppercase tracking-[0.25em] text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No learning events yet"
                  description="Learning activity will appear here after feedback or self-reflection."
                />
              )}
            </div>
          </div>
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
