import { NextRequest, NextResponse } from 'next/server';
import { SearchService } from '@/services/search.service';
import type { APIResponse } from '@/types/api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const limit = typeof body?.limit === 'number' ? body.limit : 5;

    if (!query) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'invalid_request', message: 'query is required.' },
        { status: 400 }
      );
    }

    const results = await SearchService.search(query, limit);
    return NextResponse.json<APIResponse>({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_search',
        message: error instanceof Error ? error.message : 'Unable to search.',
      },
      { status: 500 }
    );
  }
}
