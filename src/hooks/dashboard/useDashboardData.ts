import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { parseISO, setYear, getYear, isBefore, addYears } from 'date-fns';

export interface DashboardStatsData {
  totalContacts: number;
  favoriteContacts: number;
  totalCommunications: number;
  upcomingEvents: number;
}

export interface RecentContact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  relationship_type: string | null;
  last_contact_date: string | null;
}

export interface DashboardUpcomingEvent {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
}

interface ProfileJoin {
  first_name: string | null;
  last_name: string | null;
}

export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery<DashboardStatsData>({
    queryKey: ['dashboard-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [totalRes, favoritesRes, communicationsRes, eventsRes, birthdaysRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_favorite', true),
        supabase.from('communications').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('id, event_date').eq('is_active', true).gte('event_date', new Date().toISOString()),
        supabase.from('contact_personal_info').select('date_of_birth').not('date_of_birth', 'is', null),
      ]);

      const now = new Date();
      const currentYear = getYear(now);
      const upcomingBirthdaysCount = (birthdaysRes.data ?? []).filter((row: { date_of_birth: string | null }) => {
        if (!row.date_of_birth) return false;
        const dob = parseISO(row.date_of_birth);
        let nextBirthday = setYear(dob, currentYear);
        if (isBefore(nextBirthday, now)) {
          nextBirthday = addYears(nextBirthday, 1);
        }
        return nextBirthday >= now;
      }).length;

      return {
        totalContacts: totalRes.count ?? 0,
        favoriteContacts: favoritesRes.count ?? 0,
        totalCommunications: communicationsRes.count ?? 0,
        upcomingEvents: (eventsRes.data?.length ?? 0) + upcomingBirthdaysCount,
      };
    },
  });
}

export function useRecentContacts(limit = 5) {
  const { user } = useAuth();
  return useQuery<RecentContact[]>({
    queryKey: ['recent-contacts', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, relationship_type, last_contact_date')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as RecentContact[];
    },
  });
}

export function useUpcomingEventsForDashboard(limit = 5) {
  const { user } = useAuth();
  return useQuery<DashboardUpcomingEvent[]>({
    queryKey: ['upcoming-events', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const now = new Date();
      const currentYear = getYear(now);

      const [eventsRes, birthdaysRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, event_type, event_date, profiles(first_name, last_name)')
          .eq('is_active', true)
          .gte('event_date', now.toISOString())
          .order('event_date', { ascending: true }),
        supabase
          .from('contact_personal_info')
          .select('id, date_of_birth, profile_id, profiles!inner(first_name, last_name, is_active)')
          .eq('profiles.is_active', true)
          .not('date_of_birth', 'is', null),
      ]);

      type EventRow = { id: string; title: string; event_type: string; event_date: string; profiles?: ProfileJoin | null };
      type BirthdayRow = { id: string; date_of_birth: string; profile_id: string; profiles?: ProfileJoin | null };

      const events = ((eventsRes.data ?? []) as unknown as EventRow[]).map((e) => ({
        id: e.id,
        title: e.title,
        type: e.event_type,
        date: new Date(e.event_date),
      }));

      const birthdays = ((birthdaysRes.data ?? []) as unknown as BirthdayRow[]).map((info) => {
        const dob = parseISO(info.date_of_birth);
        let nextBirthday = setYear(dob, currentYear);
        if (isBefore(nextBirthday, now)) {
          nextBirthday = addYears(nextBirthday, 1);
        }
        const contactName = info.profiles
          ? `${info.profiles.first_name ?? ''} ${info.profiles.last_name ?? ''}`.trim()
          : 'Unknown';
        const age = getYear(nextBirthday) - getYear(dob);

        return {
          id: `birthday-${info.id}`,
          title: `${contactName}'s Birthday (${age})`,
          type: 'birthday',
          date: nextBirthday,
        };
      });

      return [...events, ...birthdays]
        .filter((x) => x.date >= now)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, limit)
        .map((x) => ({
          id: x.id,
          title: x.title,
          event_type: x.type,
          event_date: x.date.toISOString(),
        }));
    },
  });
}
