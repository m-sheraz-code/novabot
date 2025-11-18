# Deployment Guide

This guide walks you through deploying the Q&A Chatbot Builder application to Vercel with Supabase.

## Prerequisites

- Supabase account (free tier works)
- Vercel account (free tier works)
- OpenAI API key with GPT-3.5 Turbo access
- Node.js 18+ installed locally
- Git repository

## Step 1: Set Up Supabase Project

### 1.1 Create Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details and create

### 1.2 Run Database Migration

1. Go to SQL Editor in Supabase Dashboard
2. Copy the contents of `supabase/migrations/001_create_chatbot_schema.sql`
3. Paste and execute in SQL Editor
4. Verify all tables were created successfully

### 1.3 Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Click "Create Bucket"
3. Name: `documents`
4. Set to **Private**
5. Click Create

### 1.4 Set Storage Policies

Run this in SQL Editor to allow authenticated uploads:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role full access
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');
```

### 1.5 Get Supabase Credentials

1. Go to Project Settings > API
2. Copy and save:
   - `Project URL` (VITE_SUPABASE_URL)
   - `anon public key` (VITE_SUPABASE_ANON_KEY)
   - `service_role key` (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Deploy to Vercel

### 2.1 Push to Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Q&A Chatbot Builder"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chatbot-builder.git
git push -u origin main
```

### 2.2 Create Vercel Project

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Select the project and click "Import"

### 2.3 Configure Environment Variables

In Vercel Dashboard, go to Settings > Environment Variables and add:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### 2.4 Deploy

1. In Vercel, click "Deploy"
2. Wait for deployment to complete
3. Your app will be available at `https://your-project.vercel.app`

## Step 3: Configure Frontend Environment

Update `.env` file locally:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Update Widget Configuration

When embedding the widget on your website, use:

```html
<script src="https://your-project.vercel.app/widget.js"></script>
<script>
  window.ChatbotWidget.init({
    botId: "your-bot-id",
    primaryColor: "#5eb8ff",
    position: "bottom-right",
    apiUrl: "https://your-project.vercel.app/api"
  });
</script>
```

## Vercel API Routes

The application uses Vercel serverless functions for backend operations:

### POST /api/process-document
Processes uploaded documents and creates BM25 indices + embeddings

**Request:**
```json
{
  "documentId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "chunks": 10,
  "message": "Document processed successfully"
}
```

### POST /api/chat-query
Handles chat queries with hybrid BM25 + vector search

**Request:**
```json
{
  "botId": "uuid",
  "question": "What is...",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "answer": "Answer text",
  "citations": ["Page 1", "Page 2"],
  "responseTime": 2500
}
```

## Troubleshooting

### Deployment Fails

**Check build logs:**
- Go to Vercel Dashboard > Deployments
- Click failed deployment
- Check the logs for errors

**Common issues:**
- Missing environment variables
- Node.js version mismatch (requires 18+)
- Supabase credentials incorrect

### API Routes Not Working

1. Verify environment variables are set in Vercel
2. Check `/api/process-document` and `/api/chat-query` exist
3. View function logs in Vercel dashboard

### Database Connection Issues

1. Verify Supabase project is running
2. Check `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Verify storage bucket exists and is private

### OpenAI API Errors

1. Check `OPENAI_API_KEY` is correct
2. Verify account has credits
3. Check API rate limits

## Monitoring

### Vercel Dashboard

- View real-time logs: Deployments > Select deployment > Function Logs
- Monitor performance: Analytics tab
- Check environment variables: Settings > Environment Variables

### Supabase Dashboard

- Database queries: Database > Query Performance
- Storage usage: Storage tab
- API requests: Logs tab

## Scaling

### For High Traffic

1. **Upgrade Supabase Plan:** Pro tier ($25/month)
2. **Add Caching:** Implement Redis for frequently asked questions
3. **Optimize Search:** Fine-tune BM25 parameters

### For Large Documents

1. **Increase chunk size:** Adjust `maxTokens` parameter
2. **Batch processing:** Process chunks in parallel
3. **Vector index optimization:** Use `nlist` parameter

## Security Checklist

- [ ] Row Level Security enabled on all tables
- [ ] Storage bucket is private
- [ ] Service role key NOT exposed in frontend
- [ ] OpenAI API key stored securely in environment variables
- [ ] CORS headers properly configured
- [ ] Authentication required for bot management
- [ ] Input validation on all API routes

## Backup

### Database Backup

Supabase automatically backs up your database. To export:

1. Go to Project Settings > Backups
2. Click "Download backup"

### Manual Export

```bash
supabase db pull
```

## Cost Estimation

### Supabase (Free Tier)
- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB/month

### Vercel (Free Tier)
- Deployments: Unlimited
- Bandwidth: 100 GB/month
- Serverless Functions: 1M invocations/month

### OpenAI API
- Embeddings: $0.0001 / 1K tokens
- GPT-3.5 Turbo: $0.0015 / 1K input, $0.002 / 1K output

**Monthly Cost Example:**
- 1,000 queries/month
- Embeddings: ~$0.50
- GPT-3.5: ~$3-5
- Supabase: Free
- Vercel: Free
- **Total: ~$5-6/month**

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Deploy to Vercel
3. Configure custom domain (optional)
4. Set up monitoring and alerts
5. Create additional bots
6. Embed widget on your website
7. Monitor performance and costs

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **OpenAI Docs:** https://platform.openai.com/docs
- **Vercel Support:** https://vercel.com/support