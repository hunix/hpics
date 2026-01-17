import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
        .order('intensity', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        cycleType: row.cycle_type,
        cyclePhase: row.cycle_phase || 'active',
        intensity: row.intensity || 0,
        lessonThemes: row.lesson_themes || [],
        completionProgress: row.completion_progress || 0,
        breakthroughConditions: row.breakthrough_conditions || [],
        createdAt: row.created_at
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
        .order('severity', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        debtType: row.debt_type,
        debtDescription: row.debt_description || '',
        severity: row.severity || 0,
        originPattern: row.origin_pattern || '',
        resolutionPath: row.resolution_path || [],
        repaymentProgress: row.repayment_progress || 0,
        createdAt: row.created_at
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
        .order('potential_gain', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        opportunityType: row.opportunity_type,
        description: row.description || '',
        potentialGain: row.potential_gain || 0,
        alignmentRequirements: row.alignment_requirements || [],
        windowOfOpportunity: row.window_of_opportunity || '',
        captureStrategies: row.capture_strategies || [],
        createdAt: row.created_at
      })) as KarmicOpportunity[];
    },
    enabled: !!user,
  });

  const calculateKarma = useMutation({
    mutationFn: async (input: { profileId: string; calculationType?: 'cycles' | 'debts' | 'opportunities' | 'comprehensive' }) => {
      const { data, error } = await supabase.functions.invoke('karmic-pattern-calculator', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          calculationType: input.calculationType || 'comprehensive'
        }
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
