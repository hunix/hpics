import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Document as BaseDocument } from '@/types/database-helpers';

export type DocumentWithProfile = BaseDocument & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export type DocumentType = 'resume' | 'contract' | 'presentation' | 'notes' | 'article' | 'other';

export interface PaginatedDocumentsParams {
  selectedContactId: string | null;
  searchQuery: string;
  typeFilter: string;
  sortBy: string;
  currentPage: number;
  itemsPerPage: number;
  enabled: boolean;
}

export function usePaginatedDocuments(params: PaginatedDocumentsParams) {
  const { user } = useAuth();
  const { selectedContactId, searchQuery, typeFilter, sortBy, currentPage, itemsPerPage, enabled } = params;
  return useQuery({
    queryKey: ['documents-paginated', user?.id, selectedContactId, searchQuery, typeFilter, sortBy, currentPage, itemsPerPage],
    enabled: !!user && enabled,
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*, profiles(first_name, last_name)', { count: 'exact' });

      if (selectedContactId) {
        query = query.eq('profile_id', selectedContactId);
      }
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      if (typeFilter !== 'all') {
        query = query.eq('document_type', typeFilter as DocumentType);
      }

      const ascending = sortBy === 'oldest' || sortBy === 'name-asc';
      const column = sortBy.startsWith('name') ? 'title' : 'created_at';
      query = query.order(column, { ascending });

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { items: (data as DocumentWithProfile[]) ?? [], totalCount: count ?? 0 };
    },
  });
}

export function useIdentityDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['all-identity-documents', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_identity_documents')
        .select('*, profiles(first_name, last_name)')
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
    },
  });
}
