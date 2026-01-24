import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShadowNetworkRequest {
  action: 'analyze' | 'detect_cutouts' | 'find_gaps' | 'homophily_violations';
  profileIds?: string[];
}

interface NetworkGap {
  expectedConnection: { from: string; to: string; fromName: string; toName: string };
  gapType: string;
  confidence: number;
  explanation: string;
}

interface ShadowEntity {
  id: string;
  type: 'cutout' | 'hidden_actor' | 'intermediary' | 'ghost';
  visibility: number;
  connections: string[];
  inference: string;
  confidence: number;
}

interface HomophilyViolation {
  nodeA: string;
  nodeB: string;
  violationType: string;
  expectedSimilarity: number;
  actualSimilarity: number;
  significance: number;
}

// Detect communication gaps - who should be connected but isn't
function detectCommunicationGaps(
  profiles: any[],
  relationships: any[],
  interactions: any[]
): NetworkGap[] {
  const gaps: NetworkGap[] = [];
  const connectionMap = new Map<string, Set<string>>();

  // Build connection map
  for (const rel of relationships) {
    if (!connectionMap.has(rel.source_profile_id)) {
      connectionMap.set(rel.source_profile_id, new Set());
    }
    if (!connectionMap.has(rel.target_profile_id)) {
      connectionMap.set(rel.target_profile_id, new Set());
    }
    connectionMap.get(rel.source_profile_id)!.add(rel.target_profile_id);
    connectionMap.get(rel.target_profile_id)!.add(rel.source_profile_id);
  }

  // Check for structural holes
  for (const profileA of profiles) {
    for (const profileB of profiles) {
      if (profileA.id >= profileB.id) continue;

      const aConnections = connectionMap.get(profileA.id) || new Set();
      const bConnections = connectionMap.get(profileB.id) || new Set();
      const areConnected = aConnections.has(profileB.id);

      if (areConnected) continue;

      // Check for common attributes suggesting they should be connected
      let expectedConnectionScore = 0;
      const reasons: string[] = [];

      // Same organization
      if (profileA.organization && profileA.organization === profileB.organization) {
        expectedConnectionScore += 40;
        reasons.push('same_organization');
      }

      // Shared interests
      const sharedInterests = (profileA.interests || []).filter((i: string) => 
        (profileB.interests || []).includes(i)
      );
      if (sharedInterests.length > 0) {
        expectedConnectionScore += sharedInterests.length * 10;
        reasons.push(`shared_interests:${sharedInterests.join(',')}`);
      }

      // Common connections (triadic closure)
      const commonConnections = [...aConnections].filter(c => bConnections.has(c));
      if (commonConnections.length >= 2) {
        expectedConnectionScore += commonConnections.length * 15;
        reasons.push(`triadic_closure:${commonConnections.length}_mutual`);
      }

      // Similar roles
      if (profileA.job_title && profileB.job_title) {
        const aWords = profileA.job_title.toLowerCase().split(/\s+/);
        const bWords = profileB.job_title.toLowerCase().split(/\s+/);
        const sharedWords = aWords.filter((w: string) => bWords.includes(w));
        if (sharedWords.length > 0) {
          expectedConnectionScore += 15;
          reasons.push('similar_roles');
        }
      }

      if (expectedConnectionScore >= 40) {
        gaps.push({
          expectedConnection: {
            from: profileA.id,
            to: profileB.id,
            fromName: profileA.first_name ? `${profileA.first_name} ${profileA.last_name || ''}`.trim() : 'Unknown',
            toName: profileB.first_name ? `${profileB.first_name} ${profileB.last_name || ''}`.trim() : 'Unknown'
          },
          gapType: reasons.join(', '),
          confidence: Math.min(100, expectedConnectionScore),
          explanation: `Expected connection based on: ${reasons.join(', ')}. ${commonConnections.length} mutual connections.`
        });
      }
    }
  }

  return gaps.sort((a, b) => b.confidence - a.confidence).slice(0, 20);
}

