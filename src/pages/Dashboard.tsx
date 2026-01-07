import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, Calendar, TrendingUp, Star, Clock, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, parseISO, setYear, getYear, isBefore, addYears } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { SortableDashlet } from '@/components/dashboard/SortableDashlet';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { DecayAlertWidget } from '@/components/dashboard/DecayAlertWidget';
import { FollowUpSuggestions } from '@/components/dashboard/FollowUpSuggestions';
import { RelationshipHealthWidget } from '@/components/dashboard/RelationshipHealthWidget';
import { WeeklySummaryWidget } from '@/components/dashboard/WeeklySummaryWidget';
import { IntroductionSuggestions } from '@/components/dashboard/IntroductionSuggestions';
import { AutoScheduleFollowups } from '@/components/dashboard/AutoScheduleFollowups';
import { NetworkGraph } from '@/components/network/NetworkGraph';
import { ContactGroupsWidget } from '@/components/dashboard/ContactGroupsWidget';
import { RelationshipScoreCard } from '@/components/dashboard/RelationshipScoreCard';
import { SecurityAlertsWidget } from '@/components/security/SecurityAlertsWidget';
import { IntelligenceInsightsWidget } from '@/components/intelligence/IntelligenceInsightsWidget';
import { DataQualityMonitor } from '@/components/intelligence/DataQualityMonitor';
import { ProactiveActionsWidget } from '@/components/intelligence/ProactiveActionsWidget';
import { LiveActivityFeed } from '@/components/intelligence/LiveActivityFeed';
import { AnomalyDetectionWidget } from '@/components/intelligence/AnomalyDetectionWidget';
import { RelationshipAnalytics } from '@/components/dashboard/RelationshipAnalytics';
import { AIContactGrouping } from '@/components/contacts/AIContactGrouping';
import { CalendarSyncStatus } from '@/components/dashboard/CalendarSyncStatus';
import type { DashletType } from '@/lib/dashletDefinitions';

