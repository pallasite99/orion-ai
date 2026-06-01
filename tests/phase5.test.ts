import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createFocusSession,
  endFocusSession,
  getFocusSessions,
  saveFocusSessions,
} from '@/lib/mvp-store';
import { FocusService } from '@/services/focus.service';
import { VoiceService } from '@/services/voice.service';

describe('Phase 5 voice and focus services', () => {
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
    saveFocusSessions([]);
  });

  it('creates and summarizes focus sessions', () => {
    const session = createFocusSession({
      duration_minutes: 25,
      task_id: 'task-1',
      project_id: 'project-1',
      notes: 'Ship the first pass.',
    });

    const ended = endFocusSession(session.id, 'Completed the first pass.');
    expect(ended?.ended_at).toBeTruthy();

    const summary = FocusService.summarizeSession(ended!);
    expect(summary.session.id).toBe(session.id);
    expect(summary.completion_percent).toBeGreaterThanOrEqual(0);
    expect(getFocusSessions()).toHaveLength(1);
  });

  it('transcribes audio in mock mode', async () => {
    const transcript = await VoiceService.transcribe(Buffer.from('fake-audio-data'));
    expect(transcript).toContain('Placeholder transcription mode is active');
  });
});
