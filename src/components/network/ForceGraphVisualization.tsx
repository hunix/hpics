import { useRef, useCallback, useEffect } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Network, ZoomIn, ZoomOut, RotateCcw, Star, Image, FileText } from 'lucide-react';
import { getClusterColor } from '@/lib/network';
import type { VisualizationNode, VisualizationLink, ColorMode } from '@/lib/network/types/visualization';
import { RELATIONSHIP_COLORS } from '@/lib/network/types/visualization';

interface ForceGraphVisualizationProps {
  nodes: VisualizationNode[];
  links: VisualizationLink[];
  isLoading: boolean;
  filter: string;
  minImportance: number;
  showDecay: boolean;
  colorBy: ColorMode;
  selectedNode: VisualizationNode | null;
  setSelectedNode: (node: VisualizationNode | null) => void;
}

export function ForceGraphVisualization({
  nodes,
  links,
  isLoading,
  filter,
  minImportance,
  showDecay,
  colorBy,
  selectedNode,
  setSelectedNode,
}: ForceGraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<VisualizationNode, VisualizationLink> | null>(null);

  const getDecayOpacity = (decayLevel: number) => {
    if (!showDecay) return 1;
    return Math.max(0.3, 1 - (decayLevel / 150));
  };

  const getNodeColor = (node: VisualizationNode): string => {
    if (colorBy === 'cluster' && node.clusterId !== undefined) {
      return getClusterColor(node.clusterId);
    }
    if (colorBy === 'pagerank') {
      const rank = node.pageRank || 0;
      const hue = 240 - (rank * 240);
      return `hsl(${hue}, 70%, 50%)`;
    }
    return RELATIONSHIP_COLORS[node.type] || '#9ca3af';
  };

  const drawNetwork = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !nodes.length) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 600;

    // Filter nodes
    let filteredNodes = nodes.filter((n) => n.importance >= minImportance);
    if (filter !== 'all') {
      filteredNodes = filteredNodes.filter((n) => n.type === filter);
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = links.filter(
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

    const simulation = d3.forceSimulation<VisualizationNode>(filteredNodes)
      .force('link', d3.forceLink<VisualizationNode, VisualizationLink>(filteredLinks)
        .id((d) => d.id)
        .distance((d) => 120 - (d.weight * 40))
        .strength((d) => d.weight * 0.7))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<VisualizationNode>().radius((d) => 50 + (d.importance / 15)));

    simulationRef.current = simulation;

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('stroke', (d) => RELATIONSHIP_COLORS[d.type] || '#999')
      .attr('stroke-opacity', (d) => {
        const sourceNode = filteredNodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
        const targetNode = filteredNodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target.id));
        const avgDecay = ((sourceNode?.decayLevel || 0) + (targetNode?.decayLevel || 0)) / 2;
        return 0.4 * getDecayOpacity(avgDecay);
      })
      .attr('stroke-width', (d) => Math.max(1, d.weight * 4));

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, VisualizationNode>()
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
      .attr('r', (d) => 10 + (d.importance / 10) + ((d.pageRank || 0) * 5))
      .attr('fill', (d) => getNodeColor(d))
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

    // Node labels
    const truncateName = (name: string, maxLen = 14) => 
      name.length > maxLen ? name.slice(0, maxLen) + '…' : name;

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
        .attr('x1', (d) => (d.source as VisualizationNode).x!)
        .attr('y1', (d) => (d.source as VisualizationNode).y!)
        .attr('x2', (d) => (d.target as VisualizationNode).x!)
        .attr('y2', (d) => (d.target as VisualizationNode).y!);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
  }, [nodes, links, filter, minImportance, showDecay, colorBy, setSelectedNode]);

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
    if (!nodes.length) return;
    
    const headers = ['Name', 'Relationship Type', 'Importance', 'Communications', 'Messages', 'Events', 'Decay Level', 'Favorite'];
    const rows = nodes.map(n => [
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

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Graph
            </CardTitle>
            <CardDescription>
              Drag nodes to rearrange. Scroll to zoom. Fading = relationship decay.
            </CardDescription>
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : !nodes.length ? (
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
                  style={{ backgroundColor: RELATIONSHIP_COLORS[selectedNode.type] }}
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
  );
}
