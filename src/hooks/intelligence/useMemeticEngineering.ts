// Memetic Engineering Hook - Viral idea propagation with SIR modeling

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  calculateR0, 
  evaluateMemeticFitness,
  predictCampaignTrajectory,
} from '@/lib/warfare/memeticPropagationEngine';

export function useMemeticEngineering() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all memetic campaigns
  const campaignsQuery = useQuery({
    queryKey: ['memetic-campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('memetic_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Analyze meme fitness
  const analyzeMutation = useMutation({
    mutationFn: async (params: { content: string; format: string; targetEmotion: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.functions.invoke('memetic-propagation-engine', {
        body: {
          content: params.content,
          format: params.format,
          targetEmotion: params.targetEmotion,
          analysisType: 'fitness',
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Memetic analysis complete');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Create a new memetic campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (params: {
      campaignName: string;
      coreNarrative: string;
      memeContent: Record<string, unknown>;
      targetProfiles?: string[];
      susceptiblePopulation?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const insertData = {
        user_id: user.id,
        campaign_name: params.campaignName,
        core_narrative: params.coreNarrative,
        meme_content: params.memeContent,
        target_profiles: params.targetProfiles || [],
        susceptible_population: params.susceptiblePopulation || 1000,
        infection_rate: 0.15,
        recovery_rate: 0.1,
        current_reach: 0,
        status: 'planning',
      };
      
      const { data, error } = await supabase
        .from('memetic_campaigns')
        .insert(insertData as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memetic-campaigns'] });
      toast.success('Memetic campaign created');
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  // Simulate campaign trajectory
  const simulateTrajectory = (
    campaign: { susceptible_population?: number | null; infection_rate?: number | null; recovery_rate?: number | null; current_reach?: number | null },
    days: number = 30
  ) => {
    if (!campaign.susceptible_population || !campaign.infection_rate) return [];
    
    const r0 = calculateR0(campaign.infection_rate, campaign.recovery_rate || 0.1);
    return predictCampaignTrajectory(
      campaign.current_reach || 1,
      campaign.susceptible_population,
      r0,
      days
    );
  };

  // Update campaign metrics
  const updateMetricsMutation = useMutation({
    mutationFn: async (params: { campaignId: string; newReach: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('memetic_campaigns')
        .update({
          current_reach: params.newReach,
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
      queryClient.invalidateQueries({ queryKey: ['memetic-campaigns'] });
    },
  });

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    analyzeMeme: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    analysisResult: analyzeMutation.data,
    createCampaign: createCampaignMutation.mutate,
    isCreating: createCampaignMutation.isPending,
    simulateTrajectory,
    updateMetrics: updateMetricsMutation.mutate,
    calculateR0,
    evaluateFitness: evaluateMemeticFitness,
  };
}
