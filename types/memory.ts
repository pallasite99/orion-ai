export type MemoryType = 'fact' | 'preference' | 'task' | 'project' | 'file' | 'note';

export interface Memory {
  id: string;
  user_id: string;
  type: MemoryType;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  importance_score: number; // 0-10
  embedding?: number[]; // vector(1536)
  created_at: string;
  updated_at: string;
}

export interface MemoryCreateRequest {
  type: MemoryType;
  title: string;
  content: string;
  tags?: string[];
  source?: string;
  importance_score?: number;
}

export interface MemoryUpdateRequest {
  type?: MemoryType;
  title?: string;
  content?: string;
  tags?: string[];
  importance_score?: number;
}

export interface MemorySearchRequest {
  query: string;
  type?: MemoryType;
  limit?: number;
}

export interface RetrievedMemory extends Memory {
  relevance_score?: number;
}
