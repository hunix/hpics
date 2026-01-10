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
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = claimsData.claims.sub as string;
    } catch (authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      mediaUrl, 
      matchType, // 'face' or 'voice'
      sourceType,
      sourceId,
      autoTag = false,
      autoTagThreshold = 0.85 
    } = await req.json();

    if (!mediaUrl || !matchType) {
      throw new Error('Missing required parameters: mediaUrl, matchType');
    }

    console.log(`Matching ${matchType} biometrics from ${sourceType || 'unknown source'}`);

    const startTime = Date.now();

    // Get all existing biometric profiles for comparison
    const { data: existingBiometrics, error: bioError } = await supabase
      .from('contact_biometrics')
      .select(`
        id,
        profile_id,
        facial_features,
        facial_multi_angle_data,
        facial_landmarks,
        facial_confidence,
        voice_characteristics,
        voice_confidence,
        profiles:profile_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId);

    if (bioError) {
      console.error('Error fetching biometrics:', bioError);
      throw bioError;
    }

    if (!existingBiometrics || existingBiometrics.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          matches: [], 
          message: 'No biometric profiles to match against' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build comparison context - check both facial_features and facial_multi_angle_data
    const profileDescriptions = existingBiometrics.map(bio => {
      const profile = bio.profiles as any;
      const bioAny = bio as any;
      
      if (matchType === 'face') {
        // Check both facial_features and facial_multi_angle_data for matching
        const features = bio.facial_features || bioAny.facial_multi_angle_data;
        if (features) {
          return {
            profileId: bio.profile_id,
            name: profile?.name || 'Unknown',
            features: features,
            multiViewSignature: bioAny.facial_multi_angle_data?.multi_view_signature,
            anglesAvailable: bioAny.facial_multi_angle_data?.angles_captured,
            confidence: bio.facial_confidence
          };
        }
      } else if (matchType === 'voice' && bio.voice_characteristics) {
        return {
          profileId: bio.profile_id,
          name: profile?.name || 'Unknown',
          characteristics: bio.voice_characteristics,
          confidence: bio.voice_confidence
        };
      }
      return null;
    }).filter(Boolean);

    if (profileDescriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          matches: [], 
          message: `No ${matchType} biometric profiles to match against` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to compare against existing profiles
    const matchPrompt = matchType === 'face' 
      ? `Analyze the face in this image and compare it against these known profiles.

Known profiles with facial features:
${JSON.stringify(profileDescriptions, null, 2)}

For each known profile, determine if the face in the image matches based on:
- Face shape and structure
- Eye characteristics
- Nose and mouth features
- Distinctive marks
- Overall facial geometry

Return matches in JSON format:
{
  "face_detected": boolean,
  "matches": [
    {
      "profile_id": "uuid",
      "profile_name": "name",
      "confidence": number (0-1),
      "matching_features": ["list of matching features"],
      "differing_features": ["list of features that don't match"]
    }
  ],
  "best_match": {
    "profile_id": "uuid or null",
    "confidence": number
  },
  "notes": "explanation of matching logic"
}

Sort matches by confidence descending. Only include matches with confidence > 0.3.
If no face is detected, set face_detected to false.`
      : `Analyze the voice in this audio and compare it against these known voice profiles.

Audio URL: ${mediaUrl}

Known profiles with voice characteristics:
${JSON.stringify(profileDescriptions, null, 2)}

For each known profile, determine if the voice matches based on:
- Pitch and tone
- Speaking pace
- Accent patterns
- Voice quality
- Distinctive speech patterns

Return matches in JSON format:
{
  "voice_detected": boolean,
  "matches": [
    {
      "profile_id": "uuid",
      "profile_name": "name",
      "confidence": number (0-1),
      "matching_characteristics": ["list of matching voice traits"],
      "differing_characteristics": ["list of traits that don't match"]
    }
  ],
  "best_match": {
    "profile_id": "uuid or null",
    "confidence": number
  },
  "notes": "explanation of matching logic"
}

Sort matches by confidence descending. Only include matches with confidence > 0.3.`;

    const messages = matchType === 'face' 
      ? [
          {
            role: 'user',
            content: [
              { type: 'text', text: matchPrompt },
              { type: 'image_url', image_url: { url: mediaUrl } }
            ]
          }
        ]
      : [{ role: 'user', content: matchPrompt }];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') ?? '',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
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
      throw new Error('Failed to parse match analysis');
    }

    const responseTime = Date.now() - startTime;
    const inputTokens = aiResult.usage?.prompt_tokens || 0;
    const outputTokens = aiResult.usage?.completion_tokens || 0;

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'match-biometrics',
      provider: 'openrouter',
      model_name: 'google/gemini-2.5-flash',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      estimated_cost_cents: Math.ceil((inputTokens * 0.075 + outputTokens * 0.3) / 1000),
      response_time_ms: responseTime,
      status: 'success',
      prompt_summary: `${matchType} biometric matching`
    });

    const detected = matchType === 'face' ? analysis.face_detected : analysis.voice_detected;
    
    if (!detected) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          detected: false,
          matches: [],
          message: `No ${matchType} detected in media`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const matches = analysis.matches || [];
    const bestMatch = analysis.best_match;

    // Log the match attempt
    const { data: matchRecord } = await supabase
      .from('biometric_matches')
      .insert({
        user_id: userId,
        source_type: sourceType || 'unknown',
        source_id: sourceId,
        match_type: matchType,
        matched_profile_id: bestMatch?.profile_id || null,
        confidence_score: bestMatch?.confidence || 0,
        alternative_matches: matches.slice(1), // Store alternatives
        auto_tagged: false
      })
      .select()
      .single();

    // Auto-tag if enabled and confidence is high enough
    let autoTagged = false;
    if (autoTag && bestMatch?.profile_id && bestMatch.confidence >= autoTagThreshold && sourceId) {
      // Check if it's a media item and tag it
      if (sourceType === 'media') {
        const { error: tagError } = await supabase
          .from('media_contact_tags')
          .upsert({
            media_id: sourceId,
            profile_id: bestMatch.profile_id,
            user_id: userId,
            confidence: bestMatch.confidence,
            auto_detected: true
          }, {
            onConflict: 'media_id,profile_id'
          });

        if (!tagError) {
          autoTagged = true;
          // Update match record
          await supabase
            .from('biometric_matches')
            .update({ auto_tagged: true })
            .eq('id', matchRecord.id);
        }
      }
    }

    console.log(`Biometric matching complete. Best match: ${bestMatch?.profile_id || 'none'} (${bestMatch?.confidence || 0})`);

    return new Response(
      JSON.stringify({
        success: true,
        detected: true,
        matches,
        best_match: bestMatch,
        auto_tagged: autoTagged,
        match_id: matchRecord?.id,
        notes: analysis.notes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in match-biometrics:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
