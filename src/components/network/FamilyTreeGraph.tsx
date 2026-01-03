import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import * as d3 from 'd3';

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string | null;
  relationship_subtype: string | null;
  avatar_url: string | null;
}

interface TreeNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  subtype: string;
  avatar?: string | null;
}

interface TreeLink extends d3.SimulationLinkDatum<TreeNode> {
  source: string | TreeNode;
  target: string | TreeNode;
}

export function FamilyTreeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ['family-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_subtype, avatar_url')
        .eq('relationship_type', 'family');
      if (error) throw error;
      return data as FamilyMember[];
    },
  });

  useEffect(() => {
    if (!familyMembers || familyMembers.length === 0 || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = 500;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    // Create nodes
    const nodes: TreeNode[] = familyMembers.map(member => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name || ''}`.trim(),
      subtype: member.relationship_subtype || 'relative',
      avatar: member.avatar_url,
    }));

    // Create links based on family relationships
    const links: TreeLink[] = [];
    const subtypeGroups: Record<string, string[]> = {};

    // Group by subtype to create connections
    nodes.forEach(node => {
      if (!subtypeGroups[node.subtype]) {
        subtypeGroups[node.subtype] = [];
      }
      subtypeGroups[node.subtype].push(node.id);
    });

    // Create links between parents and children, siblings, etc.
    const parentTypes = ['father', 'mother', 'parent'];
    const childTypes = ['son', 'daughter', 'child'];
    const siblingTypes = ['brother', 'sister', 'sibling'];
    const spouseTypes = ['spouse', 'husband', 'wife', 'partner'];

    // Connect parents to children
    nodes.forEach((node, i) => {
      if (parentTypes.includes(node.subtype)) {
        nodes.forEach(child => {
          if (childTypes.includes(child.subtype)) {
            links.push({ source: node.id, target: child.id });
          }
        });
      }
    });

    // Connect siblings
    const siblings = nodes.filter(n => siblingTypes.includes(n.subtype));
    for (let i = 0; i < siblings.length - 1; i++) {
      links.push({ source: siblings[i].id, target: siblings[i + 1].id });
    }

    // Connect spouses
    const spouses = nodes.filter(n => spouseTypes.includes(n.subtype));
    for (let i = 0; i < spouses.length - 1; i += 2) {
      if (spouses[i + 1]) {
        links.push({ source: spouses[i].id, target: spouses[i + 1].id });
      }
    }

    // If no links created, create a radial layout connecting all to center
    if (links.length === 0 && nodes.length > 1) {
      const center = nodes[0];
      for (let i = 1; i < nodes.length; i++) {
        links.push({ source: center.id, target: nodes[i].id });
      }
    }

    // Color by relationship type
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['father', 'mother', 'parent', 'son', 'daughter', 'child', 'brother', 'sister', 'sibling', 'spouse', 'husband', 'wife', 'partner', 'grandparent', 'grandchild', 'uncle', 'aunt', 'cousin', 'nephew', 'niece', 'relative'])
      .range(['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1', '#14b8a6', '#f97316', '#84cc16', '#ef4444', '#06b6d4', '#a855f7', '#22c55e', '#64748b', '#78716c', '#0ea5e9', '#d946ef', '#eab308', '#2563eb', '#dc2626', '#71717a']);

    const simulation = d3.forceSimulation<TreeNode>(nodes)
      .force('link', d3.forceLink<TreeNode, TreeLink>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, TreeNode>()
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
    node.append('circle')
      .attr('r', 30)
      .attr('fill', d => colorScale(d.subtype))
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 3);

    // Node labels
    node.append('text')
      .text(d => d.name.split(' ')[0])
      .attr('text-anchor', 'middle')
      .attr('dy', 45)
      .attr('font-size', '12px')
      .attr('fill', 'hsl(var(--foreground))');

    // Subtype labels
    node.append('text')
      .text(d => d.subtype)
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold');

    // Initials
    node.append('text')
      .text(d => {
        const parts = d.name.split(' ');
        return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
      })
      .attr('text-anchor', 'middle')
      .attr('dy', -6)
      .attr('font-size', '14px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as TreeNode).x!)
        .attr('y1', d => (d.source as TreeNode).y!)
        .attr('x2', d => (d.target as TreeNode).x!)
        .attr('y2', d => (d.target as TreeNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    return () => {
      simulation.stop();
    };
  }, [familyMembers]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]);
    const newScale = direction === 'in' ? zoom * 1.3 : zoom / 1.3;
    svg.transition().duration(300).call(zoomBehavior.scaleTo, newScale);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]);
    svg.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Family Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!familyMembers || familyMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Tree
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No family members found</h3>
          <p className="text-sm text-muted-foreground">
            Add contacts with relationship type "Family" to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Tree ({familyMembers.length} members)
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleZoom('out')}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={() => handleZoom('in')}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="border rounded-lg bg-muted/30 overflow-hidden">
          <svg ref={svgRef} className="w-full" style={{ minHeight: '500px' }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Drag nodes to rearrange. Scroll to zoom. Colors represent relationship types.
        </p>
      </CardContent>
    </Card>
  );
}
