import { NextRequest, NextResponse } from 'next/server';
import { FileService } from '@/services/file.service';
import type { APIResponse } from '@/types/api';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const file = await FileService.getFile(id);
    if (!file) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'not_found', message: 'File not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json<APIResponse>({
      success: true,
      data: { file, chunks: await FileService.getFileChunks(id) },
    });
  } catch (error) {
    console.error('File detail error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_load_file',
        message: error instanceof Error ? error.message : 'Unable to load file.',
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
    const { id } = await params;
    await FileService.deleteFile(id);
    return NextResponse.json<APIResponse>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_delete_file',
        message: error instanceof Error ? error.message : 'Unable to delete file.',
      },
      { status: 500 }
    );
  }
}
