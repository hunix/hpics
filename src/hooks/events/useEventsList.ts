import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Event as BaseEvent } from '@/types/database-helpers';

export type EventWithProfile = BaseEvent & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export function useEventsList() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['events', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles(first_name, last_name)')
        .eq('is_active', true)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventWithProfile[];
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
