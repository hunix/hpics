/**
 * Intelligence Service Hooks
 * 
 * React hooks for accessing intelligence domain functionality.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getIntelligenceService, AnalysisRequest, DossierRequest } from '../services/IntelligenceService';
import { AnalysisType } from '../entities/Analysis';
import { DossierTemplate } from '../entities/Dossier';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Hook for running analyses
 */
export function useAnalysis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getIntelligenceService();

  const runAnalysis = useMutation({
    mutationFn: async (request: Omit<AnalysisRequest, 'profileId'> & { profileId?: string }) => {
      const targetProfileId = request.profileId || profileId;
      if (!targetProfileId) throw new Error('Profile ID required');
      return service.runAnalyses({ ...request, profileId: targetProfileId });
    },
    onSuccess: (results, request) => {
      const successCount = results.filter(r => r.status === 'completed').length;
      toast.success(`Analysis complete: ${successCount} analyses run`);
      const targetProfileId = request.profileId || profileId;
      queryClient.invalidateQueries({ queryKey: ['analyses', targetProfileId] });
      queryClient.invalidateQueries({ queryKey: ['intelligence-summary', targetProfileId] });
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['analyses', profileId],
    queryFn: () => service.getAnalyses(profileId!),
    enabled: !!user && !!profileId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    analyses: analyses || [],
    isLoading,
    runAnalysis: runAnalysis.mutateAsync,
    isRunning: runAnalysis.isPending,
  };
}

/**
 * Hook for dossier operations
 */
export function useDossier(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getIntelligenceService();

  const generateDossier = useMutation({
    mutationFn: async (request: Omit<DossierRequest, 'profileId'> & { profileId?: string }) => {
      const targetProfileId = request.profileId || profileId;
      if (!targetProfileId) throw new Error('Profile ID required');
      return service.generateDossier({ ...request, profileId: targetProfileId });
    },
    onSuccess: (dossier, request) => {
      if (dossier) {
        toast.success(`Dossier generated: ${dossier.sectionCount} sections`);
        const targetProfileId = request.profileId || profileId;
        queryClient.invalidateQueries({ queryKey: ['dossier', targetProfileId] });
        queryClient.invalidateQueries({ queryKey: ['intelligence-summary', targetProfileId] });
      } else {
        toast.error('Dossier generation failed');
      }
    },
    onError: (error) => {
      toast.error(`Dossier generation failed: ${error.message}`);
    },
  });

  const { data: dossier, isLoading } = useQuery({
    queryKey: ['dossier', profileId],
    queryFn: () => service.getLatestDossier(profileId!),
    enabled: !!user && !!profileId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    dossier,
    isLoading,
    generateDossier: generateDossier.mutateAsync,
    isGenerating: generateDossier.isPending,
  };
}

/**
 * Hook for insights
 */
export function useInsights(profileId?: string) {
  const { user } = useAuth();
  const service = getIntelligenceService();

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['insights', profileId],
    queryFn: () => service.getActiveInsights(profileId!),
    enabled: !!user && !!profileId,
    staleTime: 2 * 60 * 1000,
  });

  const actionableInsights = insights?.filter(i => i.requiresAction()) || [];
  const criticalInsights = insights?.filter(i => i.priority === 'critical') || [];

  return {
    insights: insights || [],
    actionableInsights,
    criticalInsights,
    isLoading,
    refetch,
  };
}

/**
 * Hook for intelligence summary
 */
export function useIntelligenceSummary(profileId?: string) {
  const { user } = useAuth();
  const service = getIntelligenceService();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['intelligence-summary', profileId],
    queryFn: () => service.getIntelligenceSummary(profileId!),
    enabled: !!user && !!profileId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    summary,
    isLoading,
    hasData: (summary?.analysisCount || 0) > 0,
    needsAttention: (summary?.activeInsights || 0) > 0 || summary?.dossierStatus === 'stale',
  };
}

/**
 * Hook for intelligence aggregation
 */
export function useIntelligenceAggregation(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getIntelligenceService();

  const aggregate = useMutation({
    mutationFn: async (targetProfileId?: string) => {
      const id = targetProfileId || profileId;
      if (!id) throw new Error('Profile ID required');
      return service.aggregateIntelligence(id);
    },
    onSuccess: (_, targetProfileId) => {
      toast.success('Intelligence aggregated');
      const id = targetProfileId || profileId;
      queryClient.invalidateQueries({ queryKey: ['analyses', id] });
      queryClient.invalidateQueries({ queryKey: ['intelligence-summary', id] });
    },
  });

  return {
    aggregate: aggregate.mutateAsync,
    isAggregating: aggregate.isPending,
  };
}

/**
 * Hook for comprehensive intelligence operations
 */
export function useIntelligence(profileId?: string) {
  const analysis = useAnalysis(profileId);
  const dossier = useDossier(profileId);
  const insights = useInsights(profileId);
  const summary = useIntelligenceSummary(profileId);
  const aggregation = useIntelligenceAggregation(profileId);

  return {
    // Data
    analyses: analysis.analyses,
    dossier: dossier.dossier,
    insights: insights.insights,
    summary: summary.summary,
    
    // Loading states
    isLoading: analysis.isLoading || dossier.isLoading || insights.isLoading || summary.isLoading,
    
    // Actions
    runAnalysis: analysis.runAnalysis,
    generateDossier: dossier.generateDossier,
    aggregate: aggregation.aggregate,
    
    // Action states
    isRunning: analysis.isRunning || dossier.isGenerating || aggregation.isAggregating,
    
    // Computed
    hasData: summary.hasData,
    needsAttention: summary.needsAttention,
    criticalInsights: insights.criticalInsights,
  };
}
