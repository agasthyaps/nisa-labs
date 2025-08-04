import { tool } from 'ai';
import { z } from 'zod';
import { myProvider } from '../providers';
import { streamText } from 'ai';

/**
 * Tool for transcribing handwritten notes from images.
 * This tool uses the vision capabilities of the chat model to extract
 * handwritten text from images and return it as digital text.
 */
export const transcribeImage = tool({
  description:
    'Transcribe or describe the content of an image. For handwritten text, transcribe it exactly. For other images, provide a detailed description of what you see.',
  parameters: z.object({
    imageUrl: z
      .string()
      .describe('The URL of the image to transcribe or describe'),
  }),
  execute: async ({ imageUrl }) => {
    let content = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('chat-model'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'If this image contains handwritten text, transcribe it exactly as it appears. If it contains other content (photos, diagrams, etc.), provide a detailed description of what you see.',
            },
            {
              type: 'image',
              image: imageUrl,
            },
          ],
        },
      ],
      // Add Langfuse session tracking for image transcription
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'transcribe-image',
        metadata: {
          image_url: imageUrl,
          // Note: Session tracking (sessionId, userId) would need to be passed from parent context
          // This tool is called during chat processing, so it should inherit session context automatically
        },
      },
    });

    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        content += delta.textDelta;
      }
    }

    return {
      content: content.trim(),
    };
  },
});
