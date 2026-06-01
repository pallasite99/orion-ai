import {
  createFocusSession,
  endFocusSession,
  getActiveFocusSession,
  getFocusSessions,
} from '@/lib/mvp-store';
import type { FocusSession, FocusSessionCreateRequest, FocusSessionSummary } from '@/types/focus';

export interface FocusSessionDraft {
  task_id?: string;
  project_id?: string;
  duration_minutes: number;
  notes?: string;
}

export class FocusService {
  static listSessions(): FocusSession[] {
    return getFocusSessions();
  }

  static getActiveSession(): FocusSession | null {
    return getActiveFocusSession();
  }

  static startSession(input: FocusSessionCreateRequest, userId = 'user-placeholder'): FocusSession {
    return createFocusSession(input, userId);
  }

  static finishSession(sessionId: string, summary?: string): FocusSession | null {
    return endFocusSession(sessionId, summary);
  }

  static summarizeSession(session: FocusSession): FocusSessionSummary {
    const startedAt = new Date(session.started_at).getTime();
    const endedAt = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
    const totalSeconds = session.duration_minutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    const completionPercent = totalSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100)) : 0;

    return {
      session,
      elapsed_seconds: elapsedSeconds,
      remaining_seconds: remainingSeconds,
      completion_percent: completionPercent,
    };
  }

  static buildSessionSummary(session: FocusSession): string {
    const summaryParts = [
      `Focused for ${session.duration_minutes} minutes.`,
      session.task_id ? `Task: ${session.task_id}.` : '',
      session.project_id ? `Project: ${session.project_id}.` : '',
      session.notes ? `Notes: ${session.notes}.` : '',
    ].filter(Boolean);

    return summaryParts.join(' ');
  }
}
