// Addiction Protocol Hook - Reinforcement schedule tracking and dependency formation

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AddictionProtocol {
  id: string;
  profileId: string;
  protocolName: string;
  addictionType: 'attention' | 'validation' | 'information' | 'emotional' | 'financial' | 'social';
  reinforcementSchedule: {
    type: 'fixed_ratio' | 'variable_ratio' | 'fixed_interval' | 'variable_interval';
    ratio?: number;
    intervalMinutes?: number;
    variability?: number;
  };
  currentPhase: 'initiation' | 'escalation' | 'maintenance' | 'withdrawal_test' | 'reinforcement';
  dopamineCycleMapping: {
    anticipation: number;
    reward: number;
    satisfaction: number;
    craving: number;
  };
  complianceMetrics: {
    responseRate: number;
    latencySeconds: number;
    initiationRate: number;
    withdrawalDistress: number;
  };
  variableRatioConfig: {
    minResponses: number;
    maxResponses: number;
    currentTarget: number;
  };
  intermittentReinforcementScore: number;
  dependencyProgression: Array<{
    date: string;
    dependencyLevel: number;
    notes: string;
  }>;
  withdrawalTiming: {
    optimalDurationHours: number;
    maxDurationHours: number;
    anxietyPeakHours: number;
  };
  lastReinforcementAt: string | null;
  nextScheduledAt: string | null;
  effectivenessScore: number;
}

