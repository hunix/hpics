import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface PrecursorSignature {
  id: string;
  userId: string;
  profileId?: string;
  signatureType: string;
  patternDescription: string;
  temporalOffset: string;
  confidenceScore: number;
  historicalAccuracy: number;
  createdAt: string | null;
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
  createdAt: string | null;
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
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        signatureType: (row.target_event || '') as string,
        patternDescription: '' as string,
        temporalOffset: `${row.lead_time_hours || 0}h` as string,
        confidenceScore: (row.confidence || 0) as number,
        historicalAccuracy: (row.validated ? 1 : 0) as number,
        createdAt: row.created_at as string
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
        .order('probability_amplitude', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        eventType: (row.timeline_description || '') as string,
        probabilityScore: (row.probability_amplitude || row.malleability_score || 0) as number,
        timeframe: '' as string,
        precursorChain: [] as string[],
        interventionWindows: (row.intervention_leverage_points || []) as Record<string, unknown>[],
        createdAt: row.created_at as string
      })) as TimelineProbability[];
    },
    enabled: !!user,
  });

  const analyzePrecognition = useMutation({
    mutationFn: async (input: { profileId: string; predictionHorizon?: '3_months' | '6_months' | '12_months' }) => {
      const { data, error } = await invokeFunction('precognitive-pattern-engine', {
          userId: user!.id,
          profileId: input.profileId,
          predictionHorizon: input.predictionHorizon || '6_months'
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
