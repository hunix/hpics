import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TranscendenceOperation {
  id: string;
  operationType: string;
  operationScope: string;
  targetEntities: string[];
  initialState: Record<string, unknown>;
  targetState: Record<string, unknown>;
  transformationVector: Record<string, unknown>;
  resistanceEncountered: unknown[];
  breakthroughMoments: unknown[];
  currentState: Record<string, unknown>;
  completionPercentage: number;
  successMetrics: Record<string, unknown>;
  lessonsLearned: unknown[];
  startedAt: Date;
  completedAt?: Date;
  isActive: boolean;
}

export interface MetaPattern {
  id: string;
  patternName: string;
  abstractionLevel: number;
  constituentPatterns: unknown[];
  manifestationContexts: unknown[];
  predictionPower?: number;
  manipulationLeverage?: number;
  discoveryMethod?: string;
  validationEvidence: unknown[];
  discoveredAt: Date;
  lastValidatedAt?: Date;
}

export function useTranscendentOperations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: operations = [], isLoading: operationsLoading } = useQuery({
    queryKey: ['transcendence-operations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transcendence_operations')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(o => ({
        id: o.id,
        operationType: o.operation_type,
        operationScope: o.operation_scope,
        targetEntities: (o.target_entities as string[]) || [],
        initialState: o.initial_state as Record<string, unknown>,
        targetState: o.target_state as Record<string, unknown>,
        transformationVector: o.transformation_vector as Record<string, unknown>,
        resistanceEncountered: o.resistance_encountered as unknown[],
        breakthroughMoments: o.breakthrough_moments as unknown[],
        currentState: o.current_state as Record<string, unknown>,
        completionPercentage: Number(o.completion_percentage) || 0,
        successMetrics: o.success_metrics as Record<string, unknown>,
        lessonsLearned: o.lessons_learned as unknown[],
        startedAt: new Date(o.started_at),
        completedAt: o.completed_at ? new Date(o.completed_at) : undefined,
        isActive: o.is_active ?? true
      })) as TranscendenceOperation[];
    },
    enabled: !!user?.id
  });

  const { data: metaPatterns = [], isLoading: patternsLoading } = useQuery({
    queryKey: ['meta-patterns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('meta_patterns')
        .select('*')
        .eq('user_id', user.id)
        .order('abstraction_level', { ascending: false });
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        patternName: p.pattern_name,
        abstractionLevel: p.abstraction_level || 1,
        constituentPatterns: p.constituent_patterns as unknown[],
        manifestationContexts: p.manifestation_contexts as unknown[],
        predictionPower: p.prediction_power ? Number(p.prediction_power) : undefined,
        manipulationLeverage: p.manipulation_leverage ? Number(p.manipulation_leverage) : undefined,
        discoveryMethod: p.discovery_method,
        validationEvidence: p.validation_evidence as unknown[],
        discoveredAt: new Date(p.discovered_at),
        lastValidatedAt: p.last_validated_at ? new Date(p.last_validated_at) : undefined
      })) as MetaPattern[];
    },
    enabled: !!user?.id
  });

  const createOperation = useMutation({
    mutationFn: async (data: Partial<TranscendenceOperation>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('transcendence_operations').insert({
        user_id: user.id,
        operation_type: data.operationType,
        operation_scope: data.operationScope || 'individual',
        target_entities: data.targetEntities || [],
        initial_state: data.initialState || {},
        target_state: data.targetState || {}
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transcendence-operations'] })
  });

  const updateOperationProgress = useMutation({
    mutationFn: async ({ operationId, progress, currentState }: { 
      operationId: string; 
      progress: number; 
      currentState?: Record<string, unknown> 
    }) => {
      const update: Record<string, unknown> = { completion_percentage: progress };
      if (currentState) update.current_state = currentState;
      if (progress >= 100) update.completed_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('transcendence_operations')
        .update(update as never)
        .eq('id', operationId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transcendence-operations'] })
  });

  const recordMetaPattern = useMutation({
    mutationFn: async (data: Partial<MetaPattern>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('meta_patterns').insert({
        user_id: user.id,
        pattern_name: data.patternName,
        abstraction_level: data.abstractionLevel || 1,
        constituent_patterns: data.constituentPatterns || [],
        prediction_power: data.predictionPower,
        manipulation_leverage: data.manipulationLeverage,
        discovery_method: data.discoveryMethod
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meta-patterns'] })
  });

  const activeOperations = useMemo(() => 
    operations.filter(o => o.isActive && !o.completedAt), [operations]);

  const highLevelPatterns = useMemo(() => 
    metaPatterns.filter(p => p.abstractionLevel >= 3), [metaPatterns]);

  const stats = useMemo(() => ({
    activeOperations: activeOperations.length,
    completedOperations: operations.filter(o => o.completedAt).length,
    metaPatternsDiscovered: metaPatterns.length,
    highLevelPatterns: highLevelPatterns.length,
    avgCompletionRate: activeOperations.length > 0
      ? activeOperations.reduce((sum, o) => sum + o.completionPercentage, 0) / activeOperations.length
      : 0,
    avgPredictionPower: metaPatterns.length > 0
      ? metaPatterns.reduce((sum, p) => sum + (p.predictionPower || 0), 0) / metaPatterns.length
      : 0
  }), [operations, activeOperations, metaPatterns, highLevelPatterns]);

  return {
    operations: activeOperations,
    completedOperations: operations.filter(o => o.completedAt),
    metaPatterns,
    highLevelPatterns,
    isLoading: operationsLoading || patternsLoading,
    createOperation,
    updateOperationProgress,
    recordMetaPattern,
    stats
  };
}
