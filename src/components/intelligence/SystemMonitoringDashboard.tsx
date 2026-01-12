import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Shield, Zap, Database, Cpu, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getAllCircuitBreakerStats, 
  resetAllCircuitBreakers,
  type CircuitBreakerStats,
  type CircuitState 
} from '@/lib/circuitBreaker';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

export function SystemMonitoringDashboard() {
  const [circuitStats, setCircuitStats] = useState<Record<string, CircuitBreakerStats>>({});
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateStats = () => {
      setCircuitStats(getAllCircuitBreakerStats());
      setLastUpdate(new Date());
      
      // Simulate system metrics (in production, these would come from actual monitoring)
      setSystemMetrics([
        { name: 'API Latency', value: Math.random() * 200 + 50, unit: 'ms', status: 'healthy', trend: 'stable' },
        { name: 'Error Rate', value: Math.random() * 2, unit: '%', status: 'healthy', trend: 'down' },
        { name: 'Queue Depth', value: Math.floor(Math.random() * 50), unit: 'items', status: 'healthy', trend: 'stable' },
        { name: 'Memory Usage', value: 60 + Math.random() * 20, unit: '%', status: 'healthy', trend: 'up' },
        { name: 'Active Connections', value: Math.floor(Math.random() * 100 + 20), unit: '', status: 'healthy', trend: 'stable' },
      ]);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
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
        {/* System Metrics Grid */}
        <div className="grid grid-cols-5 gap-4">
          {systemMetrics.map((metric) => (
            <Card key={metric.name} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{metric.name}</span>
                {metric.trend === 'up' && <Activity className="h-3 w-3 text-yellow-500" />}
                {metric.trend === 'down' && <Activity className="h-3 w-3 text-green-500 rotate-180" />}
                {metric.trend === 'stable' && <Activity className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className={cn("text-lg font-bold", getStatusColor(metric.status))}>
                {metric.value.toFixed(metric.unit === '%' || metric.unit === 'ms' ? 1 : 0)}
                <span className="text-xs font-normal ml-1">{metric.unit}</span>
              </div>
            </Card>
          ))}
        </div>

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
