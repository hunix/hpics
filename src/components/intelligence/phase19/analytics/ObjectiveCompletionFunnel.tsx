import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ObjectiveTracking } from '@/hooks/intelligence/useAGISAnalytics';
import { getPhaseConfig } from '@/lib/agis/phaseConfig';
import { Target, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface ObjectiveCompletionFunnelProps {
  objectives: ObjectiveTracking[];
  className?: string;
}

export function ObjectiveCompletionFunnel({ objectives, className }: ObjectiveCompletionFunnelProps) {
  const funnelData = useMemo(() => {
    const phaseGroups: Record<number, { total: number; completed: number; inProgress: number; blocked: number }> = {};
    
    for (let i = 1; i <= 18; i++) {
      phaseGroups[i] = { total: 0, completed: 0, inProgress: 0, blocked: 0 };
    }
    
    objectives.forEach(obj => {
      const phase = obj.currentPhase;
      if (phaseGroups[phase]) {
        phaseGroups[phase].total++;
        if (obj.completionPercentage >= 100) {
          phaseGroups[phase].completed++;
        } else if (obj.blockers.length > 0) {
          phaseGroups[phase].blocked++;
        } else {
          phaseGroups[phase].inProgress++;
        }
      }
    });
    
    return Object.entries(phaseGroups)
      .filter(([_, data]) => data.total > 0)
      .map(([phase, data]) => ({
        phase: Number(phase),
        name: getPhaseConfig(Number(phase))?.name || `Phase ${phase}`,
        ...data,
        completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0
      }));
  }, [objectives]);

  const totalStats = useMemo(() => ({
    total: objectives.length,
    completed: objectives.filter(o => o.completionPercentage >= 100).length,
    active: objectives.filter(o => o.isActive && o.completionPercentage < 100).length,
    blocked: objectives.filter(o => o.blockers.length > 0).length,
  }), [objectives]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Objective Completion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{totalStats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{totalStats.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10">
            <div className="text-2xl font-bold text-green-500">{totalStats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="p-2 rounded-lg bg-destructive/10">
            <div className="text-2xl font-bold text-destructive">{totalStats.blocked}</div>
            <div className="text-xs text-muted-foreground">Blocked</div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {funnelData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No objectives tracked yet
            </div>
          ) : (
            funnelData.map(item => (
              <div key={item.phase} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex-1">{item.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {item.completed}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {item.inProgress}
                    </span>
                    {item.blocked > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        {item.blocked}
                      </span>
                    )}
                  </div>
                </div>
                <Progress value={item.completionRate} className="h-2" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
