'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FocusService } from '@/services/focus.service';
import { TaskService } from '@/services/task.service';
import type { FocusSession } from '@/types/focus';

const FOCUS_KEY = 'orion.mvp.focus';

type FocusState = {
  durationMinutes: number;
  remainingSeconds: number;
  running: boolean;
  taskId: string;
  projectId: string;
  notes: string;
  activeSessionId?: string;
};

const defaultState = (durationMinutes = 25): FocusState => ({
  durationMinutes,
  remainingSeconds: durationMinutes * 60,
  running: false,
  taskId: '',
  projectId: '',
  notes: '',
});

export default function FocusPage() {
  const [state, setState] = useState<FocusState>(defaultState());
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState(() => TaskService.getTasks());
  const [projects, setProjects] = useState(() => TaskService.getProjects());
  const timerRef = useRef<number | null>(null);

  const refresh = () => {
    setSessions(FocusService.listSessions());
    setTasks(TaskService.getTasks());
    setProjects(TaskService.getProjects());
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(FOCUS_KEY);
    if (raw) {
      try {
        setState({ ...defaultState(), ...JSON.parse(raw) });
      } catch {
        setState(defaultState());
      }
    }
    refresh();
  }, []);

  useEffect(() => {
    if (!state.running) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    timerRef.current = window.setInterval(() => {
      setState((prev) => {
        if (prev.remainingSeconds <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          void finishSession();
          return { ...prev, running: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [state.running]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FOCUS_KEY, JSON.stringify(state));
    }
  }, [state]);

  const displayTime = useMemo(() => {
    const minutes = Math.floor(state.remainingSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (state.remainingSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [state.remainingSeconds]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === state.activeSessionId) || FocusService.getActiveSession(),
    [sessions, state.activeSessionId]
  );

  const start = () => {
    const session = FocusService.startSession({
      duration_minutes: state.durationMinutes,
      task_id: state.taskId || undefined,
      project_id: state.projectId || undefined,
      notes: state.notes || undefined,
    });

    setState((prev) => ({
      ...prev,
      running: true,
      remainingSeconds: prev.durationMinutes * 60,
      activeSessionId: session.id,
    }));
    refresh();
  };

  const finishSession = async () => {
    const sessionId = state.activeSessionId || activeSession?.id;
    if (!sessionId) return;

    const session = FocusService.finishSession(sessionId, FocusService.buildSessionSummary({
      ...(activeSession || {
        id: sessionId,
        user_id: 'user-placeholder',
        duration_minutes: state.durationMinutes,
        started_at: new Date().toISOString(),
      }),
      task_id: state.taskId || undefined,
      project_id: state.projectId || undefined,
      notes: state.notes || undefined,
      ended_at: new Date().toISOString(),
    } as FocusSession));

    setState((prev) => ({
      ...prev,
      running: false,
      remainingSeconds: prev.durationMinutes * 60,
      activeSessionId: undefined,
    }));
    refresh();
    return session;
  };

  const pause = () => setState((prev) => ({ ...prev, running: false }));

  const reset = () =>
    setState((prev) => ({
      ...prev,
      running: false,
      remainingSeconds: prev.durationMinutes * 60,
      activeSessionId: undefined,
    }));

  const setDuration = (minutes: number) =>
    setState((prev) => ({
      ...prev,
      durationMinutes: minutes,
      remainingSeconds: minutes * 60,
      running: false,
    }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Focus</h1>
        <p className="max-w-2xl text-gray-400">
          Session-based focus mode with task/project selection and end-of-session summaries.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Sessions', value: sessions.length },
          { label: 'Running', value: state.running ? 1 : 0 },
          { label: 'Tasks', value: tasks.length },
          { label: 'Projects', value: projects.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{stat.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
        <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-800 bg-black/50 p-8 text-center">
            <div className="text-xs uppercase tracking-[0.4em] text-cyan-300">Focus session</div>
            <div className="mt-4 text-6xl font-semibold tabular-nums text-white">{displayTime}</div>
            <div className="mt-3 text-sm text-gray-500">
              {state.running ? 'Session running' : 'Ready to start'}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={start} className="bg-cyan-400 text-black hover:bg-cyan-300" disabled={state.running}>
                Start
              </Button>
              <Button variant="outline" onClick={pause} disabled={!state.running}>
                Pause
              </Button>
              <Button variant="outline" onClick={reset}>
                Reset
              </Button>
              <Button variant="destructive" onClick={() => void finishSession()} disabled={!state.activeSessionId && !activeSession}>
                Finish
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
              <div className="text-sm uppercase tracking-[0.25em] text-gray-500">Duration</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[15, 25, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setDuration(minutes)}
                    className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                      state.durationMinutes === minutes
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                        : 'border-gray-800 bg-black/50 text-gray-300 hover:border-gray-700 hover:bg-gray-900'
                    }`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
              <div className="text-sm uppercase tracking-[0.25em] text-gray-500">Target</div>
              <div className="mt-3 space-y-3">
                <select
                  value={state.taskId}
                  onChange={(e) => setState((prev) => ({ ...prev, taskId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">No task selected</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
                <select
                  value={state.projectId}
                  onChange={(e) => setState((prev) => ({ ...prev, projectId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">No project selected</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={state.notes}
                  onChange={(e) => setState((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Session notes"
                  rows={4}
                  className="w-full rounded-xl border border-gray-800 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Session history</h2>
            <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Recent</span>
          </div>
          <div className="mt-4 space-y-3">
            {sessions.length ? (
              sessions.map((session) => (
                <article key={session.id} className="rounded-2xl border border-gray-800 bg-black/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{session.duration_minutes} minute session</div>
                      <p className="mt-1 text-sm text-gray-400">
                        Started {new Date(session.started_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">
                      {session.ended_at ? 'complete' : 'active'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-400">
                    {session.summary || session.notes || 'No summary yet.'}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState title="No sessions yet" description="Start a focus session to build your history." />
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-950/70 p-5">
          <h2 className="text-lg font-semibold text-white">Usage</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-300">
            <li>• Work in one tab and keep the rest of the app quiet.</li>
            <li>• Use the timer for short shipping sessions.</li>
            <li>• Sessions are saved locally with summaries when you end them.</li>
          </ul>
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
