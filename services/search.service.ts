import { supabaseClient } from '@/lib/db/supabase-client';
import { FileService } from './file.service';
import type { FileRecord } from '@/types/file';
import type { Memory } from '@/types/memory';
import type { Project, Task } from '@/types/task';

export interface SearchResult<T> {
  item: T;
  relevance_score: number;
  snippet: string;
}

export interface GlobalSearchResults {
  tasks: SearchResult<Task>[];
  memories: SearchResult<Memory>[];
  projects: SearchResult<Project>[];
  files: SearchResult<FileRecord>[];
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

function buildSnippet(text: string, query: string, maxLength = 160) {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!normalizedText) return '';

  const terms = normalizeTerms(query);
  if (!terms.length) return normalizedText.slice(0, maxLength);

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

function rankCollection<T>(
  items: T[],
  query: string,
  project: (item: T) => string
): SearchResult<T>[] {
  const terms = normalizeTerms(query);
  return items
    .map((item) => {
      const haystack = project(item);
      const relevance_score = scoreText(haystack, terms);
      return {
        item,
        relevance_score,
        snippet: buildSnippet(haystack, query),
      };
    })
    .filter((result) => !terms.length || result.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

export class SearchService {
  static async search(query: string, limit: number = 5): Promise<GlobalSearchResults> {
    const normalizedQuery = query.trim();

    const [taskResult, memoryResult, projectResult, fileResult] = await Promise.all([
      supabaseClient.from('tasks').select('*').order('updated_at', { ascending: false }) as Promise<{
        data: Task[] | null;
        error: any;
      }>,
      supabaseClient.from('memories').select('*').order('updated_at', { ascending: false }) as Promise<{
        data: Memory[] | null;
        error: any;
      }>,
      supabaseClient.from('projects').select('*').order('updated_at', { ascending: false }) as Promise<{
        data: Project[] | null;
        error: any;
      }>,
      FileService.searchFiles(normalizedQuery, limit),
    ]);

    if (taskResult.error) throw taskResult.error;
    if (memoryResult.error) throw memoryResult.error;
    if (projectResult.error) throw projectResult.error;

    const tasks = rankCollection(taskResult.data || [], normalizedQuery, (task: Task) =>
      [task.title, task.description, task.status, task.due_date || ''].join(' ')
    ).slice(0, limit);

    const memories = rankCollection(memoryResult.data || [], normalizedQuery, (memory: Memory) =>
      [memory.title, memory.content, memory.type, ...(memory.tags || [])].join(' ')
    ).slice(0, limit);

    const projects = rankCollection(projectResult.data || [], normalizedQuery, (project: Project) =>
      [project.name, project.description, project.status].join(' ')
    ).slice(0, limit);

    const files = fileResult.map((hit) => ({
      item: hit.file,
      relevance_score: hit.relevance_score,
      snippet: hit.snippet,
    }));

    return { tasks, memories, projects, files };
  }

  static async searchFileChunks(fileId: string, query: string, limit: number = 3) {
    const { data, error } = await supabaseClient
      .from('file_chunks')
      .select('*')
      .eq('file_id', fileId)
      .order('chunk_index', { ascending: true });
    if (error) throw error;
    const chunks = data || [];
    const terms = normalizeTerms(query);

    return chunks
      .map((chunk: any) => ({
        item: chunk,
        relevance_score: scoreText(chunk.content, terms),
        snippet: buildSnippet(chunk.content, query),
      }))
      .filter((result: SearchResult<any>) => !terms.length || result.relevance_score > 0)
      .sort((a: SearchResult<any>, b: SearchResult<any>) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
  }
}
