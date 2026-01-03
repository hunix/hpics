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
    const { profileId, userId, recordingId, audioUrl, localEndpoint } = await req.json();
    
    if (!profileId || !userId) {
      throw new Error('Profile ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch contact info
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', profileId)
      .single();

    // Fetch transcription with timing data
    let transcription = '';
    let transcriptionWithSpeakers: any[] = [];
    if (recordingId) {
      const { data: recording } = await supabase
        .from('meeting_recordings')
        .select('transcription, transcription_with_speakers, audio_events')
        .eq('id', recordingId)
        .single();
      transcription = recording?.transcription || '';
      transcriptionWithSpeakers = recording?.transcription_with_speakers || [];
    }

    const systemPrompt = `You are an expert in vocal analysis, paralinguistics, and voice stress analysis. Analyze speech patterns to understand emotional states, stress levels, confidence, and potential deception indicators through voice characteristics.

Focus on:
1. Speech Patterns - Pace, rhythm, fluency, pauses
2. Vocal Tone - Pitch variations, warmth, tension
3. Stress Points - Hesitations, voice cracks, pitch changes under pressure
4. Confidence Indicators - Steady pace, appropriate pauses, clear articulation
5. Mood Changes - Shifts in energy, enthusiasm, engagement
6. Deception Likelihood - Inconsistencies in vocal patterns, micro-tremors
7. Emotional Markers - Joy, fear, anger, sadness in voice

Provide insights for understanding the person's true emotional state and communication patterns.`;

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

    let analysisResult;
    let aiModelUsed = 'lovable-ai/gemini-2.5-flash';

    // Try local endpoint first
    if (localEndpoint) {
      try {
        console.log('Attempting local AI endpoint for vocal analysis:', localEndpoint);
        const localResponse = await fetch(`${localEndpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 4000,
          }),
        });

        if (localResponse.ok) {
          const localResult = await localResponse.json();
          analysisResult = localResult.choices?.[0]?.message?.content;
          aiModelUsed = `local/${localEndpoint}`;
        }
      } catch (localError) {
        console.log('Local endpoint failed:', localError);
      }
    }

    // Fall back to Lovable AI
    if (!analysisResult) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('No AI API key available');
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const result = await response.json();
      analysisResult = result.choices?.[0]?.message?.content;
    }

    // Parse JSON
    let parsedAnalysis;
    try {
      const jsonMatch = analysisResult.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, analysisResult];
      parsedAnalysis = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      parsedAnalysis = { raw_text: analysisResult, parse_error: true };
    }

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
        ai_model_used: aiModelUsed,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      success: true,
      analysis,
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
