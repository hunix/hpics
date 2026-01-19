import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Pause, 
  X, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { IntelligenceSession, IntelligenceSessionTask } from '@/hooks/useIntelligenceSession';

interface IntelligenceSessionProgressProps {
  session: IntelligenceSession;
  tasks: IntelligenceSessionTask[];
  onPause: () => void;
  onCancel: () => void;
  onRetryTask: (taskId: string) => void;
  categoryProgress: Record<string, { total: number; completed: number; failed: number }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Intelligence',
  psychological: 'Psychological Operations',
  warfare: 'Advanced Warfare',
  network: 'Network Intelligence',
  temporal: 'Temporal & Quantum',
  meta: 'Meta Intelligence',
  fusion: 'Fusion Intelligence',
};

const CATEGORY_ORDER = ['core', 'psychological', 'warfare', 'network', 'temporal', 'meta', 'fusion'];

export function IntelligenceSessionProgress({
  session,
  tasks,
  onPause,
  onCancel,
  onRetryTask,
  categoryProgress,
}: IntelligenceSessionProgressProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set(['core']));
  
  const overallProgress = session.totalTasks > 0
    ? ((session.completedTasks + session.failedTasks + session.skippedTasks) / session.totalTasks) * 100
    : 0;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const tasksByCategory = React.useMemo(() => {
    const grouped: Record<string, IntelligenceSessionTask[]> = {};
    for (const task of tasks) {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    }
    return grouped;
  }, [tasks]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Generating Intelligence Package
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onPause}>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {session.completedTasks} / {session.totalTasks} completed
              {session.failedTasks > 0 && (
                <span className="text-destructive ml-2">({session.failedTasks} failed)</span>
              )}
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Current category */}
        {session.currentCategory && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Current:</span>
            <Badge variant="outline" className="capitalize">
              {CATEGORY_LABELS[session.currentCategory] || session.currentCategory}
            </Badge>
          </div>
        )}

        {/* Category breakdown */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {CATEGORY_ORDER.map(category => {
              const catProgress = categoryProgress[category];
              if (!catProgress) return null;

              const catTasks = tasksByCategory[category] || [];
              const isExpanded = expandedCategories.has(category);
              const catPercent = catProgress.total > 0 
                ? ((catProgress.completed + catProgress.failed) / catProgress.total) * 100 
                : 0;

              return (
                <Collapsible 
                  key={category} 
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">
                            {CATEGORY_LABELS[category] || category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {catProgress.completed}/{catProgress.total}
                          </span>
                          <div className="w-20">
                            <Progress value={catPercent} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t divide-y">
                        {catTasks.map(task => (
                          <div 
                            key={task.id}
                            className="flex items-center justify-between px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {getTaskStatusIcon(task.status)}
                              <span className={task.status === 'pending' ? 'text-muted-foreground' : ''}>
                                {task.taskName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.processingTimeMs && (
                                <span className="text-xs text-muted-foreground">
                                  {(task.processingTimeMs / 1000).toFixed(1)}s
                                </span>
                              )}
                              {task.status === 'failed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRetryTask(task.id);
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
