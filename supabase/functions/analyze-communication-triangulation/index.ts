import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommunicationNode {
  id: string;
  name: string;
  totalMessages: number;
  inDegree: number;
  outDegree: number;
  betweennessCentrality: number;
  isBroker: boolean;
}

interface CommunicationEdge {
  source: string;
  target: string;
  weight: number;
  channels: string[];
  lastActivity: string;
}

interface InformationFlow {
  from: string;
  to: string;
  through: string[];
  flowStrength: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const { data: claimsData, error: authError } = await (authClient.auth as any).getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('user_id', userId);

    // Fetch communications
    const { data: communications } = await supabase
      .from('communications')
      .select('profile_id, channel, direction, occurred_at')
      .eq('user_id', userId);

    // Fetch conversations with messages
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, profile_id')
      .eq('user_id', userId);

    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, is_from_contact, sent_at, source')
      .eq('user_id', userId);

    // Fetch explicit relationships
    const { data: relationships } = await supabase
      .from('contact_relationships')
      .select('from_profile_id, to_profile_id, relationship_type')
      .eq('user_id', userId);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const conversationToProfile = new Map(conversations?.map(c => [c.id, c.profile_id]) || []);

    // Build communication matrix between contacts
    const commMatrix = new Map<string, Map<string, { count: number; channels: Set<string>; lastActivity: string }>>();
    
    // Initialize all profiles in matrix
    profiles?.forEach(p => {
      commMatrix.set(p.id, new Map());
    });

    // Track user's communications as the central node
    const userNode = 'user';
    commMatrix.set(userNode, new Map());

    // Process direct communications (user <-> contact)
    communications?.forEach(comm => {
      const profileId = comm.profile_id;
      const isOutgoing = comm.direction === 'outgoing';
      
      const from = isOutgoing ? userNode : profileId;
      const to = isOutgoing ? profileId : userNode;
      
      if (!commMatrix.has(from)) commMatrix.set(from, new Map());
      const existing = commMatrix.get(from)!.get(to) || { count: 0, channels: new Set(), lastActivity: '' };
      existing.count++;
      existing.channels.add(comm.channel);
      if (!existing.lastActivity || comm.occurred_at > existing.lastActivity) {
        existing.lastActivity = comm.occurred_at;
      }
      commMatrix.get(from)!.set(to, existing);
    });

    // Process messages
    messages?.forEach(msg => {
      const profileId = conversationToProfile.get(msg.conversation_id);
      if (!profileId) return;
      
      const from = msg.is_from_contact ? profileId : userNode;
      const to = msg.is_from_contact ? userNode : profileId;
      
      if (!commMatrix.has(from)) commMatrix.set(from, new Map());
      const existing = commMatrix.get(from)!.get(to) || { count: 0, channels: new Set(), lastActivity: '' };
      existing.count++;
      existing.channels.add(msg.source || 'chat');
      if (!existing.lastActivity || msg.sent_at > existing.lastActivity) {
        existing.lastActivity = msg.sent_at;
      }
      commMatrix.get(from)!.set(to, existing);
    });

    // Infer connections between contacts via shared organizations, events, etc.
    relationships?.forEach(rel => {
      if (!rel.from_profile_id || !rel.to_profile_id) return;
      if (!commMatrix.has(rel.from_profile_id)) commMatrix.set(rel.from_profile_id, new Map());
      const existing = commMatrix.get(rel.from_profile_id)!.get(rel.to_profile_id) || { 
        count: 0, channels: new Set(), lastActivity: '' 
      };
      existing.count += 5; // Weight for explicit relationship
      existing.channels.add('relationship');
      commMatrix.get(rel.from_profile_id)!.set(rel.to_profile_id, existing);
    });

    // Calculate centrality metrics
    const nodes: CommunicationNode[] = [];
    const edges: CommunicationEdge[] = [];
    
    // Build adjacency for betweenness calculation
    const allNodeIds = Array.from(commMatrix.keys());
    const adjacency = new Map<string, Set<string>>();
    
    commMatrix.forEach((targets, source) => {
      if (!adjacency.has(source)) adjacency.set(source, new Set());
      targets.forEach((_, target) => {
        adjacency.get(source)!.add(target);
        if (!adjacency.has(target)) adjacency.set(target, new Set());
        adjacency.get(target)!.add(source);
        
        // Create edge
        const edgeKey = [source, target].sort().join('::');
        if (!edges.find(e => [e.source, e.target].sort().join('::') === edgeKey)) {
          const reverseData = commMatrix.get(target)?.get(source);
          edges.push({
            source,
            target,
            weight: _.count + (reverseData?.count || 0),
            channels: [..._.channels, ...(reverseData?.channels || [])],
            lastActivity: _.lastActivity > (reverseData?.lastActivity || '') ? _.lastActivity : reverseData?.lastActivity || _.lastActivity,
          });
        }
      });
    });

