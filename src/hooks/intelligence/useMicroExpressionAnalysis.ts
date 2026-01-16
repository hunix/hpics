/**
 * Micro-Expression Analysis Hook
 * Real-time facial analysis and deception detection
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface MicroExpressionReading {
  id: string;
  profileId?: string;
  sessionId?: string;
  timestampMs: number;
  facsActionUnits: Record<string, number>;
  detectedEmotions: Array<{ emotion: string; confidence: number; intensity: number }>;
  microExpressions: Array<{ type: string; duration: number; actionUnits: string[] }>;
  durationMs: number;
  intensityScore: number;
  context?: string;
  frameData: Record<string, unknown>;
  createdAt: string;
}

export interface DeceptionSignature {
  id: string;
  profileId?: string;
  signatureType: string;
  signaturePattern: Record<string, unknown>;
  baselineComparison: Record<string, unknown>;
  confidenceScore: number;
  occurrenceCount: number;
  contextTriggers: string[];
  detectionAccuracy: number;
  lastDetectedAt?: string;
}

export interface StressIndicator {
  id: string;
  profileId?: string;
  indicatorType: string;
  measurementValue: number;
  baselineValue: number;
  deviationPercent: number;
  trendDirection?: string;
  associatedTriggers: string[];
  healthImplications: Record<string, unknown>;
  recommendations: string[];
  measuredAt: string;
}

export interface BehavioralFingerprint {
  id: string;
  profileId?: string;
  fingerprintType: string;
  fingerprintData: Record<string, unknown>;
  uniquenessScore: number;
  stabilityScore: number;
  components: Array<{ name: string; weight: number; value: unknown }>;
  verificationSamples: number;
  lastVerifiedAt?: string;
}

export function useMicroExpressionAnalysis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: readings, isLoading: readingsLoading } = useQuery({
    queryKey: ['microexpression-readings', profileId],
    queryFn: async () => {
      let query = supabase
        .from('microexpression_readings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((r): MicroExpressionReading => ({
        id: r.id,
        profileId: r.profile_id,
        sessionId: r.session_id,
        timestampMs: r.timestamp_ms || 0,
        facsActionUnits: (r.facs_action_units as any) || {},
        detectedEmotions: (r.detected_emotions as any) || [],
        microExpressions: (r.micro_expressions as any) || [],
        durationMs: r.duration_ms || 0,
        intensityScore: Number(r.intensity_score) || 0,
        context: r.context,
        frameData: (r.frame_data as any) || {},
        createdAt: r.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: deceptionSignatures, isLoading: deceptionLoading } = useQuery({
    queryKey: ['deception-signatures', profileId],
    queryFn: async () => {
      let query = supabase
        .from('deception_signatures')
        .select('*')
        .eq('user_id', user!.id)
        .order('confidence_score', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((d): DeceptionSignature => ({
        id: d.id,
        profileId: d.profile_id,
        signatureType: d.signature_type,
        signaturePattern: (d.signature_pattern as any) || {},
        baselineComparison: (d.baseline_comparison as any) || {},
        confidenceScore: Number(d.confidence_score) || 0,
        occurrenceCount: d.occurrence_count || 1,
        contextTriggers: (d.context_triggers as any) || [],
        detectionAccuracy: Number(d.detection_accuracy) || 0,
        lastDetectedAt: d.last_detected_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: stressIndicators, isLoading: stressLoading } = useQuery({
    queryKey: ['stress-indicators', profileId],
    queryFn: async () => {
      let query = supabase
        .from('stress_indicators')
        .select('*')
        .eq('user_id', user!.id)
        .order('measured_at', { ascending: false })
        .limit(50);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((s): StressIndicator => ({
        id: s.id,
        profileId: s.profile_id,
        indicatorType: s.indicator_type,
        measurementValue: Number(s.measurement_value) || 0,
        baselineValue: Number(s.baseline_value) || 0,
        deviationPercent: Number(s.deviation_percent) || 0,
        trendDirection: s.trend_direction,
        associatedTriggers: (s.associated_triggers as any) || [],
        healthImplications: (s.health_implications as any) || {},
        recommendations: (s.recommendations as any) || [],
        measuredAt: s.measured_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: fingerprints, isLoading: fingerprintsLoading } = useQuery({
    queryKey: ['behavioral-fingerprints', profileId],
    queryFn: async () => {
      let query = supabase
        .from('behavioral_fingerprints')
        .select('*')
        .eq('user_id', user!.id)
        .order('uniqueness_score', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((f): BehavioralFingerprint => ({
        id: f.id,
        profileId: f.profile_id,
        fingerprintType: f.fingerprint_type,
        fingerprintData: (f.fingerprint_data as any) || {},
        uniquenessScore: Number(f.uniqueness_score) || 0,
        stabilityScore: Number(f.stability_score) || 0,
        components: (f.components as any) || [],
        verificationSamples: f.verification_samples || 0,
        lastVerifiedAt: f.last_verified_at,
      }));
    },
    enabled: !!user?.id,
  });

  const analyzeFrame = useMutation({
    mutationFn: async (params: { 
      profileId: string; 
      frameData: string; 
      context?: string;
      sessionId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('microexpression-analyzer', {
        body: { 
          profileId: params.profileId,
          frameData: params.frameData,
          context: params.context,
          sessionId: params.sessionId,
          action: 'analyze_frame',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microexpression-readings'] });
      queryClient.invalidateQueries({ queryKey: ['deception-signatures'] });
    },
  });

  const buildBaseline = useMutation({
    mutationFn: async (params: { profileId: string; sessionData: unknown[] }) => {
      const { data, error } = await supabase.functions.invoke('microexpression-analyzer', {
        body: { 
          profileId: params.profileId,
          sessionData: params.sessionData,
          action: 'build_baseline',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deception-signatures'] });
      queryClient.invalidateQueries({ queryKey: ['behavioral-fingerprints'] });
      toast.success('Baseline established');
    },
    onError: (error) => {
      toast.error(`Baseline failed: ${error.message}`);
    },
  });

  const detectDeception = useMutation({
    mutationFn: async (params: { profileId: string; recentReadings: string[] }) => {
      const { data, error } = await supabase.functions.invoke('microexpression-analyzer', {
        body: { 
          profileId: params.profileId,
          recentReadings: params.recentReadings,
          action: 'detect_deception',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deception-signatures'] });
    },
  });

  // Computed metrics
  const highConfidenceDeception = deceptionSignatures?.filter(d => d.confidenceScore >= 0.75) || [];
  const elevatedStress = stressIndicators?.filter(s => s.deviationPercent > 25) || [];
  const avgDeceptionAccuracy = deceptionSignatures?.length
    ? deceptionSignatures.reduce((sum, d) => sum + d.detectionAccuracy, 0) / deceptionSignatures.length
    : 0;
  const strongFingerprints = fingerprints?.filter(f => f.uniquenessScore >= 0.8 && f.stabilityScore >= 0.8) || [];

  return {
    readings,
    deceptionSignatures,
    stressIndicators,
    fingerprints,
    isLoading: readingsLoading || deceptionLoading || stressLoading || fingerprintsLoading,
    analyzeFrame: analyzeFrame.mutate,
    buildBaseline: buildBaseline.mutate,
    detectDeception: detectDeception.mutate,
    isAnalyzing: analyzeFrame.isPending,
    highConfidenceDeception,
    elevatedStress,
    avgDeceptionAccuracy,
    strongFingerprints,
    totalReadings: readings?.length || 0,
  };
}
