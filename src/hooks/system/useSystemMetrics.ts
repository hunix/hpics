import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SystemAggregateMetrics {
  totalAICalls: number;
  cacheEntries: number;
  analyticsEvents: number;
}

export function useSystemAggregateMetrics() {
  const { user } = useAuth();
  return useQuery<SystemAggregateMetrics>({
    queryKey: ['system-metrics', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [logsResult, cacheResult, analyticsResult] = await Promise.all([
        supabase.from('ai_usage_logs').select('*', { count: 'exact', head: true }),
        supabase.from('ai_request_cache').select('*', { count: 'exact', head: true }),
        supabase.from('agis_analytics').select('*', { count: 'exact', head: true }),
      ]);
      return {
        totalAICalls: logsResult.count ?? 0,
        cacheEntries: cacheResult.count ?? 0,
        analyticsEvents: analyticsResult.count ?? 0,
      };
    },
  });
}

export async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  const { error } = await supabase.from('platform_config').select('config_key').limit(1);
  const latencyMs = Math.round(performance.now() - start);
  return { ok: !error, latencyMs };
}

export interface EdgeFunctionLogRow {
  function_name: string;
  status: string;
  created_at: string;
  response_time_ms: number | null;
  error_message: string | null;
}

export function useAGISGlobalHealth() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['agis-global-health', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agis_global_state')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export interface RecentSystemActivity {
  function_name: string;
  status: string;
  created_at: string;
  response_time_ms: number | null;
}

export function useRecentSystemActivity(limit = 10) {
  const { user } = useAuth();
  return useQuery<RecentSystemActivity[]>({
    queryKey: ['recent-system-activity', user?.id, limit],
    enabled: !!user,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('function_name, status, created_at, response_time_ms')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as unknown) as RecentSystemActivity[];
    },
  });
}

export function useEdgeFunctionHealthLogs() {
  const { user } = useAuth();
  return useQuery<EdgeFunctionLogRow[]>({
    queryKey: ['edge-function-health', user?.id],
    enabled: !!user,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('function_name, status, created_at, response_time_ms, error_message')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as unknown) as EdgeFunctionLogRow[];
    },
  });
}
