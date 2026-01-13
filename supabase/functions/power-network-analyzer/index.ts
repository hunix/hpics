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

  try {
    const { userId, targetProfileId, analysisType = 'full_network' } = await req.json() as PowerNetworkRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

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
      supabase.from('profiles').select('id, name, company, title, relationship_type, relationship_strength, tags').eq('user_id', userId).limit(500),
      supabase.from('contact_relationships').select('*').eq('user_id', userId),
      supabase.from('contact_interactions').select('profile_id, interaction_type, sentiment, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1000),
      supabase.from('personality_profiles').select('profile_id, openness, extraversion, agreeableness').eq('user_id', userId),
      supabase.from('financial_intelligence').select('profile_id, wealth_tier, influence_implications').eq('user_id', userId),
      supabase.from('power_network_analyses').select('*').eq('user_id', userId).order('analyzed_at', { ascending: false }).limit(3)
    ]);

    // Build network graph representation
    const networkData = {
      nodes: profiles?.map(p => ({
        id: p.id,
        name: p.name,
        company: p.company,
        title: p.title,
        relationshipType: p.relationship_type,
        relationshipStrength: p.relationship_strength,
        tags: p.tags,
        personality: personalityProfiles?.find(pp => pp.profile_id === p.id),
        financial: financialIntel?.find(fi => fi.profile_id === p.id)
      })),
      edges: relationships?.map(r => ({
        source: r.profile_id_1,
        target: r.profile_id_2,
        relationshipType: r.relationship_type,
        strength: r.strength,
        direction: r.direction
      })),
      interactionPatterns: interactions?.reduce((acc, i) => {
        const key = i.profile_id;
        if (!acc[key]) acc[key] = { count: 0, sentiments: [] };
        acc[key].count++;
        acc[key].sentiments.push(i.sentiment);
        return acc;
      }, {} as Record<string, { count: number; sentiments: string[] }>),
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
