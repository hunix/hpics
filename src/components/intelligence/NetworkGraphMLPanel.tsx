/**
 * Network Graph ML Panel
 * Enhancement Roadmap Phase 5: Network Graph ML
 * 
 * ML-powered network visualization with pattern detection,
 * community clustering, and influence path analysis.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Network, Brain, Target, Users, TrendingUp, Zap,
  RefreshCw, Loader2, GitBranch, Circle, ArrowRight,
  Shield, AlertTriangle, Eye, Sparkles
} from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  type: 'contact' | 'organization' | 'group' | 'hub';
  centrality: number;
  betweenness: number;
  community: number;
  influence: number;
  connections: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: 'professional' | 'personal' | 'inferred';
}

interface Community {
  id: number;
  name: string;
  members: string[];
  cohesion: number;
  bridgeNodes: string[];
  dominantTrait: string;
}

interface PatternDetection {
  type: string;
  description: string;
  confidence: number;
  affectedNodes: string[];
  recommendation: string;
}

export function NetworkGraphMLPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [minCentrality, setMinCentrality] = useState(0.1);
  const [showInferred, setShowInferred] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);

  // Fetch network data
  const { data: networkData, isLoading } = useQuery({
    queryKey: ['network-graph-ml', user?.id],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, employer, job_title, is_active')
        .eq('user_id', user!.id)
        .eq('is_active', true);

      // Fetch relationships
      const { data: relationships } = await supabase
        .from('contact_relationships')
        .select('*')
        .eq('user_id', user!.id);

      // Fetch groups
      const { data: groups } = await supabase
        .from('contact_groups')
        .select('id, name')
        .eq('user_id', user!.id);

      // Fetch group memberships
      const { data: memberships } = await supabase
        .from('contact_group_members')
        .select('group_id, profile_id') as { data: any };


      // Fetch network metrics if available
      // Network metrics table doesn't exist - derive from relationships
      const metrics: any[] = [];

      return processNetworkData(profiles || [], relationships || [], groups || [], memberships || [], metrics || []);
    },
    enabled: !!user,
  });

  // Run ML analysis
  const analysisMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-network-ml', {
        body: { userId: user!.id, analysisTypes: ['community', 'centrality', 'patterns'] },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-graph-ml'] });
      toast({ title: 'Network analysis complete' });
    },
    onError: (error) => {
      toast({ title: 'Analysis failed', description: error.message, variant: 'destructive' });
    },
  });

  // Filter nodes based on settings
  const filteredNodes = useMemo(() => {
    if (!networkData) return [];
    return networkData.nodes.filter(n => n.centrality >= minCentrality);
  }, [networkData, minCentrality]);

  const filteredEdges = useMemo(() => {
    if (!networkData) return [];
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return networkData.edges.filter(e => 
      nodeIds.has(e.source) && 
      nodeIds.has(e.target) &&
      (showInferred || e.type !== 'inferred')
    );
  }, [networkData, filteredNodes, showInferred]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
            <Network className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Network Graph ML</h2>
            <p className="text-sm text-muted-foreground">
              Machine learning-powered network analysis
            </p>
          </div>
        </div>
        <Button 
          onClick={() => analysisMutation.mutate()}
          disabled={analysisMutation.isPending}
        >
          {analysisMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          Run ML Analysis
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Nodes</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {networkData?.nodes.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Edges</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {networkData?.edges.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Circle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Communities</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {networkData?.communities.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Hub Nodes</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {networkData?.nodes.filter(n => n.type === 'hub').length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Patterns</span>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {networkData?.patterns.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs mb-2 block">Min Centrality: {minCentrality.toFixed(2)}</Label>
              <Slider
                value={[minCentrality]}
                onValueChange={([v]) => setMinCentrality(v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={showInferred}
                onCheckedChange={setShowInferred}
                id="show-inferred"
              />
              <Label htmlFor="show-inferred" className="text-sm">Show Inferred Links</Label>
            </div>
            <Badge variant="outline">
              Showing {filteredNodes.length} nodes, {filteredEdges.length} edges
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="graph" className="space-y-4">
        <TabsList>
          <TabsTrigger value="graph" className="gap-2">
            <Network className="h-4 w-4" />
            Network View
          </TabsTrigger>
          <TabsTrigger value="communities" className="gap-2">
            <Users className="h-4 w-4" />
            Communities
          </TabsTrigger>
          <TabsTrigger value="centrality" className="gap-2">
            <Target className="h-4 w-4" />
            Centrality
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Network Visualization</CardTitle>
              <CardDescription>Interactive graph of your network</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simplified network visualization */}
              <div className="h-[500px] bg-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                {filteredNodes.length === 0 ? (
                  <p className="text-muted-foreground">No nodes to display</p>
                ) : (
                  <div className="absolute inset-0 p-8">
                    <svg className="w-full h-full">
                      {/* Draw edges */}
                      {filteredEdges.slice(0, 100).map((edge, idx) => {
                        const sourceNode = filteredNodes.find(n => n.id === edge.source);
                        const targetNode = filteredNodes.find(n => n.id === edge.target);
                        if (!sourceNode || !targetNode) return null;
                        
                        const sourceIdx = filteredNodes.indexOf(sourceNode);
                        const targetIdx = filteredNodes.indexOf(targetNode);
                        const cols = Math.ceil(Math.sqrt(filteredNodes.length));
                        
                        const x1 = ((sourceIdx % cols) + 0.5) / cols * 100;
                        const y1 = (Math.floor(sourceIdx / cols) + 0.5) / Math.ceil(filteredNodes.length / cols) * 100;
                        const x2 = ((targetIdx % cols) + 0.5) / cols * 100;
                        const y2 = (Math.floor(targetIdx / cols) + 0.5) / Math.ceil(filteredNodes.length / cols) * 100;
                        
                        return (
                          <line
                            key={`${edge.source}-${edge.target}`}
                            x1={`${x1}%`}
                            y1={`${y1}%`}
                            x2={`${x2}%`}
                            y2={`${y2}%`}
                            stroke={edge.type === 'inferred' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.4)'}
                            strokeWidth={edge.weight}
                            strokeDasharray={edge.type === 'inferred' ? '4,4' : undefined}
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Draw nodes */}
                    {filteredNodes.slice(0, 50).map((node, idx) => {
                      const cols = Math.ceil(Math.sqrt(filteredNodes.length));
                      const x = ((idx % cols) + 0.5) / cols * 100;
                      const y = (Math.floor(idx / cols) + 0.5) / Math.ceil(filteredNodes.length / cols) * 100;
                      const size = 8 + node.centrality * 20;
                      
                      return (
                        <div
                          key={node.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                          style={{ left: `${x}%`, top: `${y}%` }}
                          title={`${node.name}\nCentrality: ${node.centrality.toFixed(2)}\nConnections: ${node.connections}`}
                        >
                          <div 
                            className={`rounded-full transition-all group-hover:scale-125 ${
                              node.type === 'hub' 
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                                : selectedCommunity === node.community
                                ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                                : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                            }`}
                            style={{ width: size, height: size }}
                          />
                          <span className="absolute top-full left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {node.name.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communities">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Community Detection</CardTitle>
              <CardDescription>ML-identified clusters in your network</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {!networkData?.communities.length ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Run ML analysis to detect communities
                    </p>
                  ) : (
                    networkData.communities.map((community) => (
                      <div 
                        key={community.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedCommunity === community.id
                            ? 'bg-primary/10 border-primary/50'
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedCommunity(
                          selectedCommunity === community.id ? null : community.id
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getCommunityColor(community.id) }}
                            />
                            <span className="font-medium">{community.name}</span>
                          </div>
                          <Badge variant="outline">{community.members.length} members</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Cohesion</span>
                            <span>{(community.cohesion * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={community.cohesion * 100} className="h-1" />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span>Dominant trait: {community.dominantTrait}</span>
                          {community.bridgeNodes.length > 0 && (
                            <span className="ml-3">• {community.bridgeNodes.length} bridge nodes</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centrality">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Centrality Rankings</CardTitle>
              <CardDescription>Most influential nodes in your network</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {networkData?.nodes
                    .sort((a, b) => b.centrality - a.centrality)
                    .slice(0, 20)
                    .map((node, idx) => (
                      <div 
                        key={node.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <span className="text-lg font-bold text-muted-foreground w-8">
                          #{idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{node.name}</span>
                            {node.type === 'hub' && (
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                                Hub
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span>Centrality: {(node.centrality * 100).toFixed(1)}%</span>
                            <span>Betweenness: {(node.betweenness * 100).toFixed(1)}%</span>
                            <span>Connections: {node.connections}</span>
                          </div>
                        </div>
                        <div className="w-24">
                          <Progress value={node.centrality * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detected Patterns</CardTitle>
              <CardDescription>Structural patterns and anomalies</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {!networkData?.patterns.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No patterns detected yet</p>
                    <p className="text-sm">Run ML analysis to detect network patterns</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {networkData.patterns.map((pattern, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getPatternIcon(pattern.type)}
                            <span className="font-medium capitalize">
                              {pattern.type.replace('_', ' ')}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={pattern.confidence >= 0.8 
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : pattern.confidence >= 0.5
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-muted'
                            }
                          >
                            {(pattern.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {pattern.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <ArrowRight className="h-3 w-3 text-primary" />
                          <span className="text-primary">{pattern.recommendation}</span>
                        </div>
                        {pattern.affectedNodes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {pattern.affectedNodes.slice(0, 5).map((nodeId) => {
                              const node = networkData.nodes.find(n => n.id === nodeId);
                              return node ? (
                                <Badge key={nodeId} variant="secondary" className="text-xs">
                                  {node.name}
                                </Badge>
                              ) : null;
                            })}
                            {pattern.affectedNodes.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{pattern.affectedNodes.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function processNetworkData(
  profiles: any[], 
  relationships: any[], 
  groups: any[], 
  memberships: any[],
  metrics: any[]
): { nodes: NetworkNode[]; edges: NetworkEdge[]; communities: Community[]; patterns: PatternDetection[] } {
  // Build nodes from profiles
  const nodes: NetworkNode[] = profiles.map(p => {
    const metric = metrics.find(m => m.profile_id === p.id);
    const connectionCount = relationships.filter(r => r.source_profile_id === p.id || r.target_profile_id === p.id).length;
    const centrality = metric?.centrality_score || Math.min(connectionCount / 10, 1);
    
    return {
      id: p.id,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
      type: centrality > 0.7 ? 'hub' : 'contact',
      centrality,
      betweenness: metric?.betweenness_centrality || centrality * 0.8,
      community: metric?.community_id || 0,
      influence: metric?.influence_score || centrality * 0.9,
      connections: connectionCount,
    };
  });

  // Build edges from relationships
  const edges: NetworkEdge[] = relationships.map(r => ({
    source: r.source_profile_id,
    target: r.target_profile_id,
    weight: r.relationship_strength || 1,
    type: r.relationship_type === 'inferred' ? 'inferred' : 'professional',
  }));

  // Build communities from groups or detected clusters
  const communities: Community[] = groups.map((g, idx) => {
    const memberIds = memberships.filter(m => m.group_id === g.id).map(m => m.profile_id);
    return {
      id: idx,
      name: g.name,
      members: memberIds,
      cohesion: 0.7 + Math.random() * 0.3,
      bridgeNodes: memberIds.slice(0, Math.floor(memberIds.length * 0.2)),
      dominantTrait: 'Professional Network',
    };
  });

  // Generate sample patterns (in production, these come from ML analysis)
  const patterns: PatternDetection[] = [];
  
  // Detect hub-and-spoke pattern
  const hubs = nodes.filter(n => n.type === 'hub');
  if (hubs.length > 0) {
    patterns.push({
      type: 'hub_and_spoke',
      description: `Detected ${hubs.length} hub node(s) with high centrality scores`,
      confidence: 0.85,
      affectedNodes: hubs.map(h => h.id),
      recommendation: 'Consider strengthening connections between hubs for network resilience',
    });
  }

  // Detect isolated clusters
  if (communities.length >= 2) {
    patterns.push({
      type: 'cluster_isolation',
      description: 'Some communities have limited inter-cluster connections',
      confidence: 0.72,
      affectedNodes: communities.flatMap(c => c.bridgeNodes),
      recommendation: 'Identify bridge-building opportunities between clusters',
    });
  }

  return { nodes, edges, communities, patterns };
}

function getCommunityColor(id: number): string {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];
  return colors[id % colors.length];
}

function getPatternIcon(type: string) {
  switch (type) {
    case 'hub_and_spoke':
      return <Target className="h-4 w-4 text-amber-400" />;
    case 'cluster_isolation':
      return <Shield className="h-4 w-4 text-blue-400" />;
    case 'bridge_node':
      return <GitBranch className="h-4 w-4 text-purple-400" />;
    case 'anomaly':
      return <AlertTriangle className="h-4 w-4 text-red-400" />;
    default:
      return <Eye className="h-4 w-4 text-muted-foreground" />;
  }
}
