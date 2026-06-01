export type ReminderStatus = 'active' | 'completed' | 'dismissed';

export interface Reminder {
  id: string;
  user_id: string;
  task_id?: string;
  title: string;
  description?: string;
  due_at?: string;
  status: ReminderStatus;
  created_at: string;
  updated_at?: string;
}

export interface ReminderCreateRequest {
  task_id?: string;
  title: string;
  description?: string;
  due_at?: string;
}

export interface ReminderUpdateRequest {
  title?: string;
  description?: string;
  due_at?: string;
  status?: ReminderStatus;
  task_id?: string;
}
