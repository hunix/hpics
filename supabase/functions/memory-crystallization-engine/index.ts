/**
 * Memory Crystallization Engine (A-Mem Pattern)
 * Self-organizing knowledge network with bidirectional linking
 * and automatic reconsolidation.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MemoryTier = 'core' | 'episodic' | 'semantic' | 'procedural' | 'resource';
type MemoryOperation = 'ingest' | 'query' | 'reconsolidate' | 'decay' | 'merge' | 'link';

interface CrystallizationRequest {
  userId?: string;
  user_id?: string;
  profileId?: string;
  profile_id?: string;
  operation: MemoryOperation;
  payload: {
    content?: string;
    tier?: MemoryTier;
    memoryType?: string;
    memory_type?: string;
    keywords?: string[];
    tags?: string[];
    sourceType?: string;
    source_type?: string;
    sourceId?: string;
    source_id?: string;
    queryText?: string;
    query_text?: string;
    memoryIds?: string[];
    memory_ids?: string[];
    limit?: number;
  };
}

interface MemoryNode {
  id: string;
  content: string;
  tier: MemoryTier;
  keywords: string[];
  confidence_score: number;
}

interface LinkSuggestion {
  target_id: string;
  link_type: 'supports' | 'contradicts' | 'extends' | 'refines' | 'causes' | 'correlates';
  strength: number;
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'memory-crystallization-engine', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json() as CrystallizationRequest;
    const userId = body.userId || body.user_id;
    const profileId = body.profileId || body.profile_id;
    const operation = body.operation;
    const payload = body.payload || {};

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load configuration from database
    const { data: configs } = await supabase
      .from('memory_crystallization_config')
      .select('config_key, config_value')
      .eq('is_active', true);

    const configMap = new Map(configs?.map(c => [c.config_key, c.config_value]) || []);
    const tierWeights = (configMap.get('tier_weights') || {}) as Record<string, number>;
    const decayThresholds = (configMap.get('decay_thresholds') || {}) as { archive_below?: number; stale_after_days?: number };
    const linkCreation = (configMap.get('link_creation') || {}) as { min_similarity?: number; max_links_per_memory?: number };
    const reconsolidationConfig = (configMap.get('reconsolidation') || {}) as { on_contradiction?: boolean; on_new_evidence?: boolean };

    let result: Record<string, unknown> = {};

    switch (operation) {
      case 'ingest': {
        const content = payload.content;
        const tier = payload.tier || 'semantic';
        const memoryType = payload.memoryType || payload.memory_type || 'observation';
        const keywords = payload.keywords || [];
        const tags = payload.tags || [];
        const sourceType = payload.sourceType || payload.source_type;
        const sourceId = payload.sourceId || payload.source_id;

        if (!content) {
          return new Response(JSON.stringify({ error: 'content is required for ingest' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Extract keywords if not provided
        let extractedKeywords = keywords;
        if (keywords.length === 0) {
          const aiResponse = await callAI({
            model: selectModel('speed'),
            messages: [{
              role: 'user',
              content: `Extract 5-10 key concepts from this text. Return only a JSON array of strings.\n\n${content.substring(0, 2000)}`
            }],
            userId,
            functionName: 'memory-crystallization-engine',
            profileId,
            temperature: 0.3,
            maxTokens: 200,
          });
          extractedKeywords = parseAIJson<string[]>(aiResponse.content, []);
        }

        // Insert memory node
        const { data: newMemory, error: insertError } = await supabase
          .from('agentic_memory')
          .insert({
            user_id: userId,
            profile_id: profileId,
            memory_tier: tier,
            memory_type: memoryType,
            content,
            keywords: extractedKeywords,
            tags,
            confidence_score: 0.8,
            source_type: sourceType,
            source_id: sourceId,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Find related memories and create links
        const { data: relatedMemories } = await supabase
          .from('agentic_memory')
          .select('id, content, keywords, memory_tier')
          .eq('user_id', userId)
          .neq('id', newMemory.id)
          .limit(50);

        if (relatedMemories && relatedMemories.length > 0) {
          // Use AI to suggest links
          const aiResponse = await callAI({
            model: selectModel('speed'),
            messages: [{
              role: 'user',
              content: `Given this new memory and related memories, suggest links.

NEW MEMORY:
${content.substring(0, 500)}
Keywords: ${extractedKeywords.join(', ')}

RELATED MEMORIES:
${relatedMemories.slice(0, 10).map((m, i) => `[${i}] ID: ${m.id}\n${m.content.substring(0, 200)}\nKeywords: ${m.keywords?.join(', ')}`).join('\n\n')}

Return JSON array of link suggestions:
[{"target_index": 0, "link_type": "supports|contradicts|extends|refines|causes|correlates", "strength": 0.0-1.0, "reason": "brief explanation"}]`
            }],
            userId,
            functionName: 'memory-crystallization-engine',
            profileId,
            temperature: 0.3,
            maxTokens: 500,
          });

          const linkSuggestions = parseAIJson<Array<{ target_index: number; link_type: string; strength: number; reason: string }>>(aiResponse.content, []);
          
          const minSimilarity = linkCreation.min_similarity || 0.5;
          const linksToCreate = linkSuggestions
            .filter(s => s.strength >= minSimilarity && s.target_index < relatedMemories.length)
            .slice(0, linkCreation.max_links_per_memory || 10);

          // Create bidirectional links
          for (const suggestion of linksToCreate) {
            const targetMemory = relatedMemories[suggestion.target_index];
            
            await supabase.from('memory_links').insert([
              {
                source_memory_id: newMemory.id,
                target_memory_id: targetMemory.id,
                link_type: suggestion.link_type,
                link_strength: suggestion.strength,
                bidirectional: true,
                evidence: { reason: suggestion.reason },
              },
              {
                source_memory_id: targetMemory.id,
                target_memory_id: newMemory.id,
                link_type: suggestion.link_type === 'causes' ? 'correlates' : suggestion.link_type,
                link_strength: suggestion.strength,
                bidirectional: true,
                evidence: { reason: suggestion.reason },
              }
            ]);

            // Check for contradictions and trigger reconsolidation
            if (suggestion.link_type === 'contradicts' && reconsolidationConfig.on_contradiction) {
              await supabase.from('memory_reconsolidation_events').insert({
                user_id: userId,
                profile_id: profileId,
                trigger_memory_id: newMemory.id,
                affected_memory_ids: [targetMemory.id],
                reconsolidation_type: 'conflict_resolution',
                before_state: { content: targetMemory.content },
                after_state: { pending_resolution: true },
                resolution_rationale: `New memory contradicts existing memory: ${suggestion.reason}`,
              });
            }
          }

          result = {
            memoryId: newMemory.id,
            linksCreated: linksToCreate.length,
            keywords: extractedKeywords,
          };
        } else {
          result = {
            memoryId: newMemory.id,
            linksCreated: 0,
            keywords: extractedKeywords,
          };
        }
        break;
      }

      case 'query': {
        const queryText = payload.queryText || payload.query_text;
        const limit = payload.limit || 20;

        if (!queryText) {
          return new Response(JSON.stringify({ error: 'queryText is required for query' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Extract query keywords
        const aiResponse = await callAI({
          model: selectModel('speed'),
          messages: [{
            role: 'user',
            content: `Extract search keywords from this query. Return only a JSON array of strings.\n\n${queryText}`
          }],
          userId,
          functionName: 'memory-crystallization-engine',
          profileId,
          temperature: 0.2,
          maxTokens: 100,
        });
        const queryKeywords = parseAIJson<string[]>(aiResponse.content, queryText.split(' '));

        // Search memories with tier-weighted scoring
        const { data: memories } = await supabase
          .from('agentic_memory')
          .select('id, content, memory_tier, memory_type, keywords, tags, confidence_score, created_at')
          .eq('user_id', userId)
          .overlaps('keywords', queryKeywords)
          .order('confidence_score', { ascending: false })
          .limit(limit * 2);

        // Apply tier weights and re-rank
        const rankedMemories = (memories || []).map(m => ({
          ...m,
          weighted_score: m.confidence_score * (tierWeights[m.memory_tier] || 0.5),
        })).sort((a, b) => b.weighted_score - a.weighted_score).slice(0, limit);

        // Update access counts - fetch and increment each memory
        const memoryIds = rankedMemories.map(m => m.id);
        for (const memId of memoryIds) {
          const { data: currentMem } = await supabase
            .from('agentic_memory')
            .select('access_count')
            .eq('id', memId)
            .single();
          
          await supabase
            .from('agentic_memory')
            .update({ 
              last_accessed_at: new Date().toISOString(),
              access_count: (currentMem?.access_count || 0) + 1
            })
            .eq('id', memId);
        }

        // Fetch linked memories for context
        let links: unknown[] = [];
        if (memoryIds.length > 0) {
          const { data: linkData } = await supabase
            .from('memory_links')
            .select('source_memory_id, target_memory_id, link_type, link_strength')
            .or(`source_memory_id.in.(${memoryIds.join(',')}),target_memory_id.in.(${memoryIds.join(',')})`)
            .limit(100);
          links = linkData || [];
        }

        result = {
          memories: rankedMemories,
          links,
          queryKeywords,
        };
        break;
      }

      case 'decay': {
        const staleAfterDays = decayThresholds.stale_after_days || 30;
        const archiveBelow = decayThresholds.archive_below || 0.2;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - staleAfterDays);

        // Find stale memories
        const { data: staleMemories } = await supabase
          .from('agentic_memory')
          .select('id, confidence_score')
          .eq('user_id', userId)
          .lt('last_accessed_at', cutoffDate.toISOString())
          .gt('confidence_score', archiveBelow);

        if (staleMemories && staleMemories.length > 0) {
          // Apply decay
          for (const memory of staleMemories) {
            const newConfidence = Math.max(memory.confidence_score * 0.9, archiveBelow);
            await supabase
              .from('agentic_memory')
              .update({ 
                confidence_score: newConfidence,
                updated_at: new Date().toISOString()
              })
              .eq('id', memory.id);

            if (newConfidence <= archiveBelow) {
              // Archive memory
              await supabase.from('memory_reconsolidation_events').insert({
                user_id: userId,
                trigger_memory_id: memory.id,
                affected_memory_ids: [memory.id],
                reconsolidation_type: 'decay',
                before_state: { confidence: memory.confidence_score },
                after_state: { confidence: newConfidence, archived: true },
                confidence_delta: newConfidence - memory.confidence_score,
              });
            }
          }
        }

        result = {
          decayedCount: staleMemories?.length || 0,
          archivedCount: staleMemories?.filter(m => m.confidence_score * 0.9 <= archiveBelow).length || 0,
        };
        break;
      }

      case 'reconsolidate': {
        const memoryIds = payload.memoryIds || payload.memory_ids || [];
        
        if (memoryIds.length < 2) {
          return new Response(JSON.stringify({ error: 'At least 2 memoryIds required for reconsolidation' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch memories to reconsolidate
        const { data: memories } = await supabase
          .from('agentic_memory')
          .select('*')
          .in('id', memoryIds);

        if (!memories || memories.length < 2) {
          return new Response(JSON.stringify({ error: 'Memories not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Use AI to resolve conflicts
        const aiResponse = await callAI({
          model: selectModel('quality'),
          messages: [{
            role: 'user',
            content: `Analyze these memories for conflicts and suggest resolution.

MEMORIES:
${memories.map((m, i) => `[${i}] Tier: ${m.memory_tier}, Confidence: ${m.confidence_score}\n${m.content}`).join('\n\n')}

Return JSON:
{
  "has_conflict": true/false,
  "resolution": "merged content or explanation",
  "confidence_adjustments": [{"memory_index": 0, "new_confidence": 0.0-1.0, "reason": "..."}],
  "should_merge": true/false
}`
          }],
          userId,
          functionName: 'memory-crystallization-engine',
          profileId,
          temperature: 0.4,
          maxTokens: 1000,
        });

        const resolution = parseAIJson<{
          has_conflict: boolean;
          resolution: string;
          confidence_adjustments: Array<{ memory_index: number; new_confidence: number; reason: string }>;
          should_merge: boolean;
        }>(aiResponse.content, { has_conflict: false, resolution: '', confidence_adjustments: [], should_merge: false });

        // Apply adjustments
        for (const adjustment of resolution.confidence_adjustments) {
          if (adjustment.memory_index < memories.length) {
            await supabase
              .from('agentic_memory')
              .update({ confidence_score: adjustment.new_confidence })
              .eq('id', memories[adjustment.memory_index].id);
          }
        }

        // Record reconsolidation event
        await supabase.from('memory_reconsolidation_events').insert({
          user_id: userId,
          profile_id: profileId,
          trigger_memory_id: memoryIds[0],
          affected_memory_ids: memoryIds,
          reconsolidation_type: resolution.has_conflict ? 'conflict_resolution' : 'update',
          before_state: { memories: memories.map(m => ({ id: m.id, confidence: m.confidence_score })) },
          after_state: resolution,
          resolution_rationale: resolution.resolution,
        });

        result = {
          hasConflict: resolution.has_conflict,
          resolution: resolution.resolution,
          adjustmentsApplied: resolution.confidence_adjustments.length,
        };
        break;
      }

      case 'merge': {
        const memoryIds = payload.memoryIds || payload.memory_ids || [];
        
        if (memoryIds.length < 2) {
          return new Response(JSON.stringify({ error: 'At least 2 memoryIds required for merge' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: memories } = await supabase
          .from('agentic_memory')
          .select('*')
          .in('id', memoryIds);

        if (!memories || memories.length < 2) {
          return new Response(JSON.stringify({ error: 'Memories not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Merge content
        const aiResponse = await callAI({
          model: selectModel('balanced'),
          messages: [{
            role: 'user',
            content: `Merge these memories into a single coherent memory.

MEMORIES:
${memories.map(m => m.content).join('\n\n---\n\n')}

Return JSON:
{
  "merged_content": "combined memory content",
  "merged_keywords": ["keyword1", "keyword2"],
  "merged_confidence": 0.0-1.0
}`
          }],
          userId,
          functionName: 'memory-crystallization-engine',
          profileId,
          temperature: 0.4,
          maxTokens: 1500,
        });

        const merged = parseAIJson<{ merged_content: string; merged_keywords: string[]; merged_confidence: number }>(
          aiResponse.content, 
          { merged_content: memories.map(m => m.content).join('\n'), merged_keywords: [], merged_confidence: 0.7 }
        );

        // Create new merged memory
        const { data: newMemory } = await supabase
          .from('agentic_memory')
          .insert({
            user_id: userId,
            profile_id: profileId,
            memory_tier: memories[0].memory_tier,
            memory_type: 'synthesis',
            content: merged.merged_content,
            keywords: merged.merged_keywords,
            confidence_score: merged.merged_confidence,
            source_type: 'merge',
          })
          .select('id')
          .single();

        // Record reconsolidation
        await supabase.from('memory_reconsolidation_events').insert({
          user_id: userId,
          profile_id: profileId,
          trigger_memory_id: newMemory?.id,
          affected_memory_ids: memoryIds,
          reconsolidation_type: 'merge',
          before_state: { source_memories: memoryIds },
          after_state: { merged_memory_id: newMemory?.id },
          resolution_rationale: 'Memories merged into unified entry',
        });

        // Soft-delete old memories by reducing confidence
        await supabase
          .from('agentic_memory')
          .update({ confidence_score: 0.1 })
          .in('id', memoryIds);

        result = {
          mergedMemoryId: newMemory?.id,
          sourceMemories: memoryIds,
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown operation: ${operation}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({
      success: true,
      operation,
      ...result,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Memory crystallization error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
