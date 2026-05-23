import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useKeystrokeProfiles(profileId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['keystroke-profiles', user?.id, profileId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('keystroke_profiles')
        .select('*')
        .eq('user_id', user!.id);
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
