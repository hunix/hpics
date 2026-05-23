import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  RefreshCw, 
  Users, 
  Clock,
  MapPin,
  Video,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { invokeFunction } from '@/lib/api';
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: any;
  matched_profile_id?: string;
  profiles?: { first_name: string; last_name: string };
}

interface CalendarInsight {
  eventId: string;
  prepNotes?: string;
  suggestedTopics?: string[];
  relationshipContext?: string;
}

export function CalendarInsightsWidget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow' | 'week'>('today');

  const getDateRange = () => {
    const now = new Date();
    switch (selectedDay) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'tomorrow':
        return { start: startOfDay(addDays(now, 1)), end: endOfDay(addDays(now, 1)) };
      case 'week':
        return { start: startOfDay(now), end: endOfDay(addDays(now, 7)) };
    }
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events-insights', user?.id, selectedDay],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
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
        .eq('user_id', user?.id ?? '')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });

  const { data: insights } = useQuery({
    queryKey: ['calendar-insights', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', user?.id ?? '')
        .eq('analysis_type', 'meeting_prep')
        .order('generated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const insightMap = new Map<string, CalendarInsight>();
      data?.forEach(a => {
        const result = a.result as any;
        if (result?.eventId) {
          insightMap.set(result.eventId, result);
        }
      });
      return insightMap;
    },
    enabled: !!user,
  });

  const generatePrepMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await invokeFunction('generate-meeting-prep', { eventId }, { headers: { Authorization: `Bearer ${session.session.access_token}` } });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-insights'] });
      toast.success('Meeting prep generated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate prep');
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await invokeFunction('sync-google-calendar', {}, { headers: { Authorization: `Bearer ${session.session.access_token}` } });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-insights'] });
      toast.success('Calendar synced');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync calendar');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const eventsWithContacts = events?.filter(e => e.matched_profile_id) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendar Intelligence
          </CardTitle>
          <CardDescription>AI-powered meeting preparation</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Day Filter */}
        <div className="flex gap-2">
          {(['today', 'tomorrow', 'week'] as const).map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDay(day)}
            >
              {day === 'today' ? 'Today' : day === 'tomorrow' ? 'Tomorrow' : 'Week'}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-lg font-bold">{events?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <div className="text-lg font-bold text-primary">{eventsWithContacts.length}</div>
            <div className="text-xs text-muted-foreground">With Contacts</div>
          </div>
        </div>

        {/* Events List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {events?.map((event) => {
              const insight = insights?.get(event.id);
              const startTime = new Date(event.start_time);
              const contactName = event.profiles 
                ? `${event.profiles.first_name} ${event.profiles.last_name}`.trim()
                : null;

              return (
                <div key={event.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {format(startTime, 'h:mm a')}
                        {event.location && (
                          <>
                            <MapPin className="h-3 w-3 ml-2" />
                            {event.location.slice(0, 20)}
                          </>
                        )}
                      </div>
                    </div>
                    {contactName && (
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {contactName}
                      </Badge>
                    )}
                  </div>

                  {insight ? (
                    <div className="mt-2 p-2 rounded bg-muted/50 text-xs space-y-1">
                      {insight.prepNotes && (
                        <p className="text-muted-foreground">{insight.prepNotes}</p>
                      )}
                      {insight.suggestedTopics && insight.suggestedTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {insight.suggestedTopics.map((topic, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : event.matched_profile_id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => generatePrepMutation.mutate(event.id)}
                      disabled={generatePrepMutation.isPending}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate Prep
                    </Button>
                  ) : null}
                </div>
              );
            })}

            {(!events || events.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No events {selectedDay === 'today' ? 'today' : selectedDay === 'tomorrow' ? 'tomorrow' : 'this week'}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
