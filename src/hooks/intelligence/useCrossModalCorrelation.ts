import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface CrossModalCorrelation {
  id: string;
  userId: string;
  profileId?: string;
  correlationType: string;
  sourceModalities: string[];
  correlationMatrix: Record<string, Record<string, number>>;
  confidenceScores: Record<string, number>;
  temporalAlignment: Record<string, unknown>;
  causalLinks: Array<{ source: string; target: string; strength: number; direction: string }>;
  anomalyDetections: Array<{ modality: string; type: string; severity: number; timestamp: string }>;
  synthesizedInsights: Array<{ insight: string; confidence: number; sources: string[] }>;
  predictionAccuracy: number;
  lastCorrelationAt: string;
  createdAt: string | null;
  updatedAt: string;
}

export interface ModalityStream {
  id: string;
  name: string;
  type: 'behavioral' | 'biometric' | 'psychological' | 'social' | 'temporal' | 'environmental';
  dataPoints: number;
  lastUpdate: string;
  quality: number;
}

export function useCrossModalCorrelation(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch cross-modal correlations
  const { data: correlations, isLoading: correlationsLoading } = useQuery({
    queryKey: ['cross-modal-correlations', profileId],
    queryFn: async () => {
      let query = supabase
        .from('cross_domain_correlations')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        correlationType: row.correlation_type || 'multi-modal',
        sourceModalities: row.domains_involved || [],
        correlationMatrix: row.correlation_details?.matrix || {},
        confidenceScores: row.correlation_details?.confidence || {},
        temporalAlignment: row.correlation_details?.temporal || {},
        causalLinks: row.causal_chain || [],
        anomalyDetections: row.correlation_details?.anomalies || [],
        synthesizedInsights: row.implications || [],
        predictionAccuracy: row.strength || 0,
        lastCorrelationAt: row.updated_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as CrossModalCorrelation[];
    },
    enabled: !!user,
  });

  // Fetch available modality streams
  const { data: modalityStreams, isLoading: streamsLoading } = useQuery({
    queryKey: ['modality-streams', profileId],
    queryFn: async () => {
      // Build modality streams from available data sources
      const streams: ModalityStream[] = [];

      // Behavioral modality
      const { count: behavioralCount } = await supabase
        .from('behavioral_biometrics' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      
      if (behavioralCount) {
        streams.push({
          id: 'behavioral',
          name: 'Behavioral Biometrics',
          type: 'behavioral',
          dataPoints: behavioralCount,
          lastUpdate: new Date().toISOString(),
          quality: 0.85,
        });
      }

      // Psychological modality
      const { count: psychCount } = await supabase
        .from('psychology_assessments' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if (psychCount) {
        streams.push({
          id: 'psychological',
          name: 'Psychological Assessments',
          type: 'psychological',
          dataPoints: psychCount,
          lastUpdate: new Date().toISOString(),
          quality: 0.92,
        });
      }

      // Temporal modality
      const { count: temporalCount } = await supabase
        .from('chronotype_profiles' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if (temporalCount) {
        streams.push({
          id: 'temporal',
          name: 'Temporal Patterns',
          type: 'temporal',
          dataPoints: temporalCount,
          lastUpdate: new Date().toISOString(),
          quality: 0.88,
        });
      }

      // Add static modalities for demo
      streams.push({
        id: 'social',
        name: 'Social Network Analysis',
        type: 'social',
        dataPoints: 25,
        lastUpdate: new Date().toISOString(),
        quality: 0.78,
      });

      streams.push({
        id: 'biometric',
        name: 'Biometric Data',
        type: 'biometric',
        dataPoints: 15,
        lastUpdate: new Date().toISOString(),
        quality: 0.95,
      });

      return streams;
    },
    enabled: !!user,
  });

  // Run correlation analysis
  const runCorrelation = useMutation({
    mutationFn: async (input: {
      profileId: string;
      modalities: string[];
      correlationType: 'pairwise' | 'multi-way' | 'temporal' | 'causal';
      timeWindow?: { start: string; end: string };
    }) => {
      // Call edge function to run AI-powered correlation analysis
      const { data: result, error } = await invokeFunction('cross-modal-correlator', {
          userId: user!.id,
          profileId: input.profileId,
          modalities: input.modalities,
          correlationType: input.correlationType,
          timeWindow: input.timeWindow,
        },);

      if (error) throw error;

      // Store correlation result
      const { data: stored, error: storeError } = await supabase
        .from('cross_domain_correlations')
        .insert({
          user_id: user!.id,
          profile_id: input.profileId,
          correlation_type: input.correlationType,
          domains_involved: input.modalities,
          strength: result.overallStrength || 0,
          correlation_details: {
            matrix: result.correlationMatrix,
            confidence: result.confidenceScores,
            temporal: result.temporalAlignment,
            anomalies: result.anomalies,
          },
          causal_chain: result.causalLinks || [],
          implications: result.insights || [],
        } as any)
        .select()
        .single();

      if (storeError) throw storeError;
      return stored;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-modal-correlations'] });
    },
  });

  // Detect anomalies across modalities
  const detectAnomalies = useMutation({
    mutationFn: async (input: { profileId: string; sensitivity: 'low' | 'medium' | 'high' }) => {
      const { data, error } = await invokeFunction('anomaly-detector', {
          userId: user!.id,
          profileId: input.profileId,
          sensitivity: input.sensitivity,
          crossModal: true,
        },);

      if (error) throw error;
      return data;
    },
  });

  // Calculate derived metrics
  const avgConfidence = correlations?.reduce((sum, c) => {
    const scores = Object.values(c.confidenceScores);
    return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
  }, 0) || 0 / Math.max(correlations?.length || 1, 1);

  const totalCausalLinks = correlations?.reduce((sum, c) => sum + (c.causalLinks?.length || 0), 0) || 0;
  const totalAnomalies = correlations?.reduce((sum, c) => sum + (c.anomalyDetections?.length || 0), 0) || 0;
  const totalInsights = correlations?.reduce((sum, c) => sum + (c.synthesizedInsights?.length || 0), 0) || 0;

  return {
    correlations,
    modalityStreams,
    isLoading: correlationsLoading || streamsLoading,
    runCorrelation,
    detectAnomalies,
    avgConfidence,
    totalCausalLinks,
    totalAnomalies,
    totalInsights,
    activeModalities: modalityStreams?.length || 0,
  };
}
