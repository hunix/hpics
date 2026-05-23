import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, Bell, Clock, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  usePendingFollowupSchedules,
  useScheduleFollowup,
  useScheduleAllFollowups,
} from '@/hooks/dashboard/useAutoScheduleFollowups';

export function AutoScheduleFollowups() {
  const { data: pendingSchedules, isLoading } = usePendingFollowupSchedules();

  const scheduleHook = useScheduleFollowup();
  const scheduleFollowupMutation = {
    isPending: scheduleHook.isPending,
    mutate: (contact: { contactId: string; contactName: string; suggestedDate: Date }) =>
      scheduleHook.mutate(contact, {
        onSuccess: () => toast.success('Follow-up scheduled!'),
        onError: () => toast.error('Failed to schedule follow-up'),
      }),
  };

  const scheduleAllHook = useScheduleAllFollowups();
  const scheduleAllMutation = {
    isPending: scheduleAllHook.isPending,
    mutate: () => {
      const list = pendingSchedules ?? [];
      scheduleAllHook.mutate(list, {
        onSuccess: () => toast.success(`Scheduled ${list.length} follow-ups!`),
        onError: () => toast.error('Failed to schedule follow-ups'),
      });
    },
  };

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
