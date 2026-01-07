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

    const { imageUrl, profileId, sourceType = 'media', sourceId } = await req.json();

    if (!imageUrl || !profileId) {
      throw new Error('Missing required parameters: imageUrl, profileId');
    }

    console.log(`Extracting facial biometrics for profile ${profileId} from ${sourceType}`);

    // Create sample record
    const { data: sample, error: sampleError } = await supabase
      .from('biometric_samples')
      .insert({
        user_id: userId,
        profile_id: profileId,
        biometric_type: 'face',
        source_type: sourceType,
        source_id: sourceId,
        source_url: imageUrl,
        status: 'processing'
      })
      .select()
      .single();

    if (sampleError) {
      console.error('Error creating sample:', sampleError);
      throw sampleError;
    }

    const startTime = Date.now();

    // Use AI to analyze facial features
    const analysisPrompt = `Analyze this image for facial biometric identification. Extract the following in JSON format:

{
  "faces_detected": number,
  "primary_face": {
    "bounding_box": { "x": number, "y": number, "width": number, "height": number },
    "confidence": number (0-1),
    "landmarks": {
      "left_eye": { "x": number, "y": number },
      "right_eye": { "x": number, "y": number },
      "nose_tip": { "x": number, "y": number },
      "mouth_left": { "x": number, "y": number },
      "mouth_right": { "x": number, "y": number },
      "chin": { "x": number, "y": number }
    },
    "features": {
      "face_shape": "oval|round|square|heart|oblong",
      "skin_tone": "description",
      "eye_color": "description",
      "hair_color": "description",
      "hair_style": "description",
      "facial_hair": "none|stubble|beard|mustache|goatee",
      "glasses": "none|eyeglasses|sunglasses",
      "distinctive_marks": ["description of any moles, scars, birthmarks"],
      "estimated_age_range": "range",
      "expression": "neutral|smiling|serious|etc"
    },
    "embedding_signature": "Generate a 512-character alphanumeric string that represents unique facial geometry patterns"
  },
  "quality_score": number (0-1, based on lighting, angle, clarity),
  "notes": "any additional observations"
}

If no face is detected, return: { "faces_detected": 0, "error": "No face detected" }`;

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
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
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
      throw new Error('Failed to parse facial analysis');
    }

    const responseTime = Date.now() - startTime;
    const inputTokens = aiResult.usage?.prompt_tokens || 0;
    const outputTokens = aiResult.usage?.completion_tokens || 0;

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      profile_id: profileId,
      function_name: 'extract-facial-biometrics',
      provider: 'openrouter',
      model_name: 'google/gemini-2.5-flash',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      estimated_cost_cents: Math.ceil((inputTokens * 0.075 + outputTokens * 0.3) / 1000),
      response_time_ms: responseTime,
      status: analysis.faces_detected > 0 ? 'success' : 'no_face_detected'
    });

    if (analysis.faces_detected === 0) {
      // Update sample as failed
      await supabase
        .from('biometric_samples')
        .update({
          status: 'failed',
          error_message: 'No face detected in image',
          processed_at: new Date().toISOString()
        })
        .eq('id', sample.id);

      return new Response(
        JSON.stringify({ success: false, error: 'No face detected', sample_id: sample.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const primaryFace = analysis.primary_face;
    const qualityScore = analysis.quality_score || 0.5;

    // Update sample with extracted data
    await supabase
      .from('biometric_samples')
      .update({
        embedding: primaryFace.embedding_signature,
        features: {
          landmarks: primaryFace.landmarks,
          features: primaryFace.features,
          bounding_box: primaryFace.bounding_box
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
      // Update existing record - increment sample count
      const newSampleCount = (existingBio.facial_sample_count || 0) + 1;
      const newConfidence = Math.min(0.95, (existingBio.facial_confidence || 0.5) + (qualityScore * 0.1));

      await supabase
        .from('contact_biometrics')
        .update({
          facial_landmarks: primaryFace.landmarks,
          facial_features: primaryFace.features,
          facial_sample_count: newSampleCount,
          facial_confidence: newConfidence,
          facial_last_updated: new Date().toISOString(),
          identity_confidence: Math.max(newConfidence, existingBio.voice_confidence || 0),
          ai_model_used: 'google/gemini-2.5-flash'
        })
        .eq('id', existingBio.id);
    } else {
      // Create new record
      await supabase
        .from('contact_biometrics')
        .insert({
          user_id: userId,
          profile_id: profileId,
          facial_landmarks: primaryFace.landmarks,
          facial_features: primaryFace.features,
          facial_sample_count: 1,
          facial_confidence: qualityScore,
          facial_last_updated: new Date().toISOString(),
          identity_confidence: qualityScore,
          ai_model_used: 'google/gemini-2.5-flash'
        });
    }

    // Mark sample as enrolled
    await supabase
      .from('biometric_samples')
      .update({ status: 'enrolled' })
      .eq('id', sample.id);

    console.log(`Facial biometrics extracted successfully for profile ${profileId}`);

    return new Response(
      JSON.stringify({
        success: true,
        sample_id: sample.id,
        faces_detected: analysis.faces_detected,
        quality_score: qualityScore,
        features: primaryFace.features,
        landmarks: primaryFace.landmarks
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in extract-facial-biometrics:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
