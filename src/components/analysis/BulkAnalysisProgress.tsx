import { 
  Pause, 
  Play, 
  X, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  SkipForward, 
  Loader2,
  AlertTriangle,
  Clock,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { BulkAnalysisSession, BulkAnalysisItem, BulkItemStatus } from '@/hooks/useBulkAnalysisSession';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface BulkAnalysisProgressProps {
  session: BulkAnalysisSession;
  currentItemIndex: number;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryItem: (itemId: string) => void;
  onSkipItem: (itemId: string) => void;
  onRetryAllFailed: () => void;
  onClear: () => void;
}

const statusConfig: Record<BulkItemStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
  running: { icon: Loader2, color: 'text-primary', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'Failed' },
  skipped: { icon: SkipForward, color: 'text-muted-foreground', label: 'Skipped' },
};

export function BulkAnalysisProgress({
  session,
  currentItemIndex,
  onPause,
  onResume,
  onCancel,
  onRetryItem,
  onSkipItem,
  onRetryAllFailed,
  onClear,
}: BulkAnalysisProgressProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  
  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';
  const isCompleted = session.status === 'completed';
  const hasFailed = session.failedCount > 0;

  const overallProgress = session.totalCount > 0 
    ? ((session.completedCount + (session.items.filter(i => i.status === 'skipped').length)) / session.totalCount) * 100
    : 0;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentItem = session.items[currentItemIndex];
  const failedItems = session.items.filter(i => i.status === 'failed');
  const completedItems = session.items.filter(i => i.status === 'completed');

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isRunning && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {isPaused && <Pause className="h-5 w-5 text-yellow-500" />}
            {isCompleted && <FileCheck className="h-5 w-5 text-green-500" />}
            {hasFailed && !isCompleted && <AlertTriangle className="h-5 w-5 text-destructive" />}
            Bulk Analysis
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {isRunning && (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {isPaused && (
              <Button size="sm" variant="default" onClick={onResume}>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
            {(isPaused || hasFailed) && failedItems.length > 0 && (
              <Button size="sm" variant="outline" onClick={onRetryAllFailed}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry Failed ({failedItems.length})
              </Button>
            )}
            {!isRunning && (
              <Button size="sm" variant="ghost" onClick={isCompleted ? onClear : onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {session.completedCount} / {session.totalCount} completed
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {session.completedCount} completed
            </span>
            {session.failedCount > 0 && (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-destructive" />
                {session.failedCount} failed
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {session.totalCount - session.completedCount - session.failedCount - session.items.filter(i => i.status === 'skipped').length} remaining
            </span>
          </div>
        </div>

        {/* Current Item */}
        {currentItem && isRunning && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="font-medium text-sm">Currently processing:</span>
            </div>
            <p className="text-sm truncate">{currentItem.name}</p>
            <Progress value={currentItem.progress} className="h-1.5 mt-2" />
          </div>
        )}

        {/* Failed Items (always visible if any) */}
        {failedItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed Items ({failedItems.length})
            </h4>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2 pr-4">
                {failedItems.map((item) => (
                  <FailedItemRow
                    key={item.id}
                    item={item}
                    onRetry={() => onRetryItem(item.id)}
                    onSkip={() => onSkipItem(item.id)}
                    isDisabled={isRunning}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* All Items List (collapsible) */}
        <Collapsible open={showAllItems} onOpenChange={setShowAllItems}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {showAllItems ? 'Hide' : 'Show'} all items ({session.totalCount})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="h-[300px] mt-2">
              <div className="space-y-1 pr-4">
                {session.items.map((item, index) => (
                  <ItemRow key={item.id} item={item} index={index} />
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* Completed Summary */}
        {isCompleted && (
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Analysis Complete!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Successfully analyzed {session.completedCount} items.
              {session.failedCount > 0 && ` ${session.failedCount} items failed.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ItemRow({ item, index }: { item: BulkAnalysisItem; index: number }) {
  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-sm">
      <span className="text-muted-foreground w-6 text-right">{index + 1}.</span>
      <Icon className={cn(
        "h-4 w-4 flex-shrink-0",
        config.color,
        item.status === 'running' && 'animate-spin'
      )} />
      <span className="flex-1 truncate">{item.name}</span>
      <Badge 
        variant={item.status === 'completed' ? 'default' : item.status === 'failed' ? 'destructive' : 'outline'}
        className="text-xs"
      >
        {config.label}
      </Badge>
    </div>
  );
}

function FailedItemRow({ 
  item, 
  onRetry, 
  onSkip,
  isDisabled 
}: { 
  item: BulkAnalysisItem; 
  onRetry: () => void; 
  onSkip: () => void;
  isDisabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-destructive/5 border border-destructive/20">
      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        {item.errorMessage && (
          <p className="text-xs text-destructive truncate">{item.errorMessage}</p>
        )}
        {item.retryCount > 0 && (
          <p className="text-xs text-muted-foreground">Retry attempts: {item.retryCount}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7" 
          onClick={onRetry}
          disabled={isDisabled}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7" 
          onClick={onSkip}
          disabled={isDisabled}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
