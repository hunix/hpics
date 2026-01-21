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

// Simplified prompt for faster processing (v3.9.22)
const POWER_NETWORK_PROMPT = `Analyze this network for power structures. Return concise JSON:
{
  "network_overview": { "total_nodes": number, "total_connections": number, "network_density": number },
  "power_rankings": [{ "profile_id": string, "name": string, "power_score": number, "power_type": "formal"|"informal"|"broker" }],
  "power_clusters": [{ "cluster_name": string, "members": string[], "power_center": string }],
  "structural_analysis": { "bridges": [{ "node": string, "criticality": number }], "isolated_valuables": [{ "node": string, "value_indicators": string[] }] },
  "vulnerability_map": [{ "target": string, "vulnerabilities": string[], "approach_strategy": string }],
  "strategic_opportunities": [{ "opportunity_type": string, "description": string, "key_actions": string[] }]
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

    // Gather network data (aggressive limits to prevent timeout - v3.9.22)
    const [
      { data: profiles },
      { data: relationships }
    ] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, organization, job_title, relationship_type').eq('user_id', userId).eq('is_active', true).limit(30),
      supabase.from('contact_relationships').select('from_profile_id, to_profile_id, relationship_type, strength').eq('user_id', userId).limit(100)
    ]);

    // Early exit if minimal data
    if (!profiles?.length || profiles.length < 2) {
      console.log('[power-network-analyzer] Insufficient profiles for network analysis');
      
      // Still store a result in ai_analyses so section enables
      if (profiles?.[0]?.id) {
        await supabase.from('ai_analyses').upsert({
          user_id: userId,
          profile_id: targetProfileId || profiles[0].id,
          analysis_type: 'power_network',
          result: { network_overview: { total_nodes: profiles?.length || 0, total_connections: 0 }, message: 'Insufficient data' },
          generated_at: new Date().toISOString()
        }, { onConflict: 'profile_id,analysis_type' });
      }
      
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          network_overview: { total_nodes: profiles?.length || 0, total_connections: 0, network_density: 0 },
          power_rankings: [],
          message: 'Insufficient network data for analysis'
        },
        networkStats: { nodesAnalyzed: profiles?.length || 0, edgesAnalyzed: 0 }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build minimal network representation for fast processing
    const networkData = {
      nodes: profiles.slice(0, 25).map((p: { id: string; first_name?: string; last_name?: string; organization?: string; job_title?: string }) => ({
        id: p.id,
        n: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        o: p.organization,
        t: p.job_title
      })),
      edges: relationships?.slice(0, 75).map((r: { from_profile_id: string; to_profile_id: string; relationship_type?: string; strength?: number }) => ({
        s: r.from_profile_id,
        t: r.to_profile_id,
        r: r.relationship_type,
        w: r.strength
      })) || []
    };

    console.log(`[power-network-analyzer] Analyzing ${networkData.nodes.length} nodes, ${networkData.edges.length} edges`);

    // Use faster model to prevent timeout (v3.9.22)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: POWER_NETWORK_PROMPT },
          { role: 'user', content: JSON.stringify(networkData) }
        ],
        temperature: 0.2,
        max_tokens: 2000
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

    // Store in ai_analyses for section availability (use targetProfileId if provided, otherwise first profile)
    const analysisProfileId = targetProfileId || profiles?.[0]?.id;
    if (analysisProfileId) {
      await supabase.from('ai_analyses').upsert({
        user_id: userId,
        profile_id: analysisProfileId,
        analysis_type: 'power_network',
        result: analysis,
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'power-network-analyzer',
      model_name: 'google/gemini-2.5-flash',
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.00005),
      status: 'success'
    });
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
        edgesAnalyzed: relationships?.length || 0
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
