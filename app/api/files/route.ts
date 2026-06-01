import { NextRequest, NextResponse } from 'next/server';
import { FileService } from '@/services/file.service';
import { getCurrentUser } from '@/lib/db/supabase-client';
import type { APIResponse } from '@/types/api';
import type { FileType } from '@/types/file';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const files = await FileService.listFiles();
    return NextResponse.json<APIResponse>({
      success: true,
      data: { files },
    });
  } catch (error) {
    console.error('File list error:', error);
    return NextResponse.json<APIResponse>(
      { success: false, error: 'failed_to_load_files', message: 'Unable to load files.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const storageUrl = typeof body?.storage_url === 'string' ? body.storage_url.trim() : '';
    const fileType = typeof body?.file_type === 'string' ? body.file_type : '';
    const extractedText = typeof body?.extracted_text === 'string' ? body.extracted_text : '';

    if (!name || !storageUrl || !fileType) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'invalid_request',
          message: 'name, storage_url, and file_type are required.',
        },
        { status: 400 }
      );
    }

    const file = await FileService.ingestFile(user?.id || 'user-placeholder', {
      name,
      storage_url: storageUrl,
      file_type: fileType as FileType,
      extracted_text: extractedText || undefined,
    });

    return NextResponse.json<APIResponse>({
      success: true,
      data: { file },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_create_file',
        message: error instanceof Error ? error.message : 'Unable to create file.',
      },
      { status: 500 }
    );
  }
}
