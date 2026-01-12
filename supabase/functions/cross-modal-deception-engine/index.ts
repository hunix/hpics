import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeceptionRequest {
  profileId: string;
  userId: string;
  timeRange?: { start: string; end: string };
}

interface DeceptionIndicator {
  type: 'vocal' | 'facial' | 'linguistic' | 'behavioral';
  indicator: string;
  confidence: number;
  timestamp?: string;
  details: string;
}

interface CrossModalConflict {
  modalities: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  deceptionProbability: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { profileId, userId, timeRange } = await req.json() as DeceptionRequest;

    if (!profileId || !userId) {
      return new Response(JSON.stringify({ error: 'profileId and userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gather cross-modal data sources
    const [
      { data: voiceInsights },
      { data: facialAnalyses },
      { data: linguisticPatterns },
      { data: behavioralData },
      { data: bodyLanguage },
    ] = await Promise.all([
      supabase.from('voice_insights')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('media_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['facial_expression', 'micro_expression', 'emotion'])
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'linguistic_patterns')
        .order('generated_at', { ascending: false })
        .limit(10),
      supabase.from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('body_language_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Build cross-modal context
    const modalityData = {
      vocal: (voiceInsights || []).map(v => ({
        stressLevel: v.stress_level,
        emotionalState: v.emotional_state,
        confidenceIndicators: v.confidence_indicators,
        deceptionMarkers: v.deception_markers,
        timestamp: v.created_at,
      })),
      facial: (facialAnalyses || []).map(f => ({
        expressions: f.analysis_result?.expressions,
        microExpressions: f.analysis_result?.microExpressions,
        emotionMismatch: f.analysis_result?.emotionMismatch,
        timestamp: f.created_at,
      })),
      linguistic: (linguisticPatterns || []).map(l => ({
        pronounUsage: l.result?.pronounUsage,
        cognitiveComplexity: l.result?.cognitiveComplexity,
        temporalReferences: l.result?.temporalReferences,
        hedgingPatterns: l.result?.hedgingPatterns,
        deceptionScore: l.result?.deceptionScore,
      })),
      behavioral: (behavioralData || []).map(b => ({
        patterns: b.behavioral_patterns,
        anomalies: b.personality_indicators?.anomalies,
        consistencyScore: b.confidence_score,
      })),
      bodyLanguage: (bodyLanguage || []).map(bl => ({
        posture: bl.posture_analysis,
        gestures: bl.gesture_patterns,
        comfort: bl.comfort_indicators,
        rapportSignals: bl.rapport_signals,
      })),
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { 
            role: 'system', 
            content: `You are an advanced cross-modal deception detection system combining insights from multiple intelligence modalities. Your task is to identify:

1. **CROSS-MODAL CONFLICTS** - Where different modalities contradict each other
   - Verbal content vs. vocal stress patterns
   - Stated emotions vs. facial micro-expressions
   - Claimed confidence vs. behavioral hesitation
   - Body language vs. verbal claims

2. **DECEPTION INDICATORS** by modality:
   - VOCAL: Voice stress, pitch variations, speech rate changes, pause patterns
   - FACIAL: Micro-expression leakage, asymmetry, timing mismatches
   - LINGUISTIC: Pronoun distancing, hedging, cognitive load markers, temporal vagueness
   - BEHAVIORAL: Baseline deviations, inconsistent patterns, stress tells

3. **SYNTHESIS SCORE** - Overall deception probability with confidence intervals

4. **TRUTH INDICATORS** - Signals of genuine communication

Return structured JSON with:
- overallDeceptionProbability (0-1)
- confidenceInterval (low, high)
- crossModalConflicts: array of conflicts with severity
- deceptionIndicators: array by modality
- truthIndicators: array of genuine signals
- temporalPatterns: how deception patterns change over time
- recommendations: investigative next steps`
          },
          { 
            role: 'user', 
            content: `Analyze these cross-modal signals for deception patterns:

VOCAL ANALYSIS (${modalityData.vocal.length} samples):
${JSON.stringify(modalityData.vocal, null, 2)}

FACIAL ANALYSIS (${modalityData.facial.length} samples):
${JSON.stringify(modalityData.facial, null, 2)}

LINGUISTIC PATTERNS:
${JSON.stringify(modalityData.linguistic, null, 2)}

BEHAVIORAL DATA:
${JSON.stringify(modalityData.behavioral, null, 2)}

BODY LANGUAGE:
${JSON.stringify(modalityData.bodyLanguage, null, 2)}

Perform comprehensive cross-modal deception analysis.`
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisContent = aiResponse.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    let analysisResult;
    try {
      const jsonMatch = analysisContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisContent;
      analysisResult = JSON.parse(jsonStr);
    } catch {
      analysisResult = { rawAnalysis: analysisContent };
    }

    // Store the analysis
    await supabase.from('ai_analyses').insert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: 'cross_modal_deception',
      result: {
        ...analysisResult,
        dataQuality: {
          vocalSamples: modalityData.vocal.length,
          facialSamples: modalityData.facial.length,
          linguisticSamples: modalityData.linguistic.length,
          behavioralSamples: modalityData.behavioral.length,
          bodyLanguageSamples: modalityData.bodyLanguage.length,
        },
      },
    });

    const inputTokens = aiResponse.usage?.prompt_tokens || 0;
    const outputTokens = aiResponse.usage?.completion_tokens || 0;
    const costCents = Math.round((inputTokens * 0.00125 + outputTokens * 0.005) * 100);

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      dataQuality: {
        totalSamples: modalityData.vocal.length + modalityData.facial.length + 
                      modalityData.linguistic.length + modalityData.behavioral.length,
        modalityCoverage: [
          modalityData.vocal.length > 0 && 'vocal',
          modalityData.facial.length > 0 && 'facial',
          modalityData.linguistic.length > 0 && 'linguistic',
          modalityData.behavioral.length > 0 && 'behavioral',
        ].filter(Boolean),
      },
      cost: costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Cross-modal deception engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
