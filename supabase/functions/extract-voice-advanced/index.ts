import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, getUserPreferredModel, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Invalid token');

    const { profileId, audioUrls, model: requestedModel } = await req.json();

    // Get user's preferred model or use default
    const analysisType = FUNCTION_TO_ANALYSIS_TYPE['extract-voice-advanced'] || 'voice_analysis';
    const model = requestedModel || await getUserPreferredModel(user.id, analysisType, 'google/gemini-2.5-flash');

    const prompt = `Analyze this voice/audio for speaker profiling:
1. Voice characteristics (pitch range, tone, timbre)
2. Speaking pace and rhythm patterns
3. Emotional baseline (typical emotional tone)
4. Speech patterns (filler words, pauses, accent)
5. Unique vocal identifiers

JSON response:
{
  "speaker_profile": {"pitch_range": "medium", "timbre": "warm", "speaking_pace": "moderate"},
  "emotional_baseline": {"typical_state": "calm", "expressiveness": 0.7},
  "speech_patterns": {"filler_words": ["um", "like"], "pause_frequency": "low"},
  "accent_fingerprint": "American English, Midwest",
  "advanced_voiceprint": "unique vocal characteristics summary"
}

Audio URLs: ${audioUrls.join(', ')}`;

    const aiResponse = await callAI({
      model,
      messages: [{ role: 'user', content: prompt }],
      userId: user.id,
      functionName: 'extract-voice-advanced',
      profileId,
      maxTokens: 1500,
    });

    const analysis: any = parseAIJson(aiResponse.content, null);

    if (!analysis?.speaker_profile) {
      return new Response(JSON.stringify({ success: false, error: 'Voice analysis failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: existing } = await supabase.from('contact_biometrics').select('id, voice_sample_count').eq('user_id', user.id).eq('profile_id', profileId).maybeSingle();
    const newCount = (existing?.voice_sample_count || 0) + audioUrls.length;

    const data = {
      voice_speaker_profile: analysis.speaker_profile,
      voice_emotional_baseline: analysis.emotional_baseline,
      voice_sample_count: newCount,
      voice_confidence: 0.7 + (newCount * 0.05),
      voice_last_updated: new Date().toISOString()
    };

    if (existing) { await supabase.from('contact_biometrics').update(data).eq('id', existing.id); }
    else { await supabase.from('contact_biometrics').insert({ user_id: user.id, profile_id: profileId, ...data }); }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
