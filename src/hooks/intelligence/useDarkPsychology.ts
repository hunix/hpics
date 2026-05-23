/**
 * Dark Psychology Hook (v9.0)
 * 
 * React hooks for Dark Tetrad profiling and coercive control detection.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface DarkTetradResult {
  id: string;
  profileId: string;
  machiavellianism: number;
  narcissism: number;
  psychopathy: number;
  sadism: number;
  overallDarknessScore: number;
  riskLevel: string;
  markers: Record<string, unknown>;
  createdAt: string | null;
}

export interface CoerciveControlResult {
  id: string;
  profileId: string;
  controlScore: number;
  phase: string;
  tactics: string[];
  escalationRisk: number;
  createdAt: string | null;
}

export function useDarkPsychology(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tetradProfiles, isLoading: tetradLoading } = useQuery({
    queryKey: ['dark-tetrad-profiles', profileId],
    queryFn: async () => {
      let query = supabase
        .from('ai_analyses')
        .select('*')
        .eq('analysis_type', 'dark_tetrad_profile')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => {
        const results = (row.analysis_results || {}) as Record<string, unknown>;
        return {
          id: row.id as string,
          profileId: row.profile_id as string,
          machiavellianism: (results.machiavellianism || 0) as number,
          narcissism: (results.narcissism || 0) as number,
          psychopathy: (results.psychopathy || 0) as number,
          sadism: (results.sadism || 0) as number,
          overallDarknessScore: (results.overallDarknessScore || 0) as number,
          riskLevel: (results.riskLevel || 'low') as string,
          markers: (results.markers || {}) as Record<string, unknown>,
          createdAt: row.created_at as string
        };
      }) as DarkTetradResult[];
    },
    enabled: !!user,
  });

  const { data: coerciveControls, isLoading: coerciveLoading } = useQuery({
    queryKey: ['coercive-control-analyses', profileId],
    queryFn: async () => {
      let query = supabase
        .from('ai_analyses')
        .select('*')
        .eq('analysis_type', 'coercive_control')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => {
        const results = (row.analysis_results || {}) as Record<string, unknown>;
        return {
          id: row.id as string,
          profileId: row.profile_id as string,
          controlScore: (results.controlScore || 0) as number,
          phase: (results.phase || 'unknown') as string,
          tactics: (results.tactics || []) as string[],
          escalationRisk: (results.escalationRisk || 0) as number,
          createdAt: row.created_at as string
        };
      }) as CoerciveControlResult[];
    },
    enabled: !!user,
  });

  const analyzeDarkTetrad = useMutation({
    mutationFn: async (input: { profileId: string }) => {
      const { data, error } = await invokeFunction('dark-tetrad-profiler', {
          userId: user!.id,
          profileId: input.profileId
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dark-tetrad-profiles'] });
    }
  });

  const detectCoerciveControl = useMutation({
    mutationFn: async (input: { profileId: string; communications?: string[] }) => {
      const { data, error } = await invokeFunction('coercive-control-detector', {
          userId: user!.id,
          profileId: input.profileId,
          communications: input.communications
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coercive-control-analyses'] });
    }
  });

  const highRiskProfiles = tetradProfiles?.filter(p => 
    p.riskLevel === 'high' || p.riskLevel === 'severe' || p.overallDarknessScore > 70
  ) || [];

  const activeCoerciveRisks = coerciveControls?.filter(c => c.escalationRisk > 0.6) || [];

  return {
    tetradProfiles,
    coerciveControls,
    highRiskProfiles,
    activeCoerciveRisks,
    isLoading: tetradLoading || coerciveLoading,
    analyzeDarkTetrad: analyzeDarkTetrad.mutateAsync,
    detectCoerciveControl: detectCoerciveControl.mutateAsync,
    isAnalyzingTetrad: analyzeDarkTetrad.isPending,
    isDetectingCoercion: detectCoerciveControl.isPending
  };
}
