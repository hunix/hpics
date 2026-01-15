import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface QuantumState {
  id: string;
  profileId?: string;
  superpositionStates: unknown[];
  probabilityAmplitudes: Record<string, number>;
  observationEffects: Record<string, unknown>;
  entangledProfiles: string[];
  coherenceDuration?: string;
  decoherenceFactors: unknown[];
  measurementStrategy: Record<string, unknown>;
  collapsedState?: Record<string, unknown>;
  collapsedAt?: Date;
  createdAt: Date;
}

export interface DimensionalOperation {
  id: string;
  operationName: string;
  dimensions: string[];
  dimensionWeights: Record<string, number>;
  crossDimensionalEffects: Record<string, unknown>;
  optimizationTarget: Record<string, unknown>;
  currentCoordinates: Record<string, number>;
  targetCoordinates: Record<string, number>;
  pathCalculation: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
}

export interface CollectiveField {
  id: string;
  fieldName: string;
  fieldType: string;
  memberProfiles: string[];
  fieldDynamics: Record<string, unknown>;
  collectiveBeliefs: unknown[];
  groupShadow: Record<string, unknown>;
  fieldStrength?: number;
  coherenceLevel?: number;
  interventionPoints: unknown[];
  fieldEvolutionTrajectory: Record<string, unknown>;
}

export function useQuantumInfluence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quantumStates = [], isLoading: statesLoading } = useQuery({
    queryKey: ['quantum-states', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('quantum_states')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(s => ({
        id: s.id,
        profileId: s.profile_id,
        superpositionStates: s.superposition_states as unknown[],
        probabilityAmplitudes: s.probability_amplitudes as Record<string, number>,
        observationEffects: s.observation_effects as Record<string, unknown>,
        entangledProfiles: (s.entangled_profiles as string[]) || [],
        coherenceDuration: s.coherence_duration,
        decoherenceFactors: s.decoherence_factors as unknown[],
        measurementStrategy: s.measurement_strategy as Record<string, unknown>,
        collapsedState: s.collapsed_state as Record<string, unknown> | undefined,
        collapsedAt: s.collapsed_at ? new Date(s.collapsed_at) : undefined,
        createdAt: new Date(s.created_at)
      })) as QuantumState[];
    },
    enabled: !!user?.id
  });

  const { data: dimensionalOps = [], isLoading: opsLoading } = useQuery({
    queryKey: ['dimensional-operations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('dimensional_operations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(o => ({
        id: o.id,
        operationName: o.operation_name,
        dimensions: (o.dimensions as string[]) || [],
        dimensionWeights: o.dimension_weights as Record<string, number>,
        crossDimensionalEffects: o.cross_dimensional_effects as Record<string, unknown>,
        optimizationTarget: o.optimization_target as Record<string, unknown>,
        currentCoordinates: o.current_coordinates as Record<string, number>,
        targetCoordinates: o.target_coordinates as Record<string, number>,
        pathCalculation: o.path_calculation as Record<string, unknown>,
        isActive: o.is_active ?? true,
        createdAt: new Date(o.created_at)
      })) as DimensionalOperation[];
    },
    enabled: !!user?.id
  });

  const { data: collectiveFields = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['collective-fields', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('collective_fields')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(f => ({
        id: f.id,
        fieldName: f.field_name,
        fieldType: f.field_type,
        memberProfiles: (f.member_profiles as string[]) || [],
        fieldDynamics: f.field_dynamics as Record<string, unknown>,
        collectiveBeliefs: f.collective_beliefs as unknown[],
        groupShadow: f.group_shadow as Record<string, unknown>,
        fieldStrength: f.field_strength ? Number(f.field_strength) : undefined,
        coherenceLevel: f.coherence_level ? Number(f.coherence_level) : undefined,
        interventionPoints: f.intervention_points as unknown[],
        fieldEvolutionTrajectory: f.field_evolution_trajectory as Record<string, unknown>
      })) as CollectiveField[];
    },
    enabled: !!user?.id
  });

  const createQuantumState = useMutation({
    mutationFn: async (data: Partial<QuantumState>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('quantum_states').insert({
        user_id: user.id,
        profile_id: data.profileId,
        superposition_states: data.superpositionStates || [],
        probability_amplitudes: data.probabilityAmplitudes || {},
        entangled_profiles: data.entangledProfiles || []
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quantum-states'] })
  });

  const collapseState = useMutation({
    mutationFn: async ({ stateId, collapsedState }: { stateId: string; collapsedState: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('quantum_states')
        .update({ 
          collapsed_state: collapsedState, 
          collapsed_at: new Date().toISOString() 
        } as never)
        .eq('id', stateId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quantum-states'] })
  });

  const uncollapsedStates = useMemo(() => 
    quantumStates.filter(s => !s.collapsedAt), [quantumStates]);

  const stats = useMemo(() => ({
    activeQuantumStates: uncollapsedStates.length,
    dimensionalOperations: dimensionalOps.length,
    collectiveFields: collectiveFields.length,
    totalEntanglements: quantumStates.reduce((sum, s) => sum + s.entangledProfiles.length, 0),
    avgFieldStrength: collectiveFields.length > 0
      ? collectiveFields.reduce((sum, f) => sum + (f.fieldStrength || 0), 0) / collectiveFields.length
      : 0
  }), [uncollapsedStates, dimensionalOps, collectiveFields, quantumStates]);

  return {
    quantumStates: uncollapsedStates,
    dimensionalOperations: dimensionalOps,
    collectiveFields,
    isLoading: statesLoading || opsLoading || fieldsLoading,
    createQuantumState,
    collapseState,
    stats
  };
}
