import { supabaseClient } from '@/lib/db/supabase-client';
import { Chat, Message } from '@/types/chat';
import { AIService } from './ai.service';

export class ChatService {
  /**
   * Create a new chat
   */
  static async createChat(user_id: string, title: string): Promise<Chat> {
    const { data, error } = await supabaseClient
      .from('chats')
      .insert([
        {
          user_id,
          title,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all chats for a user
   */
  static async getUserChats(user_id: string): Promise<Chat[]> {
    const { data, error } = await supabaseClient
      .from('chats')
      .select('*')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get chat history
   */
  static async getChatHistory(chat_id: string): Promise<Message[]> {
    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Save a user message
   */
  static async saveUserMessage(
    chat_id: string,
    user_id: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    const { data, error } = await supabaseClient
      .from('messages')
      .insert([
        {
          chat_id,
          user_id,
          role: 'user',
          content,
          metadata,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Save an assistant message
   */
  static async saveAssistantMessage(
    chat_id: string,
    user_id: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    const { data, error } = await supabaseClient
      .from('messages')
      .insert([
        {
          chat_id,
          user_id,
          role: 'assistant',
          content,
          metadata,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get a single chat
   */
  static async getChat(chat_id: string): Promise<Chat> {
    const { data, error } = await supabaseClient
      .from('chats')
      .select('*')
      .eq('id', chat_id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update chat title
   */
  static async updateChatTitle(chat_id: string, title: string): Promise<Chat> {
    const { data, error } = await supabaseClient
      .from('chats')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', chat_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a chat
   */
  static async deleteChat(chat_id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('chats')
      .delete()
      .eq('id', chat_id);

    if (error) throw error;
  }

  /**
   * Generate a response (non-streaming)
   */
  static async generateResponse(
    chat_id: string,
    user_id: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    system_prompt?: string
  ): Promise<string> {
    try {
      const response = await AIService.generateResponse(messages, {
        system_prompt,
      });

      // Save assistant message to database
      await this.saveAssistantMessage(chat_id, user_id, response);

      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Stream a response
   */
  static async streamResponse(
    chat_id: string,
    user_id: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string) => void,
    system_prompt?: string
  ): Promise<string> {
    try {
      const fullResponse = await AIService.streamResponse(
        messages,
        onChunk,
        {
          system_prompt,
        }
      );

      // Save assistant message to database
      await this.saveAssistantMessage(chat_id, user_id, fullResponse);

      return fullResponse;
    } catch (error) {
      console.error('Error streaming response:', error);
      throw error;
    }
  }
}
