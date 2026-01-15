/**
 * Dependency Orchestrator Panel - Fixed to match hook interface
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link, Heart, DollarSign, Users, Brain, Crown, Anchor, Activity, Lock } from 'lucide-react';
import { useDependencyTracking } from '@/hooks/intelligence/useDependencyTracking';

interface DependencyOrchestratorPanelProps {
  profileId: string;
}

export function DependencyOrchestratorPanel({ profileId }: DependencyOrchestratorPanelProps) {
  const { 
    dependency, 
    exitRisk,
    recommendedTactics,
    isLoading,
    initializeTracking,
    updateScores,
    deployProtocol
  } = useDependencyTracking(profileId);

  if (isLoading) {
    return (
      <Card className="border-blue-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!dependency) {
    return (
      <Card className="border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Link className="h-5 w-5" />
            Dependency Orchestrator
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Anchor className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No dependency tracking initialized</p>
          <Button onClick={() => initializeTracking(profileId)}>Initialize</Button>
        </CardContent>
      </Card>
    );
  }

  const categories = [
    { key: 'emotional', label: 'Emotional', score: dependency.emotionalDependency, icon: Heart },
    { key: 'financial', label: 'Financial', score: dependency.financialDependency, icon: DollarSign },
    { key: 'social', label: 'Social', score: dependency.socialDependency, icon: Users },
    { key: 'informational', label: 'Info', score: dependency.informationalDependency, icon: Brain },
    { key: 'supply', label: 'Supply', score: dependency.narcissisticSupplyDependency, icon: Crown },
    { key: 'attachment', label: 'Attachment', score: dependency.attachmentDependency, icon: Anchor },
  ];

  return (
    <Card className="border-blue-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Link className="h-5 w-5" />
            Dependency Orchestrator
          </CardTitle>
          {exitRisk && (
            <Badge variant="outline" className={
              exitRisk.riskLevel === 'critical' ? 'text-red-400' :
              exitRisk.riskLevel === 'high' ? 'text-orange-400' :
              exitRisk.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
            }>
              Exit Risk: {exitRisk.riskLevel}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex justify-between mb-2">
            <span className="text-sm">Total Dependency</span>
            <span className="text-2xl font-bold text-blue-400">{Math.round(dependency.totalDependencyScore * 100)}%</span>
          </div>
          <Progress value={dependency.totalDependencyScore * 100} className="h-3" />
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

        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lock className="h-4 w-4 text-red-400" />
            Exit Prevention Protocols
          </h4>
          <div className="space-y-1">
            {dependency.exitPreventionProtocols.map((protocol, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span>{protocol.protocol}</span>
                <Button 
                  size="sm" 
                  variant={protocol.deployed ? "secondary" : "destructive"}
                  disabled={protocol.deployed}
                  onClick={() => deployProtocol({ dependencyId: dependency.id, protocolIndex: i })}
                >
                  {protocol.deployed ? 'Active' : 'Deploy'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => updateScores({
            dependencyId: dependency.id,
            scores: { isolationFactor: Math.min(1, dependency.isolationFactor + 0.1) }
          })}
        >
          Increase Isolation
        </Button>
      </CardContent>
    </Card>
  );
}
