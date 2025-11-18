import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const openaiKey = process.env.OPENAI_API_KEY || '';

interface BM25Document {
  id: string;
  content: string;
  termFrequencies: Map<string, number>;
  length: number;
}

class BM25 {
  private documents: BM25Document[] = [];
  private avgDocLength = 0;
  private idf: Map<string, number> = new Map();
  private k1 = 1.5;
  private b = 0.75;

  addDocuments(docs: Array<{ id: string; content: string }>) {
    this.documents = docs.map(doc => this.processDocument(doc));
    this.avgDocLength = this.documents.reduce((sum, doc) => sum + doc.length, 0) / this.documents.length;
    this.calculateIDF();
  }

  private processDocument(doc: { id: string; content: string }): BM25Document {
    const terms = this.tokenize(doc.content);
    const termFrequencies = new Map<string, number>();

    terms.forEach(term => {
      termFrequencies.set(term, (termFrequencies.get(term) || 0) + 1);
    });

    return {
      id: doc.id,
      content: doc.content,
      termFrequencies,
      length: terms.length,
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }

  private calculateIDF() {
    const docCount = this.documents.length;
    const termDocCount = new Map<string, number>();

    this.documents.forEach(doc => {
      const uniqueTerms = new Set(doc.termFrequencies.keys());
      uniqueTerms.forEach(term => {
        termDocCount.set(term, (termDocCount.get(term) || 0) + 1);
      });
    });

    termDocCount.forEach((count, term) => {
      this.idf.set(term, Math.log((docCount - count + 0.5) / (count + 0.5) + 1));
    });
  }

  getTermsForStorage(content: string): Record<string, number> {
    const terms = this.tokenize(content);
    const termFrequencies: Record<string, number> = {};
    terms.forEach(term => {
      termFrequencies[term] = (termFrequencies[term] || 0) + 1;
    });
    return termFrequencies;
  }
}

function chunkText(text: string, maxTokens = 500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = sentence.split(/\s+/).length;

    if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentTokens = sentenceTokens;
    } else {
      currentChunk += ' ' + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { data: fileData, error: storageError } = await supabase.storage
      .from('documents')
      .download(document.storage_path);

    if (storageError || !fileData) {
      throw new Error('Failed to download document');
    }

    let textContent = '';

    if (document.file_type === 'txt') {
      textContent = await fileData.text();
    } else if (document.file_type === 'pdf' || document.file_type === 'docx') {
      textContent = await fileData.text();
    } else {
      throw new Error('Unsupported file type');
    }

    const chunks = chunkText(textContent);
    const bm25 = new BM25();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const tokenCount = chunk.split(/\s+/).length;
      const bm25Terms = bm25.getTermsForStorage(chunk);

      let embedding: number[] | null = null;
      try {
        embedding = await generateEmbedding(chunk);
      } catch (error) {
        console.error('Failed to generate embedding:', error);
      }

      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          bot_id: document.bot_id,
          chunk_index: i,
          content: chunk,
          token_count: tokenCount,
          embedding: embedding,
          bm25_terms: bm25Terms,
          metadata: { page: Math.floor(i / 5) + 1 },
        } as any);

      if (insertError) {
        console.error('Failed to insert chunk:', insertError);
      }
    }

    await supabase
      .from('documents')
      .update({
        status: 'completed',
        total_chunks: chunks.length,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    return res.status(200).json({
      success: true,
      chunks: chunks.length,
      message: 'Document processed successfully',
    });
  } catch (error: any) {
    console.error('Processing error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process document',
    });
  }
}