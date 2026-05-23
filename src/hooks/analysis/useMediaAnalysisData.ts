import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalysisContact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

export function useAllContactsForAnalysis() {
  return useQuery<AnalysisContact[]>({
    queryKey: ['contacts-for-analysis-all'],
    queryFn: async () => {
      const allContacts: AnalysisContact[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .order('first_name')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allContacts.push(...(data as AnalysisContact[]));
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      return allContacts;
    },
  });
}

export function useRecentMediaAnalyses(selectedContact: string | null) {
  return useQuery({
    queryKey: ['recent-media-analyses', selectedContact],
    queryFn: async () => {
      let query = supabase
        .from('media_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (selectedContact) {
        query = query.eq('profile_id', selectedContact);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function checkBulkSessionStatus(sessionId: string) {
  const { data, error } = await supabase
    .from('bulk_analysis_sessions')
    .select('status, completed_at')
    .eq('id', sessionId)
    .single();
  if (error) return null;
  return data;
}

export async function cancelBulkSession(sessionId: string) {
  await supabase
    .from('bulk_analysis_sessions')
    .update({ status: 'cancelled', completed_at: new Date().toISOString() })
    .eq('id', sessionId);
}
