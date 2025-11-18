# Quick Reference Guide

## Project Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Type Checking
npm run typecheck    # Run TypeScript type checker
npm run lint         # Run ESLint
```

## Important Files to Update

### 1. Environment Variables (.env)
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

### 2. Widget Script (public/widget.js)
Lines 8-9:
```javascript
const supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
const supabaseKey = 'YOUR-ANON-KEY';
```

## Supabase Setup Commands

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR-PROJECT-REF

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-your-key

# Deploy functions
supabase functions deploy process-document
supabase functions deploy chat-query

# List functions
supabase functions list
```

## Database Migration

Copy and run in Supabase SQL Editor:
```
supabase/migrations/001_create_chatbot_schema.sql
```

## Storage Setup

1. Create bucket: `documents` (Private)
2. Run storage policies in SQL Editor (see SETUP.md)

## Key File Locations

### Frontend Components
- `src/pages/Dashboard.tsx` - Main dashboard
- `src/pages/BotManage.tsx` - Bot management
- `src/components/ChatWidget.tsx` - Chat interface
- `src/components/DocumentUpload.tsx` - File upload

### Edge Functions
- `supabase/functions/process-document/index.ts` - Document processing + BM25
- `supabase/functions/chat-query/index.ts` - Query handling + hybrid search

### Configuration
- `src/lib/supabase.ts` - Supabase client
- `src/lib/database.types.ts` - TypeScript types
- `src/contexts/AuthContext.tsx` - Authentication

## Common Issues & Fixes

### Issue: "Cannot read properties of undefined"
**Fix:** Ensure Supabase environment variables are set correctly

### Issue: Documents stuck in "processing"
**Fix:** Check Edge Function logs and OpenAI API key

### Issue: Type errors
**Fix:** Build still works (`npm run build`), safe to ignore for now

### Issue: Widget not appearing
**Fix:** Check bot ID, ensure documents are processed, verify bot is active

## API Endpoints

### Edge Functions (Supabase)
```
POST /functions/v1/process-document
Body: { documentId: "uuid" }

POST /functions/v1/chat-query
Body: {
  botId: "uuid",
  question: "string",
  sessionId: "optional"
}
```

## Database Tables

- **bots** - Bot configurations
- **documents** - Uploaded files
- **document_chunks** - Text chunks with BM25 terms + embeddings
- **chat_sessions** - Chat sessions
- **chat_messages** - Messages with citations
- **bot_analytics** - Usage statistics

## BM25 Parameters

- **k1**: 1.5 (term frequency saturation)
- **b**: 0.75 (length normalization)
- **Chunk size**: ~500 tokens
- **Min term length**: 3 characters

## Hybrid Search Weights

- **BM25**: 60%
- **Vector similarity**: 40%
- **Top results**: 5 chunks

## OpenAI Models

- **Embeddings**: text-embedding-ada-002 (1536 dimensions)
- **Chat**: gpt-3.5-turbo
- **Max tokens**: 500 per response

## Widget Integration

```html
<script src="https://your-domain.com/widget.js"></script>
<script>
  window.ChatbotWidget.init({
    botId: "YOUR-BOT-ID",
    primaryColor: "#3B82F6",
    position: "bottom-right"  // or "bottom-left"
  });
</script>
```

## Testing Flow

1. Sign up / Login
2. Create Bot
3. Upload Document (TXT for quick test)
4. Wait for processing (10-30 seconds)
5. Click "Preview"
6. Ask question
7. Verify response

## Cost Monitoring

### OpenAI API Usage
Check at: https://platform.openai.com/usage

### Supabase Usage
Check at: Project Settings > Usage

## Useful Supabase Queries

### Check documents processing status
```sql
SELECT filename, status, total_chunks, processed_at
FROM documents
ORDER BY created_at DESC;
```

### View chat messages
```sql
SELECT role, content, created_at
FROM chat_messages
ORDER BY created_at DESC
LIMIT 20;
```

### Count chunks per bot
```sql
SELECT bot_id, COUNT(*) as chunk_count
FROM document_chunks
GROUP BY bot_id;
```

## Troubleshooting Commands

```bash
# Check Edge Function logs
# Go to: Supabase Dashboard > Edge Functions > [function-name] > Logs

# Check database connection
# Go to: Supabase Dashboard > Database > Query Performance

# View storage usage
# Go to: Supabase Dashboard > Storage > Usage

# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Production Checklist

- [ ] Environment variables set
- [ ] Database migration run
- [ ] Storage bucket created and configured
- [ ] Edge Functions deployed
- [ ] OpenAI API key configured
- [ ] Widget script updated with production URLs
- [ ] Frontend deployed
- [ ] Test bot created and working
- [ ] Embed code tested on external site

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **React Docs**: https://react.dev
- **TailwindCSS**: https://tailwindcss.com/docs

## Project Structure Quick View

```
src/
├── components/    # React components
├── contexts/      # Context providers
├── lib/           # Utilities
├── pages/         # Page components
├── App.tsx        # Main app
└── main.tsx       # Entry point

supabase/
├── functions/     # Edge Functions
└── migrations/    # Database schema

public/
└── widget.js      # Embeddable widget
```

## Default Bot Settings

- **Color**: #3B82F6 (Blue)
- **Avatar**: 🤖
- **Welcome**: "Hi! How can I help you today?"
- **Position**: bottom-right
- **Status**: Active

## File Upload Limits

- **Max size**: 10MB per file
- **Formats**: PDF, DOCX, TXT
- **Processing**: Automatic after upload
- **Chunks**: ~500 tokens each

## Performance Targets

- **Document processing**: < 30 seconds
- **Query response**: < 3 seconds
- **Build time**: < 10 seconds
- **Page load**: < 2 seconds

## Security Notes

- ✅ RLS enabled on all tables
- ✅ Private document storage
- ✅ JWT authentication
- ✅ Service role keys in backend only
- ✅ Input validation on Edge Functions
- ✅ CORS headers configured

---

For detailed information, see:
- **SETUP.md** - Initial setup
- **README.md** - Full documentation
- **DEPLOYMENT.md** - Production deployment
- **PROJECT_SUMMARY.md** - Technical overview