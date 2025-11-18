import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

interface DocumentChunk {
  id: string;
  content: string;
  bm25_terms: Record<string, number>;
  metadata: any;
  embedding: number[] | null;
}

class BM25Scorer {
  private k1 = 1.5;
  private b = 0.75;

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }

  score(query: string, chunks: DocumentChunk[]): Array<{ chunk: DocumentChunk; score: number }> {
    const queryTerms = this.tokenize(query);
    const avgDocLength = chunks.reduce((sum, chunk) => {
      const terms = Object.values(chunk.bm25_terms);
      return sum + terms.reduce((a, b) => a + b, 0);
    }, 0) / chunks.length;

    const docFreq = new Map<string, number>();
    chunks.forEach(chunk => {
      const uniqueTerms = new Set(Object.keys(chunk.bm25_terms));
      uniqueTerms.forEach(term => {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      });
    });

    const idf = new Map<string, number>();
    docFreq.forEach((count, term) => {
      idf.set(term, Math.log((chunks.length - count + 0.5) / (count + 0.5) + 1));
    });

    const scores = chunks.map(chunk => {
      const docLength = Object.values(chunk.bm25_terms).reduce((a, b) => a + b, 0);
      const score = queryTerms.reduce((sum, term) => {
        const termFreq = chunk.bm25_terms[term] || 0;
        const idfValue = idf.get(term) || 0;
        const numerator = termFreq * (this.k1 + 1);
        const denominator = termFreq + this.k1 * (1 - this.b + this.b * (docLength / avgDocLength));
        return sum + (idfValue * numerator) / denominator;
      }, 0);

      return { chunk, score };
    });

    return scores.sort((a, b) => b.score - a.score);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ========== GEMINI EMBEDDING ==========
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          parts: [
            { text }
          ]
        },
        // optionally choose output_dimensionality like 768 or 3072
        // output_dimensionality: 768
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Embedding API error: ${response.statusText} – ${err}`);
  }

  const data = await response.json();
  // The response structure from Google embedding API has 'embeddings'
  // According to docs. :contentReference[oaicite:1]{index=1}
  return data.embeddings?.[0]?.value || [];
}

// ========== GEMINI GENERATION ==========
async function generateAnswer(context: string, question: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateText?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
        temperature: 0.7,
        // max_output_tokens depends on Gemini API limits; choose something reasonable
        max_output_tokens: 512
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Generation API error: ${response.statusText} – ${err}`);
  }

  const data = await response.json();
  // The Gemini generation API returns `candidates` with `content`. 
  // The exact field names might vary; check the API response by logging `data`.
  return data.candidates?.[0]?.content || "No answer generated.";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { botId, question, sessionId } = req.body;
    if (!botId || !question) {
      return res.status(400).json({ error: 'botId and question are required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('bot_id', botId);

    if (chunksError || !chunks || chunks.length === 0) {
      return res.status(200).json({
        answer: "I don't have any documents to answer from yet. Please upload some documents first.",
        citations: [],
      });
    }

    const bm25Scorer = new BM25Scorer();
    const bm25Results = bm25Scorer.score(question, chunks as DocumentChunk[]);
    let finalResults = bm25Results.slice(0, 5);

    try {
      const queryEmbedding = await generateEmbedding(question);

      const vectorResults = chunks
        .filter((chunk: any) => Array.isArray(chunk.embedding))
        .map((chunk: any) => ({
          chunk,
          score: cosineSimilarity(queryEmbedding, chunk.embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const hybridScores = new Map<string, number>();
      bm25Results.forEach((result, index) => {
        const bm25Score = (bm25Results.length - index) / bm25Results.length;
        hybridScores.set(result.chunk.id, bm25Score * 0.6);
      });
      vectorResults.forEach((result, index) => {
        const vectorScore = (vectorResults.length - index) / vectorResults.length;
        const currentScore = hybridScores.get(result.chunk.id) || 0;
        hybridScores.set(result.chunk.id, currentScore + vectorScore * 0.4);
      });

      const all = [...bm25Results.map(r => r.chunk), ...vectorResults.map(r => r.chunk)];
      const uniq = Array.from(new Map(all.map(c => [c.id, c])).values());
      finalResults = uniq
        .map(chunk => ({ chunk, score: hybridScores.get(chunk.id) || 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (err) {
      console.error('Vector search failed, using BM25 only:', err);
    }

    const context = finalResults.map(r => r.chunk.content).join('\n\n');
    const answer = await generateAnswer(context, question);

    const citations = finalResults.map(r => {
      const page = r.chunk.metadata?.page ?? 1;
      return `Page ${page}`;
    });

    let session = sessionId;
    if (!session) {
      session = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    let sessionRecord = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('bot_id', botId)
      .eq('session_token', session)
      .maybeSingle();

    if (!sessionRecord.data) {
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({
          bot_id: botId,
          session_token: session,
          metadata: {},
        } as any)
        .select()
        .single();
      sessionRecord.data = newSession;
    }

    if (sessionRecord.data) {
      await supabase.from('chat_messages').insert([
        { session_id: sessionRecord.data.id, bot_id: botId, role: 'user', content: question, response_time_ms: 0 },
        { session_id: sessionRecord.data.id, bot_id: botId, role: 'assistant', content: answer, citations, response_time_ms: Date.now() - startTime },
      ] as any);
      await supabase
        .from('chat_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', sessionRecord.data.id);
    }

    return res.status(200).json({ answer, citations, responseTime: Date.now() - startTime });
  } catch (error: any) {
    console.error('Query error details:', { message: error.message, stack: error.stack });
    return res.status(500).json({
      error: error.message,
      answer: 'Sorry, something went wrong. Please try again.',
    });
  }
}