    // Simple betweenness centrality approximation
    const betweenness = new Map<string, number>();
    allNodeIds.forEach(n => betweenness.set(n, 0));
    
    // Sample shortest paths
    const sampleSize = Math.min(allNodeIds.length, 20);
    for (let i = 0; i < sampleSize; i++) {
      const start = allNodeIds[Math.floor(Math.random() * allNodeIds.length)];
      
      // BFS from start
      const visited = new Set<string>();
      const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
      const paths = new Map<string, string[][]>();
      
      while (queue.length > 0) {
        const { node, path } = queue.shift()!;
        if (visited.has(node)) continue;
        visited.add(node);
        
        adjacency.get(node)?.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            const newPath = [...path, neighbor];
            queue.push({ node: neighbor, path: newPath });
            
            if (!paths.has(neighbor)) paths.set(neighbor, []);
            paths.get(neighbor)!.push(newPath);
          }
        });
      }
      
      // Count intermediaries
      paths.forEach((nodePaths) => {
        nodePaths.forEach(path => {
          path.slice(1, -1).forEach(intermediate => {
            betweenness.set(intermediate, (betweenness.get(intermediate) || 0) + 1);
          });
        });
      });
    }

    // Normalize betweenness
    const maxBetweenness = Math.max(...betweenness.values(), 1);
    
    // Build nodes with metrics
    allNodeIds.forEach(nodeId => {
      if (nodeId === userNode) return; // Skip user node from results
      
      const profile = profileMap.get(nodeId);
      if (!profile) return;
      
      const outgoing = commMatrix.get(nodeId);
      let outDegree = 0;
      let totalMessages = 0;
      
      outgoing?.forEach(v => {
        outDegree++;
        totalMessages += v.count;
      });
      
      let inDegree = 0;
      commMatrix.forEach((targets) => {
        if (targets.has(nodeId)) {
          inDegree++;
          totalMessages += targets.get(nodeId)!.count;
        }
      });
      
      const normalizedBetweenness = (betweenness.get(nodeId) || 0) / maxBetweenness * 100;
      const isBroker = normalizedBetweenness > 50 || (inDegree >= 3 && outDegree >= 3);
      
      nodes.push({
        id: nodeId,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        totalMessages,
        inDegree,
        outDegree,
        betweennessCentrality: normalizedBetweenness,
        isBroker,
      });
    });

    // Identify information flows (paths between contacts through brokers)
    const brokers = nodes.filter(n => n.isBroker);
    const informationFlows: InformationFlow[] = [];
    
    brokers.forEach(broker => {
      const connected = Array.from(adjacency.get(broker.id) || []).filter(id => id !== userNode);
      
      for (let i = 0; i < connected.length; i++) {
        for (let j = i + 1; j < connected.length; j++) {
          const fromProfile = profileMap.get(connected[i]);
          const toProfile = profileMap.get(connected[j]);
          if (!fromProfile || !toProfile) continue;
          
          // Check if direct connection exists
          const directConnection = adjacency.get(connected[i])?.has(connected[j]);
          if (!directConnection) {
            informationFlows.push({
              from: connected[i],
              to: connected[j],
              through: [broker.id],
              flowStrength: (nodes.find(n => n.id === connected[i])?.totalMessages || 0) +
                           (nodes.find(n => n.id === connected[j])?.totalMessages || 0),
            });
          }
        }
      }
    });

    // Sort by importance
    nodes.sort((a, b) => b.betweennessCentrality - a.betweennessCentrality);
    
    // Filter edges to only include those between contacts (not user)
    const contactEdges = edges.filter(e => e.source !== userNode && e.target !== userNode);

    console.log(`Communication triangulation: ${nodes.length} nodes, ${contactEdges.length} edges, ${brokers.length} brokers`);

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        nodes,
        edges: contactEdges,
        brokers: brokers.slice(0, 10),
        informationFlows: informationFlows.slice(0, 20),
        metrics: {
          totalNodes: nodes.length,
          totalEdges: contactEdges.length,
          avgDegree: nodes.length > 0 ? nodes.reduce((s, n) => s + n.inDegree + n.outDegree, 0) / nodes.length / 2 : 0,
          networkDensity: nodes.length > 1 ? contactEdges.length / (nodes.length * (nodes.length - 1) / 2) : 0,
        },
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Communication triangulation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
