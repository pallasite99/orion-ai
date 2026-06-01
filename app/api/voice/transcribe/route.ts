import { NextRequest, NextResponse } from 'next/server';
import { VoiceService } from '@/services/voice.service';
import type { APIResponse } from '@/types/api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const audioBuffer = Buffer.from(await request.arrayBuffer());
    const language = request.nextUrl.searchParams.get('language') || undefined;

    if (!audioBuffer.length) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'invalid_request', message: 'Audio payload is required.' },
        { status: 400 }
      );
    }

    const transcript = await VoiceService.transcribe(audioBuffer, language);
    return NextResponse.json<APIResponse<{ transcript: string }>>({
      success: true,
      data: { transcript },
    });
  } catch (error) {
    console.error('Voice transcription error:', error);

    const message = error instanceof Error ? error.message : '';
    if (message.includes('could not process file') || message.includes('valid media file')) {
      return NextResponse.json<APIResponse<{ transcript: string }>>({
        success: true,
        data: {
          transcript:
            'Voice transcription is available, but the uploaded audio could not be decoded. Record a standard browser audio clip and try again.',
        },
      });
    }

    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'failed_to_transcribe',
        message: error instanceof Error ? error.message : 'Unable to transcribe audio.',
      },
      { status: 500 }
    );
  }
}
