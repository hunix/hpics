/**
 * @fileoverview Dashboard Page
 * Main dashboard with customizable widgets using the design system
 */

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Users, MessageSquare, Calendar, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDashboardStats, useRecentContacts, useUpcomingEventsForDashboard } from '@/hooks/dashboard/useDashboardData';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { SortableDashlet } from '@/components/dashboard/SortableDashlet';
import { renderDashlet, type DashletContext } from '@/lib/dashletRegistry';
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from '@/lib/utils';

// Design system components
import { LoadingState } from '@/components/shared/LoadingState';
import { DashboardStatsGrid, type DashboardStat } from '@/components/dashboard/DashboardStatsGrid';
import { DashboardHeader, DashboardEditBanner } from '@/components/dashboard/DashboardHeader';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';

// Grid column class mapping
const getGridColsClass = (cols: number): string => {
  const mapping: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };
  return mapping[cols] ?? 'grid-cols-1 md:grid-cols-2';
};

export default function Dashboard() {
  const [isEditing, setIsEditing] = useState(false);
  const { layout, gridColumns, isLoading: isLoadingLayout, reorderDashlets, toggleDashletVisibility } = useDashboardLayout();
  const { deviceType } = useDeviceDetection();
  const isMobile = deviceType === 'mobile';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: stats } = useDashboardStats();
  const { data: recentContacts } = useRecentContacts(5);
  const { data: upcomingEvents } = useUpcomingEventsForDashboard(5);

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
  const gridColsClass = getGridColsClass(gridColumns);

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

        {/* Dashlets Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleDashlets.map(d => d.id)}
            strategy={rectSortingStrategy}
          >
            <div className={cn('grid gap-4', gridColsClass)}>
              {visibleDashlets.map((dashlet) => {
                // Calculate col-span class respecting grid columns
                const span = Math.min(dashlet.colSpan ?? 1, gridColumns);
                const colSpanClass = span > 1 ? `col-span-${span}` : '';
                
                return (
                  <SortableDashlet
                    key={dashlet.id}
                    id={dashlet.id}
                    title={dashlet.title}
                    isEditing={isEditing}
                    onRemove={() => toggleDashletVisibility(dashlet.id)}
                    className={colSpanClass}
                  >
                    {renderDashlet(dashlet.type, dashletContext)}
                  </SortableDashlet>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty State */}
        {visibleDashlets.length === 0 && <DashboardEmptyState />}
      </div>
    </AppLayout>
  );
}
