import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Share2, Users, TrendingUp, AlertTriangle, Zap, Link2, 
  RefreshCw, Loader2, Target, ShieldCheck, Lightbulb,
  Brain, Shield, Radio
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  calculateEigenvectorCentrality, 
  detectWeakTies, 
  predictLinks,
  analyzeNetworkResilience,
  classifyCommunityRoles,
  identifyGrowthOpportunities,
  detectClusters,
  detectCommunitiesGATFELPA,
  predictTrust,
  maximizeTemporalInfluence,
  type WeakTie,
  type PredictedLink,
  type ResilienceMetrics,
  type NodeRole,
  type GrowthOpportunity,
  type GatfelpaResult,
  type TrustPrediction,
  type TemporalInfluenceResult,
} from '@/lib/network';

interface NetworkNode {
  id: string;
  name: string;
  [key: string]: any;
}

interface NetworkLink {
  source: string;
  target: string;
  weight?: number;
}

export function AdvancedNetworkDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: networkData, isLoading, refetch } = useQuery({
    queryKey: ['advanced-network-data', user?.id],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, is_favorite')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(500);

      const profileIds = (profiles || []).map(p => p.id);

      const { data: relationships } = await supabase
        .from('contact_relationships')
        .select('from_profile_id, to_profile_id, relationship_type')
        .eq('user_id', user!.id)
        .in('from_profile_id', profileIds)
        .in('to_profile_id', profileIds);

      const nodes: NetworkNode[] = (profiles || []).map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name || ''}`.trim(),
        organization: p.organization,
        isFavorite: p.is_favorite,
      }));

      const links: NetworkLink[] = (relationships || []).map(r => ({
        source: r.from_profile_id,
        target: r.to_profile_id,
        weight: 1,
      }));

      // Classic algorithms
      const clusters = detectClusters(nodes, links);
      const eigenvector = calculateEigenvectorCentrality(nodes, links);
      const weakTies = detectWeakTies(nodes, links, clusters);
      const predictions = predictLinks(nodes, links, 15);
      const resilience = analyzeNetworkResilience(nodes, links);
      const roles = classifyCommunityRoles(nodes, links, clusters);
      const opportunities = identifyGrowthOpportunities(nodes, links, clusters);

      // === v10.0 Enhanced Engines ===
      // GATFELPA Community Detection
      let gatfelpaResult: GatfelpaResult | null = null;
      try {
        gatfelpaResult = detectCommunitiesGATFELPA(nodes, links);
      } catch (e) {
        if (e instanceof Error) console.warn('[GATFELPA] Detection failed:', e.message);
      }

      // TrustGuard Trust Predictions for top influencers
      const trustPredictions: TrustPrediction[] = [];
      const topInfluencerIds = Array.from(eigenvector.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([id]) => id);
      
      for (const nodeId of topInfluencerIds) {
        try {
          const tp = predictTrust(nodes, links, nodeId);
          trustPredictions.push(tp);
        } catch (e) {
          if (e instanceof Error) console.warn('[TrustGuard] Failed for', nodeId);
        }
      }

      // TempRL-IM Influence Maximization
      let influenceResult: TemporalInfluenceResult | null = null;
      try {
        influenceResult = maximizeTemporalInfluence(nodes, links, 5, 10);
      } catch (e) {
        if (e instanceof Error) console.warn('[TempRL-IM] Failed:', e.message);
      }

      // Get top influencers
      const influencers = Array.from(eigenvector.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, score]) => ({
          id,
          name: nodes.find(n => n.id === id)?.name || 'Unknown',
          score,
          trust: trustPredictions.find(t => t.nodeId === id),
        }));

      const roleDistribution = roles.reduce((acc, r) => {
        acc[r.role] = (acc[r.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        nodes,
        links,
        clusters,
        influencers,
        weakTies,
        predictions,
        resilience,
        roles,
        roleDistribution,
        opportunities,
        // v10.0 enhanced
        gatfelpaResult,
        trustPredictions,
        influenceResult,
        stats: {
          totalNodes: nodes.length,
          totalLinks: links.length,
          communities: new Set(clusters.values()).size,
          gatfelpaCommunities: gatfelpaResult?.communities.length || 0,
          density: nodes.length > 1 ? (2 * links.length) / (nodes.length * (nodes.length - 1)) : 0,
        },
      };
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const analyzeNetworkMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-network-intelligence');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
      toast.success('Network analysis complete');
    },
    onError: (error) => {
      if (error instanceof Error) toast.error(error.message);
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader': return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Leader</Badge>;
      case 'connector': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Connector</Badge>;
      case 'active': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>;
      case 'peripheral': return <Badge variant="outline">Peripheral</Badge>;
      case 'isolated': return <Badge variant="secondary">Isolated</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Advanced Network Analytics
          </h2>
          <p className="text-muted-foreground">Deep ML-powered network intelligence (v10.0 Enhanced)</p>
        </div>
        <Button onClick={() => analyzeNetworkMutation.mutate()} disabled={analyzeNetworkMutation.isPending}>
          {analyzeNetworkMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Analysis
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold">{networkData?.stats.totalNodes || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connections</p>
                <p className="text-2xl font-bold">{networkData?.stats.totalLinks || 0}</p>
              </div>
              <Link2 className="h-8 w-8 text-chart-2 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Communities</p>
                <p className="text-2xl font-bold">{networkData?.stats.communities || 0}</p>
              </div>
              <Target className="h-8 w-8 text-chart-3 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GATFELPA</p>
                <p className="text-2xl font-bold">{networkData?.stats.gatfelpaCommunities || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-violet-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Density</p>
                <p className="text-2xl font-bold">{((networkData?.stats.density || 0) * 100).toFixed(1)}%</p>
              </div>
              <Zap className="h-8 w-8 text-chart-4 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resilience</p>
                <p className="text-2xl font-bold">{((1 - (networkData?.resilience?.vulnerabilityScore || 0)) * 100).toFixed(0)}%</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-chart-5 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Influencers</TabsTrigger>
          <TabsTrigger value="trust">Trust</TabsTrigger>
          <TabsTrigger value="gatfelpa">GATFELPA</TabsTrigger>
          <TabsTrigger value="influence">Influence</TabsTrigger>
          <TabsTrigger value="weakties">Weak Ties</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="resilience">Resilience</TabsTrigger>
          <TabsTrigger value="opportunities">Growth</TabsTrigger>
        </TabsList>

        {/* Influencers Tab */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Influencers (Eigenvector Centrality)
              </CardTitle>
              <CardDescription>Nodes connected to other influential nodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {networkData?.influencers.map((inf, idx) => (
                  <div key={inf.id} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{inf.name}</p>
                        {inf.trust && (
                          <Badge variant="outline" className="text-xs">
                            Trust: {(inf.trust.trustScore * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <Progress value={inf.score * 100} className="h-2 mt-1" />
                    </div>
                    <Badge variant="outline">{(inf.score * 100).toFixed(0)}%</Badge>
                    {networkData.roles.find(r => r.nodeId === inf.id) && 
                      getRoleBadge(networkData.roles.find(r => r.nodeId === inf.id)!.role)
                    }
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TrustGuard Tab */}
        <TabsContent value="trust" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                TrustGuard GNN Trust Evaluation
              </CardTitle>
              <CardDescription>
                Multi-factor trust assessment with explainable factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {networkData?.trustPredictions
                    .sort((a, b) => b.trustScore - a.trustScore)
                    .map((tp) => (
                      <div key={tp.nodeId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {networkData.nodes.find(n => n.id === tp.nodeId)?.name || tp.nodeId}
                            </span>
                            <Badge variant={
                              tp.trend === 'increasing' ? 'default' :
                              tp.trend === 'decreasing' ? 'destructive' : 'secondary'
                            }>
                              {tp.trend}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold">
                              {(tp.trustScore * 100).toFixed(0)}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              conf: {(tp.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={tp.trustScore * 100} className="h-2 mb-3" />
                        <div className="flex flex-wrap gap-1">
                          {tp.factors.map((f, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {f.name}: {f.evidence}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{tp.explanation}</p>
                      </div>
                    ))}
                  {(!networkData?.trustPredictions || networkData.trustPredictions.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No trust predictions available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GATFELPA Tab */}
        <TabsContent value="gatfelpa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-500" />
                GATFELPA Community Detection
              </CardTitle>
              <CardDescription>
                Graph Attention + Enhanced Label Propagation (Nature Scientific Reports 2025)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {networkData?.gatfelpaResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-violet-500">{networkData.gatfelpaResult.communities.length}</p>
                      <p className="text-xs text-muted-foreground">Communities</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{(networkData.gatfelpaResult.modularity * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Modularity</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{networkData.gatfelpaResult.iterations}</p>
                      <p className="text-xs text-muted-foreground">Iterations</p>
                    </div>
                  </div>
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3">
                      {networkData.gatfelpaResult.communities
                        .sort((a, b) => b.members.length - a.members.length)
                        .map((comm, idx) => (
                          <div key={comm.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: `hsl(${idx * 47}, 70%, 55%)` }} />
                                <span className="font-medium">Community {idx + 1}</span>
                                <Badge variant="outline">{comm.members.length} members</Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Cohesion: {(comm.cohesion * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {comm.members.slice(0, 8).map(mId => (
                                <Badge key={mId} variant="secondary" className="text-xs">
                                  {networkData.nodes.find(n => n.id === mId)?.name || mId.slice(0, 8)}
                                </Badge>
                              ))}
                              {comm.members.length > 8 && (
                                <Badge variant="outline" className="text-xs">
                                  +{comm.members.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>GATFELPA requires at least 3 nodes to run</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TempRL-IM Influence Maximization Tab */}
        <TabsContent value="influence" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-amber-500" />
                TempRL-IM Influence Maximization
              </CardTitle>
              <CardDescription>
                Temporal reinforcement learning for optimal influence seed selection (Nature 2026)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {networkData?.influenceResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-500">{networkData.influenceResult.seeds.length}</p>
                      <p className="text-xs text-muted-foreground">Seed Nodes</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{(networkData.influenceResult.expectedReach * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Expected Reach</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{networkData.influenceResult.optimalTiming.length}</p>
                      <p className="text-xs text-muted-foreground">Timing Phases</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Optimal Seed Nodes</h4>
                    <div className="space-y-2">
                      {networkData.influenceResult.seedSet.map((seed, idx) => (
                        <div key={seed.nodeId} className="p-3 border rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-amber-500">#{idx + 1}</span>
                            <div>
                              <p className="font-medium">
                                {networkData.nodes.find(n => n.id === seed.nodeId)?.name || seed.nodeId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Phase {seed.activationPhase + 1} activation
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Marginal: {seed.marginalGain.toFixed(2)}
                            </Badge>
                            <Badge>
                              Reward: {seed.expectedReward.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Radio className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Influence maximization requires a connected network</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weak Ties Tab (existing) */}
        <TabsContent value="weakties" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Valuable Weak Ties</CardTitle>
              <CardDescription>Loose connections bridging different communities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {networkData?.weakTies.slice(0, 15).map((tie, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {networkData.nodes.find(n => n.id === tie.nodeId)?.name || 'Unknown'}
                          </span>
                          <span className="text-muted-foreground">↔</span>
                          <span className="font-medium">
                            {networkData.nodes.find(n => n.id === tie.targetId)?.name || 'Unknown'}
                          </span>
                        </div>
                        <Badge variant={tie.potentialValue === 'high' ? 'default' : tie.potentialValue === 'medium' ? 'secondary' : 'outline'}>
                          {tie.potentialValue} value
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Bridge score: {(tie.bridgeScore * 100).toFixed(0)}%</span>
                        <span>Communities: {tie.communities.join(' ↔ ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab (existing) */}
        <TabsContent value="predictions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Predicted Connections</CardTitle>
              <CardDescription>Likely future connections based on network structure</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {networkData?.predictions.map((pred, idx) => (
                    <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {networkData.nodes.find(n => n.id === pred.source)?.name || 'Unknown'}
                        </span>
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {networkData.nodes.find(n => n.id === pred.target)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{pred.commonNeighbors} mutual</span>
                        <Badge variant="outline">{(pred.score * 10).toFixed(1)} score</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resilience Tab (existing) */}
        <TabsContent value="resilience" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Network Resilience Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Giant Component Ratio</p>
                  <p className="text-2xl font-bold">{((networkData?.resilience?.giantComponentRatio || 0) * 100).toFixed(0)}%</p>
                  <Progress value={(networkData?.resilience?.giantComponentRatio || 0) * 100} className="h-2 mt-2" />
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Average Connectivity</p>
                  <p className="text-2xl font-bold">{(networkData?.resilience?.averageConnectivity || 0).toFixed(1)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Critical Nodes (Single Points of Failure)
                </h4>
                <div className="space-y-2">
                  {networkData?.resilience?.criticalNodes.map(nodeId => (
                    <div key={nodeId} className="p-2 border border-amber-200 dark:border-amber-800 rounded bg-amber-50/50 dark:bg-amber-950/20">
                      <span className="font-medium">
                        {networkData.nodes.find(n => n.id === nodeId)?.name || nodeId}
                      </span>
                    </div>
                  ))}
                  {(!networkData?.resilience?.criticalNodes || networkData.resilience.criticalNodes.length === 0) && (
                    <p className="text-sm text-muted-foreground">No critical nodes detected</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Tab (existing) */}
        <TabsContent value="opportunities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Growth Opportunities
              </CardTitle>
              <CardDescription>Strategic actions to strengthen your network</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {networkData?.opportunities.map((opp, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={opp.type === 'bridge_gap' ? 'default' : opp.type === 'add_redundancy' ? 'secondary' : 'outline'}>
                          {opp.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Impact: {(opp.impact * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm">{opp.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}