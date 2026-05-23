import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConnectedCalendar {
  provider: string;
  lastSync: string | null;
  autoSync: boolean;
  interval: number;
  calendarCount: number;
}

export interface CalendarSyncStatusData {
  calendars: ConnectedCalendar[];
  totalConnected: number;
}

export function useCalendarSyncStatus() {
  const { user } = useAuth();
  return useQuery<CalendarSyncStatusData>({
    queryKey: ['calendar-sync-status', user?.id],
    enabled: !!user,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data: googleConfig } = await supabase
        .from('google_calendar_config')
        .select('updated_at, auto_sync_enabled, sync_interval_minutes, calendar_ids')
        .eq('user_id', user!.id)
        .maybeSingle();

      const { data: outlookConfig } = await supabase
        .from('oauth_tokens')
        .select('updated_at, auto_sync_enabled, sync_interval_minutes')
        .eq('user_id', user!.id)
        .eq('provider', 'outlook')
        .maybeSingle();

      const connectedCalendars: ConnectedCalendar[] = [];

      if (googleConfig) {
        const gc = googleConfig as unknown as {
          updated_at: string | null;
          auto_sync_enabled: boolean | null;
          sync_interval_minutes: number | null;
          calendar_ids: string[] | null;
        };
        connectedCalendars.push({
          provider: 'Google Calendar',
          lastSync: gc.updated_at,
          autoSync: gc.auto_sync_enabled ?? true,
          interval: gc.sync_interval_minutes ?? 60,
          calendarCount: gc.calendar_ids?.length ?? 1,
        });
      }

      if (outlookConfig) {
        const oc = outlookConfig as unknown as {
          updated_at: string | null;
          auto_sync_enabled: boolean | null;
          sync_interval_minutes: number | null;
        };
        connectedCalendars.push({
          provider: 'Outlook Calendar',
          lastSync: oc.updated_at,
          autoSync: oc.auto_sync_enabled ?? true,
          interval: oc.sync_interval_minutes ?? 60,
          calendarCount: 1,
        });
      }

      return {
        calendars: connectedCalendars,
        totalConnected: connectedCalendars.length,
      };
    },
  });
}
