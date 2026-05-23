import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ServerSideContact {
  id: string;
  first_name: string;
  last_name: string | null;
  organization: string | null;
  job_title: string | null;
  relationship_type: string | null;
  avatar_url: string | null;
  is_favorite: boolean;
  tags: string[] | null;
  total_count: number;
}

interface UseServerSideContactsOptions {
  searchQuery?: string;
  relationshipFilter?: string | null;
  favoriteFilter?: boolean;
  pageSize?: number;
  enabled?: boolean;
}

export function useServerSideContacts({
  searchQuery,
  relationshipFilter,
  favoriteFilter,
  pageSize = 50,
  enabled = true,
}: UseServerSideContactsOptions) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['server-contacts', user?.id, searchQuery, relationshipFilter, favoriteFilter],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('No user');

      // Use search_contacts_v5 which is the current canonical function
      const { data, error } = await supabase.rpc('search_contacts_v5', {
        p_user_id: user.id,
        p_search_query: searchQuery || undefined,
        p_relationship_type: relationshipFilter || undefined,
        p_relationship_subtype: undefined,
        p_tag: undefined,
        p_is_favorite: favoriteFilter ?? undefined,
        p_is_active: undefined,
        p_first_letter: undefined,
        p_sort_by: 'name',
        p_sort_order: 'asc',
        p_limit: pageSize,
        p_offset: pageParam * pageSize,
      });

      if (error) throw error;
      
      const contacts = (data || []) as ServerSideContact[];
      const totalCount = contacts[0]?.total_count ?? 0;
      
      return {
        contacts,
        totalCount,
        nextPage: contacts.length === pageSize ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: enabled && !!user?.id,
    staleTime: 30000,
  });
}

// Hook for simple paginated contacts (non-infinite)
export function usePaginatedContacts({
  searchQuery,
  relationshipFilter,
  favoriteFilter,
  page = 0,
  pageSize = 50,
  enabled = true,
}: UseServerSideContactsOptions & { page?: number }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['paginated-contacts', user?.id, searchQuery, relationshipFilter, favoriteFilter, page, pageSize],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      // Use search_contacts_v5 which is the current canonical function
      const { data, error } = await supabase.rpc('search_contacts_v5', {
        p_user_id: user.id,
        p_search_query: searchQuery || undefined,
        p_relationship_type: relationshipFilter || undefined,
        p_relationship_subtype: undefined,
        p_tag: undefined,
        p_is_favorite: favoriteFilter ?? undefined,
        p_is_active: undefined,
        p_first_letter: undefined,
        p_sort_by: 'name',
        p_sort_order: 'asc',
        p_limit: pageSize,
        p_offset: page * pageSize,
      });

      if (error) throw error;
      
      const contacts = (data || []) as ServerSideContact[];
      const totalCount = contacts[0]?.total_count ?? 0;
      
      return {
        contacts,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: contacts.length === pageSize,
      };
    },
    enabled: enabled && !!user?.id,
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });
}
