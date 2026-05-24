import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface IdentityMetrics {
  realityTestingStrength: number;
  selfConceptStability: number;
  memoryConfidence: number;
  perceptionReliability: number;
  socialValidationNeed: number;
  cognitiveFlexibility: number;
}

export interface DestabilizationTechnique {
  id: string;
  name: string;
  category: 'gaslighting' | 'reality_distortion' | 'memory_manipulation' | 'perception_alteration';
  description: string;
  effectiveness: number;
  deploymentCount: number;
  lastDeployedAt?: Date;
}

export interface IdentityDestabilizationProfile {
  id: string;
  profileId: string;
  destabilizationScore: number;
  metrics: IdentityMetrics;
  phase: 'assessment' | 'softening' | 'active_destabilization' | 'identity_crisis' | 'reformation';
  activeTechniques: DestabilizationTechnique[];
  gaslightingScripts: GaslightingScript[];
  timelineManipulations: TimelineManipulation[];
}

export interface GaslightingScript {
  id: string;
  trigger: string;
  script: string;
  expectedResponse: string;
  effectiveness: number;
}

export interface TimelineManipulation {
  id: string;
  originalEvent: string;
  alteredVersion: string;
  believabilityScore: number;
  deployedAt?: Date;
}

const DEFAULT_TECHNIQUES: DestabilizationTechnique[] = [
  { id: '1', name: 'Reality Questioning', category: 'gaslighting', description: 'Systematically question their perception of events', effectiveness: 0, deploymentCount: 0 },
  { id: '2', name: 'Memory Seeding', category: 'memory_manipulation', description: 'Plant false memories through suggestion', effectiveness: 0, deploymentCount: 0 },
  { id: '3', name: 'Perception Contradiction', category: 'perception_alteration', description: 'Contradict their sensory experiences', effectiveness: 0, deploymentCount: 0 },
  { id: '4', name: 'Social Proof Manipulation', category: 'reality_distortion', description: 'Use others to confirm false narratives', effectiveness: 0, deploymentCount: 0 },
  { id: '5', name: 'Timeline Confusion', category: 'memory_manipulation', description: 'Alter sequence of events in their memory', effectiveness: 0, deploymentCount: 0 },
];

export function useIdentityDestabilization(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['identity-destabilization', profileId],
    queryFn: async (): Promise<IdentityDestabilizationProfile | null> => {
      if (!profileId || !user?.id) return null;

      // Check cross-domain correlations for identity data
      const { data: correlations } = await supabase
        .from('cross_domain_correlations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .limit(10);

      // Get psychology assessment for baseline
      const { data: psych } = await supabase
        .from('psychology_assessments')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Until a real destabilization scorer exists we derive every
      // metric deterministically from baseScore (presence of a
      // psych_profile row → 50, else 20). No Math.random padding on
      // the score or cognitive flexibility, and the technique catalog
      // reports zero deployments instead of fabricated counts.
      const baseScore = psych ? 50 : 20;

      return {
        id: profileId,
        profileId,
        destabilizationScore: baseScore,
        metrics: {
          realityTestingStrength: 100 - baseScore,
          selfConceptStability: 100 - baseScore * 0.8,
          memoryConfidence: 100 - baseScore * 0.6,
          perceptionReliability: 100 - baseScore * 0.7,
          socialValidationNeed: baseScore * 1.2,
          cognitiveFlexibility: psych ? 65 : 50,
        },
        phase: getPhaseFromScore(baseScore),
        activeTechniques: DEFAULT_TECHNIQUES.map(t => ({
          ...t,
          effectiveness: 0,
          deploymentCount: 0,
        })),
        gaslightingScripts: [],
        timelineManipulations: [],
      };
    },
    enabled: !!profileId && !!user?.id,
  });

  const deployTechniqueMutation = useMutation({
    mutationFn: async ({ techniqueId, context }: { techniqueId: string; context?: string }) => {
      if (!profileId || !user?.id) throw new Error('Missing profileId or user');

      // Log deployment to cross_domain_correlations
      const { error } = await supabase
        .from('cross_domain_correlations')
        .insert({
          profile_id: profileId,
          user_id: user.id,
          correlation_type: 'identity_destabilization',
          domain_a: 'identity',
          domain_b: 'technique_deployment',
          correlation_strength: 0.8,
          data_points: { techniqueId, context, deployedAt: new Date().toISOString() },
        } as never);

      if (error) throw error;
      return { success: true, techniqueId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity-destabilization', profileId] });
    },
  });

  const generateGaslightingScriptMutation = useMutation({
    mutationFn: async (trigger: string): Promise<GaslightingScript> => {
      // No backend script generator exists yet; return a stub with
      // effectiveness=0 so the UI doesn't display a fake percentage.
      return {
        id: crypto.randomUUID(),
        trigger,
        script: `When they mention "${trigger}", respond with subtle doubt about their recollection...`,
        expectedResponse: 'Self-doubt, hesitation, seeking validation',
        effectiveness: 0,
      };
    },
  });

  const getPhaseInfo = useCallback((score: number) => {
    if (score >= 80) return { phase: 'identity_crisis', color: 'text-red-500', label: 'Identity Crisis' };
    if (score >= 60) return { phase: 'active_destabilization', color: 'text-orange-500', label: 'Active Destabilization' };
    if (score >= 40) return { phase: 'softening', color: 'text-yellow-500', label: 'Softening' };
    if (score >= 20) return { phase: 'assessment', color: 'text-blue-500', label: 'Assessment' };
    return { phase: 'reformation', color: 'text-green-500', label: 'Reformation' };
  }, []);

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    
    // Computed
    destabilizationScore: profileQuery.data?.destabilizationScore || 0,
    metrics: profileQuery.data?.metrics,
    phase: profileQuery.data?.phase,
    techniques: profileQuery.data?.activeTechniques || DEFAULT_TECHNIQUES,
    gaslightingScripts: profileQuery.data?.gaslightingScripts || [],
    
    // Actions
    deployTechnique: deployTechniqueMutation.mutateAsync,
    generateGaslightingScript: generateGaslightingScriptMutation.mutateAsync,
    
    // Helpers
    getPhaseInfo,
  };
}

function getPhaseFromScore(score: number): IdentityDestabilizationProfile['phase'] {
  if (score >= 80) return 'identity_crisis';
  if (score >= 60) return 'active_destabilization';
  if (score >= 40) return 'softening';
  if (score >= 20) return 'assessment';
  return 'reformation';
}
