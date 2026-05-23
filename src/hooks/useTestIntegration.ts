import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface TestResult {
  success: boolean;
  message: string;
  responseTime: number;
  details?: Record<string, unknown>;
}

interface TestIntegrationParams {
  integrationId: string;
  apiKey: string;
  additionalParams?: Record<string, string>;
  secretKey?: string; // Optional: for saving to history with different key
}

export function useTestIntegration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ integrationId, apiKey, additionalParams, secretKey }: TestIntegrationParams): Promise<TestResult> => {
      const { data, error } = await invokeFunction('test-integration', { integrationId, apiKey, additionalParams },);
      
      if (error) {
        throw new Error(error.message || 'Failed to test integration');
      }
      
      const result = data as TestResult;
      
      // Save test result to history if user is authenticated
      if (user) {
        try {
          await supabase.from('integration_test_history').insert({
            user_id: user.id,
            integration_id: integrationId,
            secret_key: secretKey || integrationId,
            success: result.success,
            message: result.message,
            response_time_ms: result.responseTime || null,
          });
          
          // Invalidate health queries
          queryClient.invalidateQueries({ queryKey: ['integration-test-history'] });
          queryClient.invalidateQueries({ queryKey: ['integration-health-summary'] });
        } catch (saveError) {
          console.warn('Failed to save test history:', saveError);
        }
      }
      
      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message, {
          description: result.responseTime ? `Response time: ${result.responseTime}ms` : undefined,
        });
      } else {
        toast.error('Test Failed', {
          description: result.message,
        });
      }
    },
    onError: (error) => {
      toast.error('Test Error', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });
}
