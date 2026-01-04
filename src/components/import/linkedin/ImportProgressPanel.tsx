import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Loader2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface ImportError {
  rowIndex: number;
  name: string;
  error: string;
}

interface ImportProgressPanelProps {
  isImporting: boolean;
  total: number;
  processed: number;
  successCount: number;
  failedCount: number;
  errors: ImportError[];
}

export function ImportProgressPanel({
  isImporting,
  total,
  processed,
  successCount,
  failedCount,
  errors
}: ImportProgressPanelProps) {
  const [showErrors, setShowErrors] = useState(false);
  const progress = total > 0 ? (processed / total) * 100 : 0;
  const isComplete = processed >= total && !isImporting;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isComplete ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : null}
          {isImporting ? 'Importing...' : isComplete ? 'Import Complete' : 'Import Progress'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{processed} of {total} processed</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
        
        {/* Counters */}
        <div className="flex gap-4">
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {successCount} imported
          </Badge>
          {failedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              {failedCount} failed
            </Badge>
          )}
        </div>
        
        {/* Error details */}
        {errors.length > 0 && (
          <Collapsible open={showErrors} onOpenChange={setShowErrors}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80">
              <ChevronDown className={`h-4 w-4 transition-transform ${showErrors ? '' : '-rotate-90'}`} />
              View Failed Imports ({errors.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-destructive/5 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {errors.map((err, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{err.name}:</span>{' '}
                    <span className="text-muted-foreground">{err.error}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Success message */}
        {isComplete && failedCount === 0 && successCount > 0 && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              All contacts imported successfully!
            </div>
          </div>
        )}
        
        {/* Partial success */}
        {isComplete && failedCount > 0 && successCount > 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              {successCount} contacts imported, {failedCount} failed
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
