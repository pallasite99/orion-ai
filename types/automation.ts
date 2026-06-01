export type AutomationAction =
  | 'create_task'
  | 'create_reminder'
  | 'complete_reminder'
  | 'summarize_file'
  | 'generate_task_list'
  | 'learn_from_feedback'
  | 'self_reflection'
  | 'settings_update'
  | 'focus_session_start'
  | 'focus_session_end';

export interface AutomationEvent {
  id: string;
  user_id: string;
  action: AutomationAction;
  status: 'success' | 'error' | 'info';
  title: string;
  details?: string;
  created_at: string;
}

export interface AutomationEventCreateRequest {
  action: AutomationAction;
  status?: 'success' | 'error' | 'info';
  title: string;
  details?: string;
}
