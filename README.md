# Q&A Chatbot Builder (RAG)

A full-stack application that allows users to create AI-powered chatbots from their own documents. Built with React, Supabase, and OpenAI, featuring hybrid search with BM25 and vector embeddings for accurate question-answering.

## Features

- **User Authentication**: Secure signup/login with Supabase Auth
- **Bot Creation**: Create multiple chatbots with custom branding (colors, avatars, welcome messages)
- **Document Upload**: Upload PDF, DOCX, and TXT files to build your bot's knowledge base
- **Hybrid Search**: Combines BM25 (keyword-based) and vector embeddings (semantic) for optimal retrieval
- **AI-Powered Answers**: Uses GPT-3.5 Turbo to generate contextual responses
- **Embeddable Widget**: Get a simple script to add your chatbot to any website
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Chat**: Interactive chat interface with message history
- **Analytics Ready**: Track queries, response times, and sessions

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- TailwindCSS for styling
- React Router for navigation
- Lucide React for icons

### Backend
- Supabase (PostgreSQL database)
- Supabase Edge Functions (serverless)
- Supabase Storage for document files
- Supabase Auth for authentication

### AI & Search
- OpenAI GPT-3.5 Turbo for answer generation
- OpenAI text-embedding-ada-002 for vector embeddings
- Custom BM25 implementation for keyword search
- Hybrid ranking (60% BM25 + 40% Vector similarity)

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- OpenAI API key

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Project Settings > API and copy your project URL and anon key
3. Update `.env` with your Supabase credentials (already configured)

### 4. Create the database schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables (see supabase/migrations/create_chatbot_schema.sql for full schema)
-- Includes: bots, documents, document_chunks, chat_sessions, chat_messages, bot_analytics
```

You can find the complete SQL schema in the migration file that needs to be run in your Supabase project.

### 5. Set up Storage

In Supabase Dashboard:
1. Go to Storage
2. Create a new bucket called `documents`
3. Set it to private

### 6. Configure OpenAI API Key

In Supabase Dashboard:
1. Go to Project Settings > Edge Functions > Environment Variables
2. Add: `OPENAI_API_KEY` = your OpenAI API key

### 7. Deploy Edge Functions

Deploy the two Edge Functions to Supabase:

```bash
# Note: You'll need to deploy these through the Supabase dashboard or CLI
# Functions are in: supabase/functions/
# - process-document: Processes uploaded documents and creates BM25 indices + embeddings
# - chat-query: Handles chat queries with hybrid BM25+Vector search
```

## Running the Application

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Usage Guide

### 1. Sign Up / Login

- Create an account or sign in at `/login` or `/signup`

### 2. Create a Chatbot

- Click "Create New Bot" on the dashboard
- Configure:
  - Bot name and description
  - Primary color for branding
  - Avatar emoji
  - Welcome message
  - Widget position (bottom-right or bottom-left)

### 3. Upload Documents

- Go to Bot Management page
- Upload PDF, DOCX, or TXT files
- Files are processed automatically:
  - Text extraction
  - Chunking into ~500 token segments
  - BM25 term indexing
  - Vector embedding generation (OpenAI)

### 4. Test Your Bot

- Click "Preview" to test the chatbot
- Ask questions based on your uploaded documents
- The bot uses hybrid search to find relevant context and GPT-3.5 to generate answers

### 5. Embed on Your Website

- Go to the "Embed Code" tab
- Copy the provided script
- Paste it before the closing `</body>` tag on your website
- The chatbot widget will appear automatically

### Example Embed Code

```html
<script src="https://your-domain.com/widget.js"></script>
<script>
  window.ChatbotWidget.init({
    botId: "your-bot-id",
    primaryColor: "#3B82F6",
    position: "bottom-right"
  });
