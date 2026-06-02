export type InboxItemType = 'task' | 'reminder' | 'note' | 'link';
export type InboxItemStatus = 'new' | 'triaged' | 'archived';

export interface InboxItem {
  id: string;
  user_id: string;
  type: InboxItemType;
  title: string;
  content: string;
  status: InboxItemStatus;
  source?: string;
  related_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InboxCreateRequest {
  type: InboxItemType;
  title: string;
  content: string;
  source?: string;
}

export interface InboxUpdateRequest {
  title?: string;
  content?: string;
  status?: InboxItemStatus;
  related_id?: string;
}
