/**
 * @fileoverview Integration Health Hook
 * Fetches and combines integration status, test history, and calculates health metrics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  INTEGRATIONS, 
  getAllSecretKeys,
  type IntegrationDefinition,
  type IntegrationCategory,
} from '@/lib/integrations/registry';
import { invokeFunction } from '@/lib/api';

export interface IntegrationTestRecord {
  id: string;
  integration_id: string;
  secret_key: string;
  success: boolean;
  message: string | null;
  response_time_ms: number | null;
  tested_at: string;
}

export interface IntegrationHealthStatus {
  integration: IntegrationDefinition;
  isConfigured: boolean;
  isEnabled: boolean;
  secretsConfigured: number;
  secretsTotal: number;
  lastTest: IntegrationTestRecord | null;
  testCount: number;
  successRate: number;
  averageResponseTime: number | null;
  status: 'healthy' | 'warning' | 'error' | 'not-configured' | 'connector';
}

export interface IntegrationHealthSummary {
  integrations: IntegrationHealthStatus[];
  readinessScore: number;
  configuredCount: number;
  totalCount: number;
  healthyCount: number;
  warningCount: number;
  errorCount: number;
  lastUpdated: Date;
  byCategory: Record<IntegrationCategory, IntegrationHealthStatus[]>;
}

export function useIntegrationHealth() {
  const { user } = useAuth();

  // Fetch secret status
  const { data: secretStatus, isLoading: isLoadingSecrets } = useQuery({
    queryKey: ['secret-status', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('check-secrets', { secrets: getAllSecretKeys() });
      if (error) {
        console.warn('Could not check secret status:', error);
        return {};
      }
      return data?.status || {};
    },
    enabled: !!user,
    retry: false,
    staleTime: 30000,
  });

  // Fetch integration configs
  const { data: configs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['integration-configs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch test history
  const { data: testHistory, isLoading: isLoadingTests } = useQuery({
    queryKey: ['integration-test-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_test_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('tested_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as IntegrationTestRecord[];
    },
    enabled: !!user,
  });

  // Compute health summary
  const healthSummary = useQuery({
    queryKey: ['integration-health-summary', secretStatus, configs, testHistory],
    queryFn: (): IntegrationHealthSummary => {
      const secretStatusMap = secretStatus || {};
      const configMap = new Map(configs?.map(c => [c.integration_type, c]) || []);
      const testsByIntegration = new Map<string, IntegrationTestRecord[]>();
      
      // Group tests by integration
      for (const test of testHistory || []) {
        const existing = testsByIntegration.get(test.integration_id) || [];
        existing.push(test);
        testsByIntegration.set(test.integration_id, existing);
      }

      const integrationStatuses: IntegrationHealthStatus[] = INTEGRATIONS.map(integration => {
        // Check secret configuration
        const secretsConfigured = integration.secrets.filter(
          s => secretStatusMap[s.key] || s.isOptional
        ).length;
        const secretsTotal = integration.secrets.length;
        const isConfigured = secretsConfigured === secretsTotal || Boolean(integration.isConnector);
        
        // Check enabled status
        const config = configMap.get(integration.id);
        const isEnabled = config?.is_enabled ?? true;

        // Get test history for this integration
        const integrationTests = testsByIntegration.get(integration.id) || [];
        const lastTest = integrationTests[0] || null;
        const testCount = integrationTests.length;
        
        // Calculate success rate
        const successfulTests = integrationTests.filter(t => t.success).length;
        const successRate = testCount > 0 ? (successfulTests / testCount) * 100 : 0;
        
        // Calculate average response time
        const responseTimes = integrationTests
          .filter(t => t.response_time_ms !== null)
          .map(t => t.response_time_ms!);
        const averageResponseTime = responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : null;

        // Determine health status
        let status: IntegrationHealthStatus['status'];
        if (integration.isConnector) {
          status = 'connector';
        } else if (!isConfigured) {
          status = 'not-configured';
        } else if (lastTest?.success === false) {
          status = 'error';
        } else if (successRate < 80 && testCount > 2) {
          status = 'warning';
        } else {
          status = 'healthy';
        }

        return {
          integration,
          isConfigured,
          isEnabled,
          secretsConfigured,
          secretsTotal,
          lastTest,
          testCount,
          successRate,
          averageResponseTime,
          status,
        };
      });

      // Calculate summary metrics
      const configuredCount = integrationStatuses.filter(s => s.isConfigured).length;
      const totalCount = INTEGRATIONS.length;
      const healthyCount = integrationStatuses.filter(s => s.status === 'healthy' || s.status === 'connector').length;
      const warningCount = integrationStatuses.filter(s => s.status === 'warning').length;
      const errorCount = integrationStatuses.filter(s => s.status === 'error').length;
      const readinessScore = Math.round((configuredCount / totalCount) * 100);

      // Group by category
      const byCategory = {} as Record<IntegrationCategory, IntegrationHealthStatus[]>;
      for (const status of integrationStatuses) {
        const category = status.integration.category;
        if (!byCategory[category]) {
          byCategory[category] = [];
        }
        byCategory[category].push(status);
      }

      return {
        integrations: integrationStatuses,
        readinessScore,
        configuredCount,
        totalCount,
        healthyCount,
        warningCount,
        errorCount,
        lastUpdated: new Date(),
        byCategory,
      };
    },
    enabled: !isLoadingSecrets && !isLoadingConfigs && !isLoadingTests,
  });

  return {
    ...healthSummary,
    isLoading: isLoadingSecrets || isLoadingConfigs || isLoadingTests || healthSummary.isLoading,
    refetch: () => {
      healthSummary.refetch();
    },
  };
}
