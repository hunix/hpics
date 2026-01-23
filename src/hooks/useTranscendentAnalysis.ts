/**
 * Transcendent Analysis Hook
 * Triggers AI analysis to populate Phase 20-21 tables
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type TranscendentAnalysisType = 'full' | 'quantum' | 'morphic' | 'collective' | 'omniscience';

interface TranscendentAnalysisResult {
  success: boolean;
  analysisType: string;
  insertedRecords: {
    quantum_states?: number;
    morphic_fields?: number;
    collective_fields?: number;
    universal_awareness?: number;
    absolute_knowledge?: number;
  };
  timestamp: string;
}

export function useTranscendentAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runAnalysisMutation = useMutation({
    mutationFn: async ({ 
      profileId, 
      analysisType = 'full' 
    }: { 
      profileId?: string; 
      analysisType?: TranscendentAnalysisType 
    }): Promise<TranscendentAnalysisResult> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('transcendent-analysis', {
        body: { 
          userId: user.id, 
          profileId, 
          analysisType 
        },
      });

      if (error) throw error;
      return data as TranscendentAnalysisResult;
    },
    onSuccess: (result) => {
      const totalInserted = Object.values(result.insertedRecords || {}).reduce((a, b) => a + b, 0);
      toast({
        title: 'Transcendent Analysis Complete',
        description: `Generated ${totalInserted} insights across ${Object.keys(result.insertedRecords || {}).length} categories`,
      });
      // Invalidate all Phase 20/21 related queries
      queryClient.invalidateQueries({ queryKey: ['quantum-cognition'] });
      queryClient.invalidateQueries({ queryKey: ['morphic-resonance'] });
      queryClient.invalidateQueries({ queryKey: ['collective-unconscious'] });
      queryClient.invalidateQueries({ queryKey: ['universal-awareness'] });
      queryClient.invalidateQueries({ queryKey: ['absolute-knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['synchronicity'] });
      queryClient.invalidateQueries({ queryKey: ['egregores'] });
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  return {
    runAnalysis: runAnalysisMutation.mutate,
    runAnalysisAsync: runAnalysisMutation.mutateAsync,
    isRunning: runAnalysisMutation.isPending,
    result: runAnalysisMutation.data,
    error: runAnalysisMutation.error,
  };
}
