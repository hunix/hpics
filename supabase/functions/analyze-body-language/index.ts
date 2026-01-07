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
    const { profileId, userId, videoUrl, recordingId, modelTier = 'balanced' } = await req.json();
    
    if (!profileId || !userId) {
      throw new Error('Profile ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch contact info and transcription in parallel
    const [profileResult, recordingResult] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, job_title').eq('id', profileId).single(),
      recordingId ? supabase.from('meeting_recordings').select('transcription').eq('id', recordingId).single() : Promise.resolve({ data: null }),
    ]);

    const profile = profileResult.data;
    const transcription = recordingResult.data?.transcription || '';

    const systemPrompt = `You are an expert in body language analysis, kinesics, and non-verbal communication. Analyze body language to understand psychological states, confidence levels, interpersonal dynamics, and hidden communication.

Focus on:
1. Posture Analysis - Open vs closed postures, power poses, submissive indicators
2. Gesture Patterns - Illustrators, emblems, adaptors, regulators
3. Proxemics - Use of personal space and territorial behavior
4. Movement Indicators - Pace, fluidity, nervous movements
5. Rapport Signals - Mirroring, synchrony, approach/avoidance behaviors
6. Comfort Indicators - Self-soothing behaviors, barriers, openness signals
7. Power Dynamics - Dominance/submission cues, status indicators

Provide insights for improving interpersonal interactions and negotiations.
Respond with valid JSON only.`;

    const userPrompt = `Provide a comprehensive body language analysis for ${profile?.first_name} ${profile?.last_name || ''} (${profile?.job_title || 'Unknown role'}).

${videoUrl ? `Video URL for reference: ${videoUrl}` : 'No video provided - provide framework and guidance for what to observe.'}

${transcription ? `Meeting transcription for context:
${transcription.substring(0, 1500)}...` : ''}

Provide analysis in JSON format:
{
  "posture_analysis": {
    "primary_posture": "open/closed/neutral",
    "confidence_indicators": 0-100,
    "changes_observed": ["..."],
    "power_dynamics": "dominant/neutral/submissive",
    "comfort_level": 0-100
  },
  "gesture_patterns": {
    "dominant_gestures": ["..."],
    "illustrators": ["gestures that accompany speech"],
    "adaptors": ["self-soothing or nervous gestures"],
    "barriers": ["arms crossed, object barriers, etc"],
    "openness_signals": ["..."]
  },
  "movement_indicators": {
    "overall_activity": "high/medium/low",
    "nervous_movements": ["..."],
    "confident_movements": ["..."],
    "pace_changes": ["moments of increased/decreased activity"]
  },
  "rapport_signals": {
    "mirroring_observed": true/false,
    "synchrony_level": 0-100,
    "approach_behaviors": ["..."],
    "avoidance_behaviors": ["..."],
    "connection_moments": ["..."]
  },
  "comfort_indicators": {
    "overall_comfort": 0-100,
    "discomfort_triggers": ["..."],
    "self_soothing_behaviors": ["..."],
    "relaxation_signs": ["..."]
  },
  "interpersonal_insights": {
    "relationship_dynamics": "...",
    "trust_indicators": 0-100,
    "engagement_level": 0-100,
    "resistance_signs": ["..."]
  },
  "recommendations": {
    "for_building_rapport": ["..."],
    "for_negotiations": ["..."],
    "watch_for": ["warning signs to monitor"]
  },
  "confidence_score": 0-100,
  "summary": "..."
}`;

    // Use unified AI client
    const aiResponse = await callAI({
      model: selectModel(modelTier as any),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: userId,
      functionName: 'analyze-body-language',
      profileId: profileId,
      recordingId: recordingId,
      temperature: 0.6,
      metadata: { hasVideo: !!videoUrl, hasTranscription: !!transcription },
    });

    const parsedAnalysis = parseAIJson(aiResponse.content, {
      posture_analysis: { primary_posture: 'neutral', comfort_level: 50 },
      gesture_patterns: {},
      movement_indicators: { overall_activity: 'medium' },
      rapport_signals: { synchrony_level: 50 },
      comfort_indicators: { overall_comfort: 50 },
      confidence_score: 30,
      summary: 'Analysis framework provided'
    });

    // Store analysis
    const { data: analysis, error: insertError } = await supabase
      .from('body_language_analyses')
      .insert({
        profile_id: profileId,
        user_id: userId,
        video_url: videoUrl,
        source_recording_id: recordingId,
        posture_analysis: parsedAnalysis.posture_analysis || null,
        gesture_patterns: parsedAnalysis.gesture_patterns || null,
        movement_indicators: parsedAnalysis.movement_indicators || null,
        rapport_signals: parsedAnalysis.rapport_signals || null,
        comfort_indicators: parsedAnalysis.comfort_indicators || null,
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
    console.error('Body language analysis error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
