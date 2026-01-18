import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  SkipForward,
  AlertTriangle,
  DollarSign,
  Wifi,
  WifiOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { type BulkSession, type BulkAnalysisItem } from "@/hooks/usePersistentBulkSession";
import { formatCost } from "@/lib/bulkAnalysisPrioritization";

interface EnhancedBulkProgressProps {
  session: BulkSession;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryItem: (itemId: string) => void;
  onSkipItem: (itemId: string) => void;
  onRetryAllFailed: () => void;
  isOnline?: boolean;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  queued: { icon: Clock, color: "text-blue-500", label: "Queued" },
  running: { icon: Loader2, color: "text-primary", label: "Processing" },
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Completed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  skipped: { icon: SkipForward, color: "text-amber-500", label: "Skipped" },
};

export function EnhancedBulkProgress({
  session,
  onPause,
  onResume,
  onCancel,
  onRetryItem,
  onSkipItem,
  onRetryAllFailed,
  isOnline = true,
}: EnhancedBulkProgressProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Calculate progress from actual item statuses (more reliable than session counters)
  // CRITICAL: Handle cases where items array might be empty but session counters are accurate
  const hasItemsLoaded = session.items.length > 0;
  
  const completedItems = useMemo(() => 
    session.items.filter((item) => item.status === "completed"),
    [session.items]
  );

  const failedItems = useMemo(() => 
    session.items.filter((item) => item.status === "failed"),
    [session.items]
  );

  const skippedItems = useMemo(() => 
    session.items.filter((item) => item.status === "skipped"),
    [session.items]
  );

  const runningItems = useMemo(() => 
    session.items.filter((item) => item.status === "running"),
    [session.items]
  );

  // SMART PROGRESS: Use item-derived counts when items are loaded, 
  // otherwise fall back to session counters (which backend updates directly)
  const completedCount = hasItemsLoaded 
    ? completedItems.length 
    : session.completedItems;
  const failedCount = hasItemsLoaded 
    ? failedItems.length 
    : session.failedItems;
  const skippedCount = hasItemsLoaded 
    ? skippedItems.length 
    : session.skippedItems;
  
  const processed = completedCount + failedCount + skippedCount;
  const progress = session.totalItems > 0 ? (processed / session.totalItems) * 100 : 0;

  // Indicate if progress is being derived from session counters (items not yet loaded)
  const isProgressFromCounters = !hasItemsLoaded && processed > 0;

  const currentItem = useMemo(() => 
    session.items.find((item) => item.status === "running"),
    [session.items]
  );

  // Calculate ETA
  const eta = useMemo(() => {
    if (completedItems.length < 2) return null;
    
    const avgTime = completedItems.reduce((sum, item) => 
      sum + (item.processingTimeMs || 0), 0) / completedItems.length;
    
    const remaining = session.totalItems - processed;
    const etaMs = avgTime * remaining;
    
    if (etaMs <= 0) return null;
    
    const etaDate = new Date(Date.now() + etaMs);
    return formatDistanceToNow(etaDate, { addSuffix: true });
  }, [completedItems, session.totalItems, processed]);

  // Calculate throughput
  const throughput = useMemo(() => {
    if (!session.startedAt || completedItems.length === 0) return null;
    
    const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
    const elapsedMinutes = elapsedMs / 60000;
    
    if (elapsedMinutes < 0.1) return null;
    
    return (completedItems.length / elapsedMinutes).toFixed(1);
  }, [session.startedAt, completedItems.length]);

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{session.name || "Bulk Analysis"}</CardTitle>
            <Badge
              variant={
                session.status === "running"
                  ? "default"
                  : session.status === "completed"
                  ? "secondary"
                  : session.status === "failed"
                  ? "destructive"
                  : "outline"
              }
            >
              {session.status}
            </Badge>
            {!isOnline && (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {session.status === "running" && (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {session.status === "paused" && (
              <Button size="sm" onClick={onResume} disabled={!isOnline}>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
            {["running", "paused"].includes(session.status) && (
              <Button size="sm" variant="destructive" onClick={onCancel}>
                <Square className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            {failedItems.length > 0 && session.status !== "running" && (
              <Button size="sm" variant="outline" onClick={onRetryAllFailed} disabled={!isOnline}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry Failed ({failedItems.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {processed} of {session.totalItems} processed
              {runningItems.length > 0 && (
                <span className="ml-2 text-primary">
                  ({runningItems.length} in progress)
                </span>
              )}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Progress loading indicator for initialization */}
          {(session.status === "running" || session.status === "pending") && !hasItemsLoaded && processed === 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>
                {session.status === "pending" 
                  ? `Preparing ${session.totalItems} items for analysis...`
                  : "Initializing analysis pipeline..."}
              </span>
            </div>
          )}
          
          {isProgressFromCounters && (
            <div className="text-xs text-muted-foreground italic">
              Progress synced from backend
            </div>
          )}
          
          {/* Stats row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {completedCount} completed
              </span>
              {failedCount > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-destructive" />
                  {failedCount} failed
                </span>
              )}
              {skippedCount > 0 && (
                <span className="flex items-center gap-1">
                  <SkipForward className="h-3 w-3 text-amber-500" />
                  {skippedCount} skipped
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {throughput && (
                <span>{throughput} items/min</span>
              )}
              {eta && session.status === "running" && (
                <span>ETA: {eta}</span>
              )}
            </div>
          </div>
        </div>

        {/* Cost tracking */}
        {(session.currentCostCents > 0 || session.maxCostCents) && (
          <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Cost: {formatCost(session.currentCostCents)}</span>
            </div>
            {session.maxCostCents && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Budget: {formatCost(session.maxCostCents)}
                </span>
                {session.currentCostCents >= session.maxCostCents * 0.8 && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Current item */}
        {currentItem && (
          <div className="p-3 rounded-md border bg-muted/30">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Processing:</span>
              <span className="text-sm text-muted-foreground truncate">
                {currentItem.fileName || `Item ${currentItem.queuePosition + 1}`}
              </span>
            </div>
          </div>
        )}

        {/* Failed items summary */}
        {failedItems.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">{failedItems.length} failed items</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[150px] mt-2">
                <div className="space-y-2">
                  {failedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-md border text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">
                          {item.fileName || `Item ${item.queuePosition + 1}`}
                        </p>
                        <p className="text-xs text-destructive truncate">
                          {item.errorMessage || "Unknown error"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => onRetryItem(item.id)}
                          disabled={!isOnline}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => onSkipItem(item.id)}
                        >
                          <SkipForward className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* All items list */}
        <Collapsible open={showAllItems} onOpenChange={setShowAllItems}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>All Items ({session.items.length})</span>
              {showAllItems ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="h-[300px] mt-2">
              <div className="space-y-1">
                {session.items.map((item, index) => {
                  const config = statusConfig[item.status];
                  const Icon = config.icon;
                  const isExpanded = expandedItems.has(item.id);

                  return (
                    <div key={item.id}>
                      <div
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleItemExpanded(item.id)}
                      >
                        <Icon
                          className={`h-4 w-4 ${config.color} ${
                            item.status === "running" ? "animate-spin" : ""
                          }`}
                        />
                        <span className="flex-1 truncate text-sm">
                          {item.fileName || `Item ${index + 1}`}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.mediaType}
                        </Badge>
                        {item.actualCostCents && (
                          <span className="text-xs text-muted-foreground">
                            {formatCost(item.actualCostCents)}
                          </span>
                        )}
                      </div>
                      
                      {isExpanded && item.result && (
                        <div className="ml-6 p-2 text-xs bg-muted/30 rounded-md mb-1">
                          <pre className="whitespace-pre-wrap overflow-hidden">
                            {JSON.stringify(item.result, null, 2).slice(0, 500)}
                            {JSON.stringify(item.result).length > 500 && "..."}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* Session completed summary */}
        {session.status === "completed" && session.aggregationResult && (
          <div className="p-3 rounded-md border bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-sm">Analysis Complete</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {(session.aggregationResult as { totalItemsAnalyzed?: number }).totalItemsAnalyzed || completedCount} items analyzed across{" "}
              {(session.aggregationResult as { contactCount?: number }).contactCount || 1} contact(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
