# Quick Setup Guide

Get your Q&A Chatbot Builder up and running in 15 minutes.

## Prerequisites

- Node.js 18 or higher
- A Supabase account (sign up at https://supabase.com)
- An OpenAI API key (from https://platform.openai.com)

## Step 1: Database Setup (5 minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Name: `chatbot-builder`
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait for project to finish setting up (~2 minutes)

### 2. Run Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_create_chatbot_schema.sql`
4. Paste into SQL Editor and click **Run**
5. You should see "Success. No rows returned"

### 3. Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **New Bucket**
3. Name: `documents`
4. **Important:** Make it **Private** (uncheck "Public bucket")
5. Click **Create Bucket**

### 4. Set Storage Policies

1. Still in **Storage**, click on the `documents` bucket
2. Go to **Policies** tab
3. Copy and run this SQL in **SQL Editor**:

```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');
```

## Step 2: Vercel Setup (5 minutes)

### 1. Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chatbot-builder.git
git push -u origin main
```

### 2. Create Vercel Project

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Click "Import"

### 3. Set Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-api-key
```

Get credentials from:
- Supabase: Project Settings > API
- OpenAI: https://platform.openai.com/api-keys

### 4. Deploy

Click "Deploy" in Vercel. Your app will be live at `https://your-project.vercel.app`

## Step 3: Frontend Setup (3 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Your `.env` file should already have your Supabase credentials. Verify they're correct:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: **Project Settings** > **API**

### 3. Update Widget Script

Edit `public/widget.js` and replace lines 8-9 with your Supabase details:

```javascript
const supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
const supabaseKey = 'YOUR-ANON-KEY';
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Step 4: First Test (2 minutes)

### 1. Create Account

1. Go to http://localhost:5173
2. Click "Sign up"
3. Enter email and password (min 6 characters)
4. You'll be logged in automatically

### 2. Create Your First Bot

1. Click **Create New Bot**
2. Fill in:
   - Name: "Test Bot"
   - Choose a color
   - Select an avatar emoji
   - Leave other settings as default
3. Click **Create Bot**

### 3. Upload a Document

1. Click **Manage** on your new bot
2. In the **Documents** tab, click or drag a file
3. For testing, create a simple text file:

```
Test Document

This is a test document for the chatbot.
The chatbot can answer questions about this content.
It uses AI to understand and respond to user queries.
```

4. Upload the file
5. Wait for processing (should take 10-30 seconds)

### 4. Test the Chat

1. Click **Preview**
2. Click the chat widget in the bottom-right
3. Ask: "What is this document about?"
4. You should get an AI-generated response!

## Common Issues

### "Failed to process document"

- Check your OpenAI API key is set correctly:
  ```bash
  supabase secrets list
  ```
- Verify you have credits in your OpenAI account
- Check Edge Function logs:
  - Go to **Edge Functions** > **process-document** > **Logs**

### "Document stuck in processing"

- Check the Edge Function logs for errors
- Try uploading a simpler TXT file first
- Ensure storage bucket is set to private

### "Cannot upload document"

- Verify storage policies are set (Step 1.4)
- Check you're logged in
- Try refreshing the page

### Widget doesn't appear in preview

- Check browser console for errors
- Verify bot has at least one completed document
- Refresh the preview page

## Next Steps

Once everything is working:

1. **Add more documents**: Upload PDFs, DOCX files
2. **Customize your bot**: Change colors, avatar, welcome message
3. **Get embed code**: Go to Embed Code tab and copy the script
4. **Deploy to production**: See DEPLOYMENT.md for full deployment guide

## Getting Help

- Check the README.md for detailed documentation
- Review DEPLOYMENT.md for production setup
- Check Supabase docs: https://supabase.com/docs
- OpenAI docs: https://platform.openai.com/docs

## Architecture Overview

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐   ┌──────▼────────┐
│  Supabase   │   │   OpenAI API  │
│  Database   │   │   GPT-3.5 +   │
│  + Storage  │   │   Embeddings  │
└──────┬──────┘   └───────────────┘
       │
┌──────▼───────────┐
│  Edge Functions  │
│  - BM25 Search   │
│  - Vector Search │
│  - RAG Pipeline  │
└──────────────────┘
```

## Key Features You Built

✅ **User Authentication** - Secure signup/login with Supabase Auth
✅ **Bot Management** - Create, edit, delete chatbots
✅ **Document Processing** - Upload and parse PDFs, DOCX, TXT
✅ **BM25 Search** - Keyword-based retrieval (COMPULSORY requirement)
✅ **Vector Search** - Semantic similarity with embeddings
✅ **Hybrid Ranking** - Combines BM25 + Vector scores
✅ **AI Responses** - GPT-3.5 Turbo generates answers
✅ **Embeddable Widget** - Copy-paste script for any website
✅ **Chat History** - Stores conversations and analytics
✅ **Responsive Design** - Works on mobile and desktop

## Technology Stack

- **Frontend**: React + TypeScript + TailwindCSS + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Search**: Custom BM25 implementation + pgvector
- **AI**: OpenAI GPT-3.5 Turbo + text-embedding-ada-002
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth

Congratulations! You now have a fully functional RAG-based chatbot builder! 🎉