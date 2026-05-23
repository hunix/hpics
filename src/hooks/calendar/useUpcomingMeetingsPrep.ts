import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { addDays } from 'date-fns';

export interface MeetingPrepRow {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  profileId: string;
  profileName: string;
}

export function useCachedMeetingBriefings() {
  const { user } = useAuth();
  return useQuery<Record<string, unknown>>({
    queryKey: ['meeting-briefings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('analysis_type', 'meeting_prep')
        .gte('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;

      const briefingMap: Record<string, unknown> = {};
      ((data ?? []) as Array<{ profile_id: string; result: unknown }>).forEach((b) => {
        briefingMap[b.profile_id] = b.result;
      });
      return briefingMap;
    },
  });
}

export function useUpcomingMeetingsPrep(days = 7, limit = 10) {
  const { user } = useAuth();
  return useQuery<MeetingPrepRow[]>({
    queryKey: ['upcoming-meetings-prep', user?.id, days, limit],
    enabled: !!user,
    queryFn: async () => {
      const now = new Date();
      const windowEnd = addDays(now, days);

      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          profile_id,
          profiles (id, first_name, last_name, avatar_url)
        `)
        .gte('event_date', now.toISOString())
        .lte('event_date', windowEnd.toISOString())
        .not('profile_id', 'is', null)
        .order('event_date', { ascending: true })
        .limit(limit);
      if (error) throw error;

      type Row = {
        id: string;
        title: string;
        event_date: string;
        profile_id: string;
        profiles: { first_name: string | null; last_name: string | null } | null;
      };
      return ((events ?? []) as unknown as Row[]).map((event) => ({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: new Date(event.event_date),
        profileId: event.profile_id,
        profileName: `${event.profiles?.first_name ?? ''} ${event.profiles?.last_name ?? ''}`.trim(),
      }));
    },
  });
}
