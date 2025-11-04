import { z } from 'zod';
import { CONVERSATION_MODES } from '@/lib/chat/conversation-mode';

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['text']),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: z.string().min(1).max(2000),
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1).max(2000),
          contentType: z.enum([
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            // Documents
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.ms-powerpoint',
            // Text files
            'text/plain', 'text/csv', 'text/markdown', 'text/html',
            'application/json', 'application/xml',
            // Code files
            'text/javascript', 'text/typescript', 'text/css',
            'application/javascript', 'application/typescript',
          ]),
        }),
      )
      .optional(),
  }),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning']),
  selectedVisibilityType: z.enum(['public', 'private']),
  conversationMode: z.enum(CONVERSATION_MODES).optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
