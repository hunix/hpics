// Synthetic Consensus Hook - Manufacture perception of widespread agreement

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
      return data;
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
      consensusNarrative: string;
      targetAudience: string[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const insertData = {
        user_id: user.id,
        campaign_name: params.name,
        consensus_narrative: params.consensusNarrative,
        target_audience: params.targetAudience,
        perceived_consensus_level: 0,
        actual_consensus_level: 0,
        status: 'planning',
        effectiveness_score: 0,
      };
      
      const { data, error } = await supabase
        .from('synthetic_consensus_campaigns')
        .insert(insertData as never)
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

  // Update campaign progress
  const updateCampaignMutation = useMutation({
    mutationFn: async (params: {
      campaignId: string;
      perceivedLevel?: number;
      actualLevel?: number;
      status?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (params.perceivedLevel !== undefined) {
        updateData.perceived_consensus_level = params.perceivedLevel;
      }
      if (params.actualLevel !== undefined) {
        updateData.actual_consensus_level = params.actualLevel;
      }
      if (params.status) {
        updateData.status = params.status;
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
  const calculateConsensusGap = (campaign: { perceived_consensus_level?: number | null; actual_consensus_level?: number | null }) => {
    const perceived = campaign.perceived_consensus_level || 0;
    const actual = campaign.actual_consensus_level || 0;
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
    updateCampaign: updateCampaignMutation.mutate,
    calculateConsensusGap,
  };
}
