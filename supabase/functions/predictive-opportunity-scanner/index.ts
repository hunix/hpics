import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpportunityScanRequest {
  userId: string;
  scanScope: 'all' | 'priority' | 'specific';
  profileIds?: string[];
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
    const { userId, scanScope, profileIds } = await req.json() as OpportunityScanRequest;

    // Gather data for opportunity detection
    let profileQuery = supabase.from('profiles').select('*').eq('user_id', userId);
    if (scanScope === 'specific' && profileIds?.length) {
      profileQuery = profileQuery.in('id', profileIds);
    }
    
    const [
      { data: profiles },
      { data: recentInteractions },
      { data: behavioralPatterns },
      { data: upcomingEvents },
      { data: vulnerabilityWindows }
    ] = await Promise.all([
      profileQuery.limit(50),
      supabase.from('contact_interaction_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('behavioral_predictions')
        .select('*')
        .eq('user_id', userId)
        .gte('valid_until', new Date().toISOString())
        .limit(50),
      supabase.from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('event_date', new Date().toISOString())
        .limit(30),
      supabase.from('trauma_exploitation_windows')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(20)
    ]);

    const OPPORTUNITY_PROMPT = `You are a predictive opportunity scanner. Identify actionable windows for influence, connection, or intervention.

Profiles: ${JSON.stringify(profiles || [])}
Recent Interactions: ${JSON.stringify(recentInteractions || [])}
Behavioral Predictions: ${JSON.stringify(behavioralPatterns || [])}
Upcoming Events: ${JSON.stringify(upcomingEvents || [])}
Active Vulnerability Windows: ${JSON.stringify(vulnerabilityWindows || [])}

Scan for opportunities and provide in JSON format:
{
  "opportunities": [
    {
      "opportunityId": "generated-uuid",
      "profileId": "string",
      "profileName": "string",
      "type": "reconnection|deepening|influence|support|extraction|conversion",
      "urgency": "immediate|24h|week|month",
      "window": {
        "opensAt": "timestamp",
        "closesAt": "timestamp",
        "peakTime": "timestamp"
      },
      "context": {
        "trigger": "what created this opportunity",
        "emotionalState": "predicted state",
        "receptivity": 0-1
      },
      "recommendedAction": {
        "type": "string",
        "content": "specific action or message",
        "channel": "in-person|call|text|email|social",
        "tone": "string"
      },
      "successProbability": 0-1,
      "value": 1-10,
      "risks": ["string"],
      "alternativeActions": [
        {
          "action": "string",
          "probability": 0-1
        }
      ]
    }
  ],
  "missedOpportunities": [
    {
      "profileId": "string",
      "type": "string",
      "windowClosed": "timestamp",
      "recoveryPossible": boolean
    }
  ],
  "emergingPatterns": [
    {
      "pattern": "string",
      "affectedProfiles": ["ids"],
      "anticipatedOpportunities": number,
      "timeframe": "string"
    }
  ],
  "scanMetrics": {
    "profilesScanned": number,
    "opportunitiesFound": number,
    "highValueOpportunities": number,
    "nextScanRecommended": "timestamp"
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
          { role: 'system', content: OPPORTUNITY_PROMPT },
          { role: 'user', content: `Scan for opportunities: scope=${scanScope}` }
        ],
        temperature: 0.4,
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
    
    let scan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      scan = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      scan = { raw: content, parseError: true };
    }

    // Store detected opportunities
    if (scan.opportunities?.length) {
      for (const opp of scan.opportunities) {
        await supabase.from('opportunity_windows').insert({
          user_id: userId,
          profile_id: opp.profileId,
          opportunity_type: opp.type,
          window_start: opp.window?.opensAt,
          window_end: opp.window?.closesAt,
          peak_time: opp.window?.peakTime,
          context: opp.context,
          recommended_action: opp.recommendedAction,
          success_probability: opp.successProbability,
          value_score: opp.value,
          status: 'detected'
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      scan,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Opportunity scanner error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
