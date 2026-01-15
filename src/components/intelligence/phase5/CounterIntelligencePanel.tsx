import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, AlertTriangle, Eye, UserX, Target, 
  Activity, Lock, Radar, Crosshair, Fingerprint 
} from 'lucide-react';
import { useCounterIntelligence } from '@/hooks/intelligence/useCounterIntelligence';
import { formatDistanceToNow } from 'date-fns';

export function CounterIntelligencePanel() {
  const { 
    threatActors, 
    detections, 
    postures,
    counterOperations,
    criticalThreats,
    activeDetections,
    overallThreatLevel,
    isLoading 
  } = useCounterIntelligence();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Shield className="h-8 w-8 animate-pulse text-red-400" />
      </div>
    );
  }

  const highThreats = threatActors?.filter(t => t.threatLevel === 'high') || [];

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Threat Actors */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-400">
              <UserX className="h-5 w-5" />
              Threat Actors
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-red-500/50 text-red-400">
                {criticalThreats.length} Critical
              </Badge>
              <Badge variant="outline" className="border-orange-500/50 text-orange-400">
                {highThreats.length} High
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {threatActors?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active threats detected</p>
                  <p className="text-xs mt-1">Monitoring for adversarial activity...</p>
                </div>
              ) : (
                threatActors?.map((actor) => (
                  <Card key={actor.id} className={`border-l-4 ${
                    actor.threatLevel === 'critical' ? 'border-l-red-500' :
                    actor.threatLevel === 'high' ? 'border-l-orange-500' :
                    actor.threatLevel === 'medium' ? 'border-l-amber-500' : 'border-l-green-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getThreatColor(actor.threatLevel || 'low')}`}>
                            <Crosshair className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{actor.actorName}</h4>
                            <p className="text-xs text-muted-foreground">{actor.actorType}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getThreatColor(actor.threatLevel || 'low')}>
                          {actor.threatLevel?.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-sm font-medium">{actor.status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tactics Known</p>
                          <p className="text-sm font-medium">{actor.knownTactics?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Affiliations</p>
                          <p className="text-sm font-medium">{actor.networkAffiliations?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Seen</p>
                          <p className="text-xs">
                            {actor.lastActivityAt && formatDistanceToNow(new Date(actor.lastActivityAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Monitor
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 text-red-400">
                          <Target className="h-3 w-3 mr-1" />
                          Counter
                        </Button>
                      </div>
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
        {/* Manipulation Detections */}
        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-400 text-sm">
              <Radar className="h-4 w-4" />
              Manipulation Detections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {detections?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No manipulations detected
                  </p>
                ) : (
                  detections?.slice(0, 5).map((detection) => (
                    <div key={detection.id} className="p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{detection.manipulationType}</span>
                        <Badge variant="outline" className={
                          detection.severity === 'high' || detection.severity === 'critical' 
                            ? 'text-red-400 border-red-500/50' :
                          detection.severity === 'medium' ? 'text-amber-400 border-amber-500/50' :
                          'text-green-400 border-green-500/50'
                        }>
                          {detection.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Confidence: {(detection.detectionConfidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Defensive Postures */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-400 text-sm">
              <Lock className="h-4 w-4" />
              Defensive Postures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {postures?.filter(p => p.isActive).slice(0, 4).map((posture) => (
                <div key={posture.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-medium">{posture.postureType.replace(/_/g, ' ')}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {posture.currentThreatLevel}
                  </Badge>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active postures
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Counter Operations */}
        <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-400 text-sm">
              <Activity className="h-4 w-4" />
              Counter Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {counterOperations?.filter(o => o.isActive).slice(0, 3).map((op) => (
                <div key={op.id} className="p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{op.operationName}</span>
                    <Badge variant="outline" className="text-xs text-green-400 border-green-500/50">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {op.operationType} • Phase: {op.currentPhase}
                  </p>
                  <Progress value={op.phaseProgress * 100} className="h-1 mt-2" />
                </div>
              )) || (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active operations
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
