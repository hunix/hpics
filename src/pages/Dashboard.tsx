import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Calendar, TrendingUp, Star, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const [profilesRes, communicationsRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('id, is_favorite', { count: 'exact' }),
        supabase.from('communications').select('id', { count: 'exact' }),
        supabase.from('events').select('id, event_date').eq('is_active', true).gte('event_date', new Date().toISOString()),
      ]);
      
      return {
        totalContacts: profilesRes.count ?? 0,
        favoriteContacts: profilesRes.data?.filter(p => p.is_favorite).length ?? 0,
        totalCommunications: communicationsRes.count ?? 0,
        upcomingEvents: eventsRes.data?.length ?? 0,
      };
    },
    enabled: !!user,
  });

  const { data: recentContacts } = useQuery({
    queryKey: ['recent-contacts', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, relationship_type, last_contact_date')
        .order('updated_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, event_type, event_date, profiles(first_name, last_name)')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const statCards = [
    { title: 'Total Contacts', value: stats?.totalContacts ?? 0, icon: Users, color: 'text-primary' },
    { title: 'Favorites', value: stats?.favoriteContacts ?? 0, icon: Star, color: 'text-yellow-500' },
    { title: 'Communications', value: stats?.totalCommunications ?? 0, icon: MessageSquare, color: 'text-blue-500' },
    { title: 'Upcoming Events', value: stats?.upcomingEvents ?? 0, icon: Calendar, color: 'text-green-500' },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Contacts
              </CardTitle>
              <CardDescription>People you've recently added or updated</CardDescription>
            </CardHeader>
            <CardContent>
              {recentContacts && recentContacts.length > 0 ? (
                <div className="space-y-3">
                  {recentContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {contact.first_name?.[0]}{contact.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {contact.relationship_type?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No contacts yet. Add your first contact to get started!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Important dates coming up</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No upcoming events. Add important dates to stay on top of relationships!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-1">Add Your Contacts</h4>
                <p className="text-sm text-muted-foreground">
                  Start by adding the people who matter most to you.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-1">Log Interactions</h4>
                <p className="text-sm text-muted-foreground">
                  Track calls, meetings, and messages to never forget a conversation.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-1">Set Reminders</h4>
                <p className="text-sm text-muted-foreground">
                  Never miss a birthday or important milestone again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
