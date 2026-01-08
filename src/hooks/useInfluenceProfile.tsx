import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { handleAIError } from '@/lib/aiErrorHandler';
import type { 
  GoalType
} from '@/lib/influenceTypes';

// Database types from Supabase
type DbInfluenceProfile = {
  id: string;
  user_id: string;
  profile_id: string;
  reciprocity_susceptibility: number | null;
  commitment_consistency_susceptibility: number | null;
  social_proof_susceptibility: number | null;
  authority_susceptibility: number | null;
  liking_susceptibility: number | null;
  scarcity_susceptibility: number | null;
  unity_susceptibility: number | null;
  decision_style: string | null;
  information_preference: string | null;
  risk_appetite: string | null;
  time_pressure_response: string | null;
  thinking_style: string | null;
  attention_span: string | null;
  positive_triggers: unknown;
  negative_triggers: unknown;
  power_words: string[] | null;
  avoid_words: string[] | null;
  fear_motivators: string[] | null;
  desire_motivators: string[] | null;
  ego_sensitivities: string[] | null;
  recommended_methodologies: string[] | null;
  approach_sequence: unknown;
  timing_preferences: unknown;
  channel_preferences: unknown;
  overall_influence_score: number | null;
  confidence_score: number | null;
  evidence_sources: unknown;
  ai_model_used: string | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Fetch influence profile for a contact
export function useInfluenceProfile(profileId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['influence-profile', profileId],
    queryFn: async () => {
      if (!profileId || !user) return null;
      
      const { data, error } = await supabase
        .from('contact_influence_profiles')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as DbInfluenceProfile | null;
    },
    enabled: !!profileId && !!user
  });
}

// Analyze influence profile via AI
export function useAnalyzeInfluenceProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, modelKey }: { profileId: string; modelKey?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('analyze-influence-profile', {
        body: { profileId, modelKey }
      });

      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);

      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['influence-profile', variables.profileId] });
      toast.success('Influence profile generated successfully');
    },
    onError: (error: any) => {
      if (!handleAIError(error).handled) {
        toast.error(error.message || 'Failed to analyze influence profile');
      }
    }
  });
}

// Fetch strategies for a contact
export function useInfluenceStrategies(profileId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['influence-strategies', profileId],
    queryFn: async () => {
      if (!profileId || !user) return [];
      
      const { data, error } = await supabase
        .from('influence_strategies')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user
  });
}

// Generate new strategy via AI
export function useGenerateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      goalType, 
      goalDescription, 
      context, 
      modelKey 
    }: { 
      profileId: string; 
      goalType: GoalType; 
      goalDescription?: string;
      context?: string;
      modelKey?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('generate-influence-strategy', {
        body: { profileId, goalType, goalDescription, context, modelKey }
      });

      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);

      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['influence-strategies', variables.profileId] });
      toast.success('Strategy generated successfully');
    },
    onError: (error: any) => {
      if (!handleAIError(error).handled) {
        toast.error(error.message || 'Failed to generate strategy');
      }
    }
  });
}

// Update strategy status
export function useUpdateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      strategyId, 
      updates 
    }: { 
      strategyId: string; 
      updates: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('influence_strategies')
        .update(updates)
        .eq('id', strategyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['influence-strategies', data.profile_id] });
      toast.success('Strategy updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update strategy');
    }
  });
}

// Fetch methodology library
export function useMethodologyLibrary(category?: string) {
  return useQuery({
    queryKey: ['methodologies', category],
    queryFn: async () => {
      let query = supabase
        .from('intelligence_methodologies')
        .select('*')
        .order('category')
        .order('difficulty_level');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}

// Fetch actions for a contact
export function useInfluenceActions(profileId: string | undefined, status?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['influence-actions', profileId, status],
    queryFn: async () => {
      if (!profileId || !user) return [];
      
      let query = supabase
        .from('influence_actions')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user
  });
}

// Create influence action
export function useCreateAction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (action: {
      profile_id: string;
      action_type: string;
      action_title: string;
      action_description?: string;
      suggested_message?: string;
      suggested_channel?: string;
      talking_points?: string[];
      things_to_mention?: string[];
      things_to_avoid?: string[];
      scheduled_for?: string;
      priority?: string;
      strategy_id?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('influence_actions')
        .insert({ ...action, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['influence-actions', data.profile_id] });
      toast.success('Action scheduled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create action');
    }
  });
}

// Update action status
export function useUpdateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      actionId, 
      updates 
    }: { 
      actionId: string; 
      updates: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('influence_actions')
        .update(updates)
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['influence-actions', data.profile_id] });
      toast.success('Action updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update action');
    }
  });
}

// Record methodology outcome
export function useRecordOutcome() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (outcome: {
      profile_id: string;
      methodology_name: string;
      outcome: string;
      methodology_id?: string;
      strategy_id?: string;
      action_id?: string;
      context?: string;
      approach_used?: string;
      outcome_score?: number;
      response_observed?: string;
      lessons?: string;
      tags?: string[];
      applied_at?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('methodology_outcomes')
        .insert({ ...outcome, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['methodology-outcomes', data.profile_id] });
      toast.success('Outcome recorded');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record outcome');
    }
  });
}

// Fetch pending actions for dashboard
export function usePendingActions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-actions'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('influence_actions')
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
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
}
