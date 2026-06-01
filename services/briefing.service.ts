import { getTodaySummary } from '@/lib/mvp-store';
import type { Memory } from '@/types/memory';
import type { Project, Task } from '@/types/task';

export interface DailyBriefing {
  generated_at: string;
  greeting: string;
  date_label: string;
  time_label: string;
  overview: string;
  priorities: string[];
  next_actions: string[];
  reminders: string[];
  task_snapshot: {
    total: number;
    due_today: number;
    in_progress: number;
    high_priority: number;
  };
  focus_project?: Project;
  top_tasks: Task[];
  recent_memories: Memory[];
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function pickFocusProject(projects: Project[], tasks: Task[]) {
  if (!projects.length) return undefined;

  const projectScore = new Map<string, number>();
  for (const project of projects) {
    projectScore.set(project.id, 0);
  }

  for (const task of tasks) {
    if (!task.project_id) continue;
    const score = projectScore.get(task.project_id) ?? 0;
    projectScore.set(
      task.project_id,
      score + (task.status === 'in_progress' ? 2 : 1) + task.priority / 2
    );
  }

  const sorted = [...projects].sort((a, b) => {
    const aScore = projectScore.get(a.id) ?? 0;
    const bScore = projectScore.get(b.id) ?? 0;
    return bScore - aScore;
  });

  return sorted[0];
}

function describeTopTask(task: Task) {
  const due = task.due_date ? ` due ${task.due_date}` : '';
  const description = task.description ? ` ${task.description}` : '';
  return `${task.title}${due}.${description}`.trim();
}

export class BriefingService {
  static getDailyBriefing(): DailyBriefing {
    const summary = getTodaySummary();
    const now = new Date();
    const focusProject = pickFocusProject(summary.projects, summary.tasks);
    const topTasks = [...summary.highPriority, ...summary.inProgress, ...summary.dueToday]
      .filter((task, index, list) => list.findIndex((item) => item.id === task.id) === index)
      .slice(0, 5);

    const priorities: string[] = [];
    if (summary.dueToday.length) {
      priorities.push(`${summary.dueToday.length} task${summary.dueToday.length === 1 ? '' : 's'} due today`);
    } else {
      priorities.push('No tasks are due today');
    }
    if (summary.highPriority.length) {
      priorities.push(`${summary.highPriority.length} high-priority task${summary.highPriority.length === 1 ? '' : 's'} remain open`);
    }
    if (focusProject) {
      priorities.push(`Primary project: ${focusProject.name}`);
    }

    const nextActions: string[] = [];
    if (summary.inProgress.length) {
      nextActions.push(`Push ${summary.inProgress[0].title} toward completion.`);
    }
    if (summary.dueToday.length) {
      nextActions.push(`Clear the due-today queue before adding new work.`);
    }
    if (summary.highPriority.length) {
      nextActions.push(`Review the top priority items and decide what can wait.`);
    }
    if (!nextActions.length) {
      nextActions.push('Use the empty runway to plan the next meaningful task.');
    }

    const reminders = [
      ...summary.dueToday.slice(0, 3).map((task) => `Follow up on ${task.title}.`),
      ...summary.highPriority.slice(0, 2).map((task) => `Watch ${task.title} for drift.`),
    ];

    const overviewParts = [
      `${getGreeting(now.getHours())}.`,
      topTasks.length
        ? `The day is centered on ${topTasks[0].title}.`
        : 'The workspace is clear and ready for a planning pass.',
      focusProject ? `Current focus project: ${focusProject.name}.` : 'No active project is leading the queue right now.',
    ];

    return {
      generated_at: now.toISOString(),
      greeting: getGreeting(now.getHours()),
      date_label: now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      time_label: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      overview: overviewParts.join(' '),
      priorities,
      next_actions: nextActions,
      reminders: reminders.length ? reminders : ['No pending reminders.'],
      task_snapshot: {
        total: summary.tasks.length,
        due_today: summary.dueToday.length,
        in_progress: summary.inProgress.length,
        high_priority: summary.highPriority.length,
      },
      focus_project: focusProject,
      top_tasks: topTasks,
      recent_memories: summary.memories.slice(0, 3),
    };
  }

  static getTaskNarrative(task: Task) {
    return describeTopTask(task);
  }
}
