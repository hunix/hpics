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

  try {
    const { profileId, userId, videoUrl, recordingId, modelTier = 'quality' } = await req.json();
    
    if (!profileId || !userId) {
      throw new Error('Profile ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch contact info and transcription in parallel
    const [profileResult, recordingResult] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name').eq('id', profileId).single(),
      recordingId ? supabase.from('meeting_recordings').select('transcription, transcription_with_speakers').eq('id', recordingId).single() : Promise.resolve({ data: null }),
    ]);

    const profile = profileResult.data;
    const transcription = recordingResult.data?.transcription || '';

    const systemPrompt = `You are an expert in micro-expression analysis, facial action coding system (FACS), and deception detection. Analyze facial expressions and micro-expressions to understand emotional states, stress levels, and potential deception indicators.

Focus on:
1. Micro-expressions - Brief involuntary facial expressions (1/25 to 1/5 of a second)
2. Emotional Timeline - How emotions change throughout the interaction
3. Stress Indicators - Physical manifestations of stress or discomfort
4. Deception Indicators - Asymmetrical expressions, timing inconsistencies, eye behavior
5. Genuine vs Masked Emotions - Detecting when expressions are authentic or performed
6. Baseline Deviations - Changes from their normal expression patterns

Important: This analysis is for professional insight purposes. Always maintain ethical considerations.
Respond with valid JSON only.`;

    const userPrompt = `Provide a facial expression and micro-expression analysis for ${profile?.first_name} ${profile?.last_name || ''}.

${videoUrl ? `Video URL for reference: ${videoUrl}` : 'No video provided - provide framework and what to look for.'}

${transcription ? `Transcription for context and timeline reference:
${transcription.substring(0, 2000)}...` : ''}

Provide analysis in JSON format:
{
  "micro_expressions": [
    {
      "timestamp": "optional",
      "expression_type": "fear/surprise/anger/disgust/sadness/happiness/contempt",
      "duration": "micro/brief/sustained",
      "intensity": 0-100,
      "context": "what was being discussed",
      "interpretation": "what this likely indicates"
    }
  ],
  "emotional_timeline": [
    {
      "phase": "opening/middle/closing",
      "dominant_emotion": "...",
      "secondary_emotions": ["..."],
      "congruence_with_speech": true/false,
      "notes": "..."
    }
  ],
  "stress_indicators": {
    "overall_level": 0-100,
    "physical_signs": ["..."],
    "peak_moments": ["..."],
    "triggers": ["..."]
  },
  "deception_indicators": {
    "risk_level": "low/medium/high",
    "observed_signs": ["..."],
    "incongruent_moments": ["..."],
    "confidence": 0-100,
    "notes": "Important: These are potential indicators, not definitive proof"
  },
  "genuine_expressions": ["moments of authentic emotion"],
  "masked_expressions": ["moments where emotion may have been suppressed"],
  "baseline_observations": {
    "typical_expression": "...",
    "eye_contact_pattern": "...",
    "blink_rate": "normal/elevated/reduced"
  },
  "recommendations": ["how to interpret and use this information ethically"],
  "confidence_score": 0-100,
  "summary": "..."
}`;

    // Use quality tier for facial analysis (needs visual reasoning)
    const aiResponse = await callAI({
      model: selectModel(modelTier as any),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: userId,
      functionName: 'analyze-facial',
      profileId: profileId,
      recordingId: recordingId,
      temperature: 0.5,
      metadata: { hasVideo: !!videoUrl, hasTranscription: !!transcription },
    });

    const parsedAnalysis = parseAIJson(aiResponse.content, { 
      micro_expressions: [],
      emotional_timeline: [],
      stress_indicators: { overall_level: 50 },
      deception_indicators: { risk_level: 'low', confidence: 30 },
      confidence_score: 30,
      summary: 'Analysis framework provided'
    });

    // Store the analysis
    const { data: analysis, error: insertError } = await supabase
      .from('facial_analyses')
      .insert({
        profile_id: profileId,
        user_id: userId,
        video_url: videoUrl,
        source_recording_id: recordingId,
        micro_expressions: parsedAnalysis.micro_expressions || null,
        emotional_timeline: parsedAnalysis.emotional_timeline || null,
        stress_indicators: parsedAnalysis.stress_indicators || null,
        deception_indicators: parsedAnalysis.deception_indicators || null,
        confidence_score: parsedAnalysis.confidence_score || null,
        raw_analysis: parsedAnalysis,
        ai_model_used: aiResponse.model,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Facial analysis error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
