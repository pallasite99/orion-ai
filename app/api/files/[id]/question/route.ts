import { NextRequest, NextResponse } from 'next/server';
import { FileService } from '@/services/file.service';
import type { APIResponse } from '@/types/api';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const question = typeof body?.question === 'string' ? body.question.trim() : '';

    if (!question) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'invalid_request', message: 'question is required.' },
        { status: 400 }
      );
    }

    const answer = await FileService.answerQuestion(id, question);
    return NextResponse.json<APIResponse>({
      success: true,
      data: answer,
    });
  } catch (error) {
    console.error('File question error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_answer_question',
        message: error instanceof Error ? error.message : 'Unable to answer file question.',
      },
      { status: 500 }
    );
  }
}
