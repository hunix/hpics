/**
 * @fileoverview Dashboard Page
 * Main dashboard with customizable widgets using the design system
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Users, MessageSquare, Calendar, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, parseISO, setYear, getYear, isBefore, addYears } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { SortableDashlet } from '@/components/dashboard/SortableDashlet';
import { renderDashlet, type DashletContext } from '@/lib/dashletRegistry';
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// Design system components
import { LoadingState } from '@/components/shared/LoadingState';
import { DashboardStatsGrid, type DashboardStat } from '@/components/dashboard/DashboardStatsGrid';
import { DashboardHeader, DashboardEditBanner } from '@/components/dashboard/DashboardHeader';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';

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
        supabase.from('profiles').select('id, is_favorite', { count: 'exact' }).eq('is_active', true),
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
        totalContacts: profilesRes.data?.length ?? 0,
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
        .eq('is_active', true)
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
          .select('id, date_of_birth, profile_id, profiles!inner(first_name, last_name, is_active)')
          .eq('profiles.is_active', true)
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

  // Build stat cards data
  const statCards: DashboardStat[] = [
    { title: 'Active Contacts', value: stats?.totalContacts ?? 0, icon: Users, color: 'primary', href: '/contacts' },
    { title: 'Favorites', value: stats?.favoriteContacts ?? 0, icon: Star, color: 'yellow-500', href: '/contacts?filter=favorites' },
    { title: 'Communications', value: stats?.totalCommunications ?? 0, icon: MessageSquare, color: 'blue-500', href: '/communications' },
    { title: 'Upcoming Events', value: stats?.upcomingEvents ?? 0, icon: Calendar, color: 'green-500', href: '/calendar' },
  ];

  // Build context for dashlet rendering
  const dashletContext: DashletContext = {
    statCards: statCards.map(s => ({ ...s, color: `text-${s.color}` })),
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
        <LoadingState 
          message="Loading your dashboard..."
          className="min-h-[400px]"
        />
      </AppLayout>
    );
  }

  const visibleDashlets = layout?.filter(d => d.visible) || [];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Dashboard Header Controls */}
        <DashboardHeader 
          isEditing={isEditing} 
          onToggleEdit={() => setIsEditing(!isEditing)} 
        />
        
        {/* Edit Mode Banner */}
        <DashboardEditBanner isEditing={isEditing} />

        {/* Stats Overview - Always visible */}
        <DashboardStatsGrid stats={statCards} isLoading={!stats} />

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

        {/* Empty State */}
        {visibleDashlets.length === 0 && <DashboardEmptyState />}
      </div>
    </AppLayout>
  );
}
