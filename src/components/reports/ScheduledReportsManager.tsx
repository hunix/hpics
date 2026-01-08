import { useState } from 'react';
import { Calendar, Plus, Trash2, Loader2, Clock, Mail, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ReportType = 'executive_summary' | 'relationship_health' | 'network_analysis' | 'dossier';
type Frequency = 'daily' | 'weekly' | 'monthly';

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  frequency: string;
  is_active: boolean | null;
  config: Record<string, unknown> | null;
  recipients: string[] | null;
  next_scheduled_at: string | null;
  last_generated_at: string | null;
  created_at: string;
}

export function ScheduledReportsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    report_type: 'executive_summary' as ReportType,
    frequency: 'weekly' as Frequency,
    email_delivery: false,
    delivery_email: '',
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['report-schedules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports_schedule')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ScheduledReport[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Calculate next scheduled time
      const now = new Date();
      let nextScheduled: Date;
      
      switch (newSchedule.frequency) {
        case 'daily':
          nextScheduled = new Date(now.setDate(now.getDate() + 1));
          nextScheduled.setHours(8, 0, 0, 0);
          break;
        case 'weekly':
          nextScheduled = new Date(now.setDate(now.getDate() + (7 - now.getDay() + 1) % 7 + 1));
          nextScheduled.setHours(8, 0, 0, 0);
          break;
        case 'monthly':
          nextScheduled = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
          break;
        default:
          nextScheduled = new Date(now.setDate(now.getDate() + 7));
      }

      const { error } = await supabase.from('reports_schedule').insert({
        user_id: user!.id,
        name: newSchedule.name,
        report_type: newSchedule.report_type,
        frequency: newSchedule.frequency,
        is_active: true,
        recipients: newSchedule.email_delivery && newSchedule.delivery_email 
          ? [newSchedule.delivery_email] 
          : null,
        next_scheduled_at: nextScheduled.toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Report schedule created');
      setIsDialogOpen(false);
      setNewSchedule({
        name: '',
        report_type: 'executive_summary',
        frequency: 'weekly',
        email_delivery: false,
        delivery_email: '',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('reports_schedule')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reports_schedule')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Schedule deleted');
    },
  });

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'executive_summary': return 'Executive Summary';
      case 'relationship_health': return 'Relationship Health';
      case 'network_analysis': return 'Network Analysis';
      case 'dossier': return 'Contact Dossier';
      default: return type;
    }
  };

  const getFrequencyColor = (freq: string) => {
    switch (freq) {
      case 'daily': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'weekly': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'monthly': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Reports
            </CardTitle>
            <CardDescription>
              Automatically generate reports on a schedule
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Report Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Schedule Name</Label>
                  <Input
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                    placeholder="Weekly Network Report"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select
                      value={newSchedule.report_type}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, report_type: v as ReportType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive_summary">Executive Summary</SelectItem>
                        <SelectItem value="relationship_health">Relationship Health</SelectItem>
                        <SelectItem value="network_analysis">Network Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={newSchedule.frequency}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, frequency: v as Frequency })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label>Email Delivery</Label>
                  </div>
                  <Switch
                    checked={newSchedule.email_delivery}
                    onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, email_delivery: checked })}
                  />
                </div>

                {newSchedule.email_delivery && (
                  <div className="space-y-2">
                    <Label>Delivery Email</Label>
                    <Input
                      type="email"
                      value={newSchedule.delivery_email}
                      onChange={(e) => setNewSchedule({ ...newSchedule, delivery_email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                )}

                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!newSchedule.name || createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Switch
                    checked={schedule.is_active}
                    onCheckedChange={(checked) => 
                      toggleMutation.mutate({ id: schedule.id, isActive: checked })
                    }
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{schedule.name}</h4>
                      <Badge variant="secondary" className={getFrequencyColor(schedule.frequency)}>
                        {schedule.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getReportTypeLabel(schedule.report_type)}
                      {schedule.recipients && schedule.recipients.length > 0 && (
                        <span className="ml-2">
                          <Mail className="h-3 w-3 inline mr-1" />
                          {schedule.recipients[0]}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {schedule.next_scheduled_at && schedule.is_active && (
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Next run
                      </div>
                      <div>{format(new Date(schedule.next_scheduled_at), 'MMM d, h:mm a')}</div>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(schedule.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No scheduled reports</p>
            <p className="text-sm">Create a schedule to automate report generation</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
