import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { myProvider } from '@/lib/ai/providers';
import { getChatById, getMessagesByChatId, saveReport } from '@/lib/db/queries';
import type { Chat } from '@/lib/db/schema';
import { streamText } from 'ai';

export const maxDuration = 60;

type GenerateReportRequest = {
  chatId: string;
  guidance?: string;
};

type SaveReportRequest = {
  chatId: string;
  report: unknown;
  guidance?: string;
};

function extractTextFromParts(parts: any): string {
  try {
    if (!Array.isArray(parts)) return '';
    return parts
      .filter((p) => p && typeof p === 'object' && p.type === 'text' && p.text)
      .map((p) => String(p.text))
      .join('\n');
  } catch {
    return '';
  }
}

function buildTranscript(messages: Array<{ role: string; parts: any }>): string {
  return messages
    .map((m) => {
      const role = m.role === 'user' ? 'User' : 'Assistant';
      const text = extractTextFromParts(m.parts);
      if (!text) return '';
      return `${role}: ${text}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function cleanJsonText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
  }
  return trimmed;
}

export async function POST(request: Request) {
  let body: GenerateReportRequest;
  try {
    body = (await request.json()) as GenerateReportRequest;
  } catch {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const { chatId, guidance } = body;
  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  let chat: Chat | undefined;
  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const previousMessages = await getMessagesByChatId({ id: chatId });
  const transcript = buildTranscript(previousMessages as any);

  const systemPrompt = `You are Nisa, generating a concise structured report summarizing a conversation between a user and an AI assistant.
Output strictly valid minified JSON matching exactly this schema and key names, with no prose or markdown:
{
  "summary": string,
  "relevant_entities": string[],
  "insights": string[],
  "lesson_or_curriculum": string,
  "action_step": string
}`;

  const userContent = `Additional guidance (optional): ${guidance ?? ''}

Conversation transcript:
${transcript}`;

  try {
    const { fullStream } = streamText({
      model: myProvider.languageModel('chat-model'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      maxSteps: 1,
    });

    let text = '';
    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        text += delta.textDelta;
      }
    }

    const cleaned = cleanJsonText(text);
    const parsed = JSON.parse(cleaned);

    return new Response(
      JSON.stringify({ report: parsed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new ChatSDKError('bad_request:api', 'Failed to generate report').toResponse();
  }
}

export async function PUT(request: Request) {
  let body: SaveReportRequest;
  try {
    body = (await request.json()) as SaveReportRequest;
  } catch {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const { chatId, report: reportData, guidance } = body;
  if (!chatId || reportData === undefined) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  let chat: Chat | undefined;
  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  try {
    const [saved] = await saveReport({
      chatId,
      userId: session.user.id,
      data: reportData,
      guidance,
    });

    return new Response(
      JSON.stringify({ id: saved.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new ChatSDKError('bad_request:api', 'Failed to save report').toResponse();
  }
}


