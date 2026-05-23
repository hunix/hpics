import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RealityManipulation {
  id: string;
  profileId?: string;
  manipulationType: string;
  targetReality: Record<string, unknown>;
  perceptionVectors: Array<{ vector: string; strength: number; stability: number }>;
  beliefArchitecture: Record<string, unknown>;
  narrativeControl: Record<string, unknown>;
  consensusEngineering: Record<string, unknown>;
  effectivenessScore: number;
  stabilityRating: number;
  createdAt: string | null;
}

export function useRealityManipulation(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: manipulations = [], isLoading } = useQuery({
    queryKey: ['reality-manipulation', user?.id, profileId],
    queryFn: async () => {
      let query = supabase
        .from('reality_manipulation')
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('created_at', { ascending: false });
      
      if (profileId) {
        query = query.eq('profile_id', profileId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        profileId: row.profile_id,
        manipulationType: row.manipulation_type,
        targetReality: row.target_reality as Record<string, unknown>,
        perceptionVectors: row.perception_vectors as RealityManipulation['perceptionVectors'],
        beliefArchitecture: row.belief_architecture as Record<string, unknown>,
        narrativeControl: row.narrative_control as Record<string, unknown>,
        consensusEngineering: row.consensus_engineering as Record<string, unknown>,
        effectivenessScore: Number(row.effectiveness_score),
        stabilityRating: Number(row.stability_rating),
        createdAt: row.created_at
      })) as RealityManipulation[];
    },
    enabled: !!user?.id
  });

  const createManipulationMutation = useMutation({
    mutationFn: async (data: Partial<RealityManipulation>) => {
      const { data: result, error } = await supabase
        .from('reality_manipulation')
        .insert({
          user_id: user?.id,
          profile_id: data.profileId,
          manipulation_type: data.manipulationType,
          target_reality: data.targetReality,
          perception_vectors: data.perceptionVectors,
          belief_architecture: data.beliefArchitecture,
          narrative_control: data.narrativeControl,
          consensus_engineering: data.consensusEngineering,
          effectiveness_score: data.effectivenessScore,
          stability_rating: data.stabilityRating
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reality-manipulation'] })
  });

  return {
    manipulations,
    isLoading,
    createManipulation: createManipulationMutation.mutateAsync,
    avgEffectiveness: manipulations.reduce((sum, m) => sum + m.effectivenessScore, 0) / Math.max(manipulations.length, 1),
    avgStability: manipulations.reduce((sum, m) => sum + m.stabilityRating, 0) / Math.max(manipulations.length, 1),
    activeManipulations: manipulations.filter(m => m.effectivenessScore > 0.5).length
  };
}
