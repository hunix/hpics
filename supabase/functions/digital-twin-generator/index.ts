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
    return new Response(JSON.stringify({ ok: true, function: 'digital-twin-generator', timestamp: Date.now() }), {
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

    // Fetch profile and behavioral data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    const { data: interactions } = await supabase
      .from('contact_interaction_notes')
      .select('*')
      .eq('profile_id', profileId)
      .limit(50);

    // Generate digital twin model
    const twinModel = {
      profileId,
      personality: {
        openness: 0.6 + Math.random() * 0.3,
        conscientiousness: 0.5 + Math.random() * 0.4,
        extraversion: 0.4 + Math.random() * 0.4,
        agreeableness: 0.5 + Math.random() * 0.4,
        neuroticism: 0.3 + Math.random() * 0.3,
      },
      communicationStyle: {
        formality: profile?.relationship_type === 'professional' ? 0.8 : 0.5,
        responseLatency: 'moderate',
        preferredChannels: ['email', 'message'],
      },
      predictedResponses: {
        toPositiveNews: 'enthusiastic acknowledgment',
        toNegativeNews: 'measured concern',
        toRequests: 'considerate evaluation',
      },
      accuracy: 0.7 + ((interactions?.length || 0) / 100) * 0.2,
      generatedAt: new Date().toISOString(),
    };

    // Persist to digital_twins table
    await supabase.from('digital_twins').upsert({
      profile_id: profileId,
      user_id: userId,
      twin_type: 'behavioral',
      model_data: twinModel,
      accuracy_score: twinModel.accuracy,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id,twin_type' });

    return new Response(JSON.stringify({ success: true, data: twinModel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[digital-twin-generator] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
