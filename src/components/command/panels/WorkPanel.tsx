/**
 * WorkPanel - Context panel for work mode
 * Shows: calendar, follow-ups, email intelligence, task summary
 */

import React from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Mail, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isTomorrow } from 'date-fns';

export default function WorkPanel() {
  const { user } = useAuth();

  // Fetch today's calendar
  const { data: todayEvents } = useQuery({
    queryKey: ['work-calendar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch pending follow-ups
  const { data: followUps } = useQuery({
    queryKey: ['work-followups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('follow_up_suggestions')
        .select(`
          id, suggested_action, priority, due_date,
          profile:profiles!follow_up_suggestions_profile_id_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch decay alerts
  const { data: decayAlerts } = useQuery({
    queryKey: ['work-decay', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('relationship_scores')
        .select(`
          id, health_score, decay_risk,
          profile:profiles!relationship_scores_profile_id_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .gt('decay_risk', 0.6)
        .order('decay_risk', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const overdueCount = followUps?.filter((f: any) => 
    f.due_date && new Date(f.due_date) < new Date()
  ).length || 0;

  return (
    <div className="p-4 space-y-4">
      {/* Today's Schedule */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">Today's Schedule</span>
          <Badge variant="secondary">{todayEvents?.length || 0}</Badge>
        </div>
        <ScrollArea className="h-28">
          <div className="space-y-2">
            {todayEvents?.map((event: any) => (
              <div 
                key={event.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="text-center min-w-[50px]">
                  <p className="text-sm font-medium">
                    {format(new Date(event.start_time), 'HH:mm')}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {event.description || event.event_type}
                  </p>
                </div>
              </div>
            ))}
            {!todayEvents?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No events scheduled today
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Follow-ups */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Follow-ups</span>
          {overdueCount > 0 && (
            <Badge variant="destructive">{overdueCount} overdue</Badge>
          )}
        </div>
        <ScrollArea className="h-28">
          <div className="space-y-2">
            {followUps?.map((item: any) => {
              const profile = item.profile;
              const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
              const isOverdue = item.due_date && new Date(item.due_date) < new Date();
              return (
                <div 
                  key={item.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isOverdue ? 'bg-red-500/10 border border-red-500/20' : 'bg-muted/50'
                  }`}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-xs">{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.suggested_action}
                    </p>
                  </div>
                  {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
              );
            })}
            {!followUps?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending follow-ups
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Relationship Health Alerts */}
      {decayAlerts && decayAlerts.length > 0 && (
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Needs Attention</span>
            </div>
            <div className="flex gap-2">
              {decayAlerts.map((alert: any) => {
                const profile = alert.profile;
                const name = profile ? `${profile.first_name || ''}`.trim() : '?';
                return (
                  <div key={alert.id} className="text-center">
                    <Avatar className="h-8 w-8 mx-auto mb-1">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-xs">{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs">{Math.round(alert.health_score * 100)}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="justify-start">
          <Mail className="h-4 w-4 mr-2" />
          Email Insights
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          <Users className="h-4 w-4 mr-2" />
          Team Overview
        </Button>
      </div>
    </div>
  );
}
