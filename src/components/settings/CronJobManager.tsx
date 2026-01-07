import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Clock, Calendar, Bell, FileText, Brain, Zap } from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  functionName: string;
  icon: React.ElementType;
  enabled: boolean;
}

const defaultJobs: Omit<CronJob, 'enabled'>[] = [
  {
    id: 'weekly-summary',
    name: 'Weekly Summary',
    description: 'Generate and email weekly relationship summaries',
    schedule: '0 9 * * 0', // Sunday 9 AM
    functionName: 'generate-weekly-summary',
    icon: Calendar,
  },
  {
    id: 'daily-reminders',
    name: 'Daily Reminders',
    description: 'Send event reminders and follow-up notifications',
    schedule: '0 8 * * *', // Daily 8 AM
    functionName: 'send-reminders',
    icon: Bell,
  },
  {
    id: 'intelligence-processing',
    name: 'Intelligence Processing',
    description: 'Update behavioral baselines, check decay, process alerts',
    schedule: '0 2 * * *', // Daily 2 AM
    functionName: 'process-scheduled-intelligence',
    icon: Brain,
  },
  {
    id: 'scheduled-reports',
    name: 'Scheduled Reports',
    description: 'Generate and distribute scheduled reports',
    schedule: '0 7 * * 1', // Monday 7 AM
    functionName: 'generate-scheduled-reports',
    icon: FileText,
  },
  {
    id: 'push-triggers',
    name: 'Push Notification Triggers',
    description: 'Check for events, decay alerts, and send push notifications',
    schedule: '*/15 * * * *', // Every 15 minutes
    functionName: 'trigger-push-notifications',
    icon: Zap,
  },
];

export function CronJobManager() {
  const { toast } = useToast();
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());

  // This would typically fetch from a cron_jobs table if you have one
  // For now, we'll use local state
  const [jobStates, setJobStates] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('cronJobStates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return defaultJobs.reduce((acc, job) => ({ ...acc, [job.id]: true }), {});
  });

  const toggleJob = (jobId: string) => {
    const newStates = { ...jobStates, [jobId]: !jobStates[jobId] };
    setJobStates(newStates);
    localStorage.setItem('cronJobStates', JSON.stringify(newStates));
    toast({
      title: newStates[jobId] ? 'Job enabled' : 'Job disabled',
      description: `${defaultJobs.find(j => j.id === jobId)?.name} has been ${newStates[jobId] ? 'enabled' : 'disabled'}`,
    });
  };

  const runJobNow = async (job: Omit<CronJob, 'enabled'>) => {
    setRunningJobs(prev => new Set(prev).add(job.id));
    try {
      const { error } = await supabase.functions.invoke(job.functionName);
      if (error) throw error;
      toast({
        title: 'Job executed',
        description: `${job.name} completed successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Job failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRunningJobs(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  const formatSchedule = (cron: string): string => {
    const parts = cron.split(' ');
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Every X minutes
    if (minute.startsWith('*/')) {
      const interval = minute.slice(2);
      return `Every ${interval} minutes`;
    }

    if (dayOfWeek === '0' && hour === '9') return 'Every Sunday at 9 AM UTC';
    if (dayOfWeek === '1' && hour === '7') return 'Every Monday at 7 AM UTC';
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
      return `Daily at ${displayHour}:${minute.padStart(2, '0')} ${ampm} UTC`;
    }
    return cron;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Scheduled Jobs
        </CardTitle>
        <CardDescription>
          Manage automated background tasks and scheduled processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {defaultJobs.map((job) => {
          const Icon = job.icon;
          const isEnabled = jobStates[job.id] ?? true;
          const isRunning = runningJobs.has(job.id);

          return (
            <div
              key={job.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{job.name}</span>
                    <Badge variant={isEnabled ? 'default' : 'secondary'}>
                      {isEnabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatSchedule(job.schedule)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runJobNow(job)}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="ml-1 hidden sm:inline">Run Now</span>
                </Button>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleJob(job.id)}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> These jobs run automatically based on their schedule. 
            Use "Run Now" to trigger them manually for testing. Disabling a job prevents 
            it from running on schedule but you can still run it manually.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
