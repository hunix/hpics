/**
 * Trust Network Topology Graph
 * Interactive D3 visualization of trust relationships and betrayal risk
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, Users, Eye, Network } from 'lucide-react';
import { useBetrayalPrediction } from '@/hooks/intelligence/useBetrayalPrediction';

interface TrustNode {
  id: string;
  name: string;
  trustScore: number;
  betrayalRisk: number;
  faction?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface TrustLink {
  source: string | TrustNode;
  target: string | TrustNode;
  trustWeight: number;
  reciprocal: boolean;
}

interface TrustNetworkGraphProps {
  profileId?: string;
  contacts?: Array<{ id: string; name: string }>;
}

export function TrustNetworkGraph({ profileId, contacts = [] }: TrustNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'trust' | 'risk' | 'faction'>('trust');
  const [selectedNode, setSelectedNode] = useState<TrustNode | null>(null);
  const [nodes, setNodes] = useState<TrustNode[]>([]);
  const [links, setLinks] = useState<TrustLink[]>([]);

  const { allPredictions } = useBetrayalPrediction(profileId);

  // Generate demo network based on contacts or default
  useEffect(() => {
    const demoNodes: TrustNode[] = contacts.length > 0
      ? contacts.slice(0, 15).map((c, i) => ({
          id: c.id,
          name: c.name,
          trustScore: 0.5 + Math.random() * 0.5,
          betrayalRisk: Math.random() * 0.6,
          faction: ['inner', 'middle', 'outer'][Math.floor(i / 5)],
        }))
      : [
          { id: 'user', name: 'You', trustScore: 1, betrayalRisk: 0, faction: 'inner' },
          ...Array.from({ length: 12 }, (_, i) => ({
            id: `contact-${i}`,
            name: `Contact ${i + 1}`,
            trustScore: 0.3 + Math.random() * 0.7,
            betrayalRisk: Math.random() * 0.7,
            faction: ['inner', 'middle', 'outer'][Math.floor(Math.random() * 3)],
          })),
        ];

    const demoLinks: TrustLink[] = [];
    const userNode = demoNodes[0];
    
    // Connect user to inner circle
    demoNodes.filter(n => n.faction === 'inner' && n.id !== 'user').forEach(n => {
      demoLinks.push({
        source: userNode.id,
        target: n.id,
        trustWeight: 0.7 + Math.random() * 0.3,
        reciprocal: true,
      });
    });

    // Connect inner to middle circle
    demoNodes.filter(n => n.faction === 'inner').forEach(inner => {
      demoNodes.filter(n => n.faction === 'middle').forEach(middle => {
        if (Math.random() > 0.5) {
          demoLinks.push({
            source: inner.id,
            target: middle.id,
            trustWeight: 0.4 + Math.random() * 0.4,
            reciprocal: Math.random() > 0.3,
          });
        }
      });
    });

    // Connect middle to outer circle
    demoNodes.filter(n => n.faction === 'middle').forEach(middle => {
      demoNodes.filter(n => n.faction === 'outer').forEach(outer => {
        if (Math.random() > 0.6) {
          demoLinks.push({
            source: middle.id,
            target: outer.id,
            trustWeight: 0.2 + Math.random() * 0.4,
            reciprocal: Math.random() > 0.5,
          });
        }
      });
    });

    setNodes(demoNodes);
    setLinks(demoLinks);
  }, [contacts]);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 450;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Color functions based on view mode
    const getNodeColor = (d: TrustNode) => {
      if (viewMode === 'trust') {
        const hue = d.trustScore * 120; // 0 = red, 120 = green
        return `hsl(${hue}, 70%, 50%)`;
      } else if (viewMode === 'risk') {
        const hue = (1 - d.betrayalRisk) * 120;
        return `hsl(${hue}, 70%, 50%)`;
      } else {
        const factionColors: Record<string, string> = {
          inner: 'hsl(var(--primary))',
          middle: 'hsl(var(--secondary))',
          outer: 'hsl(var(--muted-foreground))',
        };
        return factionColors[d.faction || 'outer'];
      }
    };

    // Add gradient definitions
    const defs = svg.append('defs');
    
    // Arrow marker for directed edges
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', 'hsl(var(--muted-foreground))');

    // Create simulation
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(100)
        .strength((d: any) => d.trustWeight * 0.3))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Add links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => d.reciprocal ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', (d) => d.trustWeight * 4)
      .attr('stroke-dasharray', (d) => d.reciprocal ? 'none' : '5,5')
      .attr('marker-end', (d) => d.reciprocal ? '' : 'url(#arrowhead)');

    // Add nodes
    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, TrustNode>()
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
        }) as any)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Node circles
    nodeGroup.append('circle')
      .attr('r', (d) => d.id === 'user' ? 20 : 12 + d.trustScore * 8)
      .attr('fill', getNodeColor)
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 2);

    // Risk indicator ring
    nodeGroup.append('circle')
      .attr('r', (d) => (d.id === 'user' ? 20 : 12 + d.trustScore * 8) + 3)
      .attr('fill', 'none')
      .attr('stroke', (d) => d.betrayalRisk > 0.5 ? 'hsl(var(--destructive))' : 'transparent')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3');

    // Node labels
    nodeGroup.append('text')
      .text((d) => d.name.substring(0, 8))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.id === 'user' ? 35 : 28 + d.trustScore * 8))
      .attr('font-size', 10)
      .attr('fill', 'hsl(var(--foreground))');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Click outside to deselect
    svg.on('click', () => setSelectedNode(null));

    return () => {
      simulation.stop();
    };
  }, [nodes, links, viewMode]);

  const factionStats = {
    inner: nodes.filter(n => n.faction === 'inner').length,
    middle: nodes.filter(n => n.faction === 'middle').length,
    outer: nodes.filter(n => n.faction === 'outer').length,
  };

  const avgTrust = nodes.length > 0 
    ? (nodes.reduce((sum, n) => sum + n.trustScore, 0) / nodes.length * 100).toFixed(0)
    : 0;

  const highRiskCount = nodes.filter(n => n.betrayalRisk > 0.5).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Trust Network Topology
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {nodes.length} nodes
            </Badge>
            <Badge variant={highRiskCount > 0 ? 'destructive' : 'secondary'}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {highRiskCount} high risk
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Color by:</span>
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trust">Trust Score</SelectItem>
                <SelectItem value="risk">Betrayal Risk</SelectItem>
                <SelectItem value="faction">Faction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-primary" />
              Avg Trust: {avgTrust}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          {viewMode === 'faction' && (
            <>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary" /> Inner ({factionStats.inner})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-secondary" /> Middle ({factionStats.middle})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" /> Outer ({factionStats.outer})
              </span>
            </>
          )}
          {viewMode !== 'faction' && (
            <>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" /> High
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500" /> Medium
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" /> Low
              </span>
            </>
          )}
          <span className="flex items-center gap-1 ml-4">
            <div className="w-8 h-0.5 bg-primary" /> Reciprocal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground" /> One-way
          </span>
        </div>

        {/* Graph Container */}
        <div ref={containerRef} className="border rounded-lg bg-card overflow-hidden">
          <svg ref={svgRef} className="w-full" />
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="p-4 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {selectedNode.name}
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Trust Score</span>
                <p className="font-medium">{(selectedNode.trustScore * 100).toFixed(0)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Betrayal Risk</span>
                <p className="font-medium text-destructive">{(selectedNode.betrayalRisk * 100).toFixed(0)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Faction</span>
                <p className="font-medium capitalize">{selectedNode.faction || 'Unknown'}</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-muted-foreground text-sm">Connections:</span>
              <p className="text-sm">
                {links.filter(l => {
                  const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
                  const targetId = typeof l.target === 'string' ? l.target : l.target.id;
                  return sourceId === selectedNode.id || targetId === selectedNode.id;
                }).length} links
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
