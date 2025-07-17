-- Enable pgvector extension for semantic search capabilities
CREATE EXTENSION IF NOT EXISTS vector;

-- Note: Mastra will automatically create its required tables:
-- mastra_threads, mastra_messages, mastra_resources, etc.
-- when the Memory instance is first initialized 