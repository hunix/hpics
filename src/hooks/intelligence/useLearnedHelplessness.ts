import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HelplessnessIndicators {
  initiativeSuppression: number;
  decisionParalysis: number;
  externalLocus: number;
  passiveCompliance: number;
  escapeAttemptFrequency: number;
  escapeSuccessRate: number;
}

export interface LearnedHelplessnessProfile {
  id: string;
  profileId: string;
  helplessnessScore: number;
  indicators: HelplessnessIndicators;
  inductionPhase: 'pre-conditioning' | 'initial-exposure' | 'learned-response' | 'chronic-helplessness';
  activeTechniques: InductionTechnique[];
  escapeAttempts: EscapeAttempt[];
  lastUpdated: Date;
}

export interface InductionTechnique {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
  deploymentsCount: number;
  isActive: boolean;
}

export interface EscapeAttempt {
  id: string;
  attemptType: string;
  detectedAt: Date;
  wasSuccessful: boolean;
  countermeasureDeployed?: string;
}

const DEFAULT_TECHNIQUES: InductionTechnique[] = [
  { id: '1', name: 'Unpredictable Consequences', description: 'Random punishment/reward regardless of behavior', effectiveness: 0, deploymentsCount: 0, isActive: false },
  { id: '2', name: 'Uncontrollable Outcomes', description: 'Demonstrate actions have no effect on results', effectiveness: 0, deploymentsCount: 0, isActive: false },
  { id: '3', name: 'Attribution Manipulation', description: 'Reinforce internal blame for external failures', effectiveness: 0, deploymentsCount: 0, isActive: false },
  { id: '4', name: 'Choice Elimination', description: 'Systematically remove perceived options', effectiveness: 0, deploymentsCount: 0, isActive: false },
  { id: '5', name: 'Effort Devaluation', description: 'Demonstrate effort leads to same outcome as passivity', effectiveness: 0, deploymentsCount: 0, isActive: false },
];

function getPhaseFromScore(score: number): LearnedHelplessnessProfile['inductionPhase'] {
  if (score >= 80) return 'chronic-helplessness';
  if (score >= 60) return 'learned-response';
  if (score >= 30) return 'initial-exposure';
  return 'pre-conditioning';
}

export function useLearnedHelplessness(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['learned-helplessness', profileId],
    queryFn: async (): Promise<LearnedHelplessnessProfile | null> => {
      if (!profileId || !user?.id) return null;

      const { data: dependency } = await (supabase
        .from('dependency_scores' as never)
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .maybeSingle() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>);

      if (!dependency) return null;

      const emotionalScore = (dependency.emotional_dependency as number) || 0;
      const helplessnessScore = emotionalScore * 0.8 + Math.random() * 20;

      return {
        id: dependency.id as string,
        profileId,
        helplessnessScore: Math.min(100, helplessnessScore),
        indicators: {
          initiativeSuppression: emotionalScore * 0.9,
          decisionParalysis: emotionalScore * 0.85,
          externalLocus: emotionalScore * 0.75,
          passiveCompliance: emotionalScore * 0.95,
          escapeAttemptFrequency: Math.max(0, 100 - emotionalScore),
          escapeSuccessRate: Math.max(0, 50 - emotionalScore * 0.5),
        },
        inductionPhase: getPhaseFromScore(helplessnessScore),
        activeTechniques: DEFAULT_TECHNIQUES.map(t => ({
          ...t,
          isActive: Math.random() > 0.5,
          effectiveness: Math.random() * 100,
        })),
        escapeAttempts: [],
        lastUpdated: new Date(dependency.updated_at as string || Date.now()),
      };
    },
    enabled: !!profileId && !!user?.id,
  });

  const deployCountermeasureMutation = useMutation({
    mutationFn: async (countermeasure: string) => {
      console.log('Deploying countermeasure:', countermeasure);
      return { success: true, countermeasure };
    },
  });

  const getPhaseInfo = useCallback((score: number) => {
    if (score >= 80) return { phase: 'chronic-helplessness', color: 'text-red-500', description: 'Complete dependency achieved' };
    if (score >= 60) return { phase: 'learned-response', color: 'text-orange-500', description: 'Passive acceptance established' };
    if (score >= 30) return { phase: 'initial-exposure', color: 'text-yellow-500', description: 'Conditioning in progress' };
    return { phase: 'pre-conditioning', color: 'text-blue-500', description: 'Baseline assessment' };
  }, []);

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    helplessnessScore: profileQuery.data?.helplessnessScore || 0,
    indicators: profileQuery.data?.indicators,
    inductionPhase: profileQuery.data?.inductionPhase,
    activeTechniques: profileQuery.data?.activeTechniques || DEFAULT_TECHNIQUES,
    escapeAttempts: profileQuery.data?.escapeAttempts || [],
    deployCountermeasure: deployCountermeasureMutation.mutateAsync,
    getPhaseInfo,
  };
}
