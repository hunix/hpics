import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PowerNetworkRequest {
  userId: string;
  targetProfileId?: string;
  analysisType?: 'full_network' | 'target_focused' | 'opportunity_scan';
}

const POWER_NETWORK_PROMPT = `You are an elite network power analyst specializing in identifying influence structures, power hierarchies, and strategic opportunities within relationship networks.

Analyze the network data to identify:

1. POWER STRUCTURE ANALYSIS:
   - Identify formal and informal power holders
   - Map reporting relationships and influence chains
   - Detect shadow power (unofficial influencers)
   - Rate each node's network power score

2. STRATEGIC POSITION ASSESSMENT:
   - Betweenness: Who controls information flow?
   - Closeness: Who can reach everyone quickly?
   - Eigenvector: Who is connected to other powerful nodes?
   - Structural holes: Who bridges disconnected groups?

3. VULNERABILITY MAPPING:
   - Identify weak links in opponent networks
   - Find isolated but valuable nodes
   - Detect dependency relationships
   - Map leverage points

4. OPPORTUNITY IDENTIFICATION:
   - Strategic connection opportunities
   - Influence path optimization
   - Coalition building potential
   - Information flow interception points

5. INFLUENCE PATH PLANNING:
   - Shortest path to any target
   - Alternative routes if primary blocked
   - Key intermediaries needed
   - Relationship investment priorities

Return JSON:
{
  "network_overview": {
    "total_nodes": number,
    "total_connections": number,
    "network_density": number,
    "clustering_coefficient": number,
    "average_path_length": number
  },
  "power_rankings": [
    {
      "profile_id": string,
      "name": string,
      "power_score": number,
      "power_type": "formal" | "informal" | "emergent" | "broker",
      "centrality_scores": {
        "betweenness": number,
        "closeness": number,
        "eigenvector": number,
        "pagerank": number
      },
      "influence_reach": number,
      "dependency_count": number,
      "vulnerability_score": number
    }
  ],
  "power_clusters": [
    {
      "cluster_id": string,
      "cluster_name": string,
      "members": string[],
      "power_center": string,
      "cohesion_score": number,
      "external_connections": number
    }
  ],
  "structural_analysis": {
    "bridges": [
      {
        "node": string,
        "connects": string[],
        "criticality": number
      }
    ],
    "structural_holes": [
      {
        "gap_between": string[],
        "bridging_opportunity": string,
        "value_potential": number
      }
    ],
    "isolated_valuables": [
      {
        "node": string,
        "value_indicators": string[],
        "connection_opportunity": string
      }
    ]
  },
  "vulnerability_map": [
    {
      "target": string,
      "vulnerabilities": string[],
      "leverage_points": string[],
      "approach_strategy": string
    }
  ],
  "influence_paths": [
    {
      "from": string,
      "to": string,
      "optimal_path": string[],
      "path_strength": number,
      "key_intermediary": string,
      "alternative_paths": string[][]
    }
  ],
  "strategic_opportunities": [
    {
      "opportunity_type": string,
      "description": string,
      "value_potential": number,
      "effort_required": number,
      "key_actions": string[],
      "timeline": string
    }
  ],
  "coalition_potential": [
    {
      "coalition_name": string,
      "potential_members": string[],
      "common_interests": string[],
      "formation_strategy": string,
      "power_multiplication": number
    }
  ],
  "network_risks": [
    {
      "risk_type": string,
      "description": string,
      "severity": number,
      "mitigation_strategy": string
    }
  ]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'power-network-analyzer', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Parse body safely (may be empty for health check GET requests that bypassed)
    const rawBody = await req.json().catch(() => ({})) as PowerNetworkRequest;
    const { userId, targetProfileId, analysisType = 'full_network' } = rawBody;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather network data
    const [
      { data: profiles },
      { data: relationships },
      { data: interactions },
      { data: personalityProfiles },
      { data: financialIntel },
      { data: previousAnalyses }
    ] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, organization, job_title, relationship_type, tags').eq('user_id', userId).eq('is_active', true).limit(500),
      supabase.from('contact_relationships').select('from_profile_id, to_profile_id, relationship_type, strength').eq('user_id', userId),
      supabase.from('contact_interaction_notes').select('profile_id, interaction_type, mood_observed, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1000),
      supabase.from('psychological_profiles').select('profile_id, personality_ocean').eq('user_id', userId),
      supabase.from('ai_analyses').select('profile_id, result').eq('user_id', userId).eq('analysis_type', 'financial_intelligence'),
      supabase.from('power_network_analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3)
    ]);

    // Build network graph representation
    const networkData = {
      nodes: profiles?.map(p => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        company: p.organization,
        title: p.job_title,
        relationshipType: p.relationship_type,
        tags: p.tags,
        personality: personalityProfiles?.find(pp => pp.profile_id === p.id),
        financial: financialIntel?.find(fi => fi.profile_id === p.id)
      })),
      edges: relationships?.map(r => ({
        source: r.from_profile_id,
        target: r.to_profile_id,
        relationshipType: r.relationship_type,
        strength: r.strength
      })),
      interactionPatterns: interactions?.reduce((acc, i) => {
        const key = i.profile_id;
        if (!acc[key]) acc[key] = { count: 0, moods: [] };
        acc[key].count++;
        acc[key].moods.push(i.mood_observed);
        return acc;
      }, {} as Record<string, { count: number; moods: string[] }>),
      analysisContext: {
        type: analysisType,
        targetProfile: targetProfileId,
        previousInsights: previousAnalyses?.map(a => a.key_insights)
      }
    };

    // Perform power network analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: POWER_NETWORK_PROMPT },
          { role: 'user', content: `Analyze this relationship network for power structures and opportunities:\n\n${JSON.stringify(networkData, null, 2)}` }
        ],
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      analysis = { error: 'Failed to parse network analysis', raw: content };
    }

    // Store analysis
    const { error: insertError } = await supabase
      .from('power_network_analyses')
      .insert({
        user_id: userId,
        target_profile_id: targetProfileId,
        analysis_type: analysisType,
        network_overview: analysis.network_overview,
        power_rankings: analysis.power_rankings,
        power_clusters: analysis.power_clusters,
        structural_analysis: analysis.structural_analysis,
        vulnerability_map: analysis.vulnerability_map,
        influence_paths: analysis.influence_paths,
        strategic_opportunities: analysis.strategic_opportunities,
        coalition_potential: analysis.coalition_potential,
        network_risks: analysis.network_risks,
        nodes_analyzed: profiles?.length || 0,
        edges_analyzed: relationships?.length || 0
      });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Store in ai_analyses for section availability
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profiles?.[0]?.id || null,
      analysis_type: 'power_network',
      result: analysis,
      generated_at: new Date().toISOString()
    }, { onConflict: 'user_id,profile_id,analysis_type' });

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'power-network-analyzer',
      model_name: 'google/gemini-2.5-pro',
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.0001),
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      networkStats: {
        nodesAnalyzed: profiles?.length || 0,
        edgesAnalyzed: relationships?.length || 0,
        interactionsProcessed: interactions?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Power network analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
