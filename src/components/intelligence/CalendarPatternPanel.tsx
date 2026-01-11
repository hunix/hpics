import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Users, TrendingUp, AlertCircle } from "lucide-react";
import { format, startOfWeek, eachDayOfInterval, subDays, getHours } from "date-fns";

interface MeetingPattern {
  dayOfWeek: number;
  hour: number;
  count: number;
}

interface ContactMeetingStats {
  profileId: string;
  name: string;
  meetingCount: number;
  totalMinutes: number;
  avgDuration: number;
  lastMeeting: Date | null;
}

export function CalendarPatternPanel() {
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendar-patterns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      // Use synced_calendar_events which has start_time
      const { data: events } = await supabase
        .from('synced_calendar_events')
        .select(`
          id, title, start_time, end_time,
          profiles(id, first_name, last_name)
        `)
        .eq('user_id', user.id)
        .gte('start_time', thirtyDaysAgo)
        .order('start_time', { ascending: false });

      return events || [];
    }
  });

  const patterns = useMemo(() => {
    if (!eventsData) return null;

    // Meeting time heatmap
    const timePatterns: MeetingPattern[] = [];
    const dayHourCounts: Record<string, number> = {};
    
    eventsData.forEach(event => {
      const date = new Date(event.start_time);
      const day = date.getDay();
      const hour = getHours(date);
      const key = `${day}-${hour}`;
      dayHourCounts[key] = (dayHourCounts[key] || 0) + 1;
    });

    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour < 19; hour++) {
        timePatterns.push({
          dayOfWeek: day,
          hour,
          count: dayHourCounts[`${day}-${hour}`] || 0
        });
      }
    }

    // Contact meeting stats
    const contactStats: Record<string, ContactMeetingStats> = {};
    
    eventsData.forEach(event => {
      const profile = event.profiles as any;
      if (!profile) return;
      
      const duration = (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000;
      
      if (!contactStats[profile.id]) {
        contactStats[profile.id] = {
          profileId: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          meetingCount: 0,
          totalMinutes: 0,
          avgDuration: 0,
          lastMeeting: null
        };
      }
      
      contactStats[profile.id].meetingCount++;
      contactStats[profile.id].totalMinutes += duration;
      
      const eventDate = new Date(event.start_time);
      if (!contactStats[profile.id].lastMeeting || eventDate > contactStats[profile.id].lastMeeting!) {
        contactStats[profile.id].lastMeeting = eventDate;
      }
    });

    Object.values(contactStats).forEach(stat => {
      stat.avgDuration = Math.round(stat.totalMinutes / stat.meetingCount);
    });

    // Summary stats
    const totalMeetings = eventsData.length;
    const avgPerWeek = Math.round(totalMeetings / 4.3);
    const busiestDay = Object.entries(
      eventsData.reduce((acc, e) => {
        const day = new Date(e.start_time).getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    ).sort((a, b) => b[1] - a[1])[0];

    const neglectedContacts = Object.values(contactStats)
      .filter(s => s.lastMeeting && (Date.now() - s.lastMeeting.getTime()) > 30 * 24 * 60 * 60 * 1000)
      .sort((a, b) => (a.lastMeeting?.getTime() || 0) - (b.lastMeeting?.getTime() || 0));

    return {
      timePatterns,
      contactStats: Object.values(contactStats).sort((a, b) => b.meetingCount - a.meetingCount),
      totalMeetings,
      avgPerWeek,
      busiestDay: busiestDay ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(busiestDay[0])] : 'N/A',
      neglectedContacts
    };
  }, [eventsData]);

  const getHeatmapColor = (count: number, max: number) => {
    if (count === 0) return 'bg-muted/30';
    const intensity = Math.min(count / Math.max(max, 1), 1);
    if (intensity > 0.7) return 'bg-primary';
    if (intensity > 0.4) return 'bg-primary/60';
    return 'bg-primary/30';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxCount = patterns ? Math.max(...patterns.timePatterns.map(p => p.count)) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Patterns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{patterns?.totalMeetings || 0}</div>
            <div className="text-xs text-muted-foreground">Meetings (30d)</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{patterns?.avgPerWeek || 0}</div>
            <div className="text-xs text-muted-foreground">Avg/Week</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{patterns?.busiestDay}</div>
            <div className="text-xs text-muted-foreground">Busiest Day</div>
          </div>
        </div>

        {/* Time Heatmap */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Meeting Time Heatmap
          </h4>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: 'auto repeat(11, 1fr)' }}>
              <div />
              {Array.from({ length: 11 }, (_, i) => (
                <div key={i} className="text-xs text-muted-foreground text-center w-6">
                  {i + 8}
                </div>
              ))}
              {dayLabels.map((day, dayIdx) => (
                <>
                  <div key={`label-${dayIdx}`} className="text-xs text-muted-foreground pr-2">
                    {day}
                  </div>
                  {Array.from({ length: 11 }, (_, hourIdx) => {
                    const pattern = patterns?.timePatterns.find(
                      p => p.dayOfWeek === dayIdx && p.hour === hourIdx + 8
                    );
                    return (
                      <div
                        key={`${dayIdx}-${hourIdx}`}
                        className={`w-6 h-6 rounded-sm ${getHeatmapColor(pattern?.count || 0, maxCount)}`}
                        title={`${day} ${hourIdx + 8}:00 - ${pattern?.count || 0} meetings`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Top Contacts */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Top Meeting Contacts
          </h4>
          <ScrollArea className="h-[120px]">
            <div className="space-y-2">
              {patterns?.contactStats.slice(0, 5).map(contact => (
                <div
                  key={contact.profileId}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">{contact.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {contact.meetingCount} meetings · avg {contact.avgDuration}min
                    </div>
                  </div>
                  <Badge variant="secondary">{contact.meetingCount}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Neglected Relationships */}
        {patterns?.neglectedContacts && patterns.neglectedContacts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              Needs Attention
            </h4>
            <div className="space-y-1">
              {patterns.neglectedContacts.slice(0, 3).map(contact => (
                <div
                  key={contact.profileId}
                  className="flex items-center justify-between p-2 bg-yellow-500/10 rounded text-sm"
                >
                  <span className="truncate">{contact.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {contact.lastMeeting ? format(contact.lastMeeting, 'MMM d') : 'Never'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
