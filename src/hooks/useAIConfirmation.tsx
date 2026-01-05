import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { estimateTokens, calculateCostCents, AI_MODEL_PRICING } from '@/lib/aiPricing';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface AIRequestConfig {
  functionName: string;
  modelKey: string;
  promptText: string;
  profileId?: string;
  recordingId?: string;
  metadata?: Record<string, Json>;
}

export interface AIConfirmationState {
  isOpen: boolean;
  config: AIRequestConfig | null;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostCents: number;
}

export function useAIConfirmation() {
  const { user } = useAuth();
  const [confirmationState, setConfirmationState] = useState<AIConfirmationState>({
    isOpen: false,
    config: null,
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    estimatedCostCents: 0,
  });
  const [pendingResolver, setPendingResolver] = useState<{
    resolve: (value: { approved: boolean; logId?: string }) => void;
  } | null>(null);

  const requestConfirmation = useCallback(
    (config: AIRequestConfig): Promise<{ approved: boolean; logId?: string }> => {
      const inputTokens = estimateTokens(config.promptText);
      // Estimate output as 50% of input for most analyses
      const outputTokens = Math.ceil(inputTokens * 0.5);
      const costCents = calculateCostCents(config.modelKey, inputTokens, outputTokens);

      return new Promise((resolve) => {
        setConfirmationState({
          isOpen: true,
          config,
          estimatedInputTokens: inputTokens,
          estimatedOutputTokens: outputTokens,
          estimatedCostCents: costCents,
        });
        setPendingResolver({ resolve });
      });
    },
    []
  );

  const confirmRequest = useCallback(async (): Promise<void> => {
    if (!confirmationState.config || !user || !pendingResolver) return;

    const { functionName, modelKey, promptText, profileId, recordingId, metadata } =
      confirmationState.config;
    const pricing = AI_MODEL_PRICING[modelKey];

    try {
      // Create pending log entry
      const { data: logEntry, error } = await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: user.id,
          function_name: functionName,
          model_name: modelKey,
          provider: pricing?.provider || 'unknown',
          prompt_summary: promptText.substring(0, 500),
          estimated_cost_cents: confirmationState.estimatedCostCents,
          input_tokens: confirmationState.estimatedInputTokens,
          output_tokens: confirmationState.estimatedOutputTokens,
          total_tokens:
            confirmationState.estimatedInputTokens + confirmationState.estimatedOutputTokens,
          profile_id: profileId || null,
          recording_id: recordingId || null,
          status: 'pending',
          request_metadata: (metadata || {}) as Json,
        })
        .select()
        .single();

      if (error) throw error;

      // First resolve the promise, then close the dialog
      pendingResolver.resolve({ approved: true, logId: logEntry.id });
      setPendingResolver(null);
      
      setConfirmationState({
        isOpen: false,
        config: null,
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        estimatedCostCents: 0,
      });
    } catch (error) {
      console.error('Failed to create AI usage log:', error);
      toast.error('Failed to log AI request');
      pendingResolver.resolve({ approved: false });
      setPendingResolver(null);
      setConfirmationState({
        isOpen: false,
        config: null,
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        estimatedCostCents: 0,
      });
    }
  }, [confirmationState, user, pendingResolver]);

  const cancelRequest = useCallback(() => {
    setConfirmationState({
      isOpen: false,
      config: null,
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      estimatedCostCents: 0,
    });
    if (pendingResolver) {
      pendingResolver.resolve({ approved: false });
      setPendingResolver(null);
    }
  }, [pendingResolver]);

  const updateLogWithResult = useCallback(
    async (
      logId: string,
      result: {
        status: 'completed' | 'failed';
        actualInputTokens?: number;
        actualOutputTokens?: number;
        actualCostCents?: number;
        responseTimeMs?: number;
        errorMessage?: string;
        responseMetadata?: Record<string, Json>;
      }
    ) => {
      try {
        await supabase
          .from('ai_usage_logs')
          .update({
            status: result.status,
            input_tokens: result.actualInputTokens,
            output_tokens: result.actualOutputTokens,
            total_tokens: (result.actualInputTokens || 0) + (result.actualOutputTokens || 0),
            actual_cost_cents: result.actualCostCents,
            response_time_ms: result.responseTimeMs,
            error_message: result.errorMessage,
            response_metadata: (result.responseMetadata || {}) as Json,
          })
          .eq('id', logId);
      } catch (error) {
        console.error('Failed to update AI usage log:', error);
      }
    },
    []
  );

  return {
    confirmationState,
    requestConfirmation,
    confirmRequest,
    cancelRequest,
    updateLogWithResult,
  };
}
