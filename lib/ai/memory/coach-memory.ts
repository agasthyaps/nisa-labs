import { Memory } from '@mastra/memory';
import { PostgresStore, PgVector } from '@mastra/pg';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

// Coach profile schema - persists across all chats
export const coachProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  teachers: z
    .array(
      z.object({
        name: z.string(),
        quickSummary: z
          .string()
          .describe('Brief overview of what this teacher is working on'),
        lastInteraction: z
          .string()
          .optional()
          .describe('Date of last coaching interaction'),
      }),
    )
    .default([]),
  currentFocus: z
    .string()
    .describe('What the coach is currently focusing on across their work'),
  thinkingAbout: z
    .string()
    .describe(
      'Summary of patterns and themes across recent coaching conversations',
    ),
  internalSuggestion: z
    .string()
    .describe(
      "AI's internal note about what might be helpful to suggest next based on noticed trends",
    ),
  schoolContext: z
    .object({
      name: z.string().default('Summer School in the Bronx'),
      model: z.string().default('313 model'),
      notes: z.string().optional(),
    })
    .optional(),
});

// Type for the coach profile
export type CoachProfile = z.infer<typeof coachProfileSchema>;

// Get the connection string with proper error handling
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'POSTGRES_URL or DATABASE_URL environment variable is required',
  );
}

const pgConfig: any = {
  connectionString,
};

// For local development, allow self-signed SSL certificates.
// Vercel Postgres and other hosted providers use trusted certificates.
if (process.env.NODE_ENV !== 'production') {
  pgConfig.ssl = {
    rejectUnauthorized: false,
  };
}

// Initialize memory with resource-scoped working memory
export const coachMemory = new Memory({
  storage: new PostgresStore(pgConfig),
  vector: new PgVector(pgConfig),
  embedder: openai.embedding('text-embedding-3-small'),
  options: {
    lastMessages: 10, // Keep last 10 messages from current chat
    workingMemory: {
      enabled: true,
      scope: 'resource', // Persists across all coach's chats
      schema: coachProfileSchema,
    },
    semanticRecall: {
      topK: 3,
      messageRange: 2,
      scope: 'resource', // Can recall from any of the coach's past conversations
    },
  },
});
