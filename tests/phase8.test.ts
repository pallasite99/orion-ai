import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAutomationEvents,
  getFeedbackEntries,
  getInboxItems,
  getMemories,
  getReminders,
  getTasks,
  saveAppSettings,
  saveAutomationEvents,
  saveFeedbackEntries,
  saveInboxItems,
  saveMemories,
  saveReminders,
  saveTasks,
} from '@/lib/mvp-store';
import { InboxService } from '@/services/inbox.service';
import { LearningService } from '@/services/learning.service';

describe('Phase 8 learning and inbox', () => {
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

    saveInboxItems([]);
    saveFeedbackEntries([]);
    saveAutomationEvents([]);
    saveMemories([]);
    saveTasks([]);
    saveReminders([]);
    saveAppSettings({
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
    });
  });

  it('captures and triages inbox items into tasks', () => {
    const item = InboxService.captureFromText('Need to draft the launch plan tomorrow', 'user-placeholder');
    expect(getInboxItems()).toHaveLength(1);
    expect(item.type).toBe('task');

    const triaged = InboxService.triageToTask(item.id, 'user-placeholder');
    expect(triaged?.createdType).toBe('task');
    expect(getTasks()).toHaveLength(1);
    expect(getInboxItems()[0]?.status).toBe('triaged');
  });

  it('captures reminders and converts them to reminder records', () => {
    const item = InboxService.captureFromText('Remind me to follow up with Maya tomorrow', 'user-placeholder');
    expect(item.type).toBe('reminder');

    const triaged = InboxService.triageToReminder(item.id, 'user-placeholder');
    expect(triaged?.createdType).toBe('reminder');
    expect(getReminders()).toHaveLength(1);
  });

  it('records feedback and generates a learning memory', async () => {
    const result = LearningService.recordFeedback('user-placeholder', {
      rating: 'helpful',
      assistant_message: 'Clear, short, and actionable.',
      user_message: 'This is the style I want.',
      note: 'Keep answers concise.',
    });

    expect(result?.feedback).toBeTruthy();
    expect(getFeedbackEntries()).toHaveLength(1);
    expect(getMemories()).toHaveLength(1);
    expect(getAutomationEvents()[0]?.action).toBe('learn_from_feedback');
  });

  it('captures self reflection without disabling the memory flow', async () => {
    await LearningService.captureSelfReflection(
      'Summarize my tasks',
      'Use a short bulleted list with next steps.',
      'chat-1',
      'user-placeholder'
    );

    expect(getMemories()).toHaveLength(1);
    expect(getAutomationEvents()[0]?.action).toBe('self_reflection');
  });

  it('can capture a plain note into the inbox', () => {
    InboxService.capture(
      {
        type: 'note',
        title: 'Research idea',
        content: 'Explore calendar sync next week.',
        source: 'manual',
      },
      'user-placeholder'
    );

    expect(getInboxItems()).toHaveLength(1);
  });
});
