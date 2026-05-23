/**
 * Verification Chamber Hook (v3.9.35)
 * React hooks for multi-stage warfare campaign verification
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

// Types
interface VerificationStage {
  id: string;
  stage_key: string;
  display_name: string;
  description: string | null;
  prompt_key: string;
  model_tier: string;
  focus_criteria: {
    evaluate: string[];
  };
  approval_threshold: number;
  can_veto: boolean;
  is_active: boolean;
}

interface ChamberConfig {
  id: string;
  chamber_type: string;
  display_name: string;
  description: string | null;
  verification_stages: Array<{ stage_key: string; order: number }>;
  require_unanimous: boolean;
  timeout_per_stage_ms: number;
  auto_reject_on_timeout: boolean;
  escalation_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

interface DecisionReview {
  id: string;
  stage_key: string;
  stage_order: number;
  reviewer_verdict: 'approved' | 'rejected' | 'needs_modification';
  confidence_score: number;
  review_rationale: string;
  identified_risks: Array<{ risk: string; severity: string; mitigation?: string }>;
  suggested_modifications: string[];
  veto_exercised: boolean;
  cost_cents: number;
  processing_time_ms: number;
  created_at: string;
}

interface ChamberDecision {
  id: string;
  user_id: string;
  profile_id: string | null;
  campaign_id: string | null;
  chamber_type: string;
  review_session_id: string;
  final_verdict: 'approved' | 'rejected' | 'modified_approved';
  unanimous_approval: boolean;
  stages_passed: number;
  stages_total: number;
  blocking_stage: string | null;
  applied_modifications: string[];
  total_cost_cents: number;
  total_processing_ms: number;
  created_at: string;
}

interface VerificationRequest {
  profileId?: string;
  campaignId?: string;
  chamberType?: string;
  campaignData: Record<string, unknown>;
}

interface VerificationResponse {
  success: boolean;
  reviewSessionId: string;
  chamberType: string;
  finalVerdict: string;
  unanimousApproval: boolean;
  stagesPassed: number;
  stagesTotal: number;
  blockingStage: string | null;
  appliedModifications: string[];
  stageReviews: Array<{
    stage: string;
    verdict: string;
    confidence: number;
    risksIdentified: number;
  }>;
  totalCostCents: number;
  totalProcessingMs: number;
  timestamp: string;
  error?: string;
}

// Query keys
const chamberKeys = {
  all: ['verification-chamber'] as const,
  configs: () => [...chamberKeys.all, 'configs'] as const,
  config: (type: string) => [...chamberKeys.configs(), type] as const,
  stages: () => [...chamberKeys.all, 'stages'] as const,
  decisions: () => [...chamberKeys.all, 'decisions'] as const,
  decision: (id: string) => [...chamberKeys.decisions(), id] as const,
  reviews: (sessionId: string) => [...chamberKeys.all, 'reviews', sessionId] as const,
  campaignDecisions: (campaignId: string) => [...chamberKeys.all, 'campaign', campaignId] as const,
};

/**
 * Fetch all verification stages
 */
export function useVerificationStages() {
  return useQuery({
    queryKey: chamberKeys.stages(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_stages')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data as unknown as VerificationStage[];
    },
  });
}

/**
 * Fetch all chamber configurations
 */
export function useChamberConfigs() {
  return useQuery({
    queryKey: chamberKeys.configs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_chamber_config')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data as unknown as ChamberConfig[];
    },
  });
}

/**
 * Fetch a specific chamber configuration
 */
export function useChamberConfig(chamberType: string) {
  return useQuery({
    queryKey: chamberKeys.config(chamberType),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_chamber_config')
        .select('*')
        .eq('chamber_type', chamberType)
        .single();

      if (error) throw error;
      return data as unknown as ChamberConfig;
    },
    enabled: !!chamberType,
  });
}

/**
 * Fetch reviews for a session
 */
export function useSessionReviews(sessionId: string | undefined) {
  return useQuery({
    queryKey: chamberKeys.reviews(sessionId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decision_reviews')
        .select('*')
        .eq('review_session_id', sessionId)
        .order('stage_order');

      if (error) throw error;
      return data as unknown as DecisionReview[];
    },
    enabled: !!sessionId,
  });
}

/**
 * Fetch decisions for a campaign
 */
export function useCampaignDecisions(campaignId: string | undefined) {
  return useQuery({
    queryKey: chamberKeys.campaignDecisions(campaignId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chamber_decisions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ChamberDecision[];
    },
    enabled: !!campaignId,
  });
}

/**
 * Invoke the Verification Chamber
 */
export function useInvokeVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: VerificationRequest): Promise<VerificationResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('warfare-verification-chamber', {
          userId: user.id,
          profileId: request.profileId,
          campaignId: request.campaignId,
          chamberType: request.chamberType || 'warfare_campaign',
          campaignData: request.campaignData,
        },);

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Verification failed');
      
      return data;
    },
    onSuccess: (data, variables) => {
      const verdictColor = data.finalVerdict === 'approved' ? 'success' : 
                          data.finalVerdict === 'modified_approved' ? 'warning' : 'error';
      
      toast[verdictColor === 'success' ? 'success' : verdictColor === 'warning' ? 'warning' : 'error'](
        `Campaign ${data.finalVerdict}`, {
        description: `${data.stagesPassed}/${data.stagesTotal} stages passed`,
      });
      
      // Invalidate related queries
      if (variables.campaignId) {
        queryClient.invalidateQueries({ 
          queryKey: chamberKeys.campaignDecisions(variables.campaignId) 
        });
      }
      queryClient.invalidateQueries({ queryKey: chamberKeys.decisions() });
    },
    onError: (error) => {
      toast.error('Verification failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update chamber configuration
 */
export function useUpdateChamberConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string } & Record<string, unknown>) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from('verification_chamber_config')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Chamber configuration updated');
      queryClient.invalidateQueries({ queryKey: chamberKeys.configs() });
    },
    onError: (error) => {
      toast.error('Failed to update configuration', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update verification stage
 */
export function useUpdateVerificationStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<VerificationStage> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from('verification_stages')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Stage configuration updated');
      queryClient.invalidateQueries({ queryKey: chamberKeys.stages() });
    },
    onError: (error) => {
      toast.error('Failed to update stage', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
