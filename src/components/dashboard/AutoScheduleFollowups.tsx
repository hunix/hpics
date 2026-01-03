import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, Bell, Clock, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface ScheduledReminder {
  contactId: string;
  contactName: string;
  scheduledDate: Date;
  reason: string;
  channel: string;
}

export function AutoScheduleFollowups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);

  // Fetch contacts that need scheduling
  const { data: pendingSchedules, isLoading } = useQuery({
    queryKey: ['pending-schedules', user?.id],
    queryFn: async () => {
      // Get contacts without upcoming follow-up events
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, last_contact_date')
        .eq('user_id', user!.id);

      const { data: existingEvents } = await supabase
        .from('events')
        .select('profile_id')
        .eq('user_id', user!.id)
        .eq('event_type', 'follow_up')
        .gte('event_date', new Date().toISOString());

      const scheduledProfileIds = new Set((existingEvents || []).map(e => e.profile_id));
      
      const now = new Date();
      const needsScheduling = (profiles || [])
        .filter(p => !scheduledProfileIds.has(p.id))
        .map(p => {
          const lastContact = p.last_contact_date ? new Date(p.last_contact_date) : null;
          const daysSince = lastContact 
            ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          // Calculate suggested follow-up based on relationship type
          let suggestedDays = 30;
          switch (p.relationship_type) {
            case 'family': suggestedDays = 7; break;
            case 'friend': suggestedDays = 14; break;
            case 'mentor':
            case 'mentee': suggestedDays = 21; break;
            case 'colleague':
            case 'client': suggestedDays = 30; break;
            default: suggestedDays = 45;
          }

          return {
            contactId: p.id,
            contactName: `${p.first_name} ${p.last_name || ''}`.trim(),
            relationshipType: p.relationship_type || 'other',
            daysSinceContact: daysSince,
            suggestedDate: addDays(now, Math.max(1, suggestedDays - Math.min(daysSince, suggestedDays))),
            priority: daysSince > suggestedDays ? 'overdue' : 'upcoming',
          };
        })
        .filter(p => p.daysSinceContact > 7) // Only show those needing attention
        .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
        .slice(0, 10);

      return needsScheduling;
    },
    enabled: !!user,
  });

  const scheduleFollowupMutation = useMutation({
    mutationFn: async (contact: { contactId: string; contactName: string; suggestedDate: Date }) => {
      const { error } = await supabase.from('events').insert({
        user_id: user!.id,
        profile_id: contact.contactId,
        title: `Follow up with ${contact.contactName}`,
        event_type: 'follow_up',
        event_date: contact.suggestedDate.toISOString(),
        reminder_days_before: 1,
        reminder_frequency: 'once',
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Follow-up scheduled!');
    },
    onError: () => {
      toast.error('Failed to schedule follow-up');
    },
  });

  const scheduleAllMutation = useMutation({
    mutationFn: async () => {
      if (!pendingSchedules) return;
      
      const inserts = pendingSchedules.map(contact => ({
        user_id: user!.id,
        profile_id: contact.contactId,
        title: `Follow up with ${contact.contactName}`,
        event_type: 'follow_up' as const,
        event_date: contact.suggestedDate.toISOString(),
        reminder_days_before: 1,
        reminder_frequency: 'once' as const,
        is_active: true,
      }));

      const { error } = await supabase.from('events').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(`Scheduled ${pendingSchedules?.length} follow-ups!`);
    },
    onError: () => {
      toast.error('Failed to schedule follow-ups');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Auto-Schedule Follow-ups
            </CardTitle>
            <CardDescription>
              AI-suggested follow-up reminders based on relationship patterns
            </CardDescription>
          </div>
          {pendingSchedules && pendingSchedules.length > 0 && (
            <Button 
              size="sm"
              onClick={() => scheduleAllMutation.mutate()}
              disabled={scheduleAllMutation.isPending}
            >
              <Bell className="h-4 w-4 mr-2" />
              Schedule All ({pendingSchedules.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pendingSchedules && pendingSchedules.length > 0 ? (
          <div className="space-y-3">
            {pendingSchedules.map((contact) => (
              <div
                key={contact.contactId}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    {contact.contactName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.contactName}</span>
                      <Badge 
                        variant={contact.priority === 'overdue' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {contact.daysSinceContact}d ago
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Suggested: {format(contact.suggestedDate, 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scheduleFollowupMutation.mutate(contact)}
                  disabled={scheduleFollowupMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>All caught up!</p>
            <p className="text-sm">No pending follow-ups to schedule</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
