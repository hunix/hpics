import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Pattern {
  type: 'shared_employer' | 'event_overlap' | 'mutual_connection' | 'geographic_cluster' | 'same_industry';
  profiles: string[];
  profileNames: string[];
  evidence: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const patterns: Pattern[] = [];

    // 1. Find shared employers (active contacts only)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, organization')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('organization', 'is', null);

    if (profiles) {
      const orgMap = new Map<string, { id: string; name: string }[]>();
      for (const p of profiles) {
        const org = p.organization?.toLowerCase().trim();
        if (!org) continue;
        if (!orgMap.has(org)) orgMap.set(org, []);
        orgMap.get(org)!.push({ 
          id: p.id, 
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() 
        });
      }

      for (const [org, members] of orgMap.entries()) {
        if (members.length >= 2) {
          patterns.push({
            type: 'shared_employer',
            profiles: members.map(m => m.id),
            profileNames: members.map(m => m.name),
            evidence: `All work at ${org}`,
            confidence: 0.95
          });
        }
      }
    }

    // 2. Find event overlaps (people who attended same events)
    const { data: eventAttendees } = await supabase
      .from('events')
      .select('id, title, profile_id')
      .eq('user_id', user.id)
      .not('profile_id', 'is', null);

    if (eventAttendees) {
      // Group by event title to find similar events
      const eventMap = new Map<string, string[]>();
      for (const e of eventAttendees) {
        const key = e.title?.toLowerCase().trim() || '';
        if (!key || !e.profile_id) continue;
        if (!eventMap.has(key)) eventMap.set(key, []);
        if (!eventMap.get(key)!.includes(e.profile_id)) {
          eventMap.get(key)!.push(e.profile_id);
        }
      }

      for (const [event, profileIds] of eventMap.entries()) {
        if (profileIds.length >= 2) {
          // Get names
          const { data: eventProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', profileIds);

          if (eventProfiles) {
            patterns.push({
              type: 'event_overlap',
              profiles: profileIds,
              profileNames: eventProfiles.map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim()),
              evidence: `Attended: ${event}`,
              confidence: 0.8
            });
          }
        }
      }
    }

    // 3. Find geographic clusters (same city/region)
    const { data: locations } = await supabase
      .from('contact_addresses')
      .select('profile_id, city, state, country')
      .not('city', 'is', null);

    if (locations) {
      const cityMap = new Map<string, string[]>();
      for (const loc of locations) {
        const key = `${loc.city?.toLowerCase()}, ${loc.state?.toLowerCase() || loc.country?.toLowerCase() || ''}`.trim();
        if (!key || !loc.profile_id) continue;
        if (!cityMap.has(key)) cityMap.set(key, []);
        if (!cityMap.get(key)!.includes(loc.profile_id)) {
          cityMap.get(key)!.push(loc.profile_id);
        }
      }

      for (const [city, profileIds] of cityMap.entries()) {
        if (profileIds.length >= 3) {
          const { data: cityProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', profileIds);

          if (cityProfiles) {
            patterns.push({
              type: 'geographic_cluster',
              profiles: profileIds,
              profileNames: cityProfiles.map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim()),
              evidence: `Located in ${city}`,
              confidence: 0.7
            });
          }
        }
      }
    }

    // 4. Check for existing inferred connections (mutual connections)
    const { data: inferences } = await supabase
      .from('relationship_inferences')
      .select('profile_a_id, profile_b_id, inferred_relationship, confidence_score')
      .eq('user_id', user.id)
      .gte('confidence_score', 0.7);

    if (inferences && inferences.length > 0) {
      // Find triangles (A-B, B-C, A-C connections)
      const connections = new Map<string, Set<string>>();
      for (const inf of inferences) {
        if (!connections.has(inf.profile_a_id)) connections.set(inf.profile_a_id, new Set());
        if (!connections.has(inf.profile_b_id)) connections.set(inf.profile_b_id, new Set());
        connections.get(inf.profile_a_id)!.add(inf.profile_b_id);
        connections.get(inf.profile_b_id)!.add(inf.profile_a_id);
      }

      // Find profiles with 3+ mutual connections
      for (const [profileId, connected] of connections.entries()) {
        if (connected.size >= 3) {
          const profileIds = [profileId, ...Array.from(connected).slice(0, 4)];
          const { data: mutualProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', profileIds);

          if (mutualProfiles) {
            patterns.push({
              type: 'mutual_connection',
              profiles: profileIds,
              profileNames: mutualProfiles.map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim()),
              evidence: `Highly connected cluster`,
              confidence: 0.85
            });
          }
        }
      }
    }

    // Store patterns for future reference
    for (const pattern of patterns.slice(0, 50)) {
      await supabase.from('cross_references').upsert({
        user_id: user.id,
        reference_type: pattern.type,
        source_value: pattern.evidence,
        matched_profile_ids: pattern.profiles,
        confidence_score: pattern.confidence,
        discovered_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,reference_type,source_value'
      });
    }

    return new Response(JSON.stringify({ 
      patterns,
      total: patterns.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
