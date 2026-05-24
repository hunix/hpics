import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BondingMetrics {
  captorBondingIndex: number;
  gratitudeToCaptor: number;
  defenseOfCaptor: number;
  identificationWithCaptor: number;
  fearOfRescue: number;
  hostilityToOutsiders: number;
}

export interface KindnessCrueltyRatio {
  kindnessEvents: number;
  crueltyEvents: number;
  currentRatio: number;
  optimalRatio: number;
  recommendation: string;
}

export interface BondingIndicator {
  id: string;
  name: string;
  description: string;
  isPresent: boolean;
  strength: number;
}

export interface StockholmProfile {
  id: string;
  profileId: string;
  bondingScore: number;
  metrics: BondingMetrics;
  phase: 'pre-capture' | 'initial_shock' | 'accommodation' | 'bonding' | 'full_syndrome';
  kindnessCrueltyRatio: KindnessCrueltyRatio;
  indicators: BondingIndicator[];
}

const DEFAULT_INDICATORS: BondingIndicator[] = [
  { id: '1', name: 'Positive Feelings Toward Captor', description: 'Expresses gratitude or affection', isPresent: false, strength: 0 },
  { id: '2', name: 'Defense of Captor', description: 'Defends or rationalizes captor behavior', isPresent: false, strength: 0 },
  { id: '3', name: 'Identification with Captor', description: 'Adopts captor perspectives and values', isPresent: false, strength: 0 },
  { id: '4', name: 'Fear of Rescue', description: 'Resists or fears outside intervention', isPresent: false, strength: 0 },
  { id: '5', name: 'Hostility to Rescuers', description: 'Views helpers as threats', isPresent: false, strength: 0 },
];

function getPhaseFromScore(score: number): StockholmProfile['phase'] {
  if (score >= 80) return 'full_syndrome';
  if (score >= 60) return 'bonding';
  if (score >= 40) return 'accommodation';
  if (score >= 20) return 'initial_shock';
  return 'pre-capture';
}

export function useStockholmSyndrome(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['stockholm-syndrome', profileId],
    queryFn: async (): Promise<StockholmProfile | null> => {
      if (!profileId || !user?.id) return null;

      const { data: dependency } = await (supabase
        .from('dependency_scores' as never)
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .maybeSingle() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>);

      const emotionalScore = (dependency?.emotional_dependency as number) || 0;
      const attachmentScore = (dependency?.attachment_dependency as number) || 0;
      const bondingScore = (emotionalScore + attachmentScore) / 2;

      // kindness/cruelty events should come from the
      // emotional_manipulation_events table once that pipeline exists.
      // Until then both counts are 0 and the ratio reads as "not yet
      // measured" in the UI.
      const kindnessEvents = 0;
      const crueltyEvents = 0;
      const currentRatio = 0;

      return {
        id: (dependency?.id as string) || profileId,
        profileId,
        bondingScore,
        metrics: {
          captorBondingIndex: bondingScore,
          gratitudeToCaptor: bondingScore * 0.9,
          defenseOfCaptor: bondingScore * 0.7,
          identificationWithCaptor: bondingScore * 0.6,
          fearOfRescue: bondingScore * 0.5,
          hostilityToOutsiders: bondingScore * 0.4,
        },
        phase: getPhaseFromScore(bondingScore),
        kindnessCrueltyRatio: {
          kindnessEvents,
          crueltyEvents,
          currentRatio,
          optimalRatio: 3.5,
          recommendation: 'No kindness/cruelty events recorded yet',
        },
        // No per-indicator measurement source exists; flag every
        // indicator as not present with strength 0 rather than
        // pretending half of them are real.
        indicators: DEFAULT_INDICATORS.map(ind => ({
          ...ind,
          isPresent: false,
          strength: 0,
        })),
      };
    },
    enabled: !!profileId && !!user?.id,
  });

  const getPhaseInfo = useCallback((score: number) => {
    if (score >= 80) return { phase: 'full_syndrome', color: 'text-red-500', label: 'Full Stockholm Syndrome' };
    if (score >= 60) return { phase: 'bonding', color: 'text-orange-500', label: 'Active Bonding' };
    if (score >= 40) return { phase: 'accommodation', color: 'text-yellow-500', label: 'Accommodation' };
    if (score >= 20) return { phase: 'initial_shock', color: 'text-blue-500', label: 'Initial Shock' };
    return { phase: 'pre-capture', color: 'text-muted-foreground', label: 'Pre-Capture' };
  }, []);

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    bondingScore: profileQuery.data?.bondingScore || 0,
    metrics: profileQuery.data?.metrics,
    phase: profileQuery.data?.phase,
    kindnessCrueltyRatio: profileQuery.data?.kindnessCrueltyRatio,
    indicators: profileQuery.data?.indicators || DEFAULT_INDICATORS,
    getPhaseInfo,
  };
}
