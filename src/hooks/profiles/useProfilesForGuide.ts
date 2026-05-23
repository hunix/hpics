import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GuideProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
}

export function useProfilesForGuide(limit = 200) {
  const { user, loading: authLoading } = useAuth();
  return useQuery<GuideProfile[]>({
    queryKey: ['profiles-for-guide', user?.id, limit],
    enabled: !authLoading && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('first_name')
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as GuideProfile[];
    },
  });
}
