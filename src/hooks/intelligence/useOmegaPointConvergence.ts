import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConvergenceMetric {
  id: string;
  userId: string;
  metricType: string;
  currentValue: number;
  trajectoryVector: Record<string, unknown>;
  convergenceContribution: number;
  accelerationFactor: number;
  createdAt: string;
}

export interface PhaseTransitionIndicator {
  id: string;
  userId: string;
  transitionType: string;
  currentPhase: string;
  nextPhase: string;
  transitionProbability: number;
  catalystConditions: string[];
  barrierFactors: string[];
  estimatedTimeframe: string;
  createdAt: string;
}

export interface OmegaProximity {
  id: string;
  userId: string;
  proximityScore: number;
  dimensionalAlignment: Record<string, number>;
  convergenceVelocity: number;
  singularityFactors: string[];
  transcendenceReadiness: number;
  createdAt: string;
}

export function useOmegaPointConvergence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['convergence-metrics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('convergence_metrics')
        .select('*')
        .eq('user_id', user!.id)
        .order('convergence_contribution', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        metricType: row.metric_type,
        currentValue: row.current_value || 0,
        trajectoryVector: row.trajectory_vector as Record<string, unknown> || {},
        convergenceContribution: row.convergence_contribution || 0,
        accelerationFactor: row.acceleration_factor || 0,
        createdAt: row.created_at
      })) as ConvergenceMetric[];
    },
    enabled: !!user,
  });

  const { data: transitions, isLoading: transitionsLoading } = useQuery({
    queryKey: ['phase-transition-indicators', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phase_transition_indicators')
        .select('*')
        .eq('user_id', user!.id)
        .order('transition_probability', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        transitionType: row.transition_type,
        currentPhase: row.current_phase || '',
        nextPhase: row.next_phase || '',
        transitionProbability: row.transition_probability || 0,
        catalystConditions: row.catalyst_conditions || [],
        barrierFactors: row.barrier_factors || [],
        estimatedTimeframe: row.estimated_timeframe || '',
        createdAt: row.created_at
      })) as PhaseTransitionIndicator[];
    },
    enabled: !!user,
  });

  const { data: omegaProximity, isLoading: proximityLoading } = useQuery({
    queryKey: ['omega-proximity', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('omega_proximity')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        proximityScore: data.proximity_score || 0,
        dimensionalAlignment: data.dimensional_alignment as Record<string, number> || {},
        convergenceVelocity: data.convergence_velocity || 0,
        singularityFactors: data.singularity_factors || [],
        transcendenceReadiness: data.transcendence_readiness || 0,
        createdAt: data.created_at
      } as OmegaProximity;
    },
    enabled: !!user,
  });

  const trackConvergence = useMutation({
    mutationFn: async (input: { trackingMode?: 'metrics' | 'transitions' | 'proximity' | 'comprehensive' }) => {
      const { data, error } = await supabase.functions.invoke('omega-point-tracker', {
        body: {
          userId: user!.id,
          trackingMode: input.trackingMode || 'comprehensive'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convergence-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['phase-transition-indicators'] });
      queryClient.invalidateQueries({ queryKey: ['omega-proximity'] });
    }
  });

  return {
    metrics,
    transitions,
    omegaProximity,
    isLoading: metricsLoading || transitionsLoading || proximityLoading,
    trackConvergence: trackConvergence.mutateAsync,
    isTracking: trackConvergence.isPending,
    totalConvergenceContribution: metrics?.reduce((sum, m) => sum + m.convergenceContribution, 0) || 0,
    imminentTransitions: transitions?.filter(t => t.transitionProbability > 0.7) || [],
    proximityPercent: (omegaProximity?.proximityScore || 0) * 100
  };
}
