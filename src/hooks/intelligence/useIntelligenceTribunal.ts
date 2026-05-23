/**
 * Intelligence Tribunal Hook (v3.9.35)
 * React hooks for multi-agent deliberation system
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

// Types
interface TribunalConfig {
  id: string;
  tribunal_type: string;
  display_name: string;
  description: string | null;
  min_advocates: number;
  max_advocates: number;
  consensus_threshold: number;
  stability_rounds: number;
  auto_escalate_to_arbitrator: boolean;
  advocate_roles: Array<{
    role: string;
    prompt_key: string;
    focus_area: string;
  }>;
  is_active: boolean;
  created_at: string;
}

interface TribunalVerdict {
  id: string;
  user_id: string;
  profile_id: string | null;
  deliberation_session_id: string;
  tribunal_type: string;
  verdict: 'approved' | 'rejected' | 'escalated' | 'deferred';
  consensus_reached: boolean;
  final_confidence: number;
  total_rounds: number;
  participating_agents: string[];
  verdict_rationale: string;
  dissenting_opinions: Array<{
    role: string;
    position: string;
    rationale: string;
  }>;
  arbitrator_involved: boolean;
  total_cost_cents: number;
  created_at: string;
}

interface DeliberationArgument {
  id: string;
  round_number: number;
  agent_role: string;
  position: string;
  argument_text: string;
  evidence_references: unknown[];
  confidence_score: number;
  cost_cents: number;
  created_at: string;
}

interface TribunalRequest {
  profileId?: string;
  tribunalType: string;
  subjectData: Record<string, unknown>;
  contextData?: Record<string, unknown>;
}

interface TribunalResponse {
  success: boolean;
  deliberationSessionId: string;
  tribunalType: string;
  verdict: string;
  consensusReached: boolean;
  totalRounds: number;
  finalConfidence: number;
  participatingAgents: string[];
  verdictRationale: string;
  dissentingOpinions: unknown[];
  totalCostCents: number;
  timestamp: string;
  error?: string;
}

// Query keys
const tribunalKeys = {
  all: ['tribunal'] as const,
  configs: () => [...tribunalKeys.all, 'configs'] as const,
  config: (type: string) => [...tribunalKeys.configs(), type] as const,
  verdicts: () => [...tribunalKeys.all, 'verdicts'] as const,
  verdict: (id: string) => [...tribunalKeys.verdicts(), id] as const,
  deliberations: (sessionId: string) => [...tribunalKeys.all, 'deliberations', sessionId] as const,
  profileVerdicts: (profileId: string) => [...tribunalKeys.all, 'profile-verdicts', profileId] as const,
};

/**
 * Fetch all tribunal configurations
 */
export function useTribunalConfigs() {
  return useQuery({
    queryKey: tribunalKeys.configs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tribunal_config')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data as unknown as TribunalConfig[];
    },
  });
}

/**
 * Fetch a specific tribunal configuration
 */
export function useTribunalConfig(tribunalType: string) {
  return useQuery({
    queryKey: tribunalKeys.config(tribunalType),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tribunal_config')
        .select('*')
        .eq('tribunal_type', tribunalType)
        .single();

      if (error) throw error;
      return data as unknown as TribunalConfig;
    },
    enabled: !!tribunalType,
  });
}

/**
 * Fetch tribunal verdicts for a profile
 */
export function useProfileVerdicts(profileId: string | undefined) {
  return useQuery({
    queryKey: tribunalKeys.profileVerdicts(profileId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tribunal_verdicts')
        .select('*')
        .eq('profile_id', profileId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TribunalVerdict[];
    },
    enabled: !!profileId,
  });
}

/**
 * Fetch deliberation arguments for a session
 */
export function useDeliberationSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: tribunalKeys.deliberations(sessionId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_deliberations')
        .select('*')
        .eq('deliberation_session_id', sessionId!)
        .order('round_number')
        .order('created_at');

      if (error) throw error;
      return data as unknown as DeliberationArgument[];
    },
    enabled: !!sessionId,
  });
}

/**
 * Invoke the Intelligence Tribunal engine
 */
export function useInvokeTribunal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TribunalRequest): Promise<TribunalResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('intelligence-tribunal-engine', {
          userId: user.id,
          profileId: request.profileId,
          tribunalType: request.tribunalType,
          subjectData: request.subjectData,
          contextData: request.contextData,
        },);

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Tribunal failed');
      
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Tribunal verdict: ${data.verdict}`, {
        description: `Consensus ${data.consensusReached ? 'reached' : 'not reached'} after ${data.totalRounds} rounds`,
      });
      
      // Invalidate related queries
      if (variables.profileId) {
        queryClient.invalidateQueries({ 
          queryKey: tribunalKeys.profileVerdicts(variables.profileId) 
        });
      }
      queryClient.invalidateQueries({ queryKey: tribunalKeys.verdicts() });
    },
    onError: (error) => {
      toast.error('Tribunal failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update tribunal configuration
 */
export function useUpdateTribunalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<TribunalConfig> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from('agent_tribunal_config')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tribunal configuration updated');
      queryClient.invalidateQueries({ queryKey: tribunalKeys.configs() });
    },
    onError: (error) => {
      toast.error('Failed to update configuration', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
