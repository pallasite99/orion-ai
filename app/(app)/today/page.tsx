'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { BriefingService, type DailyBriefing } from '@/services/briefing.service';
import { TaskService } from '@/services/task.service';
import type { Task } from '@/types/task';

export default function TodayPage() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [clock, setClock] = useState(() => new Date());

  const refresh = () => {
    setBriefing(BriefingService.getDailyBriefing());
    setClock(new Date());
  };

  useEffect(() => {
    refresh();
    const interval = window.setInterval(() => {
      setClock(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const markDone = (task: Task) => {
    TaskService.toggleTaskStatus(task.id);
    refresh();
  };

  const stats = [
    { label: 'Due today', value: briefing?.task_snapshot.due_today ?? 0 },
    { label: 'In progress', value: briefing?.task_snapshot.in_progress ?? 0 },
    { label: 'High priority', value: briefing?.task_snapshot.high_priority ?? 0 },
    { label: 'Total tasks', value: briefing?.task_snapshot.total ?? 0 },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-950 via-black to-gray-950 p-6 shadow-xl shadow-cyan-500/5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Daily briefing</div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {briefing?.greeting || 'Good day'}, ORION is ready.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            {briefing?.overview ||
              'A lightweight daily briefing with the tasks, projects, and context that matter now.'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-black/50 px-5 py-4 text-right">
          <div className="text-xs uppercase tracking-[0.3em] text-gray-500">
            {briefing?.date_label || clock.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {briefing?.time_label || clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{stat.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Priority queue</h2>
              <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Today</span>
            </div>
            <div className="mt-4 space-y-3">
              {briefing?.top_tasks.length ? (
                briefing.top_tasks.map((task) => <TaskRow key={task.id} task={task} onComplete={markDone} />)
              ) : (
                <EmptyState title="Nothing urgent" description="Your priority queue is clear for now." />
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Briefing" eyebrow="ORION">
              <p className="text-sm leading-6 text-gray-400">{briefing?.overview}</p>
            </InfoCard>
            <InfoCard title="Project focus" eyebrow="Primary">
              {briefing?.focus_project ? (
                <div className="space-y-2">
                  <div className="font-medium text-white">{briefing.focus_project.name}</div>
                  <p className="text-sm leading-6 text-gray-400">
                    {briefing.focus_project.description || 'No description'}
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-6 text-gray-400">No active project is leading the queue.</p>
              )}
            </InfoCard>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Next actions</h2>
              <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Suggested</span>
            </div>
            <div className="mt-4 space-y-3">
              {(briefing?.next_actions ?? []).map((action) => (
                <div key={action} className="rounded-2xl border border-gray-800 bg-black/40 p-4 text-sm leading-6 text-gray-300">
                  {action}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Reminders</h2>
              <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Pending</span>
            </div>
            <div className="mt-4 space-y-3">
              {(briefing?.reminders ?? []).map((reminder) => (
                <div key={reminder} className="rounded-2xl border border-gray-800 bg-black/40 p-4 text-sm leading-6 text-gray-300">
                  {reminder}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent memories</h2>
              <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Context</span>
            </div>
            <div className="mt-4 space-y-3">
              {(briefing?.recent_memories ?? []).map((memory) => (
                <MemoryRow key={memory.id} memory={memory} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: (task: Task) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-black/40 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-medium text-white">{task.title}</div>
        <div className="mt-1 text-sm text-gray-400">
          {task.description || 'No description'} · Priority {task.priority}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          {task.status}
        </span>
        <Button variant="outline" size="sm" onClick={() => onComplete(task)}>
          {task.status === 'done' ? 'Reopen' : 'Done'}
        </Button>
      </div>
    </div>
  );
}

function MemoryRow({ memory }: { memory: { title: string; content: string; type: string } }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-white">{memory.title}</div>
        <span className="text-xs uppercase tracking-[0.25em] text-gray-500">{memory.type}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-gray-400">{memory.content}</p>
    </div>
  );
}

function InfoCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
      <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">{eyebrow}</div>
      <h2 className="mt-3 text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
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
