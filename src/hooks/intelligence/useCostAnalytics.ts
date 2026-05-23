import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface CostAnomaly {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  value: number;
  threshold: number;
  detectedAt: string;
}

export type CostTimeRange = '7d' | '30d' | '90d';

const keys = {
  usage: (userId?: string, range?: CostTimeRange) => ['cost-analytics', userId, range] as const,
  anomalies: (userId?: string) => ['cost-anomalies', userId] as const,
};

interface AnomalyRow {
  id: string;
  anomaly_type: string;
  severity: string;
  title: string;
  description: string;
  anomaly_value: number;
  threshold_value: number;
  created_at: string;
}

export function useAIUsageLogs(timeRange: CostTimeRange) {
  const { user } = useAuth();
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), days)).toISOString();
  const endDate = endOfDay(new Date()).toISOString();

  return useQuery({
    queryKey: keys.usage(user?.id, timeRange),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCostAnomalies() {
  const { user } = useAuth();
  return useQuery<CostAnomaly[]>({
    queryKey: keys.anomalies(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_anomaly_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return ((data ?? []) as AnomalyRow[]).map(a => ({
        id: a.id,
        type: a.anomaly_type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        value: a.anomaly_value,
        threshold: a.threshold_value,
        detectedAt: a.created_at,
      }));
    },
  });
}
