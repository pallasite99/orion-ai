export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatCreateRequest {
  title: string;
}

export interface MessageSendRequest {
  chat_id: string;
  content: string;
  context?: {
    memories?: string[];
    files?: string[];
  };
}

export interface ChatStreamResponse {
  id: string;
  chat_id: string;
  delta: string;
  is_final: boolean;
}
