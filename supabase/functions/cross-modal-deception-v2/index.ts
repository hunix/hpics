import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeceptionRequest {
  profileId: string;
  userId: string;
  analysisDepth?: 'quick' | 'standard' | 'forensic';
  timeRange?: { start: string; end: string };
}

const DECEPTION_DETECTION_PROMPT = `You are a world-class deception detection expert combining micro-expression analysis, voice stress analysis, linguistic patterns, and behavioral psychology.

Analyze ALL available data for deception indicators using a multimodal approach:

LINGUISTIC DECEPTION MARKERS:
- Pronoun distancing (reduced "I" usage when lying)
- Increased hedging language ("sort of", "kind of", "maybe")
- Reduced detail specificity in deceptive statements
- Tense inconsistencies
- Unusual word choices or overly formal language
- Excessive qualifiers and disclaimers
- Story structure anomalies (non-chronological, missing details)

VOICE STRESS INDICATORS (if voice data available):
- Pitch elevation during stress/deception
- Speech rate changes (faster or slower than baseline)
- Increased pause frequency and duration
- Vocal tremor or shakiness
- Reduced vocal range (monotone)
- Throat clearing or swallowing sounds

FACIAL/BEHAVIORAL INDICATORS (if visual data available):
- Micro-expression leakage (contempt, fear, disgust)
- Asymmetrical facial expressions
- Delayed onset expressions
- Eye movement patterns
- Gaze aversion at critical moments
- Increased blink rate
- Self-soothing gestures

CROSS-MODAL CONTRADICTIONS (highest reliability):
- Voice says positive, face shows negative
- Words claim certainty, voice shows hesitation
- Stated comfort, body shows discomfort
- Claims of agreement, micro-expression shows contempt

Return JSON:
{
  "overall_deception_score": number,
  "confidence": number,
  "risk_level": "low" | "medium" | "high" | "critical",
  "deception_timeline": [
    {
      "timestamp": string,
      "source": string,
      "indicator_type": string,
      "description": string,
      "severity": number,
      "context": string
    }
  ],
  "linguistic_analysis": {
    "pronoun_patterns": {
      "i_pronoun_frequency": number,
      "distancing_score": number,
      "baseline_deviation": number
    },
    "hedging_analysis": {
      "hedge_frequency": number,
      "qualifier_count": number,
      "certainty_score": number
    },
    "detail_analysis": {
      "specificity_score": number,
      "sensory_details": number,
      "temporal_consistency": boolean
    },
    "suspicious_statements": [
      {
        "statement": string,
        "indicators": string[],
        "deception_probability": number
      }
    ]
  },
  "voice_analysis": {
    "pitch_anomalies": number,
    "rate_variations": number,
    "pause_patterns": number,
    "stress_indicators": string[]
  },
  "behavioral_analysis": {
    "micro_expressions_detected": [
      {
        "expression": string,
        "context": string,
        "significance": string
      }
    ],
    "gesture_anomalies": string[],
    "eye_pattern_irregularities": string[]
  },
  "cross_modal_contradictions": [
    {
      "modality_1": string,
      "modality_1_signal": string,
      "modality_2": string,
      "modality_2_signal": string,
      "contradiction_severity": number,
      "interpretation": string
    }
  ],
  "topic_specific_analysis": [
    {
      "topic": string,
      "deception_indicators": number,
      "truth_indicators": number,
      "assessment": string
    }
  ],
  "baseline_comparison": {
    "baseline_established": boolean,
    "significant_deviations": string[],
    "reliability_score": number
  },
  "recommendations": {
    "verification_needed": string[],
    "follow_up_questions": string[],
    "topics_to_probe": string[],
    "evidence_to_gather": string[]
  },
  "manipulation_detection": {
    "manipulation_tactics_detected": string[],
    "gaslighting_indicators": number,
    "guilt_induction_attempts": number,
    "false_flattery_score": number
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, userId, analysisDepth = 'standard', timeRange } = await req.json() as DeceptionRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build time filter
    const timeFilter = timeRange 
      ? `and created_at >= '${timeRange.start}' and created_at <= '${timeRange.end}'`
      : '';

    const limit = analysisDepth === 'forensic' ? 500 : analysisDepth === 'standard' ? 200 : 50;

    // Gather all multimodal data
    const [
      { data: profile },
      { data: messages },
      { data: voiceInsights },
      { data: facialAnalyses },
      { data: bodyLanguage },
      { data: recordings },
      { data: previousDeception }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('messages').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(limit),
      supabase.from('voice_insights').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50),
      supabase.from('facial_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(30),
      supabase.from('body_language_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(30),
      supabase.from('meeting_recordings').select('id, transcription, summary, ai_insights').eq('profile_id', profileId).limit(20),
      supabase.from('deception_analyses').select('*').eq('profile_id', profileId).order('analyzed_at', { ascending: false }).limit(5)
    ]);

    // Compile multimodal data
    const contextData = {
      profile: {
        name: profile?.name,
        relationship: profile?.relationship_type,
        knownFor: profile?.tags
      },
      linguisticData: {
        messages: messages?.map(m => ({
          content: m.content,
          timestamp: m.created_at,
          sentiment: m.ai_analysis?.sentiment,
          direction: m.direction
        })),
        transcriptions: recordings?.filter(r => r.transcription).map(r => r.transcription)
      },
      voiceData: voiceInsights?.map(v => ({
        timestamp: v.created_at,
        emotions: v.emotions,
        stressIndicators: v.raw_analysis?.stress_indicators,
        pitchPatterns: v.raw_analysis?.pitch_patterns
      })),
      facialData: facialAnalyses?.map(f => ({
        timestamp: f.created_at,
        emotions: f.emotions,
        microExpressions: f.micro_expressions,
        authenticity: f.authenticity_markers
      })),
      bodyLanguageData: bodyLanguage?.map(b => ({
        timestamp: b.created_at,
        posture: b.posture_analysis,
        gestures: b.gesture_patterns,
        comfort: b.comfort_indicators
      })),
      previousAnalysis: previousDeception?.map(d => ({
        date: d.analyzed_at,
        score: d.overall_deception_score,
        findings: d.key_findings
      }))
    };

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, userId);

    // Perform deception analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.qualityModel, // Use quality model for deception analysis
        messages: [
          { role: 'system', content: DECEPTION_DETECTION_PROMPT },
          { role: 'user', content: `Perform comprehensive deception analysis on this multimodal data:\n\n${JSON.stringify(contextData, null, 2)}` }
        ],
        temperature: 0.2
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
      analysis = { error: 'Failed to parse deception analysis', raw: content };
    }

    // Store analysis
    const { error: insertError } = await supabase
      .from('deception_analyses')
      .insert({
        profile_id: profileId,
        user_id: userId,
        overall_deception_score: analysis.overall_deception_score,
        confidence: analysis.confidence,
        risk_level: analysis.risk_level,
        linguistic_analysis: analysis.linguistic_analysis,
        voice_analysis: analysis.voice_analysis,
        behavioral_analysis: analysis.behavioral_analysis,
        cross_modal_contradictions: analysis.cross_modal_contradictions,
        manipulation_detection: analysis.manipulation_detection,
        recommendations: analysis.recommendations,
        key_findings: analysis.deception_timeline?.slice(0, 10),
        data_points_analyzed: {
          messages: messages?.length || 0,
          voiceInsights: voiceInsights?.length || 0,
          facialAnalyses: facialAnalyses?.length || 0,
          bodyLanguage: bodyLanguage?.length || 0
        }
      });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Log AI usage with config model
    const aiConfig2 = await getAIConfig(supabase, userId);
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      profile_id: profileId,
      function_name: 'cross-modal-deception-v2',
      model_name: aiConfig2.qualityModel,
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
      dataPointsAnalyzed: {
        messages: messages?.length || 0,
        voiceInsights: voiceInsights?.length || 0,
        facialAnalyses: facialAnalyses?.length || 0,
        bodyLanguage: bodyLanguage?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Deception detection error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
