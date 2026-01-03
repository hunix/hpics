import { useEffect, useRef, useState, useCallback } from 'react';
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
import { Network, ZoomIn, ZoomOut, RotateCcw, Maximize2, Star, Users } from 'lucide-react';
import * as d3 from 'd3';

interface NetworkNode {
  id: string;
  name: string;
  type: string;
  isFavorite: boolean;
  communicationCount: number;
  messageCount: number;
  eventCount: number;
  importance: number;
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
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);

  const { data: networkData, isLoading } = useQuery({
    queryKey: ['network-data', user?.id],
    queryFn: async () => {
      // Fetch profiles with counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, is_favorite')
        .eq('user_id', user!.id);

      if (!profiles || profiles.length === 0) return { nodes: [], links: [] };

      // Fetch communications count per profile
      const { data: commCounts } = await supabase
        .from('communications')
        .select('profile_id')
        .eq('user_id', user!.id);

      // Fetch message counts per profile
      const { data: msgCounts } = await supabase
        .from('messages')
        .select('conversation_id, conversations!inner(profile_id)')
        .eq('user_id', user!.id);

      // Fetch event counts per profile
      const { data: eventCounts } = await supabase
        .from('events')
        .select('profile_id')
        .eq('user_id', user!.id);

      // Count occurrences
      const commByProfile = new Map<string, number>();
      commCounts?.forEach((c) => {
        commByProfile.set(c.profile_id, (commByProfile.get(c.profile_id) || 0) + 1);
      });

      const msgByProfile = new Map<string, number>();
      msgCounts?.forEach((m) => {
        const profileId = (m.conversations as any)?.profile_id;
        if (profileId) {
          msgByProfile.set(profileId, (msgByProfile.get(profileId) || 0) + 1);
        }
      });

      const eventByProfile = new Map<string, number>();
      eventCounts?.forEach((e) => {
        if (e.profile_id) {
          eventByProfile.set(e.profile_id, (eventByProfile.get(e.profile_id) || 0) + 1);
        }
      });

      // Build nodes
      const nodes: NetworkNode[] = profiles.map((p) => {
        const commCount = commByProfile.get(p.id) || 0;
        const msgCount = msgByProfile.get(p.id) || 0;
        const eventCount = eventByProfile.get(p.id) || 0;
        
        // Calculate importance score (0-100)
        const importance = Math.min(100, Math.round(
          (commCount * 5) + (msgCount * 0.5) + (eventCount * 10) + (p.is_favorite ? 20 : 0)
        ));

        return {
          id: p.id,
          name: `${p.first_name} ${p.last_name || ''}`.trim(),
          type: p.relationship_type || 'other',
          isFavorite: p.is_favorite || false,
          communicationCount: commCount,
          messageCount: msgCount,
          eventCount: eventCount,
          importance,
        };
      });

      // Build links - connect nodes of same relationship type
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
            // Weight based on combined importance
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

      // Connect favorites to each other
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

      return { nodes, links };
    },
    enabled: !!user,
  });

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

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add zoom behavior
    const g = svg.append('g');
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create simulation
    const simulation = d3.forceSimulation<NetworkNode>(filteredNodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(filteredLinks)
        .id((d) => d.id)
        .distance((d) => 100 - (d.weight * 50))
        .strength((d) => d.weight))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    simulationRef.current = simulation;

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('stroke', (d) => relationshipColors[d.type] || '#999')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', (d) => Math.max(1, d.weight * 4));

    // Draw nodes
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

    // Node circles
    node.append('circle')
      .attr('r', (d) => 10 + (d.importance / 10))
      .attr('fill', (d) => relationshipColors[d.type] || '#999')
      .attr('stroke', (d) => d.isFavorite ? '#fbbf24' : '#fff')
      .attr('stroke-width', (d) => d.isFavorite ? 3 : 2);

    // Node labels
    node.append('text')
      .text((d) => d.name)
      .attr('x', 0)
      .attr('y', (d) => -(15 + (d.importance / 10)))
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '11px')
      .attr('font-weight', (d) => d.isFavorite ? 'bold' : 'normal');

    // Star for favorites
    node.filter((d) => d.isFavorite)
      .append('text')
      .text('★')
      .attr('x', 10 + 5)
      .attr('y', 4)
      .attr('fill', '#fbbf24')
      .attr('font-size', '12px');

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    svg.on('click', () => setSelectedNode(null));

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as NetworkNode).x!)
        .attr('y1', (d) => (d.source as NetworkNode).y!)
        .attr('x2', (d) => (d.target as NetworkNode).x!)
        .attr('y2', (d) => (d.target as NetworkNode).y!);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

  }, [networkData, filter, minImportance]);

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

  const relationshipTypes = ['family', 'friend', 'colleague', 'client', 'mentor', 'mentee', 'acquaintance', 'other'];

  return (
    <AppLayout title="Relationship Network">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Visualize your relationship network with importance weights and connections
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Relationship Type</label>
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
                <label className="text-sm font-medium">
                  Minimum Importance: {minImportance[0]}%
                </label>
                <Slider
                  value={minImportance}
                  onValueChange={setMinImportance}
                  max={100}
                  step={5}
                />
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
                Drag nodes to rearrange. Scroll to zoom. Click a node for details.
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
                  
                  {/* Selected Node Panel */}
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Needs Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {networkData.nodes
                    .filter((n) => n.isFavorite && n.importance < 30)
                    .slice(0, 5)
                    .map((node) => (
                      <div key={node.id} className="flex items-center justify-between">
                        <span className="text-sm truncate">{node.name}</span>
                        <Badge variant="destructive">Low activity</Badge>
                      </div>
                    ))}
                  {networkData.nodes.filter((n) => n.isFavorite && n.importance < 30).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      All favorites are well-maintained!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
