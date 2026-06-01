export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string;
  project_id?: string;
  duration_minutes: number;
  notes?: string;
  summary?: string;
  started_at: string;
  ended_at?: string;
}

export interface FocusSessionCreateRequest {
  task_id?: string;
  project_id?: string;
  duration_minutes: number;
  notes?: string;
}

export interface FocusSessionSummary {
  session: FocusSession;
  elapsed_seconds: number;
  remaining_seconds: number;
  completion_percent: number;
}
