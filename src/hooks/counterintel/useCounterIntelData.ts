import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileJoin {
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
}

export interface ThreatAssessment {
  id: string;
  overall_risk_score: number | null;
  primary_concerns: string[] | null;
  profiles: ProfileJoin | null;
}

export interface BehavioralAnomaly {
  id: string;
  severity: string;
  anomaly_type: string;
  description: string;
  detected_at: string;
  profiles: ProfileJoin | null;
}

export interface IdentityConfidenceStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  unverified: number;
}

export interface DeceptionIndicator {
  id: string;
  profile_id: string;
  profiles: ProfileJoin | null;
  analyzed_at: string;
  deception_probability: number;
  deception_indicators: unknown[];
}

export function useThreatAssessments(limit = 50) {
  const { user } = useAuth();
  return useQuery<ThreatAssessment[]>({
    queryKey: ['threat-assessments', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threat_assessments')
        .select('*, profiles (first_name, last_name, avatar_url)')
        .order('overall_risk_score', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as unknown) as ThreatAssessment[];
    },
  });
}

export function useBehavioralAnomalies(limit = 50) {
  const { user } = useAuth();
  return useQuery<BehavioralAnomaly[]>({
    queryKey: ['behavioral-anomalies', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavioral_anomalies')
        .select('*, profiles (first_name, last_name, avatar_url)')
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as unknown) as BehavioralAnomaly[];
    },
  });
}

export function useIdentityConfidenceStats() {
  const { user } = useAuth();
  return useQuery<IdentityConfidenceStats>({
    queryKey: ['identity-confidence-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_biometrics')
        .select('identity_confidence, facial_confidence, voice_confidence, profile_id');
      if (error) throw error;
      const rows = data ?? [];
      const total = rows.length;
      const high = rows.filter((d) => (d.identity_confidence || 0) >= 80).length;
      const medium = rows.filter((d) => (d.identity_confidence || 0) >= 50 && (d.identity_confidence || 0) < 80).length;
      const low = rows.filter((d) => (d.identity_confidence || 0) < 50 && d.identity_confidence !== null).length;
      const unverified = rows.filter((d) => d.identity_confidence == null).length;
      return { total, high, medium, low, unverified };
    },
  });
}

export function useDeceptionIndicators(limit = 20) {
  const { user } = useAuth();
  return useQuery<DeceptionIndicator[]>({
    queryKey: ['deception-indicators', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('id, profile_id, result, generated_at, profiles (first_name, last_name)')
        .eq('analysis_type', 'deception_analysis')
        .order('generated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      type Row = {
        id: string;
        profile_id: string;
        result: { deception_probability?: number; indicators?: unknown[] } | null;
        generated_at: string;
        profiles: ProfileJoin | null;
      };
      return ((data ?? []) as unknown as Row[]).map((d) => ({
        id: d.id,
        profile_id: d.profile_id,
        profiles: d.profiles,
        analyzed_at: d.generated_at,
        deception_probability: d.result?.deception_probability ?? 0,
        deception_indicators: d.result?.indicators ?? [],
      }));
    },
  });
}

export function useResolveAnomaly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (anomalyId: string) => {
      const { error } = await supabase
        .from('behavioral_anomalies')
        .update({ is_resolved: true, resolution_notes: 'Marked as resolved' })
        .eq('id', anomalyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-anomalies'] });
    },
  });
}
