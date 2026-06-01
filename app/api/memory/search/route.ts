import { NextRequest, NextResponse } from 'next/server';
import { MemoryService } from '@/services/memory.service';
import { getCurrentUser } from '@/lib/db/supabase-client';
import type { APIResponse } from '@/types/api';
import type { RetrievedMemory } from '@/types/memory';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'unauthorized', message: 'Sign in to search memories.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const limit = Number(body?.limit || 10);

    if (!query) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'invalid_request', message: 'query is required.' },
        { status: 400 }
      );
    }

    const memories = (await MemoryService.searchMemories(
      user.id,
      query,
      Number.isFinite(limit) ? limit : 10
    )) as RetrievedMemory[];

    return NextResponse.json<APIResponse<{ memories: RetrievedMemory[] }>>({
      success: true,
      data: { memories },
    });
  } catch (error) {
    console.error('Memory search error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_search_memories',
        message: error instanceof Error ? error.message : 'Unable to search memories.',
      },
      { status: 500 }
    );
  }
}
