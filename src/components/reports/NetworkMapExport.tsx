import { useState, useRef, useEffect, useCallback } from 'react';
import { Network, Download, Loader2, ZoomIn, ZoomOut, Maximize, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import * as d3 from 'd3';

type ExportFormat = 'svg' | 'png';
type LayoutType = 'force' | 'radial' | 'hierarchical';

interface NetworkNode {
  id: string;
  name: string;
  group: string;
  size: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  strength: number;
}

export function NetworkMapExport() {
  const { user } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [layout, setLayout] = useState<LayoutType>('force');
  const [networkData, setNetworkData] = useState<{ nodes: NetworkNode[]; links: NetworkLink[] } | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const loadNetworkData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setRenderError(null);

    try {
      // Fetch only active/favorite contacts (not hardware items)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, organization')
        .eq('user_id', user.id)
        .or('is_active.eq.true,is_favorite.eq.true');

      // Fetch relationships
      const { data: relationships } = await supabase
        .from('contact_relationships')
        .select('from_profile_id, to_profile_id, relationship_type')
        .eq('user_id', user.id);

      if (!profiles) return;

      const nodes: NetworkNode[] = profiles.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name || ''}`.trim(),
        group: p.relationship_type || 'other',
        size: 10,
      }));

      const links: NetworkLink[] = (relationships || []).map(r => ({
        source: r.from_profile_id,
        target: r.to_profile_id,
        strength: 0.5,
      }));

      setNetworkData({ nodes, links });
    } catch (error) {
      console.error('Error loading network data:', error);
      setRenderError(error instanceof Error ? error.message : 'Failed to load network data');
      toast.error('Failed to load network data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNetworkData();
  }, [user]);

  useEffect(() => {
    if (!networkData || !svgRef.current) return;

    // Reset error state on new render attempt
    setRenderError(null);

    try {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const width = 600;
      const height = 400;

      svg.attr('viewBox', `0 0 ${width} ${height}`);

      // Color scale for groups
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // Filter links to only include valid node references (prevents D3 crash)
      const nodeIds = new Set(networkData.nodes.map(n => n.id));
      const validLinks = networkData.links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
        return sourceId && targetId && nodeIds.has(sourceId) && nodeIds.has(targetId);
      });

      if (networkData.nodes.length === 0) {
        console.log('[NetworkMapExport] No nodes to render');
        return;
      }

      // DEFENSIVE: Ensure all nodes have valid initial positions
      const nodesWithPositions = networkData.nodes.map((node, i) => ({
        ...node,
        x: node.x ?? width / 2 + (Math.random() - 0.5) * 100,
        y: node.y ?? height / 2 + (Math.random() - 0.5) * 100,
      }));

      // Create simulation with validated links and positioned nodes
      const simulation = d3.forceSimulation(nodesWithPositions as any)
        .force('link', d3.forceLink(validLinks).id((d: any) => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

      // Draw links with validated data
      const link = svg.append('g')
        .selectAll('line')
        .data(validLinks)
        .join('line')
        .attr('stroke', 'hsl(var(--muted-foreground))')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', (d: any) => Math.sqrt(d.strength) * 2);

      // Draw nodes
      const node = svg.append('g')
        .selectAll('g')
        .data(nodesWithPositions)
        .join('g')
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
          }) as any);

      node.append('circle')
        .attr('r', (d: any) => d.size)
        .attr('fill', (d: any) => colorScale(d.group))
        .attr('stroke', 'hsl(var(--background))')
        .attr('stroke-width', 2);

      node.append('text')
        .text((d: any) => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name)
        .attr('x', 12)
        .attr('y', 4)
        .attr('font-size', '10px')
        .attr('fill', 'hsl(var(--foreground))');

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source?.x ?? 0)
          .attr('y1', (d: any) => d.source?.y ?? 0)
          .attr('x2', (d: any) => d.target?.x ?? 0)
          .attr('y2', (d: any) => d.target?.y ?? 0);

        node.attr('transform', (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

      // Cleanup on unmount
      return () => {
        simulation.stop();
      };
    } catch (error) {
      console.error('[NetworkMapExport] D3 rendering error:', error);
      setRenderError(error instanceof Error ? error.message : 'Failed to render network visualization');
    }
  }, [networkData, layout]);

  const exportMap = async () => {
    if (!svgRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(svgElement);

      if (format === 'svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `network-map-${new Date().toISOString().split('T')[0]}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Convert to PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = 1200;
        canvas.height = 800;

        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `network-map-${new Date().toISOString().split('T')[0]}.png`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }, 'image/png');
          }
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
      }

      toast.success(`Network map exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export network map');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Map Export
        </CardTitle>
        <CardDescription>
          Export your relationship network as an image
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="border rounded-lg bg-muted/30 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : renderError ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-4">
              <AlertTriangle className="h-12 w-12 mb-4 text-destructive" />
              <p className="font-medium text-foreground">Network visualization failed</p>
              <p className="text-sm text-center mt-1 max-w-md">{renderError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setRenderError(null); loadNetworkData(); }} 
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : networkData && networkData.nodes.length > 0 ? (
            <svg ref={svgRef} className="w-full h-64" />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No network data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG Image</SelectItem>
                <SelectItem value="svg">SVG Vector</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Layout Style</Label>
            <Select value={layout} onValueChange={(v) => setLayout(v as LayoutType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="force">Force-Directed</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
                <SelectItem value="hierarchical">Hierarchical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={exportMap} 
          disabled={isExporting || !networkData || networkData.nodes.length === 0}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Network Map
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
