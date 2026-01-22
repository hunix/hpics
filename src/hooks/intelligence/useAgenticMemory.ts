/**
 * Agentic Memory Hook (v3.9.35)
 * React hooks for memory crystallization and knowledge graph
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
type MemoryTier = 'core' | 'episodic' | 'semantic' | 'procedural' | 'resource';
type MemoryType = 'fact' | 'event' | 'observation' | 'insight' | 'sop';
type LinkType = string; // 'supports' | 'contradicts' | 'extends' | 'refines' | 'causes' | 'correlates'

interface AgenticMemory {
  id: string;
  user_id: string;
  profile_id: string | null;
  memory_tier: MemoryTier;
  memory_type: MemoryType;
  content: string;
  structured_data: Record<string, unknown>;
  keywords: string[];
  tags: string[];
  confidence_score: number;
  decay_rate: number;
  last_accessed_at: string;
  access_count: number;
  source_type: string | null;
  source_id: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface MemoryLink {
  id: string;
  source_memory_id: string;
  target_memory_id: string;
  link_type: string;
  link_strength: number;
  bidirectional: boolean;
  created_by: string;
  evidence: unknown;
  created_at: string;
}

interface MemoryCrystallizationConfig {
  id: string;
  config_key: string;
  display_name: string;
  description: string | null;
  config_value: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

interface ReconsolidationEvent {
  id: string;
  user_id: string;
  profile_id: string | null;
  trigger_memory_id: string | null;
  affected_memory_ids: string[];
  reconsolidation_type: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  resolution_rationale: string | null;
  confidence_delta: number | null;
  created_at: string;
}

interface IngestRequest {
  profileId?: string;
  content: string;
  tier?: MemoryTier;
  memoryType?: MemoryType;
  keywords?: string[];
  tags?: string[];
  sourceType?: string;
  sourceId?: string;
}

interface QueryRequest {
  profileId?: string;
  queryText: string;
  limit?: number;
}

interface MemoryOperationResponse {
  success?: boolean;
  memoryId?: string;
  linksCreated?: number;
  keywords?: string[];
  memories?: AgenticMemory[];
  links?: MemoryLink[];
  queryKeywords?: string[];
  decayedCount?: number;
  archivedCount?: number;
  hasConflict?: boolean;
  resolution?: string;
  adjustmentsApplied?: number;
  error?: string;
}

// Query keys
const memoryKeys = {
  all: ['agentic-memory'] as const,
  list: () => [...memoryKeys.all, 'list'] as const,
  memory: (id: string) => [...memoryKeys.all, 'memory', id] as const,
  profile: (profileId: string) => [...memoryKeys.all, 'profile', profileId] as const,
  links: (memoryId: string) => [...memoryKeys.all, 'links', memoryId] as const,
  configs: () => [...memoryKeys.all, 'configs'] as const,
  reconsolidations: () => [...memoryKeys.all, 'reconsolidations'] as const,
  graph: (profileId: string) => [...memoryKeys.all, 'graph', profileId] as const,
};

/**
 * Fetch memories for a profile
 */
export function useProfileMemories(profileId: string | undefined, options?: { tier?: MemoryTier; limit?: number }) {
  return useQuery({
    queryKey: [...memoryKeys.profile(profileId || ''), options?.tier, options?.limit],
    queryFn: async () => {
      let query = supabase
        .from('agentic_memory')
        .select('*')
        .eq('profile_id', profileId)
        .order('confidence_score', { ascending: false });

      if (options?.tier) {
        query = query.eq('memory_tier', options.tier);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AgenticMemory[];
    },
    enabled: !!profileId,
  });
}

/**
 * Fetch a specific memory with its links
 */
export function useMemoryWithLinks(memoryId: string | undefined) {
  return useQuery({
    queryKey: memoryKeys.links(memoryId || ''),
    queryFn: async () => {
      const [memoryResult, linksResult] = await Promise.all([
        supabase.from('agentic_memory').select('*').eq('id', memoryId).single(),
        supabase.from('memory_links').select('*').or(`source_memory_id.eq.${memoryId},target_memory_id.eq.${memoryId}`),
      ]);

      if (memoryResult.error) throw memoryResult.error;

      // Fetch linked memories
      const linkedIds = new Set<string>();
      linksResult.data?.forEach((link: MemoryLink) => {
        linkedIds.add(link.source_memory_id);
        linkedIds.add(link.target_memory_id);
      });
      linkedIds.delete(memoryId!);

      let linkedMemories: AgenticMemory[] = [];
      if (linkedIds.size > 0) {
        const { data } = await supabase
          .from('agentic_memory')
          .select('*')
          .in('id', Array.from(linkedIds));
        linkedMemories = (data || []) as unknown as AgenticMemory[];
      }

      return {
        memory: memoryResult.data as unknown as AgenticMemory,
        links: (linksResult.data || []) as unknown as MemoryLink[],
        linkedMemories,
      };
    },
    enabled: !!memoryId,
  });
}

/**
 * Fetch memory crystallization configurations
 */
export function useMemoryConfigs() {
  return useQuery({
    queryKey: memoryKeys.configs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memory_crystallization_config')
        .select('*')
        .order('config_key');

      if (error) throw error;
      return data as unknown as MemoryCrystallizationConfig[];
    },
  });
}

