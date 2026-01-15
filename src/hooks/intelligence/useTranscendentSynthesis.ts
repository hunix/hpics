import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TranscendentSynthesis {
  id: string;
  profileId?: string;
  synthesisDomain: string;
  inputStreams: Array<{ stream: string; weight: number }>;
  fusionAlgorithm?: string;
  outputInsights: Array<{ insight: string; confidence: number }>;
  coherenceLevel: number;
  synthesisDepth: number;
  emergentPatterns: Array<{ pattern: string; strength: number }>;
  predictionHorizonDays: number;
  accuracyMetrics: Record<string, number>;
  createdAt: string;
}

export interface UltimateOrchestration {
  id: string;
  orchestrationName: string;
  componentSystems: Array<{ system: string; status: string }>;
  synchronizationRules: Record<string, unknown>;
  executionOrder: Array<{ step: number; action: string }>;
  conflictResolution: Record<string, unknown>;
  optimizationTargets: Array<{ target: string; current: number; goal: number }>;
  performanceScore: number;
  latencyMs: number;
  status: string;
  lastOrchestrationAt: string;
}

export function useTranscendentSynthesis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: syntheses = [], isLoading: synthesisLoading } = useQuery({
    queryKey: ['transcendent-synthesis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcendent_synthesis')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        profileId: row.profile_id,
        synthesisDomain: row.synthesis_domain,
        inputStreams: row.input_streams as TranscendentSynthesis['inputStreams'],
        fusionAlgorithm: row.fusion_algorithm,
        outputInsights: row.output_insights as TranscendentSynthesis['outputInsights'],
        coherenceLevel: Number(row.coherence_level),
        synthesisDepth: row.synthesis_depth,
        emergentPatterns: row.emergent_patterns as TranscendentSynthesis['emergentPatterns'],
        predictionHorizonDays: row.prediction_horizon_days,
        accuracyMetrics: row.accuracy_metrics as Record<string, number>,
        createdAt: row.created_at
      })) as TranscendentSynthesis[];
    },
    enabled: !!user?.id
  });

  const { data: orchestrations = [], isLoading: orchestrationLoading } = useQuery({
    queryKey: ['ultimate-orchestration', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ultimate_orchestration')
        .select('*')
        .eq('user_id', user?.id)
        .order('performance_score', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        orchestrationName: row.orchestration_name,
        componentSystems: row.component_systems as UltimateOrchestration['componentSystems'],
        synchronizationRules: row.synchronization_rules as Record<string, unknown>,
        executionOrder: row.execution_order as UltimateOrchestration['executionOrder'],
        conflictResolution: row.conflict_resolution as Record<string, unknown>,
        optimizationTargets: row.optimization_targets as UltimateOrchestration['optimizationTargets'],
        performanceScore: Number(row.performance_score),
        latencyMs: row.latency_ms,
        status: row.status,
        lastOrchestrationAt: row.last_orchestration_at
      })) as UltimateOrchestration[];
    },
    enabled: !!user?.id
  });

  const createSynthesisMutation = useMutation({
    mutationFn: async (synthesis: Partial<TranscendentSynthesis>) => {
      const { data, error } = await supabase
        .from('transcendent_synthesis')
        .insert({
          user_id: user?.id,
          profile_id: synthesis.profileId,
          synthesis_domain: synthesis.synthesisDomain,
          input_streams: synthesis.inputStreams,
          fusion_algorithm: synthesis.fusionAlgorithm,
          output_insights: synthesis.outputInsights,
          coherence_level: synthesis.coherenceLevel,
          synthesis_depth: synthesis.synthesisDepth,
          emergent_patterns: synthesis.emergentPatterns,
          prediction_horizon_days: synthesis.predictionHorizonDays
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transcendent-synthesis'] })
  });

  const createOrchestrationMutation = useMutation({
    mutationFn: async (orch: Partial<UltimateOrchestration>) => {
      const { data, error } = await supabase
        .from('ultimate_orchestration')
        .insert({
          user_id: user?.id,
          orchestration_name: orch.orchestrationName,
          component_systems: orch.componentSystems,
          synchronization_rules: orch.synchronizationRules,
          execution_order: orch.executionOrder,
          conflict_resolution: orch.conflictResolution,
          optimization_targets: orch.optimizationTargets
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ultimate-orchestration'] })
  });

  return {
    syntheses,
    orchestrations,
    isLoading: synthesisLoading || orchestrationLoading,
    createSynthesis: createSynthesisMutation.mutateAsync,
    createOrchestration: createOrchestrationMutation.mutateAsync,
    avgCoherence: syntheses.reduce((s, syn) => s + syn.coherenceLevel, 0) / Math.max(syntheses.length, 1),
    totalInsights: syntheses.reduce((s, syn) => s + syn.outputInsights.length, 0),
    activeOrchestrations: orchestrations.filter(o => o.status === 'active').length,
    avgPerformance: orchestrations.reduce((s, o) => s + o.performanceScore, 0) / Math.max(orchestrations.length, 1)
  };
}
