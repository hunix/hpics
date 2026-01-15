import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Target, Clock, Zap, TrendingUp, 
  AlertCircle, CheckCircle2, ArrowRight, Sparkles, Timer 
} from 'lucide-react';
import { usePredictiveIntervention } from '@/hooks/intelligence/usePredictiveIntervention';
import { formatDistanceToNow, format } from 'date-fns';

export function PredictiveInterventionPanel() {
  const { 
    opportunities, 
    intercepts, 
    actions,
    triggers,
    activeWindows,
    activeIntercepts,
    preemptionSuccessRate,
    isLoading 
  } = usePredictiveIntervention();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Brain className="h-8 w-8 animate-pulse text-amber-400" />
      </div>
    );
  }

  const activeTriggers = triggers?.filter(t => t.isActive) || [];
  const pendingIntercepts = intercepts?.filter(i => i.interceptStatus === 'monitoring' || i.interceptStatus === 'intervening') || [];

  const getUrgencyColor = (quality: number) => {
    if (quality >= 0.8) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (quality >= 0.6) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    if (quality >= 0.4) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-green-400 bg-green-500/10 border-green-500/30';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Opportunity Windows */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Target className="h-5 w-5" />
              Opportunity Windows
            </CardTitle>
            <Badge variant="outline" className="border-amber-500/50 text-amber-400">
              {activeWindows.length} Open
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activeWindows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No open opportunity windows</p>
                  <p className="text-xs mt-1">Scanning for optimal intervention moments...</p>
                </div>
              ) : (
                activeWindows.map((opportunity) => (
                  <Card key={opportunity.id} className="border-amber-500/20 hover:border-amber-500/40 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{opportunity.opportunityType}</h4>
                          <p className="text-xs text-muted-foreground">
                            Quality: {(opportunity.windowQuality * 100).toFixed(0)}%
                          </p>
                        </div>
                        <Badge variant="outline" className={getUrgencyColor(opportunity.windowQuality)}>
                          {opportunity.windowQuality >= 0.8 ? 'Critical' : 
                           opportunity.windowQuality >= 0.6 ? 'High' : 
                           opportunity.windowQuality >= 0.4 ? 'Medium' : 'Low'}
                        </Badge>
                      </div>

                      {/* Countdown Timer */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 mb-3">
                        <Timer className="h-5 w-5 text-amber-400" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Window Closes In</p>
                          <p className="text-sm font-medium">
                            {formatDistanceToNow(new Date(opportunity.windowEnd))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Success Prob.</p>
                          <p className="text-sm font-medium text-green-400">
                            {(opportunity.successProbability * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Window Quality</p>
                          <Progress 
                            value={opportunity.windowQuality * 100} 
                            className="h-1.5 mt-1"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Success Probability</p>
                          <Progress 
                            value={opportunity.successProbability * 100} 
                            className="h-1.5 mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400">
                          <Zap className="h-3 w-3 mr-1" />
                          Execute Intervention
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Schedule
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
        {/* Trajectory Intercepts */}
        <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              Trajectory Intercepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {pendingIntercepts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending intercepts
                  </p>
                ) : (
                  pendingIntercepts.map((intercept) => (
                    <div key={intercept.id} className="p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{intercept.trajectoryType}</span>
                        <Badge variant="outline" className="text-xs">
                          {intercept.interceptStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        <span>
                          Deviation: {(intercept.currentDeviation * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={intercept.correctionProgress * 100} 
                        className="h-1 mt-2"
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Proactive Actions */}
        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-400 text-sm">
              <Zap className="h-4 w-4" />
              Proactive Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {actions?.slice(0, 5).map((action) => (
                  <div key={action.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <div className={`p-1.5 rounded-full ${
                      action.preemptionSuccess === true ? 'bg-green-500/20' :
                      action.preemptionSuccess === false ? 'bg-red-500/20' : 'bg-muted'
                    }`}>
                      {action.preemptionSuccess === true ? (
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                      ) : action.preemptionSuccess === false ? (
                        <AlertCircle className="h-3 w-3 text-red-400" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{action.actionType}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {action.triggerPrediction}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent actions
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Intervention Triggers */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              Active Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeTriggers.slice(0, 4).map((trigger) => (
                <div key={trigger.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-xs font-medium">{trigger.triggerName}</p>
                    <p className="text-xs text-muted-foreground">{trigger.triggerType}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {trigger.triggerCount} fires
                  </Badge>
                </div>
              ))}
              {activeTriggers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active triggers
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
