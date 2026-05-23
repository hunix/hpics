import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';

export interface MobileDashboardStats {
  contacts: number;
  favorites: number;
  upcomingEvents: number;
  pendingCaptures: number;
}

export interface DecayProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  last_contact_date: string | null;
  is_favorite: boolean | null;
}

export interface RecentProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
}

export function useMobileDashboardStats() {
  const { user } = useAuth();
  return useQuery<MobileDashboardStats>({
    queryKey: ['mobile-dashboard-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profilesRes, favoritesRes, eventsRes, capturesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_favorite', true).eq('is_active', true),
        supabase.from('events').select('id', { count: 'exact' })
          .eq('is_active', true)
          .gte('event_date', new Date().toISOString()),
        supabase.from('device_captures').select('id', { count: 'exact' })
          .eq('status', 'pending'),
      ]);
      return {
        contacts: profilesRes.count ?? 0,
        favorites: favoritesRes.count ?? 0,
        upcomingEvents: eventsRes.count ?? 0,
        pendingCaptures: capturesRes.count ?? 0,
      };
    },
  });
}

export function useMobileDecayContacts() {
  const { user } = useAuth();
  return useQuery<DecayProfile[]>({
    queryKey: ['mobile-decay-contacts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, last_contact_date, is_favorite')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('last_contact_date', { ascending: true, nullsFirst: true })
        .limit(10);

      return ((data ?? []) as DecayProfile[])
        .filter((p) => {
          if (!p.last_contact_date) return true;
          const days = differenceInDays(new Date(), new Date(p.last_contact_date));
          return p.is_favorite ? days > 30 : days > 60;
        })
        .slice(0, 4);
    },
  });
}

export function useMobileRecentContacts() {
  const { user } = useAuth();
  return useQuery<RecentProfile[]>({
    queryKey: ['mobile-recent-contacts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as RecentProfile[];
    },
  });
}
