import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CascadeEvent } from '@/hooks/intelligence/useAGISCascade';
import { getPhaseConfig } from '@/lib/agis/phaseConfig';
import { GitBranch, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CascadeFlowDiagramProps {
  cascadeEvents: CascadeEvent[];
  className?: string;
}

export function CascadeFlowDiagram({ cascadeEvents, className }: CascadeFlowDiagramProps) {
  const recentCascades = useMemo(() => {
    return cascadeEvents
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 10);
  }, [cascadeEvents]);

  const cascadeStats = useMemo(() => ({
    total: cascadeEvents.length,
    completed: cascadeEvents.filter(c => c.outcomeStatus === 'completed').length,
    failed: cascadeEvents.filter(c => c.outcomeStatus === 'failed').length,
    pending: cascadeEvents.filter(c => c.outcomeStatus === 'pending').length,
  }), [cascadeEvents]);

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Cascade Event Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{cascadeStats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10">
            <div className="text-xl font-bold text-green-500">{cascadeStats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="p-2 rounded-lg bg-destructive/10">
            <div className="text-xl font-bold text-destructive">{cascadeStats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <div className="text-xl font-bold text-primary">{cascadeStats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Recent Cascade Events */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {recentCascades.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No cascade events yet
            </div>
          ) : (
            recentCascades.map(cascade => (
              <div
                key={cascade.id}
                className="flex items-center gap-2 p-2 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                {getStatusIcon(cascade.outcomeStatus)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {getPhaseConfig(cascade.triggerPhase)?.name || `Phase ${cascade.triggerPhase}`}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground truncate">
                      {cascade.affectedPhases?.map(p => `P${p}`).join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cascade.triggerEventType} • {formatDistanceToNow(new Date(cascade.createdAt ?? Date.now()), { addSuffix: true })}
                  </div>
                </div>

                <Badge variant={getStatusBadgeVariant(cascade.outcomeStatus)}>
                  {cascade.outcomeStatus || 'pending'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
