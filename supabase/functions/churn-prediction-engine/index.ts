import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { profileId, userId } = await req.json();

    // Gather comprehensive relationship data
    const [
      { data: interactions },
      { data: messages },
      { data: relationshipScores },
      { data: anomalies },
      { data: previousPredictions },
      { data: milestones }
    ] = await Promise.all([
      supabase.from('contact_interaction_notes')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('messages')
        .select('*')
        .eq('profile_id', profileId)
        .order('received_at', { ascending: false })
        .limit(500),
      supabase.from('relationship_scores')
        .select('*')
        .eq('profile_id', profileId)
        .order('calculated_at', { ascending: false })
        .limit(30),
      supabase.from('behavioral_anomalies')
        .select('*')
        .eq('profile_id', profileId)
        .order('detected_at', { ascending: false })
        .limit(50),
      supabase.from('behavioral_predictions')
        .select('*')
        .eq('profile_id', profileId)
        .eq('prediction_type', 'churn')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('life_milestones')
        .select('*')
        .eq('profile_id', profileId)
        .order('milestone_date', { ascending: false })
        .limit(20)
    ]);

    const CHURN_PREDICTION_PROMPT = `You are an expert in relationship dynamics and predictive modeling. Analyze the following relationship data to predict churn risk and generate intervention strategies.

Provide comprehensive churn prediction in this JSON format:
{
  "churnRiskScore": 0-100,
  "churnProbability": 0-1,
  "confidenceLevel": 0-1,
  "timeToChurn": {
    "estimate": "days|weeks|months",
    "value": number,
    "confidence": 0-1
  },
  "riskCategory": "critical|high|moderate|low|minimal",
  "riskFactors": [
    {
      "factor": "string",
      "weight": 0-1,
      "trend": "worsening|stable|improving",
      "evidence": ["string"]
    }
  ],
  "protectiveFactors": [
    {
      "factor": "string",
      "weight": 0-1,
      "evidence": ["string"]
    }
  ],
  "engagementMetrics": {
    "frequencyTrend": "increasing|stable|decreasing",
    "responsivenessTrend": "increasing|stable|decreasing",
    "initiationBalance": number,
    "emotionalInvestmentTrend": "increasing|stable|decreasing"
  },
  "warningSignals": [
    {
      "signal": "string",
      "firstDetected": "string",
      "currentSeverity": 1-10,
      "trajectory": "worsening|stable|improving"
    }
  ],
  "behavioralChanges": [
    {
      "behavior": "string",
      "previousPattern": "string",
      "currentPattern": "string",
      "changeDate": "string",
      "significance": 1-10
    }
  ],
  "communicationHealth": {
    "overallScore": 0-100,
    "frequency": { "current": number, "trend": "string" },
    "depth": { "current": number, "trend": "string" },
    "reciprocity": { "current": number, "trend": "string" },
    "positivity": { "current": number, "trend": "string" }
  },
  "interventionRecommendations": [
    {
      "priority": "immediate|urgent|soon|optional",
      "type": "outreach|conversation|gesture|space|professional",
      "action": "string",
      "rationale": "string",
      "expectedImpact": 1-10,
      "timing": "string",
      "riskOfInaction": "string"
    }
  ],
  "recoveryPotential": {
    "score": 0-100,
    "bestCaseScenario": "string",
    "worstCaseScenario": "string",
    "mostLikelyOutcome": "string"
  },
  "historicalPatternMatch": {
    "similarPastSituations": number,
    "pastOutcomes": ["string"],
    "lessonsApplicable": ["string"]
  },
  "monitoringPlan": {
    "keyIndicators": ["string"],
    "checkFrequency": "string",
    "escalationTriggers": ["string"]
  }
}`;

    const relationshipData = {
      interactions: interactions || [],
      messages: messages || [],
      relationshipScores: relationshipScores || [],
      anomalies: anomalies || [],
      previousPredictions: previousPredictions || [],
      milestones: milestones || []
    };

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: CHURN_PREDICTION_PROMPT },
          { role: 'user', content: JSON.stringify(relationshipData) }
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
    
    let prediction;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e: any) {
      prediction = { raw: content, parseError: true };
    }

    // Store churn prediction
    await supabase.from('behavioral_predictions').insert({
      user_id: userId,
      profile_id: profileId,
      prediction_type: 'churn',
      prediction_value: prediction,
      confidence_score: prediction.confidenceLevel || 0.5,
      valid_from: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      prediction,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Churn prediction engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
