import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PredictiveSupremacy {
  id: string;
  profileId?: string;
  predictionDomain: string;
  predictionType: string;
  timeHorizonHours: number;
  probabilityDistribution: Record<string, number>;
  confidenceInterval: { lower: number; upper: number };
  causalChain: Array<{ event: string; probability: number }>;
  interventionPoints: Array<{ point: string; leverage: number }>;
  accuracyHistory: Array<{ date: string; accuracy: number }>;
  validatedAt?: string;
  actualOutcome?: Record<string, unknown>;
  createdAt: string;
}

export interface UnifiedControlMatrix {
  id: string;
  matrixName: string;
  controlNodes: Array<{ nodeId: string; type: string; status: string }>;
  influenceVectors: Array<{ from: string; to: string; strength: number }>;
  feedbackLoops: Array<{ loopId: string; type: string; stability: number }>;
  systemState: Record<string, unknown>;
  optimizationTargets: Array<{ target: string; current: number; goal: number }>;
  constraintViolations: Array<{ constraint: string; severity: number }>;
  efficiencyScore: number;
  isActive: boolean;
  lastOptimizationAt: string;
}

export function usePredictiveSupremacy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: predictions = [], isLoading: predictionsLoading } = useQuery({
    queryKey: ['predictive-supremacy', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictive_supremacy')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        profileId: row.profile_id,
        predictionDomain: row.prediction_domain,
        predictionType: row.prediction_type,
        timeHorizonHours: row.time_horizon_hours,
        probabilityDistribution: row.probability_distribution as Record<string, number>,
        confidenceInterval: row.confidence_interval as PredictiveSupremacy['confidenceInterval'],
        causalChain: row.causal_chain as PredictiveSupremacy['causalChain'],
        interventionPoints: row.intervention_points as PredictiveSupremacy['interventionPoints'],
        accuracyHistory: row.accuracy_history as PredictiveSupremacy['accuracyHistory'],
        validatedAt: row.validated_at,
        actualOutcome: row.actual_outcome as Record<string, unknown>,
        createdAt: row.created_at
      })) as PredictiveSupremacy[];
    },
    enabled: !!user?.id
  });

  const { data: matrices = [], isLoading: matricesLoading } = useQuery({
    queryKey: ['unified-control-matrix', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_control_matrix')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        matrixName: row.matrix_name,
        controlNodes: row.control_nodes as UnifiedControlMatrix['controlNodes'],
        influenceVectors: row.influence_vectors as UnifiedControlMatrix['influenceVectors'],
        feedbackLoops: row.feedback_loops as UnifiedControlMatrix['feedbackLoops'],
        systemState: row.system_state as Record<string, unknown>,
        optimizationTargets: row.optimization_targets as UnifiedControlMatrix['optimizationTargets'],
        constraintViolations: row.constraint_violations as UnifiedControlMatrix['constraintViolations'],
        efficiencyScore: Number(row.efficiency_score),
        isActive: row.is_active,
        lastOptimizationAt: row.last_optimization_at
      })) as UnifiedControlMatrix[];
    },
    enabled: !!user?.id
  });

  const createPredictionMutation = useMutation({
    mutationFn: async (prediction: Partial<PredictiveSupremacy>) => {
      const { data, error } = await supabase
        .from('predictive_supremacy')
        .insert({
          user_id: user?.id,
          profile_id: prediction.profileId,
          prediction_domain: prediction.predictionDomain,
          prediction_type: prediction.predictionType,
          time_horizon_hours: prediction.timeHorizonHours,
          probability_distribution: prediction.probabilityDistribution,
          confidence_interval: prediction.confidenceInterval,
          causal_chain: prediction.causalChain,
          intervention_points: prediction.interventionPoints
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['predictive-supremacy'] })
  });

  const createMatrixMutation = useMutation({
    mutationFn: async (matrix: Partial<UnifiedControlMatrix>) => {
      const { data, error } = await supabase
        .from('unified_control_matrix')
        .insert({
          user_id: user?.id,
          matrix_name: matrix.matrixName,
          control_nodes: matrix.controlNodes,
          influence_vectors: matrix.influenceVectors,
          feedback_loops: matrix.feedbackLoops,
          system_state: matrix.systemState,
          optimization_targets: matrix.optimizationTargets
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unified-control-matrix'] })
  });

  return {
    predictions,
    matrices,
    isLoading: predictionsLoading || matricesLoading,
    createPrediction: createPredictionMutation.mutateAsync,
    createMatrix: createMatrixMutation.mutateAsync,
    avgAccuracy: predictions.reduce((sum, p) => {
      const history = p.accuracyHistory || [];
      const avg = history.length > 0 ? history.reduce((s, h) => s + h.accuracy, 0) / history.length : 0;
      return sum + avg;
    }, 0) / Math.max(predictions.length, 1),
    activeMatrices: matrices.filter(m => m.isActive).length,
    totalControlNodes: matrices.reduce((sum, m) => sum + m.controlNodes.length, 0)
  };
}
