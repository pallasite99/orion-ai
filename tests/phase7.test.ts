import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAutomationEvents,
  getFeedbackEntries,
  getMemories,
  saveAppSettings,
  saveAutomationEvents,
  saveFeedbackEntries,
  saveMemories,
} from '@/lib/mvp-store';
import { LearningService } from '@/services/learning.service';

describe('Phase 7 learning loop', () => {
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

    saveMemories([]);
    saveFeedbackEntries([]);
    saveAutomationEvents([]);
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

  it('captures a self-reflection lesson after a useful response', async () => {
    const result = await LearningService.captureSelfReflection(
      "Help me organize today's priorities",
      'Here is a concise plan with three next actions.',
      'chat-1'
    );

    expect(result?.memory?.title).toContain('Lesson learned');
    expect(getMemories()).toHaveLength(1);
    expect(getAutomationEvents()[0]?.action).toBe('self_reflection');
  });

  it('stores feedback and converts it into a reusable lesson', () => {
    const result = LearningService.recordFeedback('user-placeholder', {
      chat_id: 'chat-1',
      message_id: 'message-1',
      user_message: 'Can you be more concise?',
      assistant_message: 'Absolutely. Here is the short version.',
      rating: 'needs_work',
      note: 'Shorter answers are easier to scan.',
    });

    expect(result?.feedback.rating).toBe('needs_work');
    expect(getFeedbackEntries()).toHaveLength(1);
    expect(getMemories()).toHaveLength(1);
    expect(getAutomationEvents()[0]?.action).toBe('learn_from_feedback');
  });

  it('respects the learning toggle', () => {
    saveAppSettings({
      compactMode: false,
      soundEnabled: true,
      autoSeed: true,
      theme: 'dark',
      orion_tone: 'friendly',
      voice_enabled: false,
      memory_enabled: true,
      learning_enabled: false,
      language: 'en',
      timezone: 'UTC',
    });

    const result = LearningService.recordFeedback('user-placeholder', {
      rating: 'helpful',
      assistant_message: 'Clear and concise.',
    });

    expect(result?.feedback).toBeTruthy();
    expect(getFeedbackEntries()).toHaveLength(1);
    expect(getMemories()).toHaveLength(0);
    expect(getAutomationEvents()).toHaveLength(0);
  });
});
