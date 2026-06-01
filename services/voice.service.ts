import { AIService } from './ai.service';

export interface TranscribeRequest {
  audio: Buffer;
  language?: string;
}

export class VoiceService {
  static async transcribe(audio: Buffer, language?: string): Promise<string> {
    return AIService.transcribe(audio, language);
  }
}
