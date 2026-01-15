import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Network, GitBranch, Users, Target, Zap, 
  TrendingUp, Activity, ArrowRight, Layers 
} from 'lucide-react';
import { useNetworkWarfare } from '@/hooks/intelligence/useNetworkWarfare';
import { formatDistanceToNow } from 'date-fns';

export function NetworkWarfarePanel() {
  const { 
    cascades, 
    operations, 
    multiTargetCampaigns,
    activeCascades,
    activeOperations,
    totalReach,
    avgCascadeVelocity,
    isLoading 
  } = useNetworkWarfare();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Network className="h-8 w-8 animate-pulse text-purple-400" />
      </div>
    );
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'seeding': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'spreading': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'peaked': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'declining': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Influence Cascades */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <GitBranch className="h-5 w-5" />
            Influence Cascades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activeCascades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active influence cascades</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Initialize Cascade
                  </Button>
                </div>
              ) : (
                activeCascades.map((cascade) => (
                  <Card key={cascade.id} className="border-purple-500/20 hover:border-purple-500/40 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{cascade.cascadeName}</h4>
                          <p className="text-xs text-muted-foreground">{cascade.cascadeType}</p>
                        </div>
                        <Badge variant="outline" className={getPhaseColor(cascade.currentPhase)}>
                          {cascade.currentPhase}
                        </Badge>
                      </div>

                      {/* Cascade Visualization */}
                      <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-red-400" />
                          <span className="text-xs">Origin</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="text-xs">{cascade.currentReach} reached</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-1">
                          <Layers className="h-4 w-4 text-green-400" />
                          <span className="text-xs">{cascade.maxReach || '∞'} max</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Velocity</p>
                          <p className="text-sm font-medium text-purple-400">
                            {cascade.cascadeVelocity.toFixed(1)}/hr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Infection Rate</p>
                          <p className="text-sm font-medium">
                            {(cascade.infectionRate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Recovery Rate</p>
                          <p className="text-sm font-medium text-amber-400">
                            {(cascade.recoveryRate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <Progress 
                        value={cascade.maxReach ? (cascade.currentReach / cascade.maxReach) * 100 : 50} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Reach Progress: {cascade.currentReach} / {cascade.maxReach || 'unlimited'}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Network Operations */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-400 text-sm">
              <Network className="h-4 w-4" />
              Network Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {activeOperations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active operations
                  </p>
                ) : (
                  activeOperations.map((op) => (
                    <div key={op.id} className="p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{op.operationName}</span>
                        <Badge variant="outline" className={op.isActive ? 'text-green-400 border-green-500/50' : ''}>
                          {op.currentPhase}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {op.operationType} • {op.targetNodes?.length || 0} targets
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Multi-Target Campaigns */}
        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-400 text-sm">
              <Users className="h-4 w-4" />
              Multi-Target Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {multiTargetCampaigns?.filter(c => c.isActive).slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs font-medium">{campaign.campaignName}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.coordinationStrategy}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-green-400">
                        {((campaign.synergyScore || 0) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">synergy</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active campaigns
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Network Stats */}
        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              Network Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Reach</span>
                  <span className="text-sm font-medium text-purple-400">{totalReach}</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avg Velocity</span>
                  <span className="text-sm font-medium">{avgCascadeVelocity.toFixed(1)}/hr</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Active Cascades</span>
                  <span className="text-sm font-medium">{activeCascades.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
