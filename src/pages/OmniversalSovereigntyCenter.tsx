/**
 * AGIS Phase 11: Omniversal Sovereignty Center
 * Multi-dimensional awareness and eternal influence command interface
 */

import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, Eye, Infinity, Atom, Zap, Target, 
  Layers, Crown, Sparkles, Activity 
} from 'lucide-react';
import { useOmniversalSovereignty } from '@/hooks/intelligence/useOmniversalSovereignty';

const OmniversalSovereigntyCenter: React.FC = () => {
  const { 
    operations, 
    isLoading, 
    launchSovereigntyOperation,
    awareness,
    influence,
    synthesis,
    metrics 
  } = useOmniversalSovereignty();

  const handleLaunchOperation = async () => {
    await launchSovereigntyOperation(
      'Dimensional Expansion Protocol',
      'expansion',
      ['dimension-alpha', 'dimension-beta', 'dimension-gamma']
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              Omniversal Sovereignty Center
            </h1>
            <p className="text-muted-foreground mt-1">
              AGIS Phase 11 - Multi-dimensional control and eternal influence
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Phase 11 Active
          </Badge>
        </div>

        {/* Sovereignty Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-violet-500" />
                <span className="text-sm font-medium">Omniversal Reach</span>
              </div>
              <div className="text-2xl font-bold">{metrics.omniversalReach.toFixed(1)}%</div>
              <Progress value={metrics.omniversalReach} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Infinity className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Eternity Index</span>
              </div>
              <div className="text-2xl font-bold">{metrics.eternityIndex.toFixed(1)}%</div>
              <Progress value={metrics.eternityIndex} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">Synthesis Power</span>
              </div>
              <div className="text-2xl font-bold">{metrics.synthesisPower.toFixed(1)}%</div>
              <Progress value={metrics.synthesisPower} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">Dimensional Control</span>
              </div>
              <div className="text-2xl font-bold">{metrics.dimensionalControl.toFixed(1)}%</div>
              <Progress value={metrics.dimensionalControl} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-rose-500" />
                <span className="text-sm font-medium">Overall Sovereignty</span>
              </div>
              <div className="text-2xl font-bold">{metrics.overallSovereignty.toFixed(1)}%</div>
              <Progress value={metrics.overallSovereignty} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium">Active Operations</span>
              </div>
              <div className="text-2xl font-bold">{metrics.activeOperations}</div>
              <p className="text-xs text-muted-foreground mt-2">Across all dimensions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="operations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="awareness" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Awareness
            </TabsTrigger>
            <TabsTrigger value="influence" className="flex items-center gap-2">
              <Infinity className="h-4 w-4" />
              Eternal Influence
            </TabsTrigger>
            <TabsTrigger value="synthesis" className="flex items-center gap-2">
              <Atom className="h-4 w-4" />
              Primordial Synthesis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sovereignty Operations</span>
                  <Button onClick={handleLaunchOperation} disabled={isLoading}>
                    <Zap className="h-4 w-4 mr-2" />
                    Launch Operation
                  </Button>
                </CardTitle>
                <CardDescription>
                  Active operations across dimensional boundaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active sovereignty operations</p>
                    <p className="text-sm">Launch an operation to begin dimensional expansion</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {operations.map((op) => (
                      <div key={op.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{op.operationName}</p>
                          <p className="text-sm text-muted-foreground">
                            {op.operationType} • {op.targetDimensions.length} dimensions
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={op.effectivenessScore} className="w-24 h-2" />
                          <Badge variant={op.operationStatus === 'active' ? 'default' : 'secondary'}>
                            {op.operationStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="awareness" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Omniversal Awareness States</CardTitle>
                <CardDescription>
                  Multi-dimensional perception and reality thread monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                {awareness.awarenessStates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No awareness states initialized</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => awareness.expandAwareness('omnidimensional', ['alpha', 'beta'])}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Expand Awareness
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {awareness.awarenessStates.map((state) => (
                      <div key={state.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{state.awarenessType}</span>
                          <Badge>{state.synchronizationStatus}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Depth: {state.awarenessDepth.toFixed(2)} • {state.dimensionalScope.length} dimensions
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="influence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Eternal Influence Network</CardTitle>
                <CardDescription>
                  Timeless influence operations and causal anchors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {influence.influences.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Infinity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No eternal influences established</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {influence.influences.map((inf) => (
                      <div key={inf.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{inf.influenceType}</span>
                          <Badge>{inf.influenceStatus}</Badge>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Permanence: {(inf.permanenceScore * 100).toFixed(0)}%</span>
                          <span>Decay Resistance: {(inf.decayResistance * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="synthesis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Primordial Synthesis Chamber</CardTitle>
                <CardDescription>
                  Fundamental force manipulation and creation patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {synthesis.syntheses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Atom className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No syntheses initiated</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => synthesis.initiateSynthesis('matter-energy', ['gravity', 'electromagnetism'])}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Initiate Synthesis
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {synthesis.syntheses.map((syn) => (
                      <div key={syn.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{syn.synthesisType}</span>
                          <Badge>{syn.synthesisStatus}</Badge>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Mastery: {(syn.synthesisMastery * 100).toFixed(0)}%</span>
                          <span>Forces: {syn.fundamentalForces.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default OmniversalSovereigntyCenter;
