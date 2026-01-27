/**
 * Quantum Cognition Hook (v9.0)
 * 
 * React hooks for quantum-like decision modeling and mental entanglement detection.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface QuantumDecisionState {
  id: string;
  profileId: string;
  stateVector: number[];
  interferenceEffects: Record<string, unknown>;
  orderEffects: Record<string, unknown>;
  qqEqualityResult: Record<string, unknown>;
  measurementContext: string;
  createdAt: string;
}

export interface EntanglementResult {
  id: string;
  profileIds: string[];
  correlationStrength: number;
  bellInequalityViolation: number;
  sharedDecisionPatterns: string[];
  createdAt: string;
}

export function useQuantumCognition(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: decisionStates, isLoading: statesLoading } = useQuery({
    queryKey: ['quantum-decision-states', profileId],
    queryFn: async () => {
      let query = supabase
        .from('quantum_decision_states')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        profileId: row.profile_id as string,
        stateVector: (row.state_vector || []) as number[],
        interferenceEffects: (row.interference_effects || {}) as Record<string, unknown>,
        orderEffects: (row.order_effects || {}) as Record<string, unknown>,
        qqEqualityResult: (row.qq_equality_result || {}) as Record<string, unknown>,
        measurementContext: (row.measurement_context || '') as string,
        createdAt: row.created_at as string
      })) as QuantumDecisionState[];
    },
    enabled: !!user,
  });

  const { data: entanglements, isLoading: entanglementsLoading } = useQuery({
    queryKey: ['mental-entanglements', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('analysis_type', 'mental_entanglement')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => {
        const results = (row.analysis_results || {}) as Record<string, unknown>;
        return {
          id: row.id as string,
          profileIds: (results.profileIds || []) as string[],
          correlationStrength: (results.correlationStrength || 0) as number,
          bellInequalityViolation: (results.bellViolation || 0) as number,
          sharedDecisionPatterns: (results.sharedPatterns || []) as string[],
          createdAt: row.created_at as string
        };
      }) as EntanglementResult[];
    },
    enabled: !!user,
  });

  const modelQuantumState = useMutation({
    mutationFn: async (input: {
      profileId: string;
      decisionContext: string;
      previousChoices?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('quantum-decision-modeler', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          decisionContext: input.decisionContext,
          previousChoices: input.previousChoices || []
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum-decision-states'] });
    }
  });

  const detectEntanglement = useMutation({
    mutationFn: async (input: { profileIds: string[] }) => {
      const { data, error } = await supabase.functions.invoke('mental-entanglement-detector', {
        body: {
          userId: user!.id,
          profileIds: input.profileIds
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mental-entanglements'] });
    }
  });

  const testQQEquality = useMutation({
    mutationFn: async (input: {
      profileId: string;
      questionPairs: [string, string][];
    }) => {
      const { data, error } = await supabase.functions.invoke('qq-equality-tester', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          questionPairs: input.questionPairs
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum-decision-states'] });
    }
  });

  const strongEntanglements = entanglements?.filter(e => e.bellInequalityViolation > 2) || [];
  const quantumLikeDeciders = decisionStates?.filter(s => 
    Object.keys(s.interferenceEffects).length > 0
  ) || [];

  // Transform decision states to superposition format for backward compatibility
  const superpositions = decisionStates?.map(s => ({
    id: s.id,
    userId: user?.id || '',
    profileId: s.profileId,
    superpositionStates: s.stateVector.map((v, i) => ({ index: i, amplitude: v })),
    collapseProbability: s.stateVector.reduce((max, v) => Math.max(max, Math.abs(v)), 0),
    interferencePatterns: s.interferenceEffects,
    entanglementPartners: [],
    quantumSignature: s.measurementContext,
    analysisType: 'superposition',
    createdAt: s.createdAt
  })) || [];

  return {
    decisionStates,
    superpositions, // Alias for backward compatibility
    entanglements,
    strongEntanglements,
    quantumLikeDeciders,
    isLoading: statesLoading || entanglementsLoading,
    modelQuantumState: modelQuantumState.mutateAsync,
    detectEntanglement: detectEntanglement.mutateAsync,
    testQQEquality: testQQEquality.mutateAsync,
    isModeling: modelQuantumState.isPending,
    isDetectingEntanglement: detectEntanglement.isPending,
    analyzeQuantumState: modelQuantumState.mutateAsync, // Alias
    isAnalyzing: modelQuantumState.isPending // Alias
  };
}
