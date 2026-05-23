import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EdgeFunctionLog {
  function_name: string;
  status: string;
  created_at: string;
  response_time_ms: number | null;
}

export function useRecentEdgeFunctionLogs(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['edge-function-logs', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_usage_logs')
        .select('function_name, status, created_at, response_time_ms')
        .order('created_at', { ascending: false })
        .limit(limit);
      return (data ?? []) as EdgeFunctionLog[];
    },
  });
}
