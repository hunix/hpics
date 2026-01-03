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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
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

    const systemPrompt = `You are an expert at crafting personalized, professional messages. Generate message templates that feel genuine and contextually appropriate. Consider the relationship type, recent interactions, shared interests, and upcoming events when crafting messages.`;

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
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_message_templates',
            description: 'Create personalized message templates',
            parameters: {
              type: 'object',
              properties: {
                templates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', description: 'Template type: check-in, follow-up, or meeting-request' },
                      subject: { type: 'string', description: 'Email subject line' },
                      body: { type: 'string', description: 'Message body with proper formatting' },
                      context: { type: 'string', description: 'Brief description of when to use this template' },
                    },
                    required: ['type', 'subject', 'body', 'context'],
                  },
                },
              },
              required: ['templates'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'create_message_templates' } },
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      throw new Error('AI gateway error');
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ templates: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-message-templates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
