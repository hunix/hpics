/**
 * Influence Network Mapper
 * Map second and third-degree influence paths
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Network, Target, Route, Users, Zap, Search } from 'lucide-react';

interface InfluenceNode {
  id: string;
  name: string;
  degree: number; // 0 = user, 1 = direct, 2 = second, 3 = third
  influenceScore: number;
  type: 'user' | 'target' | 'intermediary';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface InfluenceLink {
  source: string | InfluenceNode;
  target: string | InfluenceNode;
  strength: number;
  type: 'direct' | 'indirect' | 'potential';
}

interface InfluencePath {
  nodes: string[];
  totalStrength: number;
  hops: number;
}

interface InfluenceNetworkMapperProps {
  profileId?: string;
  contacts?: Array<{ id: string; name: string }>;
}

export function InfluenceNetworkMapper({ profileId, contacts = [] }: InfluenceNetworkMapperProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [nodes, setNodes] = useState<InfluenceNode[]>([]);
  const [links, setLinks] = useState<InfluenceLink[]>([]);
  const [optimalPaths, setOptimalPaths] = useState<InfluencePath[]>([]);
  const [highlightedPath, setHighlightedPath] = useState<string[] | null>(null);
  const [maxDegree, setMaxDegree] = useState<'2' | '3'>('3');

  // Generate demo network
  useEffect(() => {
    const demoNodes: InfluenceNode[] = [
      { id: 'user', name: 'You', degree: 0, influenceScore: 1, type: 'user' },
      // Direct connections (degree 1)
      { id: 'd1', name: 'Alex Chen', degree: 1, influenceScore: 0.85, type: 'intermediary' },
      { id: 'd2', name: 'Jordan Lee', degree: 1, influenceScore: 0.72, type: 'intermediary' },
      { id: 'd3', name: 'Sam Rivera', degree: 1, influenceScore: 0.68, type: 'intermediary' },
      // Second degree (degree 2)
      { id: 's1', name: 'Casey Morgan', degree: 2, influenceScore: 0.65, type: 'intermediary' },
      { id: 's2', name: 'Taylor Swift', degree: 2, influenceScore: 0.58, type: 'intermediary' },
      { id: 's3', name: 'Pat Johnson', degree: 2, influenceScore: 0.52, type: 'intermediary' },
      { id: 's4', name: 'Chris Davis', degree: 2, influenceScore: 0.48, type: 'intermediary' },
      // Third degree (degree 3)
      { id: 't1', name: 'Dr. Kim', degree: 3, influenceScore: 0.45, type: 'target' },
      { id: 't2', name: 'CEO Smith', degree: 3, influenceScore: 0.42, type: 'target' },
      { id: 't3', name: 'Agent X', degree: 3, influenceScore: 0.38, type: 'target' },
    ];

    const demoLinks: InfluenceLink[] = [
      // User to direct
      { source: 'user', target: 'd1', strength: 0.9, type: 'direct' },
      { source: 'user', target: 'd2', strength: 0.75, type: 'direct' },
      { source: 'user', target: 'd3', strength: 0.7, type: 'direct' },
      // Direct to second
      { source: 'd1', target: 's1', strength: 0.8, type: 'indirect' },
      { source: 'd1', target: 's2', strength: 0.6, type: 'indirect' },
      { source: 'd2', target: 's2', strength: 0.7, type: 'indirect' },
      { source: 'd2', target: 's3', strength: 0.55, type: 'indirect' },
      { source: 'd3', target: 's3', strength: 0.65, type: 'indirect' },
      { source: 'd3', target: 's4', strength: 0.5, type: 'indirect' },
      // Second to third
      { source: 's1', target: 't1', strength: 0.75, type: 'indirect' },
      { source: 's2', target: 't1', strength: 0.6, type: 'indirect' },
      { source: 's2', target: 't2', strength: 0.7, type: 'indirect' },
      { source: 's3', target: 't2', strength: 0.5, type: 'indirect' },
      { source: 's4', target: 't3', strength: 0.65, type: 'indirect' },
      // Potential connections
      { source: 'd1', target: 't1', strength: 0.3, type: 'potential' },
    ];

    setNodes(demoNodes);
    setLinks(demoLinks);
  }, []);

  // Calculate optimal paths when target changes
  useEffect(() => {
    if (!targetId || nodes.length === 0) {
      setOptimalPaths([]);
      return;
    }

    // Simple BFS to find paths
    const findPaths = (startId: string, endId: string, maxHops: number): InfluencePath[] => {
      const paths: InfluencePath[] = [];
      const queue: { nodeId: string; path: string[]; strength: number }[] = [
        { nodeId: startId, path: [startId], strength: 1 }
      ];

      while (queue.length > 0) {
        const { nodeId, path, strength } = queue.shift()!;
        
        if (path.length > maxHops + 1) continue;
        
        if (nodeId === endId && path.length > 1) {
          paths.push({ nodes: path, totalStrength: strength, hops: path.length - 1 });
          continue;
        }

        const neighbors = links
          .filter(l => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return sourceId === nodeId || targetId === nodeId;
          })
          .map(l => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return {
              neighborId: sourceId === nodeId ? targetId : sourceId,
              linkStrength: l.strength,
            };
          })
          .filter(n => !path.includes(n.neighborId));

        for (const { neighborId, linkStrength } of neighbors) {
          queue.push({
            nodeId: neighborId,
            path: [...path, neighborId],
            strength: strength * linkStrength,
          });
        }
      }

      return paths.sort((a, b) => b.totalStrength - a.totalStrength).slice(0, 5);
    };

    const paths = findPaths('user', targetId, parseInt(maxDegree));
    setOptimalPaths(paths);
  }, [targetId, nodes, links, maxDegree]);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Filter nodes based on max degree
    const filteredNodes = nodes.filter(n => n.degree <= parseInt(maxDegree));
    const filteredLinks = links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return filteredNodes.some(n => n.id === sourceId) && filteredNodes.some(n => n.id === targetId);
    });

    const getDegreeColor = (degree: number) => {
      const colors = [
        'hsl(var(--primary))',
        'hsl(142, 76%, 36%)',
        'hsl(48, 96%, 53%)',
        'hsl(0, 84%, 60%)',
      ];
      return colors[degree] || colors[3];
    };

    const isInHighlightedPath = (id: string) => highlightedPath?.includes(id);

    // Create simulation
    const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(filteredLinks)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    // Add links
    const link = svg.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (highlightedPath) {
          const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
          const targetId = typeof d.target === 'string' ? d.target : d.target.id;
          const sourceIdx = highlightedPath.indexOf(sourceId);
          const targetIdx = highlightedPath.indexOf(targetId);
          if (sourceIdx !== -1 && targetIdx !== -1 && Math.abs(sourceIdx - targetIdx) === 1) {
            return 'hsl(var(--primary))';
          }
        }
        return d.type === 'potential' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--border))';
      })
      .attr('stroke-opacity', (d) => {
        if (highlightedPath) {
          const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
          const targetId = typeof d.target === 'string' ? d.target : d.target.id;
          const sourceIdx = highlightedPath.indexOf(sourceId);
          const targetIdx = highlightedPath.indexOf(targetId);
          if (sourceIdx !== -1 && targetIdx !== -1 && Math.abs(sourceIdx - targetIdx) === 1) {
            return 1;
          }
          return 0.2;
        }
        return 0.6;
      })
      .attr('stroke-width', (d) => d.strength * 3)
      .attr('stroke-dasharray', (d) => d.type === 'potential' ? '5,5' : 'none');

    // Add nodes
    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.id !== 'user') {
          setTargetId(d.id === targetId ? '' : d.id);
        }
      })
      .call(d3.drag<SVGGElement, InfluenceNode>()
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
        }) as any);

    // Node circles
    nodeGroup.append('circle')
      .attr('r', (d) => d.degree === 0 ? 20 : 12 + d.influenceScore * 8)
      .attr('fill', (d) => getDegreeColor(d.degree))
      .attr('stroke', (d) => d.id === targetId ? 'hsl(var(--destructive))' : 'hsl(var(--background))')
      .attr('stroke-width', (d) => d.id === targetId ? 3 : 2)
      .attr('opacity', (d) => highlightedPath ? (isInHighlightedPath(d.id) ? 1 : 0.3) : 1);

    // Node labels
    nodeGroup.append('text')
      .text((d) => d.name.split(' ')[0])
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.degree === 0 ? 35 : 28 + d.influenceScore * 8))
      .attr('font-size', 10)
      .attr('fill', 'hsl(var(--foreground))')
      .attr('opacity', (d) => highlightedPath ? (isInHighlightedPath(d.id) ? 1 : 0.3) : 1);

    // Degree labels
    nodeGroup.append('text')
      .text((d) => d.degree === 0 ? '★' : d.degree.toString())
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 10)
      .attr('fill', 'white')
      .attr('font-weight', 'bold');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, targetId, highlightedPath, maxDegree]);

  const targetNode = nodes.find(n => n.id === targetId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Influence Network Mapper
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {nodes.length} nodes
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Max Degree:</span>
            <Select value={maxDegree} onValueChange={(v: '2' | '3') => setMaxDegree(v)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2°</SelectItem>
                <SelectItem value="3">3°</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {targetId && (
            <Button variant="outline" size="sm" onClick={() => { setTargetId(''); setHighlightedPath(null); }}>
              Clear Target
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" /> You
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} /> 1° Direct
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(48, 96%, 53%)' }} /> 2° Second
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} /> 3° Third
          </span>
        </div>

        {/* Graph */}
        <div ref={containerRef} className="border rounded-lg bg-card overflow-hidden">
          <svg ref={svgRef} className="w-full" />
        </div>

        {/* Optimal Paths */}
        {targetId && optimalPaths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Optimal Influence Paths to {targetNode?.name}</span>
            </div>
            <div className="space-y-2">
              {optimalPaths.map((path, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    highlightedPath?.join(',') === path.nodes.join(',')
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setHighlightedPath(
                    highlightedPath?.join(',') === path.nodes.join(',') ? null : path.nodes
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {path.nodes.map((nodeId, i) => {
                        const node = nodes.find(n => n.id === nodeId);
                        return (
                          <React.Fragment key={nodeId}>
                            <span className={i === 0 ? 'font-medium text-primary' : ''}>
                              {node?.name || nodeId}
                            </span>
                            {i < path.nodes.length - 1 && <span className="text-muted-foreground">→</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{path.hops} hops</Badge>
                      <Badge variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        {(path.totalStrength * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!targetId && (
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click on any node to set as target and discover optimal influence paths
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
