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

    const { profileId, documentUrls, model = 'google/gemini-2.5-flash' } = await req.json();

    const prompt = `Analyze handwriting in these document images:
1. Letter formations and style
2. Slant angle (degrees from vertical)
3. Baseline consistency
4. Spacing patterns
5. Unique quirks (crossed 7s, looped letters, etc.)

JSON:
{
  "slant_angle": -5,
  "baseline_consistency": 0.85,
  "letter_formations": {"a": "open loop", "g": "curved tail"},
  "spacing": {"word_spacing": "normal", "letter_spacing": "tight"},
  "unique_quirks": ["crossed_7", "looped_l", "open_e"],
  "handwriting_signature": "summary of distinctive patterns"
}`;

    const response = await fetch('https://api.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: [{ type: "text", text: prompt }, ...documentUrls.map((url: string) => ({ type: "image_url", image_url: { url } }))] }],
        max_tokens: 1500
      })
    });

    const result = await response.json();
    let analysis;
    try { analysis = JSON.parse(result.choices[0].message.content.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch { analysis = null; }

    if (!analysis) {
      return new Response(JSON.stringify({ success: false, error: 'No handwriting detected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: existing } = await supabase.from('contact_biometrics').select('id, handwriting_samples_count').eq('user_id', user.id).eq('profile_id', profileId).maybeSingle();
    const newCount = (existing?.handwriting_samples_count || 0) + documentUrls.length;

    const data = { handwriting_features: analysis, handwriting_samples_count: newCount, handwriting_confidence: 0.6 + (newCount * 0.1), handwriting_last_updated: new Date().toISOString() };

    if (existing) { await supabase.from('contact_biometrics').update(data).eq('id', existing.id); }
    else { await supabase.from('contact_biometrics').insert({ user_id: user.id, profile_id: profileId, ...data }); }

    return new Response(JSON.stringify({ success: true, analysis }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
