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
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Invalid token');

    const { profileId, imageUrls, model = 'google/gemini-2.5-flash' } = await req.json();
    if (!profileId || !imageUrls?.length) throw new Error('Missing required parameters');

    const startTime = Date.now();
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('API key not configured');

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

    const content = [
      { type: "text", text: prompt },
      ...imageUrls.map((url: string) => ({ type: "image_url", image_url: { url } }))
    ];

    const response = await fetch('https://api.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        max_tokens: 2000
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const result = await response.json();
    const responseTime = Date.now() - startTime;

    let analysis;
    try {
      const text = result.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { analysis = null; }

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

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'extract-facial-multiview',
      model_name: model,
      provider: 'lovable',
      estimated_cost_cents: Math.ceil(imageUrls.length * 3),
      input_tokens: result.usage?.prompt_tokens || 0,
      output_tokens: result.usage?.completion_tokens || 0,
      response_time_ms: responseTime,
      status: 'success'
    });

    return new Response(JSON.stringify({ success: true, analysis: analysis.combined }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
