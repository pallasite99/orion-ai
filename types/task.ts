export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateRequest {
  project_id?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  project_id?: string;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
  color?: string;
}
