import { NextResponse } from 'next/server';
import {
  MINI_NISA_ALLOWED_ORIGINS,
  MINI_NISA_ASSET_CSV_PATH,
  MINI_NISA_ASSET_IMAGE_PATH,
  MINI_NISA_ENABLED,
  MINI_NISA_MAX_TOKENS_CSV,
  MINI_NISA_MAX_TOKENS_GENERAL,
  MINI_NISA_MAX_TOKENS_IMAGE,
} from '@/lib/constants';
import { smoothStream, streamText, createDataStream } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { generateUUID } from '@/lib/utils';
import {
  miniNisaPostRequestBodySchema,
  type MiniNisaPostRequestBody,
} from '@/app/(chat)/api/chat/schema';
import { systemPrompt } from '@/lib/ai/prompts';

// In-memory token tracker for MVP (conversationId -> usedTokens)
// Note: acceptable for small-scale embed; can be replaced with DB+TTL if needed
const tokenUsageByConversation = new Map<string, number>();

function corsAllowed(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return MINI_NISA_ALLOWED_ORIGINS.includes(`${url.protocol}//${url.host}`);
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  const allowed = corsAllowed(origin) ? (origin as string) : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  } as Record<string, string>;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  if (!MINI_NISA_ENABLED) {
    return new NextResponse('Mini NISA disabled', { status: 404 });
  }

  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  if (!headers['Access-Control-Allow-Origin']) {
    return new NextResponse('Origin not allowed', { status: 403, headers });
  }

  let body: MiniNisaPostRequestBody | null = null;
  try {
    const json = await request.json();
    console.log('🔍 Mini NISA request body:', JSON.stringify(json, null, 2));
    body = miniNisaPostRequestBodySchema.parse(json);
    console.log('✅ Mini NISA parsed body:', {
      conversationId: body.conversationId,
      mode: body.mode,
      messageCount: body.messages.length,
    });
  } catch (err) {
    console.error('❌ Mini NISA parse error:', err);
    return new NextResponse('Bad Request', { status: 400, headers });
  }

  const { conversationId, mode, messages } = body;

  // Determine cap by mode
  const maxTokens =
    mode === 'csv'
      ? MINI_NISA_MAX_TOKENS_CSV
      : mode === 'image'
        ? MINI_NISA_MAX_TOKENS_IMAGE
        : MINI_NISA_MAX_TOKENS_GENERAL;

  // Early exit if token cap reached
  const usedSoFar = tokenUsageByConversation.get(conversationId) ?? 0;
  if (usedSoFar >= maxTokens) {
    return new Response(
      'You have reached the token limit for this demo conversation.',
      { headers },
    );
  }

  // Attach preloaded asset on first user message of conversation (client can pass empty messages except the latest)
  const isFirstUserMessage = !tokenUsageByConversation.has(conversationId);
  const latestMessage = messages[messages.length - 1];
  let messageWithAttachment = latestMessage;

  if (isFirstUserMessage) {
    if (mode === 'csv') {
      messageWithAttachment = {
        ...latestMessage,
        experimental_attachments: [
          {
            url: MINI_NISA_ASSET_CSV_PATH,
            name: 'sample.csv',
            contentType: 'text/csv',
          },
        ],
      } as any;
    } else if (mode === 'image') {
      messageWithAttachment = {
        ...latestMessage,
        experimental_attachments: [
          {
            url: MINI_NISA_ASSET_IMAGE_PATH,
            name: 'observation-notes.png',
            contentType: 'image/png',
          },
        ],
      } as any;
    }
  }

  // Restricted tools: only GitHub expertise and transcribe-notes
  const {
    getExpertiseTree,
    listExpertiseFiles,
    readExpertiseFile,
    searchExpertiseContent,
    getExpertiseOverview,
  } = await import('@/lib/ai/tools/github-expertise');
  const { transcribeImage } = await import('@/lib/ai/tools/transcribe-notes');
  const { transcribeImage: transcribeImageServer } = await import(
    '@/lib/ai/image-transcription'
  );

  const tools = {
    getExpertiseTree: getExpertiseTree({
      session: { user: { id: 'mini-nisa' } } as any,
    }),
    listExpertiseFiles: listExpertiseFiles({
      session: { user: { id: 'mini-nisa' } } as any,
    }),
    readExpertiseFile: readExpertiseFile({
      session: { user: { id: 'mini-nisa' } } as any,
    }),
    searchExpertiseContent: searchExpertiseContent({
      session: { user: { id: 'mini-nisa' } } as any,
    }),
    getExpertiseOverview: getExpertiseOverview({
      session: { user: { id: 'mini-nisa' } } as any,
    }),
    transcribeImage,
  } as const;

  const activeTools = Object.keys(tools);

  // Minimal request hints for prompt; no user data
  const now = new Date();
  const requestHints = {
    latitude: undefined,
    longitude: undefined,
    city: undefined,
    country: undefined,
    currentDate: now.toISOString().split('T')[0],
    currentTime: now.toTimeString().slice(0, 8),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    userName: 'Guest',
  } as any;

  const systemPromptData = await systemPrompt({
    selectedChatModel: 'chat-model',
    requestHints,
    userRole: 'coach',
  });

  // Build prior messages in Vercel AI format (user + assistant text parts)
  const history = messages
    .slice(0, -1)
    .map((m) => ({ role: m.role, content: m.content }));

  const stream = createDataStream({
    execute: async (dataStream) => {
      console.log('🚀 Starting stream execution for:', {
        conversationId,
        mode,
        isFirstUserMessage,
      });

      // For CSV mode, inline the CSV content. For image mode, let the model see the actual image.
      let userContent = messageWithAttachment.content;
      let finalMessage = messageWithAttachment;

      try {
        if (isFirstUserMessage && mode === 'csv') {
          const url = new URL(
            MINI_NISA_ASSET_CSV_PATH,
            new URL(request.url).origin,
          ).toString();
          console.log('📄 Fetching CSV from:', url);
          const resp = await fetch(url);
          if (resp.ok) {
            const csvText = await resp.text();
            userContent = `${userContent}\n\n[CSV content attached]\n${csvText}`;
            console.log('✅ CSV attached, content length:', csvText.length);
          } else {
            console.error(
              '❌ Failed to fetch CSV:',
              resp.status,
              resp.statusText,
            );
          }
        } else if (isFirstUserMessage && mode === 'image') {
          // For image mode, convert to base64 since OpenAI can't access localhost
          const fullImageUrl = new URL(
            MINI_NISA_ASSET_IMAGE_PATH,
            new URL(request.url).origin,
          ).toString();
          console.log('🖼️ Fetching image for base64 conversion:', fullImageUrl);

          const imageResp = await fetch(fullImageUrl);
          if (imageResp.ok) {
            const arrayBuffer = await imageResp.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;

            finalMessage = {
              ...messageWithAttachment,
              experimental_attachments: [
                {
                  url: dataUrl,
                  name: 'observation-notes.png',
                  contentType: 'image/png',
                },
              ],
            };
            console.log('✅ Image converted to base64, size:', base64.length);
          } else {
            console.error('❌ Failed to fetch image:', imageResp.status);
          }
        }
      } catch (error) {
        console.error('❌ Error processing asset:', error);
      }

      console.log('🤖 Starting streamText with:', {
        messageCount: [...history, { role: 'user', content: userContent }]
          .length,
        userContentLength: userContent.length,
        activeToolsCount: activeTools.length,
      });

      const result = streamText({
        model: myProvider.languageModel('chat-model'),
        system: systemPromptData.content,
        messages: [
          ...history,
          {
            role: 'user',
            content: userContent,
            // Only include attachments for image mode (base64 data URL)
            ...(mode === 'image' && finalMessage.experimental_attachments
              ? {
                  experimental_attachments:
                    finalMessage.experimental_attachments,
                }
              : {}),
          },
        ],
        maxSteps: 5,
        experimental_activeTools: activeTools as any,
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools,
        onFinish: async ({ usage }) => {
          // Update token usage
          const delta =
            (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0);
          const total =
            (tokenUsageByConversation.get(conversationId) ?? 0) + delta;
          tokenUsageByConversation.set(conversationId, total);

          // Send token usage update to client
          dataStream.writeData({
            type: 'token-usage',
            content: {
              used: total,
              remaining: Math.max(0, maxTokens - total),
              cap: maxTokens,
              mode,
            },
          });

          console.log('✅ Stream finished, token usage:', {
            delta,
            total,
            cap: maxTokens,
          });
        },
      });

      console.log('📡 Consuming and merging stream...');
      result.consumeStream();
      result.mergeIntoDataStream(dataStream, { sendReasoning: false });
      console.log('✅ Stream merge completed');
    },
    onError: (error) => {
      console.error('❌ DataStream error:', error);
      return 'An error occurred while processing your request.';
    },
  });

  return new Response(stream, { headers });
}
