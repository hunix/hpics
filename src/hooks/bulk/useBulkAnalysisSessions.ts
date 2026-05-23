import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BulkSession {
  id: string;
  name: string | null;
  status: string;
  scope_type: string;
  profile_ids: string[] | null;
  media_types: string[] | null;
  analysis_modes: string[] | null;
  total_items: number;
  completed_items: number;
  failed_items: number;
  skipped_items: number;
  current_cost_cents: number;
  max_cost_cents: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  scheduled_for: string | null;
  aggregation_result: Record<string, unknown> | null;
}

export function useBulkAnalysisSessions() {
  return useQuery<BulkSession[]>({
    queryKey: ['bulk-analysis-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_analysis_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as BulkSession[];
    },
  });
}

export function useDeleteBulkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('bulk_analysis_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-analysis-sessions'] });
    },
  });
}
