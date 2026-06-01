import {
  createAutomationEvent,
  createReminder,
  createTask,
  getAppSettings,
  getFiles,
  getTasks,
  getMemories,
  getProjects,
  saveAppSettings,
  updateReminder,
} from '@/lib/mvp-store';
import { FileService } from './file.service';
import type { AppSettings } from '@/types/settings';
import type { AutomationEvent } from '@/types/automation';
import type { Reminder } from '@/types/reminder';
import type { Task, TaskPriority } from '@/types/task';

export interface AutomationResult<T = unknown> {
  ok: boolean;
  action: string;
  item?: T;
  event?: AutomationEvent;
  message: string;
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function extractDueDate(text: string): string | undefined {
  const normalized = normalize(text);
  const now = new Date();

  if (normalized.includes('tomorrow')) {
    now.setDate(now.getDate() + 1);
    return now.toISOString().slice(0, 10);
  }

  if (normalized.includes('next week')) {
    now.setDate(now.getDate() + 7);
    return now.toISOString().slice(0, 10);
  }

  if (normalized.includes('today')) {
    return now.toISOString().slice(0, 10);
  }

  const dateMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return dateMatch?.[1];
}

function extractTitle(text: string) {
  const cleaned = text
    .replace(/^(please\s+)?(create|add|make)\s+(a\s+)?(task|reminder)?[:\s-]*/i, '')
    .replace(/^(remind me to|remember to|follow up on|todo:?)\s*/i, '')
    .replace(/^to\s+/i, '')
    .trim();
  if (!cleaned) return text.trim();
  return cleaned.replace(/[.?!]+$/, '');
}

function buildTaskFromText(text: string): Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> | null {
  const normalized = normalize(text);
  const taskTrigger = /(create|add|make|track|todo|task|need to|should|must|remember to)/i.test(text);
  if (!taskTrigger) return null;

  const title = extractTitle(text);
  if (!title) return null;

  const priority: TaskPriority = normalized.includes('urgent') || normalized.includes('critical')
    ? 5
    : normalized.includes('high')
      ? 4
      : 3;

  return {
    title,
    description: text.trim(),
    project_id: undefined,
    status: 'todo',
    priority,
    due_date: extractDueDate(text),
  };
}

function buildReminderFromText(text: string): Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'> | null {
  const reminderTrigger = /(remind me to|reminder|remember to|follow up on|ping me|nudge me)/i.test(text);
  if (!reminderTrigger) return null;

  const title = extractTitle(text);
  if (!title) return null;

  return {
    title,
    description: text.trim(),
    task_id: undefined,
    due_at: extractDueDate(text),
  };
}

export class AutomationService {
  static getSettings(): AppSettings {
    return getAppSettings();
  }

  static updateSettings(patch: Partial<AppSettings>): AppSettings {
    const next = { ...getAppSettings(), ...patch };
    saveAppSettings(next);
    createAutomationEvent({
      action: 'settings_update',
      status: 'info',
      title: 'Settings updated',
      details: Object.entries(patch)
        .map(([key, value]) => `${key}=${value}`)
        .join(', '),
    });
    return next;
  }

  static createTaskFromText(text: string, userId = 'user-placeholder') {
    const task = buildTaskFromText(text);
    if (!task) {
      return {
        ok: false,
        action: 'create_task',
        message: 'No task pattern detected.',
      } satisfies AutomationResult;
    }

    const created = createTask(task, userId);
    const event = createAutomationEvent({
      action: 'create_task',
      status: 'success',
      title: `Task created: ${created.title}`,
      details: created.due_date ? `Due ${created.due_date}` : created.description,
    }, userId);

    return {
      ok: true,
      action: 'create_task',
      item: created,
      event,
      message: `Created task "${created.title}".`,
    } satisfies AutomationResult;
  }

  static createReminderFromText(text: string, userId = 'user-placeholder') {
    const reminder = buildReminderFromText(text);
    if (!reminder) {
      return {
        ok: false,
        action: 'create_reminder',
        message: 'No reminder pattern detected.',
      } satisfies AutomationResult;
    }

    const created = createReminder(reminder, userId);
    const event = createAutomationEvent({
      action: 'create_reminder',
      status: 'success',
      title: `Reminder created: ${created.title}`,
      details: created.due_at ? `Due ${created.due_at}` : created.description,
    }, userId);

    return {
      ok: true,
      action: 'create_reminder',
      item: created,
      event,
      message: `Created reminder "${created.title}".`,
    } satisfies AutomationResult;
  }

  static summarizeFile(fileId: string) {
    const file = getFiles().find((item) => item.id === fileId);
    if (!file) {
      return {
        ok: false,
        action: 'summarize_file',
        message: 'File not found.',
      } satisfies AutomationResult;
    }

    const summary = [
      `File: ${file.name}`,
      file.file_type ? `Type: ${file.file_type}` : '',
      file.extracted_text ? `Preview: ${file.extracted_text.slice(0, 240)}` : 'No extracted text available.',
    ]
      .filter(Boolean)
      .join('\n');

    const event = createAutomationEvent({
      action: 'summarize_file',
      status: 'info',
      title: `Summarized file: ${file.name}`,
      details: summary,
    });

    return {
      ok: true,
      action: 'summarize_file',
      item: { file, summary },
      event,
      message: `Summarized "${file.name}".`,
    } satisfies AutomationResult;
  }

  static generateTaskList() {
    const tasks = getTasks();
    const projects = getProjects();
    const memories = getMemories();

    const report = {
      tasks: tasks.length,
      openTasks: tasks.filter((task) => task.status !== 'done').length,
      projects: projects.length,
      memories: memories.length,
      priorities: tasks.filter((task) => task.priority >= 4).slice(0, 5),
    };

    const event = createAutomationEvent({
      action: 'generate_task_list',
      status: 'info',
      title: 'Generated task list',
      details: `Open tasks: ${report.openTasks}. Projects: ${report.projects}.`,
    });

    return {
      ok: true,
      action: 'generate_task_list',
      item: report,
      event,
      message: 'Generated the task list overview.',
    } satisfies AutomationResult;
  }

  static processConversation(text: string, userId = 'user-placeholder') {
    const reminder = this.createReminderFromText(text, userId);
    if (reminder.ok) return reminder;

    const task = this.createTaskFromText(text, userId);
    if (task.ok) return task;

    return {
      ok: false,
      action: 'generate_task_list',
      message: 'No automation action detected.',
    } satisfies AutomationResult;
  }

  static completeReminder(id: string, userId = 'user-placeholder') {
    const reminder = updateReminder(id, { status: 'completed' });
    if (!reminder) {
      return {
        ok: false,
        action: 'complete_reminder',
        message: 'Reminder not found.',
      } satisfies AutomationResult;
    }

    createAutomationEvent({
      action: 'complete_reminder',
      status: 'success',
      title: `Reminder completed: ${reminder.title}`,
      details: reminder.description,
    }, userId);

    return {
      ok: true,
      action: 'complete_reminder',
      item: reminder,
      message: `Completed reminder "${reminder.title}".`,
    } satisfies AutomationResult;
  }
}
