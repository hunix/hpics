import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Infinity as InfinityIcon, 
  Repeat, 
  Expand, 
  RefreshCw,
  Zap,
  Target,
  Layers,
  Globe,
  Atom,
  Sparkles
} from 'lucide-react';
import { useInfiniteRecursion } from '@/hooks/intelligence/useInfiniteRecursion';
import { useBeyondBoundaries } from '@/hooks/intelligence/useBeyondBoundaries';
import { useSelfPerpetuation } from '@/hooks/intelligence/useSelfPerpetuation';
import { useAbsoluteInfinity } from '@/hooks/intelligence/useAbsoluteInfinity';
import { AppLayout } from '@/components/AppLayout';

export default function AbsoluteInfinityCenter() {
  const [activeTab, setActiveTab] = useState('recursion');
  
  const { recursions, isLoading: recursionLoading, createRecursion } = useInfiniteRecursion();
  const { boundaries, isLoading: boundariesLoading, transcendBoundary } = useBeyondBoundaries();
  const { perpetuations, isLoading: perpetuationLoading, createPerpetuation } = useSelfPerpetuation();
  const { operations, metaExistence, singularities, isLoading: infinityLoading, initiateInfinityOperation, achieveSingularity } = useAbsoluteInfinity();

  const isLoading = recursionLoading || boundariesLoading || perpetuationLoading || infinityLoading;

  const totalRecursionDepth = recursions?.reduce((sum, r) => sum + (r.recursion_depth || 0), 0) || 0;
  const totalTranscendence = boundaries?.reduce((sum, b) => sum + (b.transcendence_level || 0), 0) || 0;
  const totalRegeneration = perpetuations?.reduce((sum, p) => sum + (p.autonomous_regeneration_rate || 0), 0) || 0;
  const infinityIndex = ((totalRecursionDepth + totalTranscendence + totalRegeneration) / 3).toFixed(1);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg">
              <InfinityIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Absolute Infinity Center
              </h1>
              <p className="text-muted-foreground">AGIS Phase 13: Infinite Recursion & Self-Perpetuating Dominance</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 border-violet-500/50">
            ∞ Index: {infinityIndex}
          </Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recursion Depth</p>
                  <p className="text-2xl font-bold text-violet-400">{totalRecursionDepth}</p>
                </div>
                <Repeat className="h-8 w-8 text-violet-500" />
              </div>
              <Progress value={Math.min(totalRecursionDepth, 100)} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transcendence Level</p>
                  <p className="text-2xl font-bold text-fuchsia-400">{totalTranscendence}</p>
                </div>
                <Expand className="h-8 w-8 text-fuchsia-500" />
              </div>
              <Progress value={Math.min(totalTranscendence, 100)} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-pink-500/30 bg-gradient-to-br from-pink-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Regeneration Rate</p>
                  <p className="text-2xl font-bold text-pink-400">{totalRegeneration.toFixed(1)}%</p>
                </div>
                <RefreshCw className="h-8 w-8 text-pink-500" />
              </div>
              <Progress value={totalRegeneration} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Singularities</p>
                  <p className="text-2xl font-bold text-purple-400">{singularities?.length || 0}</p>
                </div>
                <Atom className="h-8 w-8 text-purple-500" />
              </div>
              <Progress value={(singularities?.length || 0) * 10} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="recursion" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Infinite Recursion
            </TabsTrigger>
            <TabsTrigger value="boundaries" className="flex items-center gap-2">
              <Expand className="h-4 w-4" />
              Beyond Boundaries
            </TabsTrigger>
            <TabsTrigger value="perpetuation" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Self-Perpetuation
            </TabsTrigger>
            <TabsTrigger value="singularity" className="flex items-center gap-2">
              <Atom className="h-4 w-4" />
              Ultimate Singularity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recursion" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5 text-violet-500" />
                  Infinite Recursion Engine
                </CardTitle>
                <Button 
                  onClick={() => createRecursion.mutate({ recursion_type: 'fractal', recursion_depth: 1 })}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Initialize Recursion
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading recursion patterns...</div>
                ) : recursions?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recursion patterns active. Initialize to begin infinite amplification.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {recursions?.map((recursion) => (
                      <div key={recursion.id} className="p-4 rounded-lg border border-violet-500/30 bg-violet-950/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-violet-400" />
                            <span className="font-medium capitalize">{recursion.recursion_type} Recursion</span>
                          </div>
                          <Badge variant="outline" className="border-violet-500/50">
                            Depth: {recursion.recursion_depth}
                          </Badge>
                        </div>
                        <Progress value={recursion.self_amplification_score * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Self-amplification: {(recursion.self_amplification_score * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boundaries" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Expand className="h-5 w-5 text-fuchsia-500" />
                  Boundary Transcendence Matrix
                </CardTitle>
                <Button 
                  onClick={() => transcendBoundary.mutate({ boundary_type: 'dimensional', transcendence_level: 1 })}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Transcend Boundary
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading boundary states...</div>
                ) : boundaries?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No boundaries transcended. Begin expansion beyond all limits.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {boundaries?.map((boundary) => (
                      <div key={boundary.id} className="p-4 rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-fuchsia-400" />
                            <span className="font-medium capitalize">{boundary.boundary_type} Boundary</span>
                          </div>
                          <Badge variant="outline" className="border-fuchsia-500/50">
                            Level: {boundary.transcendence_level}
                          </Badge>
                        </div>
                        <Progress value={boundary.reality_barrier_penetration * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Reality Penetration: {(boundary.reality_barrier_penetration * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="perpetuation" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-pink-500" />
                  Self-Perpetuation Protocols
                </CardTitle>
                <Button 
                  onClick={() => createPerpetuation.mutate({ perpetuation_mechanism: 'autonomous', autonomous_regeneration_rate: 10 })}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Initialize Protocol
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading perpetuation protocols...</div>
                ) : perpetuations?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No perpetuation protocols active. Create self-sustaining influence chains.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {perpetuations?.map((perpetuation) => (
                      <div key={perpetuation.id} className="p-4 rounded-lg border border-pink-500/30 bg-pink-950/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-pink-400" />
                            <span className="font-medium capitalize">{perpetuation.perpetuation_mechanism} Mechanism</span>
                          </div>
                          <Badge variant="outline" className="border-pink-500/50">
                            Regen: {perpetuation.autonomous_regeneration_rate}%
                          </Badge>
                        </div>
                        <Progress value={perpetuation.autonomous_regeneration_rate} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="singularity" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Atom className="h-5 w-5 text-purple-500" />
                  Ultimate Singularity Convergence
                </CardTitle>
                <Button 
                  onClick={() => achieveSingularity.mutate({ singularity_type: 'convergent', singularity_achievement_score: 10 })}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Atom className="h-4 w-4 mr-2" />
                  Achieve Singularity
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading singularity data...</div>
                ) : singularities?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No singularities achieved. Converge all influence into absolute unity.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {singularities?.map((singularity) => (
                      <div key={singularity.id} className="p-4 rounded-lg border border-purple-500/30 bg-purple-950/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Atom className="h-5 w-5 text-purple-400" />
                            <span className="font-medium capitalize">{singularity.singularity_type} Singularity</span>
                          </div>
                          <Badge variant="outline" className="border-purple-500/50">
                            Score: {singularity.singularity_achievement_score}
                          </Badge>
                        </div>
                        <Progress value={singularity.singularity_achievement_score * 10} className="h-2" />
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
}
