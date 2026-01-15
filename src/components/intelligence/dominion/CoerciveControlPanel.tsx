/**
 * Coercive Control Panel - Fixed to match hook interface
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Users, DollarSign, Clock, Eye, Heart, Activity, Shield } from 'lucide-react';
import { useCoerciveControl } from '@/hooks/intelligence/useCoerciveControl';

interface CoerciveControlPanelProps {
  profileId: string;
}

export function CoerciveControlPanel({ profileId }: CoerciveControlPanelProps) {
  const { 
    metrics, 
    tactics,
    recommendedTactics,
    escalationOpportunity,
    isLoading,
    initializeMetrics,
    updateScores,
    advancePhase
  } = useCoerciveControl(profileId);

  if (isLoading) {
    return (
      <Card className="border-purple-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Lock className="h-5 w-5" />
            Coercive Control Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No control metrics initialized</p>
          <Button onClick={() => initializeMetrics(profileId)}>Initialize</Button>
        </CardContent>
      </Card>
    );
  }

  const categories = [
    { key: 'isolation', label: 'Isolation', score: metrics.isolationScore, icon: Users },
    { key: 'financial', label: 'Financial', score: metrics.financialControlScore, icon: DollarSign },
    { key: 'information', label: 'Information', score: metrics.informationControlScore, icon: Eye },
    { key: 'time', label: 'Time', score: metrics.timeMonopolizationScore, icon: Clock },
    { key: 'emotional', label: 'Emotional', score: metrics.emotionalControlScore, icon: Heart },
    { key: 'surveillance', label: 'Surveillance', score: metrics.surveillanceIntensity, icon: Lock },
  ];

  return (
    <Card className="border-purple-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Lock className="h-5 w-5" />
            Coercive Control Framework
          </CardTitle>
          <Badge variant="outline" className="text-purple-400">
            {metrics.currentControlPhase}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex justify-between mb-2">
            <span className="text-sm">Total Control Score</span>
            <span className="text-2xl font-bold text-purple-400">{Math.round(metrics.totalControlScore * 100)}%</span>
          </div>
          <Progress value={metrics.totalControlScore * 100} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <div key={cat.key} className="p-2 rounded-lg border text-center">
              <cat.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xs">{cat.label}</div>
              <div className="font-bold">{Math.round(cat.score * 100)}%</div>
            </div>
          ))}
        </div>

        <ScrollArea className="h-[200px]">
          <h4 className="text-sm font-medium mb-2">Recommended Tactics</h4>
          {recommendedTactics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommendations available</p>
          ) : (
            <div className="space-y-2">
              {recommendedTactics.map((tactic) => (
                <div key={tactic.id} className="p-2 rounded border">
                  <div className="font-medium text-sm">{tactic.name}</div>
                  <div className="text-xs text-muted-foreground">{tactic.description}</div>
                  <div className="text-xs mt-1">Effectiveness: {Math.round(tactic.effectiveness * 100)}%</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Button 
          variant="destructive" 
          className="w-full"
          onClick={() => advancePhase({ metricsId: metrics.id, newPhase: 'enforcement' })}
        >
          Advance Phase
        </Button>
      </CardContent>
    </Card>
  );
}
