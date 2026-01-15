/**
 * Addiction Formation Panel - Fixed to match hook interface
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Activity, Clock, RefreshCw } from 'lucide-react';
import { useAddictionProtocol } from '@/hooks/intelligence/useAddictionProtocol';

interface AddictionFormationPanelProps {
  profileId: string;
}

export function AddictionFormationPanel({ profileId }: AddictionFormationPanelProps) {
  const { 
    protocols, 
    dueProtocols,
    isLoading,
    createProtocol,
    isCreating,
    recordReinforcement,
    advancePhase
  } = useAddictionProtocol(profileId);

  if (isLoading) {
    return (
      <Card className="border-pink-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Activity className="h-6 w-6 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-pink-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-pink-400">
            <Zap className="h-5 w-5" />
            Addiction Formation Protocols
          </CardTitle>
          <Badge variant="outline" className="text-pink-400">
            {protocols.length} Active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {dueProtocols.length > 0 && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="text-sm font-medium text-orange-400 mb-2">
              {dueProtocols.length} Protocol(s) Due
            </div>
            <div className="flex gap-2 flex-wrap">
              {dueProtocols.map((p) => (
                <Button 
                  key={p.id} 
                  size="sm" 
                  variant="outline"
                  onClick={() => recordReinforcement({
                    protocolId: p.id,
                    responseLatencySeconds: 10,
                    wasInitiatedByTarget: false
                  })}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {p.protocolName}
                </Button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="h-[300px]">
          {protocols.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No addiction protocols configured</p>
              <Button 
                size="sm" 
                className="mt-2"
                disabled={isCreating}
                onClick={() => createProtocol({ 
                  profileId, 
                  protocolName: 'Attention Protocol',
                  addictionType: 'attention'
                })}
              >
                Create Protocol
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {protocols.map((protocol) => (
                <div key={protocol.id} className="p-3 rounded-lg border border-pink-500/30">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{protocol.protocolName}</span>
                    <Badge variant="outline">{protocol.currentPhase}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{protocol.addictionType}</div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>Effectiveness: {Math.round(protocol.effectivenessScore * 100)}%</div>
                    <div>Intermittent: {Math.round(protocol.intermittentReinforcementScore * 100)}%</div>
                  </div>
                  
                  <Progress value={protocol.effectivenessScore * 100} className="h-2 mb-2" />
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => recordReinforcement({
                        protocolId: protocol.id,
                        responseLatencySeconds: 5,
                        wasInitiatedByTarget: false
                      })}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Reinforce
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => advancePhase({ protocolId: protocol.id, newPhase: 'escalation' })}
                    >
                      Advance
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
