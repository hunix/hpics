import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EnhancedContact {
  id: string;
  first_name: string;
  last_name: string | null;
  organization: string | null;
  job_title: string | null;
  relationship_type: string | null;
  relationship_subtype: string | null;
  hierarchy_level: string | null;
  avatar_url: string | null;
  is_favorite: boolean;
  is_active: boolean;
  tags: string[] | null;
  created_at: string;
  country: string | null;
  last_interaction_at: string | null;
  engagement_score: number;
  total_count: number;
}

export type SortBy = 'name' | 'recent' | 'oldest' | 'organization' | 'relationship' | 'engagement';
export type SortOrder = 'asc' | 'desc';

interface UseEnhancedContactsOptions {
  searchQuery?: string;
  relationshipFilter?: string | null;
  subtypeFilter?: string | null;
  tagFilter?: string | null;
  favoriteFilter?: boolean;
  activeFilter?: boolean | null;
  letterFilter?: string | null;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  pageSize?: number;
  enabled?: boolean;
}

export function useEnhancedContacts({
  searchQuery,
  relationshipFilter,
  subtypeFilter,
  tagFilter,
  favoriteFilter,
  activeFilter,
  letterFilter,
  sortBy = 'name',
  sortOrder = 'asc',
  pageSize = 50,
  enabled = true,
}: UseEnhancedContactsOptions) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: [
      'enhanced-contacts',
      user?.id,
      searchQuery,
      relationshipFilter,
      subtypeFilter,
      tagFilter,
      favoriteFilter,
      activeFilter,
      letterFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('search_contacts_v3', {
        p_user_id: user.id,
        p_search_query: searchQuery || null,
        p_relationship_type: relationshipFilter || null,
        p_relationship_subtype: subtypeFilter || null,
        p_tag: tagFilter || null,
        p_is_favorite: favoriteFilter || null,
        p_is_active: activeFilter ?? null,
        p_first_letter: letterFilter || null,
        p_sort_by: sortBy,
        p_sort_order: sortOrder,
        p_limit: pageSize,
        p_offset: pageParam * pageSize,
      });

      if (error) throw error;

      const contacts = (data || []) as EnhancedContact[];
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

// Hook to get active contact counts using server-side aggregation (no 1000 row limit)
export function useActiveContactCounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-contact-counts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('get_contact_counts', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data?.[0] || { active_count: 0, inactive_count: 0, total_count: 0 };
      return { 
        active: Number(result.active_count) || 0, 
        inactive: Number(result.inactive_count) || 0, 
        total: Number(result.total_count) || 0 
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Hook for letter counts for alphabetical sidebar
export function useContactLetterCounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact-letter-counts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('get_contact_letter_counts', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return (data || []) as { letter: string; count: number }[];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Hook for filter options
export function useContactFilterOptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact-filter-options', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('get_contact_filter_options', {
        p_user_id: user.id,
      });

      if (error) throw error;
      const result = data?.[0] || { relationships: [], subtypes: [], tags: [] };
      return {
        relationships: (result.relationships || []) as string[],
        subtypes: (result.subtypes || []) as string[],
        tags: (result.tags || []) as string[],
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}
