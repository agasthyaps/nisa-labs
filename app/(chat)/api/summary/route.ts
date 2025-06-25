import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { lookForSummaryPrompt } from '@/lib/ai/prompts';

export async function GET() {
  try {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const promptWithDate = `${lookForSummaryPrompt}

Current date: ${currentDate}`;

    const result = await generateText({
      model: myProvider.languageModel('title-model'),
      prompt: promptWithDate,
    });

    return Response.json({ summary: result.text });
  } catch (error) {
    console.error('Error generating summary:', error);
    return Response.json(
      { error: 'Failed to generate summary' },
      { status: 500 },
    );
  }
}
