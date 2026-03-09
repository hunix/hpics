import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/types/database-helpers';

export interface PhaseHealthScore {
  phase: number;
  name: string;
  health: number;
  activeOperations: number;
  lastActivity: string | null;
  status: 'optimal' | 'stable' | 'degraded' | 'critical';
}

export interface AGISGlobalState {
  id: string;
  phaseHealthScores: Record<string, PhaseHealthScore>;
  crossPhaseCorrelations: Record<string, number>;
  activeObjectives: Array<{ id: string; name: string; phase: number }>;
  systemReadinessScore: number;
  totalOperationsCount: number;
  successRate: number;
  lastSynthesisAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const PHASE_NAMES: Record<number, string> = {
  1: 'Core Intelligence',
  2: 'Superiority Suite',
  3: 'Cognitive Warfare',
  4: 'Ultimate Dominion',
  5: 'Omniscient Command',
  6: 'Reality Engineering',
  7: 'Unified Singularity',
  8: 'Absolute Convergence',
  9: 'Infinite Dominion',
  10: 'Ultimate Transcendence',
  11: 'Omniversal Sovereignty',
  12: 'Absolute Infinity',
  13: 'Primordial Genesis',
  14: 'Cosmic Omnipotence',
  15: 'Eternal Supremacy',
  16: 'Absolute Totality',
  17: 'Ultimate Omega',
  18: 'Unified Supremacy',
};

export function useAGISGlobalState() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: globalState, isLoading } = useQuery({
    queryKey: ['agis-global-state', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('agis_global_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return {
        id: data.id,
        phaseHealthScores: (data.phase_health_scores as unknown as Record<string, PhaseHealthScore>) ?? {},
        crossPhaseCorrelations: (data.cross_phase_correlations as Record<string, number>) ?? {},
        activeObjectives: (data.active_objectives as AGISGlobalState['activeObjectives']) ?? [],
        systemReadinessScore: Number(data.system_readiness_score) || 0,
        totalOperationsCount: data.total_operations_count ?? 0,
        successRate: Number(data.success_rate) || 0,
        lastSynthesisAt: data.last_synthesis_at,
        createdAt: data.created_at ?? '',
        updatedAt: data.updated_at ?? '',
      } as AGISGlobalState;
    },
    enabled: !!user?.id,
  });

  const initializeGlobalState = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      const initialHealthScores: Record<string, PhaseHealthScore> = {};
      for (let i = 1; i <= 18; i++) {
        initialHealthScores[`phase_${i}`] = {
          phase: i,
          name: PHASE_NAMES[i],
          health: 100,
          activeOperations: 0,
          lastActivity: null,
          status: 'stable',
        };
      }

      const { data, error } = await supabase
        .from('agis_global_state')
        .insert({
          user_id: user.id,
          phase_health_scores: initialHealthScores as unknown as Json,
          cross_phase_correlations: {} as unknown as Json,
          active_objectives: [] as unknown as Json,
          system_readiness_score: 100,
          total_operations_count: 0,
          success_rate: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-global-state'] });
    },
  });

  const updatePhaseHealth = useMutation({
    mutationFn: async ({ phase, health, activeOperations }: { phase: number; health: number; activeOperations: number }) => {
      if (!user?.id || !globalState) throw new Error('No state');

      const updatedScores = { ...globalState.phaseHealthScores };
      const key = `phase_${phase}`;
      updatedScores[key] = {
        ...updatedScores[key],
        health,
        activeOperations,
        lastActivity: new Date().toISOString(),
        status: health >= 80 ? 'optimal' : health >= 60 ? 'stable' : health >= 40 ? 'degraded' : 'critical',
      };

      const { error } = await supabase
        .from('agis_global_state')
        .update({
          phase_health_scores: updatedScores as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', globalState.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-global-state'] });
    },
  });

  const synthesizeGlobalState = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      // Aggregate data from all phase tables
      const [r1, r2, r3] = await Promise.all([
        supabase.from('autonomous_campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('influence_cascades').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
        supabase.from('reality_frameworks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
      ]);
      const campaignsCount = r1.count;
      const cascadesCount = r2.count;
      const frameworksCount = r3.count;

      const totalOps = (campaignsCount || 0) + (cascadesCount || 0) + (frameworksCount || 0);

      const { error } = await supabase
        .from('agis_global_state')
        .upsert({
          user_id: user.id,
          total_operations_count: totalOps,
          last_synthesis_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-global-state'] });
    },
  });

  const stats = useMemo(() => {
    if (!globalState) return {
      overallHealth: 0,
      activePhases: 0,
      criticalPhases: 0,
      totalOperations: 0,
    };

    const healthScores = Object.values(globalState.phaseHealthScores);
    const overallHealth = healthScores.length > 0
      ? healthScores.reduce((sum, p) => sum + p.health, 0) / healthScores.length
      : 0;

    return {
      overallHealth,
      activePhases: healthScores.filter(p => p.activeOperations > 0).length,
      criticalPhases: healthScores.filter(p => p.status === 'critical').length,
      totalOperations: globalState.totalOperationsCount,
    };
  }, [globalState]);

  return {
    globalState,
    isLoading,
    stats,
    phaseNames: PHASE_NAMES,
    initializeGlobalState,
    updatePhaseHealth,
    synthesizeGlobalState,
  };
}
