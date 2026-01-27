/**
 * Multimodal Deception Detection Hook (v9.0)
 * 
 * React hooks for deception analysis across text, audio, visual, and physiological modalities.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DeceptionAnalysisRecord {
  id: string;
  sourceId: string;
  profileId?: string;
  modality: string;
  deceptionProbability: number;
  confidence: number;
  cognitiveLoadScore: number;
  markers: Record<string, unknown>;
  riskLevel: string;
  createdAt: string;
}

export function useMultimodalDeception(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['deception-analyses', profileId],
    queryFn: async () => {
      let query = supabase
        .from('deception_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        sourceId: (row.source_id || '') as string,
        profileId: row.profile_id as string | undefined,
        modality: (row.modality || 'textual') as string,
        deceptionProbability: (row.deception_probability || 0) as number,
        confidence: (row.confidence || 0) as number,
        cognitiveLoadScore: (row.cognitive_load_score || 0) as number,
        markers: (row.markers || {}) as Record<string, unknown>,
        riskLevel: determineRiskLevel(row.deception_probability as number),
        createdAt: row.created_at as string
      })) as DeceptionAnalysisRecord[];
    },
    enabled: !!user,
  });

  const analyzeDeception = useMutation({
    mutationFn: async (input: {
      sourceId: string;
      profileId?: string;
      modality: 'textual' | 'acoustic' | 'visual' | 'fused';
      content?: string;
    }) => {
      // Call edge function for analysis
      const { data, error } = await supabase.functions.invoke('multimodal-deception-analyzer', {
        body: {
          userId: user!.id,
          sourceId: input.sourceId,
          profileId: input.profileId,
          modality: input.modality,
          content: input.content
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deception-analyses'] });
    }
  });

  const highRiskAnalyses = analyses?.filter(a => 
    a.deceptionProbability > 0.7 || a.riskLevel === 'high' || a.riskLevel === 'critical'
  ) || [];

  const averageDeceptionScore = analyses?.length 
    ? analyses.reduce((sum, a) => sum + a.deceptionProbability, 0) / analyses.length 
    : 0;

  return {
    analyses,
    highRiskAnalyses,
    averageDeceptionScore,
    isLoading: analysesLoading,
    analyzeDeception: analyzeDeception.mutateAsync,
    isAnalyzing: analyzeDeception.isPending
  };
}

function determineRiskLevel(deceptionProbability: number): string {
  if (deceptionProbability >= 0.85) return 'critical';
  if (deceptionProbability >= 0.70) return 'high';
  if (deceptionProbability >= 0.50) return 'medium';
  return 'low';
}
