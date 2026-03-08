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

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'ai-chat-query', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    const { message, conversationHistory } = await req.json();

    // Gather context from the user's data (active contacts only)
    const contextParts: string[] = [];

    // Get active contact stats
    const { count: contactCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    contextParts.push(`Active contacts: ${contactCount || 0}`);

    // Get recent communications
    const { data: recentComms } = await supabase
      .from('communications')
      .select('profile_id, channel, occurred_at, profiles(first_name, last_name)')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(10);

    if (recentComms && recentComms.length > 0) {
      const commSummary = recentComms.map(c => {
        const profile = c.profiles as { first_name?: string; last_name?: string } | null;
        return `${profile?.first_name || ''} ${profile?.last_name || ''} via ${c.channel} on ${new Date(c.occurred_at).toLocaleDateString()}`;
      }).join('; ');
      contextParts.push(`Recent communications: ${commSummary}`);
    }

    // Get upcoming events
    const { data: upcomingEvents } = await supabase
      .from('events')
      .select('title, event_date, profiles(first_name, last_name)')
      .eq('user_id', user.id)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(5);

    if (upcomingEvents && upcomingEvents.length > 0) {
      const eventSummary = upcomingEvents.map(e => {
        const profile = e.profiles as { first_name?: string; last_name?: string } | null;
        return `${e.title} on ${e.event_date}${profile ? ` with ${profile.first_name} ${profile.last_name}` : ''}`;
      }).join('; ');
      contextParts.push(`Upcoming events: ${eventSummary}`);
    }

    // Get active contacts needing follow-up (no contact in 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: staleContacts } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, organization,
        communications(occurred_at)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(100);

    const needsFollowUp = staleContacts?.filter(p => {
      const comms = p.communications as { occurred_at: string }[] | null;
      if (!comms || comms.length === 0) return true;
      const lastContact = new Date(Math.max(...comms.map(c => new Date(c.occurred_at).getTime())));
      return lastContact < thirtyDaysAgo;
    }).slice(0, 5);

    if (needsFollowUp && needsFollowUp.length > 0) {
      const followUpList = needsFollowUp.map(p => `${p.first_name} ${p.last_name}${p.organization ? ` (${p.organization})` : ''}`).join(', ');
      contextParts.push(`Contacts needing follow-up: ${followUpList}`);
    }

    // Get high-value contacts (if relationship scores exist)
    const { data: topContacts } = await supabase
      .from('relationship_scores')
      .select('profile_id, overall_score, profiles(first_name, last_name, organization)')
      .eq('user_id', user.id)
      .order('overall_score', { ascending: false })
      .limit(5);

    if (topContacts && topContacts.length > 0) {
      const topList = topContacts.map(c => {
        const profile = c.profiles as { first_name?: string; last_name?: string; organization?: string } | null;
        return `${profile?.first_name || ''} ${profile?.last_name || ''} (score: ${c.overall_score})`;
      }).join(', ');
      contextParts.push(`Top relationships: ${topList}`);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are an intelligent CRM assistant with access to the user's contact and relationship data.
Your role is to help users:
- Find and filter contacts
- Understand relationship health
- Plan follow-ups and outreach
- Answer questions about their network
- Provide actionable relationship advice

Be concise, helpful, and proactive. When you don't have specific data, suggest what actions the user could take.

Current data context:
${contextParts.join('\n')}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 800,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to get AI response');
    }

    const aiResponse = await response.json();
    const responseContent = aiResponse.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Log usage
    const inputTokens = aiResponse.usage?.prompt_tokens || 0;
    const outputTokens = aiResponse.usage?.completion_tokens || 0;
    
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      function_name: 'ai-chat-query',
      model_name: 'google/gemini-2.5-flash',
      provider: 'google',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      estimated_cost_cents: Math.ceil((inputTokens * 0.000075 + outputTokens * 0.0003) * 100),
      status: 'success'
    });

    return new Response(JSON.stringify({ response: responseContent }), {
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
