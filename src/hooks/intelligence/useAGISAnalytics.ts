import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AnalyticsMetric {
  id: string;
  phase: number;
  metricType: string;
  metricValue: number;
  metricMetadata: Record<string, unknown>;
  recordedAt: string;
}

export interface ObjectiveTracking {
  id: string;
  profileId: string | null;
  objectiveName: string;
  objectiveType: string;
  startingPhase: number;
  currentPhase: number;
  phaseProgression: Array<{ phase: number; enteredAt: string; exitedAt?: string }>;
  completionPercentage: number;
  targetOutcome: Record<string, unknown>;
  achievedOutcomes: Array<{ outcome: string; achievedAt: string }>;
  blockers: Array<{ blocker: string; phase: number }>;
  isActive: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface PhasePerformance {
  phase: number;
  name: string;
  operationsCount: number;
  successRate: number;
  avgDuration: number;
  lastActivity: string | null;
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
  18: 'Unified Supremacy'
};

export function useAGISAnalytics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch analytics metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['agis-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('agis_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        phase: row.phase,
        metricType: row.metric_type,
        metricValue: Number(row.metric_value) || 0,
        metricMetadata: row.metric_metadata || {},
        recordedAt: row.recorded_at
      })) as AnalyticsMetric[];
    },
    enabled: !!user?.id
  });

  // Fetch objective tracking
  const { data: objectives, isLoading: objectivesLoading } = useQuery({
    queryKey: ['agis-objectives', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('agis_objective_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        profileId: row.profile_id,
        objectiveName: row.objective_name,
        objectiveType: row.objective_type,
        startingPhase: row.starting_phase,
        currentPhase: row.current_phase,
        phaseProgression: row.phase_progression || [],
        completionPercentage: Number(row.completion_percentage) || 0,
        targetOutcome: row.target_outcome || {},
        achievedOutcomes: row.achieved_outcomes || [],
        blockers: row.blockers || [],
        isActive: row.is_active,
        createdAt: row.created_at,
        completedAt: row.completed_at
      })) as ObjectiveTracking[];
    },
    enabled: !!user?.id
  });

  // Record analytics metric
  const recordMetric = useMutation({
    mutationFn: async ({ phase, metricType, metricValue, metadata }: {
      phase: number;
      metricType: string;
      metricValue: number;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('No user');
      
      const { error } = await (supabase as any)
        .from('agis_analytics')
        .insert({
          user_id: user.id,
          phase,
          metric_type: metricType,
          metric_value: metricValue,
          metric_metadata: metadata || {}
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-analytics'] });
    }
  });

  // Create objective
  const createObjective = useMutation({
    mutationFn: async (objective: {
      objectiveName: string;
      objectiveType: string;
      startingPhase: number;
      profileId?: string;
      targetOutcome?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await (supabase as any)
        .from('agis_objective_tracking')
        .insert({
          user_id: user.id,
          profile_id: objective.profileId || null,
          objective_name: objective.objectiveName,
          objective_type: objective.objectiveType,
          starting_phase: objective.startingPhase,
          current_phase: objective.startingPhase,
          phase_progression: [{ phase: objective.startingPhase, enteredAt: new Date().toISOString() }],
          target_outcome: objective.targetOutcome || {},
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-objectives'] });
    }
  });

  // Update objective progress
  const updateObjectiveProgress = useMutation({
    mutationFn: async ({ objectiveId, newPhase, completionPercentage, achievedOutcome }: {
      objectiveId: string;
      newPhase?: number;
      completionPercentage?: number;
      achievedOutcome?: string;
    }) => {
      const objective = objectives?.find(o => o.id === objectiveId);
      if (!objective) throw new Error('Objective not found');
      
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      
      if (newPhase !== undefined && newPhase !== objective.currentPhase) {
        const progression = [...objective.phaseProgression];
        if (progression.length > 0) {
          progression[progression.length - 1].exitedAt = new Date().toISOString();
        }
        progression.push({ phase: newPhase, enteredAt: new Date().toISOString() });
        updates.current_phase = newPhase;
        updates.phase_progression = progression;
      }
      
      if (completionPercentage !== undefined) {
        updates.completion_percentage = completionPercentage;
        if (completionPercentage >= 100) {
          updates.is_active = false;
          updates.completed_at = new Date().toISOString();
        }
      }
      
      if (achievedOutcome) {
        updates.achieved_outcomes = [
          ...objective.achievedOutcomes,
          { outcome: achievedOutcome, achievedAt: new Date().toISOString() }
        ];
      }
      
      const { error } = await (supabase as any)
        .from('agis_objective_tracking')
        .update(updates)
        .eq('id', objectiveId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-objectives'] });
    }
  });

  // Compute phase performance from metrics
  const phasePerformance = useMemo((): PhasePerformance[] => {
    if (!metrics) return [];
    
    const phaseMap = new Map<number, { ops: number; successes: number; durations: number[]; lastAt: string | null }>();
    
    metrics.forEach(m => {
      const existing = phaseMap.get(m.phase) || { ops: 0, successes: 0, durations: [], lastAt: null };
      
      if (m.metricType === 'operation_completed') {
        existing.ops++;
        if (m.metricMetadata.success) existing.successes++;
        if (typeof m.metricMetadata.duration === 'number') existing.durations.push(m.metricMetadata.duration);
      }
      
      if (!existing.lastAt || m.recordedAt > existing.lastAt) {
        existing.lastAt = m.recordedAt;
      }
      
      phaseMap.set(m.phase, existing);
    });
    
    return Array.from(phaseMap.entries()).map(([phase, data]) => ({
      phase,
      name: PHASE_NAMES[phase] || `Phase ${phase}`,
      operationsCount: data.ops,
      successRate: data.ops > 0 ? (data.successes / data.ops) * 100 : 0,
      avgDuration: data.durations.length > 0 
        ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length 
        : 0,
      lastActivity: data.lastAt
    })).sort((a, b) => a.phase - b.phase);
  }, [metrics]);

  const stats = useMemo(() => ({
    totalMetrics: metrics?.length || 0,
    activeObjectives: objectives?.filter(o => o.isActive).length || 0,
    completedObjectives: objectives?.filter(o => !o.isActive && o.completedAt).length || 0,
    avgCompletion: objectives?.length 
      ? objectives.reduce((sum, o) => sum + o.completionPercentage, 0) / objectives.length
      : 0,
    phasesWithActivity: phasePerformance.filter(p => p.operationsCount > 0).length
  }), [metrics, objectives, phasePerformance]);

  return {
    metrics: metrics || [],
    objectives: objectives || [],
    phasePerformance,
    isLoading: metricsLoading || objectivesLoading,
    stats,
    phaseNames: PHASE_NAMES,
    recordMetric,
    createObjective,
    updateObjectiveProgress
  };
}
