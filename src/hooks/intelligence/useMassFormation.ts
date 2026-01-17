import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MassFormationIndicator {
  id: string;
  userId: string;
  indicatorType: string;
  intensity: number;
  affectedPopulation: string;
  triggerConditions: string[];
  propagationVectors: Record<string, unknown>[];
  tippingPointProximity: number;
  interventionOpportunities: string[];
  createdAt: string;
}

export interface NarrativeCrystallization {
  id: string;
  userId: string;
  narrativeCore: string;
  crystallizationLevel: number;
  adherentEstimate: number;
  resistanceFactors: string[];
  amplificationChannels: string[];
  decayRate: number;
  createdAt: string;
}

export function useMassFormation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: indicators, isLoading: indicatorsLoading } = useQuery({
    queryKey: ['mass-formation-indicators', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mass_formation_indicators')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        indicatorType: row.indicator_type,
        intensity: row.intensity || 0,
        affectedPopulation: row.affected_population || '',
        triggerConditions: row.trigger_conditions || [],
        propagationVectors: row.propagation_vectors as Record<string, unknown>[] || [],
        tippingPointProximity: row.tipping_point_proximity || 0,
        interventionOpportunities: row.intervention_opportunities || [],
        createdAt: row.created_at
      })) as MassFormationIndicator[];
    },
    enabled: !!user,
  });

  const { data: narratives, isLoading: narrativesLoading } = useQuery({
    queryKey: ['narrative-crystallization', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('narrative_crystallization')
        .select('*')
        .eq('user_id', user!.id)
        .order('crystallization_level', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        narrativeCore: row.narrative_core,
        crystallizationLevel: row.crystallization_level || 0,
        adherentEstimate: row.adherent_estimate || 0,
        resistanceFactors: row.resistance_factors || [],
        amplificationChannels: row.amplification_channels || [],
        decayRate: row.decay_rate || 0,
        createdAt: row.created_at
      })) as NarrativeCrystallization[];
    },
    enabled: !!user,
  });

  const analyzeMassFormation = useMutation({
    mutationFn: async (input: { populationSegment?: string; analysisDepth?: 'standard' | 'deep' }) => {
      const { data, error } = await supabase.functions.invoke('mass-formation-analyzer', {
        body: {
          userId: user!.id,
          populationSegment: input.populationSegment || 'network',
          analysisDepth: input.analysisDepth || 'standard'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-formation-indicators'] });
      queryClient.invalidateQueries({ queryKey: ['narrative-crystallization'] });
    }
  });

  return {
    indicators,
    narratives,
    isLoading: indicatorsLoading || narrativesLoading,
    analyzeMassFormation: analyzeMassFormation.mutateAsync,
    isAnalyzing: analyzeMassFormation.isPending,
    nearTippingPoint: indicators?.filter(i => i.tippingPointProximity > 0.7) || [],
    crystallizedNarratives: narratives?.filter(n => n.crystallizationLevel > 0.8) || []
  };
}
