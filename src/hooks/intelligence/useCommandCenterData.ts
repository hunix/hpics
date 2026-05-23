import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CommandCenterJobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface SystemHealthRow {
  component: string;
  status: string | null;
  last_heartbeat: string | null;
  metrics: unknown;
}

export function useCommandCenterJobStats(autoRefresh: boolean) {
  const { user } = useAuth();
  return useQuery<CommandCenterJobStats | null>({
    queryKey: ['intelligence-jobs-stats', user?.id],
    enabled: !!user?.id,
    refetchInterval: autoRefresh ? 5000 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orchestrator_jobs')
        .select('status')
        .eq('user_id', user!.id);
      if (error) throw error;
      const rows = data ?? [];
      return {
        total: rows.length,
        pending: rows.filter((j) => j.status === 'registered' || j.status === 'queued').length,
        processing: rows.filter((j) => j.status === 'processing').length,
        completed: rows.filter((j) => j.status === 'completed').length,
        failed: rows.filter((j) => j.status === 'failed').length,
      };
    },
  });
}

export function useCommandCenterRecentEvents(autoRefresh: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['intelligence-recent-events', user?.id],
    enabled: !!user?.id,
    refetchInterval: autoRefresh ? 5000 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_events')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCommandCenterSystemHealth(autoRefresh: boolean) {
  const { user } = useAuth();
  return useQuery<SystemHealthRow[]>({
    queryKey: ['intelligence-system-health', user?.id],
    enabled: !!user?.id,
    refetchInterval: autoRefresh ? 10000 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_health')
        .select('component, status, last_heartbeat')
        .eq('user_id', user!.id);
      if (error) throw error;
      return ((data ?? []) as unknown[]).map((d) => {
        const r = d as { component: string; status: string | null; last_heartbeat: string | null };
        return { ...r, metrics: null };
      });
    },
  });
}

export function useCommandCenterAggregates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['intelligence-aggregates', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_aggregates')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}
