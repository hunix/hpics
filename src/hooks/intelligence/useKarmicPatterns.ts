import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface KarmicCycle {
  id: string;
  userId: string;
  profileId?: string;
  cycleType: string;
  cyclePhase: string;
  intensity: number;
  lessonThemes: string[];
  completionProgress: number;
  breakthroughConditions: string[];
  createdAt: string;
}

export interface KarmicDebt {
  id: string;
  userId: string;
  profileId?: string;
  debtType: string;
  debtDescription: string;
  severity: number;
  originPattern: string;
  resolutionPath: string[];
  repaymentProgress: number;
  createdAt: string;
}

export interface KarmicOpportunity {
  id: string;
  userId: string;
  profileId?: string;
  opportunityType: string;
  description: string;
  potentialGain: number;
  alignmentRequirements: string[];
  windowOfOpportunity: string;
  captureStrategies: string[];
  createdAt: string;
}

export function useKarmicPatterns(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['karmic-cycles', profileId],
    queryFn: async () => {
      let query = supabase
        .from('karmic_cycles')
        .select('*')
        .order('cycle_duration_days', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        cycleType: (row.cycle_type || '') as string,
        cyclePhase: (row.current_phase || 'active') as string,
        intensity: (row.repetition_count || 0) as number,
        lessonThemes: (row.lesson_themes || []) as string[],
        completionProgress: (row.progress_percentage || 0) as number,
        breakthroughConditions: [] as string[],
        createdAt: row.created_at as string
      })) as KarmicCycle[];
    },
    enabled: !!user,
  });

  const { data: debts, isLoading: debtsLoading } = useQuery({
    queryKey: ['karmic-debts', profileId],
    queryFn: async () => {
      let query = supabase
        .from('karmic_debts')
        .select('*')
        .order('debt_magnitude', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        debtType: (row.debt_type || '') as string,
        debtDescription: (row.debt_description || '') as string,
        severity: (row.debt_magnitude || 0) as number,
        originPattern: (row.origin_pattern || row.origin_context || '') as string,
        resolutionPath: (row.resolution_path || []) as string[],
        repaymentProgress: (row.repayment_progress || 0) as number,
        createdAt: row.created_at as string
      })) as KarmicDebt[];
    },
    enabled: !!user,
  });

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['karmic-opportunities', profileId],
    queryFn: async () => {
      let query = supabase
        .from('karmic_opportunities')
        .select('*')
        .order('alignment_score', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        opportunityType: (row.opportunity_type || '') as string,
        description: (row.opportunity_description || '') as string,
        potentialGain: (row.alignment_score || 0) as number,
        alignmentRequirements: (row.alignment_requirements || []) as string[],
        windowOfOpportunity: (row.window_of_opportunity || row.optimal_timing || '') as string,
        captureStrategies: (row.capture_strategies || []) as string[],
        createdAt: row.created_at as string
      })) as KarmicOpportunity[];
    },
    enabled: !!user,
  });

  const calculateKarma = useMutation({
    mutationFn: async (input: { profileId: string; calculationType?: 'cycles' | 'debts' | 'opportunities' | 'comprehensive' }) => {
      const { data, error } = await invokeFunction('karmic-pattern-calculator', {
          userId: user!.id,
          profileId: input.profileId,
          calculationType: input.calculationType || 'comprehensive'
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['karmic-cycles'] });
      queryClient.invalidateQueries({ queryKey: ['karmic-debts'] });
      queryClient.invalidateQueries({ queryKey: ['karmic-opportunities'] });
    }
  });

  return {
    cycles,
    debts,
    opportunities,
    isLoading: cyclesLoading || debtsLoading || opportunitiesLoading,
    calculateKarma: calculateKarma.mutateAsync,
    isCalculating: calculateKarma.isPending,
    intenseCycles: cycles?.filter(c => c.intensity > 0.7) || [],
    severeDebts: debts?.filter(d => d.severity > 0.7) || [],
    highGainOpportunities: opportunities?.filter(o => o.potentialGain > 0.7) || [],
    totalKarmicBalance: (opportunities?.reduce((sum, o) => sum + o.potentialGain, 0) || 0) - (debts?.reduce((sum, d) => sum + d.severity, 0) || 0)
  };
}
