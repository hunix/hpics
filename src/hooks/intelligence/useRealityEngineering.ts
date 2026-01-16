import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAGISPhaseMiddleware } from './useAGISPhaseMiddleware';

export interface RealityFramework {
  id: string;
  profileId?: string;
  frameworkName: string;
  frameworkType: string;
  currentRealityMap: Record<string, unknown>;
  targetRealityMap: Record<string, unknown>;
  transitionStrategy: Record<string, unknown>;
  anchorPoints: unknown[];
  cognitiveLoadScore?: number;
  resistancePatterns: unknown[];
  breakthroughTriggers: unknown[];
  progressPercentage: number;
  isActive: boolean;
  createdAt: Date;
}

export interface BeliefArchitecture {
  id: string;
  profileId?: string;
  coreBeliefs: unknown[];
  supportingBeliefs: unknown[];
  peripheralBeliefs: unknown[];
  beliefDependencies: Record<string, unknown>;
  vulnerabilityMap: Record<string, unknown>;
  updateTriggers: unknown[];
  protectionMechanisms: unknown[];
  lastMajorShift?: Date;
  stabilityScore?: number;
}

export interface IdentityBlueprint {
  id: string;
  profileId?: string;
  currentIdentity: Record<string, unknown>;
  shadowIdentity: Record<string, unknown>;
  aspirationalIdentity: Record<string, unknown>;
  rejectedIdentity: Record<string, unknown>;
  identityConflicts: unknown[];
  integrationOpportunities: unknown[];
  malleabilityScore?: number;
  anchorExperiences: unknown[];
}

export function useRealityEngineering() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const phaseMiddleware = useAGISPhaseMiddleware();

  const { data: frameworks = [], isLoading: frameworksLoading } = useQuery({
    queryKey: ['reality-frameworks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('reality_frameworks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(f => ({
        id: f.id,
        profileId: f.profile_id,
        frameworkName: f.framework_name,
        frameworkType: f.framework_type,
        currentRealityMap: f.current_reality_map as Record<string, unknown>,
        targetRealityMap: f.target_reality_map as Record<string, unknown>,
        transitionStrategy: f.transition_strategy as Record<string, unknown>,
        anchorPoints: f.anchor_points as unknown[],
        cognitiveLoadScore: f.cognitive_load_score ? Number(f.cognitive_load_score) : undefined,
        resistancePatterns: f.resistance_patterns as unknown[],
        breakthroughTriggers: f.breakthrough_triggers as unknown[],
        progressPercentage: Number(f.progress_percentage) || 0,
        isActive: f.is_active ?? true,
        createdAt: new Date(f.created_at)
      })) as RealityFramework[];
    },
    enabled: !!user?.id
  });

  const { data: beliefArchitectures = [], isLoading: beliefsLoading } = useQuery({
    queryKey: ['belief-architectures', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('belief_architectures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(b => ({
        id: b.id,
        profileId: b.profile_id,
        coreBeliefs: b.core_beliefs as unknown[],
        supportingBeliefs: b.supporting_beliefs as unknown[],
        peripheralBeliefs: b.peripheral_beliefs as unknown[],
        beliefDependencies: b.belief_dependencies as Record<string, unknown>,
        vulnerabilityMap: b.vulnerability_map as Record<string, unknown>,
        updateTriggers: b.update_triggers as unknown[],
        protectionMechanisms: b.protection_mechanisms as unknown[],
        lastMajorShift: b.last_major_shift ? new Date(b.last_major_shift) : undefined,
        stabilityScore: b.stability_score ? Number(b.stability_score) : undefined
      })) as BeliefArchitecture[];
    },
    enabled: !!user?.id
  });

  const createFramework = useMutation({
    mutationFn: async (data: Partial<RealityFramework>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('reality_frameworks').insert({
        user_id: user.id,
        profile_id: data.profileId,
        framework_name: data.frameworkName,
        framework_type: data.frameworkType || 'perception_shift',
        current_reality_map: data.currentRealityMap || {},
        target_reality_map: data.targetRealityMap || {}
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reality-frameworks'] });
      // Track Phase 6 operation
      phaseMiddleware.recordSuccess(6, 'reality_framework_created');
    }
  });

  const updateProgress = useMutation({
    mutationFn: async ({ frameworkId, progress }: { frameworkId: string; progress: number }) => {
      const { error } = await supabase
        .from('reality_frameworks')
        .update({ progress_percentage: progress, updated_at: new Date().toISOString() } as never)
        .eq('id', frameworkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reality-frameworks'] });
      // Track Phase 6 progress update
      phaseMiddleware.recordSuccess(6, 'reality_framework_progress_updated');
    }
  });

  const stats = useMemo(() => ({
    activeFrameworks: frameworks.filter(f => f.isActive).length,
    averageProgress: frameworks.length > 0 
      ? frameworks.reduce((sum, f) => sum + f.progressPercentage, 0) / frameworks.length 
      : 0,
    totalBeliefMaps: beliefArchitectures.length
  }), [frameworks, beliefArchitectures]);

  return {
    frameworks,
    beliefArchitectures,
    isLoading: frameworksLoading || beliefsLoading,
    createFramework,
    updateProgress,
    stats
  };
}
