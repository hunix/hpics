import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatProfileRequest {
  userId: string;
  profileId: string;
  analysisDepth: 'quick' | 'standard' | 'deep';
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
    const { userId, profileId, analysisDepth } = await req.json() as ThreatProfileRequest;

    // Gather intelligence on potential threat actor
    const [
      { data: profile },
      { data: deceptionHistory },
      { data: anomalies },
      { data: miceScores },
      { data: betrayalPredictions }
    ] = await Promise.all([
      supabase.from('profiles')
        .select('*')
        .eq('id', profileId)
        .single(),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['deception_detection', 'forensic_statement'])
        .limit(20),
      supabase.from('behavioral_anomalies')
        .select('*')
        .eq('profile_id', profileId)
        .order('detected_at', { ascending: false })
        .limit(30),
      supabase.from('mice_assessments')
        .select('*')
        .eq('profile_id', profileId)
        .order('assessed_at', { ascending: false })
        .limit(10),
      supabase.from('betrayal_predictions')
        .select('*')
        .eq('profile_id', profileId)
        .order('predicted_at', { ascending: false })
        .limit(10)
    ]);

    const THREAT_PROFILER_PROMPT = `You are an elite threat actor profiler. Analyze all available intelligence to build a comprehensive threat profile.

Subject Profile: ${JSON.stringify(profile)}
Deception History: ${JSON.stringify(deceptionHistory || [])}
Behavioral Anomalies: ${JSON.stringify(anomalies || [])}
MICE Vulnerability Scores: ${JSON.stringify(miceScores || [])}
Betrayal Predictions: ${JSON.stringify(betrayalPredictions || [])}
Analysis Depth: ${analysisDepth}

Create comprehensive threat actor profile in JSON format:
{
  "threatClassification": {
    "actorType": "insider|outsider|unwitting|compromised|adversarial",
    "threatLevel": "critical|high|moderate|low|negligible",
    "confidence": 0-1,
    "lastAssessed": "timestamp"
  },
  "capabilities": {
    "technical": 1-10,
    "social": 1-10,
    "resources": 1-10,
    "access": 1-10,
    "motivation": 1-10
  },
  "intentions": {
    "primaryObjective": "string",
    "secondaryObjectives": ["string"],
    "targetedAssets": ["string"],
    "timeline": "immediate|short|medium|long"
  },
  "tactics": {
    "preferredMethods": ["string"],
    "historicalPatterns": ["string"],
    "predictedApproaches": ["string"]
  },
  "vulnerabilities": {
    "exploitable": ["string"],
    "pressurePoints": ["string"],
    "turnPotential": 0-1
  },
  "networkPosition": {
    "reach": number,
    "influenceScore": 0-1,
    "keyConnections": ["profileIds"],
    "isolationFeasibility": 0-1
  },
  "counterMeasures": {
    "recommended": [
      {
        "action": "string",
        "priority": "immediate|high|medium|low",
        "resources": "string",
        "expectedOutcome": "string"
      }
    ],
    "monitoring": ["specific indicators to watch"],
    "containment": ["steps if threat materializes"]
  },
  "evolutionForecast": {
    "escalationProbability": 0-1,
    "deescalationPaths": ["string"],
    "triggerEvents": ["string"]
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
          { role: 'system', content: THREAT_PROFILER_PROMPT },
          { role: 'user', content: `Profile threat actor: ${profile?.name || profileId}` }
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
    
    let threatProfile;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      threatProfile = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      threatProfile = { raw: content, parseError: true };
    }

    // Store threat actor profile
    await supabase.from('threat_actors').upsert({
      user_id: userId,
      profile_id: profileId,
      actor_type: threatProfile.threatClassification?.actorType || 'unknown',
      threat_level: threatProfile.threatClassification?.threatLevel || 'moderate',
      capabilities: threatProfile.capabilities,
      known_tactics: threatProfile.tactics?.preferredMethods,
      motivations: threatProfile.intentions,
      last_assessed_at: new Date().toISOString()
    }, { onConflict: 'user_id,profile_id' });

    return new Response(JSON.stringify({
      success: true,
      profileId,
      threatProfile,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Threat profiler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
