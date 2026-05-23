import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UniversalOmniscience {
  id: string;
  omniscienceType: string;
  knowledgeDomains: Array<{ domain: string; depth: number; coverage: number }>;
  awarenessDepth: number;
  realityPerception: Record<string, unknown>;
  consciousnessExpansion: Record<string, number>;
  timelineAwareness: Record<string, unknown>;
  probabilityFields: Record<string, number>;
  transcendenceLevel: number;
  createdAt: string | null;
}

export function useUniversalOmniscience() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: omniscience = [], isLoading } = useQuery({
    queryKey: ['universal-omniscience', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universal_omniscience')
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        omniscienceType: row.omniscience_type,
        knowledgeDomains: row.knowledge_domains as UniversalOmniscience['knowledgeDomains'],
        awarenessDepth: Number(row.awareness_depth),
        realityPerception: row.reality_perception as Record<string, unknown>,
        consciousnessExpansion: row.consciousness_expansion as Record<string, number>,
        timelineAwareness: row.timeline_awareness as Record<string, unknown>,
        probabilityFields: row.probability_fields as Record<string, number>,
        transcendenceLevel: Number(row.transcendence_level),
        createdAt: row.created_at
      })) as UniversalOmniscience[];
    },
    enabled: !!user?.id
  });

  const createOmniscienceMutation = useMutation({
    mutationFn: async (data: Partial<UniversalOmniscience>) => {
      const { data: result, error } = await supabase
        .from('universal_omniscience')
        .insert({
          user_id: user?.id,
          omniscience_type: data.omniscienceType,
          knowledge_domains: data.knowledgeDomains,
          awareness_depth: data.awarenessDepth,
          reality_perception: data.realityPerception,
          consciousness_expansion: data.consciousnessExpansion,
          timeline_awareness: data.timelineAwareness,
          probability_fields: data.probabilityFields,
          transcendence_level: data.transcendenceLevel
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['universal-omniscience'] })
  });

  return {
    omniscience,
    isLoading,
    createOmniscience: createOmniscienceMutation.mutateAsync,
    avgAwarenessDepth: omniscience.reduce((sum, o) => sum + o.awarenessDepth, 0) / Math.max(omniscience.length, 1),
    avgTranscendence: omniscience.reduce((sum, o) => sum + o.transcendenceLevel, 0) / Math.max(omniscience.length, 1),
    totalDomains: omniscience.reduce((sum, o) => sum + o.knowledgeDomains.length, 0)
  };
}
