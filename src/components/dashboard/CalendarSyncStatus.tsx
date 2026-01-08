import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow, addMinutes, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function CalendarSyncStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: syncStatus, isLoading } = useQuery({
    queryKey: ['calendar-sync-status', user?.id],
    queryFn: async () => {
      // Fetch Google Calendar config
      const { data: googleConfig } = await supabase
        .from('google_calendar_config' as any)
        .select('updated_at, auto_sync_enabled, sync_interval_minutes, calendar_ids')
        .eq('user_id', user!.id)
        .maybeSingle() as any;

      // Fetch Outlook config
      const { data: outlookConfig } = await supabase
        .from('oauth_tokens' as any)
        .select('updated_at, auto_sync_enabled, sync_interval_minutes')
        .eq('user_id', user!.id)
        .eq('provider', 'outlook')
        .maybeSingle() as any;

      const connectedCalendars = [];
      
      if (googleConfig) {
        connectedCalendars.push({
          provider: 'Google Calendar',
          lastSync: googleConfig.updated_at,
          autoSync: googleConfig.auto_sync_enabled ?? true,
          interval: googleConfig.sync_interval_minutes || 60,
          calendarCount: googleConfig.calendar_ids?.length || 1,
        });
      }

      if (outlookConfig) {
        connectedCalendars.push({
          provider: 'Outlook Calendar',
          lastSync: outlookConfig.updated_at,
          autoSync: outlookConfig.auto_sync_enabled ?? true,
          interval: outlookConfig.sync_interval_minutes || 60,
          calendarCount: 1,
        });
      }

      return {
        calendars: connectedCalendars,
        totalConnected: connectedCalendars.length,
      };
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus || syncStatus.totalConnected === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">No calendars connected</p>
            <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
              Connect Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar Sync
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {syncStatus.totalConnected} connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {syncStatus.calendars.map((cal) => {
          const lastSyncDate = cal.lastSync ? new Date(cal.lastSync) : null;
          const nextSync = lastSyncDate ? addMinutes(lastSyncDate, cal.interval) : null;
          const isOverdue = nextSync && new Date() > nextSync;

          return (
            <div 
              key={cal.provider} 
              className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${cal.autoSync ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div>
                  <div className="text-sm font-medium">{cal.provider}</div>
                  <div className="text-xs text-muted-foreground">
                    {lastSyncDate ? (
                      <>
                        Last sync: {formatDistanceToNow(lastSyncDate, { addSuffix: true })}
                      </>
                    ) : (
                      'Never synced'
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cal.autoSync ? (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Every {cal.interval}m
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-yellow-600">
                    Manual
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => navigate('/settings')}
        >
          Manage Calendar Settings
        </Button>
      </CardContent>
    </Card>
  );
}
