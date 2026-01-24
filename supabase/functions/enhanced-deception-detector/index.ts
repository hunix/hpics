import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeceptionRequest {
  profileId: string;
  userId: string;
  analysisDepth: 'surface' | 'standard' | 'deep' | 'forensic';
  timeRange?: number; // days
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'enhanced-deception-detector', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { profileId, userId, analysisDepth, timeRange = 90 } = await req.json() as DeceptionRequest;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    // Gather multi-modal data for deception analysis
    const [
      { data: messages },
      { data: voiceInsights },
      { data: facialAnalyses },
      { data: bodyLanguage },
      { data: behavioralPatterns },
      { data: baseline },
      { data: previousDeceptions }
    ] = await Promise.all([
      // NOTE: messages table has no profile_id column - must join via conversations
      // Also: messages has 'sent_at' not 'received_at'
      // Reduced limits for faster processing (prevent timeout)
      supabase.from('messages')
        .select('*, conversations!inner(profile_id)')
        .eq('conversations.profile_id', profileId)
        .gte('sent_at', cutoffDate.toISOString())
        .order('sent_at', { ascending: false })
        .limit(200),
      supabase.from('voice_insights')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', cutoffDate.toISOString())
        .limit(50),
      supabase.from('media_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'facial')
        .gte('created_at', cutoffDate.toISOString())
        .limit(50),
      supabase.from('body_language_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', cutoffDate.toISOString())
        .limit(30),
      supabase.from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .limit(20),
      supabase.from('behavioral_baselines')
        .select('*')
        .eq('profile_id', profileId)
        .order('last_calculated_at', { ascending: false })
        .limit(1),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['deception_detection', 'cross_modal_deception'])
        .order('generated_at', { ascending: false })
        .limit(10)
    ]);

    const ENHANCED_DECEPTION_PROMPT = `You are a forensic deception analyst with expertise in:
- LIWC linguistic analysis
- Micro-expression interpretation
- Voice stress analysis
- Behavioral baseline deviation
- Cross-modal consistency checking

Analyze the following multi-modal data to detect deception patterns:

Analysis Depth: ${analysisDepth}

Provide forensic deception analysis in this JSON format:
{
  "overallDeceptionScore": 0-100,
  "confidenceLevel": 0-1,
  "deceptionIndicators": [
    {
      "id": "string",
      "type": "linguistic|vocal|facial|behavioral|cross_modal",
      "indicator": "string",
      "severity": 1-10,
      "confidence": 0-1,
      "evidence": "string",
      "timestamp": "string",
      "context": "string"
    }
  ],
  "linguisticAnalysis": {
    "pronounUsageAnomalies": ["string"],
    "cognitiveComplexityShifts": ["string"],
    "temporalReferenceInconsistencies": ["string"],
    "emotionalLeakage": ["string"],
    "qualifierOveruse": ["string"],
    "negativeEmotionMarkers": ["string"],
    "selfDistancingPatterns": ["string"],
    "overallLinguisticDeceptionScore": 0-100
  },
  "vocalAnalysis": {
    "pitchVariationAnomalies": ["string"],
    "speechRateChanges": ["string"],
    "pausePatternAbnormalities": ["string"],
    "voiceStressIndicators": ["string"],
    "overallVocalDeceptionScore": 0-100
  },
  "facialAnalysis": {
    "microExpressionConflicts": ["string"],
    "asymmetryIndicators": ["string"],
    "timingInconsistencies": ["string"],
    "emotionLeakage": ["string"],
    "overallFacialDeceptionScore": 0-100
  },
  "behavioralAnalysis": {
    "baselineDeviations": [
      {
        "behavior": "string",
        "expected": "string",
        "observed": "string",
        "deviationMagnitude": number
      }
    ],
    "patternBreaks": ["string"],
    "avoidanceBehaviors": ["string"],
    "overallBehavioralDeceptionScore": 0-100
  },
  "crossModalConflicts": [
    {
      "modality1": "string",
      "modality2": "string",
      "conflict": "string",
      "significance": 1-10
    }
  ],
  "storyConsistencyAnalysis": {
    "contradictions": [
      {
        "statement1": "string",
        "statement2": "string",
        "contradictionType": "string",
        "timestamp1": "string",
        "timestamp2": "string"
      }
    ],
    "timelineInconsistencies": ["string"],
    "factualDiscrepancies": ["string"]
  },
  "deceptionTopics": [
    {
      "topic": "string",
      "frequencyOfDeception": number,
      "averageSeverity": number,
      "possibleMotivation": "string"
    }
  ],
  "truthfulTopics": ["string"],
  "deceptionTrend": {
    "direction": "increasing|stable|decreasing",
    "rateOfChange": number,
    "projectedTrajectory": "string"
  },
  "riskAssessment": {
    "overallRisk": "critical|high|moderate|low|minimal",
    "specificRisks": ["string"],
    "potentialConsequences": ["string"]
  },
  "recommendations": [
    {
      "priority": "immediate|high|medium|low",
      "action": "string",
      "rationale": "string",
      "expectedOutcome": "string"
    }
  ],
  "verificationQuestions": [
    {
      "question": "string",
      "targetTopic": "string",
      "expectedResponse": "string",
      "deceptionIndicator": "string"
    }
  ]
}`;

    const contextData = {
      messages: messages || [],
      voiceInsights: voiceInsights || [],
      facialAnalyses: facialAnalyses || [],
      bodyLanguage: bodyLanguage || [],
      behavioralPatterns: behavioralPatterns || [],
      baseline: baseline?.[0] || null,
      previousDeceptions: previousDeceptions || []
    };

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: ENHANCED_DECEPTION_PROMPT },
          { role: 'user', content: JSON.stringify(contextData) }
        ],
        temperature: 0.2,
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
    } catch (e: any) {
      console.error('JSON parse error:', e);
      analysis = { raw: content, parseError: true };
    }

    // Store enhanced deception analysis using upsert for idempotency
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'enhanced_deception_detection',
      result: analysis,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      analysisDepth,
      dataPoints: {
        messages: messages?.length || 0,
        voiceInsights: voiceInsights?.length || 0,
        facialAnalyses: facialAnalyses?.length || 0,
        bodyLanguage: bodyLanguage?.length || 0
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhanced deception detector error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
