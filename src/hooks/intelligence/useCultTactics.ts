import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BITEMetrics {
  behaviorControl: number;
  informationControl: number;
  thoughtControl: number;
  emotionalControl: number;
  overallControlIndex: number;
}

export interface CultTactic {
  id: string;
  name: string;
  category: 'behavior' | 'information' | 'thought' | 'emotional';
  description: string;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  effectiveness: number;
  deploymentCount: number;
  isActive: boolean;
}

export interface CultTacticsProfile {
  id: string;
  profileId: string;
  totalControlScore: number;
  biteMetrics: BITEMetrics;
  phase: 'recruitment' | 'love_bombing' | 'isolation' | 'indoctrination' | 'full_control';
  activeTactics: CultTactic[];
  isolationProgress: number;
  thoughtReformProgress: number;
}

const DEFAULT_TACTICS: CultTactic[] = [
  { id: 'b1', name: 'Schedule Regulation', category: 'behavior', description: 'Control sleep, eating, activities', intensity: 'medium', effectiveness: 0, deploymentCount: 0, isActive: false },
  { id: 'i1', name: 'Information Filtering', category: 'information', description: 'Control access to outside information', intensity: 'high', effectiveness: 0, deploymentCount: 0, isActive: false },
  { id: 't1', name: 'Black-White Thinking', category: 'thought', description: 'Eliminate nuance and gray areas', intensity: 'medium', effectiveness: 0, deploymentCount: 0, isActive: false },
  { id: 'e1', name: 'Fear Induction', category: 'emotional', description: 'Generate fear of leaving/outsiders', intensity: 'high', effectiveness: 0, deploymentCount: 0, isActive: false },
];

function getPhaseFromScore(score: number): CultTacticsProfile['phase'] {
  if (score >= 85) return 'full_control';
  if (score >= 65) return 'indoctrination';
  if (score >= 45) return 'isolation';
  if (score >= 25) return 'love_bombing';
  return 'recruitment';
}

export function useCultTactics(profileId?: string) {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['cult-tactics', profileId],
    queryFn: async (): Promise<CultTacticsProfile | null> => {
      if (!profileId || !user?.id) return null;

      const { data: cultData } = await (supabase
        .from('cult_tactic_deployments' as never)
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .maybeSingle() as Promise<{ data: Record<string, unknown> | null; error: unknown }>);

      const baseScore = (cultData?.total_bite_score as number) || 20;
      const behaviorControl = (cultData?.behavior_control_score as number) || baseScore * 0.9;
      const informationControl = (cultData?.information_control_score as number) || baseScore * 0.85;
      const thoughtControl = (cultData?.thought_control_score as number) || baseScore * 0.8;
      const emotionalControl = (cultData?.emotional_control_score as number) || baseScore * 0.95;

      return {
        id: (cultData?.id as string) || profileId,
        profileId,
        totalControlScore: baseScore,
        biteMetrics: {
          behaviorControl,
          informationControl,
          thoughtControl,
          emotionalControl,
          overallControlIndex: (behaviorControl + informationControl + thoughtControl + emotionalControl) / 4,
        },
        phase: getPhaseFromScore(baseScore),
        activeTactics: DEFAULT_TACTICS.map(t => ({
          ...t,
          isActive: Math.random() > 0.6,
          effectiveness: Math.random() * 100,
          deploymentCount: Math.floor(Math.random() * 15),
        })),
        isolationProgress: informationControl * 0.9,
        thoughtReformProgress: thoughtControl * 0.85,
      };
    },
    enabled: !!profileId && !!user?.id,
  });

  const getPhaseInfo = useCallback((score: number) => {
    if (score >= 85) return { phase: 'full_control', color: 'text-red-500', label: 'Full Control' };
    if (score >= 65) return { phase: 'indoctrination', color: 'text-orange-500', label: 'Indoctrination' };
    if (score >= 45) return { phase: 'isolation', color: 'text-yellow-500', label: 'Isolation' };
    if (score >= 25) return { phase: 'love_bombing', color: 'text-blue-500', label: 'Love Bombing' };
    return { phase: 'recruitment', color: 'text-muted-foreground', label: 'Recruitment' };
  }, []);

  const getTacticsByCategory = useCallback((category: CultTactic['category']) => {
    return (profileQuery.data?.activeTactics || DEFAULT_TACTICS).filter(t => t.category === category);
  }, [profileQuery.data?.activeTactics]);

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    totalControlScore: profileQuery.data?.totalControlScore || 0,
    biteMetrics: profileQuery.data?.biteMetrics,
    phase: profileQuery.data?.phase,
    activeTactics: profileQuery.data?.activeTactics || DEFAULT_TACTICS,
    isolationProgress: profileQuery.data?.isolationProgress || 0,
    thoughtReformProgress: profileQuery.data?.thoughtReformProgress || 0,
    getPhaseInfo,
    getTacticsByCategory,
  };
}
