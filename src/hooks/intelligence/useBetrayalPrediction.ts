// Betrayal Prediction Hook - Trust network modeling and defection risk assessment

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  calculateDefectionProbability,
  identifyWarningSignals,
  generateMitigationStrategies,
  GOTTMAN_HORSEMEN,
  type BetrayalProfile,
} from '@/lib/warfare/betrayalPredictor';
import { useAGISPhaseMiddleware } from './useAGISPhaseMiddleware';
import { invokeFunction } from '@/lib/api';

interface BetrayalPredictionRecord {
  id: string;
  profile_id: string | null;
  user_id: string;
  trust_score: number | null;
  defection_probability: number | null;
  loyalty_indicators: Record<string, unknown> | null;
  warning_signs: string[] | null;
  predicted_triggers: string[] | null;
  gottman_horsemen: Record<string, number> | null;
  risk_mitigation: Record<string, unknown> | null;
  relationship_stress_score: number | null;
  defection_timeline: string | null;
  protective_factors: Record<string, unknown> | null;
  validated_at: string | null;
  validation_outcome: string | null;
  created_at: string;
  updated_at: string;
}

export function useBetrayalPrediction(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const phaseMiddleware = useAGISPhaseMiddleware();

  // Fetch prediction for a profile
  const predictionQuery = useQuery({
    queryKey: ['betrayal-prediction', profileId],
    queryFn: async () => {
      if (!user?.id || !profileId) return null;
      
      const { data, error } = await supabase
        .from('betrayal_predictions')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as BetrayalPredictionRecord | null;
    },
    enabled: !!user?.id && !!profileId,
  });

  // Fetch all predictions for high-risk monitoring
  const allPredictionsQuery = useQuery({
    queryKey: ['betrayal-predictions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('betrayal_predictions')
        .select(`
          *,
        profiles:profile_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('defection_probability', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Run betrayal analysis
  const analyzeMutation = useMutation({
    mutationFn: async (targetProfileId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // First run the Gottman analyzer
      const { data: gottmanData, error: gottmanError } = await invokeFunction('gottman-relationship-analyzer', { profileId: targetProfileId },);
      
      if (gottmanError) throw gottmanError;
      
      // Then run the betrayal scorer
      const { data, error } = await invokeFunction('betrayal-likelihood-scorer', {
          profileId: targetProfileId,
          gottmanAnalysis: gottmanData,
        },);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betrayal-prediction'] });
      queryClient.invalidateQueries({ queryKey: ['betrayal-predictions'] });
      toast.success('Betrayal analysis complete');
      // Track successful Phase 3 operation
      phaseMiddleware.recordSuccess(3, 'betrayal_prediction_complete');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
      // Track failed Phase 3 operation
      phaseMiddleware.recordFailure(3, 'betrayal_prediction_failed');
    },
  });

  // Validate a prediction outcome
  const validateMutation = useMutation({
    mutationFn: async (params: { predictionId: string; outcome: 'accurate' | 'inaccurate' | 'partial' }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('betrayal_predictions')
        .update({
          validated_at: new Date().toISOString(),
          validation_outcome: params.outcome,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.predictionId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betrayal-predictions'] });
      toast.success('Prediction validated');
    },
  });

  // Get high-risk relationships
  const highRiskRelationships = (allPredictionsQuery.data || [])
    .filter(p => (p.defection_probability || 0) > 0.6);

  // Get relationships with active warning signs
  const activeWarnings = (allPredictionsQuery.data || [])
    .filter(p => (p.warning_signs?.length || 0) > 0);

  return {
    prediction: predictionQuery.data,
    allPredictions: allPredictionsQuery.data || [],
    highRiskRelationships,
    activeWarnings,
    isLoading: predictionQuery.isLoading || allPredictionsQuery.isLoading,
    analyze: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    validate: validateMutation.mutate,
    gottmanHorsemen: GOTTMAN_HORSEMEN,
    calculateDefectionProbability,
    identifyWarningSignals,
    generateMitigationStrategies,
  };
}
