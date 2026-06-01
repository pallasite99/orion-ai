export type FileStatus = 'processing' | 'ready' | 'error';
export type FileType = 'pdf' | 'txt' | 'markdown' | 'docx';

export interface FileRecord {
  id: string;
  user_id: string;
  name: string;
  file_type: FileType;
  storage_url: string;
  extracted_text?: string;
  status: FileStatus;
  error_message?: string;
  created_at: string;
}

export interface FileChunk {
  id: string;
  file_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[]; // vector(1536)
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FileUploadRequest {
  name: string;
  content: Buffer | Blob;
  type: FileType;
}

export interface FileQuestionRequest {
  file_id: string;
  question: string;
}

export interface FileQuestionResponse {
  answer: string;
  source_chunks: FileChunk[];
  confidence: number;
}
