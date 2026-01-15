import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropagationRequest {
  userId: string;
  cascadeId: string;
  action: 'propagate' | 'measure' | 'adjust';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, cascadeId, action } = await req.json() as PropagationRequest;

    const { data: cascade } = await supabase
      .from('influence_cascades')
      .select('*')
      .eq('id', cascadeId)
      .eq('user_id', userId)
      .single();

    if (!cascade) {
      return new Response(JSON.stringify({ error: 'Cascade not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: affectedNodes } = await supabase
      .from('cascade_effects')
      .select('*')
      .eq('cascade_id', cascadeId);

    const PROPAGATION_PROMPT = `You are an influence propagation engine. Execute and measure influence spread through networks.

Cascade: ${JSON.stringify(cascade)}
Current Affected Nodes: ${JSON.stringify(affectedNodes || [])}
Action: ${action}

Analyze propagation state and provide in JSON format:
{
  "propagationState": {
    "currentWave": number,
    "activeNodes": number,
    "infectedNodes": number,
    "recoveredNodes": number,
    "immuneNodes": number
  },
  "nextActions": [
    {
      "nodeId": "string",
      "actionType": "activate|reinforce|abandon",
      "priority": 1-10,
      "expectedEffect": "string",
      "resources": number
    }
  ],
  "propagationMetrics": {
    "r0": number,
    "generationTime": "duration",
    "attackRate": 0-1,
    "herdImmunityThreshold": 0-1
  },
  "adjustments": {
    "increaseIntensity": ["nodeIds"],
    "decreaseIntensity": ["nodeIds"],
    "abandonNodes": ["nodeIds"],
    "newTargets": ["nodeIds"]
  },
  "forecast": {
    "peakReach": number,
    "timeToResolution": "duration",
    "finalState": "success|partial|failure"
  }
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
          { role: 'system', content: PROPAGATION_PROMPT },
          { role: 'user', content: `${action} propagation for cascade ${cascadeId}` }
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
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      analysis = { raw: content, parseError: true };
    }

    // Update cascade with new metrics
    await supabase
      .from('influence_cascades')
      .update({
        current_wave: analysis.propagationState?.currentWave,
        affected_nodes: affectedNodes?.map(n => n.node_id) || [],
        actual_reach: analysis.propagationState?.infectedNodes,
        status: 'propagating'
      })
      .eq('id', cascadeId);

    return new Response(JSON.stringify({
      success: true,
      cascadeId,
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Propagation engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
