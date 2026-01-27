/**
 * Stylometric Analysis Hook (v9.0)
 * 
 * React hook for stylometric analysis, authorship attribution, and LLM detection.
 * 
 * @version 9.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  analyzeStylometry, 
  compareAuthorship,
  type StylometricAnalysis,
  type AuthorshipMatch,
} from '@/lib/linguistics/stylometricAnalyzer';
import { detectLLMGenerated, type LLMDetectionResult } from '@/lib/linguistics/llmDetectionEngine';

export interface StylometricRecord {
  id: string;
  profileId?: string;
  text: string;
  analysis: StylometricAnalysis;
  llmDetection: LLMDetectionResult;
  authorshipMatches: AuthorshipMatch[];
  createdAt: string;
}

export function useStylemetricAnalysis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch cached analyses for profile
  const { data: cachedAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['stylometric-analyses', profileId],
    queryFn: async () => {
      let query = supabase
        .from('ai_analyses')
        .select('*')
        .eq('analysis_type', 'stylometric')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        profileId: row.profile_id as string | undefined,
        text: ((row.results as Record<string, unknown>)?.sourceText || '') as string,
        analysis: ((row.results as Record<string, unknown>)?.stylometricAnalysis || {}) as StylometricAnalysis,
        llmDetection: ((row.results as Record<string, unknown>)?.llmDetection || {}) as LLMDetectionResult,
        authorshipMatches: ((row.results as Record<string, unknown>)?.authorshipMatches || []) as AuthorshipMatch[],
        createdAt: row.created_at as string,
      })) as StylometricRecord[];
    },
    enabled: !!user,
  });

  // Analyze text locally (fast, client-side)
  const analyzeText = (text: string): StylometricAnalysis => {
    return analyzeStylometry(text);
  };

  // Detect if text is LLM-generated (client-side)
  const detectLLM = (text: string): LLMDetectionResult => {
    return detectLLMGenerated(text);
  };

  // Compare authorship against profile samples
  const compareAuthorshipMutation = useMutation({
    mutationFn: async (input: { text: string; targetProfileId: string }) => {
      // Fetch profile's writing samples from observations
      const { data: observations } = await supabase
        .from('contact_observations')
        .select('observation')
        .eq('profile_id', input.targetProfileId)
        .not('observation', 'is', null)
        .limit(10);

      const referenceSamples = (observations || [])
        .map((o) => (o as { observation: string }).observation)
        .filter((t) => t && t.length > 50);

      if (referenceSamples.length === 0) {
        throw new Error('Insufficient writing samples for authorship comparison');
      }

      // Perform comparison using the stylometric analyzer
      // Since the function expects 4 args, we'll compare against each sample
      const matches: AuthorshipMatch[] = [];
      for (const sample of referenceSamples) {
        const match = compareAuthorship(input.text, sample, 'input', input.targetProfileId);
        matches.push(match);
      }
      
      // Return the best match
      return matches.sort((a, b) => b.similarity - a.similarity)[0];
    },
  });

  // Full analysis with edge function (comprehensive, server-side)
  const fullAnalysisMutation = useMutation({
    mutationFn: async (input: { 
      text: string; 
      profileId?: string;
      compareToProfiles?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('stylometric-fingerprinter', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          text: input.text,
          compareToProfiles: input.compareToProfiles,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stylometric-analyses'] });
    },
  });

  // Get aggregated statistics
  const getStatistics = () => {
    if (!cachedAnalyses || cachedAnalyses.length === 0) {
      return null;
    }

    const llmDetections = cachedAnalyses.filter(a => a.llmDetection?.isLLMGenerated);
    const avgConfidence = cachedAnalyses.reduce((sum, a) => 
      sum + (a.llmDetection?.confidence || 0), 0
    ) / cachedAnalyses.length;

    return {
      totalAnalyses: cachedAnalyses.length,
      llmDetectedCount: llmDetections.length,
      llmDetectionRate: llmDetections.length / cachedAnalyses.length,
      averageConfidence: avgConfidence,
      mostCommonModel: getMostCommonModel(cachedAnalyses),
    };
  };

  return {
    cachedAnalyses,
    isLoading: analysesLoading,
    analyzeText,
    detectLLM,
    compareAuthorship: compareAuthorshipMutation.mutateAsync,
    isComparing: compareAuthorshipMutation.isPending,
    runFullAnalysis: fullAnalysisMutation.mutateAsync,
    isAnalyzing: fullAnalysisMutation.isPending,
    statistics: getStatistics(),
  };
}

// Helper to find most common predicted model
function getMostCommonModel(analyses: StylometricRecord[]): string | null {
  const modelCounts: Record<string, number> = {};
  
  for (const analysis of analyses) {
    const model = analysis.llmDetection?.predictedModel;
    if (model) {
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    }
  }
  
  const sorted = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || null;
}
