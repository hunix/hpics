import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Invalid token');

    const { profileId, signatureUrls, model = 'google/gemini-2.5-flash' } = await req.json();

    const prompt = `Analyze signatures in these images:
1. Stroke patterns and flow
2. Flourishes and decorative elements  
3. Consistency across samples
4. Variation tolerance
5. Distinctive features

JSON:
{
  "stroke_patterns": ["fluid upstroke", "angular peaks"],
  "flourishes": ["initial loop", "underline"],
  "consistency_score": 0.9,
  "variation_tolerance": 0.15,
  "distinctive_features": ["large initial", "trailing underline"],
  "verification_ready": true,
  "signature_profile": "unique signature description"
}`;

    const response = await fetch('https://api.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: [{ type: "text", text: prompt }, ...signatureUrls.map((url: string) => ({ type: "image_url", image_url: { url } }))] }],
        max_tokens: 1500
      })
    });

    const result = await response.json();
    let analysis;
    try { analysis = JSON.parse(result.choices[0].message.content.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch { analysis = null; }

    if (!analysis) {
      return new Response(JSON.stringify({ success: false, error: 'No signature detected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: existing } = await supabase.from('contact_biometrics').select('id, signature_samples_count').eq('user_id', user.id).eq('profile_id', profileId).maybeSingle();
    const newCount = (existing?.signature_samples_count || 0) + signatureUrls.length;

    const data = { signature_features: analysis, signature_samples_count: newCount, signature_confidence: analysis.consistency_score || 0.7, signature_last_updated: new Date().toISOString() };

    if (existing) { await supabase.from('contact_biometrics').update(data).eq('id', existing.id); }
    else { await supabase.from('contact_biometrics').insert({ user_id: user.id, profile_id: profileId, ...data }); }

    return new Response(JSON.stringify({ success: true, analysis }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
