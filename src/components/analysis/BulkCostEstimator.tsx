import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle, Image, Video, AudioLines, FileText } from "lucide-react";
import { type CostEstimate, formatCost } from "@/lib/bulkAnalysisPrioritization";

interface BulkCostEstimatorProps {
  estimate: CostEstimate;
  maxBudget?: number;
  currentSpent?: number;
}

const mediaTypeIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: AudioLines,
  document: FileText,
};

export function BulkCostEstimator({ estimate, maxBudget, currentSpent = 0 }: BulkCostEstimatorProps) {
  const budgetPercentage = maxBudget ? (currentSpent / maxBudget) * 100 : 0;
  const estimatedPercentage = maxBudget ? (estimate.totalCents / maxBudget) * 100 : 0;
  const isOverBudget = maxBudget && estimate.totalCents > maxBudget;
  const isNearBudget = maxBudget && estimate.totalCents > maxBudget * 0.8;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Cost Estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total estimate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Estimated total</span>
          <span className="text-lg font-semibold">{formatCost(estimate.totalCents)}</span>
        </div>

        {/* Breakdown by media type */}
        <div className="space-y-2">
          {estimate.breakdown.map((item) => {
            const Icon = mediaTypeIcons[item.mediaType] || FileText;
            return (
              <div key={item.mediaType} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="capitalize">{item.mediaType}</span>
                  <Badge variant="secondary" className="text-xs">
                    {item.count}
                  </Badge>
                </div>
                <span className="text-muted-foreground">{formatCost(item.estimatedCents)}</span>
              </div>
            );
          })}
        </div>

        {/* Budget progress if set */}
        {maxBudget && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget</span>
              <span>{formatCost(maxBudget)}</span>
            </div>
            <Progress 
              value={Math.min(estimatedPercentage, 100)} 
              className={isOverBudget ? "[&>div]:bg-destructive" : isNearBudget ? "[&>div]:bg-amber-500" : ""}
            />
            {currentSpent > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Already spent: {formatCost(currentSpent)}</span>
                <span>{budgetPercentage.toFixed(0)}% used</span>
              </div>
            )}
          </div>
        )}

        {/* Warnings */}
        {isOverBudget && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Estimated cost exceeds budget by {formatCost(estimate.totalCents - maxBudget)}</span>
          </div>
        )}

        {isNearBudget && !isOverBudget && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Estimated cost is near budget limit</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
