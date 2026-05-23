import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json, TableInsert } from '@/types/database-helpers';

export interface CascadeEvent {
  id: string;
  triggerPhase: number;
  triggerEventType: string;
  triggerSourceId: string | null;
  cascadePath: Array<{ phase: number; action: string; timestamp: string }>;
  affectedPhases: number[];
  outcomeStatus: 'pending' | 'executing' | 'completed' | 'failed';
  executionLog: Array<{ phase: number; message: string; timestamp: string }>;
  startedAt: string;
  completedAt: string | null;
  createdAt: string | null;
}

export interface CascadeRule {
  id: string;
  ruleName: string;
  sourcePhase: number;
  sourceTable: string;
  triggerCondition: Record<string, unknown>;
  targetPhase: number;
  targetAction: string;
  actionParams: Record<string, unknown>;
  isActive: boolean;
  priority: number;
  cooldownMinutes: number;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string | null;
}

export interface PhaseSynergy {
  id: string;
  phaseA: number;
  phaseB: number;
  synergyScore: number;
  synergyType: string;
  interactionCount: number;
  successfulCascades: number;
  lastInteractionAt: string | null;
}

export function useAGISCascade() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeEvents, setRealtimeEvents] = useState<CascadeEvent[]>([]);

  // Fetch cascade events
  const { data: cascadeEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['agis-cascade-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('agis_cascade_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((row): CascadeEvent => ({
        id: row.id,
        triggerPhase: row.trigger_phase,
        triggerEventType: row.trigger_event_type,
        triggerSourceId: row.trigger_source_id,
        cascadePath: (row.cascade_path as CascadeEvent['cascadePath']) ?? [],
        affectedPhases: row.affected_phases ?? [],
        outcomeStatus: (row.outcome_status ?? 'pending') as CascadeEvent['outcomeStatus'],
        executionLog: (row.execution_log as CascadeEvent['executionLog']) ?? [],
        startedAt: row.started_at ?? '',
        completedAt: row.completed_at,
        createdAt: row.created_at ?? '',
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch cascade rules
  const { data: cascadeRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['agis-cascade-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('agis_cascade_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (error) throw error;

      return (data || []).map((row): CascadeRule => ({
        id: row.id,
        ruleName: row.rule_name,
        sourcePhase: row.source_phase,
        sourceTable: row.source_table,
        triggerCondition: (row.trigger_condition as Record<string, unknown>) ?? {},
        targetPhase: row.target_phase,
        targetAction: row.target_action,
        actionParams: (row.action_params as Record<string, unknown>) ?? {},
        isActive: row.is_active ?? false,
        priority: row.priority ?? 0,
        cooldownMinutes: row.cooldown_minutes ?? 5,
        lastTriggeredAt: row.last_triggered_at,
        triggerCount: row.trigger_count ?? 0,
        createdAt: row.created_at ?? '',
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch phase synergies
  const { data: phaseSynergies, isLoading: synergiesLoading } = useQuery({
    queryKey: ['agis-phase-synergies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('agis_phase_synergies')
        .select('*')
        .eq('user_id', user.id)
        .order('synergy_score', { ascending: false });

      if (error) throw error;

      return (data || []).map((row): PhaseSynergy => ({
        id: row.id,
        phaseA: row.phase_a,
        phaseB: row.phase_b,
        synergyScore: Number(row.synergy_score) || 0,
        synergyType: row.synergy_type ?? '',
        interactionCount: row.interaction_count ?? 0,
        successfulCascades: row.successful_cascades ?? 0,
        lastInteractionAt: row.last_interaction_at,
      }));
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime cascade events
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('agis-cascade-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agis_cascade_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as typeof payload.new & {
              id: string; trigger_phase: number; trigger_event_type: string;
              trigger_source_id: string | null; cascade_path: unknown;
              affected_phases: number[] | null; outcome_status: string | null;
              execution_log: unknown; started_at: string | null;
              completed_at: string | null; created_at: string | null;
            };
            const newEvent: CascadeEvent = {
              id: row.id,
              triggerPhase: row.trigger_phase,
              triggerEventType: row.trigger_event_type,
              triggerSourceId: row.trigger_source_id,
              cascadePath: (row.cascade_path as CascadeEvent['cascadePath']) ?? [],
              affectedPhases: row.affected_phases ?? [],
              outcomeStatus: (row.outcome_status ?? 'pending') as CascadeEvent['outcomeStatus'],
              executionLog: (row.execution_log as CascadeEvent['executionLog']) ?? [],
              startedAt: row.started_at ?? '',
              completedAt: row.completed_at,
              createdAt: row.created_at ?? '',
            };
            setRealtimeEvents(prev => [newEvent, ...prev].slice(0, 10));
          }
          queryClient.invalidateQueries({ queryKey: ['agis-cascade-events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Create cascade rule
  const createCascadeRule = useMutation({
    mutationFn: async (rule: Omit<CascadeRule, 'id' | 'lastTriggeredAt' | 'triggerCount' | 'createdAt'>) => {
      if (!user?.id) throw new Error('No user');

      const insertData: TableInsert<'agis_cascade_rules'> = {
        user_id: user.id,
        rule_name: rule.ruleName,
        source_phase: rule.sourcePhase,
        source_table: rule.sourceTable,
        trigger_condition: rule.triggerCondition as unknown as Json,
        target_phase: rule.targetPhase,
        target_action: rule.targetAction,
        action_params: rule.actionParams as unknown as Json,
        is_active: rule.isActive,
        priority: rule.priority,
        cooldown_minutes: rule.cooldownMinutes,
      };

      const { data, error } = await supabase
        .from('agis_cascade_rules')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-cascade-rules'] });
    },
  });

  // Toggle rule active status
  const toggleRule = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('agis_cascade_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-cascade-rules'] });
    },
  });

  // Trigger manual cascade
  const triggerCascade = useMutation({
    mutationFn: async ({ triggerPhase, eventType, sourceId }: { triggerPhase: number; eventType: string; sourceId?: string }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('agis_cascade_events')
        .insert({
          user_id: user.id,
          trigger_phase: triggerPhase,
          trigger_event_type: eventType,
          trigger_source_id: sourceId || null,
          cascade_path: [{ phase: triggerPhase, action: eventType, timestamp: new Date().toISOString() }],
          affected_phases: [triggerPhase],
          outcome_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-cascade-events'] });
    },
  });

  // Record phase synergy
  const recordSynergy = useMutation({
    mutationFn: async ({ phaseA, phaseB, success }: { phaseA: number; phaseB: number; success: boolean }) => {
      if (!user?.id) throw new Error('No user');

      // Ensure consistent ordering
      const [pA, pB] = phaseA < phaseB ? [phaseA, phaseB] : [phaseB, phaseA];

      const { data: existing } = await supabase
        .from('agis_phase_synergies')
        .select('*')
        .eq('user_id', user.id)
        .eq('phase_a', pA)
        .eq('phase_b', pB)
        .maybeSingle();

      if (existing) {
        const newScore = success
          ? Math.min(100, (existing.synergy_score ?? 0) + 5)
          : Math.max(0, (existing.synergy_score ?? 0) - 2);

        const { error } = await supabase
          .from('agis_phase_synergies')
          .update({
            synergy_score: newScore,
            interaction_count: (existing.interaction_count ?? 0) + 1,
            successful_cascades: success
              ? (existing.successful_cascades ?? 0) + 1
              : existing.successful_cascades,
            last_interaction_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agis_phase_synergies')
          .insert({
            user_id: user.id,
            phase_a: pA,
            phase_b: pB,
            synergy_score: success ? 60 : 40,
            synergy_type: 'complementary',
            interaction_count: 1,
            successful_cascades: success ? 1 : 0,
            last_interaction_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-phase-synergies'] });
    },
  });

  const stats = useMemo(() => ({
    totalEvents: cascadeEvents?.length || 0,
    pendingEvents: cascadeEvents?.filter(e => e.outcomeStatus === 'pending').length || 0,
    activeRules: cascadeRules?.filter(r => r.isActive).length || 0,
    totalRules: cascadeRules?.length || 0,
    averageSynergy: phaseSynergies?.length
      ? phaseSynergies.reduce((sum, s) => sum + s.synergyScore, 0) / phaseSynergies.length
      : 0,
  }), [cascadeEvents, cascadeRules, phaseSynergies]);

  return {
    cascadeEvents: cascadeEvents || [],
    cascadeRules: cascadeRules || [],
    phaseSynergies: phaseSynergies || [],
    realtimeEvents,
    isLoading: eventsLoading || rulesLoading || synergiesLoading,
    stats,
    createCascadeRule,
    toggleRule,
    triggerCascade,
    recordSynergy,
  };
}
