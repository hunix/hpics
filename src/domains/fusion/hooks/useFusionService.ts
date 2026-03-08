/**
 * Fusion Service Hook
 * 
 * React hook for accessing fusion domain functionality.
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FusionService, FusionRequest, BatchFusionRequest } from '../services/FusionService';
import { FusionEngineType } from '../entities/FusionResult';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getContainer, ServiceKeys } from '@/infrastructure/di/Container';

function resolveFusionService(): FusionService {
  try {
    const service = getContainer().resolve<FusionService>(ServiceKeys.FusionService);
    if (service) return service;
  } catch { /* fallback */ }
  // Lazy import to avoid circular dependency
  const { getFusionService } = require('../services/FusionService');
  return getFusionService();
}

/**
 * Hook for executing fusion operations
 */
export function useFusionService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = useMemo(() => resolveFusionService(), []);

  const executeFusion = useMutation({
    mutationFn: async (request: FusionRequest) => {
      return service.executeFusion(request);
    },
    onSuccess: (response, request) => {
      if (response.success) {
        toast.success(`${request.engineType} fusion completed`);
        queryClient.invalidateQueries({ queryKey: ['fusion-results', request.profileId] });
      } else {
        toast.error(`Fusion failed: ${response.error}`);
      }
    },
    onError: (error) => {
      toast.error(`Fusion error: ${error.message}`);
    },
  });

  const executeBatchFusion = useMutation({
    mutationFn: async (request: BatchFusionRequest) => {
      return service.executeBatchFusion(request);
    },
    onSuccess: (results, request) => {
      const successCount = Array.from(results.values()).filter(r => r.success).length;
      toast.success(`Batch fusion: ${successCount}/${request.engines.length} completed`);
      queryClient.invalidateQueries({ queryKey: ['fusion-results', request.profileId] });
    },
  });

  return {
    executeFusion: executeFusion.mutateAsync,
    executeBatchFusion: executeBatchFusion.mutateAsync,
    isExecuting: executeFusion.isPending || executeBatchFusion.isPending,
  };
}

/**
 * Hook for fetching fusion results
 */
export function useFusionResults(profileId?: string, engineType?: FusionEngineType) {
  const { user } = useAuth();
  const service = useMemo(() => resolveFusionService(), []);

  return useQuery({
    queryKey: ['fusion-results', profileId, engineType],
    queryFn: async () => {
      if (!profileId) return [];
      return service.getFusionResults(profileId, engineType);
    },
    enabled: !!user && !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for digital twin operations
 */
export function useDigitalTwin(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getFusionService();

  const updateTwin = useMutation({
    mutationFn: async (patterns: Array<{ patternType: string; frequency: number; confidence: number; contexts: string[] }>) => {
      if (!profileId) throw new Error('Profile ID required');
      return service.updateDigitalTwin(profileId, patterns.map(p => ({
        ...p,
        lastObserved: new Date(),
      })));
    },
    onSuccess: () => {
      toast.success('Digital twin updated');
      queryClient.invalidateQueries({ queryKey: ['digital-twin', profileId] });
    },
  });

  const runSimulation = useMutation({
    mutationFn: async ({ scenarioName, conditions }: { scenarioName: string; conditions: Record<string, unknown> }) => {
      if (!profileId) throw new Error('Profile ID required');
      return service.runTwinSimulation(profileId, scenarioName, conditions);
    },
    onSuccess: (result) => {
      if (result) {
        toast.success(`Simulation complete: ${result.predictedOutcome} (${(result.probability * 100).toFixed(1)}%)`);
      }
    },
  });

  return {
    updateTwin: updateTwin.mutateAsync,
    runSimulation: runSimulation.mutateAsync,
    isUpdating: updateTwin.isPending,
    isSimulating: runSimulation.isPending,
  };
}

/**
 * Hook for all fusion engines status
 */
export function useFusionEnginesStatus(profileId?: string) {
  const { user } = useAuth();

  const allEngines: FusionEngineType[] = [
    'temporal-fusion-transformer',
    'behavioral-digital-twin',
    'graph-rag',
    'shadow-network',
    'dempster-shafer',
    'counterfactual',
    'pattern-of-life',
    'entity-resolution',
    'sentiment-cascade',
    // v5.0 engines
    'biometric-behavioral',
    'geospatial-communication',
    'financial-document',
    'calendar-pattern',
    // v6.0 Advanced Intelligence engines
    'relationship-half-life',
    'automated-red-team',
    'multi-party-deception',
    'zero-day-anomaly',
    'hypergame-theory',
    // v7.0 Extreme Intelligence Engines
    'subvocalization-detection',
    'audio-burst-mental-state',
    'iio-attribution',
    'reflexive-control',
    'cognitive-effect',
    'kallisti-theory-of-mind',
    'magics-collective-behavior',
    'stylometric-authorship',
    'dark2clear-deanonymization',
    'gated-biological-fusion',
    'tas-com-community',
    'migration5-biometric',
  ];

  return useQuery({
    queryKey: ['fusion-engines-status', profileId],
    queryFn: async () => {
      const service = getFusionService();
      const results = await service.getFusionResults(profileId!);
      
      return allEngines.map(engine => {
        const engineResults = results.filter(r => r.engineType === engine);
        const latest = engineResults[0];
        
        return {
          engine,
          hasData: engineResults.length > 0,
          latestConfidence: latest?.confidenceValue,
          latestDate: latest?.createdAt,
          isStale: latest ? latest.isStale(24) : true,
        };
      });
    },
    enabled: !!user && !!profileId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
