import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, Calendar, Star, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, parseISO, setYear, getYear, isBefore, addYears } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { SortableDashlet } from '@/components/dashboard/SortableDashlet';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { DashboardPresets } from '@/components/dashboard/DashboardPresets';
import { renderDashlet, type DashletContext } from '@/lib/dashletRegistry';
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export default function Dashboard() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { layout, isLoading: isLoadingLayout, reorderDashlets, toggleDashletVisibility } = useDashboardLayout();
  const { deviceType } = useDeviceDetection();
  const isMobile = deviceType === 'mobile';

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

  // Build context for dashlet rendering
  const dashletContext: DashletContext = {
    statCards: [
      { title: 'Total Contacts', value: stats?.totalContacts ?? 0, icon: Users, color: 'text-primary' },
      { title: 'Favorites', value: stats?.favoriteContacts ?? 0, icon: Star, color: 'text-yellow-500' },
      { title: 'Communications', value: stats?.totalCommunications ?? 0, icon: MessageSquare, color: 'text-blue-500' },
      { title: 'Upcoming Events', value: stats?.upcomingEvents ?? 0, icon: Calendar, color: 'text-green-500' },
    ],
    recentContacts,
    upcomingEvents,
    formatDistanceToNow,
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderDashlets(active.id as string, over.id as string);
    }
  };

  // Show mobile dashboard on mobile devices
  if (isMobile) {
    return (
      <AppLayout title="Dashboard">
        <MobileDashboard />
      </AppLayout>
    );
  }

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
          <div className="flex items-center gap-2">
            <DashboardPresets />
            <DashboardCustomizer />
          </div>
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
                  {renderDashlet(dashlet.type, dashletContext)}
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
