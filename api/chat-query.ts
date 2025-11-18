import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const openaiKey = process.env.OPENAI_API_KEY || '';

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

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function generateAnswer(context: string, question: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions based on the provided context. If the answer is not in the context, say so politely.',
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
        .filter((chunk: any) => chunk.embedding)
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

      const allChunks = [...bm25Results.map(r => r.chunk), ...vectorResults.map(r => r.chunk)];
      const uniqueChunks = Array.from(new Map(allChunks.map(c => [c.id, c])).values());

      finalResults = uniqueChunks
        .map(chunk => ({
          chunk,
          score: hybridScores.get(chunk.id) || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Vector search failed, using BM25 only:', error);
    }

    const context = finalResults.map(r => r.chunk.content).join('\n\n');
    const answer = await generateAnswer(context, question);

    const citations = finalResults.map(r => {
      const page = r.chunk.metadata?.page || 1;
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
        {
          session_id: sessionRecord.data.id,
          bot_id: botId,
          role: 'user',
          content: question,
          response_time_ms: 0,
        },
        {
          session_id: sessionRecord.data.id,
          bot_id: botId,
          role: 'assistant',
          content: answer,
          citations: citations,
          response_time_ms: Date.now() - startTime,
        },
      ] as any);

      await supabase
        .from('chat_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', sessionRecord.data.id);
    }

    return res.status(200).json({
      answer,
      citations,
      responseTime: Date.now() - startTime,
    });
  } catch (error: any) {
      console.error('Query error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    return res.status(500).json({
      error: error.message || 'Failed to process query',
      answer: 'I apologize, but I encountered an error processing your question. Please try again.',
    });
  }
}