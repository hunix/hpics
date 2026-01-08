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
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { profileId, context } = await req.json();

    // Get profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, company, title, email, phone')
      .eq('id', profileId)
      .single();

    // Get recent communications for context
    const { data: recentComms } = await supabase
      .from('communications')
      .select('channel, subject, content, occurred_at')
      .eq('profile_id', profileId)
      .order('occurred_at', { ascending: false })
      .limit(3);

    // Get interests
    const { data: interests } = await supabase
      .from('profile_interests')
      .select('interest')
      .eq('profile_id', profileId)
      .limit(5);

    const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'there';
    const interestsList = interests?.map(i => i.interest).join(', ') || '';
    const lastTopics = recentComms?.map(c => c.subject || c.content?.substring(0, 50)).filter(Boolean).join('; ') || '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are a professional relationship manager helping craft personalized outreach messages.
Your goal is to write warm, genuine messages that re-engage contacts who haven't been contacted in a while.

Guidelines:
- Be warm but professional
- Reference something personal if interests are known
- Keep it brief (2-3 sentences for ${context.channel})
- Include a specific call-to-action or question
- Don't be salesy or pushy
- Match the communication channel's typical tone`;

    const userPrompt = `Write a ${context.channel || 'email'} message to reconnect with ${profileName}.

Context:
- Days since last contact: ${context.daysSinceContact}
- Risk level: ${context.riskLevel}
- Their company: ${profile?.company || 'Unknown'}
- Their title: ${profile?.title || 'Unknown'}
- Their interests: ${interestsList || 'Unknown'}
- Recent topics discussed: ${lastTopics || 'None recorded'}

Write ONLY the message body, no subject line or signature.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate draft');
    }

    const aiResponse = await response.json();
    const draft = aiResponse.choices?.[0]?.message?.content || 'Unable to generate message.';

    // Log usage
    const inputTokens = aiResponse.usage?.prompt_tokens || 0;
    const outputTokens = aiResponse.usage?.completion_tokens || 0;
    
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'generate-outreach-draft',
      model_name: 'google/gemini-2.5-flash',
      provider: 'google',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      estimated_cost_cents: Math.ceil((inputTokens * 0.000075 + outputTokens * 0.0003) * 100),
      status: 'success'
    });

    return new Response(JSON.stringify({ draft }), {
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
