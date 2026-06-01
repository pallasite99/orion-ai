import { OpenAI } from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const organization = process.env.NEXT_PUBLIC_OPENAI_ORG_ID;
const groqApiKey = process.env.GROQ_API_KEY;
const aiProvider = (process.env.AI_PROVIDER || '').trim().toLowerCase();

function looksLikePlaceholder(value: string | undefined) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized.includes('your-') || normalized.includes('placeholder');
}

function resolveProvider() {
  if (aiProvider === 'mock') return 'mock';
  if (aiProvider === 'groq') return groqApiKey && !looksLikePlaceholder(groqApiKey) ? 'groq' : 'mock';
  if (aiProvider === 'openai') return apiKey && !looksLikePlaceholder(apiKey) ? 'openai' : 'mock';

  if (groqApiKey && !looksLikePlaceholder(groqApiKey)) return 'groq';
  if (apiKey && !looksLikePlaceholder(apiKey)) return 'openai';
  return 'mock';
}

const provider = resolveProvider();

export const openai =
  provider === 'mock'
    ? null
    : new OpenAI({
        apiKey: provider === 'groq' ? groqApiKey! : apiKey!,
        baseURL: provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
        organization,
      });

export const AI_PROVIDER = provider;

// Default model configuration
export const DEFAULT_MODEL = provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o';
export const EMBEDDING_MODEL = 'text-embedding-3-small';
const TRANSCRIPTION_MODEL = provider === 'groq' ? 'whisper-large-v3-turbo' : 'whisper-1';
const SPEECH_MODEL = provider === 'groq' ? 'playai-tts' : 'tts-1';

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

const placeholderResponse = (messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => {
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  const prompt = lastUser?.content ?? 'Hello.';
  return {
    choices: [
      {
        message: {
          content: `ORION placeholder response: I heard "${prompt}". Add GROQ_API_KEY or OPENAI_API_KEY in .env.local, or set AI_PROVIDER=mock to keep the local fallback.`,
        },
      },
    ],
  };
};

function createMockStream(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) {
  const full = placeholderResponse(messages).choices[0].message.content;
  async function* generator() {
    let buffer = '';
    for (const char of full) {
      buffer += char;
      yield {
        choices: [
          {
            delta: { content: char },
          },
        ],
      };
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }
  return generator();
}

function generateLocalEmbedding(text: string) {
  const dimension = 1536;
  const vector = new Array<number>(dimension);
  let seed = 0;

  for (let i = 0; i < text.length; i += 1) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }

  for (let i = 0; i < dimension; i += 1) {
    const mix = (seed + i * 2654435761) >>> 0;
    vector[i] = Math.sin(mix) * 0.5 + Math.cos(mix * 0.5) * 0.5;
  }

  return vector;
}

export async function createChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: ChatCompletionOptions = {}
) {
  if (provider === 'mock' || !openai) {
    return placeholderResponse(messages) as any;
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    max_tokens = 2048,
    top_p = 1,
  } = options;

  return openai.chat.completions.create({
    model,
    messages: messages as any,
    temperature,
    max_tokens,
    top_p,
  });
}

export async function createChatCompletionStream(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: ChatCompletionOptions = {}
) {
  if (provider === 'mock' || !openai) {
    return createMockStream(messages) as any;
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    max_tokens = 2048,
    top_p = 1,
  } = options;

  return openai!.chat.completions.create({
    model,
    messages: messages as any,
    temperature,
    max_tokens,
    top_p,
    stream: true,
  });
}

export async function generateEmbedding(text: string) {
  if (provider !== 'openai' || !openai) {
    return generateLocalEmbedding(text);
  }

  const response = await openai!.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

export async function transcribeAudio(audioBuffer: Buffer, language?: string) {
  if (provider === 'mock' || !openai) {
    return 'Placeholder transcription mode is active. Audio transcription is unavailable without OpenAI API access.';
  }

  const blob = typeof File !== 'undefined'
    ? new File([audioBuffer as any], 'audio.webm', { type: 'audio/webm' })
    : new Blob([audioBuffer as any], { type: 'audio/webm' });
  const response = await openai!.audio.transcriptions.create({
    file: blob as any,
    model: TRANSCRIPTION_MODEL,
    language,
  });
  return response.text;
}

export async function textToSpeech(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova') {
  if (provider === 'mock' || !openai || provider === 'groq') {
    return new ArrayBuffer(0);
  }

  const response = await openai!.audio.speech.create({
    model: SPEECH_MODEL,
    voice,
    input: text,
  });
  return await response.arrayBuffer();
}
