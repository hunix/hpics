import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PickerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
  is_favorite?: boolean | null;
  updated_at?: string | null;
  full_name: string;
}

/**
 * Shared "all my active contacts, favorites first" picker query. Multiple
 * pages (CrossModal, Communications, etc.) need the same list — keeping it
 * in one hook ensures one cache entry and one query shape.
 */
export function useProfilePicker(opts: { limit?: number; queryKeyHint?: string } = {}) {
  const { user } = useAuth();
  const limit = opts.limit ?? 200;
  return useQuery<PickerProfile[]>({
    queryKey: ['profile-picker', user?.id, opts.queryKeyHint ?? 'default', limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, is_favorite, updated_at')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('first_name')
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(p => ({
        ...p,
        full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      }));
    },
  });
}
