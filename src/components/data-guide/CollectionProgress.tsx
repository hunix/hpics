/**
 * CollectionProgress Component (v4.0)
 * Overall progress visualization with category breakdown
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataCollectionStatus } from '@/hooks/useDataCollectionStatus';

interface CollectionProgressProps {
  status: DataCollectionStatus;
  className?: string;
}

export function CollectionProgress({ status, className }: CollectionProgressProps) {
  const { overallScore, analysesUnlocked, totalAnalyses, categoryBreakdown, categories } = status;

  const getScoreColor = () => {
    if (overallScore >= 80) return 'text-emerald-500';
    if (overallScore >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = () => {
    if (overallScore >= 80) return 'bg-emerald-500';
    if (overallScore >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getScoreLabel = () => {
    if (overallScore >= 80) return 'Excellent Coverage';
    if (overallScore >= 60) return 'Good Coverage';
    if (overallScore >= 40) return 'Partial Coverage';
    return 'Needs Data';
  };

  // Group categories by priority
  const criticalMissing = categories.filter(c => c.priority === 'critical' && !c.isComplete);
  const highMissing = categories.filter(c => c.priority === 'high' && !c.isComplete);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Score Card */}
      <Card className="bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Intelligence Coverage Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Circular Progress */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(overallScore / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className={getScoreColor()}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-2xl font-bold', getScoreColor())}>
                  {overallScore}%
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">{getScoreLabel()}</span>
                  <Badge variant="outline" className={cn('text-xs', getScoreColor())}>
                    {overallScore >= 80 ? 'Full Package Ready' : overallScore >= 50 ? 'Core Analyses Ready' : 'Limited Analyses'}
                  </Badge>
                </div>
                <Progress value={overallScore} className={cn('h-2', getScoreBg())} />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <div className="flex items-center justify-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-lg font-bold">{categoryBreakdown.complete}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Complete</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <div className="flex items-center justify-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-lg font-bold">{categoryBreakdown.partial}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Partial</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <div className="flex items-center justify-center gap-1 text-rose-600">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="text-lg font-bold">{categoryBreakdown.empty}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Empty</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyses Unlocked */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium">Analyses Unlocked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{analysesUnlocked}</span>
              <span className="text-muted-foreground">/ {totalAnalyses}</span>
            </div>
          </div>
          <Progress 
            value={(analysesUnlocked / totalAnalyses) * 100} 
            className="h-2 mt-2" 
          />
          <p className="text-xs text-muted-foreground mt-2">
            {totalAnalyses - analysesUnlocked} analyses require additional data sources
          </p>
        </CardContent>
      </Card>

      {/* Critical Missing */}
      {criticalMissing.length > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-rose-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">Critical Data Missing</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalMissing.map((cat) => (
                <Badge key={cat.id} variant="destructive" className="text-xs">
                  {cat.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Priority Missing */}
      {highMissing.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">High Priority Data Missing</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {highMissing.map((cat) => (
                <Badge key={cat.id} variant="outline" className="text-xs border-amber-500/50 text-amber-600">
                  {cat.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