/**
 * Fetch memory graph for visualization
 */
export function useMemoryGraph(profileId: string | undefined) {
  return useQuery({
    queryKey: memoryKeys.graph(profileId || ''),
    queryFn: async () => {
      const [memoriesResult, linksResult] = await Promise.all([
        supabase
          .from('agentic_memory')
          .select('id, content, memory_tier, memory_type, keywords, confidence_score')
          .eq('profile_id', profileId)
          .gte('confidence_score', 0.3)
          .limit(100),
        supabase
          .from('memory_links')
          .select('source_memory_id, target_memory_id, link_type, link_strength')
          .gte('link_strength', 0.4)
          .limit(500),
      ]);

      if (memoriesResult.error) throw memoriesResult.error;

      const memoryIds = new Set(memoriesResult.data?.map(m => m.id) || []);
      const relevantLinks = (linksResult.data || []).filter(
        (link: MemoryLink) => memoryIds.has(link.source_memory_id) || memoryIds.has(link.target_memory_id)
      );

      return {
        nodes: memoriesResult.data as unknown as AgenticMemory[],
        edges: relevantLinks as unknown as MemoryLink[],
      };
    },
    enabled: !!profileId,
  });
}

/**
 * Fetch recent reconsolidation events
 */
export function useReconsolidationEvents(limit: number = 20) {
  return useQuery({
    queryKey: [...memoryKeys.reconsolidations(), limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memory_reconsolidation_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as ReconsolidationEvent[];
    },
  });
}

/**
 * Ingest new memory
 */
export function useIngestMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: IngestRequest): Promise<MemoryOperationResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('memory-crystallization-engine', {
        body: {
          userId: user.id,
          profileId: request.profileId,
          operation: 'ingest',
          payload: {
            content: request.content,
            tier: request.tier || 'semantic',
            memoryType: request.memoryType || 'observation',
            keywords: request.keywords || [],
            tags: request.tags || [],
            sourceType: request.sourceType,
            sourceId: request.sourceId,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Memory crystallized', {
        description: `${data.linksCreated || 0} links created`,
      });
      
      if (variables.profileId) {
        queryClient.invalidateQueries({ queryKey: memoryKeys.profile(variables.profileId) });
        queryClient.invalidateQueries({ queryKey: memoryKeys.graph(variables.profileId) });
      }
    },
    onError: (error) => {
      toast.error('Failed to ingest memory', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Query memories
 */
export function useQueryMemories() {
  return useMutation({
    mutationFn: async (request: QueryRequest): Promise<MemoryOperationResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('memory-crystallization-engine', {
        body: {
          userId: user.id,
          profileId: request.profileId,
          operation: 'query',
          payload: {
            queryText: request.queryText,
            limit: request.limit || 20,
          },
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Trigger memory decay
 */
export function useTriggerDecay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<MemoryOperationResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('memory-crystallization-engine', {
        body: {
          userId: user.id,
          operation: 'decay',
          payload: {},
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Decay cycle complete', {
        description: `${data.decayedCount || 0} memories decayed, ${data.archivedCount || 0} archived`,
      });
      queryClient.invalidateQueries({ queryKey: memoryKeys.all });
    },
    onError: (error) => {
      toast.error('Decay failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Reconsolidate memories
 */
export function useReconsolidateMemories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memoryIds, profileId }: { memoryIds: string[]; profileId?: string }): Promise<MemoryOperationResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('memory-crystallization-engine', {
        body: {
          userId: user.id,
          profileId,
          operation: 'reconsolidate',
          payload: { memoryIds },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.hasConflict) {
        toast.warning('Conflict resolved', {
          description: data.resolution?.substring(0, 100),
        });
      } else {
        toast.success('Memories reconsolidated');
      }
      queryClient.invalidateQueries({ queryKey: memoryKeys.all });
    },
    onError: (error) => {
      toast.error('Reconsolidation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update memory configuration
 */
export function useUpdateMemoryConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; config_value: Record<string, unknown> }) => {
      const configValue = JSON.parse(JSON.stringify(updates.config_value));
      const { error } = await supabase
        .from('memory_crystallization_config')
        .update({ config_value: configValue })
        .eq('id', updates.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Memory configuration updated');
      queryClient.invalidateQueries({ queryKey: memoryKeys.configs() });
    },
    onError: (error) => {
      toast.error('Failed to update configuration', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
