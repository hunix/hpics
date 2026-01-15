import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TranscendentOperation {
  id: string;
  operationName: string;
  operationType: string;
  consciousnessLevel: string;
  targetProfiles: string[];
  strategicObjectives: Array<{ objective: string; priority: number; status: string }>;
  executionMatrix: Record<string, unknown>;
  realityModifications: Array<{ modification: string; intensity: number }>;
  probabilityManipulation: Record<string, number>;
  successProbability: number;
  status: string;
  initiatedAt?: string;
  completedAt?: string;
  outcome?: Record<string, unknown>;
}

export interface UltimateSynthesis {
  id: string;
  synthesisName: string;
  phaseIntegration: Record<string, number>;
  crossDomainFusion: Array<{ domains: string[]; synergyScore: number }>;
  emergentCapabilities: Array<{ capability: string; power: number }>;
  synergyMultipliers: Record<string, number>;
  totalPowerScore: number;
  evolutionStage: string;
  nextEvolutionThreshold: number;
}

export function useUltimateTranscendence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: operations = [], isLoading: operationsLoading } = useQuery({
    queryKey: ['transcendent-operations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcendent_operations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        operationName: row.operation_name,
        operationType: row.operation_type,
        consciousnessLevel: row.consciousness_level,
        targetProfiles: row.target_profiles || [],
        strategicObjectives: row.strategic_objectives as TranscendentOperation['strategicObjectives'],
        executionMatrix: row.execution_matrix as Record<string, unknown>,
        realityModifications: row.reality_modifications as TranscendentOperation['realityModifications'],
        probabilityManipulation: row.probability_manipulation as Record<string, number>,
        successProbability: Number(row.success_probability),
        status: row.status,
        initiatedAt: row.initiated_at,
        completedAt: row.completed_at,
        outcome: row.outcome as Record<string, unknown>
      })) as TranscendentOperation[];
    },
    enabled: !!user?.id
  });

  const { data: syntheses = [], isLoading: synthesisLoading } = useQuery({
    queryKey: ['ultimate-synthesis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ultimate_synthesis')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        synthesisName: row.synthesis_name,
        phaseIntegration: row.phase_integration as Record<string, number>,
        crossDomainFusion: row.cross_domain_fusion as UltimateSynthesis['crossDomainFusion'],
        emergentCapabilities: row.emergent_capabilities as UltimateSynthesis['emergentCapabilities'],
        synergyMultipliers: row.synergy_multipliers as Record<string, number>,
        totalPowerScore: Number(row.total_power_score),
        evolutionStage: row.evolution_stage,
        nextEvolutionThreshold: Number(row.next_evolution_threshold)
      })) as UltimateSynthesis[];
    },
    enabled: !!user?.id
  });

  const createOperationMutation = useMutation({
    mutationFn: async (op: Partial<TranscendentOperation>) => {
      const { data, error } = await supabase
        .from('transcendent_operations')
        .insert({
          user_id: user?.id,
          operation_name: op.operationName,
          operation_type: op.operationType,
          consciousness_level: op.consciousnessLevel,
          target_profiles: op.targetProfiles,
          strategic_objectives: op.strategicObjectives,
          execution_matrix: op.executionMatrix,
          reality_modifications: op.realityModifications,
          probability_manipulation: op.probabilityManipulation,
          success_probability: op.successProbability
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transcendent-operations'] })
  });

  const createSynthesisMutation = useMutation({
    mutationFn: async (synth: Partial<UltimateSynthesis>) => {
      const { data, error } = await supabase
        .from('ultimate_synthesis')
        .insert({
          user_id: user?.id,
          synthesis_name: synth.synthesisName,
          phase_integration: synth.phaseIntegration,
          cross_domain_fusion: synth.crossDomainFusion,
          emergent_capabilities: synth.emergentCapabilities,
          synergy_multipliers: synth.synergyMultipliers,
          total_power_score: synth.totalPowerScore,
          evolution_stage: synth.evolutionStage,
          next_evolution_threshold: synth.nextEvolutionThreshold
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ultimate-synthesis'] })
  });

  return {
    operations,
    syntheses,
    isLoading: operationsLoading || synthesisLoading,
    createOperation: createOperationMutation.mutateAsync,
    createSynthesis: createSynthesisMutation.mutateAsync,
    activeOperations: operations.filter(o => o.status === 'active' || o.status === 'executing').length,
    avgSuccessProbability: operations.reduce((sum, o) => sum + o.successProbability, 0) / Math.max(operations.length, 1),
    totalPower: syntheses.reduce((sum, s) => sum + s.totalPowerScore, 0),
    maxEvolutionStage: syntheses.length > 0 ? Math.max(...syntheses.map(s => ['emerging', 'developing', 'advanced', 'transcendent', 'absolute'].indexOf(s.evolutionStage))) : 0
  };
}
