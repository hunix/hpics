// RAG Helper for retrieving relevant context from documents and analyses
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
}

export interface RAGOptions {
  maxResults?: number;
  sourceTypes?: ('document' | 'observation' | 'analysis' | 'message' | 'communication')[];
  minRelevance?: number;
}

/**
 * Retrieve relevant context for a query from multiple data sources
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
  } = options;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const citations: Citation[] = [];
  const contextParts: string[] = [];

  // Query each source type in parallel
  const promises: Promise<void>[] = [];

  // 1. Document embeddings (via RPC if available)
  if (sourceTypes.includes('document')) {
    promises.push(
      (async () => {
        try {
          const { data: docs } = await supabase
            .from('documents')
            .select('id, name, document_type, extracted_text, ai_metadata')
            .eq('user_id', userId)
            .not('extracted_text', 'is', null)
            .limit(20);

          if (docs) {
            const queryLower = query.toLowerCase();
            for (const doc of docs) {
              const text = doc.extracted_text || '';
              const textLower = text.toLowerCase();
              
              // Simple keyword matching for relevance
              const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
              const matchCount = queryWords.filter(w => textLower.includes(w)).length;
              const relevance = queryWords.length > 0 ? matchCount / queryWords.length : 0;

              if (relevance >= minRelevance) {
                citations.push({
                  source: doc.name,
                  type: 'document',
                  id: doc.id,
                  content: text.substring(0, 500),
                  relevance,
                });
              }
            }
          }
        } catch (error) {
          console.warn('Error fetching documents for RAG:', error);
        }
      })()
    );
  }

  // 2. Contact observations
  if (sourceTypes.includes('observation') && profileId) {
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
              
              const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
              const matchCount = queryWords.filter(w => textLower.includes(w)).length;
              const relevance = queryWords.length > 0 ? matchCount / queryWords.length : 0;

              if (relevance >= minRelevance || obs.ai_validation_status === 'validated') {
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
  if (sourceTypes.includes('analysis') && profileId) {
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
  if (sourceTypes.includes('communication') && profileId) {
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
              
              const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
              const matchCount = queryWords.filter(w => textLower.includes(w)).length;
              const relevance = queryWords.length > 0 ? matchCount / queryWords.length : 0;

              if (relevance >= minRelevance) {
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

  // Wait for all queries
  await Promise.all(promises);

  // Sort by relevance and limit
  const sortedCitations = citations
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);

  // Build context string
  for (let i = 0; i < sortedCitations.length; i++) {
    const citation = sortedCitations[i];
    contextParts.push(`[Source ${i + 1}] ${citation.source}:\n${citation.content}\n`);
  }

  return {
    context: contextParts.join('\n---\n'),
    citations: sortedCitations,
    sourceCount: sortedCitations.length,
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
