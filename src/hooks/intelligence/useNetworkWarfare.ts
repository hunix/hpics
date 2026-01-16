/**
 * Network Warfare Hook
 * AGIS Phase 5 - Omniscient Command
 * Multi-target coordination, cascade modeling, influence propagation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAGISPhaseMiddleware } from './useAGISPhaseMiddleware';

export interface InfluenceCascade {
  id: string;
  cascadeName: string;
  originProfileId?: string;
  cascadeType: 'narrative' | 'behavioral' | 'emotional' | 'opinion';
  targetProfiles: string[];
  currentReach: number;
  maxReach?: number;
  propagationModel: 'sir' | 'bass' | 'threshold';
  propagationParams: Record<string, unknown>;
  currentPhase: string;
  infectionRate: number;
  recoveryRate: number;
  cascadeVelocity: number;
  predictedPeakAt?: Date;
  startedAt: Date;
  completedAt?: Date;
}

export interface NetworkOperation {
  id: string;
  operationName: string;
  operationType: 'isolation' | 'bridging' | 'centralization' | 'fragmentation';
  targetNetwork: Record<string, unknown>;
  targetNodes: string[];
  objective: string;
  currentPhase: string;
  phaseDetails: Record<string, unknown>;
  progressMetrics: Record<string, unknown>;
  networkBefore: Record<string, unknown>;
  networkAfter: Record<string, unknown>;
  effectivenessScore: number;
  isActive: boolean;
}

export interface MultiTargetCampaign {
  id: string;
  campaignName: string;
  campaignObjective: string;
  targetProfiles: string[];
  coordinationStrategy: 'synchronized' | 'sequential' | 'adaptive';
  timingConfig: Record<string, unknown>;
  perTargetTactics: Record<string, unknown>;
  crossTargetEffects: Record<string, unknown>;
  currentPhase: string;
  overallProgress: number;
  targetStatuses: Record<string, unknown>;
  synergyScore: number;
  isActive: boolean;
}

export function useNetworkWarfare() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const phaseMiddleware = useAGISPhaseMiddleware();

  const cascadesQuery = useQuery({
    queryKey: ['influence-cascades'],
    queryFn: async (): Promise<InfluenceCascade[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('influence_cascades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        cascadeName: c.cascade_name,
        originProfileId: c.origin_profile_id,
        cascadeType: c.cascade_type as InfluenceCascade['cascadeType'],
        targetProfiles: c.target_profiles || [],
        currentReach: c.current_reach || 0,
        maxReach: c.max_reach,
        propagationModel: c.propagation_model as InfluenceCascade['propagationModel'],
        propagationParams: c.propagation_params as Record<string, unknown>,
        currentPhase: c.current_phase || 'seeding',
        infectionRate: Number(c.infection_rate) || 0,
        recoveryRate: Number(c.recovery_rate) || 0,
        cascadeVelocity: Number(c.cascade_velocity) || 0,
        predictedPeakAt: c.predicted_peak_at ? new Date(c.predicted_peak_at) : undefined,
        startedAt: new Date(c.started_at),
        completedAt: c.completed_at ? new Date(c.completed_at) : undefined,
      }));
    },
    enabled: !!user?.id,
  });

  const operationsQuery = useQuery({
    queryKey: ['network-operations'],
    queryFn: async (): Promise<NetworkOperation[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('network_operations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(o => ({
        id: o.id,
        operationName: o.operation_name,
        operationType: o.operation_type as NetworkOperation['operationType'],
        targetNetwork: o.target_network as Record<string, unknown>,
        targetNodes: o.target_nodes || [],
        objective: o.objective,
        currentPhase: o.current_phase || 'planning',
        phaseDetails: o.phase_details as Record<string, unknown>,
        progressMetrics: o.progress_metrics as Record<string, unknown>,
        networkBefore: o.network_before as Record<string, unknown>,
        networkAfter: o.network_after as Record<string, unknown>,
        effectivenessScore: Number(o.effectiveness_score) || 0,
        isActive: o.is_active || false,
      }));
    },
    enabled: !!user?.id,
  });

  const multiTargetQuery = useQuery({
    queryKey: ['multi-target-campaigns'],
    queryFn: async (): Promise<MultiTargetCampaign[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('multi_target_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        campaignName: c.campaign_name,
        campaignObjective: c.campaign_objective,
        targetProfiles: c.target_profiles || [],
        coordinationStrategy: c.coordination_strategy as MultiTargetCampaign['coordinationStrategy'],
        timingConfig: c.timing_config as Record<string, unknown>,
        perTargetTactics: c.per_target_tactics as Record<string, unknown>,
        crossTargetEffects: c.cross_target_effects as Record<string, unknown>,
        currentPhase: c.current_phase || 'initialization',
        overallProgress: Number(c.overall_progress) || 0,
        targetStatuses: c.target_statuses as Record<string, unknown>,
        synergyScore: Number(c.synergy_score) || 0,
        isActive: c.is_active || false,
      }));
    },
    enabled: !!user?.id,
  });

  const launchCascadeMutation = useMutation({
    mutationFn: async (cascade: Omit<InfluenceCascade, 'id' | 'currentReach' | 'cascadeVelocity' | 'startedAt' | 'completedAt'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('influence_cascades')
        .insert({
          user_id: user.id,
          cascade_name: cascade.cascadeName,
          origin_profile_id: cascade.originProfileId,
          cascade_type: cascade.cascadeType,
          target_profiles: cascade.targetProfiles,
          max_reach: cascade.maxReach,
          propagation_model: cascade.propagationModel,
          propagation_params: cascade.propagationParams,
          current_phase: 'seeding',
          infection_rate: cascade.infectionRate,
          recovery_rate: cascade.recoveryRate,
        } as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influence-cascades'] });
      // Track Phase 5 cascade launch
      phaseMiddleware.recordSuccess(5, 'influence_cascade_launched');
    },
  });

  const startOperationMutation = useMutation({
    mutationFn: async (operation: Omit<NetworkOperation, 'id' | 'effectivenessScore' | 'networkAfter'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('network_operations')
        .insert({
          user_id: user.id,
          operation_name: operation.operationName,
          operation_type: operation.operationType,
          target_network: operation.targetNetwork,
          target_nodes: operation.targetNodes,
          objective: operation.objective,
          current_phase: 'planning',
          network_before: operation.networkBefore,
          is_active: true,
        } as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-operations'] });
      // Track Phase 5 network operation
      phaseMiddleware.recordSuccess(5, 'network_operation_started');
    },
  });

  // Computed metrics
  const activeCascades = cascadesQuery.data?.filter(c => !c.completedAt) || [];
  const activeOperations = operationsQuery.data?.filter(o => o.isActive) || [];
  const totalReach = activeCascades.reduce((sum, c) => sum + c.currentReach, 0);
  const avgCascadeVelocity = activeCascades.length > 0
    ? activeCascades.reduce((sum, c) => sum + c.cascadeVelocity, 0) / activeCascades.length
    : 0;

  return {
    cascades: cascadesQuery.data || [],
    operations: operationsQuery.data || [],
    multiTargetCampaigns: multiTargetQuery.data || [],
    isLoading: cascadesQuery.isLoading || operationsQuery.isLoading || multiTargetQuery.isLoading,
    error: cascadesQuery.error || operationsQuery.error || multiTargetQuery.error,

    // Computed
    activeCascades,
    activeOperations,
    totalReach,
    avgCascadeVelocity,

    // Actions
    launchCascade: launchCascadeMutation.mutateAsync,
    startOperation: startOperationMutation.mutateAsync,
  };
}
