import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface ConvergenceMetric {
  id: string;
  userId: string;
  metricType: string;
  currentValue: number;
  trajectoryVector: Record<string, unknown>;
  convergenceContribution: number;
  accelerationFactor: number;
  createdAt: string | null;
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
  createdAt: string | null;
}

export interface OmegaProximity {
  id: string;
  userId: string;
  proximityScore: number;
  dimensionalAlignment: Record<string, number>;
  convergenceVelocity: number;
  singularityFactors: string[];
  transcendenceReadiness: number;
  createdAt: string | null;
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
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        metricType: (row.metric_type || '') as string,
        currentValue: (row.current_value || 0) as number,
        trajectoryVector: { trajectory: row.trajectory } as Record<string, unknown>,
        convergenceContribution: (row.convergence_contribution || 0) as number,
        accelerationFactor: 0 as number,
        createdAt: row.created_at as string
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
        .order('critical_mass_percentage', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        transitionType: (row.transition_name || '') as string,
        currentPhase: (row.current_phase || '') as string,
        nextPhase: '' as string,
        transitionProbability: (row.critical_mass_percentage || 0) as number,
        catalystConditions: [] as string[],
        barrierFactors: [] as string[],
        estimatedTimeframe: (row.estimated_transition_date || '') as string,
        createdAt: row.created_at as string
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
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      const row = data as Record<string, unknown>;
      return {
        id: row.id as string,
        userId: row.user_id as string,
        proximityScore: (row.proximity_score || 0) as number,
        dimensionalAlignment: (row.dimensional_alignment || {}) as Record<string, number>,
        convergenceVelocity: (row.convergence_velocity || 0) as number,
        singularityFactors: (row.singularity_factors || []) as string[],
        transcendenceReadiness: (row.transcendence_readiness || 0) as number,
        createdAt: row.created_at as string
      } as OmegaProximity;
    },
    enabled: !!user,
  });

  const trackConvergence = useMutation({
    mutationFn: async (input: { trackingMode?: 'metrics' | 'transitions' | 'proximity' | 'comprehensive' }) => {
      const { data, error } = await invokeFunction('omega-point-tracker', {
          userId: user!.id,
          trackingMode: input.trackingMode || 'comprehensive'
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
