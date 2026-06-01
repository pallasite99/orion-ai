import type { Memory, MemoryCreateRequest } from '@/types/memory';
import type { FileRecord, FileStatus, FileType } from '@/types/file';
import type { FocusSession, FocusSessionCreateRequest } from '@/types/focus';
import type { Reminder, ReminderCreateRequest, ReminderStatus } from '@/types/reminder';
import type { AutomationEvent, AutomationEventCreateRequest } from '@/types/automation';
import type { FeedbackEntry, FeedbackCreateRequest } from '@/types/feedback';
import type { Project, Task, TaskCreateRequest, TaskStatus } from '@/types/task';
import type { AppSettings } from '@/types/settings';

const STORAGE_KEYS = {
  tasks: 'orion.mvp.tasks',
  memories: 'orion.mvp.memories',
  projects: 'orion.mvp.projects',
  files: 'orion.mvp.files',
  fileChunks: 'orion.mvp.file_chunks',
  focusSessions: 'orion.mvp.focus_sessions',
  reminders: 'orion.mvp.reminders',
  automationEvents: 'orion.mvp.automation_events',
  feedbackEntries: 'orion.mvp.feedback_entries',
  settings: 'orion.mvp.settings',
};

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const seedProjects: Project[] = [
  {
    id: 'project-orion',
    user_id: 'user-placeholder',
    name: 'ORION MVP',
    description: 'Ship the core command center experience.',
    status: 'active',
    color: '#00d9ff',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'project-life',
    user_id: 'user-placeholder',
    name: 'Personal Ops',
    description: 'Tasks, notes, and planning for the week.',
    status: 'active',
    color: '#ffffff',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const seedTasks: Task[] = [
  {
    id: 'task-1',
    user_id: 'user-placeholder',
    project_id: 'project-orion',
    title: 'Review MVP scope',
    description: 'Keep the first release focused on the essentials.',
    status: 'in_progress',
    priority: 5,
    due_date: todayIso(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-2',
    user_id: 'user-placeholder',
    project_id: 'project-life',
    title: 'Add task completion flow',
    description: 'Make the tasks page usable without Supabase.',
    status: 'todo',
    priority: 4,
    due_date: todayIso(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-3',
    user_id: 'user-placeholder',
    project_id: 'project-orion',
    title: 'Polish chat responses',
    description: 'Render assistant output with readable formatting.',
    status: 'todo',
    priority: 3,
    due_date: daysFromToday(1),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const seedMemories: Memory[] = [
  {
    id: 'memory-1',
    user_id: 'user-placeholder',
    type: 'fact',
    title: 'MVP focus',
    content: 'Keep the first release centered on chat, tasks, memory, and daily planning.',
    tags: ['mvp', 'product'],
    source: 'seed',
    importance_score: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'memory-2',
    user_id: 'user-placeholder',
    type: 'preference',
    title: 'UI direction',
    content: 'Use a dark command-center layout with cyan accent color.',
    tags: ['ui', 'theme'],
    source: 'seed',
    importance_score: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'memory-3',
    user_id: 'user-placeholder',
    type: 'note',
    title: 'Chat style',
    content: 'Assistant responses should be short, structured, and easy to scan.',
    tags: ['chat', 'writing'],
    source: 'seed',
    importance_score: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const seedFiles: FileRecord[] = [
  {
    id: 'file-1',
    user_id: 'user-placeholder',
    name: 'ORION MVP scope',
    file_type: 'markdown',
    storage_url: 'local://orion-mvp-scope.md',
    extracted_text: 'Keep the first release focused on chat, tasks, memory, and daily planning.',
    status: 'ready',
    created_at: new Date().toISOString(),
  },
  {
    id: 'file-2',
    user_id: 'user-placeholder',
    name: 'Product notes',
    file_type: 'txt',
    storage_url: 'local://product-notes.txt',
    extracted_text: 'Capture project decisions and next steps in one place.',
    status: 'ready',
    created_at: new Date().toISOString(),
  },
];

const seedFileChunks: FileChunkRecord[] = [];

const seedFocusSessions: FocusSession[] = [
  {
    id: 'focus-1',
    user_id: 'user-placeholder',
    task_id: 'task-1',
    project_id: 'project-orion',
    duration_minutes: 25,
    notes: 'Ship the core command center experience.',
    summary: 'Kept the first release focused and reviewed the MVP scope.',
    started_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    ended_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
];

const seedReminders: Reminder[] = [
  {
    id: 'reminder-1',
    user_id: 'user-placeholder',
    task_id: 'task-1',
    title: 'Review MVP scope',
    description: 'Check the release checklist before the end of the day.',
    due_at: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const seedAutomationEvents: AutomationEvent[] = [
  {
    id: 'automation-1',
    user_id: 'user-placeholder',
    action: 'generate_task_list',
    status: 'info',
    title: 'Generated local task list',
    details: 'Seed data was restored for the MVP demo.',
    created_at: new Date().toISOString(),
  },
];

const seedFeedbackEntries: FeedbackEntry[] = [];

const seedSettings: AppSettings = {
  compactMode: false,
  soundEnabled: true,
  autoSeed: true,
  theme: 'dark',
  orion_tone: 'friendly',
  voice_enabled: false,
  memory_enabled: true,
  learning_enabled: true,
  language: 'en',
  timezone: 'UTC',
};

interface FileChunkRecord {
  id: string;
  file_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  created_at: string;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function readCollection<T>(key: string, seed: T[]): T[] {
  if (!isBrowser()) return seed;

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seed;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
}

function writeCollection<T>(key: string, items: T[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

function readValue<T>(key: string, seed: T): T {
  if (!isBrowser()) return seed;

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
}

function writeValue<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mergeTask(task: Task): Task {
  return {
    ...task,
    updated_at: new Date().toISOString(),
  };
}

function mergeMemory(memory: Memory): Memory {
  return {
    ...memory,
    updated_at: new Date().toISOString(),
  };
}

function createChunkId() {
  return createId();
}

export function getTasks() {
  return readCollection(STORAGE_KEYS.tasks, seedTasks);
}

export function saveTasks(tasks: Task[]) {
  writeCollection(STORAGE_KEYS.tasks, tasks);
}

export function createTask(input: TaskCreateRequest, userId = 'user-placeholder'): Task {
  const task: Task = {
    id: createId(),
    user_id: userId,
    project_id: input.project_id,
    title: input.title,
    description: input.description,
    status: 'todo',
    priority: input.priority ?? 3,
    due_date: input.due_date,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const tasks = [task, ...getTasks()];
  saveTasks(tasks);
  return task;
}

export function updateTask(id: string, patch: Partial<Task>): Task | null {
  const tasks = getTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;

  const updated = mergeTask({ ...tasks[index], ...patch });
  tasks[index] = updated;
  saveTasks(tasks);
  return updated;
}

export function deleteTask(id: string) {
  const tasks = getTasks().filter((task) => task.id !== id);
  saveTasks(tasks);
}

export function toggleTaskStatus(id: string) {
  const tasks = getTasks();
  const task = tasks.find((item) => item.id === id);
  if (!task) return null;

  const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
  return updateTask(id, { status: nextStatus });
}

export function getProjects() {
  return readCollection(STORAGE_KEYS.projects, seedProjects);
}

export function createProject(name: string, description?: string) {
  const project: Project = {
    id: createId(),
    user_id: 'user-placeholder',
    name,
    description,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const projects = [project, ...getProjects()];
  writeCollection(STORAGE_KEYS.projects, projects);
  return project;
}

export function getMemories() {
  return readCollection(STORAGE_KEYS.memories, seedMemories);
}

export function saveMemories(memories: Memory[]) {
  writeCollection(STORAGE_KEYS.memories, memories);
}

export function createMemory(input: MemoryCreateRequest, userId = 'user-placeholder'): Memory {
  const memory: Memory = {
    id: createId(),
    user_id: userId,
    type: input.type,
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
    source: input.source,
    importance_score: input.importance_score ?? 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const memories = [memory, ...getMemories()];
  saveMemories(memories);
  return memory;
}

export function deleteMemory(id: string) {
  const memories = getMemories().filter((memory) => memory.id !== id);
  saveMemories(memories);
}

export function getTodaySummary() {
  const tasks = getTasks();
  const memories = getMemories();
  const projects = getProjects();

  return {
    tasks,
    memories,
    projects,
    dueToday: tasks.filter((task) => task.due_date === todayIso()),
    completed: tasks.filter((task) => task.status === 'done'),
    inProgress: tasks.filter((task) => task.status === 'in_progress'),
    highPriority: tasks.filter((task) => task.priority >= 4 && task.status !== 'done'),
  };
}

export function searchMvpData(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return {
      tasks: getTasks(),
      memories: getMemories(),
      projects: getProjects(),
    };
  }

  const includes = (value?: string) => String(value || '').toLowerCase().includes(normalized);
  const tasks = getTasks().filter(
    (task) =>
      includes(task.title) ||
      includes(task.description) ||
      includes(task.status) ||
      includes(task.due_date)
  );
  const memories = getMemories().filter(
    (memory) =>
      includes(memory.title) ||
      includes(memory.content) ||
      includes(memory.type) ||
      memory.tags.some((tag) => includes(tag))
  );
  const projects = getProjects().filter((project) => includes(project.name) || includes(project.description));

  return { tasks, memories, projects };
}

export function seedLocalData() {
  if (!isBrowser()) return;

  if (!window.localStorage.getItem(STORAGE_KEYS.tasks)) {
    window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(seedTasks));
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.memories)) {
    window.localStorage.setItem(STORAGE_KEYS.memories, JSON.stringify(seedMemories));
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.projects)) {
    window.localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(seedProjects));
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.files)) {
    window.localStorage.setItem(STORAGE_KEYS.files, JSON.stringify(seedFiles));
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.focusSessions)) {
    window.localStorage.setItem(STORAGE_KEYS.focusSessions, JSON.stringify(seedFocusSessions));
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.reminders)) {
    window.localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(seedReminders));
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.automationEvents)) {
    window.localStorage.setItem(STORAGE_KEYS.automationEvents, JSON.stringify(seedAutomationEvents));
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.feedbackEntries)) {
    window.localStorage.setItem(STORAGE_KEYS.feedbackEntries, JSON.stringify(seedFeedbackEntries));
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.settings)) {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(seedSettings));
  }
}

export function getFiles() {
  return readCollection(STORAGE_KEYS.files, seedFiles);
}

export function saveFiles(files: FileRecord[]) {
  writeCollection(STORAGE_KEYS.files, files);
}

export function createFile(input: {
  name: string;
  file_type: FileType;
  storage_url: string;
  extracted_text?: string;
  status?: FileStatus;
}) {
  const file: FileRecord = {
    id: createId(),
    user_id: 'user-placeholder',
    name: input.name,
    file_type: input.file_type,
    storage_url: input.storage_url,
    extracted_text: input.extracted_text,
    status: input.status ?? 'ready',
    created_at: new Date().toISOString(),
  };

  const files = [file, ...getFiles()];
  saveFiles(files);
  return file;
}

export function deleteFile(id: string) {
  const files = getFiles().filter((file) => file.id !== id);
  saveFiles(files);
  const remainingChunks = getFileChunks().filter((chunk) => chunk.file_id !== id);
  saveFileChunks(remainingChunks);
}

export function getFocusSessions() {
  return readCollection(STORAGE_KEYS.focusSessions, seedFocusSessions);
}

export function saveFocusSessions(sessions: FocusSession[]) {
  writeCollection(STORAGE_KEYS.focusSessions, sessions);
}

export function createFocusSession(
  input: FocusSessionCreateRequest,
  userId = 'user-placeholder'
): FocusSession {
  const session: FocusSession = {
    id: createId(),
    user_id: userId,
    task_id: input.task_id,
    project_id: input.project_id,
    duration_minutes: input.duration_minutes,
    notes: input.notes,
    started_at: new Date().toISOString(),
  };

  const sessions = [session, ...getFocusSessions()];
  saveFocusSessions(sessions);
  return session;
}

export function endFocusSession(id: string, summary?: string) {
  const sessions = getFocusSessions();
  const index = sessions.findIndex((session) => session.id === id);
  if (index === -1) return null;

  const ended = {
    ...sessions[index],
    summary,
    ended_at: new Date().toISOString(),
  };
  sessions[index] = ended;
  saveFocusSessions(sessions);
  return ended;
}

export function getActiveFocusSession() {
  return getFocusSessions().find((session) => !session.ended_at) || null;
}

export function getReminders() {
  return readCollection(STORAGE_KEYS.reminders, seedReminders);
}

export function saveReminders(reminders: Reminder[]) {
  writeCollection(STORAGE_KEYS.reminders, reminders);
}

export function createReminder(
  input: ReminderCreateRequest,
  userId = 'user-placeholder'
): Reminder {
  const reminder: Reminder = {
    id: createId(),
    user_id: userId,
    task_id: input.task_id,
    title: input.title,
    description: input.description,
    due_at: input.due_at,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const reminders = [reminder, ...getReminders()];
  saveReminders(reminders);
  return reminder;
}

export function updateReminder(
  id: string,
  patch: Partial<Reminder>
): Reminder | null {
  const reminders = getReminders();
  const index = reminders.findIndex((reminder) => reminder.id === id);
  if (index === -1) return null;

  const updated = {
    ...reminders[index],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  reminders[index] = updated;
  saveReminders(reminders);
  return updated;
}

export function deleteReminder(id: string) {
  const reminders = getReminders().filter((reminder) => reminder.id !== id);
  saveReminders(reminders);
}

export function getAutomationEvents() {
  return readCollection(STORAGE_KEYS.automationEvents, seedAutomationEvents);
}

export function saveAutomationEvents(events: AutomationEvent[]) {
  writeCollection(STORAGE_KEYS.automationEvents, events);
}

export function createAutomationEvent(
  input: AutomationEventCreateRequest,
  userId = 'user-placeholder'
): AutomationEvent {
  const event: AutomationEvent = {
    id: createId(),
    user_id: userId,
    action: input.action,
    status: input.status ?? 'info',
    title: input.title,
    details: input.details,
    created_at: new Date().toISOString(),
  };

  const events = [event, ...getAutomationEvents()];
  saveAutomationEvents(events);
  return event;
}

export function getFeedbackEntries() {
  return readCollection(STORAGE_KEYS.feedbackEntries, seedFeedbackEntries);
}

export function saveFeedbackEntries(entries: FeedbackEntry[]) {
  writeCollection(STORAGE_KEYS.feedbackEntries, entries);
}

export function createFeedbackEntry(
  input: FeedbackCreateRequest,
  userId = 'user-placeholder'
): FeedbackEntry {
  const entry: FeedbackEntry = {
    id: createId(),
    user_id: userId,
    chat_id: input.chat_id,
    message_id: input.message_id,
    user_message: input.user_message,
    assistant_message: input.assistant_message,
    rating: input.rating,
    note: input.note,
    created_at: new Date().toISOString(),
  };

  const entries = [entry, ...getFeedbackEntries()];
  saveFeedbackEntries(entries);
  return entry;
}

export function getAppSettings() {
  return readValue(STORAGE_KEYS.settings, seedSettings);
}

export function saveAppSettings(settings: AppSettings) {
  writeValue(STORAGE_KEYS.settings, settings);
}

export function getFileChunks() {
  return readCollection(STORAGE_KEYS.fileChunks, seedFileChunks);
}

export function saveFileChunks(chunks: FileChunkRecord[]) {
  writeCollection(STORAGE_KEYS.fileChunks, chunks);
}

export function setFileChunksForFile(fileId: string, chunks: Array<Omit<FileChunkRecord, 'id' | 'created_at'>>) {
  const existing = getFileChunks().filter((chunk) => chunk.file_id !== fileId);
  const timestamp = new Date().toISOString();
  const normalized = chunks.map((chunk) => ({
    ...chunk,
    id: createChunkId(),
    created_at: timestamp,
  }));
  saveFileChunks([...existing, ...normalized]);
  return normalized;
}

export function getFileRecord(id: string) {
  return getFiles().find((file) => file.id === id) || null;
}

export function getFileChunksForFile(fileId: string) {
  return getFileChunks()
    .filter((chunk) => chunk.file_id === fileId)
    .sort((a, b) => a.chunk_index - b.chunk_index);
}
