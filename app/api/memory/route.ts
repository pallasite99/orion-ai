import { NextRequest, NextResponse } from 'next/server';
import { MemoryService } from '@/services/memory.service';
import { getCurrentUser } from '@/lib/db/supabase-client';
import type { APIResponse } from '@/types/api';
import type { MemoryCreateRequest } from '@/types/memory';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'unauthorized', message: 'Sign in to view memories.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    const limit = Number(searchParams.get('limit') || '50');
    const offset = Number(searchParams.get('offset') || '0');

    const result = await MemoryService.getUserMemories(
      user.id,
      type as any,
      Number.isFinite(limit) ? limit : 50,
      Number.isFinite(offset) ? offset : 0
    );

    return NextResponse.json<APIResponse<typeof result>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Memory list error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_load_memories',
        message: error instanceof Error ? error.message : 'Unable to load memories.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'unauthorized', message: 'Sign in to create memories.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Partial<MemoryCreateRequest>;
    if (!body.title?.trim() || !body.content?.trim() || !body.type) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'invalid_request',
          message: 'title, content, and type are required.',
        },
        { status: 400 }
      );
    }

    const memory = await MemoryService.createMemory(user.id, {
      title: body.title.trim(),
      content: body.content.trim(),
      type: body.type,
      tags: body.tags ?? [],
      source: body.source,
      importance_score: body.importance_score,
    });

    return NextResponse.json<APIResponse<typeof memory>>(
      {
        success: true,
        data: memory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Memory create error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_create_memory',
        message: error instanceof Error ? error.message : 'Unable to create memory.',
      },
      { status: 500 }
    );
  }
}
