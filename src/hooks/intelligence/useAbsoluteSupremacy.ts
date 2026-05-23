import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AbsoluteSupremacy {
  id: string;
  supremacyDomain: string;
  controlVectors: Array<{ vector: string; strength: number; reach: number }>;
  influenceMatrix: Record<string, number>;
  powerTopology: Record<string, unknown>;
  resistanceMapping: Record<string, unknown>;
  dominanceScore: number;
  sustainabilityRating: number;
  evolutionTrajectory: Record<string, unknown>;
  createdAt: string | null;
}

export function useAbsoluteSupremacy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: supremacies = [], isLoading } = useQuery({
    queryKey: ['absolute-supremacy', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absolute_supremacy')
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        supremacyDomain: row.supremacy_domain,
        controlVectors: row.control_vectors as AbsoluteSupremacy['controlVectors'],
        influenceMatrix: row.influence_matrix as Record<string, number>,
        powerTopology: row.power_topology as Record<string, unknown>,
        resistanceMapping: row.resistance_mapping as Record<string, unknown>,
        dominanceScore: Number(row.dominance_score),
        sustainabilityRating: Number(row.sustainability_rating),
        evolutionTrajectory: row.evolution_trajectory as Record<string, unknown>,
        createdAt: row.created_at
      })) as AbsoluteSupremacy[];
    },
    enabled: !!user?.id
  });

  const createSupremacyMutation = useMutation({
    mutationFn: async (data: Partial<AbsoluteSupremacy>) => {
      const { data: result, error } = await supabase
        .from('absolute_supremacy')
        .insert({
          user_id: user?.id,
          supremacy_domain: data.supremacyDomain,
          control_vectors: data.controlVectors,
          influence_matrix: data.influenceMatrix,
          power_topology: data.powerTopology,
          resistance_mapping: data.resistanceMapping,
          dominance_score: data.dominanceScore,
          sustainability_rating: data.sustainabilityRating,
          evolution_trajectory: data.evolutionTrajectory
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absolute-supremacy'] })
  });

  return {
    supremacies,
    isLoading,
    createSupremacy: createSupremacyMutation.mutateAsync,
    avgDominance: supremacies.reduce((sum, s) => sum + s.dominanceScore, 0) / Math.max(supremacies.length, 1),
    avgSustainability: supremacies.reduce((sum, s) => sum + s.sustainabilityRating, 0) / Math.max(supremacies.length, 1),
    totalDomains: supremacies.length
  };
}
