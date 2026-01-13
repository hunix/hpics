import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, userId, recordingId, audioUrl, modelTier = 'balanced' } = await req.json();
    
    if (!profileId || !userId) {
      throw new Error('Profile ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch contact info and transcription in parallel
    const [profileResult, recordingResult] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name').eq('id', profileId).single(),
      recordingId ? supabase.from('meeting_recordings').select('transcription, transcription_with_speakers, audio_events').eq('id', recordingId).single() : Promise.resolve({ data: null }),
    ]);

    const profile = profileResult.data;
    const transcription = recordingResult.data?.transcription || '';
    const transcriptionWithSpeakers = recordingResult.data?.transcription_with_speakers || [];

    const systemPrompt = `You are an expert in vocal analysis, paralinguistics, and voice stress analysis. Analyze speech patterns to understand emotional states, stress levels, confidence, and potential deception indicators through voice characteristics.

Focus on:
1. Speech Patterns - Pace, rhythm, fluency, pauses
2. Vocal Tone - Pitch variations, warmth, tension
3. Stress Points - Hesitations, voice cracks, pitch changes under pressure
4. Confidence Indicators - Steady pace, appropriate pauses, clear articulation
5. Mood Changes - Shifts in energy, enthusiasm, engagement
6. Deception Likelihood - Inconsistencies in vocal patterns, micro-tremors
7. Emotional Markers - Joy, fear, anger, sadness in voice

Provide insights for understanding the person's true emotional state and communication patterns.
Respond with valid JSON only.`;

    const userPrompt = `Provide a comprehensive vocal analysis for ${profile?.first_name} ${profile?.last_name || ''}.

${audioUrl ? `Audio URL for reference: ${audioUrl}` : ''}

Transcription with timing data:
${transcription || 'No transcription available'}

Word-level data sample (first 50 words with timing):
${JSON.stringify(transcriptionWithSpeakers.slice(0, 50), null, 2)}

Analyze the vocal patterns and provide results in JSON format:
{
  "speech_patterns": {
    "average_pace": "slow/normal/fast",
    "pace_variations": ["moments of speed changes"],
    "fluency_score": 0-100,
    "filler_words": ["um", "uh", etc with frequency],
    "pause_patterns": {
      "strategic_pauses": ["thoughtful pauses"],
      "hesitation_pauses": ["uncertain pauses"],
      "average_pause_length": "short/medium/long"
    }
  },
  "stress_points": [
    {
      "timestamp_range": "if available",
      "context": "what was being discussed",
      "indicators": ["voice crack", "pitch rise", etc],
      "intensity": 0-100
    }
  ],
  "confidence_indicators": {
    "overall_confidence": 0-100,
    "strong_moments": ["..."],
    "weak_moments": ["..."],
    "authority_markers": ["..."]
  },
  "mood_changes": [
    {
      "phase": "early/middle/late",
      "mood": "...",
      "energy_level": 0-100,
      "engagement": 0-100
    }
  ],
  "hesitation_markers": {
    "frequency": "low/medium/high",
    "types": ["..."],
    "trigger_topics": ["subjects that caused hesitation"]
  },
  "deception_likelihood": {
    "risk_level": "low/medium/high",
    "vocal_inconsistencies": ["..."],
    "stress_spikes": ["..."],
    "confidence": 0-100,
    "disclaimer": "This is probabilistic analysis, not definitive proof"
  },
  "emotional_markers": {
    "dominant_emotion": "...",
    "secondary_emotions": ["..."],
    "emotional_stability": 0-100,
    "authenticity_score": 0-100
  },
  "communication_style": {
    "type": "assertive/passive/aggressive/passive-aggressive",
    "warmth_level": 0-100,
    "professionalism": 0-100
  },
  "recommendations": ["how to interpret and respond to this person"],
  "confidence_score": 0-100,
  "summary": "..."
}`;

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, userId);
    const selectedModel = modelTier === 'quality' ? aiConfig.qualityModel : 
                          modelTier === 'speed' ? aiConfig.speedModel : 
                          aiConfig.defaultModel;

    // Use unified AI client
    const aiResponse = await callAI({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: userId,
      functionName: 'analyze-vocal',
      profileId: profileId,
      recordingId: recordingId,
      temperature: aiConfig.temperature,
      metadata: { hasAudio: !!audioUrl, hasTranscription: !!transcription },
    });

    const parsedAnalysis = parseAIJson(aiResponse.content, {
      speech_patterns: { average_pace: 'normal', fluency_score: 50 },
      stress_points: [],
      confidence_indicators: { overall_confidence: 50 },
      mood_changes: [],
      hesitation_markers: { frequency: 'low' },
      deception_likelihood: { risk_level: 'low', confidence: 30 },
      confidence_score: 30,
      summary: 'Analysis framework provided'
    });

    // Store analysis
    const { data: analysis, error: insertError } = await supabase
      .from('vocal_analyses')
      .insert({
        profile_id: profileId,
        user_id: userId,
        audio_url: audioUrl,
        source_recording_id: recordingId,
        speech_patterns: parsedAnalysis.speech_patterns || null,
        stress_points: parsedAnalysis.stress_points || null,
        mood_changes: parsedAnalysis.mood_changes || null,
        hesitation_markers: parsedAnalysis.hesitation_markers || null,
        confidence_indicators: parsedAnalysis.confidence_indicators || null,
        deception_likelihood: parsedAnalysis.deception_likelihood || null,
        confidence_score: parsedAnalysis.confidence_score || null,
        raw_analysis: parsedAnalysis,
        ai_model_used: aiResponse.model,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      success: true,
      analysis,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Vocal analysis error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
