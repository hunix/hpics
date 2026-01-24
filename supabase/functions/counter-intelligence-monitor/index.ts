import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CounterIntelRequest {
  userId: string;
  profileId?: string;
  scanType: 'full' | 'quick' | 'targeted';
  targetAreas?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'counter-intelligence-monitor', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, profileId, scanType, targetAreas } = await req.json() as CounterIntelRequest;

    // Gather counter-intelligence data
    const [
      { data: threatAssessments },
      { data: anomalies },
      { data: deceptionAnalyses },
      { data: accessEvents },
      { data: securityEvents }
    ] = await Promise.all([
      supabase.from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('analysis_type', 'threat_assessment')
        .order('generated_at', { ascending: false })
        .limit(50),
      supabase.from('behavioral_anomalies')
        .select('*')
        .eq('user_id', userId)
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false })
        .limit(100),
      supabase.from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .in('analysis_type', ['deception_detection', 'cross_modal_deception'])
        .order('generated_at', { ascending: false })
        .limit(50),
      supabase.from('data_access_events')
        .select('*')
        .eq('user_id', userId)
        .order('accessed_at', { ascending: false })
        .limit(200),
      supabase.from('security_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    const counterIntelData = {
      threatAssessments: threatAssessments || [],
      anomalies: anomalies || [],
      deceptionAnalyses: deceptionAnalyses || [],
      accessEvents: accessEvents || [],
      securityEvents: securityEvents || []
    };

    const COUNTER_INTEL_PROMPT = `You are an elite counter-intelligence analyst. Analyze the following security and intelligence data to identify:

1. **Active Threats**: Current threats to information security or relationship integrity
2. **Deception Patterns**: Evidence of dishonesty or manipulation from contacts
3. **Anomaly Clusters**: Related anomalies that may indicate coordinated activity
4. **Access Vulnerabilities**: Unusual data access patterns or potential breaches
5. **Trust Erosion Indicators**: Signs of deteriorating trust in relationships
6. **Insider Risk Signals**: Indicators that trusted contacts may be compromised
7. **Counter-Surveillance Recommendations**: Actions to protect against threats

Provide a comprehensive counter-intelligence assessment in this JSON format:
{
  "overallThreatLevel": "critical|high|elevated|guarded|low",
  "activeThreats": [
    {
      "threatId": "string",
      "type": "deception|manipulation|breach|infiltration|surveillance|exfiltration",
      "source": "internal|external|unknown",
      "targetArea": "string",
      "severity": 1-10,
      "confidence": 0-1,
      "evidence": ["string"],
      "potentialImpact": "string",
      "recommendedActions": ["string"]
    }
  ],
  "deceptionMatrix": {
    "confirmedDeceptions": [
      {
        "profileId": "string",
        "profileName": "string",
        "deceptionType": "string",
        "instances": number,
        "lastDetected": "timestamp",
        "trustImpact": -100 to 0
      }
    ],
    "suspectedDeceptions": [],
    "deceptionTrends": "increasing|stable|decreasing"
  },
  "anomalyIntelligence": {
    "clusterCount": number,
    "clusters": [
      {
        "clusterId": "string",
        "relatedAnomalies": number,
        "commonPattern": "string",
        "riskAssessment": "string"
      }
    ],
    "unclusteredAnomalies": number
  },
  "accessSecurityAssessment": {
    "suspiciousAccessCount": number,
    "unusualPatterns": ["string"],
    "potentialBreaches": [],
    "recommendations": ["string"]
  },
  "trustErosionMap": [
    {
      "profileId": "string",
      "profileName": "string",
      "trustTrend": "deteriorating|stable|improving",
      "erosionRate": number,
      "keyFactors": ["string"],
      "interventionUrgency": "immediate|soon|monitor"
    }
  ],
  "insiderRiskAssessment": {
    "highRiskContacts": [],
    "moderateRiskContacts": [],
    "riskIndicators": ["string"]
  },
  "counterSurveillanceRecommendations": [
    {
      "priority": "critical|high|medium|low",
      "category": "string",
      "action": "string",
      "rationale": "string"
    }
  ],
  "intelligenceGaps": ["string"],
  "nextScanRecommendation": "timestamp"
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
          { role: 'system', content: COUNTER_INTEL_PROMPT },
          { role: 'user', content: JSON.stringify(counterIntelData) }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
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
    } catch (e) {
      console.error('JSON parse error:', e);
      analysis = { raw: content, parseError: true };
    }

    // Store counter-intelligence assessment
    await supabase.from('ai_analyses').insert({
      user_id: userId,
      profile_id: profileId || userId,
      analysis_type: 'counter_intelligence',
      result: analysis,
      generated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      scanType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Counter-intelligence monitor error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
