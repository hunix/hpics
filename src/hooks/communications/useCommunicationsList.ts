import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Communication as BaseCommunication } from '@/types/database-helpers';

export type CommunicationWithProfile = BaseCommunication & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export function useCommunicationsList() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['communications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select('*, profiles(first_name, last_name)')
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CommunicationWithProfile[];
    },
  });
}
