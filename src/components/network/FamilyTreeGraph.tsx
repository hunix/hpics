import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import * as d3 from 'd3';
import { getRelationshipDefinition } from '@/lib/relationshipDefinitions';

interface TreeNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  relationshipLabel?: string;
  avatar?: string | null;
}

interface TreeLink extends d3.SimulationLinkDatum<TreeNode> {
  source: string | TreeNode;
  target: string | TreeNode;
  label: string;
}

export function FamilyTreeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const { user } = useAuth();

  // Fetch family relationships from contact_relationships table
  const { data: familyData, isLoading } = useQuery({
    queryKey: ['family-relationships', user?.id],
    queryFn: async () => {
      if (!user) return { relationships: [], profiles: new Map() };

      // Fetch family relationships
      const { data: relationships, error: relError } = await supabase
        .from('contact_relationships')
        .select(`
          id,
          from_profile_id,
          to_profile_id,
          relationship_label,
          relationship_type
        `)
        .eq('user_id', user.id)
        .eq('relationship_type', 'family');

      if (relError) throw relError;

      // Get unique profile IDs
      const profileIds = new Set<string>();
      relationships?.forEach(r => {
        profileIds.add(r.from_profile_id);
        profileIds.add(r.to_profile_id);
      });

      // Fetch profile details
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', Array.from(profileIds));

      if (profError) throw profError;

      const profileMap = new Map(
        profiles?.map(p => [p.id, p]) || []
      );

      return { relationships: relationships || [], profiles: profileMap };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!familyData || familyData.relationships.length === 0 || !svgRef.current || !containerRef.current) return;

    const { relationships, profiles } = familyData;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = 500;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    // Create nodes from unique profiles
    const nodeIds = new Set<string>();
    relationships.forEach(r => {
      nodeIds.add(r.from_profile_id);
      nodeIds.add(r.to_profile_id);
    });

    const nodes: TreeNode[] = Array.from(nodeIds).map(id => {
      const profile = profiles.get(id);
      return {
        id,
        name: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Unknown',
        avatar: profile?.avatar_url,
      };
    });

    // Create links from relationships
    const links: TreeLink[] = relationships.map(r => ({
      source: r.from_profile_id,
      target: r.to_profile_id,
      label: r.relationship_label,
    }));

    // Color by relationship label
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['father', 'mother', 'parent', 'son', 'daughter', 'child', 'brother', 'sister', 'sibling', 'spouse', 'husband', 'wife', 'grandfather', 'grandmother', 'grandparent', 'grandson', 'granddaughter', 'grandchild', 'uncle', 'aunt', 'nephew', 'niece', 'cousin', 'in-law', 'stepfather', 'stepmother', 'stepson', 'stepdaughter', 'stepsibling', 'ex-spouse'])
      .range([
        '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1', 
        '#14b8a6', '#f97316', '#84cc16', '#ef4444', '#06b6d4', '#a855f7',
        '#64748b', '#78716c', '#0ea5e9', '#22c55e', '#d946ef', '#eab308',
        '#2563eb', '#dc2626', '#f472b6', '#4ade80', '#facc15', '#71717a',
        '#0d9488', '#e879f9', '#fbbf24', '#38bdf8', '#a3e635', '#fb923c'
      ]);

    const simulation = d3.forceSimulation<TreeNode>(nodes)
      .force('link', d3.forceLink<TreeNode, TreeLink>(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(70));

    // Draw links
    const link = g.append('g')
      .selectAll('g')
      .data(links)
      .join('g');

    // Link lines
    link.append('line')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Link labels (relationship type)
    link.append('text')
      .text(d => {
        const def = getRelationshipDefinition(d.label);
        return def?.label || d.label;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .attr('dy', -5);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'grab')
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
      .attr('r', 35)
      .attr('fill', 'hsl(var(--primary))')
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 3);

    // Initials in center
    node.append('text')
      .text(d => {
        const parts = d.name.split(' ');
        return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
      })
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '16px')
      .attr('fill', 'hsl(var(--primary-foreground))')
      .attr('font-weight', 'bold');

    // Node name labels below
    node.append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 55)
      .attr('font-size', '12px')
      .attr('fill', 'hsl(var(--foreground))')
      .attr('font-weight', '500');

    simulation.on('tick', () => {
      // Update link positions
      link.select('line')
        .attr('x1', d => (d.source as TreeNode).x!)
        .attr('y1', d => (d.source as TreeNode).y!)
        .attr('x2', d => (d.target as TreeNode).x!)
        .attr('y2', d => (d.target as TreeNode).y!);

      // Update link label positions (midpoint)
      link.select('text')
        .attr('x', d => ((d.source as TreeNode).x! + (d.target as TreeNode).x!) / 2)
        .attr('y', d => ((d.source as TreeNode).y! + (d.target as TreeNode).y!) / 2);

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
  }, [familyData]);

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

  const relationshipCount = familyData?.relationships.length || 0;

  if (relationshipCount === 0) {
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
          <h3 className="font-semibold mb-2">No family relationships found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Add family relationships between your contacts using the "Family & Connections" section 
            on any contact's detail page to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const nodeCount = new Set([
    ...(familyData?.relationships.map(r => r.from_profile_id) || []),
    ...(familyData?.relationships.map(r => r.to_profile_id) || []),
  ]).size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Tree ({nodeCount} members, {relationshipCount} connections)
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
          Drag nodes to rearrange. Scroll to zoom. Lines show relationship types.
        </p>
      </CardContent>
    </Card>
  );
}
