import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt, getTextPrompt } from '@/lib/ai/prompts';

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, context, dataStream }) => {
    let draftContent = '';

    // Build the prompt with context if provided
    const prompt = context
      ? `Title: ${title}\n\nContext from conversation: ${context}\n\nGenerate the document based on the title and context provided.`
      : title;

    const textPrompt = await getTextPrompt();
    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: textPrompt.content,

      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;

        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const updatePrompt = await updateDocumentPrompt(document.content, 'text');
    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updatePrompt.content,

      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
});
