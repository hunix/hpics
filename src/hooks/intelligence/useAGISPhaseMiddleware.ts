// AGIS Phase Middleware - Cross-Phase Integration Layer
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPhaseStatus, getPhaseName } from '@/lib/agis/phaseConfig';
import type {
  AGISAnalyticsInsert,
  AGISGlobalStateUpdate,
  AGISPhaseSynergyInsert,
  AGISPhaseSynergyUpdate,
  AGISCascadeEventInsert,
  AGISCascadeRuleUpdate,
} from '@/types/database-helpers';

interface PhaseOperationParams {
  phase: number;
  operationType: string;
  success: boolean;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface CrossPhaseInteractionParams {
  sourcePhase: number;
  targetPhase: number;
  interactionType: string;
  success: boolean;
}

interface CascadeTriggerParams {
  triggerPhase: number;
  eventType: string;
  sourceId?: string;
  affectedPhases?: number[];
}

export function useAGISPhaseMiddleware() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Record a phase operation to analytics
  const recordPhaseOperation = useMutation({
    mutationFn: async ({ phase, operationType, success, duration, metadata }: PhaseOperationParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const insertData: AGISAnalyticsInsert = {
        user_id: user.id,
        phase,
        metric_type: operationType,
        metric_value: success ? 1 : 0,
        metric_metadata: {
          success,
          duration_ms: duration,
          recorded_at: new Date().toISOString(),
          ...metadata,
        },
      };

      const { error: analyticsError } = await supabase
        .from('agis_analytics')
        .insert(insertData);

      if (analyticsError) throw analyticsError;

      // Update phase health score
      const healthDelta = success ? 2 : -5;
      await updatePhaseHealth(user.id, phase, healthDelta);

      return { phase, operationType, success };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['agis-global-state'] });
    },
  });

  // Update phase health in global state
  const updatePhaseHealth = async (userId: string, phase: number, healthDelta: number) => {
    const { data: currentState } = await supabase
      .from('agis_global_state')
      .select('phase_health_scores')
      .eq('user_id', userId)
      .maybeSingle();

    if (!currentState) return;

    const healthScores = (currentState.phase_health_scores as unknown as Record<string, { health: number; activeOperations: number }>) || {};
    const phaseKey = phase.toString();
    const currentHealth = healthScores[phaseKey]?.health ?? 100;
    const newHealth = Math.max(0, Math.min(100, currentHealth + healthDelta));
    const newStatus = getPhaseStatus(newHealth);

    const updatedScores = {
      ...healthScores,
      [phaseKey]: {
        ...healthScores[phaseKey],
        phase,
        name: getPhaseName(phase),
        health: newHealth,
        status: newStatus,
        activeOperations: (healthScores[phaseKey]?.activeOperations ?? 0) + 1,
        lastActivity: new Date().toISOString(),
      },
    };

    const updateData: AGISGlobalStateUpdate = {
      phase_health_scores: updatedScores,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('agis_global_state')
      .update(updateData)
      .eq('user_id', userId);
  };

  // Record cross-phase synergy interaction
  const recordCrossPhaseInteraction = useMutation({
    mutationFn: async ({ sourcePhase, targetPhase, interactionType, success }: CrossPhaseInteractionParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const phaseA = Math.min(sourcePhase, targetPhase);
      const phaseB = Math.max(sourcePhase, targetPhase);

      const { data: existing } = await supabase
        .from('agis_phase_synergies')
        .select('*')
        .eq('user_id', user.id)
        .eq('phase_a', phaseA)
        .eq('phase_b', phaseB)
        .maybeSingle();

      if (existing) {
        const newInteractionCount = (existing.interaction_count ?? 0) + 1;
        const newSuccessfulCascades = success
          ? (existing.successful_cascades ?? 0) + 1
          : (existing.successful_cascades ?? 0);
        const newSynergyScore = (newSuccessfulCascades / newInteractionCount) * 100;

        const updateData: AGISPhaseSynergyUpdate = {
          interaction_count: newInteractionCount,
          successful_cascades: newSuccessfulCascades,
          synergy_score: newSynergyScore,
          synergy_type: interactionType,
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('agis_phase_synergies')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        const insertData: AGISPhaseSynergyInsert = {
          user_id: user.id,
          phase_a: phaseA,
          phase_b: phaseB,
          synergy_type: interactionType,
          synergy_score: success ? 100 : 0,
          interaction_count: 1,
          successful_cascades: success ? 1 : 0,
          last_interaction_at: new Date().toISOString(),
        };

        await supabase
          .from('agis_phase_synergies')
          .insert(insertData);
      }

      return { sourcePhase, targetPhase, success };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-phase-synergies'] });
    },
  });

  // Trigger a cascade event
  const triggerCascade = useMutation({
    mutationFn: async ({ triggerPhase, eventType, sourceId, affectedPhases }: CascadeTriggerParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const insertData: AGISCascadeEventInsert = {
        user_id: user.id,
        trigger_phase: triggerPhase,
        trigger_event_type: eventType,
        trigger_source_id: sourceId,
        affected_phases: affectedPhases ?? [],
        started_at: new Date().toISOString(),
        outcome_status: 'in_progress',
        cascade_path: [{ phase: triggerPhase, timestamp: new Date().toISOString() }],
      };

      const { data: cascadeEvent, error } = await supabase
        .from('agis_cascade_events')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Evaluate cascade rules
      const { data: rules } = await supabase
        .from('agis_cascade_rules')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_phase', triggerPhase)
        .eq('is_active', true);

      if (rules && rules.length > 0) {
        for (const rule of rules) {
          if (rule.last_triggered_at) {
            const lastTriggered = new Date(rule.last_triggered_at);
            const cooldownMs = (rule.cooldown_minutes ?? 5) * 60 * 1000;
            if (Date.now() - lastTriggered.getTime() < cooldownMs) continue;
          }

          const ruleUpdate: AGISCascadeRuleUpdate = {
            trigger_count: (rule.trigger_count ?? 0) + 1,
            last_triggered_at: new Date().toISOString(),
          };

          await supabase
            .from('agis_cascade_rules')
            .update(ruleUpdate)
            .eq('id', rule.id);
        }
      }

      return cascadeEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agis-cascade-events'] });
    },
  });

  // Convenience wrapper for recording successful operations
  const recordSuccess = useCallback(
    (phase: number, operationType: string, duration?: number, metadata?: Record<string, unknown>) => {
      recordPhaseOperation.mutate({ phase, operationType, success: true, duration, metadata });
    },
    [recordPhaseOperation]
  );

  // Convenience wrapper for recording failed operations
  const recordFailure = useCallback(
    (phase: number, operationType: string, duration?: number, metadata?: Record<string, unknown>) => {
      recordPhaseOperation.mutate({ phase, operationType, success: false, duration, metadata });
    },
    [recordPhaseOperation]
  );

  return {
    recordPhaseOperation: recordPhaseOperation.mutate,
    recordCrossPhaseInteraction: recordCrossPhaseInteraction.mutate,
    triggerCascade: triggerCascade.mutate,
    recordSuccess,
    recordFailure,
    isRecording: recordPhaseOperation.isPending,
    isTriggeringCascade: triggerCascade.isPending,
  };
}
