// Memetic Engineering Hook - Viral idea propagation with SIR modeling

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  calculateSIRDynamics, 
  calculateR0, 
  evaluateMemeticFitness,
  predictCampaignTrajectory,
  type Meme,
  type MemeticCampaign 
} from '@/lib/warfare/memeticPropagationEngine';

import type { Tables } from '@/integrations/supabase/types';

type MemeticCampaignRecord = Tables<'memetic_campaigns'>;

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
      return data as MemeticCampaignRecord[];
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
      memeContent: Meme;
      targetProfiles: string[];
      propagationModel: 'SIR' | 'SEIR' | 'complex_contagion';
      targetPopulation: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Calculate initial parameters
      const fitness = evaluateMemeticFitness(params.memeContent);
      const infectionRate = fitness * 0.3; // Base infection rate scaled by fitness
      
      const { data, error } = await supabase
        .from('memetic_campaigns')
        .insert({
          user_id: user.id,
          target_profiles: params.targetProfiles,
          meme_content: params.memeContent as unknown as Record<string, unknown>,
          propagation_model: params.propagationModel,
          infection_rate: infectionRate,
          recovery_rate: 0.1,
          current_reach: 0,
          target_population: params.targetPopulation,
          status: 'planning',
          metrics: {
            fitness,
            r0: calculateR0(infectionRate, 0.1),
            projectedPeak: 0,
          },
        })
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
    campaign: MemeticCampaignRecord,
    days: number = 30
  ) => {
    if (!campaign.target_population || !campaign.infection_rate) return [];
    
    const r0 = calculateR0(campaign.infection_rate, campaign.recovery_rate || 0.1);
    return predictCampaignTrajectory(
      campaign.current_reach || 1,
      campaign.target_population,
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
