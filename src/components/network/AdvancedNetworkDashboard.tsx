import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Share2, Users, TrendingUp, AlertTriangle, Zap, Link2, 
  RefreshCw, Loader2, Target, ShieldCheck, Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  calculateEigenvectorCentrality, 
  detectWeakTies, 
  predictLinks,
  analyzeNetworkResilience,
  classifyCommunityRoles,
  identifyGrowthOpportunities,
  WeakTie,
  PredictedLink,
  ResilienceMetrics,
  NodeRole,
  GrowthOpportunity
} from '@/lib/networkAlgorithmsAdvanced';
import { detectClusters } from '@/lib/networkAlgorithms';

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

      // Run algorithms
      const clusters = detectClusters(nodes, links);
      const eigenvector = calculateEigenvectorCentrality(nodes, links);
      const weakTies = detectWeakTies(nodes, links, clusters);
      const predictions = predictLinks(nodes, links, 15);
      const resilience = analyzeNetworkResilience(nodes, links);
      const roles = classifyCommunityRoles(nodes, links, clusters);
      const opportunities = identifyGrowthOpportunities(nodes, links, clusters);

      // Get top influencers
      const influencers = Array.from(eigenvector.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, score]) => ({
          id,
          name: nodes.find(n => n.id === id)?.name || 'Unknown',
          score,
        }));

      // Role distribution
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
        stats: {
          totalNodes: nodes.length,
          totalLinks: links.length,
          communities: new Set(clusters.values()).size,
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
      toast.error(error.message);
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
          <p className="text-muted-foreground">Deep ML-powered network intelligence</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Influencers</TabsTrigger>
          <TabsTrigger value="weakties">Weak Ties</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="resilience">Resilience</TabsTrigger>
          <TabsTrigger value="opportunities">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Influencers (Eigenvector Centrality)
              </CardTitle>
              <CardDescription>
                Nodes connected to other influential nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {networkData?.influencers.map((inf, idx) => (
                  <div key={inf.id} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{inf.name}</p>
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

        <TabsContent value="weakties" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Valuable Weak Ties</CardTitle>
              <CardDescription>
                Loose connections bridging different communities
              </CardDescription>
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
                        <Badge 
                          variant={tie.potentialValue === 'high' ? 'default' : tie.potentialValue === 'medium' ? 'secondary' : 'outline'}
                        >
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

        <TabsContent value="predictions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Predicted Connections</CardTitle>
              <CardDescription>
                Likely future connections based on network structure
              </CardDescription>
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
                        <span className="text-sm text-muted-foreground">
                          {pred.commonNeighbors} mutual
                        </span>
                        <Badge variant="outline">
                          {(pred.score * 10).toFixed(1)} score
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

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
                    <p className="text-sm text-muted-foreground">No critical nodes detected - network is well connected</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Growth Opportunities
              </CardTitle>
              <CardDescription>
                Strategic actions to strengthen your network
              </CardDescription>
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
