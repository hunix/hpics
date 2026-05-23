import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Shield, Database, Cpu, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAllCircuitBreakerStats,
  resetAllCircuitBreakers,
  type CircuitBreakerStats,
  type CircuitState
} from '@/lib/circuitBreaker';

export function SystemMonitoringDashboard() {
  const [circuitStats, setCircuitStats] = useState<Record<string, CircuitBreakerStats>>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateStats = () => {
      setCircuitStats(getAllCircuitBreakerStats());
      setLastUpdate(new Date());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real metrics derived from the in-memory circuit-breaker registry.
  // No fake latency/memory/queue numbers — we don't have a metrics
  // pipeline yet, so we don't pretend to.
  const realMetrics = useMemo(() => {
    const all = Object.values(circuitStats);
    const totalRequests = all.reduce((sum, s) => sum + s.totalRequests, 0);
    const totalFailures = all.reduce((sum, s) => sum + s.failures, 0);
    const totalSuccesses = all.reduce((sum, s) => sum + s.successes, 0);
    const openCount = all.filter((s) => s.state === 'open').length;
    const halfOpenCount = all.filter((s) => s.state === 'half-open').length;
    const closedCount = all.filter((s) => s.state === 'closed').length;
    const overallFailureRate = totalRequests > 0 ? totalFailures / totalRequests : 0;
    return {
      totalRequests,
      totalFailures,
      totalSuccesses,
      openCount,
      halfOpenCount,
      closedCount,
      overallFailureRate,
      hasData: all.length > 0,
    };
  }, [circuitStats]);

  const getStateColor = (state: CircuitState) => {
    switch (state) {
      case 'closed': return 'bg-green-500';
      case 'open': return 'bg-red-500';
      case 'half-open': return 'bg-yellow-500';
    }
  };

  const getStateIcon = (state: CircuitState) => {
    switch (state) {
      case 'closed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'open': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'half-open': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const overallHealth = Object.values(circuitStats).every(s => s.state === 'closed')
    ? 'healthy'
    : Object.values(circuitStats).some(s => s.state === 'open')
      ? 'critical'
      : 'warning';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Monitoring
            </CardTitle>
            <CardDescription>
              Real-time health and circuit breaker status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={overallHealth === 'healthy' ? 'default' : 'destructive'}>
              {overallHealth === 'healthy' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {overallHealth.toUpperCase()}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => resetAllCircuitBreakers()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Real metrics derived from the local circuit-breaker registry */}
        {realMetrics.hasData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Requests</div>
              <div className="text-lg font-bold">{realMetrics.totalRequests.toLocaleString()}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Failure Rate</div>
              <div className={cn(
                'text-lg font-bold',
                realMetrics.overallFailureRate >= 0.2 ? 'text-red-500'
                  : realMetrics.overallFailureRate >= 0.05 ? 'text-yellow-500'
                  : 'text-green-500'
              )}>
                {(realMetrics.overallFailureRate * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {realMetrics.totalFailures.toLocaleString()} failed
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Successful</div>
              <div className="text-lg font-bold text-green-500">
                {realMetrics.totalSuccesses.toLocaleString()}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Breaker Health</div>
              <div className="text-sm font-medium">
                <span className="text-green-500">{realMetrics.closedCount} closed</span>
                {realMetrics.halfOpenCount > 0 && (
                  <span className="text-yellow-500"> · {realMetrics.halfOpenCount} half</span>
                )}
                {realMetrics.openCount > 0 && (
                  <span className="text-red-500"> · {realMetrics.openCount} open</span>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
            No circuit-breaker traffic recorded yet. Metrics will appear here once
            outbound calls go through the breaker wrappers.
          </div>
        )}

        {/* Circuit Breakers */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Circuit Breakers
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(circuitStats).map(([name, stats]) => (
              <Card key={name} className={cn(
                "p-4 border-l-4",
                stats.state === 'closed' && "border-l-green-500",
                stats.state === 'open' && "border-l-red-500",
                stats.state === 'half-open' && "border-l-yellow-500"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStateIcon(stats.state)}
                    <span className="font-medium capitalize">{name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stats.state}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Total Requests</span>
                    <p className="font-medium">{stats.totalRequests}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failure Rate</span>
                    <p className="font-medium">{(stats.failureRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failures</span>
                    <p className="font-medium text-red-500">{stats.failures}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Successes</span>
                    <p className="font-medium text-green-500">{stats.successes}</p>
                  </div>
                </div>

                {stats.failureRate > 0 && (
                  <div className="mt-3">
                    <Progress 
                      value={Math.min(stats.failureRate * 100, 100)} 
                      className={cn(
                        "h-1.5",
                        stats.failureRate > 0.5 && "[&>div]:bg-red-500",
                        stats.failureRate > 0.2 && stats.failureRate <= 0.5 && "[&>div]:bg-yellow-500"
                      )}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              {Object.keys(circuitStats).length} breakers active
            </span>
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              {Object.values(circuitStats).reduce((sum, s) => sum + s.totalRequests, 0)} total requests
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
