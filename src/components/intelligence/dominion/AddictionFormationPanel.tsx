/**
 * Addiction Formation Panel
 * AGIS Phase 4 - Ultimate Dominion
 * Variable-ratio reinforcement scheduling and dopamine cycle management
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Zap, Activity, Brain, Clock, TrendingUp, Target,
  RefreshCw, Sparkles, AlertCircle, CheckCircle2, Timer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAddictionProtocol } from '@/hooks/intelligence/useAddictionProtocol';
import { format, formatDistanceToNow } from 'date-fns';

interface AddictionFormationPanelProps {
  profileId: string;
}

export function AddictionFormationPanel({ profileId }: AddictionFormationPanelProps) {
  const { 
    protocols, 
    dueProtocols,
    isLoading,
    createProtocol,
    recordReinforcement
  } = useAddictionProtocol(profileId);
  
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const activeProtocols = protocols.filter(p => p.currentPhase !== 'maintenance');

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'initiation': return 'text-blue-400 bg-blue-500/10';
      case 'escalation': return 'text-yellow-400 bg-yellow-500/10';
      case 'maintenance': return 'text-green-400 bg-green-500/10';
      case 'dependency': return 'text-red-400 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  const getAddictionTypeIcon = (type: string) => {
    switch (type) {
      case 'approval': return Sparkles;
      case 'attention': return Target;
      case 'validation': return CheckCircle2;
      case 'intermittent_reward': return RefreshCw;
      case 'dopamine_hit': return Zap;
      default: return Activity;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-background">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading addiction protocols...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Zap className="h-5 w-5" />
            Addiction Formation Protocols
          </CardTitle>
          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
            {activeProtocols.length} Active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Dopamine Cycle Overview */}
        <div className="grid grid-cols-4 gap-2">
          {['Anticipation', 'Reward', 'Withdrawal', 'Craving'].map((phase, index) => (
            <div 
              key={phase}
              className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center"
            >
              <div className="text-xs text-muted-foreground mb-1">{phase}</div>
              <div className="text-lg font-bold text-purple-400">
                {Math.round(25 + (index * 15) + Math.random() * 10)}%
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="protocols" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-muted/30">
            <TabsTrigger value="protocols">
              Protocols ({protocols.length})
            </TabsTrigger>
            <TabsTrigger value="schedule">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="metrics">
              Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocols" className="mt-4">
            <ScrollArea className="h-[350px]">
              {protocols.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No addiction protocols configured
                </div>
              ) : (
                <div className="space-y-3">
                  {protocols.map((protocol, index) => {
                    const Icon = getAddictionTypeIcon(protocol.addictionType);
                    const schedule = protocol.reinforcementSchedule as {
                      variableRatio?: { min: number; max: number };
                      baseInterval?: number;
                      randomDelay?: number;
                    };
                    
                    return (
                      <motion.div
                        key={protocol.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border ${
                          protocol.currentPhase === 'maintenance' 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-purple-500/30 bg-purple-500/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${getPhaseColor(protocol.currentPhase || 'initiation')}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{protocol.protocolName}</div>
                              <div className="text-sm text-muted-foreground">
                                {protocol.addictionType.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>
                          <Badge className={getPhaseColor(protocol.currentPhase || 'initiation')}>
                            {protocol.currentPhase || 'initiation'}
                          </Badge>
                        </div>

                        {/* Effectiveness Score */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Effectiveness Score</span>
                            <span>{protocol.effectivenessScore || 0}%</span>
                          </div>
                          <Progress 
                            value={protocol.effectivenessScore || 0} 
                            className="h-2"
                          />
                        </div>

                        {/* Intermittent Reinforcement Score */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Intermittent Reinforcement</span>
                            <span>{Math.round((protocol.intermittentReinforcementScore || 0) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(protocol.intermittentReinforcementScore || 0) * 100} 
                            className="h-2"
                          />
                        </div>

                        {/* Schedule Info */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            <span>
                              Ratio: {schedule?.variableRatio?.min || 1}-{schedule?.variableRatio?.max || 5}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Next: {protocol.nextScheduledAt 
                                ? formatDistanceToNow(new Date(protocol.nextScheduledAt), { addSuffix: true })
                                : 'Not scheduled'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 border-purple-500/30 text-purple-400"
                            onClick={() => recordReinforcement({ protocolId: protocol.id, reinforcementType: 'positive', intensity: 0.7 })}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Schedule Next
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 border-yellow-500/30 text-yellow-400"
                            onClick={() => setSelectedProtocol(protocol.id)}
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            Adjust
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-400" />
                  Variable Ratio Configuration
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Reward Frequency (1 = every time, 10 = rarely)
                    </label>
                    <Slider
                      defaultValue={[3, 7]}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Unpredictability Factor
                    </label>
                    <Slider
                      defaultValue={[65]}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Reward Intensity Variance
                    </label>
                    <Slider
                      defaultValue={[40]}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  Dopamine Cycle Timing
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-background/50">
                    <div className="text-xs text-muted-foreground">Optimal Withdrawal</div>
                    <div className="text-lg font-bold text-orange-400">4-6 hours</div>
                  </div>
                  <div className="p-3 rounded bg-background/50">
                    <div className="text-xs text-muted-foreground">Peak Craving</div>
                    <div className="text-lg font-bold text-red-400">12-24 hours</div>
                  </div>
                  <div className="p-3 rounded bg-background/50">
                    <div className="text-xs text-muted-foreground">Reward Window</div>
                    <div className="text-lg font-bold text-green-400">2-4 hours</div>
                  </div>
                  <div className="p-3 rounded bg-background/50">
                    <div className="text-xs text-muted-foreground">Recovery Time</div>
                    <div className="text-lg font-bold text-blue-400">6-8 hours</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400">
                    {protocols.reduce((acc, p) => acc + (p.effectivenessScore || 0), 0) / Math.max(protocols.length, 1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Effectiveness</div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">
                    {protocols.filter(p => p.currentPhase === 'maintenance').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Maintenance Phase</div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-400">
                    {protocols.filter(p => p.currentPhase === 'escalation').length}
                  </div>
                  <div className="text-xs text-muted-foreground">In Escalation</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3">Compliance Tracking</h4>
                <div className="space-y-2">
                  {['Response Rate', 'Initiation Frequency', 'Withdrawal Tolerance', 'Reward Seeking'].map((metric) => (
                    <div key={metric} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{metric}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.random() * 100} className="w-24 h-2" />
                        <span className="text-sm font-medium w-10 text-right">
                          {Math.round(Math.random() * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