export function useAddictionProtocol(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch protocols for a profile
  const protocolsQuery = useQuery({
    queryKey: ['addiction-protocols', profileId, user?.id],
    queryFn: async (): Promise<AddictionProtocol[]> => {
      if (!user?.id || !profileId) return [];
      
      const { data, error } = await supabase
        .from('addiction_protocols')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('effectiveness_score', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        profileId: row.profile_id || '',
        protocolName: row.protocol_name,
        addictionType: row.addiction_type as AddictionProtocol['addictionType'],
        reinforcementSchedule: (row.reinforcement_schedule as AddictionProtocol['reinforcementSchedule']) || { type: 'variable_ratio' },
        currentPhase: row.current_phase as AddictionProtocol['currentPhase'],
        dopamineCycleMapping: (row.dopamine_cycle_mapping as AddictionProtocol['dopamineCycleMapping']) || { anticipation: 0, reward: 0, satisfaction: 0, craving: 0 },
        complianceMetrics: (row.compliance_metrics as AddictionProtocol['complianceMetrics']) || { responseRate: 0, latencySeconds: 0, initiationRate: 0, withdrawalDistress: 0 },
        variableRatioConfig: (row.variable_ratio_config as AddictionProtocol['variableRatioConfig']) || { minResponses: 1, maxResponses: 5, currentTarget: 3 },
        intermittentReinforcementScore: Number(row.intermittent_reinforcement_score) || 0,
        dependencyProgression: (row.dependency_progression as AddictionProtocol['dependencyProgression']) || [],
        withdrawalTiming: (row.withdrawal_timing as AddictionProtocol['withdrawalTiming']) || { optimalDurationHours: 24, maxDurationHours: 72, anxietyPeakHours: 48 },
        lastReinforcementAt: row.last_reinforcement_at,
        nextScheduledAt: row.next_scheduled_at,
        effectivenessScore: Number(row.effectiveness_score) || 0,
      }));
    },
    enabled: !!user?.id && !!profileId,
  });

  // Create protocol mutation
  const createProtocolMutation = useMutation({
    mutationFn: async (params: {
      profileId: string;
      protocolName: string;
      addictionType: AddictionProtocol['addictionType'];
      reinforcementSchedule?: AddictionProtocol['reinforcementSchedule'];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('addiction_protocols')
        .insert({
          user_id: user.id,
          profile_id: params.profileId,
          protocol_name: params.protocolName,
          addiction_type: params.addictionType,
          reinforcement_schedule: params.reinforcementSchedule || { type: 'variable_ratio', ratio: 3, variability: 0.5 },
          current_phase: 'initiation',
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addiction-protocols'] });
      toast.success('Addiction protocol created');
    },
    onError: (error) => {
      toast.error(`Failed to create protocol: ${error.message}`);
    },
  });

  // Record reinforcement event
  const recordReinforcementMutation = useMutation({
    mutationFn: async (params: {
      protocolId: string;
      responseLatencySeconds: number;
      wasInitiatedByTarget: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Get current protocol
      const { data: current, error: fetchError } = await supabase
        .from('addiction_protocols')
        .select('*')
        .eq('id', params.protocolId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentMetrics = (current?.compliance_metrics as AddictionProtocol['complianceMetrics']) || { responseRate: 0, latencySeconds: 0, initiationRate: 0, withdrawalDistress: 0 };
      const schedule = (current?.reinforcement_schedule as AddictionProtocol['reinforcementSchedule']) || { type: 'variable_ratio' };
      
      // Update metrics with exponential moving average
      const newMetrics = {
        responseRate: currentMetrics.responseRate * 0.9 + 0.1,
        latencySeconds: currentMetrics.latencySeconds * 0.8 + params.responseLatencySeconds * 0.2,
        initiationRate: currentMetrics.initiationRate * 0.9 + (params.wasInitiatedByTarget ? 0.1 : 0),
        withdrawalDistress: currentMetrics.withdrawalDistress,
      };
      
      // Calculate next scheduled time based on schedule type
      let nextScheduled: Date | null = null;
      if (schedule.type === 'variable_interval' && schedule.intervalMinutes) {
        const variance = schedule.variability || 0.3;
        const randomFactor = 1 + (Math.random() * 2 - 1) * variance;
        nextScheduled = new Date(Date.now() + schedule.intervalMinutes * randomFactor * 60 * 1000);
      } else if (schedule.type === 'fixed_interval' && schedule.intervalMinutes) {
        nextScheduled = new Date(Date.now() + schedule.intervalMinutes * 60 * 1000);
      }
      
      // Record progression
      const progression = (current?.dependency_progression as AddictionProtocol['dependencyProgression']) || [];
      progression.push({
        date: new Date().toISOString(),
        dependencyLevel: newMetrics.responseRate * 0.4 + newMetrics.initiationRate * 0.6,
        notes: `Latency: ${params.responseLatencySeconds}s, Initiated: ${params.wasInitiatedByTarget}`,
      });
      
      const { data, error } = await supabase
        .from('addiction_protocols')
        .update({
          compliance_metrics: newMetrics,
          dependency_progression: progression.slice(-100), // Keep last 100 entries
          last_reinforcement_at: new Date().toISOString(),
          next_scheduled_at: nextScheduled?.toISOString(),
          effectiveness_score: (newMetrics.responseRate + newMetrics.initiationRate) / 2,
        } as never)
        .eq('id', params.protocolId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addiction-protocols'] });
    },
  });

  // Advance protocol phase
  const advancePhaseMutation = useMutation({
    mutationFn: async (params: { protocolId: string; newPhase: AddictionProtocol['currentPhase'] }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('addiction_protocols')
        .update({ current_phase: params.newPhase } as never)
        .eq('id', params.protocolId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addiction-protocols'] });
      toast.success('Protocol phase advanced');
    },
  });

  // Calculate optimal variable ratio for maximum addiction
  const calculateOptimalRatio = (metrics: AddictionProtocol['complianceMetrics']): number => {
    // Variable ratio schedules are most addictive when unpredictable
    // Optimal ratio is inversely related to current response rate
    const baseRatio = 3;
    const adjustment = (1 - metrics.responseRate) * 2;
    return Math.max(1, Math.min(10, baseRatio + adjustment));
  };

  // Calculate withdrawal timing for maximum anxiety
  const calculateWithdrawalTiming = (protocol: AddictionProtocol): {
    optimalStart: Date;
    anxietyPeak: Date;
    maxDuration: Date;
  } => {
    const now = new Date();
    const { withdrawalTiming } = protocol;
    
    return {
      optimalStart: new Date(now.getTime() + withdrawalTiming.optimalDurationHours * 60 * 60 * 1000),
      anxietyPeak: new Date(now.getTime() + withdrawalTiming.anxietyPeakHours * 60 * 60 * 1000),
      maxDuration: new Date(now.getTime() + withdrawalTiming.maxDurationHours * 60 * 60 * 1000),
    };
  };

  // Get protocols due for reinforcement
  const getDueProtocols = (): AddictionProtocol[] => {
    const protocols = protocolsQuery.data || [];
    const now = new Date();
    
    return protocols.filter(p => {
      if (!p.nextScheduledAt) return false;
      return new Date(p.nextScheduledAt) <= now;
    });
  };

  return {
    protocols: protocolsQuery.data || [],
    isLoading: protocolsQuery.isLoading,
    dueProtocols: getDueProtocols(),
    createProtocol: createProtocolMutation.mutate,
    isCreating: createProtocolMutation.isPending,
    recordReinforcement: recordReinforcementMutation.mutate,
    advancePhase: advancePhaseMutation.mutate,
    calculateOptimalRatio,
    calculateWithdrawalTiming,
  };
}
