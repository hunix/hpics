import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TemporalOrchestration {
  id: string;
  orchestrationName: string;
  orchestrationType: string;
  targetProfiles: string[];
  timelineDefinition: Record<string, unknown>;
  synchronizationPoints: unknown[];
  contingencyBranches: Record<string, unknown>;
  currentPosition: Record<string, unknown>;
  velocityMetrics: Record<string, unknown>;
  trajectoryConfidence?: number;
  estimatedCompletion?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface MomentCapture {
  id: string;
  profileId?: string;
  momentType: string;
  captureContext: Record<string, unknown>;
  emotionalStateSnapshot: Record<string, unknown>;
  leveragePotential?: number;
  decayRate?: number;
  optimalActionWindow: Record<string, unknown>;
  suggestedInterventions: unknown[];
  wasLeveraged: boolean;
  leverageOutcome?: Record<string, unknown>;
  capturedAt: Date;
  expiresAt?: Date;
}

export function useTemporalOrchestration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orchestrations = [], isLoading: orchestrationsLoading } = useQuery({
    queryKey: ['temporal-orchestrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('temporal_orchestrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(o => ({
        id: o.id,
        orchestrationName: o.orchestration_name,
        orchestrationType: o.orchestration_type,
        targetProfiles: (o.target_profiles as string[]) || [],
        timelineDefinition: o.timeline_definition as Record<string, unknown>,
        synchronizationPoints: o.synchronization_points as unknown[],
        contingencyBranches: o.contingency_branches as Record<string, unknown>,
        currentPosition: o.current_position as Record<string, unknown>,
        velocityMetrics: o.velocity_metrics as Record<string, unknown>,
        trajectoryConfidence: o.trajectory_confidence ? Number(o.trajectory_confidence) : undefined,
        estimatedCompletion: o.estimated_completion ? new Date(o.estimated_completion) : undefined,
        isActive: o.is_active ?? true,
        createdAt: new Date(o.created_at)
      })) as TemporalOrchestration[];
    },
    enabled: !!user?.id
  });

  const { data: moments = [], isLoading: momentsLoading } = useQuery({
    queryKey: ['moment-captures', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('moment_captures')
        .select('*')
        .eq('user_id', user.id)
        .order('captured_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map(m => ({
        id: m.id,
        profileId: m.profile_id,
        momentType: m.moment_type,
        captureContext: m.capture_context as Record<string, unknown>,
        emotionalStateSnapshot: m.emotional_state_snapshot as Record<string, unknown>,
        leveragePotential: m.leverage_potential ? Number(m.leverage_potential) : undefined,
        decayRate: m.decay_rate ? Number(m.decay_rate) : undefined,
        optimalActionWindow: m.optimal_action_window as Record<string, unknown>,
        suggestedInterventions: m.suggested_interventions as unknown[],
        wasLeveraged: m.was_leveraged ?? false,
        leverageOutcome: m.leverage_outcome as Record<string, unknown> | undefined,
        capturedAt: new Date(m.captured_at),
        expiresAt: m.expires_at ? new Date(m.expires_at) : undefined
      })) as MomentCapture[];
    },
    enabled: !!user?.id
  });

  const createOrchestration = useMutation({
    mutationFn: async (data: Partial<TemporalOrchestration>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('temporal_orchestrations').insert({
        user_id: user.id,
        orchestration_name: data.orchestrationName,
        orchestration_type: data.orchestrationType || 'multi_vector',
        target_profiles: data.targetProfiles || [],
        timeline_definition: data.timelineDefinition || {}
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['temporal-orchestrations'] })
  });

  const captureMoment = useMutation({
    mutationFn: async (data: Partial<MomentCapture>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('moment_captures').insert({
        user_id: user.id,
        profile_id: data.profileId,
        moment_type: data.momentType,
        capture_context: data.captureContext || {},
        emotional_state_snapshot: data.emotionalStateSnapshot || {},
        leverage_potential: data.leveragePotential
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moment-captures'] })
  });

  const leverageMoment = useMutation({
    mutationFn: async ({ momentId, outcome }: { momentId: string; outcome: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('moment_captures')
        .update({ was_leveraged: true, leverage_outcome: outcome } as never)
        .eq('id', momentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moment-captures'] })
  });

  const activeOrchestrations = useMemo(() => 
    orchestrations.filter(o => o.isActive), [orchestrations]);
  
  const unexpiredMoments = useMemo(() => 
    moments.filter(m => !m.expiresAt || new Date(m.expiresAt) > new Date()), [moments]);

  const stats = useMemo(() => ({
    activeOrchestrations: activeOrchestrations.length,
    capturedMoments: unexpiredMoments.length,
    unLeveragedMoments: unexpiredMoments.filter(m => !m.wasLeveraged).length,
    avgLeveragePotential: unexpiredMoments.length > 0
      ? unexpiredMoments.reduce((sum, m) => sum + (m.leveragePotential || 0), 0) / unexpiredMoments.length
      : 0
  }), [activeOrchestrations, unexpiredMoments]);

  return {
    orchestrations: activeOrchestrations,
    moments: unexpiredMoments,
    isLoading: orchestrationsLoading || momentsLoading,
    createOrchestration,
    captureMoment,
    leverageMoment,
    stats
  };
}
