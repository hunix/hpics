import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Play, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { type BulkSession } from "@/hooks/usePersistentBulkSession";

interface BulkSessionRecoveryProps {
  session: BulkSession;
  onResume: () => void;
  onDiscard: () => void;
}

export function BulkSessionRecovery({ session, onResume, onDiscard }: BulkSessionRecoveryProps) {
  const [isDiscarding, setIsDiscarding] = useState(false);

  const progress = session.totalItems > 0 
    ? ((session.completedItems + session.failedItems + session.skippedItems) / session.totalItems) * 100 
    : 0;

  const handleDiscard = async () => {
    setIsDiscarding(true);
    try {
      await onDiscard();
    } finally {
      setIsDiscarding(false);
    }
  };

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-sm">
                  {session.status === "paused" ? "Paused Session Found" : "Interrupted Session Detected"}
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {session.name || "Bulk Analysis Session"}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscard}
                  disabled={isDiscarding}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Discard
                </Button>
                <Button size="sm" onClick={onResume}>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              </div>
            </div>

            {/* Progress info */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    Started {session.startedAt 
                      ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })
                      : "recently"}
                  </span>
                </div>
                <span>
                  {session.completedItems} of {session.totalItems} completed
                  {session.failedItems > 0 && ` (${session.failedItems} failed)`}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Session details */}
            <div className="mt-2 flex flex-wrap gap-2">
              {session.mediaTypes.map((type) => (
                <span 
                  key={type}
                  className="px-2 py-0.5 rounded-full bg-muted text-xs capitalize"
                >
                  {type}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                {session.analysisModes.length} mode{session.analysisModes.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
