import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConsciousnessIntegration {
  id: string;
  integrationType: string;
  humanInputStream: Record<string, unknown>;
  machineAnalysis: Record<string, unknown>;
  synthesisOutput: Record<string, unknown>;
  coherenceScore: number;
  latencyMs: number;
  enhancementMetrics: Record<string, number>;
  sessionDurationSeconds: number;
  createdAt: string;
}

export interface StrategicOmnipotence {
  id: string;
  strategyName: string;
  objectiveHierarchy: Array<{ level: number; objective: string; weight: number }>;
  resourceAllocation: Record<string, number>;
  executionTimeline: Array<{ phase: string; start: string; end: string }>;
  contingencyBranches: Array<{ trigger: string; action: string }>;
  successProbability: number;
  riskAssessment: Record<string, unknown>;
  powerProjection: Record<string, number>;
  status: string;
  outcome?: Record<string, unknown>;
}

export function useConsciousnessIntegration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['consciousness-integration', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consciousness_integration')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        integrationType: row.integration_type,
        humanInputStream: row.human_input_stream as Record<string, unknown>,
        machineAnalysis: row.machine_analysis as Record<string, unknown>,
        synthesisOutput: row.synthesis_output as Record<string, unknown>,
        coherenceScore: Number(row.coherence_score),
        latencyMs: row.latency_ms,
        enhancementMetrics: row.enhancement_metrics as Record<string, number>,
        sessionDurationSeconds: row.session_duration_seconds,
        createdAt: row.created_at
      })) as ConsciousnessIntegration[];
    },
    enabled: !!user?.id
  });

  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['strategic-omnipotence', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_omnipotence')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        strategyName: row.strategy_name,
        objectiveHierarchy: row.objective_hierarchy as StrategicOmnipotence['objectiveHierarchy'],
        resourceAllocation: row.resource_allocation as Record<string, number>,
        executionTimeline: row.execution_timeline as StrategicOmnipotence['executionTimeline'],
        contingencyBranches: row.contingency_branches as StrategicOmnipotence['contingencyBranches'],
        successProbability: Number(row.success_probability),
        riskAssessment: row.risk_assessment as Record<string, unknown>,
        powerProjection: row.power_projection as Record<string, number>,
        status: row.status,
        outcome: row.outcome as Record<string, unknown>
      })) as StrategicOmnipotence[];
    },
    enabled: !!user?.id
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async (integration: Partial<ConsciousnessIntegration>) => {
      const { data, error } = await supabase
        .from('consciousness_integration')
        .insert({
          user_id: user?.id,
          integration_type: integration.integrationType,
          human_input_stream: integration.humanInputStream,
          machine_analysis: integration.machineAnalysis,
          synthesis_output: integration.synthesisOutput,
          coherence_score: integration.coherenceScore,
          latency_ms: integration.latencyMs,
          enhancement_metrics: integration.enhancementMetrics,
          session_duration_seconds: integration.sessionDurationSeconds
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consciousness-integration'] })
  });

  const createStrategyMutation = useMutation({
    mutationFn: async (strategy: Partial<StrategicOmnipotence>) => {
      const { data, error } = await supabase
        .from('strategic_omnipotence')
        .insert({
          user_id: user?.id,
          strategy_name: strategy.strategyName,
          objective_hierarchy: strategy.objectiveHierarchy,
          resource_allocation: strategy.resourceAllocation,
          execution_timeline: strategy.executionTimeline,
          contingency_branches: strategy.contingencyBranches,
          success_probability: strategy.successProbability,
          risk_assessment: strategy.riskAssessment,
          power_projection: strategy.powerProjection
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategic-omnipotence'] })
  });

  return {
    integrations,
    strategies,
    isLoading: integrationsLoading || strategiesLoading,
    createIntegration: createIntegrationMutation.mutateAsync,
    createStrategy: createStrategyMutation.mutateAsync,
    avgCoherence: integrations.reduce((sum, i) => sum + i.coherenceScore, 0) / Math.max(integrations.length, 1),
    avgLatency: integrations.reduce((sum, i) => sum + i.latencyMs, 0) / Math.max(integrations.length, 1),
    activeStrategies: strategies.filter(s => s.status === 'active' || s.status === 'executing').length,
    avgSuccessProbability: strategies.reduce((sum, s) => sum + s.successProbability, 0) / Math.max(strategies.length, 1)
  };
}
