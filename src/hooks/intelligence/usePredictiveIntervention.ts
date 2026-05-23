/**
 * Predictive Intervention Hook
 * AGIS Phase 5 - Omniscient Command
 * Opportunity automation, trajectory interception, proactive actions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OpportunityWindow {
  id: string;
  profileId?: string | null;
  opportunityType: 'influence' | 'extraction' | 'recruitment' | 'intervention';
  windowStart: Date;
  windowEnd: Date;
  windowQuality: number;
  triggerConditions: Record<string, unknown>;
  recommendedActions: Record<string, unknown>;
  successProbability: number;
  riskFactors: Record<string, unknown>;
  autoActionEnabled: boolean;
  autoActionConfig: Record<string, unknown>;
  wasUtilized: boolean;
  utilizationOutcome?: Record<string, unknown>;
  detectedAt: Date;
}

export interface TrajectoryIntercept {
  id: string;
  profileId?: string | null;
  trajectoryType: 'relationship' | 'career' | 'emotional' | 'financial';
  currentTrajectory: Record<string, unknown>;
  predictedTrajectory: Record<string, unknown>;
  desiredTrajectory: Record<string, unknown>;
  interceptPoints: Record<string, unknown>;
  interventionPlan: Record<string, unknown>;
  currentDeviation: number;
  correctionProgress: number;
  interceptStatus: 'monitoring' | 'intervening' | 'corrected' | 'failed';
  nextInterceptAt?: Date | null;
}

export interface ProactiveAction {
  id: string;
  profileId?: string | null;
  actionType: string;
  triggerPrediction: string;
  predictionConfidence: number;
  actionTaken: string;
  actionParams: Record<string, unknown>;
  timingRationale: string;
  expectedOutcome: Record<string, unknown>;
  actualOutcome?: Record<string, unknown>;
  outcomeMatchScore?: number;
  preemptionSuccess?: boolean | null;
  executedAt: Date | null;
}

export interface InterventionTrigger {
  id: string;
  profileId?: string | null;
  triggerName: string;
  triggerType: 'threshold' | 'pattern' | 'prediction' | 'schedule';
  triggerConfig: Record<string, unknown>;
  interventionAction: string;
  interventionParams: Record<string, unknown>;
  priority: number;
  cooldownHours: number;
  isActive: boolean;
  lastTriggeredAt?: Date;
  triggerCount: number;
  successCount: number;
}

export function usePredictiveIntervention(profileId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const opportunitiesQuery = useQuery({
    queryKey: ['opportunity-windows', profileId],
    queryFn: async (): Promise<OpportunityWindow[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('opportunity_windows')
        .select('*')
        .eq('user_id', user.id)
        .order('window_start', { ascending: true });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(o => ({
        id: o.id,
        profileId: o.profile_id,
        opportunityType: o.opportunity_type as OpportunityWindow['opportunityType'],
        windowStart: new Date(o.window_start),
        windowEnd: new Date(o.window_end),
        windowQuality: Number(o.window_quality) || 0.5,
        triggerConditions: o.trigger_conditions as Record<string, unknown>,
        recommendedActions: o.recommended_actions as Record<string, unknown>,
        successProbability: Number(o.success_probability) || 0,
        riskFactors: o.risk_factors as Record<string, unknown>,
        autoActionEnabled: o.auto_action_enabled || false,
        autoActionConfig: o.auto_action_config as Record<string, unknown>,
        wasUtilized: o.was_utilized || false,
        utilizationOutcome: o.utilization_outcome as Record<string, unknown>,
        detectedAt: new Date(o.detected_at ?? Date.now()),
      }));
    },
    enabled: !!user?.id,
  });

  const interceptsQuery = useQuery({
    queryKey: ['trajectory-intercepts', profileId],
    queryFn: async (): Promise<TrajectoryIntercept[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('trajectory_intercepts')
        .select('*')
        .eq('user_id', user.id);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(i => ({
        id: i.id,
        profileId: i.profile_id,
        trajectoryType: i.trajectory_type as TrajectoryIntercept['trajectoryType'],
        currentTrajectory: i.current_trajectory as Record<string, unknown>,
        predictedTrajectory: i.predicted_trajectory as Record<string, unknown>,
        desiredTrajectory: i.desired_trajectory as Record<string, unknown>,
        interceptPoints: i.intercept_points as Record<string, unknown>,
        interventionPlan: i.intervention_plan as Record<string, unknown>,
        currentDeviation: Number(i.current_deviation) || 0,
        correctionProgress: Number(i.correction_progress) || 0,
        interceptStatus: i.intercept_status as TrajectoryIntercept['interceptStatus'],
        nextInterceptAt: i.next_intercept_at ? new Date(i.next_intercept_at) : undefined,
      }));
    },
    enabled: !!user?.id,
  });

  const actionsQuery = useQuery({
    queryKey: ['proactive-actions', profileId],
    queryFn: async (): Promise<ProactiveAction[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('proactive_actions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(a => ({
        id: a.id,
        profileId: a.profile_id,
        actionType: a.action_type,
        triggerPrediction: a.trigger_prediction,
        predictionConfidence: Number(a.prediction_confidence) || 0,
        actionTaken: a.action_taken,
        actionParams: a.action_params as Record<string, unknown>,
        timingRationale: a.timing_rationale || '',
        expectedOutcome: a.expected_outcome as Record<string, unknown>,
        actualOutcome: a.actual_outcome as Record<string, unknown>,
        outcomeMatchScore: a.outcome_match_score ? Number(a.outcome_match_score) : undefined,
        preemptionSuccess: a.preemption_success,
        executedAt: new Date(a.executed_at ?? Date.now()),
      }));
    },
    enabled: !!user?.id,
  });

  const triggersQuery = useQuery({
    queryKey: ['intervention-triggers', profileId],
    queryFn: async (): Promise<InterventionTrigger[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('intervention_triggers')
        .select('*')
        .eq('user_id', user.id);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        profileId: t.profile_id,
        triggerName: t.trigger_name,
        triggerType: t.trigger_type as InterventionTrigger['triggerType'],
        triggerConfig: t.trigger_config as Record<string, unknown>,
        interventionAction: t.intervention_action,
        interventionParams: t.intervention_params as Record<string, unknown>,
        priority: t.priority || 5,
        cooldownHours: t.cooldown_hours || 24,
        isActive: t.is_active || false,
        lastTriggeredAt: t.last_triggered_at ? new Date(t.last_triggered_at) : undefined,
        triggerCount: t.trigger_count || 0,
        successCount: t.success_count || 0,
      }));
    },
    enabled: !!user?.id,
  });

  const createTriggerMutation = useMutation({
    mutationFn: async (trigger: Omit<InterventionTrigger, 'id' | 'lastTriggeredAt' | 'triggerCount' | 'successCount'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('intervention_triggers')
        .insert({
          user_id: user.id,
          profile_id: trigger.profileId,
          trigger_name: trigger.triggerName,
          trigger_type: trigger.triggerType,
          trigger_config: trigger.triggerConfig,
          intervention_action: trigger.interventionAction,
          intervention_params: trigger.interventionParams,
          priority: trigger.priority,
          cooldown_hours: trigger.cooldownHours,
          is_active: trigger.isActive,
        } as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention-triggers'] });
    },
  });

  const executeInterventionMutation = useMutation({
    mutationFn: async ({ triggerId, action, params }: { triggerId?: string; action: string; params: Record<string, unknown> }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('proactive_actions')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          action_type: 'manual_intervention',
          trigger_prediction: 'User initiated',
          prediction_confidence: 1,
          action_taken: action,
          action_params: params,
          timing_rationale: 'Manual execution',
          expected_outcome: {},
        } as never);

      if (error) throw error;

      if (triggerId) {
        await supabase
          .from('intervention_triggers')
          .update({ 
            last_triggered_at: new Date().toISOString(),
          })
          .eq('id', triggerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proactive-actions'] });
      queryClient.invalidateQueries({ queryKey: ['intervention-triggers'] });
    },
  });

  // Computed metrics
  const now = new Date();
  const activeWindows = opportunitiesQuery.data?.filter(o => 
    o.windowStart <= now && o.windowEnd >= now && !o.wasUtilized
  ) || [];
  const upcomingWindows = opportunitiesQuery.data?.filter(o => o.windowStart > now) || [];
  const activeIntercepts = interceptsQuery.data?.filter(i => i.interceptStatus === 'intervening') || [];
  const successfulActions = actionsQuery.data?.filter(a => a.preemptionSuccess === true) || [];
  const preemptionSuccessRate = actionsQuery.data && actionsQuery.data.length > 0
    ? successfulActions.length / actionsQuery.data.filter(a => a.preemptionSuccess !== undefined).length
    : 0;

  return {
    opportunities: opportunitiesQuery.data || [],
    intercepts: interceptsQuery.data || [],
    actions: actionsQuery.data || [],
    triggers: triggersQuery.data || [],
    isLoading: opportunitiesQuery.isLoading || interceptsQuery.isLoading,
    error: opportunitiesQuery.error || interceptsQuery.error,

    // Computed
    activeWindows,
    upcomingWindows,
    activeIntercepts,
    successfulActions,
    preemptionSuccessRate,

    // Actions
    createTrigger: createTriggerMutation.mutateAsync,
    executeIntervention: executeInterventionMutation.mutateAsync,
  };
}
