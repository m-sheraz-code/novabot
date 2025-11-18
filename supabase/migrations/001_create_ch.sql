/*
  # Q&A Chatbot Builder - Database Schema

  1. New Tables
    - `bots`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Bot display name
      - `description` (text) - Bot description
      - `avatar_url` (text) - Bot avatar image
      - `primary_color` (text) - Widget theme color
      - `welcome_message` (text) - Initial greeting
      - `widget_position` (text) - bottom-right, bottom-left, etc.
      - `is_active` (boolean) - Bot enabled status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `documents`
      - `id` (uuid, primary key)
      - `bot_id` (uuid, references bots)
      - `user_id` (uuid, references auth.users)
      - `filename` (text) - Original filename
      - `file_type` (text) - pdf, docx, txt, etc.
      - `file_size` (bigint) - Size in bytes
      - `storage_path` (text) - Supabase storage path
      - `status` (text) - uploading, processing, completed, failed
      - `processing_error` (text) - Error message if failed
      - `total_chunks` (integer) - Number of text chunks created
      - `created_at` (timestamptz)
      - `processed_at` (timestamptz)

    - `document_chunks`
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documents)
      - `bot_id` (uuid, references bots)
      - `chunk_index` (integer) - Order in document
      - `content` (text) - Chunk text content
      - `token_count` (integer) - Number of tokens
      - `embedding` (vector(1536)) - OpenAI embedding
      - `bm25_terms` (jsonb) - Preprocessed terms for BM25
      - `metadata` (jsonb) - Page number, section, etc.
      - `created_at` (timestamptz)

    - `chat_sessions`
      - `id` (uuid, primary key)
      - `bot_id` (uuid, references bots)
      - `session_token` (text) - Anonymous session identifier
      - `metadata` (jsonb) - User agent, IP hash, etc.
      - `created_at` (timestamptz)
      - `last_active_at` (timestamptz)

    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references chat_sessions)
      - `bot_id` (uuid, references bots)
      - `role` (text) - user or assistant
      - `content` (text) - Message text
      - `citations` (jsonb) - Source document references
      - `response_time_ms` (integer) - Time to generate response
      - `created_at` (timestamptz)

    - `bot_analytics`
      - `id` (uuid, primary key)
      - `bot_id` (uuid, references bots)
      - `date` (date) - Analytics date
      - `total_queries` (integer) - Number of queries
      - `avg_response_time` (integer) - Average response time in ms
      - `unique_sessions` (integer) - Unique chat sessions
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own bots and documents
    - Chat sessions are accessible via bot_id for embed widgets
    - Analytics are private to bot owners
*/

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create bots table
CREATE TABLE IF NOT EXISTS bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  avatar_url text DEFAULT '',
  primary_color text DEFAULT '#5eb8ff',
  welcome_message text DEFAULT 'Hi! How can I help you today?',
  widget_position text DEFAULT 'bottom-right',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  status text DEFAULT 'uploading',
  processing_error text,
  total_chunks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  bot_id uuid REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  token_count integer DEFAULT 0,
  embedding vector(1536),
  bm25_terms jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  bot_id uuid REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  citations jsonb DEFAULT '[]',
  response_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create bot_analytics table
CREATE TABLE IF NOT EXISTS bot_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_queries integer DEFAULT 0,
  avg_response_time integer DEFAULT 0,
  unique_sessions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bot_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_bot_id ON documents(bot_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_bot_id ON document_chunks(bot_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_bot_id ON chat_sessions(bot_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_bot_id ON chat_messages(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_analytics_bot_id ON bot_analytics(bot_id);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bots
CREATE POLICY "Users can view own bots"
  ON bots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bots"
  ON bots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bots"
  ON bots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bots"
  ON bots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for document_chunks (accessible by owner and service role)
CREATE POLICY "Users can view chunks from own bots"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = document_chunks.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all chunks"
  ON document_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for chat_sessions (accessible by service role for widget)
CREATE POLICY "Service role can manage chat sessions"
  ON chat_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view sessions for own bots"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = chat_sessions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Service role can manage chat messages"
  ON chat_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view messages for own bots"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = chat_messages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- RLS Policies for bot_analytics
CREATE POLICY "Users can view analytics for own bots"
  ON bot_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bots
      WHERE bots.id = bot_analytics.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage analytics"
  ON bot_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update bot updated_at timestamp
CREATE OR REPLACE FUNCTION update_bot_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update bot timestamp
CREATE TRIGGER update_bots_timestamp
  BEFORE UPDATE ON bots
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_timestamp();