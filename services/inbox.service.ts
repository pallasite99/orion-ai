import {
  createInboxItem,
  createMemory,
  createReminder,
  createTask,
  deleteInboxItem,
  getInboxItems,
  updateInboxItem,
} from '@/lib/mvp-store';
import type { InboxCreateRequest, InboxItem, InboxItemType } from '@/types/inbox';

export interface InboxTriageResult {
  inboxItem: InboxItem;
  createdId?: string;
  createdType?: InboxItemType;
}

function normalize(text: string) {
  return text.trim();
}

function extractTitle(text: string) {
  const cleaned = normalize(text)
    .replace(/^(quick\s+)?(capture|add|note|remember|todo)[:\s-]*/i, '')
    .replace(/^(please\s+)?(create|add|make)\s+(a\s+)?(task|reminder|note)?[:\s-]*/i, '')
    .replace(/^(remind me to|remember to|follow up on)\s*/i, '')
    .replace(/^to\s+/i, '')
    .trim();
  return cleaned.replace(/[.?!]+$/, '') || text.trim();
}

export class InboxService {
  static getItems() {
    return getInboxItems();
  }

  static capture(input: InboxCreateRequest, userId = 'user-placeholder') {
    return createInboxItem(input, userId);
  }

  static captureFromText(text: string, userId = 'user-placeholder') {
    const normalized = text.toLowerCase();
    const type: InboxItemType =
      normalized.includes('remind') || normalized.includes('follow up')
        ? 'reminder'
        : normalized.includes('link') || /^https?:\/\//.test(normalized)
          ? 'link'
          : normalized.includes('task') || normalized.includes('todo') || normalized.includes('need to')
            ? 'task'
            : 'note';

    return createInboxItem(
      {
        type,
        title: extractTitle(text),
        content: normalize(text),
        source: 'capture',
      },
      userId
    );
  }

  static triageToTask(id: string, userId = 'user-placeholder') {
    const item = getInboxItems().find((entry) => entry.id === id);
    if (!item) return null;

    const task = createTask(
      {
        title: item.title,
        description: item.content,
        priority: item.type === 'task' ? 4 : 3,
      },
      userId
    );
    updateInboxItem(id, { status: 'triaged', related_id: task.id });
    return { inboxItem: updateInboxItem(id, { status: 'triaged', related_id: task.id })!, createdId: task.id, createdType: 'task' as const };
  }

  static triageToReminder(id: string, userId = 'user-placeholder') {
    const item = getInboxItems().find((entry) => entry.id === id);
    if (!item) return null;

    const reminder = createReminder(
      {
        title: item.title,
        description: item.content,
      },
      userId
    );
    updateInboxItem(id, { status: 'triaged', related_id: reminder.id });
    return { inboxItem: updateInboxItem(id, { status: 'triaged', related_id: reminder.id })!, createdId: reminder.id, createdType: 'reminder' as const };
  }

  static triageToMemory(id: string, userId = 'user-placeholder') {
    const item = getInboxItems().find((entry) => entry.id === id);
    if (!item) return null;

    const memory = createMemory(
      {
        type: 'note',
        title: item.title,
        content: item.content,
        source: `inbox:${item.id}`,
        importance_score: 5,
      },
      userId
    );
    updateInboxItem(id, { status: 'triaged', related_id: memory.id });
    return { inboxItem: updateInboxItem(id, { status: 'triaged', related_id: memory.id })!, createdId: memory.id, createdType: 'note' as const };
  }

  static archive(id: string) {
    return updateInboxItem(id, { status: 'archived' });
  }

  static remove(id: string) {
    deleteInboxItem(id);
  }
}
