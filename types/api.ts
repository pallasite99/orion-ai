export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface StreamChunk {
  id: string;
  type: 'content' | 'memory' | 'tool_call' | 'final';
  delta?: string;
  data?: any;
  timestamp: number;
}
