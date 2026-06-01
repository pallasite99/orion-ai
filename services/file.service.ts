import { supabaseClient } from '@/lib/db/supabase-client';
import { AIService } from './ai.service';
import { AI_PROVIDER } from '@/lib/ai/openai-client';
import type { FileChunk, FileRecord, FileType } from '@/types/file';

export interface IngestedFileInput {
  name: string;
  file_type: FileType;
  storage_url: string;
  extracted_text?: string;
}

export interface FileQuestionAnswer {
  answer: string;
  source_chunks: FileChunk[];
  confidence: number;
}

export interface FileSearchHit {
  file: FileRecord;
  relevance_score: number;
  snippet: string;
}

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 120;

export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  if (normalized.length <= chunkSize) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + chunkSize);
    const slice = normalized.slice(start, end).trim();
    if (slice) chunks.push(slice);
    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

function normalizeTerms(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1);
}

function scoreText(haystack: string, terms: string[]) {
  if (!terms.length) return 0;
  const normalized = haystack.toLowerCase();
  return terms.reduce((score, term) => {
    if (normalized.includes(term)) return score + 1;
    return score;
  }, 0);
}

export function buildFileSnippet(text: string, query: string, maxLength = 160) {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!normalizedText) return '';

  const terms = normalizeTerms(query);
  if (!terms.length) {
    return normalizedText.slice(0, maxLength);
  }

  const lower = normalizedText.toLowerCase();
  const hitIndex = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (hitIndex === undefined) {
    return normalizedText.slice(0, maxLength);
  }

  const start = Math.max(0, hitIndex - 40);
  const end = Math.min(normalizedText.length, hitIndex + maxLength - 40);
  return normalizedText.slice(start, end);
}

export class FileService {
  static async getFiles(): Promise<FileRecord[]> {
    return this.listFiles();
  }

  static async getFile(fileId: string): Promise<FileRecord | null> {
    const { data, error } = await supabaseClient.from('files').select('*').eq('id', fileId).single();
    if (error) return null;
    return (data as FileRecord) || null;
  }

  static async listFiles(): Promise<FileRecord[]> {
    const { data, error } = await supabaseClient
      .from('files')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as FileRecord[]) || [];
  }

  static async ingestFile(userId: string, input: IngestedFileInput): Promise<FileRecord> {
    const { data, error } = await supabaseClient
      .from('files')
      .insert([
        {
          user_id: userId,
          name: input.name,
          file_type: input.file_type,
          storage_url: input.storage_url,
          extracted_text: input.extracted_text,
          status: input.extracted_text ? 'ready' : 'processing',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    const file = data as FileRecord;

    if (input.extracted_text?.trim()) {
      await this.rebuildFileChunks(file.id, userId, input.extracted_text, {
        file_type: input.file_type,
        storage_url: input.storage_url,
      });
    }

    return file;
  }

  static async deleteFile(fileId: string): Promise<void> {
    const { error: chunkError } = await supabaseClient.from('file_chunks').delete().eq('file_id', fileId);
    if (chunkError) throw chunkError;
    const { error } = await supabaseClient.from('files').delete().eq('id', fileId);
    if (error) throw error;
  }

  static async rebuildFileChunks(
    fileId: string,
    userId: string,
    extractedText: string,
    metadata?: Record<string, any>
  ): Promise<FileChunk[]> {
    const chunks = chunkText(extractedText);
    const chunkRecords = chunks.map((content, index) => ({
      file_id: fileId,
      user_id: userId,
      chunk_index: index,
      content,
      metadata,
      embedding: undefined,
    }));

    const { error: deleteError } = await supabaseClient.from('file_chunks').delete().eq('file_id', fileId);
    if (deleteError) throw deleteError;
    if (chunkRecords.length) {
      const { error: insertError } = await supabaseClient.from('file_chunks').insert(chunkRecords);
      if (insertError) throw insertError;
    }
    return this.getFileChunks(fileId);
  }

  static async getFileChunks(fileId: string): Promise<FileChunk[]> {
    const { data, error } = await supabaseClient
      .from('file_chunks')
      .select('*')
      .eq('file_id', fileId)
      .order('chunk_index', { ascending: true });
    if (error) throw error;
    return (data as FileChunk[]) || [];
  }

  static async answerQuestion(fileId: string, question: string): Promise<FileQuestionAnswer> {
    const file = await this.getFile(fileId);
    if (!file) {
      return {
        answer: 'File not found.',
        source_chunks: [],
        confidence: 0,
      };
    }

    const chunks = await this.getFileChunks(fileId);
    const terms = normalizeTerms(question);
    const scored = chunks
      .map((chunk) => ({
        chunk,
        score: scoreText(chunk.content, terms),
      }))
      .sort((a, b) => b.score - a.score);

    const matchedChunks = scored.filter((item) => item.score > 0).slice(0, 3).map((item) => item.chunk);
    const fallbackChunks = matchedChunks.length ? matchedChunks : chunks.slice(0, 2);
    const source_chunks = fallbackChunks;
    const supportingText = fallbackChunks.map((chunk) => chunk.content).join(' ');

    let answer = `Based on ${file.name}, the most relevant details are: ${supportingText || 'No extracted text is available yet.'}`;
    const confidence = source_chunks.length
      ? Math.min(0.95, matchedChunks.length ? 0.35 + source_chunks.length * 0.2 : 0.25)
      : supportingText
        ? 0.35
        : 0;

    if (AI_PROVIDER !== 'mock' && supportingText) {
      try {
        const prompt = [
          {
            role: 'system' as const,
            content:
              'Answer the question using only the provided file context. Keep it concise and cite the relevant details from the file.',
          },
          {
            role: 'user' as const,
            content: `File: ${file.name}\nQuestion: ${question}\n\nContext:\n${supportingText}`,
          },
        ];
        answer = await AIService.generateResponse(prompt as any, {
          temperature: 0.2,
          max_tokens: 300,
        });
      } catch {
        // Fall back to the deterministic answer below.
      }
    }

    return {
      answer,
      source_chunks,
      confidence,
    };
  }

  static async searchFiles(query: string, limit: number = 10): Promise<FileSearchHit[]> {
    const terms = normalizeTerms(query);
    const files = await this.listFiles();

    return files
      .map((file) => {
        const haystack = [file.name, file.file_type, file.storage_url, file.extracted_text || ''].join(' ');
        const relevance_score = scoreText(haystack, terms);
        return {
          file,
          relevance_score,
          snippet: buildFileSnippet(file.extracted_text || file.storage_url, query),
        };
      })
      .filter((hit) => !terms.length || hit.relevance_score > 0)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
  }
}
