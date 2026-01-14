import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DeceptionAnalysis {
  id: string;
  profile_id: string;
  user_id: string;
  source_type: string;
  source_id: string | null;
  deception_score: number | null;
  deception_likelihood: string | null;
  facial_indicators: any;
  vocal_indicators: any;
  linguistic_indicators: any;
  behavioral_indicators: any;
  cross_modal_conflicts: any;
  conflict_severity: number | null;
  micro_expressions: any;
  expression_authenticity_score: number | null;
  voice_stress_markers: any;
  vocal_authenticity_score: number | null;
  linguistic_deception_markers: any;
  linguistic_authenticity_score: number | null;
  deception_timeline: any;
  peak_deception_moments: any;
  overall_confidence: number | null;
  models_used: string[] | null;
  analysis_version: string | null;
  analyzed_at: string | null;
  created_at: string;
}

export function useDeceptionAnalyses(profileId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deception-analyses', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('deception_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as DeceptionAnalysis[];
    },
    enabled: !!user
  });
}

export function useLatestDeceptionAnalysis(profileId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deception-analysis-latest', profileId, user?.id],
    queryFn: async () => {
      if (!user || !profileId) return null;

      const { data, error } = await supabase
        .from('deception_analyses')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as DeceptionAnalysis | null;
    },
    enabled: !!user && !!profileId
  });
}

export function useCreateDeceptionAnalysis() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (analysis: {
      profile_id: string;
      source_type: string;
      source_id?: string;
      deception_score?: number;
      deception_likelihood?: string;
      facial_indicators?: any;
      vocal_indicators?: any;
      linguistic_indicators?: any;
      behavioral_indicators?: any;
      cross_modal_conflicts?: any;
      conflict_severity?: number;
      micro_expressions?: any;
      expression_authenticity_score?: number;
      voice_stress_markers?: any;
      vocal_authenticity_score?: number;
      linguistic_deception_markers?: any;
      linguistic_authenticity_score?: number;
      deception_timeline?: any;
      peak_deception_moments?: any;
      overall_confidence?: number;
      models_used?: string[];
      analysis_version?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const insertData = {
        profile_id: analysis.profile_id,
        user_id: user.id,
        source_type: analysis.source_type,
        source_id: analysis.source_id || null,
        deception_score: analysis.deception_score ?? null,
        deception_likelihood: analysis.deception_likelihood ?? null,
        facial_indicators: analysis.facial_indicators ?? null,
        vocal_indicators: analysis.vocal_indicators ?? null,
        linguistic_indicators: analysis.linguistic_indicators ?? null,
        behavioral_indicators: analysis.behavioral_indicators ?? null,
        cross_modal_conflicts: analysis.cross_modal_conflicts ?? null,
        conflict_severity: analysis.conflict_severity ?? null,
        micro_expressions: analysis.micro_expressions ?? null,
        expression_authenticity_score: analysis.expression_authenticity_score ?? null,
        voice_stress_markers: analysis.voice_stress_markers ?? null,
        vocal_authenticity_score: analysis.vocal_authenticity_score ?? null,
        linguistic_deception_markers: analysis.linguistic_deception_markers ?? null,
        linguistic_authenticity_score: analysis.linguistic_authenticity_score ?? null,
        deception_timeline: analysis.deception_timeline ?? null,
        peak_deception_moments: analysis.peak_deception_moments ?? null,
        overall_confidence: analysis.overall_confidence ?? null,
        models_used: analysis.models_used ?? null,
        analysis_version: analysis.analysis_version ?? null,
        analyzed_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('deception_analyses')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deception-analyses', variables.profile_id] });
      queryClient.invalidateQueries({ queryKey: ['deception-analysis-latest', variables.profile_id] });
      toast.success('Deception analysis saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save analysis: ${error.message}`);
    }
  });
}

export function useVoiceStressResults(profileId: string) {
  const { data: analysis } = useLatestDeceptionAnalysis(profileId);
  
  return {
    indicators: analysis?.voice_stress_markers ?? null,
    authenticityScore: analysis?.vocal_authenticity_score ?? null,
    updatedAt: analysis?.analyzed_at ?? null
  };
}

export function useMicroExpressionResults(profileId: string) {
  const { data: analysis } = useLatestDeceptionAnalysis(profileId);
  
  return {
    expressions: analysis?.micro_expressions ?? null,
    authenticityScore: analysis?.expression_authenticity_score ?? null
  };
}

export function useDeceptionConfidenceScore(profileId: string) {
  const { data: analysis } = useLatestDeceptionAnalysis(profileId);
  
  return {
    deceptionScore: analysis?.deception_score ?? null,
    deceptionLikelihood: analysis?.deception_likelihood ?? null,
    overallConfidence: analysis?.overall_confidence ?? null,
    peakMoments: analysis?.peak_deception_moments ?? null
  };
}

export function useDeleteDeceptionAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const { error } = await supabase
        .from('deception_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deception-analyses', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['deception-analysis-latest', variables.profileId] });
      toast.success('Analysis deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete analysis: ${error.message}`);
    }
  });
}
