import { useState, useRef, useEffect } from 'react';
import { Network, Download, Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
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
}

interface NetworkLink {
  source: string;
  target: string;
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

  const loadNetworkData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, organization')
        .eq('user_id', user.id);

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
      toast.error('Failed to load network data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, [user]);

  useEffect(() => {
    if (!networkData || !svgRef.current) return;

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
      const validLinks = networkData.links.filter(link => 
        nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
      );

      if (networkData.nodes.length === 0) {
        console.log('[NetworkMapExport] No nodes to render');
        return;
      }

      // Create simulation with validated links
      const simulation = d3.forceSimulation(networkData.nodes as any)
        .force('link', d3.forceLink(validLinks).id((d: any) => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

      // Draw links with validated data
      const link = svg.append('g')
        .selectAll('line')
        .data(validLinks)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', (d: any) => Math.sqrt(d.strength) * 2);

      // Draw nodes
      const node = svg.append('g')
        .selectAll('g')
        .data(networkData.nodes)
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
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      node.append('text')
        .text((d: any) => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name)
        .attr('x', 12)
        .attr('y', 4)
        .attr('font-size', '10px')
        .attr('fill', '#333');

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

      // Cleanup on unmount
      return () => {
        simulation.stop();
      };
    } catch (error) {
      console.error('[NetworkMapExport] D3 rendering error:', error);
      // Don't crash the component - graceful degradation
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
