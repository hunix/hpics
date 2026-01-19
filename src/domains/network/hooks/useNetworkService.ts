/**
 * Network Domain Hooks
 * React hooks for consuming the NetworkService
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDI } from '@/infrastructure/di/DIContext';

// Hook for fetching network graph
export function useNetworkGraph(maxNodes?: number) {
  const { user } = useAuth();
  const { getNetworkService } = useDI();
  const networkService = getNetworkService();

  return useQuery({
    queryKey: ['network-graph', user?.id, maxNodes],
    queryFn: () => networkService.getNetworkGraph(user!.id, maxNodes),
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Hook for network analysis
export function useNetworkAnalysis(options?: { maxNodes?: number; enabled?: boolean }) {
  const { user } = useAuth();
  const { getNetworkService } = useDI();
  const networkService = getNetworkService();

  return useQuery({
    queryKey: ['network-analysis', user?.id, options?.maxNodes],
    queryFn: () => networkService.analyzeNetwork({
      userId: user!.id,
      includeMetrics: true,
      includeClusters: true,
      maxNodes: options?.maxNodes,
    }),
    enabled: (options?.enabled ?? true) && !!user?.id,
    staleTime: 300000, // 5 minutes
  });
}

// Hook for network summary
export function useNetworkSummary() {
  const { user } = useAuth();
  const { getNetworkService } = useDI();
  const networkService = getNetworkService();

  return useQuery({
    queryKey: ['network-summary', user?.id],
    queryFn: () => networkService.getNetworkSummary(user!.id),
    enabled: !!user?.id,
    staleTime: 120000, // 2 minutes
  });
}

// Hook for influence simulation
export function useInfluenceSimulation() {
  const { user } = useAuth();
  const { getNetworkService } = useDI();
  const networkService = getNetworkService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seedNodeId, steps }: { seedNodeId: string; steps?: number }) =>
      networkService.simulateInfluence(user!.id, seedNodeId, steps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influence-simulation'] });
    },
  });
}

// Hook for connection recommendations
export function useConnectionRecommendations(profileId: string, limit?: number) {
  const { user } = useAuth();
  const { getNetworkService } = useDI();
  const networkService = getNetworkService();

  return useQuery({
    queryKey: ['connection-recommendations', user?.id, profileId, limit],
    queryFn: () => networkService.getConnectionRecommendations(user!.id, profileId, limit),
    enabled: !!user?.id && !!profileId,
    staleTime: 300000,
  });
}

// Hook for sleeping connections
export function useSleepingConnections(dormancyThreshold?: number) {
  const { user } = useAuth();
  const { getNetworkService } = useDI();
  const networkService = getNetworkService();

  return useQuery({
    queryKey: ['sleeping-connections', user?.id, dormancyThreshold],
    queryFn: () => networkService.detectSleepingConnections(user!.id, dormancyThreshold),
    enabled: !!user?.id,
    staleTime: 300000,
  });
}

// Aggregated hook for all network operations
export function useNetwork() {
  const graph = useNetworkGraph();
  const summary = useNetworkSummary();
  const analysis = useNetworkAnalysis({ enabled: false }); // Lazy load
  const influenceSimulation = useInfluenceSimulation();
  const sleepingConnections = useSleepingConnections();

  return {
    // Data
    graph: graph.data,
    summary: summary.data,
    analysis: analysis.data,
    sleepingConnections: sleepingConnections.data,
    
    // Loading states
    isLoading: graph.isLoading || summary.isLoading,
    isAnalyzing: analysis.isFetching,
    
    // Actions
    simulateInfluence: influenceSimulation.mutateAsync,
    refetchGraph: graph.refetch,
    refetchAnalysis: analysis.refetch,
    
    // Errors
    error: graph.error || summary.error || analysis.error,
  };
}
