import {
  createProject,
  createTask,
  deleteTask,
  getProjects,
  getTasks,
  getTodaySummary,
  toggleTaskStatus,
  updateTask,
} from '@/lib/mvp-store';
import type { Project, Task, TaskCreateRequest, TaskPriority, TaskStatus } from '@/types/task';

export interface TaskOverview {
  tasks: Task[];
  projects: Project[];
  dueToday: Task[];
  completed: Task[];
  inProgress: Task[];
  highPriority: Task[];
  blocked: Task[];
}

export class TaskService {
  static getTasks(): Task[] {
    return getTasks();
  }

  static createTask(input: TaskCreateRequest, userId = 'user-placeholder'): Task {
    return createTask(input, userId);
  }

  static updateTask(id: string, patch: Partial<Task>): Task | null {
    return updateTask(id, patch);
  }

  static deleteTask(id: string): void {
    deleteTask(id);
  }

  static toggleTaskStatus(id: string): Task | null {
    return toggleTaskStatus(id);
  }

  static getProjects(): Project[] {
    return getProjects();
  }

  static createProject(name: string, description?: string) {
    return createProject(name, description);
  }

  static getOverview(): TaskOverview {
    const summary = getTodaySummary();
    return {
      tasks: summary.tasks,
      projects: summary.projects,
      dueToday: summary.dueToday,
      completed: summary.completed,
      inProgress: summary.inProgress,
      highPriority: summary.highPriority,
      blocked: summary.tasks.filter((task) => task.status === 'blocked'),
    };
  }

  static getPriorityLabel(priority: TaskPriority): string {
    if (priority >= 5) return 'Critical';
    if (priority === 4) return 'High';
    if (priority === 3) return 'Medium';
    return 'Low';
  }

  static getStatusTone(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      todo: 'text-gray-300',
      in_progress: 'text-cyan-200',
      done: 'text-emerald-200',
      blocked: 'text-red-200',
    };
    return map[status];
  }
}
