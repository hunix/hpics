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

    // Validate JWT using getClaims
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } = await (supabaseClient.auth as any).getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = claimsData.claims.sub as string;
    } catch (authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = { id: userId };

    // Fetch contacts with their last communication
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, relationship_type, last_contact_date, is_favorite')
      .eq('user_id', user.id);

    if (profilesError) throw profilesError;

    // Fetch recent communications
    const { data: communications, error: commsError } = await supabaseClient
      .from('communications')
      .select('profile_id, occurred_at, channel, direction')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false });

    if (commsError) throw commsError;

    // Build context for AI
    const now = new Date();
    const contactsWithActivity = (profiles || []).map(profile => {
      const profileComms = (communications || []).filter(c => c.profile_id === profile.id);
      const lastComm = profileComms[0];
      const lastContactDate = lastComm?.occurred_at || profile.last_contact_date;
      const daysSinceContact = lastContactDate 
        ? Math.floor((now.getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      return {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        relationshipType: profile.relationship_type,
        isFavorite: profile.is_favorite,
        daysSinceContact,
        recentChannels: profileComms.slice(0, 5).map(c => c.channel),
        commCount: profileComms.length,
      };
    });

    // Call Lovable AI for intelligent suggestions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      // Fallback to rule-based suggestions if AI not available
      const suggestions = contactsWithActivity
        .filter(c => c.daysSinceContact > 14)
        .sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return b.daysSinceContact - a.daysSinceContact;
        })
        .slice(0, 5)
        .map(c => ({
          contactId: c.id,
          contactName: c.name,
          priority: c.daysSinceContact > 60 ? 'high' : c.daysSinceContact > 30 ? 'medium' : 'low',
          reason: `It's been ${c.daysSinceContact} days since your last interaction`,
          suggestedAction: `Reach out via ${c.recentChannels[0] || 'email'} to check in`,
          daysSinceContact: c.daysSinceContact,
        }));

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a personal relationship manager AI. Analyze the user's contacts and their communication patterns to suggest who they should follow up with. Consider:
- How long since last contact (priority increases with time)
- Relationship type (family/close friends need more frequent contact)
- Whether the contact is marked as favorite
- Communication patterns and preferred channels

Return suggestions in the exact JSON format specified.`;

    const userPrompt = `Here are my contacts with their activity data:
${JSON.stringify(contactsWithActivity, null, 2)}

Please suggest up to 5 contacts I should follow up with, prioritized by urgency and relationship importance.`;

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
            name: 'suggest_followups',
            description: 'Return follow-up suggestions for contacts',
            parameters: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      contactId: { type: 'string' },
                      contactName: { type: 'string' },
                      priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                      reason: { type: 'string' },
                      suggestedAction: { type: 'string' },
                      daysSinceContact: { type: 'number' },
                    },
                    required: ['contactId', 'contactName', 'priority', 'reason', 'suggestedAction', 'daysSinceContact'],
                  },
                },
              },
              required: ['suggestions'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_followups' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Fallback to rule-based
      const suggestions = contactsWithActivity
        .filter(c => c.daysSinceContact > 14)
        .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
        .slice(0, 5)
        .map(c => ({
          contactId: c.id,
          contactName: c.name,
          priority: c.daysSinceContact > 60 ? 'high' : c.daysSinceContact > 30 ? 'medium' : 'low' as const,
          reason: `It's been ${c.daysSinceContact} days since your last interaction`,
          suggestedAction: 'Send a quick message to check in',
          daysSinceContact: c.daysSinceContact,
        }));

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-followups:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
