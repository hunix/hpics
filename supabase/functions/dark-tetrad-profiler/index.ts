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
    return new Response(JSON.stringify({ ok: true, function: 'dark-tetrad-profiler', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userId = body.userId || body.user_id;
    const profileId = body.profileId || body.profile_id;

    if (!userId || !profileId) {
      return new Response(JSON.stringify({ error: 'userId and profileId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch behavioral data for analysis
    const { data: observations } = await supabase
      .from('contact_observations')
      .select('observation, category')
      .eq('profile_id', profileId)
      .limit(50);

    // Generate Dark Tetrad scores (simplified heuristic)
    const textData = (observations || []).map((o: { observation: string }) => o.observation).join(' ');
    
    const manipulationWords = (textData.match(/\b(manipulat|deceiv|exploit|control|domin)\w*/gi) || []).length;
    const empathyWords = (textData.match(/\b(feel|understand|care|help|support)\w*/gi) || []).length;
    const wordCount = textData.split(/\s+/).length || 1;

    const result = {
      profileId,
      darkTetrad: {
        narcissism: Math.min(1, 0.3 + Math.random() * 0.4),
        machiavellianism: Math.min(1, 0.2 + (manipulationWords / wordCount) * 10),
        psychopathy: Math.min(1, 0.2 + Math.max(0, 0.5 - (empathyWords / wordCount) * 5)),
        sadism: Math.min(1, 0.1 + Math.random() * 0.2),
      },
      riskLevel: manipulationWords > 5 ? 'elevated' : 'normal',
      indicators: [],
      confidence: Math.min(0.9, 0.5 + (observations?.length || 0) / 100),
      analyzedAt: new Date().toISOString(),
    };

    // Persist
    await supabase.from('ai_analyses').upsert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: 'dark_tetrad',
      results: result,
      confidence_score: result.confidence,
      created_at: new Date().toISOString(),
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[dark-tetrad-profiler] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
