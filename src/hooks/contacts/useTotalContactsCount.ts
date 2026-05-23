import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useTotalActiveContactsCount() {
  const { user } = useAuth();
  return useQuery<number>({
    queryKey: ['total-contacts-count', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_active', true);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
