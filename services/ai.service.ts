import {
  createChatCompletion,
  createChatCompletionStream,
  generateEmbedding,
  transcribeAudio,
  textToSpeech,
  DEFAULT_MODEL,
} from '@/lib/ai/openai-client';

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export class AIService {
  /**
   * Generate a chat response (non-streaming)
   */
  static async generateResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: AIChatOptions = {}
  ): Promise<string> {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      max_tokens = 2048,
      system_prompt,
    } = options;

    const fullMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // Add system prompt if provided
    if (system_prompt) {
      fullMessages.push({
        role: 'system',
        content: system_prompt,
      });
    }

    // Add conversation messages
    fullMessages.push(
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    );

    try {
      const response = await createChatCompletion(fullMessages, {
        model,
        temperature,
        max_tokens,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Stream a chat response
   */
  static async streamResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string) => void,
    options: AIChatOptions = {}
  ): Promise<string> {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      max_tokens = 2048,
      system_prompt,
    } = options;

    const fullMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (system_prompt) {
      fullMessages.push({
        role: 'system',
        content: system_prompt,
      });
    }

    fullMessages.push(
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    );

    try {
      const stream = await createChatCompletionStream(fullMessages, {
        model,
        temperature,
        max_tokens,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0].delta.content || '';
        if (delta) {
          fullResponse += delta;
          onChunk(delta);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Error streaming response:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for semantic search
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await Promise.all(
        texts.map((text) => generateEmbedding(text))
      );
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Extract structured data from text using JSON mode
   */
  static async extractJSON(
    prompt: string,
    schema?: Record<string, string>
  ): Promise<any> {
    const systemPrompt = schema
      ? `You are a data extraction assistant. Extract information according to this schema: ${JSON.stringify(schema)}. Respond only with valid JSON.`
      : 'You are a data extraction assistant. Extract information as valid JSON.';

    try {
      const response = await createChatCompletion(
        [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          model: DEFAULT_MODEL,
          temperature: 0.3,
        }
      );

      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error extracting JSON:', error);
      throw error;
    }
  }

  /**
   * Summarize text
   */
  static async summarize(text: string, max_length: number = 200): Promise<string> {
    try {
      const response = await createChatCompletion([
        {
          role: 'user',
          content: `Summarize the following text in ${max_length} characters or less:\n\n${text}`,
        },
      ]);

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error summarizing:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for a single text
   */
  static async getEmbedding(text: string): Promise<number[]> {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio
   */
  static async transcribe(
    audioBuffer: Buffer,
    language?: string
  ): Promise<string> {
    try {
      return await transcribeAudio(audioBuffer, language);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  /**
   * Text-to-speech
   */
  static async speak(
    text: string,
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  ): Promise<ArrayBuffer> {
    try {
      return await textToSpeech(text, voice);
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }
}
