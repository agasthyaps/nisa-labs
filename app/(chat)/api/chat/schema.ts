import { z } from 'zod';

const textPartSchema = z.object({
  text: z.string().min(1).max(100000),
  type: z.enum(['text']),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: z.string().min(1).max(100000),
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1).max(100000),
          contentType: z.enum([
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            // Documents
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.ms-powerpoint',
            // Text files
            'text/plain',
            'text/csv',
            'text/markdown',
            'text/html',
            'application/json',
            'application/xml',
            // Code files
            'text/javascript',
            'text/typescript',
            'text/css',
            'application/javascript',
            'application/typescript',
          ]),
        }),
      )
      .optional(),
  }),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning']),
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;

// Mini NISA request schema (embed/iframe chatbot)
export const miniNisaPostRequestBodySchema = z.object({
  conversationId: z.string(),
  mode: z.enum(['general', 'csv', 'image']),
  messages: z.array(
    z.object({
      id: z.string(),
      createdAt: z.union([z.coerce.date(), z.string(), z.number()]).optional(),
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(100000),
      // Allow any part structure from AI SDK
      parts: z.array(z.any()).optional(),
      experimental_attachments: z
        .array(
          z.object({
            url: z.string().min(1), // Allow relative URLs for mini NISA assets
            name: z.string().min(1).max(100000),
            contentType: z.string().min(1),
          }),
        )
        .optional(),
      // Allow additional AI SDK fields
      revisionId: z.string().optional(),
    }),
  ),
});

export type MiniNisaPostRequestBody = z.infer<
  typeof miniNisaPostRequestBodySchema
>;
