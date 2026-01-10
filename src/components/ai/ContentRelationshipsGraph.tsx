import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Filter
} from 'lucide-react';
import * as d3 from 'd3';

interface ContentRelationshipsGraphProps {
  profileId?: string;
}

interface Node {
  id: string;
  name: string;
  group: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  type: string;
}

export function ContentRelationshipsGraph({ profileId }: ContentRelationshipsGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [zoom, setZoom] = useState(1);

  const { data: relationships, isLoading } = useQuery({
    queryKey: ['content-relationships', profileId, sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('content_relationships')
        .select(`
          id,
          profile_id_1,
          profile_id_2,
          source_type,
          relationship_type,
          confidence,
          occurrence_count,
          context
        `)
        .order('occurrence_count', { ascending: false })
        .limit(100);

      if (profileId) {
        query = query.or(`profile_id_1.eq.${profileId},profile_id_2.eq.${profileId}`);
      }

      if (sourceFilter !== 'all') {
        query = query.eq('source_type', sourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-graph', relationships],
    queryFn: async () => {
      if (!relationships?.length) return {};

      const profileIds = new Set<string>();
      relationships.forEach(r => {
        profileIds.add(r.profile_id_1);
        profileIds.add(r.profile_id_2);
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', Array.from(profileIds));

      if (error) throw error;

      const map: Record<string, { name: string; avatar?: string }> = {};
      data?.forEach(p => {
        map[p.id] = {
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
          avatar: p.avatar_url || undefined,
        };
      });
      return map;
    },
    enabled: !!relationships?.length,
  });

  useEffect(() => {
    if (!svgRef.current || !relationships?.length || !profiles) return;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 500;
    const height = 400;

    // Build nodes and links
    const nodeMap = new Map<string, Node>();
    const links: Link[] = [];

    relationships.forEach(r => {
      if (!nodeMap.has(r.profile_id_1)) {
        nodeMap.set(r.profile_id_1, {
          id: r.profile_id_1,
          name: profiles[r.profile_id_1]?.name || 'Unknown',
          group: 1,
        });
      }
      if (!nodeMap.has(r.profile_id_2)) {
        nodeMap.set(r.profile_id_2, {
          id: r.profile_id_2,
          name: profiles[r.profile_id_2]?.name || 'Unknown',
          group: 2,
        });
      }

      links.push({
        source: r.profile_id_1,
        target: r.profile_id_2,
        value: r.occurrence_count || 1,
        type: r.source_type,
      });
    });

    const nodes = Array.from(nodeMap.values());

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add zoom behavior
    const g = svg.append('g');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Create simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Color scale for link types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['voice_mention', 'document_reference', 'same_recording', 'mentioned_together'])
      .range(['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6']);

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => colorScale(d.type))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value) * 2);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => d.group === 1 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-width', 2);

    node.append('text')
      .text(d => d.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'hsl(var(--primary-foreground))')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold');

    // Add tooltip
    node.append('title')
      .text(d => d.name);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [relationships, profiles]);

  const resetZoom = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
      setZoom(1);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Network className="h-4 w-4 animate-pulse" />
            Loading relationships...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Content Relationships
            {relationships?.length ? (
              <Badge variant="secondary">{relationships.length} connections</Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40 h-8">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="voice_mention">Voice Mentions</SelectItem>
                <SelectItem value="document_reference">Documents</SelectItem>
                <SelectItem value="same_recording">Same Recording</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!relationships?.length ? (
          <div className="text-center text-muted-foreground py-8">
            <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No relationships discovered</p>
            <p className="text-sm mt-1">Analyze voice or document content to discover connections</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.min(z * 1.2, 3))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={resetZoom}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-blue-500" />
                  <span>Voice</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-500" />
                  <span>Document</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-amber-500" />
                  <span>Recording</span>
                </div>
              </div>
            </div>

            {/* Graph */}
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <svg ref={svgRef} className="w-full" style={{ minHeight: 400 }} />
            </div>

            {/* Relationship List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Connections</h4>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {relationships.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span>{profiles?.[r.profile_id_1]?.name || 'Unknown'}</span>
                      <span className="text-muted-foreground">↔</span>
                      <span>{profiles?.[r.profile_id_2]?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {r.source_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {r.occurrence_count}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
