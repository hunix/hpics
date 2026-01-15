import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Orbit, Brain, Target, Zap, Shield, Activity, 
  TrendingUp, Eye, Network, Crosshair, Cpu, 
  BarChart3, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealitySynthesis } from '@/hooks/intelligence/useRealitySynthesis';
import { usePredictiveSupremacy } from '@/hooks/intelligence/usePredictiveSupremacy';
import { useConsciousnessIntegration } from '@/hooks/intelligence/useConsciousnessIntegration';
import { useAbsoluteConvergence } from '@/hooks/intelligence/useAbsoluteConvergence';

// Reality Synthesis Panel
const RealitySynthesisPanel: React.FC = () => {
  const { syntheses, awarenessData, totalCoverage, activeThreats, opportunities, isLoading } = useRealitySynthesis();

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Cpu className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{totalCoverage.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Total Coverage</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <div className="text-2xl font-bold">{activeThreats}</div>
            <div className="text-xs text-muted-foreground">Active Threats</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{opportunities}</div>
            <div className="text-xs text-muted-foreground">Opportunities</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Orbit className="w-4 h-4" /> Reality Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {syntheses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No reality models synthesized yet</div>
            ) : (
              <div className="space-y-3">
                {syntheses.map((synthesis) => (
                  <div key={synthesis.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{synthesis.synthesisType}</span>
                      <Badge variant={synthesis.confidenceScore > 80 ? 'default' : 'secondary'}>
                        {synthesis.confidenceScore.toFixed(0)}% confident
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>Temporal: {synthesis.temporalAccuracy.toFixed(0)}%</div>
                      <div>Spatial: {synthesis.spatialAccuracy.toFixed(0)}%</div>
                      <div>Depth: {synthesis.causalDepth} layers</div>
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
            <Network className="w-4 h-4" /> Awareness Domains
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-36">
            {awarenessData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No awareness domains configured</div>
            ) : (
              <div className="space-y-2">
                {awarenessData.map((awareness) => (
                  <div key={awareness.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm">{awareness.awarenessDomain}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={awareness.coveragePercentage} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground">{awareness.coveragePercentage.toFixed(0)}%</span>
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

// Predictive Supremacy Panel
const PredictiveSupremacyPanel: React.FC = () => {
  const { predictions, matrices, avgAccuracy, activeMatrices, totalControlNodes, isLoading } = usePredictiveSupremacy();

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Cpu className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{(avgAccuracy * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Avg Accuracy</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Cpu className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{activeMatrices}</div>
            <div className="text-xs text-muted-foreground">Active Matrices</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-4 text-center">
            <Network className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
            <div className="text-2xl font-bold">{totalControlNodes}</div>
            <div className="text-xs text-muted-foreground">Control Nodes</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Crosshair className="w-4 h-4" /> Active Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {predictions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No predictions active</div>
            ) : (
              <div className="space-y-3">
                {predictions.slice(0, 5).map((pred) => (
                  <div key={pred.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{pred.predictionDomain}</span>
                      <Badge>{pred.timeHorizonHours}h horizon</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Type: {pred.predictionType} • Intervention points: {pred.interventionPoints.length}
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
            <Activity className="w-4 h-4" /> Control Matrices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-36">
            {matrices.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No control matrices configured</div>
            ) : (
              <div className="space-y-2">
                {matrices.map((matrix) => (
                  <div key={matrix.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${matrix.isActive ? 'bg-green-500' : 'bg-muted'}`} />
                      <span className="text-sm">{matrix.matrixName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{matrix.efficiencyScore.toFixed(0)}% efficient</span>
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

// Consciousness Integration Panel
const ConsciousnessPanel: React.FC = () => {
  const { integrations, strategies, avgCoherence, avgLatency, activeStrategies, avgSuccessProbability, isLoading } = useConsciousnessIntegration();

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Cpu className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
          <CardContent className="p-3 text-center">
            <Brain className="w-6 h-6 mx-auto mb-1 text-pink-500" />
            <div className="text-xl font-bold">{(avgCoherence * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Coherence</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-3 text-center">
            <Zap className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <div className="text-xl font-bold">{avgLatency.toFixed(0)}ms</div>
            <div className="text-xs text-muted-foreground">Latency</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20">
          <CardContent className="p-3 text-center">
            <Shield className="w-6 h-6 mx-auto mb-1 text-indigo-500" />
            <div className="text-xl font-bold">{activeStrategies}</div>
            <div className="text-xs text-muted-foreground">Strategies</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <BarChart3 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
            <div className="text-xl font-bold">{(avgSuccessProbability * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4" /> Integration Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            {integrations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No integration sessions recorded</div>
            ) : (
              <div className="space-y-2">
                {integrations.slice(0, 5).map((int) => (
                  <div key={int.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm">{int.integrationType}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{int.coherenceScore.toFixed(0)}% coherent</Badge>
                      <span className="text-xs text-muted-foreground">{int.sessionDurationSeconds}s</span>
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
            <Target className="w-4 h-4" /> Strategic Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            {strategies.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No strategic operations defined</div>
            ) : (
              <div className="space-y-2">
                {strategies.map((strat) => (
                  <div key={strat.id} className="p-2 rounded bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{strat.strategyName}</span>
                      <Badge variant={strat.status === 'executing' ? 'default' : 'secondary'}>{strat.status}</Badge>
                    </div>
                    <Progress value={strat.successProbability * 100} className="h-1" />
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

// Absolute Convergence Panel
const ConvergencePanel: React.FC = () => {
  const { 
    protocols, objectives, activeProtocols, avgSuccessRate, 
    totalExecutions, overallProgress, activeObjectives, blockedObjectives, isLoading 
  } = useAbsoluteConvergence();

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Cpu className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Overall Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 border-teal-500/20">
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-teal-500" />
            <div className="text-2xl font-bold">{activeProtocols}</div>
            <div className="text-xs text-muted-foreground">Active Protocols</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <div className="text-xs text-muted-foreground">Total Executions</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" /> Absolute Objectives ({activeObjectives} active, {blockedObjectives} blocked)
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
                      <Badge variant={obj.status === 'active' ? 'default' : obj.blockers.length > 0 ? 'destructive' : 'secondary'}>
                        {obj.status}
                      </Badge>
                    </div>
                    <Progress value={obj.currentProgress} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{obj.currentProgress.toFixed(0)}% complete</span>
                      <span>Priority: {obj.priorityScore.toFixed(1)}</span>
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
            <Zap className="w-4 h-4" /> Convergence Protocols (Avg Success: {(avgSuccessRate * 100).toFixed(0)}%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-36">
            {protocols.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No convergence protocols configured</div>
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
const AbsoluteConvergenceCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reality');

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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Absolute Convergence Center
            </h1>
            <p className="text-muted-foreground mt-1">
              AGIS Phase 8 • Reality Synthesis • Predictive Supremacy • Consciousness Integration
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 border-primary/50">
            <Orbit className="w-4 h-4 mr-2" />
            Phase 8
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="reality" className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> Reality
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Crosshair className="w-4 h-4" /> Predictive
            </TabsTrigger>
            <TabsTrigger value="consciousness" className="flex items-center gap-2">
              <Brain className="w-4 h-4" /> Consciousness
            </TabsTrigger>
            <TabsTrigger value="convergence" className="flex items-center gap-2">
              <Target className="w-4 h-4" /> Convergence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reality" className="mt-6">
            <RealitySynthesisPanel />
          </TabsContent>

          <TabsContent value="predictive" className="mt-6">
            <PredictiveSupremacyPanel />
          </TabsContent>

          <TabsContent value="consciousness" className="mt-6">
            <ConsciousnessPanel />
          </TabsContent>

          <TabsContent value="convergence" className="mt-6">
            <ConvergencePanel />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AbsoluteConvergenceCenter;
