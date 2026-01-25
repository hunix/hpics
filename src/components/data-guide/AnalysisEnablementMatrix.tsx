/**
 * AnalysisEnablementMatrix Component (v4.0)
 * Visual matrix showing which data sources unlock which analyses
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANALYSIS_REQUIREMENTS } from '@/hooks/useDataCollectionStatus';
import type { DataCategory } from '@/hooks/useDataCollectionStatus';

interface AnalysisEnablementMatrixProps {
  categories: DataCategory[];
  className?: string;
}

export function AnalysisEnablementMatrix({ categories, className }: AnalysisEnablementMatrixProps) {
  const completeCategoryIds = new Set(categories.filter(c => c.isComplete).map(c => c.id));

  const analysisStatus = Object.entries(ANALYSIS_REQUIREMENTS).map(([name, requirements]) => {
    const isUnlocked = requirements.every(req => completeCategoryIds.has(req));
    const satisfiedCount = requirements.filter(req => completeCategoryIds.has(req)).length;
    return {
      name,
      requirements,
      isUnlocked,
      satisfiedCount,
      totalRequired: requirements.length,
    };
  });

  const unlockedCount = analysisStatus.filter(a => a.isUnlocked).length;
  const lockedCount = analysisStatus.filter(a => !a.isUnlocked).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Analysis Enablement Matrix
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/50">
              <Unlock className="w-3 h-3" />
              {unlockedCount} Unlocked
            </Badge>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Lock className="w-3 h-3" />
              {lockedCount} Locked
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {analysisStatus.map((analysis) => (
            <div
              key={analysis.name}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                analysis.isUnlocked
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-muted/30 border-border'
              )}
            >
              <div className="flex items-center gap-3">
                {analysis.isUnlocked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={cn(
                  'font-medium text-sm',
                  analysis.isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {analysis.name}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {analysis.requirements.map((req) => {
                    const category = categories.find(c => c.id === req);
                    const isSatisfied = completeCategoryIds.has(req);
                    return (
                      <Badge
                        key={req}
                        variant={isSatisfied ? 'default' : 'outline'}
                        className={cn(
                          'text-xs',
                          isSatisfied 
                            ? 'bg-primary/80' 
                            : 'text-muted-foreground border-muted-foreground/30'
                        )}
                      >
                        {category?.name || req}
                      </Badge>
                    );
                  })}
                </div>
                <span className={cn(
                  'text-xs font-medium min-w-[40px] text-right',
                  analysis.isUnlocked ? 'text-emerald-600' : 'text-muted-foreground'
                )}>
                  {analysis.satisfiedCount}/{analysis.totalRequired}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Data Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
            <span>Data Missing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Analysis Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Requires More Data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
