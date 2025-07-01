import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function transcribeImage(imageUrl: string): Promise<string> {
  try {
    console.log(
      '🔍 Starting image transcription for:',
      `${imageUrl.substring(0, 100)}...`,
    );

    const { fullStream } = streamText({
      model: openai('gpt-4.1'), // Dedicated GPT-4.1 instance for transcription
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Transcribe the image exactly, if there is no text to transcribe then describe the image in detail.',
            },
            {
              type: 'image',
              image: imageUrl,
            },
          ],
        },
      ],
      maxTokens: 1000, // Reasonable limit for transcription
    });

    let transcription = '';
    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        transcription += delta.textDelta;
      }
    }

    const result = transcription.trim();
    console.log('✅ Image transcription completed:', {
      inputUrl: `${imageUrl.substring(0, 50)}...`,
      outputLength: result.length,
      preview: `${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`,
    });

    return result;
  } catch (error) {
    console.error('❌ Failed to transcribe image:', error);
    throw new Error('Image transcription failed');
  }
}
