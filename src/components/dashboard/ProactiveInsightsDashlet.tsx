import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProactiveInsights, type ProactiveInsight } from '@/hooks/useProactiveInsights';
import { Lightbulb, X, Eye, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

const priorityStyles: Record<string, string> = {
  critical: 'border-destructive/50 bg-destructive/5',
  high: 'border-orange-500/50 bg-orange-500/5',
  medium: 'border-primary/30 bg-primary/5',
  low: 'border-muted bg-muted/30',
};

const priorityBadge: Record<string, 'destructive' | 'outline' | 'secondary' | 'default'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'outline',
  low: 'secondary',
};

export function ProactiveInsightsDashlet() {
  const {
    insights,
    isLoading,
    counts,
    dismissInsight,
    markAsViewed,
    snoozeInsight,
    generateInsights,
  } = useProactiveInsights({ status: ['pending'] });

  const pendingInsights = insights.filter(i => i.status === 'pending').slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-primary" />
            Proactive Insights
            {counts.total > 0 && (
              <Badge variant="secondary" className="text-xs">{counts.total}</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => generateInsights()} className="h-7">
            <RefreshCw className="h-3 w-3 mr-1" />
            Generate
          </Button>
        </div>
        {counts.critical > 0 && (
          <CardDescription className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {counts.critical} critical insight{counts.critical > 1 ? 's' : ''} pending
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading insights...</p>
        ) : pendingInsights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending insights. Click Generate to analyze your data.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg border ${priorityStyles[insight.priority] ?? priorityStyles.low}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={priorityBadge[insight.priority] ?? 'secondary'} className="text-[10px] px-1.5 py-0">
                        {insight.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{insight.category}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{insight.title}</p>
                    {insight.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => markAsViewed(insight.id)}
                      title="Mark as viewed"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => snoozeInsight(insight.id, 60)}
                      title="Snooze 1 hour"
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => dismissInsight(insight.id)}
                      title="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