export default function Dashboard() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { layout, isLoading: isLoadingLayout, reorderDashlets, toggleDashletVisibility } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const [profilesRes, communicationsRes, eventsRes, birthdaysRes] = await Promise.all([
        supabase.from('profiles').select('id, is_favorite', { count: 'exact' }),
        supabase.from('communications').select('id', { count: 'exact' }),
        supabase.from('events').select('id, event_date').eq('is_active', true).gte('event_date', new Date().toISOString()),
        supabase.from('contact_personal_info').select('date_of_birth').not('date_of_birth', 'is', null),
      ]);

      const now = new Date();
      const currentYear = getYear(now);
      const upcomingBirthdaysCount = (birthdaysRes.data ?? []).filter((row: any) => {
        const dob = parseISO(row.date_of_birth);
        let nextBirthday = setYear(dob, currentYear);
        if (isBefore(nextBirthday, now)) {
          nextBirthday = addYears(nextBirthday, 1);
        }
        return nextBirthday >= now;
      }).length;
      
      return {
        totalContacts: profilesRes.count ?? 0,
        favoriteContacts: profilesRes.data?.filter(p => p.is_favorite).length ?? 0,
        totalCommunications: communicationsRes.count ?? 0,
        upcomingEvents: (eventsRes.data?.length ?? 0) + upcomingBirthdaysCount,
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
      const now = new Date();
      const currentYear = getYear(now);

      const [eventsRes, birthdaysRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, event_type, event_date, profiles(first_name, last_name)')
          .eq('is_active', true)
          .gte('event_date', now.toISOString())
          .order('event_date', { ascending: true }),
        supabase
          .from('contact_personal_info')
          .select('id, date_of_birth, profile_id, profiles(first_name, last_name)')
          .not('date_of_birth', 'is', null),
      ]);

      const events = (eventsRes.data ?? []).map((e: any) => ({
        id: e.id,
        title: e.title,
        type: e.event_type,
        date: new Date(e.event_date),
        contactName: e.profiles ? `${e.profiles.first_name} ${e.profiles.last_name || ''}`.trim() : undefined,
      }));

      const birthdays = (birthdaysRes.data ?? []).map((info: any) => {
        const dob = parseISO(info.date_of_birth);
        let nextBirthday = setYear(dob, currentYear);
        if (isBefore(nextBirthday, now)) {
          nextBirthday = addYears(nextBirthday, 1);
        }
        const contactName = info.profiles ? `${info.profiles.first_name} ${info.profiles.last_name || ''}`.trim() : 'Unknown';
        const age = getYear(nextBirthday) - getYear(dob);

        return {
          id: `birthday-${info.id}`,
          title: `${contactName}'s Birthday (${age})`,
          type: 'birthday',
          date: nextBirthday,
          contactName,
        };
      });

      return [...events, ...birthdays]
        .filter((x) => x.date >= now)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 5)
        .map((x) => ({
          id: x.id,
          title: x.title,
          event_type: x.type,
          event_date: x.date.toISOString(),
        }));
    },
    enabled: !!user,
  });

  const statCards = [
    { title: 'Total Contacts', value: stats?.totalContacts ?? 0, icon: Users, color: 'text-primary' },
    { title: 'Favorites', value: stats?.favoriteContacts ?? 0, icon: Star, color: 'text-yellow-500' },
    { title: 'Communications', value: stats?.totalCommunications ?? 0, icon: MessageSquare, color: 'text-blue-500' },
    { title: 'Upcoming Events', value: stats?.upcomingEvents ?? 0, icon: Calendar, color: 'text-green-500' },
  ];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderDashlets(active.id as string, over.id as string);
    }
  };

  const renderDashlet = (type: DashletType, id: string) => {
    switch (type) {
      case 'stats':
        return (
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
        );
      case 'recent-contacts':
        return (
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
                <p className="text-muted-foreground text-center py-4">No contacts yet.</p>
              )}
            </CardContent>
          </Card>
        );
      case 'upcoming-events':
        return (
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
                <p className="text-muted-foreground text-center py-4">No upcoming events.</p>
              )}
            </CardContent>
          </Card>
        );
      case 'decay-alert':
        return <DecayAlertWidget />;
      case 'relationship-health':
        return <RelationshipHealthWidget />;
      case 'weekly-summary':
        return <WeeklySummaryWidget />;
      case 'introduction-suggestions':
        return <IntroductionSuggestions />;
      case 'followup-suggestions':
        return <FollowUpSuggestions />;
      case 'auto-schedule':
        return <AutoScheduleFollowups />;
      case 'contact-groups':
        return <ContactGroupsWidget />;
      case 'relationship-scores':
        return <RelationshipScoreCard />;
      case 'network-graph':
        return <NetworkGraph />;
      case 'quick-tips':
        return (
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
        );
      case 'security-alerts':
        return <SecurityAlertsWidget />;
      case 'intelligence-insights':
        return <IntelligenceInsightsWidget />;
      case 'data-quality':
        return <DataQualityMonitor />;
      case 'proactive-actions':
        return <ProactiveActionsWidget />;
      case 'live-activity-feed':
        return <LiveActivityFeed />;
      case 'anomaly-detection':
        return <AnomalyDetectionWidget />;
      case 'relationship-analytics':
        return <RelationshipAnalytics />;
      case 'ai-contact-grouping':
        return <AIContactGrouping />;
      case 'calendar-sync-status':
        return <CalendarSyncStatus />;
      default:
        return null;
    }
  };

  if (isLoadingLayout) {
    return (
      <AppLayout title="Dashboard">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  const visibleDashlets = layout?.filter(d => d.visible) || [];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Dashboard Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Done Editing' : 'Edit Layout'}
            </Button>
          </div>
          <DashboardCustomizer />
        </div>

        {isEditing && (
          <div className="p-3 bg-primary/10 rounded-lg text-sm text-primary">
            <Edit3 className="inline h-4 w-4 mr-2" />
            Drag widgets to reorder. Click X to hide. Use Customize to show hidden widgets.
          </div>
        )}

        {/* Dashlets */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleDashlets.map(d => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {visibleDashlets.map((dashlet) => (
                <SortableDashlet
                  key={dashlet.id}
                  id={dashlet.id}
                  title={dashlet.title}
                  isEditing={isEditing}
                  onRemove={() => toggleDashletVisibility(dashlet.id)}
                >
                  {renderDashlet(dashlet.type, dashlet.id)}
                </SortableDashlet>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {visibleDashlets.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No widgets visible. Click "Customize" to add widgets to your dashboard.
              </p>
              <DashboardCustomizer />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
