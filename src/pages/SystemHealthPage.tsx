import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, Clock, Cpu, Layers } from 'lucide-react';
import { DataValidationDashboard } from '@/components/testing/DataValidationDashboard';
import { PredictionAccuracyTracker } from '@/components/testing/PredictionAccuracyTracker';
import { CronJobManager } from '@/components/settings/CronJobManager';
import { FusionHealthDashboard } from '@/components/intelligence/FusionHealthDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecentEdgeFunctionLogs } from '@/hooks/intelligence/useEdgeFunctionLogs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

function EdgeFunctionStatus() {
  const { data: recentLogs } = useRecentEdgeFunctionLogs(20);

  const functionStats = recentLogs?.reduce((acc, log) => {
    if (!acc[log.function_name]) {
      acc[log.function_name] = { success: 0, error: 0, avgTime: 0, count: 0, lastRun: log.created_at };
    }
    acc[log.function_name].count++;
    if (log.status === 'success') acc[log.function_name].success++;
    else acc[log.function_name].error++;
    acc[log.function_name].avgTime += log.response_time_ms || 0;
    return acc;
  }, {} as Record<string, { success: number; error: number; avgTime: number; count: number; lastRun: string }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Edge Function Status
        </CardTitle>
        <CardDescription>Recent backend function activity</CardDescription>
      </CardHeader>
      <CardContent>
        {functionStats && Object.keys(functionStats).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(functionStats).slice(0, 10).map(([name, stats]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    Last run: {formatDistanceToNow(new Date(stats.lastRun), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={stats.error > 0 ? 'destructive' : 'default'}>
                    {stats.success}/{stats.count} success
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ~{Math.round(stats.avgTime / stats.count)}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">No recent function activity</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SystemHealthPage() {
  return (
    <AppLayout title="System Health">
      <Tabs defaultValue="fusion" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fusion" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Fusion Engines
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Edge Functions
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fusion">
          <FusionHealthDashboard />
        </TabsContent>

        <TabsContent value="validation">
          <DataValidationDashboard />
        </TabsContent>

        <TabsContent value="predictions">
          <PredictionAccuracyTracker />
        </TabsContent>

        <TabsContent value="functions">
          <EdgeFunctionStatus />
        </TabsContent>

        <TabsContent value="jobs">
          <CronJobManager />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
