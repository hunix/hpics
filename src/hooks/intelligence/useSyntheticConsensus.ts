// Synthetic Consensus Hook - Manufacture perception of widespread agreement

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import type { Tables } from '@/integrations/supabase/types';

type SyntheticConsensusCampaign = Tables<'synthetic_consensus_campaigns'>;

export function useSyntheticConsensus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all campaigns
  const campaignsQuery = useQuery({
    queryKey: ['synthetic-consensus-campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('synthetic_consensus_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SyntheticConsensusCampaign[];
    },
    enabled: !!user?.id,
  });

  // Generate consensus strategy
  const generateStrategyMutation = useMutation({
    mutationFn: async (params: { narrative: string; targetAudience: string[]; objective: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.functions.invoke('synthetic-consensus-generator', {
        body: {
          narrative: params.narrative,
          targetAudience: params.targetAudience,
          objective: params.objective,
          analysisType: 'strategy',
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Consensus strategy generated');
    },
    onError: (error) => {
      toast.error(`Strategy generation failed: ${error.message}`);
    },
  });

  // Create a new campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (params: {
      name: string;
      targetNarrative: string;
      targetAudience: string[];
      amplificationStrategy: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('synthetic_consensus_campaigns')
        .insert({
          user_id: user.id,
          campaign_name: params.name,
          target_narrative: params.targetNarrative,
          target_audience: params.targetAudience,
          amplification_strategy: params.amplificationStrategy,
          perceived_consensus_level: 0,
          actual_support_level: 0,
          status: 'planning',
          consensus_indicators: [],
          social_proof_elements: [],
          metrics: {
            reach: 0,
            engagement: 0,
            believability: 0,
            conversionRate: 0,
          },
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synthetic-consensus-campaigns'] });
      toast.success('Campaign created');
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  // Add consensus indicator
  const addIndicatorMutation = useMutation({
    mutationFn: async (params: {
      campaignId: string;
      indicator: ConsensusIndicator;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // First get current indicators
      const { data: current, error: fetchError } = await supabase
        .from('synthetic_consensus_campaigns')
        .select('consensus_indicators')
        .eq('id', params.campaignId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const indicators = [...(current?.consensus_indicators || []), params.indicator];
      
      const { data, error } = await supabase
        .from('synthetic_consensus_campaigns')
        .update({
          consensus_indicators: indicators as unknown as Record<string, unknown>[],
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.campaignId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synthetic-consensus-campaigns'] });
      toast.success('Indicator added');
    },
  });

  // Update campaign metrics
  const updateMetricsMutation = useMutation({
    mutationFn: async (params: {
      campaignId: string;
      metrics: Partial<CampaignMetrics>;
      perceivedLevel?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (params.metrics) {
        updateData.metrics = params.metrics;
      }
      
      if (params.perceivedLevel !== undefined) {
        updateData.perceived_consensus_level = params.perceivedLevel;
      }
      
      const { data, error } = await supabase
        .from('synthetic_consensus_campaigns')
        .update(updateData)
        .eq('id', params.campaignId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synthetic-consensus-campaigns'] });
    },
  });

  // Calculate consensus gap (perceived vs actual)
  const calculateConsensusGap = (campaign: SyntheticConsensusCampaign) => {
    const perceived = campaign.perceived_consensus_level || 0;
    const actual = campaign.actual_support_level || 0;
    return perceived - actual;
  };

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    generateStrategy: generateStrategyMutation.mutate,
    isGenerating: generateStrategyMutation.isPending,
    strategyResult: generateStrategyMutation.data,
    createCampaign: createCampaignMutation.mutate,
    isCreating: createCampaignMutation.isPending,
    addIndicator: addIndicatorMutation.mutate,
    updateMetrics: updateMetricsMutation.mutate,
    calculateConsensusGap,
  };
}
