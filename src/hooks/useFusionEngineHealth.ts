/**
 * Fusion Engine Health Monitor Hook (v1.0)
 * 
 * Provides real-time health monitoring for all 65+ fusion engines.
 * Tracks success rates, latency, errors, and overall system health.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { FusionEngineType } from '@/domains/fusion/entities/FusionResult';
import { FUSION_ANALYSIS_TYPES } from '@/domains/fusion/repositories/IFusionRepository';
import { edgeFunctionHealthMonitor, FunctionHealthStats } from '@/lib/edgeFunctionHealthMonitor';

// Engine categorization for UI grouping
export const ENGINE_CATEGORIES = {
  'Core Fusion (v1-v4)': [
    'temporal-fusion-transformer',
    'behavioral-digital-twin', 
    'graph-rag',
    'shadow-network',
    'dempster-shafer',
    'counterfactual',
    'pattern-of-life',
    'entity-resolution',
    'sentiment-cascade',
  ],
  'Data Integration (v5.0)': [
    'biometric-behavioral',
    'geospatial-communication',
    'financial-document',
    'calendar-pattern',
  ],
  'Advanced Intelligence (v6.0)': [
    'relationship-half-life',
    'automated-red-team',
    'multi-party-deception',
    'zero-day-anomaly',
    'hypergame-theory',
  ],
  'Extreme Intelligence (v7.0)': [
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
  ],
  'Counter-Intelligence (v8.0)': [
    'draco-deception-orchestrator',
    'sentient-intent-analyzer',
    'insider-threat-matrix',
    'bayesian-intention-predictor',
    'red-team-adversary-simulator',
    'semafor-forgery-detector',
    'epistemic-vulnerability-scanner',
    'cognitive-iw-detector',
  ],
  'Psychological Warfare (v8.0)': [
    'psychoagent-cascade-predictor',
    'affective-manipulation-detector',
    'hyperpersonalization-engine',
    'computational-persuasion-engine',
    'synthetic-memory-generator',
    'premem-belief-modifier',
    'linguistic-stress-detector',
    'memory-anchor-generator',
    'emotional-contagion-modeler',
    'sacred-value-predictor',
  ],
  'Biometric & Network (v8.0)': [
    'pupillometry-analyzer',
    'thermal-stress-detector',
    'attention-multimodal-fuser',
    'keystroke-dynamics-analyzer',
    'sheaf-neural-influence-mapper',
    'ctdg-link-predictor',
    'cascade-virality-predictor',
    'network-resilience-analyzer',
    'gaze-pattern-analyzer',
    'micro-expression-timeline',
    'voice-stress-correlator',
    'social-graph-predictor',
    'behavioral-fingerprint-engine',
  ],
  'Doctrine & Prediction (v8.0)': [
    'influence-campaign-optimizer',
    'counter-narrative-generator',
    'predictive-doctrine-engine',
    'cognitive-defense-simulator',
  ],
} as const;

export interface EngineHealthStats {
  engineType: FusionEngineType;
  analysisType: string;
  category: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  lastExecutedAt: Date | null;
  lastError: string | null;
  lastErrorAt: Date | null;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  trend: 'improving' | 'stable' | 'degrading';
}

export interface CategoryHealth {
  category: string;
  engineCount: number;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  unknownCount: number;
  avgSuccessRate: number;
  avgLatencyMs: number;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
}

export interface FusionSystemHealth {
  totalEngines: number;
  healthyEngines: number;
  degradedEngines: number;
  downEngines: number;
  unknownEngines: number;
  overallSuccessRate: number;
  avgLatencyMs: number;
  totalExecutions24h: number;
  lastUpdated: Date;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
}

export function useFusionEngineHealth() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeStats, setRealtimeStats] = useState<Map<string, FunctionHealthStats>>(new Map());

  // Subscribe to real-time health updates
  useEffect(() => {
    const unsubscribe = edgeFunctionHealthMonitor.subscribe((stats) => {
      setRealtimeStats(new Map(stats));
    });
    return unsubscribe;
  }, []);

  // Fetch historical engine execution data from ai_usage_logs
  const { data: historicalData, isLoading: isLoadingHistorical } = useQuery({
    queryKey: ['fusion-engine-health', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('function_name, status, response_time_ms, created_at, error_message')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent ai_analyses for engine activity tracking
  const { data: analysisData, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: ['fusion-analysis-activity', user?.id],
    queryFn: async () => {
      const analysisTypes = Object.values(FUSION_ANALYSIS_TYPES);
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('analysis_type, generated_at')
        .in('analysis_type', analysisTypes)
        .order('generated_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data ?? []) as unknown as Array<{ analysis_type: string; generated_at: string }>;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Get category for an engine
  const getEngineCategory = useCallback((engineType: string): string => {
    for (const [category, engines] of Object.entries(ENGINE_CATEGORIES)) {
      if ((engines as readonly string[]).includes(engineType)) {
        return category;
      }
    }
    return 'Unknown';
  }, []);

  // Compute individual engine health stats
  const engineHealthStats = useMemo((): Map<FusionEngineType, EngineHealthStats> => {
    const stats = new Map<FusionEngineType, EngineHealthStats>();
    const allEngineTypes = Object.keys(FUSION_ANALYSIS_TYPES) as FusionEngineType[];

    for (const engineType of allEngineTypes) {
      const analysisType = FUSION_ANALYSIS_TYPES[engineType];
      const category = getEngineCategory(engineType);

      // Get logs for this engine's edge function
      const engineLogs = historicalData?.filter(log => 
        log.function_name?.includes(engineType) ||
        log.function_name === engineType.replace(/-/g, '_')
      ) ?? [];

      // Get analysis records
      const engineAnalyses = analysisData?.filter(a => 
        a.analysis_type === analysisType
      ) ?? [];

      // Get real-time stats if available
      const realtimeStat = realtimeStats.get(engineType);

      const totalExecutions = engineLogs.length + (realtimeStat?.totalCalls ?? 0);
      const successCount = engineLogs.filter(l => l.status === 'success').length + (realtimeStat?.successCount ?? 0);
      const failureCount = totalExecutions - successCount;
      const successRate = totalExecutions > 0 ? successCount / totalExecutions : 1;

      const latencies = engineLogs
        .map(l => l.response_time_ms)
        .filter((ms): ms is number => ms !== null && ms > 0);
      const avgLatencyMs = latencies.length > 0 
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : realtimeStat?.avgResponseTimeMs ?? 0;
      const minLatencyMs = latencies.length > 0 ? Math.min(...latencies) : 0;
      const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;

      const lastLog = engineLogs[0];
      const lastAnalysis = engineAnalyses[0];
      const lastExecutedAt = lastLog?.created_at 
        ? new Date(lastLog.created_at)
        : lastAnalysis?.generated_at 
          ? new Date(lastAnalysis.generated_at)
          : realtimeStat?.lastCallAt ?? null;

      const errorLogs = engineLogs.filter(l => l.status !== 'success' && l.error_message);
      const lastError = errorLogs[0]?.error_message ?? realtimeStat?.lastError ?? null;
      const lastErrorAt = errorLogs[0]?.created_at 
        ? new Date(errorLogs[0].created_at)
        : realtimeStat?.lastErrorAt ?? null;

      // Determine status
      let status: EngineHealthStats['status'] = 'unknown';
      if (totalExecutions > 0) {
        if (successRate >= 0.9) status = 'healthy';
        else if (successRate >= 0.5) status = 'degraded';
        else status = 'down';
      } else if (engineAnalyses.length > 0) {
        status = 'healthy'; // Has analysis output, assume healthy
      }

      // Determine trend (compare last 10 vs previous 10)
      let trend: EngineHealthStats['trend'] = 'stable';
      if (engineLogs.length >= 20) {
        const recent10 = engineLogs.slice(0, 10);
        const prev10 = engineLogs.slice(10, 20);
        const recentSuccess = recent10.filter(l => l.status === 'success').length / 10;
        const prevSuccess = prev10.filter(l => l.status === 'success').length / 10;
        if (recentSuccess > prevSuccess + 0.1) trend = 'improving';
        else if (recentSuccess < prevSuccess - 0.1) trend = 'degrading';
      }

      stats.set(engineType, {
        engineType,
        analysisType,
        category,
        totalExecutions,
        successCount,
        failureCount,
        successRate,
        avgLatencyMs,
        minLatencyMs,
        maxLatencyMs,
        lastExecutedAt,
        lastError,
        lastErrorAt,
        status,
        trend,
      });
    }

    return stats;
  }, [historicalData, analysisData, realtimeStats, getEngineCategory]);

  // Compute category health summaries
  const categoryHealth = useMemo((): Map<string, CategoryHealth> => {
    const categories = new Map<string, CategoryHealth>();

    for (const [category, engines] of Object.entries(ENGINE_CATEGORIES)) {
      let healthyCount = 0;
      let degradedCount = 0;
      let downCount = 0;
      let unknownCount = 0;
      let totalSuccessRate = 0;
      let totalLatency = 0;
      let enginesWithStats = 0;

      for (const engineType of engines) {
        const stats = engineHealthStats.get(engineType as FusionEngineType);
        if (stats) {
          if (stats.status === 'healthy') healthyCount++;
          else if (stats.status === 'degraded') degradedCount++;
          else if (stats.status === 'down') downCount++;
          else unknownCount++;

          if (stats.totalExecutions > 0) {
            totalSuccessRate += stats.successRate;
            totalLatency += stats.avgLatencyMs;
            enginesWithStats++;
          }
        }
      }

      const avgSuccessRate = enginesWithStats > 0 ? totalSuccessRate / enginesWithStats : 1;
      const avgLatencyMs = enginesWithStats > 0 ? Math.round(totalLatency / enginesWithStats) : 0;

      let status: CategoryHealth['status'] = 'unknown';
      if (downCount > engines.length / 2) status = 'down';
      else if (degradedCount > engines.length / 3) status = 'degraded';
      else if (healthyCount >= engines.length / 2) status = 'healthy';

      categories.set(category, {
        category,
        engineCount: engines.length,
        healthyCount,
        degradedCount,
        downCount,
        unknownCount,
        avgSuccessRate,
        avgLatencyMs,
        status,
      });
    }

    return categories;
  }, [engineHealthStats]);

  // Compute overall system health
  const systemHealth = useMemo((): FusionSystemHealth => {
    let healthyEngines = 0;
    let degradedEngines = 0;
    let downEngines = 0;
    let unknownEngines = 0;
    let totalSuccessRate = 0;
    let totalLatency = 0;
    let totalExecutions = 0;
    let enginesWithStats = 0;

    for (const stats of engineHealthStats.values()) {
      if (stats.status === 'healthy') healthyEngines++;
      else if (stats.status === 'degraded') degradedEngines++;
      else if (stats.status === 'down') downEngines++;
      else unknownEngines++;

      totalExecutions += stats.totalExecutions;
      if (stats.totalExecutions > 0) {
        totalSuccessRate += stats.successRate;
        totalLatency += stats.avgLatencyMs;
        enginesWithStats++;
      }
    }

    const overallSuccessRate = enginesWithStats > 0 ? totalSuccessRate / enginesWithStats : 1;
    const avgLatencyMs = enginesWithStats > 0 ? Math.round(totalLatency / enginesWithStats) : 0;

    let status: FusionSystemHealth['status'] = 'unknown';
    const totalEngines = engineHealthStats.size;
    if (downEngines > totalEngines / 4) status = 'down';
    else if (degradedEngines > totalEngines / 3) status = 'degraded';
    else if (healthyEngines >= totalEngines / 2) status = 'healthy';

    return {
      totalEngines,
      healthyEngines,
      degradedEngines,
      downEngines,
      unknownEngines,
      overallSuccessRate,
      avgLatencyMs,
      totalExecutions24h: totalExecutions,
      lastUpdated: new Date(),
      status,
    };
  }, [engineHealthStats]);

  // Refresh function
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['fusion-engine-health'] });
    queryClient.invalidateQueries({ queryKey: ['fusion-analysis-activity'] });
  }, [queryClient]);

  return {
    engineHealthStats,
    categoryHealth,
    systemHealth,
    isLoading: isLoadingHistorical || isLoadingAnalysis,
    refresh,
    ENGINE_CATEGORIES,
  };
}
