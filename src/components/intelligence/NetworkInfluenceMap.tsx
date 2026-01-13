import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import {
  Network, ZoomIn, ZoomOut, Maximize2,
  Filter, Download, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface NetworkNode {
  id: string;
  name: string;
  role: 'ally' | 'adversary' | 'neutral' | 'unknown';
  influence: number;
  connections: number;
  group?: string;
}

interface NetworkLink {
  source: string;
  target: string;
  strength: number;
  type: 'positive' | 'negative' | 'neutral';
}

interface NetworkInfluenceMapProps {
  className?: string;
}

export function NetworkInfluenceMap({ className }: NetworkInfluenceMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [filter, setFilter] = useState<string>('all');
  const [zoom, setZoom] = useState(1);

  // Mock network data
  const nodes: NetworkNode[] = [
    { id: 'you', name: 'You', role: 'ally', influence: 100, connections: 15 },
    { id: '1', name: 'Alex Chen', role: 'ally', influence: 85, connections: 12, group: 'business' },
    { id: '2', name: 'Sarah Kim', role: 'ally', influence: 70, connections: 8, group: 'business' },
    { id: '3', name: 'Mike Johnson', role: 'neutral', influence: 60, connections: 5, group: 'social' },
    { id: '4', name: 'Emily Davis', role: 'ally', influence: 75, connections: 10, group: 'business' },
    { id: '5', name: 'David Park', role: 'adversary', influence: 80, connections: 9, group: 'business' },
    { id: '6', name: 'Lisa Wong', role: 'neutral', influence: 45, connections: 4, group: 'social' },
    { id: '7', name: 'James Lee', role: 'ally', influence: 55, connections: 6, group: 'family' },
    { id: '8', name: 'Jennifer Smith', role: 'unknown', influence: 30, connections: 2, group: 'social' },
  ];

  const links: NetworkLink[] = [
    { source: 'you', target: '1', strength: 0.9, type: 'positive' },
    { source: 'you', target: '2', strength: 0.8, type: 'positive' },
    { source: 'you', target: '3', strength: 0.5, type: 'neutral' },
    { source: 'you', target: '4', strength: 0.7, type: 'positive' },
    { source: 'you', target: '5', strength: 0.3, type: 'negative' },
    { source: '1', target: '2', strength: 0.6, type: 'positive' },
    { source: '1', target: '4', strength: 0.7, type: 'positive' },
    { source: '2', target: '5', strength: 0.4, type: 'neutral' },
    { source: '3', target: '6', strength: 0.5, type: 'positive' },
    { source: 'you', target: '7', strength: 0.9, type: 'positive' },
    { source: '6', target: '8', strength: 0.3, type: 'neutral' },
    { source: '4', target: '5', strength: 0.2, type: 'negative' },
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 400;

    const g = svg.append('g');

    // Define arrow markers
    svg.append('defs').selectAll('marker')
      .data(['positive', 'negative', 'neutral'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', d => d === 'positive' ? '#22c55e' : d === 'negative' ? '#ef4444' : '#6b7280')
      .attr('d', 'M0,-5L10,0L0,5');

    // Create simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => d.type === 'positive' ? '#22c55e' : d.type === 'negative' ? '#ef4444' : '#6b7280')
      .attr('stroke-opacity', d => d.strength)
      .attr('stroke-width', d => d.strength * 3)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<any, any>()
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
        })
      );

    // Node circles
    node.append('circle')
      .attr('r', d => 10 + (d.influence / 10))
      .attr('fill', d => {
        if (d.id === 'you') return '#8b5cf6';
        switch (d.role) {
          case 'ally': return '#22c55e';
          case 'adversary': return '#ef4444';
          case 'neutral': return '#6b7280';
          default: return '#3b82f6';
        }
      })
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Node labels
    node.append('text')
      .text(d => d.name.split(' ')[0])
      .attr('text-anchor', 'middle')
      .attr('dy', d => 25 + (d.influence / 10))
      .attr('fill', '#9ca3af')
      .style('font-size', '11px')
      .style('pointer-events', 'none');

    // Influence ring
    node.append('circle')
      .attr('r', d => 12 + (d.influence / 10))
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (d.id === 'you') return '#8b5cf640';
        switch (d.role) {
          case 'ally': return '#22c55e40';
          case 'adversary': return '#ef444440';
          default: return '#6b728040';
        }
      })
      .attr('stroke-width', 1);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    return () => {
      simulation.stop();
    };
  }, [filter]);

  const roleColors = {
    ally: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    adversary: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    neutral: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
    unknown: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }
  };

  return (
    <Card className={cn("border-border/40", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Influence Network</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="allies">Allies Only</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(roleColors).map(([role, colors]) => (
            <Badge 
              key={role} 
              variant="outline" 
              className={cn("text-xs", colors.bg, colors.text, colors.border)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          ))}
        </div>

        {/* Network Visualization */}
        <div className="relative rounded-lg border border-border/40 bg-muted/20 overflow-hidden">
          <svg 
            ref={svgRef}
            className="w-full"
            style={{ height: 400 }}
          />
          
          {/* Zoom Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border border-border/40">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setZoom(z => Math.min(3, z + 0.2))}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Nodes', value: nodes.length, color: 'text-primary' },
            { label: 'Allies', value: nodes.filter(n => n.role === 'ally').length, color: 'text-emerald-400' },
            { label: 'Adversaries', value: nodes.filter(n => n.role === 'adversary').length, color: 'text-red-400' },
            { label: 'Connections', value: links.length, color: 'text-blue-400' }
          ].map((stat) => (
            <div key={stat.label} className="text-center p-2 rounded-lg bg-muted/30">
              <div className={cn("text-xl font-bold", stat.color)}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
