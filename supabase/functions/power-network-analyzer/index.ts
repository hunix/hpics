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

// v3.9.23: Ultra-minimal prompt for fastest processing
const POWER_NETWORK_PROMPT = `Analyze network power. Return JSON: {"overview":{"nodes":N,"edges":N},"rankings":[{"id":"","name":"","score":N}],"clusters":[{"name":"","center":""}],"opportunities":[{"type":"","action":""}]}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
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

    const rawBody = await req.json().catch(() => ({})) as PowerNetworkRequest;
    const { userId, targetProfileId, analysisType = 'full_network' } = rawBody;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // v3.9.23: Ultra-aggressive limits to prevent timeout
    const [{ data: profiles }, { data: relationships }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, organization, job_title').eq('user_id', userId).eq('is_active', true).limit(15),
      supabase.from('contact_relationships').select('from_profile_id, to_profile_id, relationship_type, strength').eq('user_id', userId).limit(50)
    ]);

    // v3.9.23: Store minimal result and exit early if < 3 profiles
    if (!profiles?.length || profiles.length < 3) {
      console.log('[power-network-analyzer] < 3 profiles, storing minimal result');
      
      const minimalResult = {
        overview: { nodes: profiles?.length || 0, edges: relationships?.length || 0, density: 0 },
        rankings: profiles?.map((p: { id: string; first_name?: string; last_name?: string }) => ({ 
          id: p.id, 
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), 
          score: 50 
        })) || [],
        clusters: [],
        opportunities: [{ type: 'expand', action: 'Add more contacts to enable network analysis' }],
        status: 'insufficient_data'
      };
      
      const analysisProfileId = targetProfileId || profiles?.[0]?.id;
      if (analysisProfileId) {
        await supabase.from('ai_analyses').upsert({
          user_id: userId,
          profile_id: analysisProfileId,
          analysis_type: 'power_network',
          result: minimalResult,
          generated_at: new Date().toISOString()
        }, { onConflict: 'profile_id,analysis_type' });
      }
      
      return new Response(JSON.stringify({
        success: true,
        analysis: minimalResult,
        networkStats: { nodesAnalyzed: profiles?.length || 0, edgesAnalyzed: relationships?.length || 0 }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build ultra-minimal network representation
    const networkData = {
      n: profiles.slice(0, 12).map((p: { id: string; first_name?: string; last_name?: string; organization?: string }) => ({
        i: p.id.slice(0, 8),
        n: `${p.first_name || ''} ${p.last_name || ''}`.trim().slice(0, 20),
        o: (p.organization || '').slice(0, 15)
      })),
      e: relationships?.slice(0, 30).map((r: { from_profile_id: string; to_profile_id: string; strength?: number }) => ({
        s: r.from_profile_id.slice(0, 8),
        t: r.to_profile_id.slice(0, 8),
        w: r.strength || 5
      })) || []
    };

    console.log(`[power-network-analyzer] Analyzing ${networkData.n.length} nodes, ${networkData.e.length} edges`);

    // v3.9.23: Use fastest model with strict token limit
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: POWER_NETWORK_PROMPT },
          { role: 'user', content: JSON.stringify(networkData) }
        ],
        temperature: 0.1,
        max_tokens: 500
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
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { overview: { nodes: profiles.length, edges: relationships?.length || 0 } };
    } catch {
      console.warn('Failed to parse AI response, using fallback');
      analysis = { 
        overview: { nodes: profiles.length, edges: relationships?.length || 0 },
        rankings: profiles.map((p: { id: string; first_name?: string; last_name?: string }) => ({ 
          id: p.id, 
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), 
          score: 50 
        })),
        clusters: [],
        opportunities: []
      };
    }

    // Normalize response structure
    const normalizedAnalysis = {
      network_overview: analysis.overview || analysis.network_overview || { total_nodes: profiles.length, total_connections: relationships?.length || 0 },
      power_rankings: analysis.rankings || analysis.power_rankings || [],
      power_clusters: analysis.clusters || analysis.power_clusters || [],
      strategic_opportunities: analysis.opportunities || analysis.strategic_opportunities || []
    };

    // Store in power_network_analyses
    await supabase.from('power_network_analyses').insert({
      user_id: userId,
      target_profile_id: targetProfileId,
      analysis_type: analysisType,
      network_overview: normalizedAnalysis.network_overview,
      power_rankings: normalizedAnalysis.power_rankings,
      power_clusters: normalizedAnalysis.power_clusters,
      strategic_opportunities: normalizedAnalysis.strategic_opportunities,
      nodes_analyzed: profiles.length,
      edges_analyzed: relationships?.length || 0
    }).then(({ error }) => { if (error) console.warn('Insert error:', error.message); });

    // Store in ai_analyses for section availability
    const analysisProfileId = targetProfileId || profiles[0]?.id;
    if (analysisProfileId) {
      await supabase.from('ai_analyses').upsert({
        user_id: userId,
        profile_id: analysisProfileId,
        analysis_type: 'power_network',
        result: normalizedAnalysis,
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'power-network-analyzer',
      model_name: 'google/gemini-2.5-flash-lite',
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.00002),
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      analysis: normalizedAnalysis,
      networkStats: { nodesAnalyzed: profiles.length, edgesAnalyzed: relationships?.length || 0 }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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
