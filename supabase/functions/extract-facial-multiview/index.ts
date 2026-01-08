import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, getUserPreferredModel, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";

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
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Invalid token');

    const { profileId, imageUrls, model: requestedModel } = await req.json();
    if (!profileId || !imageUrls?.length) throw new Error('Missing required parameters');

    // Get user's preferred model or use default
    const analysisType = FUNCTION_TO_ANALYSIS_TYPE['extract-facial-multiview'] || 'facial_analysis';
    const model = requestedModel || await getUserPreferredModel(user.id, analysisType, 'google/gemini-2.5-flash');

    // Build prompt for multi-view facial analysis
    const prompt = `Analyze these ${imageUrls.length} facial images for biometric enrollment. For each image, determine:
1. Face angle (front, left_profile, right_profile, left_45, right_45, slight_up, slight_down)
2. Image quality score (0-1)
3. Unique facial identifiers (moles, scars, birthmarks with approximate positions)

Then provide a combined multi-view signature:
- Coverage score (0-1 based on angles captured)
- Estimated age range
- Key distinctive features visible across multiple angles
- Multi-view embedding description (unique characteristics)

Respond in JSON format:
{
  "images": [{"angle": "front", "quality": 0.9, "identifiers": [...]}],
  "combined": {
    "angles_captured": ["front", "left_45"],
    "coverage_score": 0.6,
    "age_estimation": {"range": "30-35", "confidence": 0.8},
    "unique_identifiers": [{"type": "mole", "location": "left_cheek", "visibility": 0.9}],
    "multi_view_signature": "description of distinctive features"
  }
}`;

    // Build message content with images
    const content: any[] = [
      { type: "text", text: prompt },
      ...imageUrls.map((url: string) => ({ type: "image_url", image_url: { url } }))
    ];

    const aiResponse = await callAI({
      model,
      messages: [{ role: 'user', content: JSON.stringify(content) }],
      userId: user.id,
      functionName: 'extract-facial-multiview',
      profileId,
      maxTokens: 2000,
    });

    const analysis: any = parseAIJson(aiResponse.content, null);

    if (!analysis?.combined) {
      return new Response(JSON.stringify({ success: false, error: 'No face detected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update biometrics
    const { data: existing } = await supabase
      .from('contact_biometrics')
      .select('id, facial_sample_count')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .maybeSingle();

    const newSampleCount = (existing?.facial_sample_count || 0) + imageUrls.length;

    const biometricData = {
      facial_multi_angle_data: analysis.combined,
      facial_unique_identifiers: analysis.combined.unique_identifiers,
      facial_age_estimation: analysis.combined.age_estimation,
      facial_sample_count: newSampleCount,
      facial_confidence: analysis.combined.coverage_score,
      facial_last_updated: new Date().toISOString(),
      signature_strength: Math.min((analysis.combined.coverage_score || 0) * 50 + (newSampleCount * 5), 100)
    };

    if (existing) {
      await supabase.from('contact_biometrics').update(biometricData).eq('id', existing.id);
    } else {
      await supabase.from('contact_biometrics').insert({ user_id: user.id, profile_id: profileId, ...biometricData });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysis.combined,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
