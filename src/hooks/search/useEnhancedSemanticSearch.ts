import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SavedSearch {
  id: string;
  name: string;
  query_text: string;
  filters: Record<string, unknown>;
  is_pinned: boolean;
  use_count: number;
  last_used_at: string | null;
}

export interface QuerySuggestion {
  suggestion_text: string;
  suggestion_type: string;
  use_count: number;
}

export function useSavedSearches(limit = 10) {
  const { user } = useAuth();
  return useQuery<SavedSearch[]>({
    queryKey: ['saved-searches', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('use_count', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as unknown) as SavedSearch[];
    },
  });
}

export function useQuerySuggestions(query: string) {
  const { user } = useAuth();
  return useQuery<QuerySuggestion[]>({
    queryKey: ['query-suggestions', user?.id, query],
    enabled: !!user && query.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('query_suggestions')
        .select('suggestion_text, suggestion_type, use_count')
        .ilike('suggestion_text', `%${query}%`)
        .order('use_count', { ascending: false })
        .limit(5);
      if (error) throw error;
      return ((data ?? []) as unknown) as QuerySuggestion[];
    },
  });
}

export function useRecordSearchFeedback() {
  return useMutation({
    mutationFn: async ({ queryId, feedback }: { queryId: string; feedback: 'helpful' | 'not_helpful' }) => {
      const { error } = await supabase
        .from('rag_query_logs')
        .update({ user_feedback: feedback })
        .eq('id', queryId);
      if (error) throw error;
    },
  });
}
