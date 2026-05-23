/**
 * Future Timeline Engine Hook
 * Predictive omniscience for contact life events 6-24 months ahead
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface FuturePrediction {
  id: string;
  profileId?: string | null;
  predictionType: string;
  predictedEvent: string;
  probabilityScore: number;
  confidenceInterval: { low: number; high: number };
  predictedDateRange: { start: string; end: string };
  supportingEvidence: Array<{ source: string; weight: number; detail: string }>;
  influencingFactors: Array<{ factor: string; impact: number; direction: string }>;
  interventionOpportunities: Array<{ action: string; timing: string; expectedImpact: number }>;
  status: string;
  outcomeRecorded?: Record<string, unknown>;
  createdAt: string | null;
}

export interface DecisionWindow {
  id: string;
  profileId?: string | null;
  windowType: string;
  windowName: string;
  startsAt?: string;
  endsAt?: string;
  urgencyScore: number;
  influencePotential: number;
  recommendedActions: Array<{ action: string; priority: number; reasoning: string }>;
  contextFactors: Record<string, unknown>;
  status: string;
  interventionTaken?: Record<string, unknown>;
  outcome?: Record<string, unknown>;
  createdAt: string | null;
}

export interface PredictionModel {
  id: string;
  modelName: string;
  modelType: string;
  modelConfig: Record<string, unknown>;
  trainingDataStats: Record<string, unknown>;
  accuracyMetrics: { precision: number; recall: number; f1Score: number };
  lastTrainedAt?: string;
  predictionCount: number;
  successfulPredictions: number;
  isActive: boolean;
  createdAt: string | null;
}

export function useFutureTimeline(profileId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['future-predictions', profileId],
    queryFn: async () => {
      let query = supabase
        .from('future_predictions')
        .select('*')
        .eq('user_id', user!.id)
        .order('probability_score', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((p): FuturePrediction => ({
        id: p.id,
        profileId: p.profile_id,
        predictionType: p.prediction_type,
        predictedEvent: p.predicted_event,
        probabilityScore: Number(p.probability_score) || 0,
        confidenceInterval: (p.confidence_interval as any) || { low: 0, high: 0 },
        predictedDateRange: (p.predicted_date_range as any) || { start: '', end: '' },
        supportingEvidence: (p.supporting_evidence as any) || [],
        influencingFactors: (p.influencing_factors as any) || [],
        interventionOpportunities: (p.intervention_opportunities as any) || [],
        status: p.status || 'active',
        outcomeRecorded: p.outcome_recorded as any,
        createdAt: p.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: decisionWindows, isLoading: windowsLoading } = useQuery({
    queryKey: ['decision-windows', profileId],
    queryFn: async () => {
      let query = supabase
        .from('decision_windows')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['upcoming', 'active'])
        .order('urgency_score', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((w): DecisionWindow => ({
        id: w.id,
        profileId: w.profile_id,
        windowType: w.window_type,
        windowName: w.window_name,
        startsAt: w.starts_at ?? undefined,
        endsAt: w.ends_at ?? undefined,
        urgencyScore: Number(w.urgency_score) || 0,
        influencePotential: Number(w.influence_potential) || 0,
        recommendedActions: (w.recommended_actions as any) || [],
        contextFactors: (w.context_factors as any) || {},
        status: w.status || 'upcoming',
        interventionTaken: w.intervention_taken as any,
        outcome: w.outcome as any,
        createdAt: w.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['prediction-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prediction_models')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((m): PredictionModel => ({
        id: m.id,
        modelName: m.model_name,
        modelType: m.model_type,
        modelConfig: (m.model_config as any) || {},
        trainingDataStats: (m.training_data_stats as any) || {},
        accuracyMetrics: (m.accuracy_metrics as any) || { precision: 0, recall: 0, f1Score: 0 },
        lastTrainedAt: m.last_trained_at ?? undefined,
        predictionCount: m.prediction_count || 0,
        successfulPredictions: m.successful_predictions || 0,
        isActive: m.is_active ?? true,
        createdAt: m.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const generatePredictions = useMutation({
    mutationFn: async (params: { profileId: string | null; horizonMonths?: number }) => {
      const { data, error } = await invokeFunction('future-timeline-engine', { 
          profileId: params.profileId, 
          horizonMonths: params.horizonMonths || 12,
          action: 'generate_predictions'
        },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['future-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['decision-windows'] });
      toast.success('Future predictions generated');
    },
    onError: (error) => {
      toast.error(`Prediction failed: ${error.message}`);
    },
  });

  const recordIntervention = useMutation({
    mutationFn: async (params: {
      predictionId?: string;
      decisionWindowId?: string;
      interventionType: string;
      actionTaken: string;
      expectedOutcome: Record<string, unknown>;
    }) => {
      const { data, error } = await (supabase
        .from('timeline_interventions') as any)
        .insert({
          user_id: user!.id,
          profile_id: profileId,
          prediction_id: params.predictionId,
          decision_window_id: params.decisionWindowId,
          intervention_type: params.interventionType,
          action_taken: params.actionTaken,
          expected_outcome: params.expectedOutcome,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['future-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['decision-windows'] });
      toast.success('Intervention recorded');
    },
  });

  // Computed metrics
  const highProbabilityEvents = predictions?.filter(p => p.probabilityScore >= 0.7) || [];
  const urgentWindows = decisionWindows?.filter(w => w.urgencyScore >= 0.8) || [];
  const avgModelAccuracy = models?.length 
    ? models.reduce((sum, m) => sum + (m.accuracyMetrics.precision || 0), 0) / models.length 
    : 0;

  return {
    predictions,
    decisionWindows,
    models,
    isLoading: predictionsLoading || windowsLoading || modelsLoading,
    generatePredictions: generatePredictions.mutate,
    recordIntervention: recordIntervention.mutate,
    isGenerating: generatePredictions.isPending,
    highProbabilityEvents,
    urgentWindows,
    avgModelAccuracy,
    totalPredictions: predictions?.length || 0,
    activeWindows: decisionWindows?.filter(w => w.status === 'active').length || 0,
  };
}
