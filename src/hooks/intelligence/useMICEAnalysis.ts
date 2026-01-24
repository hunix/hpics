// MICE Analysis Hook - CIA-style recruitment vulnerability assessment

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  calculateMICEVulnerability, 
  determineOptimalApproach,
  type MICEProfile,
  type MoneyVulnerability,
  type IdeologyAlignment,
  type CompromiseMaterial,
  type EgoNeeds,
} from '@/lib/warfare/miceAnalyzer';
import { useAGISPhaseMiddleware } from './useAGISPhaseMiddleware';

import type { MICEAssessment } from '@/types/database-helpers';

export function useMICEAnalysis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const phaseMiddleware = useAGISPhaseMiddleware();

  // Fetch MICE assessment for a profile
  const assessmentQuery = useQuery({
    queryKey: ['mice-assessment', profileId],
    queryFn: async () => {
      if (!user?.id || !profileId) return null;
      
      const { data, error } = await supabase
        .from('mice_assessments')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as MICEAssessment | null;
    },
    enabled: !!user?.id && !!profileId,
  });

  // Fetch all MICE assessments
  const allAssessmentsQuery = useQuery({
    queryKey: ['mice-assessments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('mice_assessments')
        .select(`
          *,
        profiles:profile_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('recruitment_likelihood', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Run MICE analysis on a profile
  const analyzeMutation = useMutation({
    mutationFn: async (targetProfileId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.functions.invoke('mice-recruitment-analyzer', {
        body: {
          profileId: targetProfileId,
          analysisDepth: 'comprehensive',
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mice-assessment'] });
      queryClient.invalidateQueries({ queryKey: ['mice-assessments'] });
      toast.success('MICE analysis complete');
      // Track successful Phase 3 operation
      phaseMiddleware.recordSuccess(3, 'mice_analysis_complete');
    },
    onError: (error) => {
      toast.error(`MICE analysis failed: ${error.message}`);
      // Track failed Phase 3 operation
      phaseMiddleware.recordFailure(3, 'mice_analysis_failed');
    },
  });

  // Calculate vulnerability score locally
  const calculateVulnerability = (
    money: MoneyVulnerability,
    ideology: IdeologyAlignment,
    compromise: CompromiseMaterial,
    ego: EgoNeeds
  ) => {
    return calculateMICEVulnerability(money, ideology, compromise, ego);
  };

  // Get optimal approach locally
  const getOptimalApproach = (
    money: MoneyVulnerability,
    ideology: IdeologyAlignment,
    compromise: CompromiseMaterial,
    ego: EgoNeeds
  ) => {
    return determineOptimalApproach(money, ideology, compromise, ego);
  };

  // Get top vulnerable profiles
  const topVulnerableProfiles = (allAssessmentsQuery.data || [])
    .filter(a => (a.recruitment_likelihood || 0) > 0.5)
    .slice(0, 10);

  return {
    assessment: assessmentQuery.data,
    allAssessments: allAssessmentsQuery.data || [],
    topVulnerableProfiles,
    isLoading: assessmentQuery.isLoading || allAssessmentsQuery.isLoading,
    analyze: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    calculateVulnerability,
    getOptimalApproach,
  };
}
