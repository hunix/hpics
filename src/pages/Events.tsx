import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Calendar, Cake, Heart, Star, Bell, Clock, Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EventDialog } from '@/components/events/EventDialog';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import type { Event as BaseEvent } from '@/types/database-helpers';

type Event = BaseEvent & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export default function Events() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles(first_name, last_name)')
        .eq('is_active', true)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Cake className="h-4 w-4" />;
      case 'anniversary': return <Heart className="h-4 w-4" />;
      case 'milestone': return <Star className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'follow_up': return <Bell className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const eventColors: Record<string, string> = {
    birthday: 'bg-pink-100 text-pink-800',
    anniversary: 'bg-red-100 text-red-800',
    milestone: 'bg-yellow-100 text-yellow-800',
    meeting: 'bg-blue-100 text-blue-800',
    follow_up: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const upcomingEvents = events?.filter(e => !isPast(new Date(e.event_date))) ?? [];
  const pastEvents = events?.filter(e => isPast(new Date(e.event_date))) ?? [];

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${eventColors[event.event_type]}`}>
            {getEventIcon(event.event_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{event.title}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (confirm('Delete this event?')) {
                    deleteMutation.mutate(event.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            {event.profiles && (
              <p className="text-sm text-muted-foreground">
                {event.profiles.first_name} {event.profiles.last_name}
              </p>
            )}
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary" className={eventColors[event.event_type]}>
                {event.event_type.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(event.event_date), 'PPP')}
              </span>
              {event.reminder_frequency !== 'once' && (
                <Badge variant="outline" className="text-xs">
                  {event.reminder_frequency}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout title="Events & Reminders">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Never miss an important date or follow-up
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No upcoming events
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-4">
              {pastEvents.length > 0 ? (
                pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No past events
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add birthdays, anniversaries, and reminders to stay connected.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <EventDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />
    </AppLayout>
  );
}