// Detect potential cutouts/intermediaries
function detectCutouts(
  profiles: any[],
  relationships: any[],
  interactions: any[]
): ShadowEntity[] {
  const entities: ShadowEntity[] = [];
  const connectionCount = new Map<string, number>();
  const interactionPatterns = new Map<string, any[]>();

  // Count connections
  for (const rel of relationships) {
    connectionCount.set(rel.source_profile_id, (connectionCount.get(rel.source_profile_id) || 0) + 1);
    connectionCount.set(rel.target_profile_id, (connectionCount.get(rel.target_profile_id) || 0) + 1);
  }

  // Analyze interaction patterns
  for (const interaction of interactions) {
    if (!interactionPatterns.has(interaction.profile_id)) {
      interactionPatterns.set(interaction.profile_id, []);
    }
    interactionPatterns.get(interaction.profile_id)!.push(interaction);
  }

  // Identify cutout patterns
  for (const profile of profiles) {
    const connections = connectionCount.get(profile.id) || 0;
    const interactionList = interactionPatterns.get(profile.id) || [];
    
    // Pattern 1: High betweenness but low personal profile
    if (connections >= 5) {
      // Check if this person connects otherwise disconnected groups
      const connectedProfiles = relationships
        .filter(r => r.source_profile_id === profile.id || r.target_profile_id === profile.id)
        .map(r => r.source_profile_id === profile.id ? r.target_profile_id : r.source_profile_id);

      // Check for bridge patterns
      let isBridge = false;
      for (let i = 0; i < connectedProfiles.length; i++) {
        for (let j = i + 1; j < connectedProfiles.length; j++) {
          const directConnection = relationships.find(r =>
            (r.source_profile_id === connectedProfiles[i] && r.target_profile_id === connectedProfiles[j]) ||
            (r.source_profile_id === connectedProfiles[j] && r.target_profile_id === connectedProfiles[i])
          );
          if (!directConnection) {
            isBridge = true;
            break;
          }
        }
        if (isBridge) break;
      }

      if (isBridge && (!profile.job_title || !profile.organization)) {
        entities.push({
          id: profile.id,
          type: 'intermediary',
          visibility: 30,
          connections: connectedProfiles,
          inference: 'High betweenness centrality with sparse personal details',
          confidence: 65
        });
      }
    }

    // Pattern 2: Irregular communication patterns
    if (interactionList.length > 0) {
      const dates = interactionList.map(i => new Date(i.interaction_date).getTime());
      dates.sort((a, b) => a - b);
      
      // Check for burst patterns
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push(dates[i] - dates[i - 1]);
      }
      
      if (intervals.length > 2) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.map(i => Math.pow(i - avgInterval, 2)).reduce((a, b) => a + b, 0) / intervals.length;
        const cv = Math.sqrt(variance) / avgInterval;
        
        if (cv > 1.5) { // High coefficient of variation = irregular
          entities.push({
            id: profile.id,
            type: 'hidden_actor',
            visibility: 40,
            connections: [],
            inference: 'Irregular communication pattern suggests coordinated timing',
            confidence: 55
          });
        }
      }
    }

    // Pattern 3: Ghost presence - minimal profile data but high connectivity
    // Note: email/phone are in contact_methods table, not profiles - check for sparse profile data instead
    if (!profile.job_title && !profile.organization && !profile.notes && connections >= 3) {
      entities.push({
        id: profile.id,
        type: 'ghost',
        visibility: 20,
        connections: [],
        inference: 'Multiple connections but no contact information',
        confidence: 70
      });
    }
  }

  return entities.sort((a, b) => b.confidence - a.confidence);
}

