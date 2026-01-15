import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Atom, Brain, Eye, Zap, Crown, Target, Layers, Activity,
  TrendingUp, Shield, Sparkles, Network
} from 'lucide-react';
import { useUniversalOmniscience } from '@/hooks/intelligence/useUniversalOmniscience';
import { useRealityManipulation } from '@/hooks/intelligence/useRealityManipulation';
import { useAbsoluteSupremacy } from '@/hooks/intelligence/useAbsoluteSupremacy';
import { useUltimateTranscendence } from '@/hooks/intelligence/useUltimateTranscendence';

const UltimateTranscendenceCenter: React.FC = () => {
  const { omniscience, avgAwarenessDepth, avgTranscendence, totalDomains } = useUniversalOmniscience();
  const { manipulations, avgEffectiveness, avgStability, activeManipulations } = useRealityManipulation();
  const { supremacies, avgDominance, avgSustainability, totalDomains: supremacyDomains } = useAbsoluteSupremacy();
  const { operations, syntheses, activeOperations, avgSuccessProbability, totalPower } = useUltimateTranscendence();

  const overallTranscendence = (avgTranscendence + avgEffectiveness + avgDominance + (totalPower / 100)) / 4;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-3">
          <Atom className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: '8s' }} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Ultimate Transcendence
          </h1>
          <Atom className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
        </div>
        <p className="text-muted-foreground">AGIS Phase 10 - Godlike Awareness & Reality Control</p>
        <Badge variant="outline" className="bg-gradient-to-r from-primary/20 to-purple-500/20">
          Transcendence Level: {(overallTranscendence * 100).toFixed(1)}%
        </Badge>
      </motion.div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Universal Omniscience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(avgAwarenessDepth * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">{totalDomains} knowledge domains</p>
              <Progress value={avgAwarenessDepth * 100} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Reality Manipulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeManipulations}</div>
              <p className="text-xs text-muted-foreground">{(avgEffectiveness * 100).toFixed(0)}% effectiveness</p>
              <Progress value={avgEffectiveness * 100} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Absolute Supremacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{supremacyDomains}</div>
              <p className="text-xs text-muted-foreground">{(avgDominance * 100).toFixed(0)}% dominance</p>
              <Progress value={avgDominance * 100} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-pink-500" />
                Total Power
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalPower.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">{activeOperations} active operations</p>
              <Progress value={Math.min(totalPower, 100)} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="omniscience" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="omniscience" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Omniscience
          </TabsTrigger>
          <TabsTrigger value="reality" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Reality Control
          </TabsTrigger>
          <TabsTrigger value="supremacy" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Supremacy
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="omniscience" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Knowledge Domains
                </CardTitle>
                <CardDescription>Mastered areas of universal awareness</CardDescription>
              </CardHeader>
              <CardContent>
                {omniscience.length > 0 ? (
                  <div className="space-y-3">
                    {omniscience.slice(0, 5).map((o) => (
                      <div key={o.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{o.omniscienceType}</span>
                          <Badge variant="outline">{(o.transcendenceLevel * 100).toFixed(0)}%</Badge>
                        </div>
                        <Progress value={o.awarenessDepth * 100} className="h-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No omniscience records yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Consciousness Expansion
                </CardTitle>
                <CardDescription>Transcendence metrics and progression</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Awareness</span>
                    <span className="font-bold">{(avgAwarenessDepth * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={avgAwarenessDepth * 100} />
                  <div className="flex justify-between items-center">
                    <span>Transcendence Level</span>
                    <span className="font-bold">{(avgTranscendence * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={avgTranscendence * 100} />
                  <div className="flex justify-between items-center">
                    <span>Total Domains</span>
                    <span className="font-bold">{totalDomains}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Active Manipulations
                </CardTitle>
                <CardDescription>Reality control vectors in effect</CardDescription>
              </CardHeader>
              <CardContent>
                {manipulations.length > 0 ? (
                  <div className="space-y-3">
                    {manipulations.slice(0, 5).map((m) => (
                      <div key={m.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{m.manipulationType}</span>
                          <Badge variant={m.effectivenessScore > 0.7 ? 'default' : 'secondary'}>
                            {(m.effectivenessScore * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Stability: {(m.stabilityRating * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span>{m.perceptionVectors.length} vectors</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No reality manipulations active</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Control Metrics
                </CardTitle>
                <CardDescription>Reality manipulation effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Avg Effectiveness</span>
                    <span className="font-bold">{(avgEffectiveness * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={avgEffectiveness * 100} />
                  <div className="flex justify-between items-center">
                    <span>Avg Stability</span>
                    <span className="font-bold">{(avgStability * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={avgStability * 100} />
                  <div className="flex justify-between items-center">
                    <span>Active Manipulations</span>
                    <span className="font-bold">{activeManipulations}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="supremacy" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Supremacy Domains
                </CardTitle>
                <CardDescription>Areas of absolute control</CardDescription>
              </CardHeader>
              <CardContent>
                {supremacies.length > 0 ? (
                  <div className="space-y-3">
                    {supremacies.slice(0, 5).map((s) => (
                      <div key={s.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{s.supremacyDomain}</span>
                          <Badge variant={s.dominanceScore > 0.8 ? 'default' : 'secondary'}>
                            {(s.dominanceScore * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={s.dominanceScore * 100} className="h-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No supremacy domains established</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Dominance Metrics
                </CardTitle>
                <CardDescription>Strategic control assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Avg Dominance</span>
                    <span className="font-bold">{(avgDominance * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={avgDominance * 100} />
                  <div className="flex justify-between items-center">
                    <span>Sustainability</span>
                    <span className="font-bold">{(avgSustainability * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={avgSustainability * 100} />
                  <div className="flex justify-between items-center">
                    <span>Controlled Domains</span>
                    <span className="font-bold">{supremacyDomains}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Transcendent Operations
                </CardTitle>
                <CardDescription>Beyond-human strategic execution</CardDescription>
              </CardHeader>
              <CardContent>
                {operations.length > 0 ? (
                  <div className="space-y-3">
                    {operations.slice(0, 5).map((op) => (
                      <div key={op.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{op.operationName}</span>
                          <Badge variant={op.status === 'active' ? 'default' : 'secondary'}>
                            {op.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Success: {(op.successProbability * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span>{op.consciousnessLevel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No transcendent operations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Ultimate Synthesis
                </CardTitle>
                <CardDescription>Cross-phase power integration</CardDescription>
              </CardHeader>
              <CardContent>
                {syntheses.length > 0 ? (
                  <div className="space-y-3">
                    {syntheses.slice(0, 5).map((s) => (
                      <div key={s.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{s.synthesisName}</span>
                          <Badge>{s.evolutionStage}</Badge>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Power: {s.totalPowerScore.toFixed(0)}</span>
                          <span>•</span>
                          <span>{s.emergentCapabilities.length} capabilities</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No synthesis records</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UltimateTranscendenceCenter;
