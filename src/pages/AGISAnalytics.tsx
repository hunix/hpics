import { AppLayout } from '@/components/AppLayout';
import { useAGISAnalytics } from '@/hooks/intelligence/useAGISAnalytics';
import { useAGISCascade } from '@/hooks/intelligence/useAGISCascade';
import { useAGISGlobalState } from '@/hooks/intelligence/useAGISGlobalState';
import { 
  PhasePerformanceChart, 
  ObjectiveCompletionFunnel, 
  OperationHeatmap,
  CascadeFlowDiagram 
} from '@/components/intelligence/phase19/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, Activity, Zap, Clock, Target, Percent } from 'lucide-react';

export default function AGISAnalytics() {
  const { metrics, objectives, phasePerformance, stats, isLoading: analyticsLoading } = useAGISAnalytics();
  const { cascadeEvents, isLoading: cascadeLoading } = useAGISCascade();
  const { globalState, stats: globalStats, isLoading: globalLoading } = useAGISGlobalState();

  const isLoading = analyticsLoading || cascadeLoading || globalLoading;

  return (
    <AppLayout title="AGIS Analytics">
      <div className="container max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AGIS Analytics Dashboard</h1>
            <p className="text-muted-foreground">Cross-phase performance metrics and operational insights</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          ) : (
            <>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Total Metrics</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{stats.totalMetrics}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Active Objectives</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{stats.activeObjectives}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Avg Completion</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{stats.avgCompletion.toFixed(0)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Active Phases</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{globalStats.activePhases}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Overall Health</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{globalStats.overallHealth.toFixed(0)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Cascade Events</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{cascadeEvents.length}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
            </>
          ) : (
            <>
              <PhasePerformanceChart phasePerformance={phasePerformance} />
              <ObjectiveCompletionFunnel objectives={objectives} />
            </>
          )}
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
            </>
          ) : (
            <>
              <OperationHeatmap metrics={metrics} />
              <CascadeFlowDiagram cascadeEvents={cascadeEvents} />
            </>
          )}
        </div>

        {/* Phase Health Grid Summary */}
        {!isLoading && globalState && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phase Health Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-18 gap-2">
                {Object.values(globalState.phaseHealthScores).map(phase => (
                  <div
                    key={phase.phase}
                    className={`p-2 rounded-lg text-center ${
                      phase.status === 'optimal' ? 'bg-green-500/10 border-green-500/30' :
                      phase.status === 'stable' ? 'bg-primary/10 border-primary/30' :
                      phase.status === 'degraded' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-destructive/10 border-destructive/30'
                    } border`}
                    title={`${phase.name}: ${phase.health}%`}
                  >
                    <div className="text-xs font-medium">P{phase.phase}</div>
                    <div className="text-lg font-bold">{phase.health}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
