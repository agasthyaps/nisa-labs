# Level 1 Memory Implementation - Coach Memory

## Overview
This implementation adds persistent, cross-chat memory for coaches using Mastra's memory system with PostgreSQL and pgvector.

## What's Been Implemented

### 1. **Memory Configuration** (`lib/ai/memory/coach-memory.ts`)
- Resource-scoped working memory that persists across all coach conversations
- Structured schema for coach profiles including:
  - Coach name and email
  - List of teachers with quick summaries
  - Current focus areas
  - Thinking patterns across conversations
  - Internal AI suggestions
  - School context

### 2. **Agent Wrapper** (`lib/ai/agents/coach-agent.ts`)
- Integrates Mastra Agent with existing tools
- Handles memory context automatically
- Maintains compatibility with existing tool system

### 3. **Chat Route Integration** (`app/(chat)/api/chat/route.ts`)
- Creates unique `resourceId` from user ID for coach persistence
- Uses chat ID as thread ID for conversation tracking
- Seamlessly switches between Mastra agent (with memory) and reasoning model

### 4. **System Prompt Updates** (`lib/ai/prompts.ts`)
- Added memory awareness instructions
- Guides natural use of remembered information
- Prevents excessive memory references

### 5. **Database Migration** (`lib/db/migrations/0008_pgvector_extension.sql`)
- Enables pgvector extension for semantic search
- Mastra automatically creates required tables on first use

## How It Works

1. **Coach Identification**: Each coach is identified by `coach-${userId}` as their resourceId
2. **Automatic Memory Updates**: The AI automatically updates the coach profile schema as conversations progress
3. **Cross-Chat Persistence**: Information learned in one chat is available in all future chats
4. **Semantic Recall**: Can search and retrieve relevant past conversations automatically

## Testing the Implementation

1. **Start a conversation** as a coach
2. **Introduce yourself** and mention some teachers you work with
3. **Start a new chat** (different chat ID)
4. **Ask the AI** what it knows about you - it should remember!

## Key Features

✓ **Zero Manual Management**: Memory updates happen automatically
✓ **Structured Data**: Coach profile follows a consistent schema
✓ **Privacy by Design**: Each coach's memory is completely isolated
✓ **Semantic Search**: AI can recall relevant past conversations
✓ **Performance Optimized**: Only loads relevant context

## Environment Variables Required

```env
POSTGRES_URL=your-vercel-postgres-url  # or DATABASE_URL
OPENAI_API_KEY=your-openai-key
```

## Next Steps for Level 2

Level 2 will add detailed teacher memories with:
- Separate database table for teacher records
- More detailed tracking per teacher
- Custom memory processor for teacher context injection
- API endpoints for manual teacher memory management

## Troubleshooting

1. **pgvector not found**: Ensure your Postgres instance supports pgvector (Vercel Postgres does)
2. **Memory not persisting**: Check that resourceId is being passed correctly
3. **Connection errors**: Verify POSTGRES_URL is set correctly 