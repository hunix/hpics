import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DimensionalInfluence {
  id: string;
  influenceType: string;
  targetDimensions: Array<{ dimension: string; priority: number }>;
  influenceVectors: Array<{ vector: string; magnitude: number }>;
  crossDimensionalEffects: Array<{ effect: string; strength: number }>;
  amplificationFactor: number;
  decayRate: number;
  propagationModel: Record<string, unknown>;
  measuredImpact: Record<string, number>;
  createdAt: string;
}

export interface AbsoluteMastery {
  id: string;
  masteryDomain: string;
  competencyLevel: number;
  knowledgeGraph: Record<string, unknown>;
  skillMatrix: Array<{ skill: string; level: number }>;
  leveragePoints: Array<{ point: string; leverage: number }>;
  vulnerabilityMap: Record<string, unknown>;
  controlPercentage: number;
  challengesOvercome: Array<{ challenge: string; resolvedAt: string }>;
  nextMilestones: Array<{ milestone: string; targetDate: string }>;
}

export function useDimensionalInfluence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: influences = [], isLoading: influenceLoading } = useQuery({
    queryKey: ['dimensional-influence', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dimensional_influence')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        influenceType: row.influence_type,
        targetDimensions: row.target_dimensions as DimensionalInfluence['targetDimensions'],
        influenceVectors: row.influence_vectors as DimensionalInfluence['influenceVectors'],
        crossDimensionalEffects: row.cross_dimensional_effects as DimensionalInfluence['crossDimensionalEffects'],
        amplificationFactor: Number(row.amplification_factor),
        decayRate: Number(row.decay_rate),
        propagationModel: row.propagation_model as Record<string, unknown>,
        measuredImpact: row.measured_impact as Record<string, number>,
        createdAt: row.created_at
      })) as DimensionalInfluence[];
    },
    enabled: !!user?.id
  });

  const { data: masteries = [], isLoading: masteryLoading } = useQuery({
    queryKey: ['absolute-mastery', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absolute_mastery')
        .select('*')
        .eq('user_id', user?.id)
        .order('competency_level', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        masteryDomain: row.mastery_domain,
        competencyLevel: Number(row.competency_level),
        knowledgeGraph: row.knowledge_graph as Record<string, unknown>,
        skillMatrix: row.skill_matrix as AbsoluteMastery['skillMatrix'],
        leveragePoints: row.leverage_points as AbsoluteMastery['leveragePoints'],
        vulnerabilityMap: row.vulnerability_map as Record<string, unknown>,
        controlPercentage: Number(row.control_percentage),
        challengesOvercome: row.challenges_overcome as AbsoluteMastery['challengesOvercome'],
        nextMilestones: row.next_milestones as AbsoluteMastery['nextMilestones']
      })) as AbsoluteMastery[];
    },
    enabled: !!user?.id
  });

  const createInfluenceMutation = useMutation({
    mutationFn: async (influence: Partial<DimensionalInfluence>) => {
      const { data, error } = await supabase
        .from('dimensional_influence')
        .insert({
          user_id: user?.id,
          influence_type: influence.influenceType,
          target_dimensions: influence.targetDimensions,
          influence_vectors: influence.influenceVectors,
          cross_dimensional_effects: influence.crossDimensionalEffects,
          amplification_factor: influence.amplificationFactor,
          decay_rate: influence.decayRate,
          propagation_model: influence.propagationModel
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dimensional-influence'] })
  });

  const createMasteryMutation = useMutation({
    mutationFn: async (mastery: Partial<AbsoluteMastery>) => {
      const { data, error } = await supabase
        .from('absolute_mastery')
        .insert({
          user_id: user?.id,
          mastery_domain: mastery.masteryDomain,
          competency_level: mastery.competencyLevel,
          knowledge_graph: mastery.knowledgeGraph,
          skill_matrix: mastery.skillMatrix,
          leverage_points: mastery.leveragePoints,
          vulnerability_map: mastery.vulnerabilityMap,
          control_percentage: mastery.controlPercentage
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absolute-mastery'] })
  });

  return {
    influences,
    masteries,
    isLoading: influenceLoading || masteryLoading,
    createInfluence: createInfluenceMutation.mutateAsync,
    createMastery: createMasteryMutation.mutateAsync,
    totalDimensions: influences.reduce((s, i) => s + i.targetDimensions.length, 0),
    avgAmplification: influences.reduce((s, i) => s + i.amplificationFactor, 0) / Math.max(influences.length, 1),
    avgCompetency: masteries.reduce((s, m) => s + m.competencyLevel, 0) / Math.max(masteries.length, 1),
    avgControl: masteries.reduce((s, m) => s + m.controlPercentage, 0) / Math.max(masteries.length, 1)
  };
}
