import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { MemoryService } from '@/services/memory.service';
import { getCurrentUser } from '@/lib/db/supabase-client';
import type { APIResponse } from '@/types/api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const systemPrompt = typeof body?.system_prompt === 'string' ? body.system_prompt : undefined;
    const chatId = typeof body?.chat_id === 'string' ? body.chat_id : 'ad-hoc';
    const formattingPrompt =
      'Format every response in clean Markdown. Use short headings, bullet lists, numbered steps when useful, bold for emphasis, and fenced code blocks for code or commands. Keep the answer concise and easy to scan.';

    if (!messages.length) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'messages are required',
          message: 'Send at least one user message to generate a response.',
        },
        { status: 400 }
      );
    }

    const userMessage = [...messages].reverse().find((message) => message.role === 'user');
    let memoryPrompt = '';
    const currentUser = await getCurrentUser().catch((error) => {
      console.error('Current user lookup failed:', error);
      return null;
    });

    try {
      if (currentUser && userMessage?.content) {
        const memories = await MemoryService.getRelevantMemories(currentUser.id, userMessage.content, 5);
        if (memories.length) {
          memoryPrompt = [
            'Relevant memories:',
            MemoryService.formatMemoryContext(memories),
          ].join('\n');
        }
      }
    } catch (memoryError) {
      console.error('Memory context lookup failed:', memoryError);
    }

    const combinedSystemPrompt = [formattingPrompt, memoryPrompt, systemPrompt]
      .filter(Boolean)
      .join('\n\n');

    const response = await AIService.generateResponse(messages, {
      system_prompt: combinedSystemPrompt,
      temperature: typeof body?.temperature === 'number' ? body.temperature : undefined,
      max_tokens: typeof body?.max_tokens === 'number' ? body.max_tokens : undefined,
      model: typeof body?.model === 'string' ? body.model : undefined,
    });

    try {
      if (currentUser && userMessage?.content) {
        await MemoryService.extractMemoriesFromConversation(
          currentUser.id,
          userMessage.content,
          response,
          chatId
        );
      }
    } catch (memoryError) {
      console.error('Memory extraction failed:', memoryError);
    }

    return NextResponse.json<APIResponse<{ response: string }>>({
      success: true,
      data: { response },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_generate_response',
        message: error instanceof Error ? error.message : 'Unable to generate response.',
      },
      { status: 500 }
    );
  }
}
