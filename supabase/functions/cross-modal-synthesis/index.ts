import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({
      ok: true,
      function: 'cross-modal-synthesis',
      timestamp: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all modal analyses in parallel
    const [
      { data: vocalAnalyses },
      { data: facialAnalyses },
      { data: bodyLanguageAnalyses },
      { data: behavioralAnalyses },
      { data: profile },
      { data: psychProfile },
    ] = await Promise.all([
      supabase.from('vocal_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('facial_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('body_language_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('psychological_profiles').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
    ]);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build multi-modal context
    const modalContext = {
      vocal: vocalAnalyses?.map(v => ({
        date: v.created_at,
        confidence: v.confidence_score,
        emotional_state: v.emotional_state,
        deception_indicators: v.deception_indicators,
        stress_markers: v.stress_markers,
        personality_traits: v.personality_from_voice,
      })) || [],
      facial: facialAnalyses?.map(f => ({
        date: f.created_at,
        confidence: f.confidence_score,
        emotions: f.emotion_analysis,
        microexpressions: f.microexpression_analysis,
        authenticity: f.authenticity_score,
        deception_indicators: f.deception_indicators,
      })) || [],
      body_language: bodyLanguageAnalyses?.map(b => ({
        date: b.created_at,
        confidence: b.confidence_score,
        posture: b.posture_analysis,
        gestures: b.gesture_patterns,
        comfort: b.comfort_indicators,
        rapport: b.rapport_signals,
      })) || [],
      behavioral: behavioralAnalyses?.map(b => ({
        date: b.created_at,
        confidence: b.confidence_score,
        personality: b.personality_indicators,
        patterns: b.behavioral_patterns,
      })) || [],
      psychological_profile: psychProfile?.[0] || null,
    };

    // Check if we have enough data
    const totalDataPoints = 
      (vocalAnalyses?.length || 0) + 
      (facialAnalyses?.length || 0) + 
      (bodyLanguageAnalyses?.length || 0) + 
      (behavioralAnalyses?.length || 0);

    if (totalDataPoints < 2) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient data for cross-modal synthesis',
        available_data: {
          vocal: vocalAnalyses?.length || 0,
          facial: facialAnalyses?.length || 0,
          body_language: bodyLanguageAnalyses?.length || 0,
          behavioral: behavioralAnalyses?.length || 0,
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert multi-modal behavioral analyst. Your task is to synthesize insights from multiple data modalities (voice, face, body language, behavioral patterns) to create a unified, comprehensive understanding of an individual.

Key analysis objectives:
1. CORROBORATION: Identify traits/patterns that appear consistently across multiple modalities (higher confidence)
2. CONTRADICTIONS: Flag inconsistencies between modalities (potential deception, context-dependent behavior, or analysis errors)
3. UNIQUE INSIGHTS: Extract insights only visible when combining modalities
4. CONFIDENCE BOOSTING: Increase confidence for findings supported by multiple sources
5. DECEPTION DETECTION: Cross-correlate deception indicators from voice, face, and body language

Be precise, evidence-based, and note the strength of evidence for each finding.`;

    const userPrompt = `Perform cross-modal synthesis for ${profile.first_name} ${profile.last_name || ''} using the following multi-modal data:

${JSON.stringify(modalContext, null, 2)}

Synthesize these modalities to produce:
1. Corroborated personality traits (traits confirmed by 2+ modalities)
2. Detected contradictions (where modalities disagree)
3. Unified emotional baseline
4. Cross-modal deception assessment
5. Confidence-boosted insights
6. Overall synthesis summary`;

    // Use quality tier for comprehensive analysis
    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      userId: user.id,
      functionName: 'cross-modal-synthesis',
      profileId,
      temperature: 0.3,
      maxTokens: 3000,
      metadata: {
        modalities_available: {
          vocal: vocalAnalyses?.length || 0,
          facial: facialAnalyses?.length || 0,
          body_language: bodyLanguageAnalyses?.length || 0,
          behavioral: behavioralAnalyses?.length || 0,
        },
      },
    });

    // Parse the response
    const synthesis = parseAIJson(aiResponse.content, {
      corroborated_traits: [],
      contradictions: [],
      emotional_baseline: {},
      deception_assessment: {},
      confidence_boosted_insights: [],
      summary: 'Unable to parse synthesis',
    });

    // Calculate overall confidence based on data availability and agreement
    const modalitiesUsed = [
      vocalAnalyses?.length ? 'vocal' : null,
      facialAnalyses?.length ? 'facial' : null,
      bodyLanguageAnalyses?.length ? 'body_language' : null,
      behavioralAnalyses?.length ? 'behavioral' : null,
    ].filter(Boolean);

    const overallConfidence = Math.min(
      95,
      50 + (modalitiesUsed.length * 10) + (totalDataPoints * 2)
    );

    // Store synthesis result
    const synthesisResult = {
      profile_id: profileId,
      user_id: user.id,
      synthesis_type: 'cross_modal',
      modalities_used: modalitiesUsed,
      data_points_analyzed: totalDataPoints,
      corroborated_traits: synthesis.corroborated_traits,
      contradictions: synthesis.contradictions,
      emotional_baseline: synthesis.emotional_baseline,
      deception_assessment: synthesis.deception_assessment,
      confidence_boosted_insights: synthesis.confidence_boosted_insights,
      summary: synthesis.summary,
      overall_confidence: overallConfidence,
      ai_model_used: aiResponse.model,
      cost_cents: aiResponse.costCents,
      created_at: new Date().toISOString(),
    };

    const { data: savedSynthesis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        analysis_type: 'cross_modal_synthesis',
        result: synthesisResult,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving synthesis:', saveError);
    }

    return new Response(JSON.stringify({
      success: true,
      synthesis: synthesisResult,
      metadata: {
        modalities_used: modalitiesUsed,
        data_points: totalDataPoints,
        confidence: overallConfidence,
        cost_cents: aiResponse.costCents,
        response_time_ms: aiResponse.responseTimeMs,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cross-modal synthesis error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
