import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PrecursorSignature {
  id: string;
  userId: string;
  profileId?: string;
  signatureType: string;
  patternDescription: string;
  temporalOffset: string;
  confidenceScore: number;
  historicalAccuracy: number;
  createdAt: string;
}

export interface TimelineProbability {
  id: string;
  userId: string;
  profileId?: string;
  eventType: string;
  probabilityScore: number;
  timeframe: string;
  precursorChain: string[];
  interventionWindows: Record<string, unknown>[];
  createdAt: string;
}

export function usePrecognitivePatterns(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: signatures, isLoading: signaturesLoading } = useQuery({
    queryKey: ['precursor-signatures', profileId],
    queryFn: async () => {
      let query = supabase
        .from('precursor_signatures')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        signatureType: row.signature_type,
        patternDescription: row.pattern_description || '',
        temporalOffset: row.temporal_offset || '',
        confidenceScore: row.confidence_score || 0,
        historicalAccuracy: row.historical_accuracy || 0,
        createdAt: row.created_at
      })) as PrecursorSignature[];
    },
    enabled: !!user,
  });

  const { data: timelines, isLoading: timelinesLoading } = useQuery({
    queryKey: ['timeline-probabilities', profileId],
    queryFn: async () => {
      let query = supabase
        .from('timeline_probabilities')
        .select('*')
        .order('probability_score', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        eventType: row.event_type,
        probabilityScore: row.probability_score || 0,
        timeframe: row.timeframe || '',
        precursorChain: row.precursor_chain || [],
        interventionWindows: row.intervention_windows as Record<string, unknown>[] || [],
        createdAt: row.created_at
      })) as TimelineProbability[];
    },
    enabled: !!user,
  });

  const analyzePrecognition = useMutation({
    mutationFn: async (input: { profileId: string; predictionHorizon?: '3_months' | '6_months' | '12_months' }) => {
      const { data, error } = await supabase.functions.invoke('precognitive-pattern-engine', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          predictionHorizon: input.predictionHorizon || '6_months'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precursor-signatures'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-probabilities'] });
    }
  });

  return {
    signatures,
    timelines,
    isLoading: signaturesLoading || timelinesLoading,
    analyzePrecognition: analyzePrecognition.mutateAsync,
    isAnalyzing: analyzePrecognition.isPending,
    highProbabilityEvents: timelines?.filter(t => t.probabilityScore > 0.7) || [],
    accurateSignatures: signatures?.filter(s => s.historicalAccuracy > 0.8) || []
  };
}
