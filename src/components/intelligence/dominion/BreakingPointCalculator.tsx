/**
 * Breaking Point Calculator - Fixed to match hook interface
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingDown, Activity, Shield, Clock, Target, Brain } from 'lucide-react';
import { useBreakingPointPrediction } from '@/hooks/intelligence/useBreakingPointPrediction';

interface BreakingPointCalculatorProps {
  profileId: string;
}

export function BreakingPointCalculator({ profileId }: BreakingPointCalculatorProps) {
  const { 
    prediction, 
    pressureVectors,
    optimalStrategy,
    timeToBreakingPoint,
    isLoading,
    initializeAnalysis,
    recordPressure,
    isInitializing
  } = useBreakingPointPrediction(profileId);

  if (isLoading) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <TrendingDown className="h-5 w-5" />
            Breaking Point Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No analysis initialized</p>
          <Button onClick={() => initializeAnalysis(profileId)} disabled={isInitializing}>
            {isInitializing ? 'Initializing...' : 'Initialize Analysis'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-400">
            <TrendingDown className="h-5 w-5" />
            Breaking Point Calculator
          </CardTitle>
          {timeToBreakingPoint && (
            <Badge variant="outline" className="text-red-400">
              {timeToBreakingPoint.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Resilience</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(prediction.currentResilienceScore * 100)}%</div>
            <Progress value={prediction.currentResilienceScore * 100} className="h-2 mt-2" />
          </div>
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <span className="text-sm">Time to Break</span>
            </div>
            {timeToBreakingPoint ? (
              <div className="text-2xl font-bold">{timeToBreakingPoint.days}d {timeToBreakingPoint.hours}h</div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">--</div>
            )}
          </div>
        </div>

        {optimalStrategy && (
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-400" />
              Optimal Strategy
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Timing: {optimalStrategy.timing || 'Any'}</div>
              <div>Intensity: {Math.round(optimalStrategy.intensity * 100)}%</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {optimalStrategy.recommendedVectors.map((v, i) => (
                <Badge key={i} variant="outline">{v.name}</Badge>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {pressureVectors.map((vector) => (
              <div key={vector.id} className="p-2 rounded border flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">{vector.name}</div>
                  <div className="text-xs text-muted-foreground">{vector.category}</div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => recordPressure({
                    predictionId: prediction.id,
                    vectorName: vector.name,
                    intensity: 0.5,
                    'observed效果': 0.7
                  })}
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
