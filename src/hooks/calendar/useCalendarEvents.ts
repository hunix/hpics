import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { parseISO, setYear, getYear } from 'date-fns';

export type CalendarEventType =
  | 'birthday'
  | 'anniversary'
  | 'meeting'
  | 'follow_up'
  | 'milestone'
  | 'other'
  | 'synced';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: CalendarEventType;
  contactName?: string;
  contactId?: string;
  source?: 'local' | 'google' | 'outlook';
}

interface ProfileJoin { first_name: string | null; last_name: string | null }
type WithProfiles<T> = T & { profiles?: ProfileJoin | null };

export function useGoogleCalendarConfig() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['google-calendar-config', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_calendar_config')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useOutlookToken() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['outlook-token', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('provider', 'outlook')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCalendarLocalEvents() {
  const { user } = useAuth();
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_type, event_date, profile_id, profiles(first_name, last_name)')
        .eq('is_active', true);
      if (error) throw error;
      type Row = WithProfiles<{ id: string; title: string; event_type: string; event_date: string; profile_id: string | null }>;
      return ((data ?? []) as unknown as Row[]).map((event) => ({
        id: event.id,
        title: event.title,
        date: parseISO(event.event_date),
        type: event.event_type as CalendarEventType,
        contactName: event.profiles
          ? `${event.profiles.first_name ?? ''} ${event.profiles.last_name ?? ''}`.trim()
          : undefined,
        contactId: event.profile_id ?? undefined,
        source: 'local',
      }));
    },
  });
}

export function useCalendarSyncedEvents() {
  const { user } = useAuth();
  return useQuery<CalendarEvent[]>({
    queryKey: ['synced-calendar-events', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('synced_calendar_events')
        .select('*, profiles(first_name, last_name)');
      if (error) throw error;
      type Row = WithProfiles<{ id: string; title: string; start_time: string; matched_profile_id: string | null; source: string }>;
      return ((data ?? []) as unknown as Row[]).map((event) => ({
        id: event.id,
        title: event.title,
        date: parseISO(event.start_time),
        type: 'synced',
        contactName: event.profiles
          ? `${event.profiles.first_name ?? ''} ${event.profiles.last_name ?? ''}`.trim()
          : undefined,
        contactId: event.matched_profile_id ?? undefined,
        source: event.source as 'google' | 'outlook',
      }));
    },
  });
}

export function useCalendarBirthdays() {
  const { user } = useAuth();
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar-birthdays', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_personal_info')
        .select('id, date_of_birth, profile_id, profiles(first_name, last_name)')
        .not('date_of_birth', 'is', null);
      if (error) throw error;

      type Row = WithProfiles<{ id: string; date_of_birth: string; profile_id: string | null }>;
      const currentYear = getYear(new Date());

      return ((data ?? []) as unknown as Row[]).map((info) => {
        const dob = parseISO(info.date_of_birth);
        const birthdayThisYear = setYear(dob, currentYear);
        const contactName = info.profiles
          ? `${info.profiles.first_name ?? ''} ${info.profiles.last_name ?? ''}`.trim()
          : 'Unknown';
        const age = currentYear - getYear(dob);

        return {
          id: `birthday-${info.id}`,
          title: `🎂 ${contactName}'s Birthday (${age})`,
          date: birthdayThisYear,
          type: 'birthday',
          contactName,
          contactId: info.profile_id ?? undefined,
          source: 'local',
        };
      });
    },
  });
}
