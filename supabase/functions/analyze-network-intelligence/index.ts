import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all profiles with relationships
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, organization, relationship_type, is_favorite')
      .eq('user_id', user.id);

    // Fetch explicit relationships
    const { data: relationships } = await supabase
      .from('contact_relationships')
      .select('profile_id, related_profile_id, relationship_type')
      .eq('user_id', user.id);

    // Fetch shared interests
    const { data: interests } = await supabase
      .from('contact_interests')
      .select('profile_id, name')
      .eq('user_id', user.id);

    // Fetch shared organizations
    const { data: education } = await supabase
      .from('education')
      .select('profile_id, institution_name, company')
      .eq('user_id', user.id);

    // Fetch shared events
    const { data: events } = await supabase
      .from('events')
      .select('id, profile_id, title')
      .eq('user_id', user.id);

    // Fetch communication patterns
    const { data: communications } = await supabase
      .from('communications')
      .select('profile_id, channel, occurred_at')
      .eq('user_id', user.id);

    // Build connection intelligence
    const connectionMap = new Map<string, any>();
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Helper to create connection key
    const getConnKey = (a: string, b: string) => [a, b].sort().join('::');

    // Process explicit relationships
    relationships?.forEach(rel => {
      if (!rel.related_profile_id) return;
      const key = getConnKey(rel.profile_id, rel.related_profile_id);
      const existing = connectionMap.get(key) || {
        profile_a_id: rel.profile_id,
        profile_b_id: rel.related_profile_id,
        evidence: [],
        strength: 0,
        mutual_contacts: [],
        shared_organizations: [],
      };
      existing.evidence.push({ type: 'explicit_relationship', relationship_type: rel.relationship_type });
      existing.strength += 30;
      connectionMap.set(key, existing);
    });

    // Process shared interests
    const interestGroups = new Map<string, string[]>();
    interests?.forEach(i => {
      const key = i.name.toLowerCase();
      const existing = interestGroups.get(key) || [];
      existing.push(i.profile_id);
      interestGroups.set(key, existing);
    });

    interestGroups.forEach((profileIds, interest) => {
      if (profileIds.length > 1) {
        for (let i = 0; i < profileIds.length; i++) {
          for (let j = i + 1; j < profileIds.length; j++) {
            const key = getConnKey(profileIds[i], profileIds[j]);
            const existing = connectionMap.get(key) || {
              profile_a_id: profileIds[i],
              profile_b_id: profileIds[j],
              evidence: [],
              strength: 0,
              mutual_contacts: [],
              shared_organizations: [],
            };
            existing.evidence.push({ type: 'shared_interest', interest });
            existing.strength += 10;
            connectionMap.set(key, existing);
          }
        }
      }
    });

    // Process shared organizations/education
    const orgGroups = new Map<string, string[]>();
    education?.forEach(e => {
      const org = e.institution_name || e.company;
      if (org) {
        const key = org.toLowerCase();
        const existing = orgGroups.get(key) || [];
        existing.push(e.profile_id);
        orgGroups.set(key, existing);
      }
    });

    profiles?.forEach(p => {
      if (p.organization) {
        const key = p.organization.toLowerCase();
        const existing = orgGroups.get(key) || [];
        existing.push(p.id);
        orgGroups.set(key, existing);
      }
    });

    orgGroups.forEach((profileIds, org) => {
      const unique = [...new Set(profileIds)];
      if (unique.length > 1) {
        for (let i = 0; i < unique.length; i++) {
          for (let j = i + 1; j < unique.length; j++) {
            const key = getConnKey(unique[i], unique[j]);
            const existing = connectionMap.get(key) || {
              profile_a_id: unique[i],
              profile_b_id: unique[j],
              evidence: [],
              strength: 0,
              mutual_contacts: [],
              shared_organizations: [],
            };
            if (!existing.shared_organizations.includes(org)) {
              existing.shared_organizations.push(org);
            }
            existing.evidence.push({ type: 'shared_organization', organization: org });
            existing.strength += 20;
            connectionMap.set(key, existing);
          }
        }
      }
    });

    // Calculate degrees of separation (BFS)
    const adjacencyList = new Map<string, Set<string>>();
    connectionMap.forEach((conn) => {
      if (!adjacencyList.has(conn.profile_a_id)) adjacencyList.set(conn.profile_a_id, new Set());
      if (!adjacencyList.has(conn.profile_b_id)) adjacencyList.set(conn.profile_b_id, new Set());
      adjacencyList.get(conn.profile_a_id)!.add(conn.profile_b_id);
      adjacencyList.get(conn.profile_b_id)!.add(conn.profile_a_id);
    });

    // Calculate influence scores
    const influenceScores = new Map<string, number>();
    profiles?.forEach(p => {
      const connections = adjacencyList.get(p.id)?.size || 0;
      const commCount = communications?.filter(c => c.profile_id === p.id).length || 0;
      const eventCount = events?.filter(e => e.profile_id === p.id).length || 0;
      const favoriteBonus = p.is_favorite ? 20 : 0;
      
      influenceScores.set(p.id, Math.min(100, 
        (connections * 5) + (commCount * 2) + (eventCount * 10) + favoriteBonus
      ));
    });

    // Identify clusters using simple community detection
    const clusters: { id: string; members: string[]; type: string }[] = [];
    const visited = new Set<string>();

    profiles?.forEach(p => {
      if (visited.has(p.id)) return;
      
      // BFS to find connected component
      const cluster: string[] = [];
      const queue = [p.id];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        cluster.push(current);
        
        adjacencyList.get(current)?.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        });
      }
      
      if (cluster.length > 1) {
        // Determine cluster type based on majority relationship type
        const types = cluster.map(id => profileMap.get(id)?.relationship_type || 'other');
        const typeCount = types.reduce((acc, t) => {
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const dominantType = Object.entries(typeCount).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'mixed';
        
        clusters.push({
          id: crypto.randomUUID(),
          members: cluster,
          type: dominantType,
        });
      }
    });

    // Store connection intelligence
    const connections = Array.from(connectionMap.values()).map(conn => ({
      user_id: user.id,
      profile_a_id: conn.profile_a_id,
      profile_b_id: conn.profile_b_id,
      connection_type: conn.evidence[0]?.type || 'inferred',
      connection_strength: Math.min(100, conn.strength),
      evidence: conn.evidence,
      mutual_contacts: conn.mutual_contacts,
      shared_organizations: conn.shared_organizations,
      confidence_score: Math.min(100, conn.evidence.length * 20),
      last_analyzed_at: new Date().toISOString(),
    }));

    // Upsert connections
    if (connections.length > 0) {
      for (const conn of connections) {
        await supabase
          .from('connection_intelligence')
          .upsert(conn, { onConflict: 'user_id,profile_a_id,profile_b_id' });
      }
    }

    // Prepare influence rankings
    const influenceRankings = Array.from(influenceScores.entries())
      .map(([id, score]) => ({
        profile_id: id,
        profile: profileMap.get(id),
        influence_score: score,
        connection_count: adjacencyList.get(id)?.size || 0,
      }))
      .sort((a, b) => b.influence_score - a.influence_score);

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        total_profiles: profiles?.length || 0,
        total_connections: connections.length,
        clusters: clusters.map(c => ({
          ...c,
          size: c.members.length,
          members: c.members.map(id => profileMap.get(id)),
        })),
        influence_rankings: influenceRankings.slice(0, 20),
        network_density: profiles?.length ? (connections.length * 2) / (profiles.length * (profiles.length - 1)) : 0,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Network analysis error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
