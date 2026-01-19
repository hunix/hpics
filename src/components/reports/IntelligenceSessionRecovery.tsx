import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2 
} from 'lucide-react';
import type { IntelligenceSession, IntelligenceSessionTask } from '@/hooks/useIntelligenceSession';

interface IntelligenceSessionRecoveryProps {
  session: IntelligenceSession;
  tasks: IntelligenceSessionTask[];
  onResume: () => void;
  onDiscard: () => void;
  onRetryFailed?: () => void;
  isResuming?: boolean;
}

export function IntelligenceSessionRecovery({
  session,
  tasks,
  onResume,
  onDiscard,
  onRetryFailed,
  isResuming = false,
}: IntelligenceSessionRecoveryProps) {
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const runningCount = tasks.filter(t => t.status === 'running').length;
  
  const progress = session.totalTasks > 0 
    ? ((completedCount + failedCount) / session.totalTasks) * 100 
    : 0;

  const getStatusBadge = () => {
    switch (session.status) {
      case 'running':
        return <Badge variant="default" className="animate-pulse">Running</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{session.status}</Badge>;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const isStale = session.status === 'running' && runningCount === 0 && pendingCount > 0;

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {session.status === 'running' && !isStale ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : session.status === 'paused' || isStale ? (
              <Pause className="h-5 w-5 text-amber-500" />
            ) : session.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            {isStale ? 'Interrupted Session Detected' : 'Active Intelligence Session'}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{completedCount + failedCount} / {session.totalTasks} tasks</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-green-500/10">
            <div className="text-lg font-bold text-green-500">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="p-2 rounded bg-destructive/10">
            <div className="text-lg font-bold text-destructive">{failedCount}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="p-2 rounded bg-amber-500/10">
            <div className="text-lg font-bold text-amber-500">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="p-2 rounded bg-primary/10">
            <div className="text-lg font-bold text-primary">{runningCount}</div>
            <div className="text-xs text-muted-foreground">Running</div>
          </div>
        </div>

        {/* Session info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Started: {formatTime(session.startedAt)}
          </div>
          {session.pausedAt && (
            <div className="flex items-center gap-1">
              <Pause className="h-3 w-3" />
              Paused: {formatTime(session.pausedAt)}
            </div>
          )}
          {session.currentCategory && (
            <div>Current category: <span className="capitalize">{session.currentCategory}</span></div>
          )}
        </div>

        {/* Stale warning */}
        {isStale && (
          <div className="flex items-start gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-600">Session appears interrupted</p>
              <p className="text-muted-foreground text-xs mt-1">
                No tasks are currently running. This may have been caused by a browser refresh or network interruption.
                You can resume to continue from where it stopped.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {(session.status === 'paused' || isStale) && (
            <Button 
              onClick={onResume} 
              disabled={isResuming}
              className="flex-1"
            >
              {isResuming ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Resume
            </Button>
          )}
          
          {failedCount > 0 && onRetryFailed && (
            <Button 
              variant="outline" 
              onClick={onRetryFailed}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Failed ({failedCount})
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            onClick={onDiscard}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
