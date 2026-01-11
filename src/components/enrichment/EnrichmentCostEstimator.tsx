import { Progress } from '@/components/ui/progress';
import { DollarSign, AlertTriangle } from 'lucide-react';

interface EnrichmentCostEstimatorProps {
  selectedSources: string[];
  availableSources: Array<{
    id: string;
    name: string;
    costCents: number;
    isAvailable: boolean;
  }>;
  maxBudget: number;
}

export function EnrichmentCostEstimator({
  selectedSources,
  availableSources,
  maxBudget,
}: EnrichmentCostEstimatorProps) {
  const selectedDetails = selectedSources
    .map(id => availableSources.find(s => s.id === id))
    .filter(Boolean);

  const totalCost = selectedDetails.reduce((sum, s) => sum + (s?.costCents || 0), 0);
  const budgetPercent = Math.min((totalCost / maxBudget) * 100, 100);
  const isOverBudget = totalCost > maxBudget;

  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Cost Estimate</span>
        </div>
        <span className={`text-sm font-bold ${isOverBudget ? 'text-destructive' : ''}`}>
          ${(totalCost / 100).toFixed(2)} / ${(maxBudget / 100).toFixed(2)}
        </span>
      </div>

      <Progress value={budgetPercent} className={isOverBudget ? '[&>div]:bg-destructive' : ''} />

      {isOverBudget && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          <span>Estimated cost exceeds budget. Some sources may be skipped.</span>
        </div>
      )}

      {selectedDetails.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Breakdown:</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {selectedDetails.map(source => (
              <div key={source?.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">{source?.name}</span>
                <span>${((source?.costCents || 0) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSources.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Select sources to see cost estimate
        </p>
      )}
    </div>
  );
}
