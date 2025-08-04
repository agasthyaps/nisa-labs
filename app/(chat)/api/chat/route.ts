import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { transcribeImage } from '@/lib/ai/image-transcription';
import { detectStudentPII } from '@/lib/ai/student-pii-detection';
import {
  redactStudentPII,
  getRedactionSummary,
} from '@/lib/ai/student-pii-redaction';
import { myProvider } from '@/lib/ai/providers';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import {
  readGoogleSheet,
  writeGoogleSheet,
  addNewDecisionLog,
  readDecisionLog,
  // appendGoogleSheet,
} from '@/lib/ai/tools/google-sheets';
import {
  listKnowledgeBaseFiles,
  readKnowledgeBaseFile,
  reviewNotes,
  updateNotes,
} from '@/lib/ai/tools/google-drive';
import {
  listExpertiseFiles,
  readExpertiseFile,
  searchExpertiseContent,
  getExpertiseOverview,
} from '@/lib/ai/tools/github-expertise';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

// Function to extract name from email
const getNameFromEmail = (email: string | null | undefined): string => {
  if (!email) return 'Coach';
  // Get the part before @
  const beforeAt = email.split('@')[0];
  if (!beforeAt) return 'Coach';
  // Split on '.' and take the first part
  const firstPart = beforeAt.split('.')[0];
  if (!firstPart) return 'Coach';
  // Remove any trailing non-letter characters
  const cleanName = firstPart.replace(/[^a-zA-Z]+$/, '');
  if (!cleanName) return 'Coach';
  // Capitalize first letter
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
};

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    // const messageCount = await getMessageCountByUserId({
    //   id: session.user.id,
    //   differenceInHours: 24,
    // });

    // if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
    //   return new ChatSDKError('rate_limit:chat').toResponse();
    // }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

    // Process attachments: transcribe images, pass other files directly to model
    let messageWithTranscription = message;
    if (
      message.experimental_attachments &&
      message.experimental_attachments.length > 0
    ) {
      const imageAttachments = message.experimental_attachments.filter(
        (attachment) => attachment.contentType?.startsWith('image/'),
      );
      const nonImageAttachments = message.experimental_attachments.filter(
        (attachment) => !attachment.contentType?.startsWith('image/'),
      );

      // Handle image attachments with transcription
      if (imageAttachments.length > 0) {
        try {
          // Process all image attachments
          const transcriptions = await Promise.all(
            imageAttachments.map(async (attachment) => {
              try {
                const transcription = await transcribeImage(attachment.url);
                return transcription;
              } catch (error) {
                console.error(
                  `Failed to transcribe image ${attachment.name}:`,
                  error,
                );
                return null;
              }
            }),
          );

          // Filter out failed transcriptions and combine them
          const validTranscriptions = transcriptions.filter(Boolean);

          if (validTranscriptions.length > 0) {
            const combinedTranscription = validTranscriptions.join('\n\n');
            const transcriptionText = `\n\n[Image content: ${combinedTranscription}]`;

            messageWithTranscription = {
              ...message,
              content: `${message.content}${transcriptionText}`,
              parts: [
                ...message.parts,
                {
                  type: 'text',
                  text: transcriptionText,
                },
              ],
            };

            console.log('✅ Image transcription completed:', {
              imageCount: imageAttachments.length,
              transcriptionLength: combinedTranscription.length,
              finalContent: messageWithTranscription.content,
            });
          }
        } catch (error) {
          console.error('Failed to transcribe images:', error);
        }
      }

      // Handle non-image attachments with PII detection
      if (nonImageAttachments.length > 0) {
        try {
          console.log(
            '🔍 Processing non-image attachments for student PII detection:',
            {
              fileCount: nonImageAttachments.length,
              files: nonImageAttachments.map((att) => ({
                name: att.name,
                type: att.contentType,
              })),
            },
          );

          // Process all non-image attachments for PII
          const piiResults = await Promise.all(
            nonImageAttachments.map(async (attachment) => {
              try {
                const piiResult = await detectStudentPII(attachment.url);
                return { attachment, piiResult };
              } catch (error) {
                console.error(
                  `Failed to detect PII in ${attachment.name}:`,
                  error,
                );
                // For safety, treat as containing PII if detection fails
                return {
                  attachment,
                  piiResult: {
                    pii: true,
                    data: [
                      {
                        pii_type: 'other',
                        text: 'Detection failed - treating as sensitive',
                      },
                    ],
                  },
                };
              }
            }),
          );

          // Process results: separate clean files from PII-containing files
          const cleanAttachments: typeof nonImageAttachments = [];
          const redactedContents: Array<{
            fileName: string;
            content: string;
            summary: string;
          }> = [];
          const piiProcessingResults: Array<{
            fileName: string;
            status: 'clean' | 'redacted';
            summary: string;
          }> = [];

          for (const { attachment, piiResult } of piiResults) {
            if (!piiResult.pii) {
              // No PII detected: keep original file
              cleanAttachments.push(attachment);
              piiProcessingResults.push({
                fileName: attachment.name,
                status: 'clean',
                summary: 'No student information detected',
              });
              console.log(`✅ ${attachment.name}: No student PII detected`);
            } else {
              // PII detected: fetch content and redact
              console.log(
                `🔒 ${attachment.name}: Student PII detected, redacting...`,
              );

              try {
                // Use the original content from PII detection to avoid double fetching
                const originalContent = piiResult.originalContent;

                if (!originalContent) {
                  throw new Error(
                    'Original content not available from PII detection',
                  );
                }

                const redactedContent = redactStudentPII(
                  originalContent,
                  piiResult.data,
                );
                const summary = getRedactionSummary(piiResult.data);

                redactedContents.push({
                  fileName: attachment.name,
                  content: redactedContent,
                  summary,
                });

                piiProcessingResults.push({
                  fileName: attachment.name,
                  status: 'redacted',
                  summary,
                });

                console.log(`🔒 ${attachment.name}: ${summary}`);
              } catch (error) {
                console.error(
                  `Failed to redact content for ${attachment.name}:`,
                  error,
                );
                redactedContents.push({
                  fileName: attachment.name,
                  content: '[Content could not be processed safely]',
                  summary: 'Processing failed - content excluded for safety',
                });

                piiProcessingResults.push({
                  fileName: attachment.name,
                  status: 'redacted',
                  summary: 'Processing failed - content excluded for safety',
                });
              }
            }
          }

          // Store PII processing results for data stream
          (messageWithTranscription as any).piiProcessingResults =
            piiProcessingResults;

          // Update message with clean attachments and redacted content
          if (redactedContents.length > 0) {
            const redactedText = redactedContents
              .map(
                ({ fileName, content }) =>
                  `\n\n[File content (student PII redacted) - ${fileName}:\n${content}]`,
              )
              .join('');

            messageWithTranscription = {
              ...messageWithTranscription,
              content: `${messageWithTranscription.content}${redactedText}`,
              parts: [
                ...messageWithTranscription.parts,
                {
                  type: 'text',
                  text: redactedText,
                },
              ],
              experimental_attachments: [
                ...(messageWithTranscription.experimental_attachments?.filter(
                  (att) =>
                    att.contentType?.startsWith('image/') ||
                    cleanAttachments.some((clean) => clean.url === att.url),
                ) || []),
              ],
            };
          }

          console.log('✅ Student PII detection completed:', {
            totalFiles: nonImageAttachments.length,
            cleanFiles: cleanAttachments.length,
            redactedFiles: redactedContents.length,
          });
        } catch (error) {
          console.error('Failed to process attachments for PII:', error);
          // For safety, remove all non-image attachments if processing fails
          messageWithTranscription = {
            ...messageWithTranscription,
            content: `${messageWithTranscription.content}\n\n[Note: Some files could not be processed safely and were excluded for student privacy protection]`,
            parts: [
              ...messageWithTranscription.parts,
              {
                type: 'text',
                text: '\n\n[Note: Some files could not be processed safely and were excluded for student privacy protection]',
              },
            ],
            experimental_attachments:
              messageWithTranscription.experimental_attachments?.filter((att) =>
                att.contentType?.startsWith('image/'),
              ),
          };
        }
      }
    }

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message: messageWithTranscription,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    // Get current date and time
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Extract user name from email
    const userName = getNameFromEmail(session.user.email);

    // Get user settings for curriculum information
    const { getUserSettings } = await import('@/lib/db/queries');
    const userSettings = await getUserSettings({ userId: session.user.id });

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
      currentDate,
      currentTime,
      timezone,
      userName,
      curriculumEurekaMath: userSettings?.curriculumEurekaMath || false,
      curriculumIllustrativeMath:
        userSettings?.curriculumIllustrativeMath || false,
      curriculumCheckKnowledgeBase:
        userSettings?.curriculumCheckKnowledgeBase || false,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: messageWithTranscription.id,
          role: 'user',
          parts: messageWithTranscription.parts,
          attachments: messageWithTranscription.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createDataStream({
      execute: async (dataStream) => {
        // Send PII processing updates
        const piiResults = (messageWithTranscription as any)
          .piiProcessingResults;
        if (piiResults && piiResults.length > 0) {
          for (const result of piiResults) {
            dataStream.writeData({
              type: 'student-privacy-protection',
              content: {
                fileName: result.fileName,
                status: result.status,
                message:
                  result.status === 'clean'
                    ? `✅ ${result.fileName}: No student information detected`
                    : `🔒 ${result.fileName}: Student information detected and redacted`,
                details: result.summary,
              },
            });
          }
        }

        const systemPromptData = await systemPrompt({
          selectedChatModel,
          requestHints,
          userId: session.user.id,
        });
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPromptData.content,
          messages,
          maxSteps: 5,

          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'readGoogleSheet',
                  'writeGoogleSheet',
                  'addNewDecisionLog',
                  'readDecisionLog',
                  'listKnowledgeBaseFiles',
                  'readKnowledgeBaseFile',
                  'reviewNotes',
                  'updateNotes',
                  'listExpertiseFiles',
                  'readExpertiseFile',
                  'searchExpertiseContent',
                  'getExpertiseOverview',
                  // 'appendGoogleSheet',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
              sessionId: id, // Pass chat ID as session ID
            }),
            readGoogleSheet: readGoogleSheet({ session }),
            writeGoogleSheet: writeGoogleSheet({ session }),
            addNewDecisionLog: addNewDecisionLog({ session }),
            readDecisionLog: readDecisionLog({ session }),
            listKnowledgeBaseFiles: listKnowledgeBaseFiles({ session }),
            readKnowledgeBaseFile: readKnowledgeBaseFile({ session }),
            reviewNotes: reviewNotes({ session }),
            updateNotes: updateNotes({ session }),
            listExpertiseFiles: listExpertiseFiles({ session }),
            readExpertiseFile: readExpertiseFile({ session }),
            searchExpertiseContent: searchExpertiseContent({ session }),
            getExpertiseOverview: getExpertiseOverview({ session }),
            // appendGoogleSheet: appendGoogleSheet({ session }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [messageWithTranscription],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'chat-response',
            metadata: {
              // Session tracking - Vercel AI SDK format for Langfuse
              sessionId: id, // Use chat ID as session ID
              userId: session.user.id,
              // Existing metadata
              ...(systemPromptData.langfusePrompt && {
                langfusePrompt: systemPromptData.langfusePrompt,
              }),
              selectedChatModel,
              chatId: id,
              chat_visibility: selectedVisibilityType,
            },
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat: Chat;

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

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1)?.id;

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
