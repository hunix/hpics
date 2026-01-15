/**
 * Campaign Orchestrator Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type TriggerCampaignType = 'mice_assessment' | 'betrayal_prediction' | 'sacred_value' | 'semantic_warfare' | 'memetic_campaign';
export type ActionCampaignType = 'nudge_campaign' | 'negotiation_session' | 'semantic_warfare' | 'memetic_campaign' | 'memory_intervention';

export interface TriggerCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change';
  value: number | string;
  changeThreshold?: number;
}

export interface CampaignChain {
  id: string;
  chainName: string;
  description?: string;
  triggerCampaignId?: string;
  triggerCampaignType: TriggerCampaignType;
  triggerCondition: TriggerCondition;
  actionCampaignType: ActionCampaignType;
  actionConfig: Record<string, any>;
  isActive: boolean;
  requiresApproval: boolean;
  executionCount: number;
  lastTriggeredAt?: Date;
  createdAt: Date;
}

export function useCampaignOrchestrator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: chains, isLoading } = useQuery({
    queryKey: ['campaign-chains', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('campaign_chains').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createChain = useMutation({
    mutationFn: async (chain: Omit<CampaignChain, 'id' | 'executionCount' | 'createdAt'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('campaign_chains').insert({
        user_id: user.id,
        chain_name: chain.chainName,
        description: chain.description,
        trigger_campaign_id: chain.triggerCampaignId,
        trigger_campaign_type: chain.triggerCampaignType,
        trigger_condition: chain.triggerCondition as any,
        action_campaign_type: chain.actionCampaignType,
        action_config: chain.actionConfig as any,
        is_active: chain.isActive,
        requires_approval: chain.requiresApproval,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaign-chains'] }); toast.success('Campaign chain created'); },
    onError: (error) => { toast.error(`Failed: ${error.message}`); },
  });

  const toggleChain = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('campaign_chains').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ['campaign-chains'] }); toast.success(v.isActive ? 'Activated' : 'Paused'); },
  });

  const deleteChain = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaign_chains').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaign-chains'] }); toast.success('Deleted'); },
  });

  const executeChain = useMutation({
    mutationFn: async (chainId: string) => {
      const { data: chain, error: fetchError } = await supabase.from('campaign_chains').select('execution_count').eq('id', chainId).single();
      if (fetchError) throw fetchError;
      const { error } = await supabase.from('campaign_chains').update({ execution_count: (chain.execution_count || 0) + 1, last_triggered_at: new Date().toISOString() }).eq('id', chainId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaign-chains'] }); toast.success('Executed'); },
  });

  const stats = { total: chains?.length || 0, active: chains?.filter(c => c.is_active).length || 0, totalExecutions: chains?.reduce((sum, c) => sum + (c.execution_count || 0), 0) || 0 };

  return { chains, isLoading, stats, createChain: createChain.mutate, toggleChain: toggleChain.mutate, deleteChain: deleteChain.mutate, executeChain: executeChain.mutate, isCreating: createChain.isPending };
}
