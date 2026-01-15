import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, Brain, Layers, Target, Zap, GitMerge, 
  TrendingUp, Activity, Shield, Eye, Crown
} from 'lucide-react';
import { useMetaLearning } from '@/hooks/intelligence/useMetaLearning';
import { useCrossPhaseOperations } from '@/hooks/intelligence/useCrossPhaseOperations';
import { useEmergenceDetection } from '@/hooks/intelligence/useEmergenceDetection';
import { useSingularityCommand } from '@/hooks/intelligence/useSingularityCommand';

const AGIS_PHASES = [
  { id: 'phase1', name: 'Core', icon: Brain, color: 'text-blue-400' },
  { id: 'phase2', name: 'Superiority', icon: Crown, color: 'text-violet-400' },
  { id: 'phase3', name: 'Cognitive Warfare', icon: Target, color: 'text-orange-400' },
  { id: 'phase4', name: 'Dominion', icon: Shield, color: 'text-red-400' },
  { id: 'phase5', name: 'Omniscient', icon: Eye, color: 'text-emerald-400' },
  { id: 'phase6', name: 'Transcendent', icon: Sparkles, color: 'text-cyan-400' },
  { id: 'phase7', name: 'Singularity', icon: GitMerge, color: 'text-pink-400' },
];

export default function SingularityCommandCenter() {
  const { models, isLoading: modelsLoading } = useMetaLearning();
  const { operations, activeOperations } = useCrossPhaseOperations();
  const { patterns, highValuePatterns, convergenceEvents } = useEmergenceDetection();
  const { objectives, activeObjectives, syntheses, recentEvolutions } = useSingularityCommand();

  const stats = {
    totalModels: models.length,
    activeOperations: activeOperations.length,
    emergentPatterns: patterns.length,
    convergenceEvents: convergenceEvents.length,
    objectives: activeObjectives.length,
    syntheses: syntheses.length,
    evolutions: recentEvolutions.length,
  };

  return (
    <AppLayout title="Singularity Command">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitMerge className="h-6 w-6 text-pink-400" />
              AGIS Phase 7: Unified Singularity
            </h1>
            <p className="text-muted-foreground mt-1">
              Meta-learning, cross-phase orchestration & emergent intelligence
            </p>
          </div>
          <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/30">
            SINGULARITY ACTIVE
          </Badge>
        </div>

        {/* Phase Integration Status */}
        <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Phase Integration Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {AGIS_PHASES.map((phase) => (
                <div key={phase.id} className="text-center p-2 rounded-lg bg-card/50 border border-border/50">
                  <phase.icon className={`h-5 w-5 mx-auto ${phase.color}`} />
                  <span className="text-[10px] text-muted-foreground block mt-1">{phase.name}</span>
                  <div className="h-1 w-full bg-muted rounded-full mt-1">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500`}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <Brain className="h-5 w-5 mx-auto text-violet-400" />
              <div className="text-xl font-bold mt-1">{stats.totalModels}</div>
              <div className="text-[10px] text-muted-foreground">ML Models</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <Layers className="h-5 w-5 mx-auto text-blue-400" />
              <div className="text-xl font-bold mt-1">{stats.activeOperations}</div>
              <div className="text-[10px] text-muted-foreground">Active Ops</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <Sparkles className="h-5 w-5 mx-auto text-amber-400" />
              <div className="text-xl font-bold mt-1">{stats.emergentPatterns}</div>
              <div className="text-[10px] text-muted-foreground">Patterns</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <GitMerge className="h-5 w-5 mx-auto text-emerald-400" />
              <div className="text-xl font-bold mt-1">{stats.convergenceEvents}</div>
              <div className="text-[10px] text-muted-foreground">Convergence</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <Target className="h-5 w-5 mx-auto text-red-400" />
              <div className="text-xl font-bold mt-1">{stats.objectives}</div>
              <div className="text-[10px] text-muted-foreground">Objectives</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <Zap className="h-5 w-5 mx-auto text-cyan-400" />
              <div className="text-xl font-bold mt-1">{stats.syntheses}</div>
              <div className="text-[10px] text-muted-foreground">Syntheses</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-pink-400" />
              <div className="text-xl font-bold mt-1">{stats.evolutions}</div>
              <div className="text-[10px] text-muted-foreground">Evolutions</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="operations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="operations" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Cross-Phase Ops</span>
            </TabsTrigger>
            <TabsTrigger value="emergence" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Emergence</span>
            </TabsTrigger>
            <TabsTrigger value="objectives" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Objectives</span>
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Evolution</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-400" />
                  Cross-Phase Operations
                </CardTitle>
                <CardDescription>
                  Unified operations spanning multiple AGIS phases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No cross-phase operations yet</p>
                    <p className="text-sm">Operations unifying multiple phases will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {operations.map((op) => (
                        <div key={op.id} className="p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{op.operationName}</span>
                            <Badge variant={op.status === 'executing' ? 'default' : 'outline'}>
                              {op.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {op.phasesInvolved.map((phase) => (
                              <Badge key={phase} variant="secondary" className="text-[10px]">
                                {phase}
                              </Badge>
                            ))}
                          </div>
                          {op.successProbability && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Success Probability</span>
                                <span>{Math.round(op.successProbability * 100)}%</span>
                              </div>
                              <Progress value={op.successProbability * 100} className="h-1" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergence" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    Emergent Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patterns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No patterns detected yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {patterns.map((pattern) => (
                          <div key={pattern.id} className="p-2 rounded border bg-card/50">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{pattern.patternName}</span>
                              {pattern.isValidated && (
                                <Badge className="bg-green-500/20 text-green-400">Validated</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Strategic Value: {pattern.strategicValue ? Math.round(pattern.strategicValue * 100) : 0}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitMerge className="h-5 w-5 text-emerald-400" />
                    Convergence Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {convergenceEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitMerge className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No active convergence events</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {convergenceEvents.map((event) => (
                          <div key={event.id} className="p-2 rounded border bg-card/50">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{event.eventName}</span>
                              <Badge variant="outline">
                                {event.synergyMultiplier}x synergy
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {event.convergingPhases.map((phase) => (
                                <Badge key={phase} variant="secondary" className="text-[10px]">
                                  {phase}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="objectives" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-400" />
                  Singularity Objectives
                </CardTitle>
                <CardDescription>
                  High-level strategic goals driving the unified system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {objectives.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No objectives defined</p>
                    <p className="text-sm">Define strategic objectives to guide system evolution</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {objectives.map((obj) => (
                        <div key={obj.id} className="p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{obj.objectiveName}</span>
                            <Badge variant={obj.status === 'active' ? 'default' : 'secondary'}>
                              P{obj.priorityLevel}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span>{obj.progressPercentage}%</span>
                            </div>
                            <Progress value={obj.progressPercentage} className="h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-pink-400" />
                  System Evolution Log
                </CardTitle>
                <CardDescription>
                  Self-improvement and adaptation history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentEvolutions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No evolution events recorded</p>
                    <p className="text-sm">System improvements will be tracked here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {recentEvolutions.map((evo) => (
                        <div key={evo.id} className="p-2 rounded border bg-card/50 flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${evo.autonomous ? 'bg-cyan-400' : 'bg-violet-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{evo.evolutionType}</div>
                            <div className="text-xs text-muted-foreground">
                              {evo.affectedComponents.join(', ')}
                            </div>
                          </div>
                          {evo.autonomous && (
                            <Badge variant="outline" className="text-[10px]">AUTO</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
