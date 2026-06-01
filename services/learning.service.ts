import {
  createAutomationEvent,
  createFeedbackEntry,
  createMemory,
  getAppSettings,
  getFeedbackEntries,
} from '@/lib/mvp-store';
import type { FeedbackCreateRequest, FeedbackEntry, FeedbackRating } from '@/types/feedback';
import type { Memory } from '@/types/memory';
import type { AutomationEvent } from '@/types/automation';

export interface LearningSummary {
  total_feedback: number;
  helpful: number;
  needs_work: number;
  recent_feedback: FeedbackEntry[];
}

function normalize(text: string) {
  return text.trim().replace(/\s+/g, ' ');
}

function summarizeTopic(text?: string) {
  const source = normalize(text || '');
  if (!source) return 'general responses';
  const words = source
    .replace(/[^\w\s'-]/g, '')
    .split(' ')
    .filter(Boolean)
    .filter((word) => !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'please', 'could', 'would'].includes(word.toLowerCase()));
  return words.slice(0, 5).join(' ') || source.slice(0, 40);
}

function buildLessonContent(
  rating: FeedbackRating,
  userMessage?: string,
  assistantMessage?: string,
  note?: string
) {
  const topic = summarizeTopic(userMessage);
  const style = rating === 'helpful' ? 'Preserve this response pattern.' : 'Adjust the approach next time.';
  const detail = note ? `User note: ${note}` : rating === 'helpful'
    ? 'Keep responses concise, structured, and action-oriented.'
    : 'Favor shorter answers, clearer steps, and earlier confirmation of intent.';

  return [
    `Topic: ${topic}.`,
    `User message: ${normalize(userMessage || 'N/A')}.`,
    `Assistant response: ${normalize((assistantMessage || '').slice(0, 240))}.`,
    style,
    detail,
  ].join(' ');
}

export class LearningService {
  static getSummary(): LearningSummary {
    const feedback = getFeedbackEntries();
    return {
      total_feedback: feedback.length,
      helpful: feedback.filter((entry) => entry.rating === 'helpful').length,
      needs_work: feedback.filter((entry) => entry.rating === 'needs_work').length,
      recent_feedback: feedback.slice(0, 5),
    };
  }

  static async captureSelfReflection(
    userMessage: string,
    assistantMessage: string,
    chatId?: string,
    userId = 'user-placeholder'
  ): Promise<{ memory?: Memory; event?: AutomationEvent } | null> {
    const settings = getAppSettings();
    if (settings.learning_enabled === false) return null;

    const topic = summarizeTopic(userMessage);
    const memory = createMemory(
      {
        type: 'note',
        title: `Lesson learned: ${topic}`,
        content: buildLessonContent('helpful', userMessage, assistantMessage),
        source: `self-reflection${chatId ? `:${chatId}` : ''}`,
        importance_score: 5,
      },
      userId
    );

    const event = createAutomationEvent({
      action: 'self_reflection',
      status: 'info',
      title: `Captured lesson: ${topic}`,
      details: 'Orion converted a successful exchange into a reusable note.',
    }, userId);

    return { memory, event };
  }

  static recordFeedback(
    userId: string,
    input: FeedbackCreateRequest
  ): { feedback: FeedbackEntry; memory?: Memory; event?: AutomationEvent } | null {
    const settings = getAppSettings();
    const feedback = createFeedbackEntry(input, userId);

    if (settings.learning_enabled === false) {
      return { feedback };
    }

    const topic = summarizeTopic(input.user_message || input.assistant_message);
    const memory = createMemory(
      {
        type: input.rating === 'helpful' ? 'preference' : 'note',
        title:
          input.rating === 'helpful'
            ? `What worked: ${topic}`
            : `Improve: ${topic}`,
        content: buildLessonContent(
          input.rating,
          input.user_message,
          input.assistant_message,
          input.note
        ),
        source: `feedback:${input.rating}`,
        importance_score: input.rating === 'helpful' ? 6 : 7,
      },
      userId
    );

    const event = createAutomationEvent({
      action: 'learn_from_feedback',
      status: input.rating === 'helpful' ? 'success' : 'info',
      title:
        input.rating === 'helpful'
          ? `Positive feedback learned: ${topic}`
          : `Feedback request captured: ${topic}`,
      details: input.note || 'Feedback stored for future refinement.',
    }, userId);

    return { feedback, memory, event };
  }
}
