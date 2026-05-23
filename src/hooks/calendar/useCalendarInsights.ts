import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CalendarInsightEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: unknown;
  matched_profile_id?: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

export interface CalendarInsight {
  eventId: string;
  prepNotes?: string;
  suggestedTopics?: string[];
  relationshipContext?: string;
}

export function useCalendarInsightsEvents(start: Date, end: Date, selectedDay: string) {
  const { user } = useAuth();
  return useQuery<CalendarInsightEvent[]>({
    queryKey: ['calendar-events-insights', user?.id, selectedDay],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('synced_calendar_events')
        .select(`
          id,
          title,
          start_time,
          end_time,
          location,
          attendees,
          matched_profile_id,
          profiles:matched_profile_id (first_name, last_name)
        `)
        .eq('user_id', user!.id)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as unknown) as CalendarInsightEvent[];
    },
  });
}

export function useCalendarInsightsMap() {
  const { user } = useAuth();
  return useQuery<Map<string, CalendarInsight>>({
    queryKey: ['calendar-insights', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', user!.id)
        .eq('analysis_type', 'meeting_prep')
        .order('generated_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      const insightMap = new Map<string, CalendarInsight>();
      (data ?? []).forEach((a) => {
        const result = a.result as CalendarInsight | null;
        if (result?.eventId) {
          insightMap.set(result.eventId, result);
        }
      });
      return insightMap;
    },
  });
}
