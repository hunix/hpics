import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Media as BaseMedia, MeetingRecording } from '@/types/database-helpers';

export type MediaWithProfile = BaseMedia & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export type RecordingWithProfile = MeetingRecording & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export interface PaginatedMediaParams {
  selectedContactId: string | null;
  searchQuery: string;
  typeFilter: string;
  sortBy: string;
  currentPage: number;
  itemsPerPage: number;
  enabled: boolean;
}

export function usePaginatedMedia(params: PaginatedMediaParams) {
  const { user } = useAuth();
  const { selectedContactId, searchQuery, typeFilter, sortBy, currentPage, itemsPerPage, enabled } = params;
  return useQuery({
    queryKey: ['media-paginated', user?.id, selectedContactId, searchQuery, typeFilter, sortBy, currentPage, itemsPerPage],
    enabled: !!user && enabled,
    queryFn: async () => {
      let query = supabase
        .from('media')
        .select('*, profiles(first_name, last_name)', { count: 'exact' });

      if (selectedContactId) {
        query = query.eq('profile_id', selectedContactId);
      }
      if (searchQuery) {
        query = query.ilike('caption', `%${searchQuery}%`);
      }
      if (typeFilter !== 'all') {
        query = query.ilike('mime_type', `${typeFilter}/%`);
      }

      const ascending = sortBy === 'oldest' || sortBy === 'name-asc';
      const column = sortBy.startsWith('name') ? 'caption' : 'created_at';
      query = query.order(column, { ascending });

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { items: (data as MediaWithProfile[]) ?? [], totalCount: count ?? 0 };
    },
  });
}

export function useMeetingRecordings() {
  const { user } = useAuth();
  return useQuery<RecordingWithProfile[]>({
    queryKey: ['recordings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_recordings')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RecordingWithProfile[];
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    },
  });
}

export function useDeleteRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meeting_recordings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });
}
