import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";
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
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const { data: claimsData, error: userError } = await (authClient.auth as any).getClaims(token);
    if (userError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    const { profileId, context } = await req.json();

    // Create service client for config lookup
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, userId);

    const systemPrompt = `You are an expert at crafting personalized, professional messages. Generate message templates that feel genuine and contextually appropriate. Consider the relationship type, recent interactions, shared interests, and upcoming events when crafting messages. Return JSON with structure: { "templates": [{ "type": "check-in|follow-up|meeting-request", "subject": "...", "body": "...", "context": "..." }] }`;

    const userPrompt = `Generate 3 personalized message templates for reaching out to:

Name: ${context.name}
Relationship: ${context.relationship || 'contact'}
Organization: ${context.organization || 'Unknown'}
Job Title: ${context.jobTitle || 'Unknown'}
Interests: ${context.interests?.join(', ') || 'None specified'}
Upcoming Events: ${context.upcomingEvents?.map((e: any) => `${e.title} (${e.type}) on ${e.date}`).join(', ') || 'None'}
Recent Discussion Topics: ${context.recentTopics?.join(', ') || 'None'}

Create templates for:
1. A casual check-in message
2. A follow-up message referencing recent interactions or shared interests
3. A meeting/call request message

Make each template feel personal and natural, not generic.`;

    try {
      const aiResponse = await callAI({
        model: aiConfig.speedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        userId,
        functionName: 'generate-message-templates',
        profileId,
        temperature: aiConfig.temperature,
      });

      const result = parseAIJson(aiResponse.content, { templates: [] });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('AI gateway error:', e);
      // Return fallback templates
      const templates = [
        {
          type: 'check-in',
          subject: `Checking in`,
          body: `Hi ${context.name},\n\nI hope this message finds you well! It's been a while since we last connected, and I wanted to reach out to see how things are going.\n\nWould love to catch up when you have a moment.\n\nBest regards`,
          context: 'General check-in message',
        },
        {
          type: 'follow-up',
          subject: `Following up`,
          body: `Hi ${context.name},\n\nI wanted to follow up on our last conversation. I hope everything is progressing well on your end.\n\nLet me know if there's anything I can help with.\n\nBest`,
          context: 'Follow-up after previous interaction',
        },
        {
          type: 'meeting-request',
          subject: `Quick catch-up?`,
          body: `Hi ${context.name},\n\nI'd love to schedule a quick call or coffee to catch up. It would be great to hear what you've been working on lately.\n\nDo you have any availability in the next week or two?\n\nLooking forward to connecting!`,
          context: 'Meeting or call request',
        },
      ];
      
      return new Response(JSON.stringify({ templates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-message-templates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
