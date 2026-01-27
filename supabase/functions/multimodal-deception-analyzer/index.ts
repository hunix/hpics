import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'multimodal-deception-analyzer', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;
    const modalities = body.modalities || ['text'];
    const text = body.text || body.content;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze deception markers across modalities
    const modalityScores: Record<string, number> = {};
    let fusedMarkers: Array<{ type: string; indicator: string; weight: number }> = [];
    let cognitiveLoadScore = 0.5;

    if (modalities.includes('text') && text) {
      // Text-based deception analysis
      const hedgeWords = (text.match(/\b(maybe|perhaps|possibly|might|could|I think)\b/gi) || []).length;
      const certaintyMarkers = (text.match(/\b(definitely|absolutely|never|always)\b/gi) || []).length;
      const negations = (text.match(/\b(not|no|never|nothing)\b/gi) || []).length;
      
      const wordCount = text.split(/\s+/).length || 1;
      const hedgeRate = hedgeWords / wordCount;
      const certaintyRate = certaintyMarkers / wordCount;
      
      modalityScores['text'] = Math.min(1, hedgeRate * 5 + certaintyRate * 3 + (negations / wordCount) * 2);
      
      if (hedgeRate > 0.05) fusedMarkers.push({ type: 'hedge', indicator: 'High hedge word frequency', weight: 0.3 });
      if (certaintyRate > 0.03) fusedMarkers.push({ type: 'certainty', indicator: 'Overuse of certainty markers', weight: 0.4 });
      
      cognitiveLoadScore = Math.min(1, hedgeRate * 3 + certaintyRate * 2);
    }

    // Calculate fused deception probability
    const scores = Object.values(modalityScores);
    const deceptionProbability = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0.3;
    
    const confidence = Math.min(1, 0.5 + (text?.length || 0) / 1000);

    const result = {
      deceptionProbability,
      confidence,
      modalityScores,
      fusedMarkers,
      cognitiveLoadScore,
      analyzedAt: new Date().toISOString(),
    };

    // Persist to deception_analyses
    if (profileId) {
      await supabase.from('deception_analyses').upsert({
        profile_id: profileId,
        user_id: userId,
        source_id: `multimodal-${Date.now()}`,
        modality: modalities.join(','),
        deception_probability: deceptionProbability,
        confidence,
        cognitive_load_score: cognitiveLoadScore,
        markers: { fusedMarkers, modalityScores },
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[multimodal-deception-analyzer] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
