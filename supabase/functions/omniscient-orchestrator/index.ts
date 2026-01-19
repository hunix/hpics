import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestrationRequest {
  userId: string;
  mode: 'full' | 'tactical' | 'defensive' | 'opportunistic';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'omniscient-orchestrator', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, mode } = await req.json() as OrchestrationRequest;

    // Aggregate all Phase 5 intelligence
    const [
      { data: activeCampaigns },
      { data: networkOps },
      { data: threatActors },
      { data: opportunities },
      { data: trajectories },
      { data: cascades },
      { data: recentExecutions }
    ] = await Promise.all([
      supabase.from('autonomous_campaigns')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase.from('network_operations')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'planning']),
      supabase.from('threat_actors')
        .select('*')
        .eq('user_id', userId)
        .in('threat_level', ['critical', 'high']),
      supabase.from('opportunity_windows')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'detected')
        .gte('window_end', new Date().toISOString()),
      supabase.from('trajectory_intercepts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'analyzed')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('influence_cascades')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'propagating']),
      supabase.from('agent_executions')
        .select('*')
        .eq('user_id', userId)
        .order('executed_at', { ascending: false })
        .limit(50)
    ]);

    const ORCHESTRATOR_PROMPT = `You are the Omniscient Orchestrator - the master coordination engine for all Phase 5 operations. Synthesize all intelligence streams and optimize global strategy.

Mode: ${mode}

Active Campaigns: ${JSON.stringify(activeCampaigns || [])}
Network Operations: ${JSON.stringify(networkOps || [])}
High-Priority Threats: ${JSON.stringify(threatActors || [])}
Active Opportunities: ${JSON.stringify(opportunities || [])}
Trajectory Intercepts: ${JSON.stringify(trajectories || [])}
Active Cascades: ${JSON.stringify(cascades || [])}
Recent Executions: ${JSON.stringify(recentExecutions || [])}

Orchestrate all operations and provide unified command directive in JSON format:
{
  "situationalAwareness": {
    "overallStatus": "optimal|stable|degraded|critical",
    "activeOperations": number,
    "pendingActions": number,
    "threatLevel": "low|elevated|high|severe",
    "opportunityDensity": "sparse|moderate|rich"
  },
  "prioritizedActions": [
    {
      "actionId": "string",
      "source": "campaign|network|counter-intel|opportunity|intercept",
      "sourceId": "string",
      "priority": 1-100,
      "action": "string",
      "target": "profileId or operation",
      "timing": "immediate|scheduled|conditional",
      "scheduledFor": "timestamp or null",
      "dependencies": ["actionIds"],
      "conflictsWith": ["actionIds"],
      "resources": "low|medium|high",
      "expectedOutcome": "string"
    }
  ],
  "operationalConflicts": [
    {
      "operations": ["ids"],
      "conflictType": "resource|timing|target|strategy",
      "resolution": "string",
      "priority": "first operation wins"
    }
  ],
  "synergies": [
    {
      "operations": ["ids"],
      "synergyType": "string",
      "amplificationFactor": number,
      "recommendation": "string"
    }
  ],
  "resourceAllocation": {
    "autonomous": number,
    "network": number,
    "counterIntel": number,
    "predictive": number,
    "reserve": number
  },
  "riskAssessment": {
    "overexposure": 0-1,
    "detectionRisk": 0-1,
    "blowbackPotential": 0-1,
    "overallRisk": 0-1
  },
  "strategicRecommendations": [
    {
      "category": "offensive|defensive|opportunistic|consolidation",
      "recommendation": "string",
      "rationale": "string",
      "timeline": "string"
    }
  ],
  "nextOrchestrationAt": "timestamp"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: ORCHESTRATOR_PROMPT },
          { role: 'user', content: `Orchestrate all Phase 5 operations in ${mode} mode` }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    let orchestration;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      orchestration = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      orchestration = { raw: content, parseError: true };
    }

    // Store orchestration directive
    await supabase.from('ai_analyses').insert({
      user_id: userId,
      profile_id: userId,
      analysis_type: 'omniscient_orchestration',
      result: orchestration,
      generated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      mode,
      orchestration,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Orchestrator error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
