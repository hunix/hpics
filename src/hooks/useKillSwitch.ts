/**
 * Kill Switch Hook
 * 
 * Provides access to agent kill switch controls.
 * All configuration is stored in the database.
 * 
 * @version 3.9.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

export interface KillSwitch {
  id: string;
  agent_id: string;
  agent_type: 'edge_function' | 'workflow' | 'tribunal' | 'agent';
  display_name: string | null;
  is_enabled: boolean;
  containment_mode: 'none' | 'soft' | 'hard';
  disabled_reason: string | null;
  disabled_at: string | null;
  disabled_by: string | null;
  auto_disable_conditions: Record<string, unknown>;
  error_threshold: number;
  error_window_minutes: number;
  current_error_count: number;
  last_error_at: string | null;
  escalation_contacts: string[];
  created_at: string;
  updated_at: string;
}

export type AgentType = 'edge_function' | 'workflow' | 'tribunal' | 'agent';
export type ContainmentMode = 'none' | 'soft' | 'hard';

const KILL_SWITCH_QUERY_KEY = ['kill-switches'];

export function useKillSwitch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load all kill switches
  const {
    data: killSwitches,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: KILL_SWITCH_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_kill_switches')
        .select('*')
        .order('agent_id');

      if (error) throw error;
      return (data || []) as unknown as KillSwitch[];
    },
    staleTime: 30 * 1000,
    enabled: !!user
  });

  // Get disabled agents
  const disabledAgents = useMemo(() => {
    return killSwitches?.filter(ks => !ks.is_enabled) || [];
  }, [killSwitches]);

  // Get agents in containment
  const containedAgents = useMemo(() => {
    return killSwitches?.filter(ks => ks.containment_mode !== 'none') || [];
  }, [killSwitches]);

  // Group by type
  const byType = useMemo(() => {
    const grouped: Record<AgentType, KillSwitch[]> = {
      edge_function: [],
      workflow: [],
      tribunal: [],
      agent: []
    };
    for (const ks of killSwitches || []) {
      if (grouped[ks.agent_type]) {
        grouped[ks.agent_type].push(ks);
      }
    }
    return grouped;
  }, [killSwitches]);

  // Get agents with high error counts
  const highErrorAgents = useMemo(() => {
    return killSwitches?.filter(ks => 
      ks.current_error_count >= (ks.error_threshold * 0.8)
    ) || [];
  }, [killSwitches]);

  // Disable an agent
  const disableAgent = useMutation({
    mutationFn: async ({ agentId, agentType, reason }: {
      agentId: string;
      agentType: AgentType;
      reason: string;
    }) => {
      const { error } = await supabase
        .from('agent_kill_switches')
        .upsert({
          agent_id: agentId,
          agent_type: agentType,
          is_enabled: false,
          disabled_reason: reason,
          disabled_at: new Date().toISOString(),
          disabled_by: user?.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'agent_id' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: KILL_SWITCH_QUERY_KEY });
      toast({ 
        title: 'Agent disabled', 
        description: `${variables.agentId} has been disabled.`,
        variant: 'destructive'
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Enable an agent
  const enableAgent = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agent_kill_switches')
        .update({
          is_enabled: true,
          containment_mode: 'none',
          disabled_reason: null,
          disabled_at: null,
          disabled_by: null,
          current_error_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId);

      if (error) throw error;
    },
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: KILL_SWITCH_QUERY_KEY });
      toast({ title: 'Agent enabled', description: `${agentId} has been re-enabled.` });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Set containment mode
  const setContainmentMode = useMutation({
    mutationFn: async ({ agentId, mode, reason }: {
      agentId: string;
      mode: ContainmentMode;
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('agent_kill_switches')
        .update({
          containment_mode: mode,
          disabled_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: KILL_SWITCH_QUERY_KEY });
      toast({ 
        title: 'Containment mode updated', 
        description: `${variables.agentId} set to ${variables.mode} containment.`
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update error thresholds
  const updateThresholds = useMutation({
    mutationFn: async ({ agentId, errorThreshold, errorWindowMinutes }: {
      agentId: string;
      errorThreshold: number;
      errorWindowMinutes: number;
    }) => {
      const { error } = await supabase
        .from('agent_kill_switches')
        .update({
          error_threshold: errorThreshold,
          error_window_minutes: errorWindowMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KILL_SWITCH_QUERY_KEY });
      toast({ title: 'Thresholds updated' });
    }
  });

  // Emergency shutdown - disable all agents of a type
  const emergencyShutdown = useMutation({
    mutationFn: async ({ agentType, reason }: {
      agentType: AgentType | 'all';
      reason: string;
    }) => {
      let query = supabase
        .from('agent_kill_switches')
        .update({
          is_enabled: false,
          containment_mode: 'hard',
          disabled_reason: `EMERGENCY: ${reason}`,
          disabled_at: new Date().toISOString(),
          disabled_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (agentType !== 'all') {
        query = query.eq('agent_type', agentType);
      }

      const { data, error } = await query.select('id');
      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (count, variables) => {
      queryClient.invalidateQueries({ queryKey: KILL_SWITCH_QUERY_KEY });
      toast({ 
        title: 'EMERGENCY SHUTDOWN', 
        description: `${count} agents have been disabled. Reason: ${variables.reason}`,
        variant: 'destructive'
      });
    },
    onError: (error) => {
      toast({ title: 'Shutdown failed', description: error.message, variant: 'destructive' });
    }
  });

  // Register new kill switch
  const registerKillSwitch = useMutation({
    mutationFn: async (config: Partial<KillSwitch> & { agent_id: string; agent_type: AgentType }) => {
      const { data, error } = await supabase
        .from('agent_kill_switches')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        }, { onConflict: 'agent_id' })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as KillSwitch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KILL_SWITCH_QUERY_KEY });
    }
  });

  // Check if agent is enabled
  const isAgentEnabled = (agentId: string): boolean => {
    const ks = killSwitches?.find(k => k.agent_id === agentId);
    return ks?.is_enabled !== false; // Default to enabled if not found
  };

  // Get kill switch status for an agent
  const getAgentStatus = (agentId: string): KillSwitch | null => {
    return killSwitches?.find(k => k.agent_id === agentId) || null;
  };

  return {
    // Data
    killSwitches: killSwitches || [],
    disabledAgents,
    containedAgents,
    highErrorAgents,
    byType,

    // State
    isLoading,
    error,
    refetch,

    // Utilities
    isAgentEnabled,
    getAgentStatus,

    // Mutations
    disableAgent,
    enableAgent,
    setContainmentMode,
    updateThresholds,
    emergencyShutdown,
    registerKillSwitch
  };
}

// Query keys factory
export const killSwitchKeys = {
  all: KILL_SWITCH_QUERY_KEY,
  byType: (type: AgentType) => [...KILL_SWITCH_QUERY_KEY, 'type', type],
  byAgent: (agentId: string) => [...KILL_SWITCH_QUERY_KEY, 'agent', agentId]
};
