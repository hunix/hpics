import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Divide, Zap, XCircle, Loader2 } from "lucide-react";

export interface MosaicFailureState {
  isOpen: boolean;
  error: string;
  failedBatchSize: number;
  remainingImages: number;
  retryCount: number;
  maxRetries: number;
}

interface MosaicFailureDialogProps {
  state: MosaicFailureState;
  onRetry: () => void;
  onRetrySmaller: () => void;
  onSwitchIndividual: () => void;
  onAbort: () => void;
}

export function MosaicFailureDialog({
  state,
  onRetry,
  onRetrySmaller,
  onAbort,
  onSwitchIndividual,
}: MosaicFailureDialogProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (action: string, callback: () => void) => {
    setIsLoading(action);
    try {
      await callback();
    } finally {
      setIsLoading(null);
    }
  };

  // Estimate costs
  const mosaicCost = Math.ceil(state.failedBatchSize * 0.15); // ~$0.0015/image via mosaic
  const individualCost = Math.ceil(state.failedBatchSize * 1.0); // ~$0.01/image individual
  const costIncrease = ((individualCost - mosaicCost) / mosaicCost * 100).toFixed(0);

  return (
    <AlertDialog open={state.isOpen}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Mosaic Processing Failed
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="text-sm">
              The mosaic batch of <strong>{state.failedBatchSize} images</strong> failed after{" "}
              <strong>{state.retryCount}/{state.maxRetries}</strong> attempts.
            </p>
            
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-mono">
              {state.error}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded bg-muted">
                <div className="text-muted-foreground">Mosaic (failed)</div>
                <div className="font-semibold">~${(mosaicCost / 100).toFixed(2)}</div>
              </div>
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                <div className="text-muted-foreground">Individual</div>
                <div className="font-semibold text-amber-600">
                  ~${(individualCost / 100).toFixed(2)}
                  <Badge variant="outline" className="ml-1 text-xs">+{costIncrease}%</Badge>
                </div>
              </div>
            </div>

            {state.remainingImages > state.failedBatchSize && (
              <p className="text-xs text-muted-foreground">
                {state.remainingImages - state.failedBatchSize} more images waiting after this batch.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleAction("abort", onAbort)}
              disabled={!!isLoading}
              className="gap-2"
            >
              {isLoading === "abort" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Abort Session
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleAction("individual", onSwitchIndividual)}
              disabled={!!isLoading}
              className="gap-2 text-amber-600 hover:text-amber-700"
            >
              {isLoading === "individual" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Switch to Individual
            </Button>

            {state.failedBatchSize > 16 && (
              <Button
                variant="secondary"
                onClick={() => handleAction("smaller", onRetrySmaller)}
                disabled={!!isLoading}
                className="gap-2"
              >
                {isLoading === "smaller" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Divide className="h-4 w-4" />}
                Retry Smaller (16)
              </Button>
            )}

            <Button
              onClick={() => handleAction("retry", onRetry)}
              disabled={!!isLoading}
              className="gap-2"
            >
              {isLoading === "retry" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Retry Mosaic
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
