import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, Plus, CheckCircle, Clock, MessageSquare, Phone,
  Gift, Users, Heart, Copy, Star, Trash2
} from 'lucide-react';
import { useInfluenceActions, useCreateAction, useUpdateAction } from '@/hooks/useInfluenceProfile';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';

interface ActionSchedulerProps {
  profileId: string;
  contactName: string;
}

const actionTypes = [
  { value: 'message', label: 'Send Message', icon: MessageSquare },
  { value: 'call', label: 'Make Call', icon: Phone },
  { value: 'gift', label: 'Send Gift', icon: Gift },
  { value: 'introduction', label: 'Make Introduction', icon: Users },
  { value: 'check_in', label: 'Check In', icon: Heart },
  { value: 'appreciation', label: 'Show Appreciation', icon: Star },
];

export function ActionScheduler({ profileId, contactName }: ActionSchedulerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAction, setNewAction] = useState({
    action_type: '',
    action_title: '',
    action_description: '',
    suggested_message: '',
    scheduled_for: '',
    priority: 'medium',
  });

  const { data: actions, isLoading } = useInfluenceActions(profileId);
  const createMutation = useCreateAction();
  const updateMutation = useUpdateAction();

  const pendingActions = actions?.filter(a => a.status === 'pending' || a.status === 'reminded') || [];
  const completedActions = actions?.filter(a => a.status === 'completed') || [];

  const handleCreate = async () => {
    if (!newAction.action_type || !newAction.action_title) {
      toast({ title: 'Required fields', description: 'Please fill in action type and title.', variant: 'destructive' });
      return;
    }

    try {
      await createMutation.mutateAsync({
        profile_id: profileId,
        action_type: newAction.action_type,
        action_title: newAction.action_title,
        action_description: newAction.action_description || undefined,
        suggested_message: newAction.suggested_message || undefined,
        scheduled_for: newAction.scheduled_for ? new Date(newAction.scheduled_for).toISOString() : undefined,
        priority: newAction.priority,
      });
      toast({ title: 'Action scheduled' });
      setIsDialogOpen(false);
      setNewAction({
        action_type: '',
        action_title: '',
        action_description: '',
        suggested_message: '',
        scheduled_for: '',
        priority: 'medium',
      });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    }
  };

  const handleComplete = async (actionId: string, outcome?: string, rating?: number) => {
    try {
      await updateMutation.mutateAsync({
        actionId,
        updates: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          outcome,
          effectiveness_rating: rating,
        },
      });
      toast({ title: 'Action completed' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    }
  };

  const handleSkip = async (actionId: string) => {
    try {
      await updateMutation.mutateAsync({ actionId, updates: { status: 'skipped' } });
      toast({ title: 'Action skipped' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied' });
  };

  const getDateLabel = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'Overdue';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getDateColor = (dateString: string | null) => {
    if (!dateString) return 'text-muted-foreground';
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'text-red-600';
    if (isToday(date)) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Scheduled Actions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {pendingActions.length} pending actions for {contactName}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Action
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Action</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select value={newAction.action_type} onValueChange={(v) => setNewAction({ ...newAction, action_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Congratulate on promotion"
                    value={newAction.action_title}
                    onChange={(e) => setNewAction({ ...newAction, action_title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Notes about this action..."
                    value={newAction.action_description}
                    onChange={(e) => setNewAction({ ...newAction, action_description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Suggested Message (optional)</Label>
                  <Textarea
                    placeholder="Draft message to send..."
                    value={newAction.suggested_message}
                    onChange={(e) => setNewAction({ ...newAction, suggested_message: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Schedule For</Label>
                    <Input
                      type="datetime-local"
                      value={newAction.scheduled_for}
                      onChange={(e) => setNewAction({ ...newAction, scheduled_for: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newAction.priority} onValueChange={(v) => setNewAction({ ...newAction, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                  Schedule Action
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Pending Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingActions.length > 0 ? (
            <div className="space-y-3">
              {pendingActions.map((action) => {
                const ActionIcon = actionTypes.find(t => t.value === action.action_type)?.icon || MessageSquare;
                return (
                  <div key={action.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <ActionIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{action.action_title}</p>
                            <Badge className={priorityColors[action.priority || 'medium']} variant="outline">
                              {action.priority}
                            </Badge>
                          </div>
                          {action.action_description && (
                            <p className="text-sm text-muted-foreground mt-1">{action.action_description}</p>
                          )}
                          <p className={`text-sm mt-1 flex items-center gap-1 ${getDateColor(action.scheduled_for)}`}>
                            <Clock className="h-3 w-3" />
                            {getDateLabel(action.scheduled_for)}
                            {action.scheduled_for && ` • ${format(new Date(action.scheduled_for), 'h:mm a')}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {action.suggested_message && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm">"{action.suggested_message}"</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(action.suggested_message!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => handleComplete(action.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Done
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSkip(action.id)}>
                        Skip
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending actions scheduled.</p>
              <p className="text-sm text-muted-foreground">Create one to stay on top of your relationship!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Actions */}
      {completedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {completedActions.slice(0, 10).map((action) => {
                  const ActionIcon = actionTypes.find(t => t.value === action.action_type)?.icon || MessageSquare;
                  return (
                    <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <ActionIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{action.action_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {action.completed_at && format(new Date(action.completed_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.effectiveness_rating && (
                          <div className="flex">
                            {Array.from({ length: action.effectiveness_rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
