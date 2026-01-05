import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, DollarSign, Zap, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { AIConfirmationState } from '@/hooks/useAIConfirmation';
import { AI_MODEL_PRICING, formatCentsToUSD, getProviderColor } from '@/lib/aiPricing';
import { useAIBudget } from '@/hooks/useAIBudget';

interface AIConfirmationDialogProps {
  state: AIConfirmationState;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function AIConfirmationDialog({
  state,
  onConfirm,
  onCancel,
}: AIConfirmationDialogProps) {
  const { isOpen, config, estimatedInputTokens, estimatedOutputTokens, estimatedCostCents } = state;
  const budget = useAIBudget();
  const [isConfirming, setIsConfirming] = useState(false);

  if (!config) return null;

  const pricing = AI_MODEL_PRICING[config.modelKey];
  const providerColor = getProviderColor(pricing?.provider || 'unknown');
  const budgetWarning = budget.wouldExceedBudget(estimatedCostCents);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  // Only allow cancel via the cancel button, not via backdrop click during confirmation
  const handleOpenChange = (open: boolean) => {
    if (!open && !isConfirming) {
      onCancel();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Confirm AI Analysis
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                You are about to run an AI analysis. Please review the estimated costs below.
              </p>

              {/* Budget Warning */}
              {budgetWarning.exceeds && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will exceed your {budgetWarning.period} budget. 
                    You can still proceed, but consider adjusting your limits in Settings.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Function</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {config.functionName}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Model</span>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${providerColor}`} />
                    <span className="text-sm">{pricing?.displayName || config.modelKey}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Input Tokens</span>
                  </div>
                  <span className="text-sm font-mono">~{estimatedInputTokens.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Output Tokens (est.)</span>
                  </div>
                  <span className="text-sm font-mono">~{estimatedOutputTokens.toLocaleString()}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Estimated Cost</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCentsToUSD(estimatedCostCents)}
                  </span>
                </div>

                {/* Budget remaining info */}
                {budget.monthly.budget !== null && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Monthly budget remaining</span>
                    <span>{formatCentsToUSD(budget.monthly.remaining || 0)}</span>
                  </div>
                )}
              </div>

              {pricing?.provider === 'local' && (
                <p className="text-xs text-muted-foreground italic">
                  * Local models have no API cost but may use local compute resources.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isConfirming}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Run Analysis'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
