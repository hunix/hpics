// RAG Helper for retrieving relevant context from documents and analyses
// Supports both semantic vector search and keyword fallback
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EMBEDDING_MODEL = 'text-embedding-3-small';

export interface Citation {
  source: string;
  type: string;
  id: string;
  content: string;
  relevance: number;
}

export interface RAGContext {
  context: string;
  citations: Citation[];
  sourceCount: number;
  searchMethod: 'semantic' | 'keyword' | 'hybrid';
}

export interface RAGOptions {
  maxResults?: number;
  sourceTypes?: ('document' | 'observation' | 'analysis' | 'message' | 'communication')[];
  minRelevance?: number;
  useSemanticSearch?: boolean;
}

/**
 * Generate embedding for a query using the Lovable AI API
 */
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.warn('LOVABLE_API_KEY not configured, falling back to keyword search');
    return null;
  }

  try {
    const response = await fetch('https://api.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: [query],
      }),
    });

    if (!response.ok) {
      console.warn(`Embedding API error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data[0].embedding;
  } catch (error) {
    console.warn('Failed to generate query embedding:', error);
    return null;
  }
}

/**
 * Perform semantic search using vector similarity
 */
async function semanticSearch(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  profileId: string | null,
  queryEmbedding: number[],
  options: { maxResults: number; minRelevance: number; sourceTypes: string[] }
): Promise<Citation[]> {
  const citations: Citation[] = [];

  try {
    // Use the match_documents RPC function
    const { data, error } = await supabase.rpc('match_documents', {
      p_user_id: userId,
      p_query_embedding: `[${queryEmbedding.join(',')}]`,
      p_match_threshold: options.minRelevance,
      p_match_count: options.maxResults,
      p_profile_id: profileId,
      p_source_types: options.sourceTypes.length > 0 ? options.sourceTypes : null,
    });

    if (error) {
      console.warn('Semantic search error:', error);
      return citations;
    }

    if (data) {
      for (const doc of data) {
        citations.push({
          source: doc.content_summary || `${doc.source_type} document`,
          type: doc.source_type,
          id: doc.id,
          content: doc.content?.substring(0, 500) || '',
          relevance: doc.similarity,
        });
      }
    }
  } catch (error) {
    console.warn('Semantic search failed:', error);
  }

  return citations;
}

/**
 * Perform keyword-based search (fallback when embeddings unavailable)
 */
async function keywordSearch(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  profileId: string | null,
  query: string,
  options: { maxResults: number; minRelevance: number; sourceTypes: string[] }
): Promise<Citation[]> {
  const citations: Citation[] = [];
  const promises: Promise<void>[] = [];

  // 1. Document embeddings (stored content)
  if (options.sourceTypes.includes('document')) {
    promises.push(
      (async () => {
        try {
          let q = supabase
            .from('document_embeddings')
            .select('id, source_type, source_id, content, content_summary, profile_id')
            .eq('user_id', userId)
            .limit(30);
          
          if (profileId) q = q.eq('profile_id', profileId);
          
          const { data: docs } = await q;

          if (docs) {
            const queryLower = query.toLowerCase();
            for (const doc of docs) {
              const text = doc.content || '';
              const textLower = text.toLowerCase();
              
              const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 3);
              const matchCount = queryWords.filter((w: string) => textLower.includes(w)).length;
              const relevance = queryWords.length > 0 ? matchCount / queryWords.length : 0;

              if (relevance >= options.minRelevance) {
                citations.push({
                  source: doc.content_summary || `${doc.source_type} document`,
                  type: doc.source_type,
                  id: doc.id,
                  content: text.substring(0, 500),
                  relevance,
                });
              }
            }
          }
        } catch (error) {
          console.warn('Error fetching document embeddings for RAG:', error);
        }
      })()
    );
  }

  // 2. Contact observations (direct query)
  if (options.sourceTypes.includes('observation') && profileId) {
    promises.push(
      (async () => {
        try {
          const { data: observations } = await supabase
            .from('contact_observations')
            .select('id, category, observation_text, ai_validation_status, confidence_level')
            .eq('user_id', userId)
            .eq('profile_id', profileId)
            .limit(30);

          if (observations) {
            const queryLower = query.toLowerCase();
            for (const obs of observations) {
              const text = obs.observation_text || '';
              const textLower = text.toLowerCase();
              
              const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 3);
              const matchCount = queryWords.filter((w: string) => textLower.includes(w)).length;
              const relevance = queryWords.length > 0 ? matchCount / queryWords.length : 0;

              if (relevance >= options.minRelevance || obs.ai_validation_status === 'validated') {
                citations.push({
                  source: `Observation: ${obs.category}`,
                  type: 'observation',
                  id: obs.id,
                  content: text,
                  relevance: Math.max(relevance, (obs.confidence_level || 0) / 100),
                });
              }
            }
          }
        } catch (error) {
          console.warn('Error fetching observations for RAG:', error);
        }
      })()
    );
  }

  // 3. AI analyses
  if (options.sourceTypes.includes('analysis') && profileId) {
    promises.push(
      (async () => {
        try {
          const { data: analyses } = await supabase
            .from('ai_analyses')
            .select('id, analysis_type, result, generated_at')
            .eq('user_id', userId)
            .eq('profile_id', profileId)
            .order('generated_at', { ascending: false })
            .limit(10);

          if (analyses) {
            for (const analysis of analyses) {
              const resultStr = JSON.stringify(analysis.result).substring(0, 800);
              citations.push({
                source: `AI Analysis: ${analysis.analysis_type}`,
                type: 'analysis',
                id: analysis.id,
                content: resultStr,
                relevance: 0.7, // AI analyses are always somewhat relevant
              });
            }
          }
        } catch (error) {
          console.warn('Error fetching analyses for RAG:', error);
        }
      })()
    );
  }

  // 4. Communications
  if (options.sourceTypes.includes('communication') && profileId) {
    promises.push(
      (async () => {
        try {
          const { data: comms } = await supabase
            .from('communications')
            .select('id, channel, subject, content, occurred_at')
            .eq('user_id', userId)
            .eq('profile_id', profileId)
            .order('occurred_at', { ascending: false })
            .limit(20);

          if (comms) {
            const queryLower = query.toLowerCase();
            for (const comm of comms) {
              const text = `${comm.subject || ''} ${comm.content || ''}`;
              const textLower = text.toLowerCase();
              
              const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 3);
              const matchCount = queryWords.filter((w: string) => textLower.includes(w)).length;
              const relevance = queryWords.length > 0 ? matchCount / queryWords.length : 0;

              if (relevance >= options.minRelevance) {
                citations.push({
                  source: `Communication via ${comm.channel}`,
                  type: 'communication',
                  id: comm.id,
                  content: text.substring(0, 400),
                  relevance,
                });
              }
            }
          }
        } catch (error) {
          console.warn('Error fetching communications for RAG:', error);
        }
      })()
    );
  }

  await Promise.all(promises);
  return citations;
}

/**
 * Retrieve relevant context for a query from multiple data sources
 * Uses semantic vector search when available, with keyword fallback
 */
export async function getRAGContext(
  userId: string,
  profileId: string | null,
  query: string,
  options: RAGOptions = {}
): Promise<RAGContext> {
  const {
    maxResults = 15,
    sourceTypes = ['document', 'observation', 'analysis'],
    minRelevance = 0.3,
    useSemanticSearch = true,
  } = options;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let citations: Citation[] = [];
  let searchMethod: 'semantic' | 'keyword' | 'hybrid' = 'keyword';

  // Map source types to database values
  const dbSourceTypes = sourceTypes.map(t => {
    switch (t) {
      case 'document': return 'documents';
      case 'observation': return 'contact_observations';
      case 'message': return 'messages';
      default: return t;
    }
  });

  // Try semantic search first if enabled
  if (useSemanticSearch) {
    const queryEmbedding = await generateQueryEmbedding(query);
    
    if (queryEmbedding) {
      const semanticCitations = await semanticSearch(
        supabase,
        userId,
        profileId,
        queryEmbedding,
        { maxResults, minRelevance, sourceTypes: dbSourceTypes }
      );

      if (semanticCitations.length > 0) {
        citations = semanticCitations;
        searchMethod = 'semantic';
      }
    }
  }

  // Fallback to keyword search if semantic didn't return results
  if (citations.length === 0) {
    citations = await keywordSearch(
      supabase,
      userId,
      profileId,
      query,
      { maxResults: maxResults * 2, minRelevance, sourceTypes }
    );
    searchMethod = 'keyword';
  } else if (citations.length < maxResults / 2) {
    // Hybrid: supplement with keyword results
    const keywordCitations = await keywordSearch(
      supabase,
      userId,
      profileId,
      query,
      { maxResults: maxResults - citations.length, minRelevance, sourceTypes }
    );
    
    // Merge and deduplicate
    const existingIds = new Set(citations.map(c => c.id));
    for (const kc of keywordCitations) {
      if (!existingIds.has(kc.id)) {
        citations.push(kc);
      }
    }
    searchMethod = 'hybrid';
  }

  // Sort by relevance and limit
  const sortedCitations = citations
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);

  // Build context string
  const contextParts: string[] = [];
  for (let i = 0; i < sortedCitations.length; i++) {
    const citation = sortedCitations[i];
    contextParts.push(`[Source ${i + 1}] ${citation.source}:\n${citation.content}\n`);
  }

  return {
    context: contextParts.join('\n---\n'),
    citations: sortedCitations,
    sourceCount: sortedCitations.length,
    searchMethod,
  };
}

/**
 * Extract citation references from AI response
 */
export function extractCitationReferences(
  text: string,
  citations: Citation[]
): { text: string; usedCitations: Citation[] } {
  const usedCitations: Citation[] = [];
  const citationPattern = /\[Source (\d+)\]/g;
  
  let match;
  while ((match = citationPattern.exec(text)) !== null) {
    const idx = parseInt(match[1], 10) - 1;
    if (idx >= 0 && idx < citations.length && !usedCitations.includes(citations[idx])) {
      usedCitations.push(citations[idx]);
    }
  }

  return { text, usedCitations };
}
