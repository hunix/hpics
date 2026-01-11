// Track Community Evolution - Detects changes in network communities over time
// Identifies growing, fragmenting, and dissolving communities

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Community {
  id: number;
  members: string[];
  size: number;
  connections: number;
}

interface CommunityChange {
  type: 'new' | 'dissolved' | 'grew' | 'shrank' | 'merged' | 'split' | 'stable';
  communityId: number;
  previousSize?: number;
  currentSize?: number;
  changePercent?: number;
  details: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { snapshotType = 'daily' } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch current network data
    const [
      { data: profiles },
      { data: connections },
      { data: previousSnapshot },
    ] = await Promise.all([
      supabase.from('profiles')
        .select('id, first_name, last_name, relationship_type, is_favorite')
        .eq('user_id', user.id),
      supabase.from('connection_intelligence')
        .select('profile_a_id, profile_b_id, connection_strength, connection_type')
        .eq('user_id', user.id),
      supabase.from('network_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('snapshot_type', snapshotType)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No contacts to analyze' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build current network graph
    const nodes = profiles.map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name || ''}`.trim(),
      type: p.relationship_type,
      isFavorite: p.is_favorite,
    }));

    const edges = (connections || []).map(c => ({
      source: c.profile_a_id,
      target: c.profile_b_id,
      weight: c.connection_strength || 0.5,
      type: c.connection_type,
    }));

    // Detect communities using simple label propagation
    const communities = detectCommunities(nodes.map(n => n.id), edges);
    
    // Calculate network metrics
    const metrics = calculateNetworkMetrics(nodes, edges, communities);

    // Compare with previous snapshot
    const changes: CommunityChange[] = [];
    const previousCommunities = previousSnapshot?.community_structure as Record<string, number[]> | undefined;

    if (previousCommunities) {
      // Detect changes
      const prevCommunityMap = new Map<number, string[]>();
      for (const [nodeId, communityId] of Object.entries(previousCommunities)) {
        if (!prevCommunityMap.has(communityId as unknown as number)) {
          prevCommunityMap.set(communityId as unknown as number, []);
        }
        prevCommunityMap.get(communityId as unknown as number)!.push(nodeId);
      }

      const currentCommunityMap = new Map<number, string[]>();
      for (const [nodeId, communityId] of communities.entries()) {
        if (!currentCommunityMap.has(communityId)) {
          currentCommunityMap.set(communityId, []);
        }
        currentCommunityMap.get(communityId)!.push(nodeId);
      }

      // Find changes
      for (const [communityId, members] of currentCommunityMap.entries()) {
        // Check if this community existed before
        const previousMatch = findBestMatch(members, prevCommunityMap);
        
        if (!previousMatch) {
          changes.push({
            type: 'new',
            communityId,
            currentSize: members.length,
            details: `New community with ${members.length} members`,
          });
        } else {
          const growthRate = (members.length - previousMatch.size) / previousMatch.size;
          
          if (Math.abs(growthRate) < 0.1) {
            changes.push({
              type: 'stable',
              communityId,
              previousSize: previousMatch.size,
              currentSize: members.length,
              changePercent: growthRate * 100,
              details: 'Community is stable',
            });
          } else if (growthRate > 0) {
            changes.push({
              type: 'grew',
              communityId,
              previousSize: previousMatch.size,
              currentSize: members.length,
              changePercent: growthRate * 100,
              details: `Community grew by ${Math.round(growthRate * 100)}%`,
            });
          } else {
            changes.push({
              type: 'shrank',
              communityId,
              previousSize: previousMatch.size,
              currentSize: members.length,
              changePercent: growthRate * 100,
              details: `Community shrank by ${Math.round(Math.abs(growthRate) * 100)}%`,
            });
          }
        }
      }
    }

    // Identify community leaders
    const leaders: Record<number, string[]> = {};
    for (const [communityId, members] of groupByValue(communities).entries()) {
      // Leader = most connected member within community
      const memberDegrees = members.map(m => ({
        id: m,
        degree: edges.filter(e => 
          (e.source === m || e.target === m) && 
          members.includes(e.source === m ? e.target : e.source)
        ).length,
      }));
      memberDegrees.sort((a, b) => b.degree - a.degree);
      leaders[communityId] = memberDegrees.slice(0, 3).map(m => m.id);
    }

    // Store snapshot
    const snapshotDate = new Date().toISOString().split('T')[0];
    const communityStructure: Record<string, number> = {};
    for (const [nodeId, communityId] of communities.entries()) {
      communityStructure[nodeId] = communityId;
    }

    const { data: snapshot } = await supabase
      .from('network_snapshots')
      .upsert({
        user_id: user.id,
        snapshot_date: snapshotDate,
        snapshot_type: snapshotType,
        metrics,
        community_structure: communityStructure,
        change_summary: { changes, leaders },
      }, { onConflict: 'user_id,snapshot_date,snapshot_type' })
      .select()
      .single();

    // Store individual community evolution records
    for (const [communityId, members] of groupByValue(communities).entries()) {
      const change = changes.find(c => c.communityId === communityId);
      
      await supabase.from('community_evolution').insert({
        user_id: user.id,
        snapshot_id: snapshot?.id,
        community_id: communityId,
        member_count: members.length,
        leader_profile_ids: leaders[communityId] || [],
        member_profile_ids: members,
        status: change?.type || 'stable',
        growth_rate: change?.changePercent ? change.changePercent / 100 : 0,
      });
    }

    // Generate AI insights for significant changes
    let aiInsights = null;
    const significantChanges = changes.filter(c => 
      c.type !== 'stable' && Math.abs(c.changePercent || 0) > 20
    );

    if (significantChanges.length > 0) {
      try {
        const aiResponse = await callAI({
          model: selectModel('balanced'),
          messages: [
            {
              role: 'system',
              content: 'You are a network analyst. Provide insights on community changes and their implications for relationship management.',
            },
            {
              role: 'user',
              content: `Analyze these network community changes and provide strategic recommendations:

Changes Detected:
${JSON.stringify(significantChanges, null, 2)}

Network Metrics:
${JSON.stringify(metrics, null, 2)}

Provide: 1) Key observations, 2) Risks to watch, 3) Opportunities, 4) Recommended actions`,
            },
          ],
          userId: user.id,
          functionName: 'track-community-evolution',
          temperature: 0.6,
          maxTokens: 800,
        });
        
        aiInsights = aiResponse.content;
      } catch (e) {
        console.warn('AI insights failed:', e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      snapshotId: snapshot?.id,
      metrics,
      communityCount: new Set(communities.values()).size,
      changes,
      leaders,
      aiInsights,
      analyzedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Community evolution error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simple label propagation for community detection
function detectCommunities(
  nodes: string[],
  edges: Array<{ source: string; target: string; weight: number }>
): Map<string, number> {
  const labels = new Map<string, number>();
  
  // Initialize each node with its own label
  nodes.forEach((node, i) => labels.set(node, i));
  
  // Build adjacency list
  const adj = new Map<string, Array<{ neighbor: string; weight: number }>>();
  nodes.forEach(n => adj.set(n, []));
  edges.forEach(e => {
    adj.get(e.source)?.push({ neighbor: e.target, weight: e.weight });
    adj.get(e.target)?.push({ neighbor: e.source, weight: e.weight });
  });
  
  // Iterate until convergence
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    
    // Shuffle nodes for randomness
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);
    
    for (const node of shuffled) {
      const neighbors = adj.get(node) || [];
      if (neighbors.length === 0) continue;
      
      // Count weighted votes for each label
      const votes = new Map<number, number>();
      for (const { neighbor, weight } of neighbors) {
        const label = labels.get(neighbor)!;
        votes.set(label, (votes.get(label) || 0) + weight);
      }
      
      // Find max vote
      let maxLabel = labels.get(node)!;
      let maxVotes = 0;
      for (const [label, count] of votes.entries()) {
        if (count > maxVotes) {
          maxVotes = count;
          maxLabel = label;
        }
      }
      
      if (labels.get(node) !== maxLabel) {
        labels.set(node, maxLabel);
        changed = true;
      }
    }
    
    if (!changed) break;
  }
  
  // Renumber communities to be sequential
  const uniqueLabels = new Set(labels.values());
  const labelMap = new Map<number, number>();
  let idx = 0;
  for (const label of uniqueLabels) {
    labelMap.set(label, idx++);
  }
  
  const result = new Map<string, number>();
  for (const [node, label] of labels.entries()) {
    result.set(node, labelMap.get(label)!);
  }
  
  return result;
}

function calculateNetworkMetrics(
  nodes: any[],
  edges: any[],
  communities: Map<string, number>
): Record<string, any> {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;
  const communityCount = new Set(communities.values()).size;
  const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;
  
  return {
    node_count: nodeCount,
    edge_count: edgeCount,
    avg_degree: Math.round(avgDegree * 100) / 100,
    community_count: communityCount,
    density: Math.round(density * 1000) / 1000,
    modularity: communityCount > 1 ? Math.round((1 - 1/communityCount) * 100) / 100 : 0,
  };
}

function groupByValue(map: Map<string, number>): Map<number, string[]> {
  const result = new Map<number, string[]>();
  for (const [key, value] of map.entries()) {
    if (!result.has(value)) {
      result.set(value, []);
    }
    result.get(value)!.push(key);
  }
  return result;
}

function findBestMatch(
  members: string[],
  previousCommunities: Map<number, string[]>
): { id: number; size: number } | null {
  let bestMatch: { id: number; size: number; overlap: number } | null = null;
  
  for (const [communityId, prevMembers] of previousCommunities.entries()) {
    const overlap = members.filter(m => prevMembers.includes(m)).length;
    const overlapRatio = overlap / Math.max(members.length, prevMembers.length);
    
    if (overlapRatio > 0.5 && (!bestMatch || overlap > bestMatch.overlap)) {
      bestMatch = { id: communityId, size: prevMembers.length, overlap };
    }
  }
  
  return bestMatch ? { id: bestMatch.id, size: bestMatch.size } : null;
}
