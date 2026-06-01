import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAppSettings,
  getAutomationEvents,
  getReminders,
  getTasks,
  saveAppSettings,
  saveAutomationEvents,
  saveMemories,
  saveReminders,
  saveTasks,
} from '@/lib/mvp-store';
import { AutomationService } from '@/services/automation.service';

describe('Phase 6 automation and settings', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
    } as any);

    window.localStorage.setItem('orion.mvp.tasks', '[]');
    window.localStorage.setItem('orion.mvp.memories', '[]');
    window.localStorage.setItem('orion.mvp.projects', '[]');
    window.localStorage.setItem('orion.mvp.reminders', '[]');
    window.localStorage.setItem('orion.mvp.automation_events', '[]');
    saveAppSettings({
      compactMode: false,
      soundEnabled: true,
      autoSeed: true,
      theme: 'dark',
      orion_tone: 'friendly',
      voice_enabled: false,
      memory_enabled: true,
      language: 'en',
      timezone: 'UTC',
    });
  });

  it('creates a task from natural language and logs the automation event', () => {
    const result = AutomationService.createTaskFromText(
      'Please create a task to update the roadmap tomorrow.',
      'user-placeholder'
    );

    expect(result.ok).toBe(true);
    expect(result.action).toBe('create_task');
    expect(getTasks()).toHaveLength(1);
    expect(getAutomationEvents()[0]?.action).toBe('create_task');
    expect(result.item?.due_date).toBeTruthy();
  });

  it('creates a reminder from chat text and stores it locally', () => {
    const result = AutomationService.createReminderFromText(
      'Remind me to send the deck next week.',
      'user-placeholder'
    );

    expect(result.ok).toBe(true);
    expect(result.action).toBe('create_reminder');
    expect(getReminders()).toHaveLength(1);
    expect(getReminders()[0].status).toBe('active');
    expect(getAutomationEvents()[0]?.action).toBe('create_reminder');
  });

  it('persists updated settings and records the change', () => {
    const settings = AutomationService.updateSettings({
      compactMode: true,
      voice_enabled: true,
      orion_tone: 'technical',
    });

    expect(settings.compactMode).toBe(true);
    expect(settings.voice_enabled).toBe(true);
    expect(getAppSettings().orion_tone).toBe('technical');
    expect(getAutomationEvents()[0]?.action).toBe('settings_update');
  });

  it('generates a task overview event', () => {
    saveTasks([
      {
        id: 'task-1',
        user_id: 'user-placeholder',
        title: 'Ship automation',
        description: 'Validate the new workflow.',
        status: 'todo',
        priority: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    saveMemories([]);
    saveReminders([]);
    saveAutomationEvents([]);

    const result = AutomationService.generateTaskList();

    expect(result.ok).toBe(true);
    expect(result.action).toBe('generate_task_list');
    expect(result.item).toMatchObject({
      tasks: 1,
      openTasks: 1,
      projects: 0,
      memories: 0,
    });
    expect(getAutomationEvents()[0]?.action).toBe('generate_task_list');
  });
});
