import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import * as d3 from 'd3';

interface NetworkNode {
  id: string;
  name: string;
  group: string;
  organization?: string;
  isFavorite: boolean;
}

interface NetworkLink {
  source: string;
  target: string;
  type: string;
  strength: number;
}

const relationshipColors: Record<string, string> = {
  family: '#ef4444',
  friend: '#3b82f6',
  colleague: '#8b5cf6',
  client: '#22c55e',
  mentor: '#eab308',
  mentee: '#f97316',
  acquaintance: '#6b7280',
  other: '#9ca3af',
};

// Maximum nodes before sampling kicks in
const MAX_NODES = 500;

type SamplingStrategy = 'favorites' | 'recent' | 'connected';

export function NetworkGraph() {
  const { user } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [strategy, setStrategy] = useState<SamplingStrategy>('favorites');

  const { data: networkData, isLoading } = useQuery({
    queryKey: ['network-graph', user?.id, strategy],
    queryFn: async () => {
      // Get total count first
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const needsSampling = (totalCount || 0) > MAX_NODES;

      // Build query based on strategy
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, relationship_type, is_favorite, tags, created_at, updated_at')
        .eq('user_id', user!.id);

      if (needsSampling) {
        switch (strategy) {
          case 'favorites':
            query = query.order('is_favorite', { ascending: false }).order('created_at', { ascending: false });
            break;
          case 'recent':
            query = query.order('updated_at', { ascending: false });
            break;
          case 'connected':
          default:
            query = query.order('is_favorite', { ascending: false }).order('updated_at', { ascending: false });
            break;
        }
        query = query.limit(MAX_NODES);
      }

      const { data: profiles } = await query;
      const profileIds = (profiles || []).map(p => p.id);

      // Fetch relationships for the selected profiles
      const { data: relationships } = await supabase
        .from('contact_relationships')
        .select('from_profile_id, to_profile_id, relationship_type')
        .eq('user_id', user!.id)
        .in('from_profile_id', profileIds)
        .in('to_profile_id', profileIds);

      // Fetch shared data for inferring connections
      const { data: interests } = await supabase
        .from('contact_interests')
        .select('profile_id, name')
        .eq('user_id', user!.id)
        .in('profile_id', profileIds);

      const { data: skills } = await supabase
        .from('contact_skills')
        .select('profile_id, skill_name')
        .eq('user_id', user!.id)
        .in('profile_id', profileIds);

      // Build nodes
      const nodes: NetworkNode[] = (profiles || []).map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name || ''}`.trim() || 'Unknown',
        group: p.relationship_type || 'other',
        organization: p.organization || undefined,
        isFavorite: p.is_favorite || false,
      }));

      // Build links based on shared attributes
      const links: NetworkLink[] = [];
      const interestsMap = new Map<string, string[]>();
      const skillsMap = new Map<string, string[]>();
      const orgsMap = new Map<string, string[]>();

      (interests || []).forEach(i => {
        const existing = interestsMap.get(i.name.toLowerCase()) || [];
        existing.push(i.profile_id);
        interestsMap.set(i.name.toLowerCase(), existing);
      });

      (skills || []).forEach(s => {
        const existing = skillsMap.get(s.skill_name.toLowerCase()) || [];
        existing.push(s.profile_id);
        skillsMap.set(s.skill_name.toLowerCase(), existing);
      });

      (profiles || []).forEach(p => {
        if (p.organization) {
          const existing = orgsMap.get(p.organization.toLowerCase()) || [];
          existing.push(p.id);
          orgsMap.set(p.organization.toLowerCase(), existing);
        }
      });

      // Add explicit relationships
      (relationships || []).forEach(r => {
        const existing = links.find(l => 
          (l.source === r.from_profile_id && l.target === r.to_profile_id) ||
          (l.source === r.to_profile_id && l.target === r.from_profile_id)
        );
        if (existing) {
          existing.strength += 3;
        } else {
          links.push({
            source: r.from_profile_id,
            target: r.to_profile_id,
            type: r.relationship_type || 'relationship',
            strength: 3,
          });
        }
      });

      // Create links for shared interests
      interestsMap.forEach((pIds) => {
        if (pIds.length > 1) {
          for (let i = 0; i < pIds.length; i++) {
            for (let j = i + 1; j < pIds.length; j++) {
              const existing = links.find(l => 
                (l.source === pIds[i] && l.target === pIds[j]) ||
                (l.source === pIds[j] && l.target === pIds[i])
              );
              if (existing) {
                existing.strength += 1;
              } else {
                links.push({
                  source: pIds[i],
                  target: pIds[j],
                  type: 'interest',
                  strength: 1,
                });
              }
            }
          }
        }
      });

      // Create links for shared skills
      skillsMap.forEach((pIds) => {
        if (pIds.length > 1) {
          for (let i = 0; i < pIds.length; i++) {
            for (let j = i + 1; j < pIds.length; j++) {
              const existing = links.find(l => 
                (l.source === pIds[i] && l.target === pIds[j]) ||
                (l.source === pIds[j] && l.target === pIds[i])
              );
              if (existing) {
                existing.strength += 1;
              } else {
                links.push({
                  source: pIds[i],
                  target: pIds[j],
                  type: 'skill',
                  strength: 1,
                });
              }
            }
          }
        }
      });

      // Create links for same organization
      orgsMap.forEach((pIds) => {
        if (pIds.length > 1) {
          for (let i = 0; i < pIds.length; i++) {
            for (let j = i + 1; j < pIds.length; j++) {
              const existing = links.find(l => 
                (l.source === pIds[i] && l.target === pIds[j]) ||
                (l.source === pIds[j] && l.target === pIds[i])
              );
              if (existing) {
                existing.strength += 2;
              } else {
                links.push({
                  source: pIds[i],
                  target: pIds[j],
                  type: 'organization',
                  strength: 2,
                });
              }
            }
          }
        }
      });

      return { nodes, links, totalNodes: totalCount || 0, sampled: needsSampling };
    },
    enabled: !!user,
    staleTime: 60000,
  });

  useEffect(() => {
    if (!networkData || !svgRef.current || networkData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 400;

    const simulation = d3.forceSimulation(networkData.nodes as any)
      .force('link', d3.forceLink(networkData.links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const g = svg.append('g');

    // Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(networkData.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.strength));

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(networkData.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, NetworkNode>()
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
      .attr('r', (d: NetworkNode) => d.isFavorite ? 18 : 14)
      .attr('fill', (d: NetworkNode) => relationshipColors[d.group] || '#9ca3af')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node.append('text')
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'currentColor')
      .text((d: NetworkNode) => d.name.length > 15 ? d.name.slice(0, 15) + '...' : d.name);

    node.on('click', (_, d) => {
      setSelectedNode(d as NetworkNode);
    });

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
  }, [networkData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Network Graph
            </CardTitle>
            <CardDescription>
              Visual map of your contacts and their connections
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{networkData?.nodes.length || 0} contacts</Badge>
            <Badge variant="outline">{networkData?.links.length || 0} connections</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {networkData && networkData.nodes.length > 0 ? (
          <>
            <div className="relative border rounded-lg overflow-hidden bg-muted/30">
              <svg ref={svgRef} className="w-full h-[400px]" />
              <div className="absolute bottom-2 right-2 flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {Object.entries(relationshipColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>

            {selectedNode && (
              <div className="mt-4 p-3 border rounded-lg bg-muted/50">
                <h4 className="font-medium">{selectedNode.name}</h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedNode.group} {selectedNode.organization && `• ${selectedNode.organization}`}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No contacts to visualize yet</p>
            <p className="text-sm">Add contacts with shared interests or organizations to see connections</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
