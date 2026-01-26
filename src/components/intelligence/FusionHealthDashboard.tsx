/**
 * Fusion Health Dashboard (v1.0)
 * 
 * Displays real-time health status, success rates, latency metrics,
 * and error tracking for all 65+ fusion engines.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  BarChart3,
  Shield,
  Brain,
  Network,
  Target,
  Eye,
  Layers
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  useFusionEngineHealth, 
  EngineHealthStats, 
  CategoryHealth,
  ENGINE_CATEGORIES 
} from '@/hooks/useFusionEngineHealth';

const STATUS_CONFIG = {
  healthy: { 
    icon: CheckCircle2, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Healthy' 
  },
  degraded: { 
    icon: AlertTriangle, 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Degraded' 
  },
  down: { 
    icon: XCircle, 
    color: 'text-destructive', 
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    label: 'Down' 
  },
  unknown: { 
    icon: Clock, 
    color: 'text-muted-foreground', 
    bg: 'bg-muted',
    border: 'border-border',
    label: 'Unknown' 
  },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Core Fusion (v1-v4)': Layers,
  'Data Integration (v5.0)': Network,
  'Advanced Intelligence (v6.0)': Brain,
  'Extreme Intelligence (v7.0)': Eye,
  'Counter-Intelligence (v8.0)': Shield,
  'Psychological Warfare (v8.0)': Target,
  'Biometric & Network (v8.0)': Activity,
  'Doctrine & Prediction (v8.0)': BarChart3,
};

const TREND_ICONS = {
  improving: { icon: TrendingUp, color: 'text-emerald-500' },
  stable: { icon: Minus, color: 'text-muted-foreground' },
  degrading: { icon: TrendingDown, color: 'text-destructive' },
};

export function FusionHealthDashboard() {
  const { 
    engineHealthStats, 
    categoryHealth, 
    systemHealth, 
    isLoading, 
    refresh 
  } = useFusionEngineHealth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (isLoading) {
    return <FusionHealthSkeleton />;
  }

  const filteredEngines = Array.from(engineHealthStats.values()).filter(engine => {
    const matchesSearch = searchQuery === '' || 
      engine.engineType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      engine.analysisType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || engine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SystemHealthCard systemHealth={systemHealth} />
        <MetricCard
          title="Total Engines"
          value={systemHealth.totalEngines}
          subtitle="Active fusion engines"
          icon={Cpu}
        />
        <MetricCard
          title="Success Rate"
          value={`${(systemHealth.overallSuccessRate * 100).toFixed(1)}%`}
          subtitle="Overall success rate"
          icon={Activity}
          trend={systemHealth.overallSuccessRate >= 0.9 ? 'up' : systemHealth.overallSuccessRate >= 0.5 ? 'neutral' : 'down'}
        />
        <MetricCard
          title="Avg Latency"
          value={`${systemHealth.avgLatencyMs}ms`}
          subtitle="Average response time"
          icon={Zap}
          trend={systemHealth.avgLatencyMs < 2000 ? 'up' : systemHealth.avgLatencyMs < 5000 ? 'neutral' : 'down'}
        />
      </div>

      {/* Category Health Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Engine Categories
              </CardTitle>
              <CardDescription>Health status by engine category</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Array.from(categoryHealth.entries()).map(([category, health]) => (
              <CategoryHealthCard
                key={category}
                health={health}
                isSelected={selectedCategory === category}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engine Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Engine Health Details
              </CardTitle>
              <CardDescription>
                {selectedCategory 
                  ? `Showing ${filteredEngines.length} engines in ${selectedCategory}`
                  : `Showing ${filteredEngines.length} of ${systemHealth.totalEngines} engines`
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search engines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              {selectedCategory && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({filteredEngines.length})</TabsTrigger>
              <TabsTrigger value="healthy">
                Healthy ({filteredEngines.filter(e => e.status === 'healthy').length})
              </TabsTrigger>
              <TabsTrigger value="degraded">
                Degraded ({filteredEngines.filter(e => e.status === 'degraded').length})
              </TabsTrigger>
              <TabsTrigger value="issues">
                Issues ({filteredEngines.filter(e => e.status === 'down' || e.lastError).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <EngineGrid engines={filteredEngines} />
            </TabsContent>
            <TabsContent value="healthy">
              <EngineGrid engines={filteredEngines.filter(e => e.status === 'healthy')} />
            </TabsContent>
            <TabsContent value="degraded">
              <EngineGrid engines={filteredEngines.filter(e => e.status === 'degraded')} />
            </TabsContent>
            <TabsContent value="issues">
              <EngineGrid engines={filteredEngines.filter(e => e.status === 'down' || e.lastError)} showErrors />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemHealthCard({ systemHealth }: { systemHealth: ReturnType<typeof useFusionEngineHealth>['systemHealth'] }) {
  const config = STATUS_CONFIG[systemHealth.status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn('border-2', config.border)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          System Health
          <StatusIcon className={cn('h-5 w-5', config.color)} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', config.color)}>{config.label}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {systemHealth.healthyEngines} healthy, {systemHealth.degradedEngines} degraded, {systemHealth.downEngines} down
        </p>
        <div className="mt-3 flex gap-1">
          <div 
            className="h-2 bg-emerald-500 rounded-l" 
            style={{ width: `${(systemHealth.healthyEngines / systemHealth.totalEngines) * 100}%` }}
          />
          <div 
            className="h-2 bg-amber-500" 
            style={{ width: `${(systemHealth.degradedEngines / systemHealth.totalEngines) * 100}%` }}
          />
          <div 
            className="h-2 bg-destructive" 
            style={{ width: `${(systemHealth.downEngines / systemHealth.totalEngines) * 100}%` }}
          />
          <div 
            className="h-2 bg-muted rounded-r" 
            style={{ width: `${(systemHealth.unknownEngines / systemHealth.totalEngines) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ElementType;
  trend?: 'up' | 'neutral' | 'down';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && (
            <span className={cn(
              'text-xs',
              trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function CategoryHealthCard({ 
  health, 
  isSelected, 
  onClick 
}: { 
  health: CategoryHealth; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = STATUS_CONFIG[health.status];
  const StatusIcon = config.icon;
  const CategoryIcon = CATEGORY_ICONS[health.category] || Layers;

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border text-left transition-all w-full',
        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50',
        config.border,
        config.bg
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm truncate">{health.category}</span>
        </div>
        <StatusIcon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Engines:</span>
          <span>{health.engineCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Healthy:</span>
          <span className="text-emerald-500">{health.healthyCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Success:</span>
          <span>{(health.avgSuccessRate * 100).toFixed(0)}%</span>
        </div>
      </div>
    </button>
  );
}

function EngineGrid({ engines, showErrors = false }: { engines: EngineHealthStats[]; showErrors?: boolean }) {
  if (engines.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No engines found matching your criteria
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {engines.map((engine) => (
          <EngineHealthCard key={engine.engineType} engine={engine} showError={showErrors} />
        ))}
      </div>
    </ScrollArea>
  );
}

function EngineHealthCard({ engine, showError = false }: { engine: EngineHealthStats; showError?: boolean }) {
  const statusConfig = STATUS_CONFIG[engine.status];
  const StatusIcon = statusConfig.icon;
  const trendConfig = TREND_ICONS[engine.trend];
  const TrendIcon = trendConfig.icon;

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-colors',
      statusConfig.border,
      statusConfig.bg
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="font-medium text-sm truncate" title={engine.engineType}>
            {engine.engineType}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {engine.analysisType}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <TrendIcon className={cn('h-3 w-3', trendConfig.color)} />
          <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Success Rate</span>
          <span className={cn(
            'font-medium',
            engine.successRate >= 0.9 ? 'text-emerald-500' : 
            engine.successRate >= 0.5 ? 'text-amber-500' : 'text-destructive'
          )}>
            {(engine.successRate * 100).toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={engine.successRate * 100} 
          className="h-1.5"
        />

        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Executions:</span>
            <span>{engine.totalExecutions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Latency:</span>
            <span>{engine.avgLatencyMs}ms</span>
          </div>
        </div>

        {engine.lastExecutedAt && (
          <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
            Last: {formatDistanceToNow(engine.lastExecutedAt, { addSuffix: true })}
          </p>
        )}

        {showError && engine.lastError && (
          <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive line-clamp-2" title={engine.lastError}>
              {engine.lastError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FusionHealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FusionHealthDashboard;
