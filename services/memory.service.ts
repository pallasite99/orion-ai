import { supabaseClient } from '@/lib/db/supabase-client';
import {
  Memory,
  MemoryType,
  MemoryCreateRequest,
  MemoryUpdateRequest,
  RetrievedMemory,
} from '@/types/memory';
import { AIService } from './ai.service';

export class MemoryService {
  private static buildEmbeddingText(
    title: string,
    content: string,
    tags: string[] = []
  ): string {
    return [title, content, tags.length ? `Tags: ${tags.join(', ')}` : '']
      .filter(Boolean)
      .join('\n');
  }

  private static normalizeSearchTerms(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length > 1);
  }

  private static scoreLocalMemory(memory: Memory, terms: string[]): number {
    const haystack = [
      memory.title,
      memory.content,
      memory.type,
      ...(memory.tags ?? []),
    ]
      .join(' ')
      .toLowerCase();

    const matches = terms.reduce((score, term) => {
      if (haystack.includes(term)) return score + 1;
      return score;
    }, 0);

    return matches + memory.importance_score / 10;
  }

  /**
   * Create a new memory
   */
  static async createMemory(
    user_id: string,
    request: MemoryCreateRequest
  ): Promise<Memory> {
    const embeddingSource = this.buildEmbeddingText(
      request.title,
      request.content,
      request.tags || []
    );
    const embedding = await AIService.getEmbedding(embeddingSource);

    const { data, error } = await supabaseClient
      .from('memories')
      .insert([
        {
          user_id,
          type: request.type,
          title: request.title,
          content: request.content,
          tags: request.tags || [],
          source: request.source,
          importance_score: request.importance_score || 5,
          embedding,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all memories for a user (with pagination)
   */
  static async getUserMemories(
    user_id: string,
    type?: MemoryType,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ memories: Memory[]; total: number }> {
    let query = supabaseClient
      .from('memories')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id);

    if (type) {
      query = query.eq('type', type);
    }

    query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { memories: data as Memory[], total: count || 0 };
  }

  /**
   * Get a single memory
   */
  static async getMemory(memory_id: string): Promise<Memory> {
    const { data, error } = await supabaseClient
      .from('memories')
      .select('*')
      .eq('id', memory_id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getOwnedMemory(user_id: string, memory_id: string): Promise<Memory> {
    const { data, error } = await supabaseClient
      .from('memories')
      .select('*')
      .eq('id', memory_id)
      .eq('user_id', user_id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a memory
   */
  static async updateMemory(
    memory_id: string,
    request: MemoryUpdateRequest,
    user_id?: string
  ): Promise<Memory> {
    let updateData: any = {
      ...request,
      updated_at: new Date().toISOString(),
    };

    // Re-embed if content changed
    if (request.title || request.content || request.tags) {
      const title = request.title || '';
      const content = request.content || '';
      const tags = request.tags || [];
      updateData.embedding = await AIService.getEmbedding(
        this.buildEmbeddingText(title, content, tags)
      );
    }

    if (user_id) {
      updateData.user_id = user_id;
    }

    let query = supabaseClient.from('memories').update(updateData).eq('id', memory_id);
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(memory_id: string, user_id?: string): Promise<void> {
    let query = supabaseClient.from('memories').delete().eq('id', memory_id);
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { error } = await query;

    if (error) throw error;
  }

  /**
   * Search memories by semantic similarity
   */
  static async searchMemories(
    user_id: string,
    query: string,
    limit: number = 10
  ): Promise<RetrievedMemory[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await AIService.getEmbedding(query);

      // Search using vector similarity
      const { data, error } = await supabaseClient.rpc(
        'search_memories',
        {
          user_id_input: user_id,
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: limit,
        }
      );

      if (error) throw error;
      return data as RetrievedMemory[];
    } catch (error) {
      console.error('Error searching memories:', error);
      // Fallback to local scoring if vector search fails
      return this.localSearchMemories(user_id, query, limit);
    }
  }

  /**
   * Keyword search memories (fallback)
   */
  static async keywordSearchMemories(
    user_id: string,
    query: string,
    limit: number = 10
  ): Promise<RetrievedMemory[]> {
    const { data, error } = await supabaseClient
      .from('memories')
      .select('*')
      .eq('user_id', user_id)
      .textSearch('content', query)
      .limit(limit);

    if (error) throw error;
    return data as RetrievedMemory[];
  }

  static async localSearchMemories(
    user_id: string,
    query: string,
    limit: number = 10
  ): Promise<RetrievedMemory[]> {
    const { memories } = await this.getUserMemories(user_id, undefined, 200, 0);
    const terms = this.normalizeSearchTerms(query);

    return memories
      .map((memory) => ({
        ...memory,
        relevance_score: terms.length ? this.scoreLocalMemory(memory, terms) : memory.importance_score / 10,
      }))
      .filter((memory) => {
        if (!terms.length) return true;
        return (memory.relevance_score ?? 0) > 0;
      })
      .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0))
      .slice(0, limit);
  }

  static formatMemoryContext(memories: RetrievedMemory[]): string {
    if (!memories.length) {
      return 'No relevant memories were found.';
    }

    return memories
      .map((memory, index) => {
        const tags = memory.tags?.length ? ` Tags: ${memory.tags.join(', ')}.` : '';
        const relevance =
          typeof memory.relevance_score === 'number'
            ? ` Relevance: ${memory.relevance_score.toFixed(2)}.`
            : '';
        return `${index + 1}. [${memory.type}] ${memory.title}: ${memory.content}.${tags}${relevance}`;
      })
      .join('\n');
  }

  static async getRelevantMemories(
    user_id: string,
    query: string,
    limit: number = 5
  ): Promise<RetrievedMemory[]> {
    const [semanticMatches, recentMatches] = await Promise.all([
      this.searchMemories(user_id, query, limit),
      this.getRecentMemories(user_id, 7, limit),
    ]);

    const combined = [...semanticMatches];
    for (const memory of recentMatches) {
      if (!combined.some((item) => item.id === memory.id)) {
        combined.push(memory);
      }
    }

    return combined.slice(0, limit);
  }

  /**
   * Extract memories from a conversation turn
   * Uses AI to identify important facts to remember
   */
  static async extractMemoriesFromConversation(
    user_id: string,
    user_message: string,
    assistant_response: string,
    chat_id: string
  ): Promise<Memory[]> {
    try {
      // Use GPT to extract important facts
      const extractionPrompt = `You are a memory extraction assistant for a personal AI assistant. 
      
Given the following user message and assistant response, extract key facts that should be remembered for future reference.

Extract only factual, useful information that would help contextualize future conversations.
Avoid obvious statements or common knowledge.
Format as a JSON array with objects containing: type (fact|preference|note), title, and content.

User Message: "${user_message}"
Assistant Response: "${assistant_response}"

Return ONLY valid JSON, no other text.`;

      const extracted = await AIService.extractJSON(extractionPrompt);
      const memories: Memory[] = [];

      if (Array.isArray(extracted)) {
        const items = extracted.filter((item) => item.title && item.content);
        const created = await Promise.all(
          items.map((item) =>
            this.createMemory(user_id, {
              type: (item.type || 'note') as MemoryType,
              title: item.title,
              content: item.content,
              source: `chat:${chat_id}`,
              importance_score: 6,
            })
          )
        );
        memories.push(...created);
      }

      return memories;
    } catch (error) {
      console.error('Error extracting memories:', error);
      return [];
    }
  }

  /**
   * Get memories by importance
   */
  static async getMemoriesByImportance(
    user_id: string,
    min_score: number = 7,
    limit: number = 10
  ): Promise<Memory[]> {
    const { data, error } = await supabaseClient
      .from('memories')
      .select('*')
      .eq('user_id', user_id)
      .gte('importance_score', min_score)
      .order('importance_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get recent memories
   */
  static async getRecentMemories(
    user_id: string,
    days: number = 7,
    limit: number = 20
  ): Promise<Memory[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const { data, error } = await supabaseClient
      .from('memories')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get memories by tag
   */
  static async getMemoriesByTag(
    user_id: string,
    tag: string,
    limit: number = 20
  ): Promise<Memory[]> {
    const { data, error } = await supabaseClient
      .from('memories')
      .select('*')
      .eq('user_id', user_id)
      .contains('tags', [tag])
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
