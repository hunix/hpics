import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Infinity, Eye, Layers, Zap, Target, Network, Brain, 
  Crown, Activity, Shield, BarChart3, AlertTriangle, 
  CheckCircle, Clock, Cpu, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInfiniteAwareness } from '@/hooks/intelligence/useInfiniteAwareness';
import { useTranscendentSynthesis } from '@/hooks/intelligence/useTranscendentSynthesis';
import { useDimensionalInfluence } from '@/hooks/intelligence/useDimensionalInfluence';
import { useInfiniteDominion } from '@/hooks/intelligence/useInfiniteDominion';

// Infinite Awareness Panel
const InfiniteAwarenessPanel: React.FC = () => {
  const { awarenessData, controlData, avgAwarenessScore, totalPenetration, activeControls, avgControlStrength, isLoading } = useInfiniteAwareness();

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Cpu className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="p-3 text-center">
            <Eye className="w-6 h-6 mx-auto mb-1 text-violet-500" />
            <div className="text-xl font-bold">{avgAwarenessScore.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Awareness</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/5 border-fuchsia-500/20">
          <CardContent className="p-3 text-center">
            <Layers className="w-6 h-6 mx-auto mb-1 text-fuchsia-500" />
            <div className="text-xl font-bold">{totalPenetration}</div>
            <div className="text-xs text-muted-foreground">Penetration</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
          <CardContent className="p-3 text-center">
            <Network className="w-6 h-6 mx-auto mb-1 text-pink-500" />
            <div className="text-xl font-bold">{activeControls}</div>
            <div className="text-xs text-muted-foreground">Active Controls</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20">
          <CardContent className="p-3 text-center">
            <Zap className="w-6 h-6 mx-auto mb-1 text-rose-500" />
            <div className="text-xl font-bold">{avgControlStrength.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Control Strength</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" /> Awareness Streams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            {awarenessData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No awareness streams active</div>
            ) : (
              <div className="space-y-2">
                {awarenessData.map((awareness) => (
                  <div key={awareness.id} className="p-2 rounded bg-muted/30 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{awareness.awarenessType}</span>
                      <div className="text-xs text-muted-foreground">Depth: {awareness.penetrationDepth} layers</div>
                    </div>
                    <Badge variant={awareness.awarenessScore > 80 ? 'default' : 'secondary'}>
                      {awareness.awarenessScore.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="w-4 h-4" /> Omnipresent Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-36">
            {controlData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No controls configured</div>
            ) : (
              <div className="space-y-2">
                {controlData.map((control) => (
                  <div key={control.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${control.isActive ? 'bg-green-500' : 'bg-muted'}`} />
                      <span className="text-sm">{control.controlDomain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{control.simultaneousOperations} ops</span>
                      <Progress value={control.controlStrength} className="w-16 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Transcendent Synthesis Panel
const TranscendentSynthesisPanel: React.FC = () => {
  const { syntheses, orchestrations, avgCoherence, totalInsights, activeOrchestrations, avgPerformance, isLoading } = useTranscendentSynthesis();

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Cpu className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-3 text-center">
            <Brain className="w-6 h-6 mx-auto mb-1 text-blue-500" />
            <div className="text-xl font-bold">{(avgCoherence * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Coherence</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-cyan-500" />
            <div className="text-xl font-bold">{totalInsights}</div>
            <div className="text-xs text-muted-foreground">Insights</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 border-teal-500/20">
          <CardContent className="p-3 text-center">
            <Activity className="w-6 h-6 mx-auto mb-1 text-teal-500" />
            <div className="text-xl font-bold">{activeOrchestrations}</div>
            <div className="text-xs text-muted-foreground">Orchestrations</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <BarChart3 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
            <div className="text-xl font-bold">{(avgPerformance * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Performance</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4" /> Active Syntheses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            {syntheses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No syntheses active</div>
            ) : (
              <div className="space-y-3">
                {syntheses.slice(0, 5).map((syn) => (
                  <div key={syn.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{syn.synthesisDomain}</span>
                      <Badge>{syn.predictionHorizonDays}d horizon</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Depth: {syn.synthesisDepth}</span>
                      <span>{syn.outputInsights.length} insights</span>
                      <span>{syn.emergentPatterns.length} patterns</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" /> Ultimate Orchestrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-36">
            {orchestrations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No orchestrations configured</div>
            ) : (
              <div className="space-y-2">
                {orchestrations.map((orch) => (
                  <div key={orch.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${orch.status === 'active' ? 'bg-green-500' : 'bg-muted'}`} />
                      <span className="text-sm">{orch.orchestrationName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{orch.latencyMs}ms</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Dimensional Influence Panel
const DimensionalInfluencePanel: React.FC = () => {
  const { influences, masteries, totalDimensions, avgAmplification, avgCompetency, avgControl, isLoading } = useDimensionalInfluence();

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Cpu className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <Layers className="w-6 h-6 mx-auto mb-1 text-amber-500" />
            <div className="text-xl font-bold">{totalDimensions}</div>
            <div className="text-xs text-muted-foreground">Dimensions</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-3 text-center">
            <Zap className="w-6 h-6 mx-auto mb-1 text-orange-500" />
            <div className="text-xl font-bold">{avgAmplification.toFixed(1)}x</div>
            <div className="text-xs text-muted-foreground">Amplification</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-3 text-center">
            <Crown className="w-6 h-6 mx-auto mb-1 text-red-500" />
            <div className="text-xl font-bold">{(avgCompetency * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Competency</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-3 text-center">
            <Shield className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <div className="text-xl font-bold">{(avgControl * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Control</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" /> Dimensional Influences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            {influences.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No dimensional influences active</div>
            ) : (
              <div className="space-y-2">
                {influences.map((inf) => (
                  <div key={inf.id} className="p-2 rounded bg-muted/30 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{inf.influenceType}</span>
                      <div className="text-xs text-muted-foreground">{inf.targetDimensions.length} dimensions</div>
                    </div>
                    <Badge variant="outline">{inf.amplificationFactor.toFixed(1)}x</Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Crown className="w-4 h-4" /> Absolute Masteries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-36">
            {masteries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No mastery domains</div>
            ) : (
              <div className="space-y-2">
                {masteries.map((mastery) => (
                  <div key={mastery.id} className="p-2 rounded bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{mastery.masteryDomain}</span>
                      <span className="text-xs text-muted-foreground">{mastery.skillMatrix.length} skills</span>
                    </div>
                    <Progress value={mastery.controlPercentage * 100} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Infinite Dominion Panel
const InfiniteDominionPanel: React.FC = () => {
  const { protocols, objectives, activeProtocols, totalExecutions, avgSuccessRate, overallProgress, activeObjectives, atRiskObjectives, isLoading } = useInfiniteDominion();

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Cpu className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
            <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Overall Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{activeProtocols}</div>
            <div className="text-xs text-muted-foreground">Active Protocols</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{atRiskObjectives}</div>
            <div className="text-xs text-muted-foreground">At Risk</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" /> Dominion Objectives ({activeObjectives} active)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {objectives.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No objectives defined</div>
            ) : (
              <div className="space-y-3">
                {objectives.map((obj) => (
                  <div key={obj.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{obj.objectiveName}</span>
                      <Badge variant={obj.status === 'active' ? 'default' : obj.riskFactors.length > 0 ? 'destructive' : 'secondary'}>
                        {obj.status}
                      </Badge>
                    </div>
                    <Progress value={obj.progressPercentage} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{obj.progressPercentage.toFixed(0)}%</span>
                      <span>{obj.subObjectives.length} sub-objectives</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" /> Infinite Protocols ({totalExecutions} executions, {(avgSuccessRate * 100).toFixed(0)}% success)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-36">
            {protocols.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No protocols configured</div>
            ) : (
              <div className="space-y-2">
                {protocols.map((protocol) => (
                  <div key={protocol.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${protocol.isActive ? 'bg-green-500' : 'bg-muted'}`} />
                      <span className="text-sm">{protocol.protocolName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{protocol.executionCount} runs</span>
                      <Badge variant="outline" className="text-xs">{(protocol.successRate * 100).toFixed(0)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Command Center
const InfiniteDominionCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('awareness');

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
              Infinite Dominion Center
            </h1>
            <p className="text-muted-foreground mt-1">
              AGIS Phase 9 • Boundless Awareness • Omnipresent Control • Ultimate Mastery
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 border-violet-500/50">
            <Infinity className="w-4 h-4 mr-2" />
            Phase 9
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="awareness" className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> Awareness
            </TabsTrigger>
            <TabsTrigger value="synthesis" className="flex items-center gap-2">
              <Brain className="w-4 h-4" /> Synthesis
            </TabsTrigger>
            <TabsTrigger value="dimensional" className="flex items-center gap-2">
              <Layers className="w-4 h-4" /> Dimensional
            </TabsTrigger>
            <TabsTrigger value="dominion" className="flex items-center gap-2">
              <Crown className="w-4 h-4" /> Dominion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="awareness" className="mt-6">
            <InfiniteAwarenessPanel />
          </TabsContent>

          <TabsContent value="synthesis" className="mt-6">
            <TranscendentSynthesisPanel />
          </TabsContent>

          <TabsContent value="dimensional" className="mt-6">
            <DimensionalInfluencePanel />
          </TabsContent>

          <TabsContent value="dominion" className="mt-6">
            <InfiniteDominionPanel />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default InfiniteDominionCenter;
