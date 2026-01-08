import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Compass, 
  AlertTriangle, 
  Gift, 
  Calendar, 
  Phone, 
  Clock,
  TrendingDown,
  Sparkles,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format, isToday, isTomorrow, addDays, differenceInDays } from 'date-fns';

interface BriefingItem {
  id: string;
  type: 'action' | 'birthday' | 'at_risk' | 'milestone' | 'opportunity';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  profileId?: string;
  profileName?: string;
  dueDate?: string;
}

const priorityConfig = {
  urgent: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Urgent' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'High' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Medium' },
  low: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Low' },
};

const typeIcons = {
  action: Phone,
  birthday: Gift,
  at_risk: TrendingDown,
  milestone: Sparkles,
  opportunity: Calendar,
};

export function DailyBriefingWidget() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['daily-briefing', user?.id],
    queryFn: async () => {
      const items: BriefingItem[] = [];
      const today = new Date();
      const nextWeek = addDays(today, 7);

      // Fetch pending influence actions
      const { data: actions } = await supabase
        .from('influence_actions')
        .select(`
          id,
          action_type,
          action_description,
          scheduled_for,
          priority,
          profiles:profile_id (id, first_name, last_name)
        `)
        .eq('user_id', user?.id)
        .in('status', ['pending', 'reminded'])
        .lte('scheduled_for', nextWeek.toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(10);

      for (const action of (actions || []) as any[]) {
        const profile = action.profiles;
        const dueDate = action.scheduled_for ? new Date(action.scheduled_for) : null;
        const isOverdue = dueDate && dueDate < today;
        const isDueToday = dueDate && isToday(dueDate);
        
        items.push({
          id: action.id,
          type: 'action',
          priority: isOverdue ? 'urgent' : isDueToday ? 'high' : action.priority === 'high' ? 'high' : 'medium',
          title: action.action_description || `${action.action_type} with ${profile?.first_name}`,
          description: isOverdue ? 'Overdue!' : isDueToday ? 'Due today' : dueDate ? `Due ${format(dueDate, 'MMM d')}` : '',
          profileId: profile?.id,
          profileName: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : undefined,
          dueDate: action.scheduled_for,
        });
      }

      // Fetch upcoming birthdays from events table
      const { data: birthdayEvents } = await supabase
        .from('events')
        .select(`
          id,
          profile_id,
          event_date,
          profiles:profile_id (id, first_name, last_name)
        `)
        .eq('user_id', user?.id)
        .eq('event_type', 'birthday')
        .gte('event_date', today.toISOString())
        .lte('event_date', nextWeek.toISOString());

      for (const event of (birthdayEvents || []) as any[]) {
        const profile = event.profiles;
        const eventDate = new Date(event.event_date);
        const daysUntil = differenceInDays(eventDate, today);
        
        items.push({
          id: `birthday-${event.id}`,
          type: 'birthday',
          priority: daysUntil === 0 ? 'urgent' : daysUntil <= 2 ? 'high' : 'medium',
          title: `${profile?.first_name}'s Birthday`,
          description: daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`,
          profileId: profile?.id,
          profileName: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : undefined,
        });
      }

      // Fetch at-risk relationships
      const { data: atRiskProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, last_contact_date')
        .eq('user_id', user?.id)
        .eq('is_favorite', true)
        .or(`last_contact_date.is.null,last_contact_date.lt.${addDays(today, -30).toISOString()}`)
        .limit(5);

      for (const profile of atRiskProfiles || []) {
        const daysSince = profile.last_contact_date 
          ? differenceInDays(today, new Date(profile.last_contact_date))
          : 999;
        
        items.push({
          id: `at-risk-${profile.id}`,
          type: 'at_risk',
          priority: daysSince > 60 ? 'urgent' : daysSince > 45 ? 'high' : 'medium',
          title: `Reconnect with ${profile.first_name}`,
          description: profile.last_contact_date 
            ? `No contact in ${daysSince} days` 
            : 'Never contacted',
          profileId: profile.id,
          profileName: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        });
      }

      // Sort by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return { items: items.slice(0, 10) };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Briefing updated');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const items = data?.items || [];
  const urgentCount = items.filter(i => i.priority === 'urgent').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Daily Briefing
            {urgentCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {urgentCount} Urgent
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {format(new Date(), 'EEEE, MMMM d')} — {items.length} items
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <ScrollArea className="h-[320px]">
            <div className="space-y-2">
              {items.map((item) => {
                const config = priorityConfig[item.priority];
                const Icon = typeIcons[item.type];

                return (
                  <Link
                    key={item.id}
                    to={item.profileId ? `/contacts/${item.profileId}` : '#'}
                    className="block"
                  >
                    <div className={`p-3 rounded-lg border ${config.bg} hover:opacity-90 transition-opacity`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full bg-background`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium text-sm truncate">{item.title}</h4>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                          <p className={`text-xs ${config.color}`}>{item.description}</p>
                          {item.profileName && item.type !== 'birthday' && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.profileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Compass className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium text-green-500">All Clear!</p>
            <p className="text-xs">No urgent items today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
