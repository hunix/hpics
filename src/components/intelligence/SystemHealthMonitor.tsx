/**
 * System Health Monitor (v3.9.0)
 * Real-time monitoring of intelligence pipeline health and performance
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemMetric {
  name: string;
  status: 'healthy' | 'degraded' | 'critical';
  value: number;
  threshold: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface EdgeFunctionHealth {
  name: string;
  lastExecution: string | null;
  successRate: number;
  avgLatency: number;
  errorCount: number;
}

export function SystemHealthMonitor() {
  const { user } = useAuth();

  const systemHealthQuery = useQuery({
    queryKey: ['system-health', user?.id],
    queryFn: async () => {
      // Fetch AI usage stats
      const { data: aiStats } = await supabase
        .from('ai_usage_logs')
        .select('status, response_time_ms, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      // Fetch session stats
      const { data: sessions } = await (supabase as any)
        .from('intelligence_sessions')
        .select('status, created_at, completed_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate metrics
      const aiLogs = aiStats || [];
      const successfulAI = aiLogs.filter(l => l.status === 'success').length;
      const aiSuccessRate = aiLogs.length > 0 ? (successfulAI / aiLogs.length) * 100 : 100;
      const avgLatency = aiLogs.length > 0 
        ? aiLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / aiLogs.length 
        : 0;

      const sessionList = sessions || [];
      const completedSessions = sessionList.filter((s: any) => s.status === 'completed').length;
      const sessionSuccessRate = sessionList.length > 0 ? (completedSessions / sessionList.length) * 100 : 100;

      return {
        metrics: [
          {
            name: 'AI Success Rate',
            status: aiSuccessRate >= 95 ? 'healthy' : aiSuccessRate >= 80 ? 'degraded' : 'critical',
            value: aiSuccessRate,
            threshold: 95,
            unit: '%',
            trend: 'stable' as const,
          },
          {
            name: 'Avg Response Time',
            status: avgLatency <= 3000 ? 'healthy' : avgLatency <= 5000 ? 'degraded' : 'critical',
            value: avgLatency,
            threshold: 3000,
            unit: 'ms',
            trend: avgLatency <= 2000 ? 'down' : 'up' as const,
          },
          {
            name: 'Session Success Rate',
            status: sessionSuccessRate >= 90 ? 'healthy' : sessionSuccessRate >= 70 ? 'degraded' : 'critical',
            value: sessionSuccessRate,
            threshold: 90,
            unit: '%',
            trend: 'stable' as const,
          },
          {
            name: 'Active Sessions',
            status: 'healthy' as const,
            value: sessionList.filter((s: any) => s.status === 'running').length,
            threshold: 10,
            unit: '',
            trend: 'stable' as const,
          },
        ] as SystemMetric[],
        recentLogs: aiLogs.slice(0, 20),
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30s
  });

  const edgeFunctionHealthQuery = useQuery({
    queryKey: ['edge-function-health', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_usage_logs')
        .select('function_name, status, response_time_ms, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const logs = data || [];
      const functionStats = new Map<string, { success: number; total: number; latencies: number[]; lastExec: string }>();

      logs.forEach(log => {
        const existing = functionStats.get(log.function_name) || { success: 0, total: 0, latencies: [], lastExec: log.created_at };
        existing.total++;
        if (log.status === 'success') existing.success++;
        if (log.response_time_ms) existing.latencies.push(log.response_time_ms);
        if (new Date(log.created_at) > new Date(existing.lastExec)) existing.lastExec = log.created_at;
        functionStats.set(log.function_name, existing);
      });

      return Array.from(functionStats.entries()).map(([name, stats]) => ({
        name,
        lastExecution: stats.lastExec,
        successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 100,
        avgLatency: stats.latencies.length > 0 
          ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length 
          : 0,
        errorCount: stats.total - stats.success,
      })) as EdgeFunctionHealth[];
    },
    enabled: !!user,
  });

  const metrics = systemHealthQuery.data?.metrics || [];
  const edgeFunctions = edgeFunctionHealthQuery.data || [];
  const overallHealth = metrics.every(m => m.status === 'healthy') 
    ? 'healthy' 
    : metrics.some(m => m.status === 'critical') 
      ? 'critical' 
      : 'degraded';

  const statusColors = {
    healthy: 'text-green-500 bg-green-500/10',
    degraded: 'text-amber-500 bg-amber-500/10',
    critical: 'text-red-500 bg-red-500/10',
  };

  const statusIcons = {
    healthy: <CheckCircle className="h-5 w-5 text-green-500" />,
    degraded: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    critical: <XCircle className="h-5 w-5 text-red-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={cn("border-2", {
        'border-green-500/30': overallHealth === 'healthy',
        'border-amber-500/30': overallHealth === 'degraded',
        'border-red-500/30': overallHealth === 'critical',
      })}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {statusIcons[overallHealth]}
              <div>
                <h3 className="text-lg font-semibold capitalize">{overallHealth} System Status</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligence pipeline is {overallHealth === 'healthy' ? 'operating normally' : 'experiencing issues'}
                </p>
              </div>
            </div>
            <Badge className={statusColors[overallHealth]}>
              {overallHealth.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(metric => (
          <MetricCard key={metric.name} metric={metric} />
        ))}
      </div>

      {/* Edge Function Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Edge Function Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {edgeFunctions.length > 0 ? (
                edgeFunctions.map(fn => (
                  <EdgeFunctionRow key={fn.name} fn={fn} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No edge function activity in the last 24 hours</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ metric }: { metric: SystemMetric }) {
  const statusColors = {
    healthy: 'text-green-500',
    degraded: 'text-amber-500',
    critical: 'text-red-500',
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4 text-red-500" />,
    down: <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />,
    stable: <Activity className="h-4 w-4 text-muted-foreground" />,
  };

  const progressValue = metric.unit === '%' 
    ? metric.value 
    : Math.min((metric.value / metric.threshold) * 100, 100);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{metric.name}</span>
          {trendIcons[metric.trend]}
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className={cn("text-2xl font-bold", statusColors[metric.status])}>
            {metric.unit === 'ms' ? metric.value.toFixed(0) : metric.value.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">{metric.unit}</span>
        </div>
        <Progress 
          value={progressValue} 
          className={cn("h-1.5", {
            '[&>div]:bg-green-500': metric.status === 'healthy',
            '[&>div]:bg-amber-500': metric.status === 'degraded',
            '[&>div]:bg-red-500': metric.status === 'critical',
          })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Threshold: {metric.threshold}{metric.unit}
        </p>
      </CardContent>
    </Card>
  );
}

function EdgeFunctionRow({ fn }: { fn: EdgeFunctionHealth }) {
  const isHealthy = fn.successRate >= 95 && fn.avgLatency <= 5000;
  const isDegraded = fn.successRate >= 80 || fn.avgLatency <= 10000;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isHealthy ? "bg-green-500" : isDegraded ? "bg-amber-500" : "bg-red-500"
        )} />
        <div>
          <span className="font-medium text-sm">{fn.name}</span>
          {fn.lastExecution && (
            <p className="text-xs text-muted-foreground">
              Last: {new Date(fn.lastExecution).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <span className={cn(
            fn.successRate >= 95 ? "text-green-500" : 
            fn.successRate >= 80 ? "text-amber-500" : "text-red-500"
          )}>
            {fn.successRate.toFixed(1)}%
          </span>
          <p className="text-xs text-muted-foreground">Success</p>
        </div>
        <div className="text-right">
          <span>{fn.avgLatency.toFixed(0)}ms</span>
          <p className="text-xs text-muted-foreground">Avg Latency</p>
        </div>
        {fn.errorCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {fn.errorCount} errors
          </Badge>
        )}
      </div>
    </div>
  );
}
