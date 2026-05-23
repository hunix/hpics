import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, ZoomIn, ZoomOut, Maximize2, GitBranch, Eye, EyeOff, UserCheck } from 'lucide-react';
import * as d3 from 'd3';
import { buildFamilyGraph, getGenerationLabel, type FamilyGraph, type FamilyMember, type FamilyLink } from '@/lib/familyTreeEngine';
import { useFamilyTreeData } from '@/hooks/network/useFamilyTreeData';

export function FamilyTreeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [centerPersonId, setCenterPersonId] = useState<string | null>(null);
  const [showInferred, setShowInferred] = useState(true);

  const { data: rawData, isLoading } = useFamilyTreeData();

  // Build the family graph with anchor-based generation calculation
  const familyGraph = useMemo<FamilyGraph | null>(() => {
    if (!rawData || rawData.relationships.length === 0) return null;
    // Use self profile as anchor, or centerPersonId if manually selected
    const anchorId = centerPersonId || rawData.selfProfileId;
    return buildFamilyGraph(rawData.relationships, rawData.profiles, anchorId);
  }, [rawData, centerPersonId]);

  // Set initial center person to self profile
  useEffect(() => {
    if (rawData?.selfProfileId && !centerPersonId) {
      setCenterPersonId(rawData.selfProfileId);
    } else if (familyGraph && !centerPersonId && familyGraph.members.size > 0) {
      // Fallback: default to first member
      const firstId = familyGraph.members.keys().next().value;
      if (firstId) setCenterPersonId(firstId);
    }
  }, [familyGraph, centerPersonId, rawData?.selfProfileId]);

  useEffect(() => {
    if (!familyGraph || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = 600;
    const margin = { top: 80, right: 40, bottom: 60, left: 100 };

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Filter links based on showInferred
    const filteredLinks = showInferred 
      ? familyGraph.links 
      : familyGraph.links.filter(l => !l.isInferred);

    // Get members that are connected via filtered links
    const connectedIds = new Set<string>();
    filteredLinks.forEach(l => {
      connectedIds.add(l.source);
      connectedIds.add(l.target);
    });

    const members = Array.from(familyGraph.members.values()).filter(m => connectedIds.has(m.id));

    // Group by generation for hierarchical layout
    const genGroups = new Map<number, FamilyMember[]>();
    members.forEach(m => {
      if (!genGroups.has(m.generation)) genGroups.set(m.generation, []);
      genGroups.get(m.generation)!.push(m);
    });

    // Sort generations (negative first = ancestors at top)
    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);
    const genCount = sortedGens.length;
    const genHeight = (height - margin.top - margin.bottom) / Math.max(genCount, 1);
    const nodeRadius = 30;

    // Calculate positions for each member
    const positions = new Map<string, { x: number; y: number }>();
    
    sortedGens.forEach((gen, genIndex) => {
      const membersInGen = genGroups.get(gen) || [];
      const availableWidth = width - margin.left - margin.right;
      // Ensure minimum spacing between nodes
      const minSpacing = 140;
      const spacing = Math.max(minSpacing, availableWidth / (membersInGen.length + 1));
      
      // Center nodes if spacing exceeds available width
      const totalWidth = spacing * (membersInGen.length - 1);
      const startX = Math.max(spacing, (availableWidth - totalWidth) / 2);
      
      membersInGen.forEach((member, i) => {
        positions.set(member.id, {
          x: startX + spacing * i,
          y: genIndex * genHeight + nodeRadius + 20,
        });
      });
    });

    // Draw generation labels with semantic names
    const anchorMember = centerPersonId ? familyGraph.members.get(centerPersonId) : null;
    
    sortedGens.forEach((gen, genIndex) => {
      const y = genIndex * genHeight + 10;
      const label = getGenerationLabel(gen, anchorMember?.name?.split(' ')[0]);
      
      g.append('text')
        .attr('x', -90)
        .attr('y', y + nodeRadius + 20)
        .attr('text-anchor', 'start')
        .attr('font-size', '11px')
        .attr('fill', gen === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))')
        .attr('font-weight', gen === 0 ? '600' : '400')
        .text(label);
    });

    // Draw links
    const linkGroup = g.append('g').attr('class', 'links');
    
    filteredLinks.forEach(link => {
      const sourcePos = positions.get(link.source);
      const targetPos = positions.get(link.target);
      if (!sourcePos || !targetPos) return;

      const isSpouseLink = link.linkType === 'spouse';
      const isSiblingLink = link.linkType === 'sibling';
      
      // For spouse/sibling links (same generation), draw horizontal curve
      if (isSpouseLink || isSiblingLink) {
        const midY = (sourcePos.y + targetPos.y) / 2;
        const curveOffset = isSiblingLink ? -15 : 15;
        
        linkGroup.append('path')
          .attr('d', `M ${sourcePos.x} ${sourcePos.y} 
                      Q ${(sourcePos.x + targetPos.x) / 2} ${midY + curveOffset} 
                        ${targetPos.x} ${targetPos.y}`)
          .attr('fill', 'none')
          .attr('stroke', isSpouseLink ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))')
          .attr('stroke-width', isSpouseLink ? 2 : 1.5)
          .attr('stroke-dasharray', link.isInferred ? '4,4' : (isSpouseLink ? '0' : '0'))
          .attr('stroke-opacity', link.isInferred ? 0.5 : 0.8);
      } else {
        // Parent-child links: straight vertical with small horizontal offset
        const midY = (sourcePos.y + targetPos.y) / 2;
        
        linkGroup.append('path')
          .attr('d', `M ${sourcePos.x} ${sourcePos.y + nodeRadius} 
                      L ${sourcePos.x} ${midY}
                      L ${targetPos.x} ${midY}
                      L ${targetPos.x} ${targetPos.y - nodeRadius}`)
          .attr('fill', 'none')
          .attr('stroke', 'hsl(var(--border))')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', link.isInferred ? '4,4' : '0')
          .attr('stroke-opacity', link.isInferred ? 0.5 : 0.8);
      }
      
      // Skip link labels to reduce clutter - they overlap too much
      // Relationship type is visible when hovering/clicking nodes
    });

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    
    members.forEach(member => {
      const pos = positions.get(member.id);
      if (!pos) return;

      const isCenter = member.id === centerPersonId;
      const isSelf = member.isSelf;
      const nodeG = nodeGroup.append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .style('cursor', 'pointer')
        .on('click', () => setCenterPersonId(member.id));

      // Node circle
      nodeG.append('circle')
        .attr('r', nodeRadius)
        .attr('fill', isSelf ? 'hsl(var(--primary))' : isCenter ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--secondary))')
        .attr('stroke', isSelf || isCenter ? 'hsl(var(--primary))' : 'hsl(var(--border))')
        .attr('stroke-width', isSelf ? 4 : isCenter ? 3 : 2);

      // "You" badge for self profile
      if (isSelf) {
        nodeG.append('circle')
          .attr('cx', nodeRadius - 5)
          .attr('cy', -nodeRadius + 5)
          .attr('r', 10)
          .attr('fill', 'hsl(var(--primary))');
        
        nodeG.append('text')
          .attr('x', nodeRadius - 5)
          .attr('y', -nodeRadius + 9)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .attr('fill', 'hsl(var(--primary-foreground))')
          .text('YOU');
      }

      // Initials
      const initials = member.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
      nodeG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .attr('font-size', '14px')
        .attr('fill', isSelf || isCenter ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))')
        .attr('font-weight', 'bold')
        .text(initials);

      // Name below with background for readability
      const displayName = member.name.length > 12 ? member.name.slice(0, 12) + '…' : member.name;
      const textWidth = displayName.length * 6;
      
      nodeG.append('rect')
        .attr('x', -textWidth / 2 - 4)
        .attr('y', nodeRadius + 6)
        .attr('width', textWidth + 8)
        .attr('height', 16)
        .attr('fill', 'hsl(var(--background))')
        .attr('fill-opacity', 0.9)
        .attr('rx', 3);
      
      nodeG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', nodeRadius + 18)
        .attr('font-size', '10px')
        .attr('fill', 'hsl(var(--foreground))')
        .attr('font-weight', isSelf || isCenter ? '600' : '500')
        .text(displayName);
    });

    // Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', `translate(${event.transform.x + margin.left}, ${event.transform.y + margin.top}) scale(${event.transform.k})`);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

  }, [familyGraph, centerPersonId, showInferred]);

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
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const relationshipCount = rawData?.relationships.length || 0;
  const hasSelfProfile = !!rawData?.selfProfileId;

  if (relationshipCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
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

  const memberCount = familyGraph?.members.size || 0;
  const inferredCount = familyGraph?.links.filter(l => l.isInferred).length || 0;
  const explicitCount = (familyGraph?.links.length || 0) - inferredCount;
  const generationCount = familyGraph?.generations.size || 0;

  const memberOptions = familyGraph ? Array.from(familyGraph.members.values()) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            <span>Family Tree</span>
            <Badge variant="secondary">{memberCount} members</Badge>
            <Badge variant="outline">{generationCount} generations</Badge>
            {!hasSelfProfile && (
              <Badge variant="destructive" className="text-xs">
                No "self" profile set
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={centerPersonId || ''} onValueChange={setCenterPersonId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Center on..." />
              </SelectTrigger>
              <SelectContent>
                {memberOptions.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.isSelf && <UserCheck className="h-3 w-3 inline mr-1" />}
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showInferred ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowInferred(!showInferred)}
            >
              {showInferred ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Inferred ({inferredCount})
            </Button>
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
          <svg ref={svgRef} className="w-full" style={{ minHeight: '600px' }} />
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-border" />
            <span>Parent → Child</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-primary" />
            <span>Spouse</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-muted-foreground" style={{ borderBottom: '1.5px dashed' }} />
            <span>Inferred</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{explicitCount} explicit + {inferredCount} inferred relationships</span>
          </div>
        </div>
        {!hasSelfProfile && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
            <p className="text-amber-800 dark:text-amber-200">
              <strong>Tip:</strong> Mark one of your contacts as "This is me" in their profile to anchor the family tree to yourself. 
              This will show generations relative to you (parents above, children below).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
