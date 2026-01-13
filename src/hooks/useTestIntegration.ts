import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

export function useTestIntegration() {
  return useMutation({
    mutationFn: async ({ integrationId, apiKey, additionalParams }: TestIntegrationParams): Promise<TestResult> => {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { integrationId, apiKey, additionalParams },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to test integration');
      }
      
      return data as TestResult;
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
