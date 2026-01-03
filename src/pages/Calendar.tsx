import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Cake, Users, Bell, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, parseISO, isWithinInterval } from 'date-fns';

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: 'birthday' | 'anniversary' | 'meeting' | 'follow_up' | 'milestone' | 'other';
  contactName?: string;
  contactId?: string;
};

const eventTypeColors: Record<string, string> = {
  birthday: 'bg-pink-500',
  anniversary: 'bg-purple-500',
  meeting: 'bg-blue-500',
  follow_up: 'bg-orange-500',
  milestone: 'bg-green-500',
  other: 'bg-gray-500',
};

const eventTypeIcons: Record<string, React.ReactNode> = {
  birthday: <Cake className="h-3 w-3" />,
  anniversary: <Users className="h-3 w-3" />,
  meeting: <CalendarIcon className="h-3 w-3" />,
  follow_up: <Phone className="h-3 w-3" />,
  milestone: <Bell className="h-3 w-3" />,
  other: <CalendarIcon className="h-3 w-3" />,
};

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, event_type, event_date, profile_id, profiles(first_name, last_name)')
        .eq('is_active', true);
      
      return (data ?? []).map((event: any) => ({
        id: event.id,
        title: event.title,
        date: parseISO(event.event_date),
        type: event.event_type as CalendarEvent['type'],
        contactName: event.profiles ? `${event.profiles.first_name} ${event.profiles.last_name || ''}`.trim() : undefined,
        contactId: event.profile_id,
      }));
    },
    enabled: !!user,
  });

  const navigatePrev = () => {
    setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const navigateNext = () => {
    setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <div key={dayName} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {dayName}
          </div>
        ))}
        {days.map((dayItem, index) => {
          const dayEvents = getEventsForDate(dayItem);
          const isCurrentMonth = isSameMonth(dayItem, currentDate);
          const isToday = isSameDay(dayItem, new Date());

          return (
            <div
              key={index}
              className={`min-h-[100px] p-1 border rounded-md ${
                isCurrentMonth ? 'bg-card' : 'bg-muted/30'
              } ${isToday ? 'ring-2 ring-primary' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? '' : 'text-muted-foreground'
              } ${isToday ? 'text-primary' : ''}`}>
                {format(dayItem, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded text-white truncate flex items-center gap-1 ${eventTypeColors[event.type]}`}
                    title={`${event.title}${event.contactName ? ` - ${event.contactName}` : ''}`}
                  >
                    {eventTypeIcons[event.type]}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((dayItem, index) => {
          const dayEvents = getEventsForDate(dayItem);
          const isToday = isSameDay(dayItem, new Date());

          return (
            <div key={index} className={`min-h-[300px] border rounded-lg p-2 ${isToday ? 'ring-2 ring-primary' : ''}`}>
              <div className={`text-center mb-2 ${isToday ? 'text-primary' : ''}`}>
                <div className="text-sm text-muted-foreground">{format(dayItem, 'EEE')}</div>
                <div className="text-xl font-bold">{format(dayItem, 'd')}</div>
              </div>
              <div className="space-y-2">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-2 rounded text-white text-sm ${eventTypeColors[event.type]}`}
                  >
                    <div className="flex items-center gap-1 font-medium">
                      {eventTypeIcons[event.type]}
                      <span className="truncate">{event.title}</span>
                    </div>
                    {event.contactName && (
                      <div className="text-xs opacity-80 truncate">{event.contactName}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const upcomingEvents = events
    .filter(e => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);

  return (
    <AppLayout title="Calendar">
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {view === 'month' 
                      ? format(currentDate, 'MMMM yyyy')
                      : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
                    }
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={navigatePrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={navigateNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Tabs value={view} onValueChange={(v) => setView(v as 'month' | 'week')}>
                  <TabsList>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {view === 'month' ? renderMonthView() : renderWeekView()}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className={`p-2 rounded-full text-white ${eventTypeColors[event.type]}`}>
                          {eventTypeIcons[event.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          {event.contactName && (
                            <p className="text-xs text-muted-foreground">{event.contactName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(event.date, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No upcoming events
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(eventTypeColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
