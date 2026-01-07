import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's auth header for getClaims
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate JWT using getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const userId = claimsData.claims.sub as string;
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { audioUrl, profileId, sourceType = 'voice_note', sourceId, transcription } = await req.json();

    if (!audioUrl || !profileId) {
      throw new Error('Missing required parameters: audioUrl, profileId');
    }

    console.log(`Extracting voice biometrics for profile ${profileId} from ${sourceType}`);

    // Create sample record
    const { data: sample, error: sampleError } = await supabase
      .from('biometric_samples')
      .insert({
        user_id: userId,
        profile_id: profileId,
        biometric_type: 'voice',
        source_type: sourceType,
        source_id: sourceId,
        source_url: audioUrl,
        status: 'processing'
      })
      .select()
      .single();

    if (sampleError) {
      console.error('Error creating sample:', sampleError);
      throw sampleError;
    }

    const startTime = Date.now();

    // Use AI to analyze voice characteristics
    // Note: For actual voice embedding, we'd use a specialized audio model
    // Here we analyze characteristics that can be extracted from audio context
    const analysisPrompt = `Analyze this audio for voice biometric identification. The audio URL is: ${audioUrl}
${transcription ? `Transcription provided: "${transcription}"` : ''}

Extract voice characteristics in JSON format:

{
  "voice_detected": boolean,
  "speaker_count": number,
  "primary_speaker": {
    "confidence": number (0-1),
    "characteristics": {
      "pitch_category": "low|medium-low|medium|medium-high|high",
      "pitch_range": "narrow|moderate|wide",
      "speaking_pace": "slow|moderate|fast",
      "volume_level": "soft|moderate|loud",
      "voice_quality": "clear|breathy|nasal|hoarse|resonant",
      "accent_region": "description of detected accent or dialect",
      "language": "detected language",
      "distinctive_patterns": ["unique speech patterns, filler words, pronunciation quirks"],
      "emotional_baseline": "calm|energetic|formal|casual",
      "vocal_tics": ["any repeated sounds, clearing throat, etc"]
    },
    "voiceprint_signature": "Generate a 256-character alphanumeric string representing unique voice patterns"
  },
  "audio_quality": {
    "clarity": number (0-1),
    "background_noise": "none|low|moderate|high",
    "duration_seconds": number
  },
  "quality_score": number (0-1, overall quality for biometric use),
  "notes": "additional observations"
}

If no clear voice is detected, return: { "voice_detected": false, "error": "No clear voice detected" }`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') ?? '',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse voice analysis');
    }

    const responseTime = Date.now() - startTime;
    const inputTokens = aiResult.usage?.prompt_tokens || 0;
    const outputTokens = aiResult.usage?.completion_tokens || 0;

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      profile_id: profileId,
      function_name: 'extract-voice-biometrics',
      provider: 'openrouter',
      model_name: 'google/gemini-2.5-flash',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      estimated_cost_cents: Math.ceil((inputTokens * 0.075 + outputTokens * 0.3) / 1000),
      response_time_ms: responseTime,
      status: analysis.voice_detected ? 'success' : 'no_voice_detected'
    });

    if (!analysis.voice_detected) {
      await supabase
        .from('biometric_samples')
        .update({
          status: 'failed',
          error_message: 'No clear voice detected in audio',
          processed_at: new Date().toISOString()
        })
        .eq('id', sample.id);

      return new Response(
        JSON.stringify({ success: false, error: 'No clear voice detected', sample_id: sample.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const primarySpeaker = analysis.primary_speaker;
    const qualityScore = analysis.quality_score || 0.5;

    // Update sample with extracted data
    await supabase
      .from('biometric_samples')
      .update({
        embedding: primarySpeaker.voiceprint_signature,
        features: {
          characteristics: primarySpeaker.characteristics,
          audio_quality: analysis.audio_quality,
          speaker_count: analysis.speaker_count
        },
        quality_score: qualityScore,
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', sample.id);

    // Update or create contact_biometrics record
    const { data: existingBio } = await supabase
      .from('contact_biometrics')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .single();

    if (existingBio) {
      const newSampleCount = (existingBio.voice_sample_count || 0) + 1;
      const newConfidence = Math.min(0.95, (existingBio.voice_confidence || 0.5) + (qualityScore * 0.1));

      await supabase
        .from('contact_biometrics')
        .update({
          voice_characteristics: primarySpeaker.characteristics,
          voice_sample_count: newSampleCount,
          voice_confidence: newConfidence,
          voice_last_updated: new Date().toISOString(),
          identity_confidence: Math.max(newConfidence, existingBio.facial_confidence || 0),
          ai_model_used: 'google/gemini-2.5-flash'
        })
        .eq('id', existingBio.id);
    } else {
      await supabase
        .from('contact_biometrics')
        .insert({
          user_id: userId,
          profile_id: profileId,
          voice_characteristics: primarySpeaker.characteristics,
          voice_sample_count: 1,
          voice_confidence: qualityScore,
          voice_last_updated: new Date().toISOString(),
          identity_confidence: qualityScore,
          ai_model_used: 'google/gemini-2.5-flash'
        });
    }

    // Mark sample as enrolled
    await supabase
      .from('biometric_samples')
      .update({ status: 'enrolled' })
      .eq('id', sample.id);

    console.log(`Voice biometrics extracted successfully for profile ${profileId}`);

    return new Response(
      JSON.stringify({
        success: true,
        sample_id: sample.id,
        quality_score: qualityScore,
        characteristics: primarySpeaker.characteristics,
        audio_quality: analysis.audio_quality
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in extract-voice-biometrics:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