</script>
```

## How It Works

### Document Processing (BM25 Implementation)

1. **Upload**: User uploads a document
2. **Text Extraction**: Raw text is extracted from the file
3. **Chunking**: Text is split into ~500 token chunks with sentence boundaries
4. **BM25 Indexing**:
   - Tokenize text (lowercase, remove punctuation, filter short words)
   - Calculate term frequencies for each chunk
   - Store term frequencies in PostgreSQL JSONB column
5. **Vector Embeddings**: Generate embeddings using OpenAI API
6. **Storage**: Save chunks with both BM25 terms and embeddings

### Chat Query (Hybrid Search)

1. **User asks a question**
2. **BM25 Search**:
   - Tokenize query
   - Calculate BM25 scores for all chunks
   - Rank by relevance (k1=1.5, b=0.75)
3. **Vector Search**:
   - Generate query embedding
   - Calculate cosine similarity with chunk embeddings
   - Rank by similarity
4. **Hybrid Ranking**:
   - Normalize BM25 scores (60% weight)
   - Normalize vector scores (40% weight)
   - Combine and re-rank
   - Take top 5 results
5. **Answer Generation**:
   - Combine relevant chunks as context
   - Send to GPT-3.5 Turbo with prompt
   - Return answer with citations

### BM25 Formula

```
Score(D, Q) = Σ IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))

Where:
- D = document (chunk)
- Q = query
- qi = query term i
- f(qi, D) = term frequency of qi in D
- |D| = length of document D
- avgdl = average document length
- k1 = 1.5 (term frequency saturation parameter)
- b = 0.75 (length normalization parameter)
- IDF(qi) = log((N - n(qi) + 0.5) / (n(qi) + 0.5) + 1)
```

## Project Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── BotCard.tsx
│   │   ├── BotSettings.tsx
│   │   ├── ChatWidget.tsx
│   │   ├── CreateBotModal.tsx
│   │   ├── DocumentUpload.tsx
│   │   └── EmbedCode.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/                 # Utilities
│   │   ├── supabase.ts
│   │   └── database.types.ts
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── BotManage.tsx
│   │   └── BotPreview.tsx
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── functions/           # Edge Functions
│       ├── process-document/  # Document processing with BM25
│       └── chat-query/        # Chat with hybrid search
├── public/
│   └── widget.js            # Embeddable widget script
└── README.md
```

## Database Schema

### Tables

- **bots**: Chatbot configurations
- **documents**: Uploaded files
- **document_chunks**: Text chunks with BM25 terms and embeddings
- **chat_sessions**: Chat sessions for analytics
- **chat_messages**: Individual messages with citations
- **bot_analytics**: Usage statistics

### Key Features

- Row Level Security (RLS) enabled on all tables
- Vector similarity search with pgvector extension
- JSONB for flexible metadata and BM25 terms storage
- Automatic timestamp triggers

## Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Edge Functions environment (configure in Supabase):
```env
OPENAI_API_KEY=your-openai-api-key
```

## API Endpoints

### Edge Functions

#### POST /functions/v1/process-document
Processes an uploaded document
```json
{
  "documentId": "uuid"
}
```

#### POST /functions/v1/chat-query
Handles chat queries
```json
{
  "botId": "uuid",
  "question": "What is...",
  "sessionId": "optional-session-id"
}
```

## Security

- Authentication required for all bot management
- Row Level Security ensures users can only access their own data
- Service role key used only in Edge Functions
- Document storage is private
- Chat sessions use anonymous session tokens

## Performance

- Average query response time: < 3 seconds
- BM25 search: O(n) where n = number of chunks
- Vector search: Optimized with IVFFlat index
- Supports documents up to 500 pages

## Limitations

- Maximum file size: 10MB per document
- Supported formats: PDF, DOCX, TXT
- OpenAI API rate limits apply
- Token limits: 500 tokens per chunk, 500 tokens per response

## Troubleshooting

### Documents not processing
- Check OPENAI_API_KEY is set in Edge Functions environment
- Verify document storage bucket exists and is accessible
- Check Edge Function logs in Supabase Dashboard

### Chat not responding
- Ensure documents are uploaded and processed (status: completed)
- Check bot is set to active
- Verify OpenAI API key has sufficient credits

### Widget not appearing
- Check script URL is correct
- Verify bot ID in embed code
- Ensure bot has at least one processed document

## Future Enhancements

- OCR support for image-based PDFs
- Support for more file formats (Word, Excel, etc.)
- Multi-language support
- Advanced analytics dashboard
- A/B testing for bot responses
- Custom AI model fine-tuning
- Conversation flows and intent detection