import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Invalid token');

    const { profileId, imageUrls, model = 'google/gemini-2.5-flash' } = await req.json();

    const prompt = `Analyze these full-body images for biometric profiling:
1. Estimate height (if reference objects visible)
2. Body type classification
3. Body proportions
4. Posture patterns
5. Any distinctive physical characteristics

JSON response:
{
  "estimated_height": {"cm": 175, "confidence": 0.7, "reference_used": "door frame"},
  "body_type": "athletic",
  "proportions": {"torso_leg_ratio": 0.9, "arm_span_ratio": 1.0},
  "posture_profile": {"typical_stance": "upright", "shoulder_alignment": "level"},
  "distinctive_features": ["tall stature", "broad shoulders"]
}`;

    const response = await fetch('https://api.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: [{ type: "text", text: prompt }, ...imageUrls.map((url: string) => ({ type: "image_url", image_url: { url } }))] }],
        max_tokens: 1500
      })
    });

    const result = await response.json();
    let analysis;
    try {
      const text = result.choices[0].message.content;
      analysis = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    } catch { analysis = null; }

    if (!analysis) {
      return new Response(JSON.stringify({ success: false, error: 'Analysis failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: existing } = await supabase.from('contact_biometrics').select('id').eq('user_id', user.id).eq('profile_id', profileId).maybeSingle();
    
    const data = { body_measurements: analysis, body_language_baseline: analysis.posture_profile };
    if (existing) {
      await supabase.from('contact_biometrics').update(data).eq('id', existing.id);
    } else {
      await supabase.from('contact_biometrics').insert({ user_id: user.id, profile_id: profileId, ...data });
    }

    return new Response(JSON.stringify({ success: true, analysis }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