// Detect homophily violations - unexpected connections
function detectHomophilyViolations(
  profiles: any[],
  relationships: any[]
): HomophilyViolation[] {
  const violations: HomophilyViolation[] = [];
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  for (const rel of relationships) {
    const profileA = profileMap.get(rel.source_profile_id);
    const profileB = profileMap.get(rel.target_profile_id);
    
    if (!profileA || !profileB) continue;

    let expectedSimilarity = 0;
    let actualSimilarity = 0;
    const violationReasons: string[] = [];

    // Calculate expected similarity based on attributes
    // Same industry/sector (use organization)
    if (profileA.organization && profileB.organization) {
      expectedSimilarity += 30;
      if (profileA.organization === profileB.organization) {
        actualSimilarity += 30;
      }
    }

    // Similar locations - use city/country
    const locA = [profileA.city, profileA.country].filter(Boolean).join(', ');
    const locB = [profileB.city, profileB.country].filter(Boolean).join(', ');
    if (locA && locB) {
      expectedSimilarity += 20;
      if (locA === locB) {
        actualSimilarity += 20;
      }
    }

    // Age/generation similarity (if available)
    if (profileA.birthdate && profileB.birthdate) {
      expectedSimilarity += 15;
      const ageDiff = Math.abs(
        new Date(profileA.birthdate).getFullYear() - new Date(profileB.birthdate).getFullYear()
      );
      if (ageDiff <= 10) actualSimilarity += 15;
    }

    // Shared interests - interests are in contact_interests table, not profiles
    // Skipping interest-based similarity for now as it requires a separate fetch
    // If needed, contact_interests can be loaded and mapped by profile_id

    // Strong connection with low similarity = violation
    const relStrength = rel.strength || 50;
    if (relStrength >= 60 && actualSimilarity < expectedSimilarity * 0.4) {
      violationReasons.push('strong_connection_low_similarity');
    }

    // Opposite sectors connecting
    if (profileA.priority_level !== profileB.priority_level) {
      if ((profileA.priority_level === 'high' && profileB.priority_level === 'low') ||
          (profileA.priority_level === 'low' && profileB.priority_level === 'high')) {
        violationReasons.push('priority_mismatch');
      }
    }

    if (violationReasons.length > 0) {
      const nodeAName = profileA.first_name ? `${profileA.first_name} ${profileA.last_name || ''}`.trim() : profileA.id;
      const nodeBName = profileB.first_name ? `${profileB.first_name} ${profileB.last_name || ''}`.trim() : profileB.id;
      violations.push({
        nodeA: nodeAName,
        nodeB: nodeBName,
        violationType: violationReasons.join(', '),
        expectedSimilarity,
        actualSimilarity,
        significance: Math.round((expectedSimilarity - actualSimilarity) / expectedSimilarity * 100)
      });
    }
  }

  return violations.sort((a, b) => b.significance - a.significance).slice(0, 20);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'shadow-network-analyzer', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, profileIds } = await req.json() as ShadowNetworkRequest;

    console.log(`[Shadow Network] Action: ${action}`);

    // Get network data
    let profileQuery = supabase.from('profiles').select('*').eq('user_id', user.id);
    if (profileIds && profileIds.length > 0) {
      profileQuery = profileQuery.in('id', profileIds);
    }
    const { data: profiles } = await profileQuery.limit(200);

    const { data: relationships } = await supabase
      .from('contact_relationships')
      .select('*')
      .eq('user_id', user.id)
      .limit(1000);

    const { data: interactions } = await supabase
      .from('contact_interaction_notes')
      .select('id, profile_id, interaction_type, interaction_date, note_text, mood_observed, topics_discussed')
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false })
      .limit(500);

    let result: any = {
      profilesAnalyzed: profiles?.length || 0,
      relationshipsAnalyzed: relationships?.length || 0,
      interactionsAnalyzed: interactions?.length || 0
    };

    if (action === 'analyze' || action === 'find_gaps') {
      const gaps = detectCommunicationGaps(profiles || [], relationships || [], interactions || []);
      result.communicationGaps = gaps;
      result.gapCount = gaps.length;
    }

    if (action === 'analyze' || action === 'detect_cutouts') {
      const shadowEntities = detectCutouts(profiles || [], relationships || [], interactions || []);
      result.shadowEntities = shadowEntities;
      result.shadowEntityCount = shadowEntities.length;

      // Store detected entities
      if (shadowEntities.length > 0) {
        const inserts = shadowEntities.map(e => ({
          user_id: user.id,
          entity_type: e.type,
          entity_label: (() => { const p = profiles?.find(pr => pr.id === e.id); return p?.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : 'Unknown'; })(),
          visibility_score: e.visibility,
          connection_anomalies: e.connections,
          inference_confidence: e.confidence / 100,
          detection_method: 'automated_analysis',
          related_profile_ids: [e.id]
        }));

        await supabase.from('shadow_network_entities').upsert(inserts);
      }
    }

    if (action === 'analyze' || action === 'homophily_violations') {
      const violations = detectHomophilyViolations(profiles || [], relationships || []);
      result.homophilyViolations = violations;
      result.violationCount = violations.length;
    }

    // Summary statistics
    if (action === 'analyze') {
      result.summary = {
        networkHealth: calculateNetworkHealth(result),
        riskIndicators: identifyRiskIndicators(result),
        recommendations: generateRecommendations(result)
      };
    }

    // Store in ai_analyses for section availability detection
    if (profiles && profiles.length > 0) {
      const primaryProfileId = profileIds?.[0] || profiles[0]?.id;
      if (primaryProfileId) {
        await supabase.from('ai_analyses').upsert({
          user_id: user.id,
          profile_id: primaryProfileId,
          analysis_type: 'shadow_network_analysis',
          result: result,
          generated_at: new Date().toISOString()
        }, { onConflict: 'profile_id,analysis_type' });
      }
    }

    console.log(`[Shadow Network] Complete. ${result.shadowEntityCount || 0} shadow entities, ${result.gapCount || 0} gaps`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Shadow Network] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function calculateNetworkHealth(result: any): number {
  let health = 100;
  
  // Deduct for gaps
  health -= Math.min(30, (result.gapCount || 0) * 2);
  
  // Deduct for shadow entities
  health -= Math.min(30, (result.shadowEntityCount || 0) * 5);
  
  // Deduct for violations
  health -= Math.min(20, (result.violationCount || 0) * 3);
  
  return Math.max(0, health);
}

function identifyRiskIndicators(result: any): string[] {
  const risks: string[] = [];
  
  if ((result.shadowEntities || []).some((e: any) => e.type === 'cutout')) {
    risks.push('Potential cutout intermediaries detected');
  }
  if ((result.shadowEntities || []).some((e: any) => e.type === 'ghost')) {
    risks.push('Ghost profiles with minimal data but high connectivity');
  }
  if ((result.communicationGaps || []).length > 10) {
    risks.push('Significant structural holes in network');
  }
  if ((result.homophilyViolations || []).length > 5) {
    risks.push('Multiple unexpected connection patterns');
  }
  
  return risks;
}

function generateRecommendations(result: any): string[] {
  const recs: string[] = [];
  
  if ((result.communicationGaps || []).length > 0) {
    recs.push('Consider facilitating introductions between disconnected clusters');
  }
  if ((result.shadowEntities || []).length > 0) {
    recs.push('Investigate shadow entities for potential security concerns');
  }
  if ((result.homophilyViolations || []).length > 0) {
    recs.push('Review unexpected connections for strategic opportunities or risks');
  }
  
  return recs;
}
