# Langfuse Integration Setup

This project now uses Langfuse for **full LLM observability and tracing** with dynamic prompt management.

## Environment Variables

Add these environment variables to your `.env.local` or deployment environment:

```bash
LANGFUSE_SECRET_KEY=your_langfuse_secret_key_here
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key_here
LANGFUSE_HOST=https://us.cloud.langfuse.com
```

## Required Prompts in Langfuse

**IMPORTANT**: Create these prompts in your Langfuse dashboard with these exact names:

1. **artifactsPrompt** - Used for artifact generation instructions
2. **regularPrompt** - Main system prompt for the AI assistant  
3. **codePrompt** - Instructions for code generation
4. **sheetPrompt** - Instructions for spreadsheet generation
5. **textPrompt** - Instructions for text document generation
6. **lookForSummaryPrompt** - Instructions for generating weekly look-for summaries

### How to Create Prompts in Langfuse:
1. Go to your Langfuse dashboard
2. Navigate to "Prompts" section
3. Click "Create Prompt"
4. Set the **name** exactly as listed above (case-sensitive)
5. Copy the content from your current `lib/ai/prompts.ts` file
6. Save as "production" version

**"Invalid authorization header" usually means the prompts don't exist yet, not that your credentials are wrong.**

## How It Works

- **🔍 Full Tracing**: Every LLM call is traced in Langfuse for observability
- **📝 Dynamic Prompts**: Prompts are fetched from Langfuse and linked to traces
- **⚡ Smart Fallbacks**: If Langfuse is unavailable, uses cached → hardcoded prompts
- **🚀 Zero Downtime**: Your app works perfectly even without Langfuse setup
- **📊 Rich Metadata**: Tracks model, user, chat ID, and prompt version in traces
- **🗂️ Session Tracking**: Groups related traces by conversation/chat for easy analysis

## What's Integrated

✅ **Main Chat Route**: Full tracing with prompt linking  
✅ **Summary Generation**: Traced with prompt metadata  
✅ **Artifact Creation**: Dynamic prompts (text, code, sheets)  
✅ **OpenTelemetry Setup**: Proper Next.js instrumentation  
✅ **Session Tracking**: All traces grouped by conversation thread  
✅ **AI Tools**: Request suggestions and image transcription include session context  

## Session Tracking

**How Sessions Work:**
- Each chat conversation creates a unique session in Langfuse
- All traces within the same chat are grouped under one session ID
- Session ID = Chat ID (UUID from your database)
- User ID is automatically tracked for each session

**What Gets Tracked:**
- Main chat completions with full context
- AI tool calls (document suggestions, image transcription)
- User information and chat metadata
- Model selection and visibility settings

**In Langfuse Dashboard:**
- Navigate to "Sessions" to see all conversation threads
- Click any session to see the full conversation replay
- Filter sessions by user, date, or metadata
- View session-level analytics and costs

## Migration Notes

- All LLM calls now include `experimental_telemetry` for tracing
- Prompts return `{ content, langfusePrompt }` instead of just strings
- Langfuse prompts are automatically linked to traces when available

## Testing

You can test the integration with:
```bash
npx tsx test-langfuse.ts
```

**Expected behavior:**
- **Without credentials**: Shows "Invalid authorization header" errors but uses fallback prompts ✅
- **With credentials but no prompts**: Shows empty prompt warnings but uses fallbacks ✅  
- **With credentials and prompts**: Shows successful fetches with character counts ✅

**Testing Session Tracking:**
1. **Start a new chat** in your application
2. **Send multiple messages** in the same conversation
3. **Use AI tools** like document suggestions or image uploads
4. **Check Langfuse Dashboard**:
   - Go to "Sessions" tab
   - Find your conversation (by timestamp/user)
   - Verify all traces are grouped under one session
   - Session ID should match your chat UUID

**What to Look For:**
- ✅ All traces have the same `session_id` (your chat UUID) in the Sessions tab
- ✅ User ID is consistent across all traces  
- ✅ Metadata includes model, chat visibility, and other context
- ✅ AI tool calls (suggestions, transcription) are linked to the session

**Important Note:**
- Session tracking uses Vercel AI SDK format: `sessionId` and `userId` in `experimental_telemetry.metadata`
- These are automatically mapped to Langfuse sessions and user tracking
- Sessions should appear in the "Sessions" tab in Langfuse dashboard

The system gracefully degrades - your app will work regardless of Langfuse configuration! 