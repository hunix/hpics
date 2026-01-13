import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/platform-config.ts";

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
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { profileId, occasionType, interests, budget } = await req.json();

    // Get more profile context
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, company, title, gender')
      .eq('id', profileId)
      .single();

    // Get personality analysis if available
    const { data: personality } = await supabase
      .from('ai_analyses')
      .select('result')
      .eq('profile_id', profileId)
      .eq('analysis_type', 'personality')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'the recipient';
    const personalityTraits = personality?.result ? JSON.stringify(personality.result) : 'Unknown';

    const systemPrompt = `You are a thoughtful gift advisor who suggests personalized, meaningful gifts.
You always provide practical, purchasable gift ideas with realistic price ranges.

Return a JSON array with exactly 3 gift suggestions. Each suggestion should have:
- name: Short gift name
- description: Brief description (1 sentence)
- priceRange: e.g., "$20-40" 
- reason: Why this fits the person (1 sentence)

Respond ONLY with the JSON array, no markdown or explanations.`;

    const userPrompt = `Suggest 3 gifts for ${profileName} for their ${occasionType}.

Budget: Around $${budget}
Their interests: ${interests.length > 0 ? interests.join(', ') : 'Unknown'}
Their profession: ${profile?.title || 'Unknown'} at ${profile?.company || 'Unknown'}
Gender: ${profile?.gender || 'Unknown'}
Personality traits: ${personalityTraits}

Focus on thoughtful, personalized gifts that show you know them well.`;

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, user.id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.speedModel, // Use speed model for gift suggestions
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate suggestions');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '[]';
    
    // Parse JSON response
    let suggestions = [];
    try {
      // Remove markdown if present
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse gift suggestions:', e, content);
      suggestions = [
        {
          name: "Personalized Gift",
          description: "A thoughtful gift based on their interests",
          priceRange: `$${Math.floor(budget * 0.8)}-${budget}`,
          reason: "Chosen to match their personality"
        }
      ];
    }

    // Log usage
    const inputTokens = aiResponse.usage?.prompt_tokens || 0;
    const outputTokens = aiResponse.usage?.completion_tokens || 0;
    
    // Log usage with config model
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'generate-gift-suggestions',
      model_name: aiConfig.speedModel,
      provider: 'google',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      estimated_cost_cents: Math.ceil((inputTokens * 0.000075 + outputTokens * 0.0003) * 100),
      status: 'success'
    });

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
