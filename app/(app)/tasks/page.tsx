'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedLocalData } from '@/lib/mvp-store';
import { TaskService } from '@/services/task.service';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in_progress', 'done', 'blocked'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: '3',
    due_date: '',
  });

  const refresh = () => setTasks(TaskService.getTasks());

  useEffect(() => {
    seedLocalData();
    refresh();
  }, []);

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery =
        !normalized ||
        task.title.toLowerCase().includes(normalized) ||
        (task.description || '').toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [tasks, query, statusFilter]);

  const addTask = () => {
    if (!form.title.trim()) return;

    TaskService.createTask({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: Number(form.priority) as TaskPriority,
      due_date: form.due_date || undefined,
    });

    setForm({
      title: '',
      description: '',
      priority: '3',
      due_date: '',
    });
    refresh();
  };

  const handleToggle = (task: Task) => {
    TaskService.toggleTaskStatus(task.id);
    refresh();
  };

  const handleDelete = (task: Task) => {
    TaskService.deleteTask(task.id);
    refresh();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-gray-400 max-w-2xl">
          A usable task board with add, complete, filter, and delete flows that persist locally.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: tasks.length },
          { label: 'Open', value: tasks.filter((task) => task.status !== 'done').length },
          { label: 'Done', value: tasks.filter((task) => task.status === 'done').length },
          { label: 'Blocked', value: tasks.filter((task) => task.status === 'blocked').length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{stat.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <h2 className="text-lg font-semibold text-white">Add task</h2>
          <div className="mt-4 space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Task title"
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              rows={4}
              className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              >
                {[5, 4, 3, 2, 1].map((priority) => (
                  <option key={priority} value={priority}>
                    Priority {priority}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <Button onClick={addTask} className="w-full bg-cyan-400 text-black hover:bg-cyan-300">
              Add task
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-white">Task list</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks"
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none md:w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
                className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none md:w-40"
              >
                <option value="all">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredTasks.length ? (
              filteredTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium text-white">{task.title}</h3>
                        <StatusPill status={task.status} />
                        <PriorityPill priority={task.priority} />
                      </div>
                      <p className="text-sm leading-6 text-gray-400">
                        {task.description || 'No description'}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                        Due {task.due_date || 'unscheduled'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggle(task)}>
                        {task.status === 'done' ? 'Reopen' : 'Done'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(task)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No matching tasks"
                description="Create a task or adjust your filters to see results."
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: TaskStatus }) {
  const palette: Record<TaskStatus, string> = {
    todo: 'border-gray-700 bg-gray-900 text-gray-300',
    in_progress: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
    done: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    blocked: 'border-red-500/30 bg-red-500/10 text-red-200',
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${palette[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityPill({ priority }: { priority: TaskPriority }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">
      P{priority}
    </span>
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
