/**
 * Autonomous Operations Hook
 * AGIS Phase 5 - Omniscient Command
 * Self-executing campaigns, AI agents, outcome learning
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAGISPhaseMiddleware } from './useAGISPhaseMiddleware';

export interface AutonomousCampaign {
  id: string;
  profileId?: string;
  campaignName: string;
  campaignType: 'influence' | 'extraction' | 'destabilization' | 'conditioning';
  objective: string;
  triggerConditions: Record<string, unknown>;
  executionRules: Record<string, unknown>;
  escalationConfig: Record<string, unknown>;
  successCriteria: Record<string, unknown>;
  currentPhase: string;
  phaseProgress: number;
  isActive: boolean;
  autoExecute: boolean;
  maxDailyActions: number;
  actionsToday: number;
  totalActions: number;
  successRate: number;
  lastActionAt?: Date;
  nextActionAt?: Date;
}

export interface AgentExecution {
  id: string;
  campaignId: string;
  agentType: 'influence' | 'extraction' | 'monitor' | 'intervene';
  actionTaken: string;
  actionParams: Record<string, unknown>;
  triggerReason: string;
  contextSnapshot: Record<string, unknown>;
  outcome: 'success' | 'partial' | 'failed' | 'pending';
  outcomeDetails: Record<string, unknown>;
  effectivenessScore: number;
  costCents: number;
  executionTimeMs: number;
  executedAt: Date;
}

export interface OutcomeLearning {
  id: string;
  executionId: string;
  actionType: string;
  contextFeatures: Record<string, unknown>;
  predictedOutcome: number;
  actualOutcome: number;
  predictionError: number;
  learnedAdjustments: Record<string, unknown>;
  modelVersion: string;
  appliedToFuture: boolean;
}

export function useAutonomousOperations(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const phaseMiddleware = useAGISPhaseMiddleware();

  const campaignsQuery = useQuery({
    queryKey: ['autonomous-campaigns', profileId],
    queryFn: async (): Promise<AutonomousCampaign[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('autonomous_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        profileId: c.profile_id,
        campaignName: c.campaign_name,
        campaignType: c.campaign_type as AutonomousCampaign['campaignType'],
        objective: c.objective,
        triggerConditions: c.trigger_conditions as Record<string, unknown>,
        executionRules: c.execution_rules as Record<string, unknown>,
        escalationConfig: c.escalation_config as Record<string, unknown>,
        successCriteria: c.success_criteria as Record<string, unknown>,
        currentPhase: c.current_phase || 'dormant',
        phaseProgress: Number(c.phase_progress) || 0,
        isActive: c.is_active || false,
        autoExecute: c.auto_execute || false,
        maxDailyActions: c.max_daily_actions || 5,
        actionsToday: c.actions_today || 0,
        totalActions: c.total_actions || 0,
        successRate: Number(c.success_rate) || 0,
        lastActionAt: c.last_action_at ? new Date(c.last_action_at) : undefined,
        nextActionAt: c.next_action_at ? new Date(c.next_action_at) : undefined,
      }));
    },
    enabled: !!user?.id,
  });

  const executionsQuery = useQuery({
    queryKey: ['agent-executions', profileId],
    queryFn: async (): Promise<AgentExecution[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(e => ({
        id: e.id,
        campaignId: e.campaign_id,
        agentType: e.agent_type as AgentExecution['agentType'],
        actionTaken: e.action_taken,
        actionParams: e.action_params as Record<string, unknown>,
        triggerReason: e.trigger_reason || '',
        contextSnapshot: e.context_snapshot as Record<string, unknown>,
        outcome: e.outcome as AgentExecution['outcome'],
        outcomeDetails: e.outcome_details as Record<string, unknown>,
        effectivenessScore: Number(e.effectiveness_score) || 0,
        costCents: e.cost_cents || 0,
        executionTimeMs: e.execution_time_ms || 0,
        executedAt: new Date(e.executed_at),
      }));
    },
    enabled: !!user?.id,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: Omit<AutonomousCampaign, 'id' | 'actionsToday' | 'totalActions' | 'successRate' | 'lastActionAt' | 'nextActionAt'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('autonomous_campaigns')
        .insert({
          user_id: user.id,
          profile_id: campaign.profileId,
          campaign_name: campaign.campaignName,
          campaign_type: campaign.campaignType,
          objective: campaign.objective,
          trigger_conditions: campaign.triggerConditions,
          execution_rules: campaign.executionRules,
          escalation_config: campaign.escalationConfig,
          success_criteria: campaign.successCriteria,
          current_phase: campaign.currentPhase,
          is_active: campaign.isActive,
          auto_execute: campaign.autoExecute,
          max_daily_actions: campaign.maxDailyActions,
        } as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autonomous-campaigns'] });
      // Track Phase 5 operation
      phaseMiddleware.recordSuccess(5, 'autonomous_campaign_created');
    },
  });

  const toggleCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, isActive }: { campaignId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('autonomous_campaigns')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autonomous-campaigns'] });
    },
  });

  const executeActionMutation = useMutation({
    mutationFn: async ({ campaignId, action, params }: { campaignId: string; action: string; params: Record<string, unknown> }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const startTime = Date.now();
      
      // Log execution
      const { error } = await supabase
        .from('agent_executions')
        .insert({
          user_id: user.id,
          campaign_id: campaignId,
          agent_type: 'influence',
          action_taken: action,
          action_params: params,
          trigger_reason: 'manual',
          context_snapshot: {},
          outcome: 'pending',
          execution_time_ms: Date.now() - startTime,
        } as never);

      if (error) throw error;

      // Update campaign stats
      await supabase
        .from('autonomous_campaigns')
        .update({
          last_action_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autonomous-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['agent-executions'] });
      // Track Phase 5 action execution
      phaseMiddleware.recordSuccess(5, 'autonomous_action_executed');
    },
  });

  // Computed stats
  const activeCampaigns = campaignsQuery.data?.filter(c => c.isActive) || [];
  const totalExecutions = executionsQuery.data?.length || 0;
  const successfulExecutions = executionsQuery.data?.filter(e => e.outcome === 'success').length || 0;
  const overallSuccessRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

  return {
    campaigns: campaignsQuery.data || [],
    executions: executionsQuery.data || [],
    isLoading: campaignsQuery.isLoading || executionsQuery.isLoading,
    error: campaignsQuery.error || executionsQuery.error,

    // Computed
    activeCampaigns,
    totalExecutions,
    successfulExecutions,
    overallSuccessRate,

    // Actions
    createCampaign: createCampaignMutation.mutateAsync,
    toggleCampaign: toggleCampaignMutation.mutateAsync,
    executeAction: executeActionMutation.mutateAsync,
  };
}
