import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, ZoomIn, ZoomOut, RotateCcw, Star, Users, 
  Download, Image, FileText, AlertTriangle, Clock, GitBranch,
  TrendingUp, Target, Layers
} from 'lucide-react';
import * as d3 from 'd3';
import { differenceInDays } from 'date-fns';
import { FamilyTreeGraph } from '@/components/network/FamilyTreeGraph';
import { 
  calculateNetworkMetrics, 
  getClusterColor, 
  CLUSTER_COLORS,
  type NetworkMetrics 
} from '@/lib/networkAlgorithms';

interface NetworkNode {
  id: string;
  name: string;
  type: string;
  isFavorite: boolean;
  communicationCount: number;
  messageCount: number;
  eventCount: number;
  importance: number;
  lastContactDate: Date | null;
  decayLevel: number;
  pageRank?: number;
  closeness?: number;
  betweenness?: number;
  clusterId?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  weight: number;
  type: string;
}

export default function NetworkPage() {
  const { user } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>('all');
  const [minImportance, setMinImportance] = useState([0]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showDecay, setShowDecay] = useState(true);
  const [colorBy, setColorBy] = useState<'type' | 'cluster' | 'pagerank'>('cluster');
  const [decayThreshold, setDecayThreshold] = useState([30]);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);

  const { data: networkData, isLoading } = useQuery({
    queryKey: ['network-data', user?.id],
    queryFn: async () => {
      // Fetch profiles with last contact date
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, is_favorite, last_contact_date')
        .eq('user_id', user!.id);

      if (!profiles || profiles.length === 0) return { nodes: [], links: [] };

      // Fetch communications with dates
      const { data: commData } = await supabase
        .from('communications')
        .select('profile_id, occurred_at')
        .eq('user_id', user!.id)
        .order('occurred_at', { ascending: false });

      // Fetch message counts per profile
      const { data: msgCounts } = await supabase
        .from('messages')
        .select('conversation_id, sent_at, conversations!inner(profile_id)')
        .eq('user_id', user!.id);

      // Fetch event counts per profile
      const { data: eventCounts } = await supabase
        .from('events')
        .select('profile_id')
        .eq('user_id', user!.id);

      // Count occurrences and find last contact
      const commByProfile = new Map<string, { count: number; lastDate: Date | null }>();
      commData?.forEach((c) => {
        const existing = commByProfile.get(c.profile_id);
        const date = new Date(c.occurred_at);
        if (existing) {
          existing.count++;
          if (!existing.lastDate || date > existing.lastDate) {
            existing.lastDate = date;
          }
        } else {
          commByProfile.set(c.profile_id, { count: 1, lastDate: date });
        }
      });

      const msgByProfile = new Map<string, { count: number; lastDate: Date | null }>();
      msgCounts?.forEach((m) => {
        const profileId = (m.conversations as any)?.profile_id;
        if (profileId) {
          const existing = msgByProfile.get(profileId);
          const date = new Date(m.sent_at);
          if (existing) {
            existing.count++;
            if (!existing.lastDate || date > existing.lastDate) {
              existing.lastDate = date;
            }
          } else {
            msgByProfile.set(profileId, { count: 1, lastDate: date });
          }
        }
      });

      const eventByProfile = new Map<string, number>();
      eventCounts?.forEach((e) => {
        if (e.profile_id) {
          eventByProfile.set(e.profile_id, (eventByProfile.get(e.profile_id) || 0) + 1);
        }
      });

      // Build nodes with decay calculation
      const now = new Date();
      const nodes: NetworkNode[] = profiles.map((p) => {
        const commInfo = commByProfile.get(p.id) || { count: 0, lastDate: null };
        const msgInfo = msgByProfile.get(p.id) || { count: 0, lastDate: null };
        const eventCount = eventByProfile.get(p.id) || 0;
        
        // Calculate last contact date
        const dates = [commInfo.lastDate, msgInfo.lastDate, p.last_contact_date ? new Date(p.last_contact_date) : null]
          .filter(Boolean) as Date[];
        const lastContactDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

        // Calculate decay level (0-100, higher = more decay)
        let decayLevel = 0;
        if (lastContactDate) {
          const daysSinceContact = differenceInDays(now, lastContactDate);
          decayLevel = Math.min(100, Math.round((daysSinceContact / 90) * 100)); // Full decay after 90 days
        } else {
          decayLevel = 100; // No contact history = full decay
        }

        // Calculate importance score (0-100)
        const importance = Math.min(100, Math.round(
          (commInfo.count * 5) + (msgInfo.count * 0.5) + (eventCount * 10) + (p.is_favorite ? 20 : 0)
        ));

        return {
          id: p.id,
          name: `${p.first_name} ${p.last_name || ''}`.trim(),
          type: p.relationship_type || 'other',
          isFavorite: p.is_favorite || false,
          communicationCount: commInfo.count,
          messageCount: msgInfo.count,
          eventCount: eventCount,
          importance,
          lastContactDate,
          decayLevel,
        };
      });

      // Build links
      const links: NetworkLink[] = [];
      const typeGroups = new Map<string, NetworkNode[]>();
      
      nodes.forEach((node) => {
        const group = typeGroups.get(node.type) || [];
        group.push(node);
        typeGroups.set(node.type, group);
      });

      // Create connections within same relationship types
      typeGroups.forEach((group, type) => {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const weight = (group[i].importance + group[j].importance) / 200;
            if (weight > 0.1) {
              links.push({
                source: group[i].id,
                target: group[j].id,
                weight,
                type,
              });
            }
          }
        }
      });

      // Connect favorites
      const favorites = nodes.filter((n) => n.isFavorite);
      for (let i = 0; i < favorites.length; i++) {
        for (let j = i + 1; j < favorites.length; j++) {
          links.push({
            source: favorites[i].id,
            target: favorites[j].id,
            weight: 0.8,
            type: 'favorite',
          });
        }
      }

      // Calculate network metrics (PageRank, Closeness, Betweenness, Clusters)
      const metrics = calculateNetworkMetrics(
        nodes.map(n => ({ id: n.id })),
        links.map(l => ({ 
          source: typeof l.source === 'string' ? l.source : l.source.id,
          target: typeof l.target === 'string' ? l.target : l.target.id,
          weight: l.weight 
        }))
      );

      // Enhance nodes with metrics
      nodes.forEach(node => {
        node.pageRank = metrics.pageRank.get(node.id) || 0;
        node.closeness = metrics.closenessCentrality.get(node.id) || 0;
        node.betweenness = metrics.betweennessCentrality.get(node.id) || 0;
        node.clusterId = metrics.clusters.get(node.id) || 0;
      });

      return { nodes, links, metrics };
    },
    enabled: !!user,
  });

  // Update network metrics when data changes
  useMemo(() => {
    if (networkData?.metrics) {
      setNetworkMetrics(networkData.metrics);
    }
  }, [networkData]);

  const relationshipColors: Record<string, string> = {
    family: '#ef4444',
    friend: '#3b82f6',
    colleague: '#a855f7',
    client: '#22c55e',
    mentor: '#eab308',
    mentee: '#f97316',
    acquaintance: '#6b7280',
    other: '#9ca3af',
    favorite: '#fbbf24',
  };

  // Get node color based on selected coloring mode
  const getNodeColor = (node: NetworkNode): string => {
    if (colorBy === 'cluster' && node.clusterId !== undefined) {
      return getClusterColor(node.clusterId);
    }
    if (colorBy === 'pagerank') {
      const rank = node.pageRank || 0;
      // Gradient from blue (low) to red (high)
      const hue = 240 - (rank * 240); // 240=blue, 0=red
      return `hsl(${hue}, 70%, 50%)`;
    }
    return relationshipColors[node.type] || '#9ca3af';
  };

  const drawNetwork = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !networkData) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 600;

    // Filter nodes
    let filteredNodes = networkData.nodes.filter((n) => n.importance >= minImportance[0]);
    if (filter !== 'all') {
      filteredNodes = filteredNodes.filter((n) => n.type === filter);
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = networkData.links.filter(
      (l) => nodeIds.has(typeof l.source === 'string' ? l.source : l.source.id) && 
             nodeIds.has(typeof l.target === 'string' ? l.target : l.target.id)
    );

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g');
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<NetworkNode>(filteredNodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(filteredLinks)
        .id((d) => d.id)
        .distance((d) => 120 - (d.weight * 40))
        .strength((d) => d.weight * 0.7))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NetworkNode>().radius((d) => 50 + (d.importance / 15)));

    simulationRef.current = simulation;

    // Draw links with decay effect
    const link = g.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('stroke', (d) => relationshipColors[d.type] || '#999')
      .attr('stroke-opacity', (d) => {
        const sourceNode = filteredNodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
        const targetNode = filteredNodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target.id));
        const avgDecay = ((sourceNode?.decayLevel || 0) + (targetNode?.decayLevel || 0)) / 2;
        return 0.4 * getDecayOpacity(avgDecay);
      })
      .attr('stroke-width', (d) => Math.max(1, d.weight * 4));

    // Draw nodes with decay effect
    const node = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Node circles with decay opacity
    node.append('circle')
      .attr('r', (d) => 10 + (d.importance / 10))
      .attr('fill', (d) => relationshipColors[d.type] || '#999')
      .attr('fill-opacity', (d) => getDecayOpacity(d.decayLevel))
      .attr('stroke', (d) => d.isFavorite ? '#fbbf24' : '#fff')
      .attr('stroke-width', (d) => d.isFavorite ? 3 : 2);

    // Decay warning indicator
    if (showDecay) {
      node.filter((d) => d.decayLevel > 50)
        .append('circle')
        .attr('r', 5)
        .attr('cx', (d) => 8 + (d.importance / 20))
        .attr('cy', (d) => -8 - (d.importance / 20))
        .attr('fill', (d) => d.decayLevel > 75 ? '#ef4444' : '#f97316')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    }

    // Node labels - truncate long names
    const truncateName = (name: string, maxLen = 14) => 
      name.length > maxLen ? name.slice(0, maxLen) + '…' : name;

    // Add background rect for label readability
    node.append('rect')
      .attr('x', (d) => -truncateName(d.name).length * 3.2 - 4)
      .attr('y', (d) => -(22 + (d.importance / 10)))
      .attr('width', (d) => truncateName(d.name).length * 6.4 + 8)
      .attr('height', 14)
      .attr('fill', 'hsl(var(--background))')
      .attr('fill-opacity', 0.85)
      .attr('rx', 3);

    node.append('text')
      .text((d) => truncateName(d.name))
      .attr('x', 0)
      .attr('y', (d) => -(12 + (d.importance / 10)))
      .attr('text-anchor', 'middle')
      .attr('fill', 'hsl(var(--foreground))')
      .attr('fill-opacity', (d) => getDecayOpacity(d.decayLevel))
      .attr('font-size', '10px')
      .attr('font-weight', (d) => d.isFavorite ? '600' : '500');

    // Star for favorites
    node.filter((d) => d.isFavorite)
      .append('text')
      .text('★')
      .attr('x', 10 + 5)
      .attr('y', 4)
      .attr('fill', '#fbbf24')
      .attr('font-size', '12px');

    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    svg.on('click', () => setSelectedNode(null));

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as NetworkNode).x!)
        .attr('y1', (d) => (d.source as NetworkNode).y!)
        .attr('x2', (d) => (d.target as NetworkNode).x!)
        .attr('y2', (d) => (d.target as NetworkNode).y!);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

  }, [networkData, filter, minImportance, showDecay]);

  useEffect(() => {
    drawNetwork();
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [drawNetwork]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7
    );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
    drawNetwork();
  };

  const handleExportPNG = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = 'relationship-network.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleExportCSV = () => {
    if (!networkData) return;
    
    const headers = ['Name', 'Relationship Type', 'Importance', 'Communications', 'Messages', 'Events', 'Decay Level', 'Favorite'];
    const rows = networkData.nodes.map(n => [
      n.name,
      n.type,
      n.importance,
      n.communicationCount,
      n.messageCount,
      n.eventCount,
      n.decayLevel,
      n.isFavorite ? 'Yes' : 'No'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = 'relationship-network.csv';
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const relationshipTypes = ['family', 'friend', 'colleague', 'client', 'mentor', 'mentee', 'acquaintance', 'other'];

  const needsAttention = networkData?.nodes.filter(n => 
    (n.isFavorite && n.decayLevel > 50) || n.decayLevel > 75
  ) || [];

  return (
    <AppLayout title="Relationship Network">
      <Tabs defaultValue="network" className="space-y-6">
        <TabsList>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Full Network
          </TabsTrigger>
          <TabsTrigger value="family" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Family Tree
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <p className="text-muted-foreground">
                  Visualize your relationship network with importance weights, decay indicators, and connections
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPNG}>
                  <Image className="h-4 w-4 mr-1" /> PNG
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <FileText className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPNG}>
              <Image className="h-4 w-4 mr-1" /> PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileText className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters & Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {relationshipTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Minimum Importance: {minImportance[0]}%</Label>
                <Slider
                  value={minImportance}
                  onValueChange={setMinImportance}
                  max={100}
                  step={5}
                />
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-decay" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Relationship Decay
                  </Label>
                  <Switch id="show-decay" checked={showDecay} onCheckedChange={setShowDecay} />
                </div>
                {showDecay && (
                  <p className="text-xs text-muted-foreground">
                    Fading nodes indicate less recent contact. Orange/red dots warn of relationship decay.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium">Legend</h4>
                <div className="grid grid-cols-2 gap-2">
                  {relationshipTypes.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: relationshipColors[type] }}
                      />
                      <span className="text-xs capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Stats</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><Users className="h-4 w-4 inline mr-1" /> {networkData?.nodes.length || 0} contacts</p>
                  <p><Star className="h-4 w-4 inline mr-1" /> {networkData?.nodes.filter((n) => n.isFavorite).length || 0} favorites</p>
                  <p><AlertTriangle className="h-4 w-4 inline mr-1" /> {needsAttention.length} need attention</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Graph */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Graph
              </CardTitle>
              <CardDescription>
                Drag nodes to rearrange. Scroll to zoom. Fading = relationship decay.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[600px] w-full" />
              ) : !networkData || networkData.nodes.length === 0 ? (
                <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Network className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>No contacts to display</p>
                    <p className="text-sm">Add contacts to build your network</p>
                  </div>
                </div>
              ) : (
                <div ref={containerRef} className="relative">
                  <svg ref={svgRef} className="w-full border rounded-lg bg-muted/20" />
                  
                  {selectedNode && (
                    <div className="absolute top-4 right-4 w-64 bg-card border rounded-lg p-4 shadow-lg">
                      <h3 className="font-semibold flex items-center gap-2">
                        {selectedNode.name}
                        {selectedNode.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                      </h3>
                      <Badge 
                        className="mt-1 capitalize"
                        style={{ backgroundColor: relationshipColors[selectedNode.type] }}
                      >
                        {selectedNode.type}
                      </Badge>
                      <div className="mt-3 space-y-1 text-sm">
                        <p>Importance: <strong>{selectedNode.importance}%</strong></p>
                        <p>Communications: {selectedNode.communicationCount}</p>
                        <p>Messages: {selectedNode.messageCount}</p>
                        <p>Events: {selectedNode.eventCount}</p>
                        <p className={selectedNode.decayLevel > 50 ? 'text-orange-500' : ''}>
                          Decay: {selectedNode.decayLevel}%
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full"
                        onClick={() => window.location.href = '/contacts'}
                      >
                        View Contact
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {networkData && networkData.nodes.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Most Connected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {networkData.nodes
                    .sort((a, b) => b.importance - a.importance)
                    .slice(0, 5)
                    .map((node) => (
                      <div key={node.id} className="flex items-center justify-between">
                        <span className="text-sm truncate">{node.name}</span>
                        <Badge variant="secondary">{node.importance}%</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">By Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {relationshipTypes
                    .map((type) => ({
                      type,
                      count: networkData.nodes.filter((n) => n.type === type).length,
                    }))
                    .filter((t) => t.count > 0)
                    .sort((a, b) => b.count - a.count)
                    .map(({ type, count }) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 w-2 rounded-full" 
                            style={{ backgroundColor: relationshipColors[type] }}
                          />
                          <span className="text-sm capitalize">{type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className={needsAttention.length > 0 ? 'border-orange-500/50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${needsAttention.length > 0 ? 'text-orange-500' : ''}`} />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {needsAttention.slice(0, 5).map((node) => (
                    <div key={node.id} className="flex items-center justify-between">
                      <span className="text-sm truncate">{node.name}</span>
                      <Badge variant={node.decayLevel > 75 ? "destructive" : "secondary"}>
                        {node.decayLevel}% decay
                      </Badge>
                    </div>
                  ))}
                  {needsAttention.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      All relationships are well-maintained! 🎉
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </TabsContent>

        <TabsContent value="family">
          <FamilyTreeGraph />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
