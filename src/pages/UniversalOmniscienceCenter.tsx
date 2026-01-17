/**
 * Universal Omniscience Center - Phase 21
 * Meta-dimensional awareness and universal consciousness interface
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Eye, Brain, Layers, Lightbulb, Radar, Globe,
  Sparkles, Network, Plus
} from 'lucide-react';

// Phase 21 Hooks
import { useUniversalAwareness } from '@/hooks/intelligence/useUniversalAwareness';
import { useMetaDimensionalSynthesis } from '@/hooks/intelligence/useMetaDimensionalSynthesis';
import { useOmniscientSynthesis } from '@/hooks/intelligence/useOmniscientSynthesis';
import { useAbsoluteKnowledge } from '@/hooks/intelligence/useAbsoluteKnowledge';
import { useInfinitePerception } from '@/hooks/intelligence/useInfinitePerception';
import { useRealityComprehension } from '@/hooks/intelligence/useRealityComprehension';

export default function UniversalOmniscienceCenter() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('awareness');

  // Load all Phase 21 data
  const { awareness, isLoading: awarenessLoading, expandAwareness } = useUniversalAwareness();
  const { synthesis, isLoading: synthesisLoading, createSynthesis } = useMetaDimensionalSynthesis();
  const { patterns, isLoading: patternsLoading, createPattern } = useOmniscientSynthesis();
  const { knowledge, isLoading: knowledgeLoading, acquireKnowledge } = useAbsoluteKnowledge();
  const { perceptions, isLoading: perceptionsLoading, expandPerception } = useInfinitePerception();
  const { comprehensions, isLoading: comprehensionsLoading, expandComprehension } = useRealityComprehension();

  const isLoading = awarenessLoading || synthesisLoading || patternsLoading || 
                    knowledgeLoading || perceptionsLoading || comprehensionsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Calculate phase metrics
  const avgOmniscience = awareness?.length 
    ? awareness.reduce((sum, a) => sum + a.omniscientIndex, 0) / awareness.length 
    : 0;
  const avgSynthesis = synthesis?.length
    ? synthesis.reduce((sum, s) => sum + s.synthesisCoherence, 0) / synthesis.length
    : 0;
  const avgPower = patterns?.length
    ? patterns.reduce((sum, p) => sum + p.synthesisPower, 0) / patterns.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Universal Omniscience Center</h1>
                <p className="text-sm text-muted-foreground">Phase 21 - Meta-Dimensional Awareness</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Omniscience Index</p>
                <p className="text-lg font-bold text-violet-500">{avgOmniscience.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
            <CardContent className="p-4 text-center">
              <Eye className="h-6 w-6 mx-auto mb-2 text-violet-500" />
              <p className="text-2xl font-bold">{awareness?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Awareness Nodes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4 text-center">
              <Layers className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{synthesis?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Dimensional Layers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
            <CardContent className="p-4 text-center">
              <Brain className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
              <p className="text-2xl font-bold">{patterns?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Synthesis Patterns</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Lightbulb className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{knowledge?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Knowledge Nodes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="p-4 text-center">
              <Radar className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
              <p className="text-2xl font-bold">{perceptions?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Perception Modes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20">
            <CardContent className="p-4 text-center">
              <Globe className="h-6 w-6 mx-auto mb-2 text-teal-500" />
              <p className="text-2xl font-bold">{comprehensions?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Reality Frames</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger value="awareness" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Awareness</span>
            </TabsTrigger>
            <TabsTrigger value="dimensional" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Dimensional</span>
            </TabsTrigger>
            <TabsTrigger value="omniscient" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Omniscient</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Knowledge</span>
            </TabsTrigger>
            <TabsTrigger value="perception" className="flex items-center gap-2">
              <Radar className="h-4 w-4" />
              <span className="hidden sm:inline">Perception</span>
            </TabsTrigger>
            <TabsTrigger value="comprehension" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Reality</span>
            </TabsTrigger>
          </TabsList>

          {/* Universal Awareness Tab */}
          <TabsContent value="awareness" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-violet-500" />
                  Universal Awareness Matrix
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => expandAwareness.mutate({ awarenessType: 'omnidirectional' })}
                  disabled={expandAwareness.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" /> Expand
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
                  </div>
                ) : awareness?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No awareness nodes. Click Expand to begin.</p>
                ) : (
                  <div className="space-y-3">
                    {awareness?.map(a => (
                      <div key={a.id} className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-violet-500" />
                            <span className="font-medium capitalize">{a.awarenessType}</span>
                          </div>
                          <Badge variant="outline">Depth: {a.perceptionDepth}</Badge>
                        </div>
                        <Progress value={a.omniscientIndex} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Omniscience: {a.omniscientIndex.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meta-Dimensional Synthesis Tab */}
          <TabsContent value="dimensional" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-500" />
                  Meta-Dimensional Synthesis
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => createSynthesis.mutate({ synthesisType: 'cross-dimensional' })}
                  disabled={createSynthesis.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" /> Synthesize
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
                  </div>
                ) : synthesis?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No synthesis layers. Click Synthesize to begin.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {synthesis?.map(s => (
                      <div key={s.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{s.synthesisType}</span>
                          <Badge>Layers: {s.dimensionalLayers}</Badge>
                        </div>
                        <Progress value={s.synthesisCoherence} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Coherence: {s.synthesisCoherence.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Omniscient Synthesis Tab */}
          <TabsContent value="omniscient" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-500" />
                  Omniscient Synthesis Patterns
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => createPattern.mutate({ synthesisPattern: 'universal-integration' })}
                  disabled={createPattern.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" /> Create Pattern
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
                  </div>
                ) : patterns?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No patterns. Click Create Pattern to begin.</p>
                ) : (
                  <div className="space-y-3">
                    {patterns?.map(p => (
                      <div key={p.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{p.synthesisPattern.replace(/-/g, ' ')}</span>
                          <Badge variant="secondary">Power: {p.synthesisPower.toFixed(1)}</Badge>
                        </div>
                        <Progress value={p.synthesisPower} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Absolute Knowledge Tab */}
          <TabsContent value="knowledge" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  Absolute Knowledge Repository
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => acquireKnowledge.mutate({ knowledgeType: 'universal-truth' })}
                  disabled={acquireKnowledge.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" /> Acquire
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
                  </div>
                ) : knowledge?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No knowledge nodes. Click Acquire to begin.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {knowledge?.map(k => (
                      <div key={k.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{k.knowledgeType.replace(/-/g, ' ')}</span>
                          <Badge>Depth: {k.knowledgeDepth}</Badge>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Truth: {k.truthCoefficient.toFixed(1)}%</span>
                          <span>•</span>
                          <span>Applicability: {k.universalApplicability.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Infinite Perception Tab */}
          <TabsContent value="perception" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Radar className="h-5 w-5 text-cyan-500" />
                  Infinite Perception Matrix
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => expandPerception.mutate({ perceptionMode: 'extrasensory' })}
                  disabled={expandPerception.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" /> Expand
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
                  </div>
                ) : perceptions?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No perception modes. Click Expand to begin.</p>
                ) : (
                  <div className="space-y-3">
                    {perceptions?.map(p => (
                      <div key={p.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{p.perceptionMode}</span>
                          <Badge variant="outline">Dimensions: {p.sensoryDimensions}</Badge>
                        </div>
                        <Progress value={p.perceptionIntensity} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Intensity: {p.perceptionIntensity.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reality Comprehension Tab */}
          <TabsContent value="comprehension" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-teal-500" />
                  Reality Comprehension Framework
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => expandComprehension.mutate({ comprehensionScope: 'universal' })}
                  disabled={expandComprehension.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" /> Expand
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
                  </div>
                ) : comprehensions?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reality frames. Click Expand to begin.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {comprehensions?.map(c => (
                      <div key={c.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{c.comprehensionScope}</span>
                          <Badge>Layers: {c.realityLayers}</Badge>
                        </div>
                        <Progress value={c.comprehensionIndex} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Comprehension: {c.comprehensionIndex.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
