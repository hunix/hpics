import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, AlertTriangle, Users, Link2, TrendingDown, 
  Play, Target, Zap, Network
} from 'lucide-react';
import { 
  analyzeNetworkResilience, 
  simulateInfluencePropagation,
  analyzeTemporalNetwork,
  analyzeCommunityEvolution,
  recommendStrategicConnections,
  type ResilienceMetrics,
  type InfluencePropagationResult,
  type TemporalNetworkMetrics,
  type CommunityEvolution,
  type StrategicConnection,
} from '@/lib/network';

interface NetworkNode {
  id: string;
  name: string;
  [key: string]: any;
}

interface NetworkLink {
  source: string;
  target: string;
  weight: number;
  timestamp?: number;
}

export function NetworkResiliencePanel() {
  const { user } = useAuth();
  const [simulationSeed, setSimulationSeed] = useState<string | null>(null);
  const [attackTarget, setAttackTarget] = useState<string | null>(null);

  const { data: networkData, isLoading } = useQuery({
    queryKey: ['network-resilience', user?.id],
    queryFn: async () => {
      // Fetch profiles as nodes
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, is_favorite')
        .eq('user_id', user!.id)
        .limit(200);

      // Fetch connections as links
      const { data: connections } = await supabase
        .from('connection_intelligence')
        .select('*')
        .eq('user_id', user!.id);

      // Also get communication-based connections
      const { data: communications } = await supabase
        .from('communications')
        .select('profile_id, occurred_at')
        .eq('user_id', user!.id)
        .order('occurred_at', { ascending: false })
        .limit(1000);

      // Build nodes
      const nodes: NetworkNode[] = (profiles || []).map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name || ''}`.trim(),
        relationship_type: p.relationship_type,
        is_favorite: p.is_favorite,
      }));

      // Build links from connections
      const links: NetworkLink[] = [];
      const linkSet = new Set<string>();

      (connections || []).forEach(conn => {
        const key = [conn.profile_a_id, conn.profile_b_id].sort().join('-');
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push({
            source: conn.profile_a_id,
            target: conn.profile_b_id,
            weight: conn.connection_strength || 0.5,
          });
        }
      });

      // Add inferred connections from communications
      const commsByProfile = new Map<string, number>();
      (communications || []).forEach(c => {
        commsByProfile.set(c.profile_id, (commsByProfile.get(c.profile_id) || 0) + 1);
      });

      // Create synthetic links between highly communicated profiles
      const profileIds = Array.from(commsByProfile.keys());
      for (let i = 0; i < profileIds.length && i < 50; i++) {
        for (let j = i + 1; j < profileIds.length && j < 50; j++) {
          const count1 = commsByProfile.get(profileIds[i]) || 0;
          const count2 = commsByProfile.get(profileIds[j]) || 0;
          
          if (count1 > 5 && count2 > 5) {
            const key = [profileIds[i], profileIds[j]].sort().join('-');
            if (!linkSet.has(key)) {
              linkSet.add(key);
              links.push({
                source: profileIds[i],
                target: profileIds[j],
                weight: Math.min(1, (count1 + count2) / 50),
                timestamp: Date.now(),
              });
            }
          }
        }
      }

      return { nodes, links };
    },
    enabled: !!user,
  });

  // Calculate resilience metrics
  const resilienceMetrics = useMemo<ResilienceMetrics | null>(() => {
    if (!networkData?.nodes.length) return null;
    return analyzeNetworkResilience(networkData.nodes, networkData.links);
  }, [networkData]);

  // Calculate temporal metrics
  const temporalMetrics = useMemo<TemporalNetworkMetrics | null>(() => {
    if (!networkData?.nodes.length) return null;
    return analyzeTemporalNetwork(networkData.nodes, networkData.links);
  }, [networkData]);

  // Calculate community evolution
  const communityEvolution = useMemo<CommunityEvolution | null>(() => {
    if (!networkData?.nodes.length) return null;
    return analyzeCommunityEvolution(networkData.nodes, networkData.links);
  }, [networkData]);

  // Influence propagation simulation
  const influenceSimulation = useMemo<InfluencePropagationResult | null>(() => {
    if (!networkData?.nodes.length || !simulationSeed) return null;
    return simulateInfluencePropagation(
      networkData.nodes, 
      networkData.links, 
      simulationSeed,
      0.3,
      10,
      50
    );
  }, [networkData, simulationSeed]);

  // Strategic connection recommendations
  const connectionRecommendations = useMemo<StrategicConnection[]>(() => {
    if (!networkData?.nodes.length) return [];
    const focusNode = networkData.nodes.find(n => n.is_favorite) || networkData.nodes[0];
    if (!focusNode) return [];
    return recommendStrategicConnections(
      networkData.nodes,
      networkData.links,
      focusNode.id,
      5
    );
  }, [networkData]);

  if (isLoading) {
    return <Skeleton className="h-[500px]" />;
  }

  const nodes = networkData?.nodes || [];
  const getNodeName = (id: string) => nodes.find(n => n.id === id)?.name || 'Unknown';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Network Resilience & Intelligence
        </CardTitle>
        <CardDescription>
          Advanced network analysis with influence simulation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resilience" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="resilience">Resilience</TabsTrigger>
            <TabsTrigger value="influence">Influence</TabsTrigger>
            <TabsTrigger value="temporal">Temporal</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
          </TabsList>

          {/* Resilience Tab */}
          <TabsContent value="resilience" className="space-y-4">
            {resilienceMetrics && (
              <>
                {/* Vulnerability Score */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Network Vulnerability</span>
                    <Badge 
                      variant={
                        resilienceMetrics.vulnerabilityScore > 0.6 ? 'destructive' :
                        resilienceMetrics.vulnerabilityScore > 0.3 ? 'secondary' : 'default'
                      }
                    >
                      {(resilienceMetrics.vulnerabilityScore * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={resilienceMetrics.vulnerabilityScore * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {resilienceMetrics.vulnerabilityScore > 0.6 
                      ? 'High risk: Network is fragile with critical dependencies'
                      : resilienceMetrics.vulnerabilityScore > 0.3
                      ? 'Moderate: Some key nodes are critical to connectivity'
                      : 'Robust: Network has good redundancy'}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Network className="h-4 w-4" />
                      Giant Component
                    </div>
                    <div className="text-xl font-bold">
                      {(resilienceMetrics.giantComponentRatio * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Link2 className="h-4 w-4" />
                      Avg Connections
                    </div>
                    <div className="text-xl font-bold">
                      {resilienceMetrics.averageConnectivity.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Critical Nodes */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-sm">Critical Nodes</span>
                    <Badge variant="outline">{resilienceMetrics.criticalNodes.length}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Removing these nodes would significantly fragment the network
                  </p>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-1">
                      {resilienceMetrics.criticalNodes.map(nodeId => (
                        <div 
                          key={nodeId}
                          className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-sm"
                        >
                          {getNodeName(nodeId)}
                        </div>
                      ))}
                      {resilienceMetrics.criticalNodes.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No critical dependencies detected
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </TabsContent>

          {/* Influence Simulation Tab */}
          <TabsContent value="influence" className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-3">
                Simulate how information spreads from a seed contact
              </p>
              <div className="flex flex-wrap gap-2">
                {nodes.slice(0, 8).map(node => (
                  <Button
                    key={node.id}
                    variant={simulationSeed === node.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSimulationSeed(node.id)}
                  >
                    {node.name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>

            {influenceSimulation && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg border text-center">
                    <div className="text-lg font-bold text-primary">
                      {influenceSimulation.maxReach}
                    </div>
                    <div className="text-xs text-muted-foreground">Max Reach</div>
                  </div>
                  <div className="p-2 rounded-lg border text-center">
                    <div className="text-lg font-bold">
                      {influenceSimulation.avgTimeToReach.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Steps</div>
                  </div>
                  <div className="p-2 rounded-lg border text-center">
                    <div className="text-lg font-bold text-amber-600">
                      {influenceSimulation.bottlenecks.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Bottlenecks</div>
                  </div>
                </div>

                {/* Propagation Waves */}
                <div>
                  <span className="text-sm font-medium">Propagation Waves</span>
                  <div className="flex items-center gap-1 mt-2">
                    {influenceSimulation.propagationWaves.slice(0, 6).map((wave, i) => (
                      <div 
                        key={i}
                        className="flex-1 h-8 bg-primary/20 rounded flex items-center justify-center text-xs"
                        style={{ 
                          opacity: 0.3 + (wave.cumulativeReach / influenceSimulation.maxReach) * 0.7 
                        }}
                      >
                        +{wave.nodesReached.length}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottlenecks */}
                {influenceSimulation.bottlenecks.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Bottleneck Nodes</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {influenceSimulation.bottlenecks.map(id => (
                        <Badge key={id} variant="secondary">
                          {getNodeName(id)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Temporal Analysis Tab */}
          <TabsContent value="temporal" className="space-y-4">
            {temporalMetrics && (
              <>
                {/* Sleeping Connections */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-sm">Sleeping Connections</span>
                    <Badge variant="outline">
                      {temporalMetrics.sleepingConnections.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {temporalMetrics.sleepingConnections.slice(0, 10).map(conn => (
                        <div 
                          key={conn.nodeId}
                          className="p-2 rounded-lg border flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {getNodeName(conn.nodeId)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Dormant {conn.dormancyDays} days
                            </div>
                          </div>
                          <Badge 
                            variant={
                              conn.revivalPotential === 'high' ? 'default' :
                              conn.revivalPotential === 'medium' ? 'secondary' : 'outline'
                            }
                          >
                            {conn.revivalPotential} revival
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Trajectory Predictions */}
                <div>
                  <span className="font-medium text-sm">Relationship Trajectories</span>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div className="p-2 rounded-lg border text-center bg-green-500/10">
                      <div className="font-bold text-green-600">
                        {temporalMetrics.trajectoryPredictions.filter(t => t.trend === 'strengthening').length}
                      </div>
                      <div className="text-xs">Growing</div>
                    </div>
                    <div className="p-2 rounded-lg border text-center bg-muted/50">
                      <div className="font-bold">
                        {temporalMetrics.trajectoryPredictions.filter(t => t.trend === 'stable').length}
                      </div>
                      <div className="text-xs">Stable</div>
                    </div>
                    <div className="p-2 rounded-lg border text-center bg-amber-500/10">
                      <div className="font-bold text-amber-600">
                        {temporalMetrics.trajectoryPredictions.filter(t => t.trend === 'weakening').length}
                      </div>
                      <div className="text-xs">Weakening</div>
                    </div>
                    <div className="p-2 rounded-lg border text-center bg-destructive/10">
                      <div className="font-bold text-destructive">
                        {temporalMetrics.trajectoryPredictions.filter(t => t.trend === 'dormant').length}
                      </div>
                      <div className="text-xs">Dormant</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4">
            {/* Community Health */}
            {communityEvolution && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Community Health</span>
                  <Badge>
                    {communityEvolution.communities.length} clusters
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold">
                      {(communityEvolution.healthMetrics.avgCohesion * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Cohesion</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600">
                      {(communityEvolution.healthMetrics.fragmentationRisk * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Frag. Risk</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {(communityEvolution.healthMetrics.growthPotential * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Growth</div>
                  </div>
                </div>
              </div>
            )}

            {/* Strategic Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Strategic Connections</span>
              </div>
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {connectionRecommendations.map((rec, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {getNodeName(rec.targetId ?? '')}
                        </span>
                        <div className="flex gap-1">
                          {rec.bridgesCommunities && (
                            <Badge variant="secondary" className="text-xs">Bridge</Badge>
                          )}
                          {rec.fillsStructuralHole && (
                            <Badge variant="default" className="text-xs">Strategic</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span>ROI: <strong>{(rec.networkROI ?? 0).toFixed(1)}</strong></span>
                        <span>•</span>
                        <span>Score: <strong>{(rec.score ?? 0).toFixed(2)}</strong></span>
                      </div>
                    </div>
                  ))}
                  {connectionRecommendations.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Build more connections to get strategic recommendations
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
