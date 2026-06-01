import { NextRequest, NextResponse } from 'next/server';
import { MemoryService } from '@/services/memory.service';
import { getCurrentUser } from '@/lib/db/supabase-client';
import type { APIResponse } from '@/types/api';
import type { MemoryUpdateRequest } from '@/types/memory';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'unauthorized', message: 'Sign in to view memories.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const memory = await MemoryService.getOwnedMemory(user.id, id);

    return NextResponse.json<APIResponse<typeof memory>>({
      success: true,
      data: memory,
    });
  } catch (error) {
    console.error('Memory detail error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_load_memory',
        message: error instanceof Error ? error.message : 'Unable to load memory.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'unauthorized', message: 'Sign in to edit memories.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as MemoryUpdateRequest;
    const memory = await MemoryService.updateMemory(id, body, user.id);

    return NextResponse.json<APIResponse<typeof memory>>({
      success: true,
      data: memory,
    });
  } catch (error) {
    console.error('Memory update error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_update_memory',
        message: error instanceof Error ? error.message : 'Unable to update memory.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'unauthorized', message: 'Sign in to delete memories.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await MemoryService.deleteMemory(id, user.id);

    return NextResponse.json<APIResponse>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Memory delete error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_delete_memory',
        message: error instanceof Error ? error.message : 'Unable to delete memory.',
      },
      { status: 500 }
    );
  }
}
