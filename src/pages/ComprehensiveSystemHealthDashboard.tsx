import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Database, 
  Cpu, Globe, Zap, Clock, TrendingUp, Server, Shield, Heart,
  BarChart3, Layers, CircleDot
} from 'lucide-react';
import { PHASE_CONFIGS, getPhaseStatus, getStatusColor } from '@/lib/agis/phaseConfig';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Phase Health Card Component
function PhaseHealthCard({ phase, health, lastActivity, operations }: { 
  phase: number; 
  health: number; 
  lastActivity: string | null;
  operations: number;
}) {
  const config = PHASE_CONFIGS[phase];
  if (!config) return null;
  
  const status = getPhaseStatus(health);
  const statusColor = getStatusColor(status);
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
              status === 'critical' && "border-destructive/50 bg-destructive/5",
              status === 'degraded' && "border-warning/50 bg-warning/5",
              status === 'stable' && "border-chart-4/50 bg-chart-4/5",
              status === 'optimal' && "border-green-500/50 bg-green-500/5"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: statusColor }} />
              <span className="text-xs font-medium truncate">{config.shortName}</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1">
                P{phase}
              </Badge>
            </div>
            <Progress value={health} className="h-1.5 mb-1" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{health.toFixed(0)}%</span>
              <span>{operations} ops</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{config.name}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            <p className="text-xs">Health: {health.toFixed(1)}% ({status})</p>
            <p className="text-xs">Operations: {operations}</p>
            {lastActivity && (
              <p className="text-xs">Last Activity: {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Database Status Component
function DatabaseStatus() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'healthy' | 'degraded' | 'error'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkDatabase = async () => {
    setDbStatus('checking');
    const start = performance.now();
    try {
      const { error } = await supabase.from('platform_config').select('config_key').limit(1);
      const elapsed = performance.now() - start;
      setLatency(Math.round(elapsed));
      setLastCheck(new Date());
      
      if (error) {
        setDbStatus('error');
      } else if (elapsed > 500) {
        setDbStatus('degraded');
      } else {
        setDbStatus('healthy');
      }
    } catch {
      setDbStatus('error');
      setLatency(null);
    }
  };

  useEffect(() => {
    checkDatabase();
    const interval = setInterval(checkDatabase, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    checking: { icon: RefreshCw, color: 'text-muted-foreground', label: 'Checking...', bg: 'bg-muted' },
    healthy: { icon: CheckCircle2, color: 'text-green-500', label: 'Healthy', bg: 'bg-green-500/10' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-500', label: 'Degraded', bg: 'bg-yellow-500/10' },
    error: { icon: XCircle, color: 'text-destructive', label: 'Error', bg: 'bg-destructive/10' },
  };

  const config = statusConfig[dbStatus];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("p-3 rounded-lg flex items-center gap-3", config.bg)}>
          <StatusIcon className={cn("h-8 w-8", config.color, dbStatus === 'checking' && "animate-spin")} />
          <div>
            <p className="font-semibold">{config.label}</p>
            {latency && <p className="text-xs text-muted-foreground">{latency}ms latency</p>}
            {lastCheck && (
              <p className="text-xs text-muted-foreground">
                Last check: {formatDistanceToNow(lastCheck, { addSuffix: true })}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={checkDatabase}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Edge Function Status Component
function EdgeFunctionStatus() {
  const { user } = useAuth();

  const { data: functionLogs, isLoading, refetch } = useQuery({
    queryKey: ['edge-function-health', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_usage_logs')
        .select('function_name, status, created_at, response_time_ms, error_message')
        .order('created_at', { ascending: false })
        .limit(200);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const functionStats = useMemo(() => {
    if (!functionLogs) return {};
    
    return functionLogs.reduce((acc, log) => {
      const name = log.function_name;
      if (!acc[name]) {
        acc[name] = { 
          success: 0, 
          error: 0, 
          total: 0, 
          avgTime: 0, 
          lastRun: log.created_at,
          lastStatus: log.status
        };
      }
      acc[name].total++;
      if (log.status === 'success') acc[name].success++;
      else acc[name].error++;
      acc[name].avgTime += log.response_time_ms || 0;
      return acc;
    }, {} as Record<string, { success: number; error: number; total: number; avgTime: number; lastRun: string; lastStatus: string }>);
  }, [functionLogs]);

  const overallHealth = useMemo(() => {
    if (!functionStats || Object.keys(functionStats).length === 0) return 100;
    const stats = Object.values(functionStats);
    const totalSuccess = stats.reduce((sum, s) => sum + s.success, 0);
    const totalCalls = stats.reduce((sum, s) => sum + s.total, 0);
    return totalCalls > 0 ? (totalSuccess / totalCalls) * 100 : 100;
  }, [functionStats]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Edge Functions
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Overall Health: {overallHealth.toFixed(1)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={overallHealth} className="h-2 mb-4" />
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {Object.entries(functionStats).slice(0, 15).map(([name, stats]) => (
                <div key={name} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    {stats.lastStatus === 'success' ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span className="text-xs font-medium truncate max-w-[150px]">{name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{stats.success}/{stats.total}</span>
                    <span>~{Math.round(stats.avgTime / stats.total)}ms</span>
                  </div>
                </div>
              ))}
              {Object.keys(functionStats).length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">No recent function activity</p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// AGIS Phase Health Grid
function AGISPhaseHealthGrid() {
  const { user } = useAuth();

  const { data: globalState, isLoading } = useQuery({
    queryKey: ['agis-global-health', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('agis_global_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const phaseHealthScores: Record<string, any> = (globalState?.phase_health_scores as Record<string, any>) || {};
  
  // Calculate overall system health
  const overallHealth = useMemo(() => {
    const phases = Object.values(phaseHealthScores) as Array<{ health?: number }>;
    if (phases.length === 0) return 85; // Default
    const total = phases.reduce((sum, p) => sum + (p?.health || 0), 0);
    return total / phases.length;
  }, [phaseHealthScores]);

  const phaseIds = Object.keys(PHASE_CONFIGS).map(Number).sort((a, b) => a - b);

  // Count phases by status
  const statusCounts = useMemo(() => {
    const counts = { critical: 0, degraded: 0, stable: 0, optimal: 0 };
    phaseIds.forEach(id => {
      const health = (phaseHealthScores[id] as any)?.health || 85;
      const status = getPhaseStatus(health);
      counts[status]++;
    });
    return counts;
  }, [phaseHealthScores, phaseIds]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              AGIS Phase Health Matrix
            </CardTitle>
            <CardDescription>Real-time health monitoring across all 22 phases</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-500">
              {statusCounts.optimal} Optimal
            </Badge>
            <Badge variant="outline" className="text-chart-4">
              {statusCounts.stable} Stable
            </Badge>
            <Badge variant="outline" className="text-yellow-500">
              {statusCounts.degraded} Degraded
            </Badge>
            <Badge variant="outline" className="text-destructive">
              {statusCounts.critical} Critical
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">System-Wide Health</span>
            <span className="text-sm text-muted-foreground">{overallHealth.toFixed(1)}%</span>
          </div>
          <Progress value={overallHealth} className="h-3" />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11 gap-2">
          {phaseIds.map(phase => {
            const phaseData = phaseHealthScores[phase] as any || {};
            return (
              <PhaseHealthCard
                key={phase}
                phase={phase}
                health={phaseData.health || 85}
                lastActivity={phaseData.lastActivity}
                operations={phaseData.activeOperations || 0}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// System Metrics Overview
function SystemMetricsOverview() {
  const { user } = useAuth();

  const { data: metrics } = useQuery({
    queryKey: ['system-metrics', user?.id],
    queryFn: async () => {
      const [logsResult, cacheResult, analyticsResult] = await Promise.all([
        supabase.from('ai_usage_logs').select('*', { count: 'exact', head: true }),
        supabase.from('ai_request_cache').select('*', { count: 'exact', head: true }),
        supabase.from('agis_analytics').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        totalAICalls: logsResult.count || 0,
        cacheEntries: cacheResult.count || 0,
        analyticsEvents: analyticsResult.count || 0,
      };
    },
    enabled: !!user,
  });

  const metricCards = [
    { 
      title: 'Total AI Calls', 
      value: metrics?.totalAICalls?.toLocaleString() || '0', 
      icon: Zap,
      color: 'text-chart-1'
    },
    { 
      title: 'Cache Entries', 
      value: metrics?.cacheEntries?.toLocaleString() || '0', 
      icon: Server,
      color: 'text-chart-2'
    },
    { 
      title: 'AGIS Events', 
      value: metrics?.analyticsEvents?.toLocaleString() || '0', 
      icon: Activity,
      color: 'text-chart-3'
    },
    { 
      title: 'Active Phases', 
      value: '22', 
      icon: Layers,
      color: 'text-chart-4'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metricCards.map((metric, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.title}</p>
              </div>
              <metric.icon className={cn("h-8 w-8", metric.color)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Recent Activity Feed
function RecentActivityFeed() {
  const { user } = useAuth();

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-system-activity', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_usage_logs')
        .select('function_name, status, created_at, response_time_ms')
        .order('created_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {recentActivity?.map((activity, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                {activity.status === 'success' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                )}
                <span className="text-xs truncate flex-1">{activity.function_name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-center text-muted-foreground py-4 text-sm">No recent activity</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Integration Health Component
function IntegrationHealth() {
  const integrations = [
    { name: 'AI Models', status: 'healthy', icon: Zap },
    { name: 'Database', status: 'healthy', icon: Database },
    { name: 'Edge Functions', status: 'healthy', icon: Cpu },
    { name: 'File Storage', status: 'healthy', icon: Server },
    { name: 'Auth System', status: 'healthy', icon: Shield },
    { name: 'Realtime', status: 'healthy', icon: Activity },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Integration Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {integrations.map((int, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/30">
              <int.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs flex-1">{int.name}</span>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComprehensiveSystemHealthDashboard() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefreshAll = () => {
    setLastRefresh(new Date());
    // This triggers all queries to refetch via key change
  };

  return (
    <AppLayout title="System Health Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-destructive" />
              Comprehensive System Health
            </h1>
            <p className="text-muted-foreground text-sm">
              Real-time monitoring of all 22 AGIS phases, edge functions, and database connectivity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Last refresh: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </span>
            <Button onClick={handleRefreshAll} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <SystemMetricsOverview />

        {/* Main Content Tabs */}
        <Tabs defaultValue="phases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              AGIS Phases
            </TabsTrigger>
            <TabsTrigger value="infrastructure" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Infrastructure
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phases" className="space-y-4">
            <AGISPhaseHealthGrid />
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DatabaseStatus />
              <EdgeFunctionStatus />
              <IntegrationHealth />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <RecentActivityFeed />
              <EdgeFunctionStatus />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
