/**
 * Memetic Propagation Visualizer
 * D3-based network visualization of idea spread using SIR model
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Zap, Users, TrendingUp } from 'lucide-react';
import { useMemeticEngineering } from '@/hooks/intelligence/useMemeticEngineering';

interface PropagationNode {
  id: string;
  name: string;
  state: 'susceptible' | 'infected' | 'recovered';
  infectedAt?: number;
  recoveredAt?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface PropagationLink {
  source: string | PropagationNode;
  target: string | PropagationNode;
  strength: number;
}

interface MemeticPropagationGraphProps {
  campaignId?: string;
  profileId?: string;
}

export function MemeticPropagationGraph({ campaignId, profileId }: MemeticPropagationGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [speed, setSpeed] = useState([50]);
  const [nodes, setNodes] = useState<PropagationNode[]>([]);
  const [links, setLinks] = useState<PropagationLink[]>([]);
  const animationRef = useRef<number>();
  
  const { campaigns } = useMemeticEngineering();
  const activeCampaign = campaigns?.find(c => c.id === campaignId) || campaigns?.[0];

  // Initialize demo network
  useEffect(() => {
    const demoNodes: PropagationNode[] = [
      { id: 'seed', name: 'Seed Node', state: 'infected' },
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `node-${i}`,
        name: `Contact ${i + 1}`,
        state: 'susceptible' as const,
      })),
    ];

    const demoLinks: PropagationLink[] = [
      // Seed connections
      { source: 'seed', target: 'node-0', strength: 0.8 },
      { source: 'seed', target: 'node-1', strength: 0.7 },
      { source: 'seed', target: 'node-2', strength: 0.9 },
      // Secondary connections
      { source: 'node-0', target: 'node-3', strength: 0.6 },
      { source: 'node-0', target: 'node-4', strength: 0.5 },
      { source: 'node-1', target: 'node-5', strength: 0.7 },
      { source: 'node-1', target: 'node-6', strength: 0.4 },
      { source: 'node-2', target: 'node-7', strength: 0.8 },
      { source: 'node-2', target: 'node-8', strength: 0.6 },
      // Tertiary connections
      { source: 'node-3', target: 'node-9', strength: 0.5 },
      { source: 'node-4', target: 'node-10', strength: 0.4 },
      { source: 'node-5', target: 'node-11', strength: 0.6 },
      { source: 'node-6', target: 'node-12', strength: 0.3 },
      { source: 'node-7', target: 'node-13', strength: 0.7 },
      { source: 'node-8', target: 'node-14', strength: 0.5 },
      // Cross connections
      { source: 'node-9', target: 'node-15', strength: 0.4 },
      { source: 'node-10', target: 'node-16', strength: 0.5 },
      { source: 'node-11', target: 'node-17', strength: 0.6 },
      { source: 'node-12', target: 'node-18', strength: 0.4 },
      { source: 'node-13', target: 'node-19', strength: 0.5 },
      // Network density
      { source: 'node-15', target: 'node-16', strength: 0.3 },
      { source: 'node-17', target: 'node-18', strength: 0.4 },
      { source: 'node-19', target: 'node-15', strength: 0.3 },
    ];

    setNodes(demoNodes);
    setLinks(demoLinks);
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Color scale for states
    const stateColors = {
      susceptible: 'hsl(var(--muted-foreground))',
      infected: 'hsl(var(--destructive))',
      recovered: 'hsl(var(--primary))',
    };

    // Create simulation
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(80)
        .strength((d: any) => d.strength * 0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    // Add links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => d.strength * 3);

    // Add nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => d.id === 'seed' ? 15 : 10)
      .attr('fill', (d) => stateColors[d.state])
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 2)
      .call(d3.drag<SVGCircleElement, PropagationNode>()
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

    // Add labels
    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d) => d.id === 'seed' ? '🎯' : '')
      .attr('font-size', 12)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Update colors when nodes change
    node.attr('fill', (d) => stateColors[d.state]);

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    let lastTime = 0;
    const interval = 2000 - speed[0] * 18; // Speed affects interval

    const animate = (time: number) => {
      if (time - lastTime > interval) {
        lastTime = time;
        
        // SIR model step
        setNodes(prevNodes => {
          const newNodes = [...prevNodes];
          const infectedNodes = newNodes.filter(n => n.state === 'infected');
          
          // For each infected node, try to infect neighbors
          infectedNodes.forEach(infected => {
            const neighbors = links
              .filter(l => {
                const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
                const targetId = typeof l.target === 'string' ? l.target : l.target.id;
                return sourceId === infected.id || targetId === infected.id;
              })
              .map(l => {
                const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
                const targetId = typeof l.target === 'string' ? l.target : l.target.id;
                return sourceId === infected.id ? targetId : sourceId;
              });

            neighbors.forEach(neighborId => {
              const neighbor = newNodes.find(n => n.id === neighborId);
              if (neighbor && neighbor.state === 'susceptible') {
                const link = links.find(l => {
                  const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
                  const targetId = typeof l.target === 'string' ? l.target : l.target.id;
                  return (sourceId === infected.id && targetId === neighborId) ||
                         (targetId === infected.id && sourceId === neighborId);
                });
                
                if (link && Math.random() < link.strength * 0.3) {
                  neighbor.state = 'infected';
                  neighbor.infectedAt = simulationStep;
                }
              }
            });
            
            // Chance to recover
            if (infected.id !== 'seed' && Math.random() < 0.1) {
              infected.state = 'recovered';
              infected.recoveredAt = simulationStep;
            }
          });
          
          return newNodes;
        });
        
        setSimulationStep(prev => prev + 1);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, links, simulationStep]);

  const resetSimulation = () => {
    setIsPlaying(false);
    setSimulationStep(0);
    setNodes(prev => prev.map(n => ({
      ...n,
      state: n.id === 'seed' ? 'infected' : 'susceptible',
      infectedAt: undefined,
      recoveredAt: undefined,
    })));
  };

  const stats = {
    susceptible: nodes.filter(n => n.state === 'susceptible').length,
    infected: nodes.filter(n => n.state === 'infected').length,
    recovered: nodes.filter(n => n.state === 'recovered').length,
  };

  // Calculate R0 from campaign data or derive from simulation stats
  const r0 = activeCampaign?.infection_rate && activeCampaign?.recovery_rate 
    ? (activeCampaign.infection_rate / activeCampaign.recovery_rate).toFixed(2)
    : (stats.infected + stats.recovered > 1 ? 
        ((stats.infected + stats.recovered - 1) / Math.max(1, stats.recovered)).toFixed(2) : 
        '0.00');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Memetic Propagation Visualizer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Step: {simulationStep}</Badge>
            <Badge variant="secondary">R₀: {r0}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-sm">Susceptible: {stats.susceptible}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-sm">Infected: {stats.infected}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm">Recovered: {stats.recovered}</span>
          </div>
        </div>

        {/* Graph Container */}
        <div ref={containerRef} className="border rounded-lg bg-card overflow-hidden">
          <svg ref={svgRef} className="w-full" />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={isPlaying ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" size="sm" onClick={resetSimulation}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speed:</span>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              max={100}
              min={10}
              step={10}
              className="w-32"
            />
          </div>
        </div>

        {/* Campaign Info */}
        {activeCampaign && (
          <div className="p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">{activeCampaign.campaign_name}</span>
            </div>
            <p className="text-sm text-muted-foreground">{activeCampaign.core_narrative}</p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline">Reach: {activeCampaign.current_reach?.toLocaleString() || 0}</Badge>
              <Badge variant="outline">Infection Rate: {((activeCampaign.infection_rate || 0) * 100).toFixed(1)}%</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
