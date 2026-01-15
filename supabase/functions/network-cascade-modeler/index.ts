import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CascadeModelRequest {
  userId: string;
  operationId?: string;
  seedNodes: string[];
  cascadeType: 'influence' | 'information' | 'behavioral';
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
    const { userId, operationId, seedNodes, cascadeType } = await req.json() as CascadeModelRequest;

    // Fetch network data
    const [
      { data: profiles },
      { data: relationships },
      { data: existingCascades }
    ] = await Promise.all([
      supabase.from('profiles')
        .select('id, name, relationship_type, influence_score')
        .eq('user_id', userId)
        .in('id', seedNodes),
      supabase.from('relationship_connections')
        .select('*')
        .eq('user_id', userId),
      supabase.from('influence_cascades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const CASCADE_PROMPT = `You are a network cascade modeling engine. Analyze the network topology and predict influence propagation patterns.

Seed Nodes: ${JSON.stringify(profiles || [])}
Network Relationships: ${JSON.stringify(relationships || [])}
Historical Cascades: ${JSON.stringify(existingCascades || [])}
Cascade Type: ${cascadeType}

Model the cascade propagation and provide analysis in JSON format:
{
  "cascadeModel": {
    "propagationWaves": [
      {
        "wave": 1,
        "nodes": ["profileId"],
        "expectedReach": number,
        "timeToReach": "duration",
        "activationProbability": 0-1
      }
    ],
    "totalReach": number,
    "cascadeVelocity": "fast|moderate|slow",
    "decayRate": 0-1
  },
  "networkAnalysis": {
    "bridgeNodes": ["profileIds that connect clusters"],
    "influenceHubs": ["high-centrality nodes"],
    "vulnerableNodes": ["easily influenced nodes"],
    "resistantNodes": ["hard to influence nodes"]
  },
  "optimizations": {
    "alternativeSeedNodes": ["better starting points"],
    "amplificationStrategies": ["string"],
    "blockingStrategies": ["how to stop counter-cascades"]
  },
  "predictions": {
    "finalCoverage": 0-1,
    "timeToSaturation": "duration",
    "competingCascadeRisk": 0-1
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
          { role: 'system', content: CASCADE_PROMPT },
          { role: 'user', content: `Model ${cascadeType} cascade from seeds: ${seedNodes.join(', ')}` }
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
    
    let model;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      model = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      model = { raw: content, parseError: true };
    }

    // Store cascade model
    const { data: cascade } = await supabase.from('influence_cascades').insert({
      user_id: userId,
      operation_id: operationId,
      cascade_type: cascadeType,
      seed_nodes: seedNodes,
      propagation_model: model.cascadeModel,
      predicted_reach: model.predictions?.finalCoverage,
      status: 'modeled'
    }).select().single();

    return new Response(JSON.stringify({
      success: true,
      cascadeId: cascade?.id,
      model,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Cascade modeler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
