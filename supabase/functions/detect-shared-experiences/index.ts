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
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Validate JWT
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all messages for the user
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, profile_id')
      .eq('user_id', userId);

    if (!conversations || conversations.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        sharedExperiences: [],
        message: 'No conversations found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversationIds = conversations.map(c => c.id);
    const conversationToProfile = new Map(conversations.map(c => [c.id, c.profile_id]));

    // Fetch recent messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, conversation_id, content, sent_at')
      .in('conversation_id', conversationIds)
      .order('sent_at', { ascending: false })
      .limit(500);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        sharedExperiences: [],
        message: 'No messages found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profile names
    const profileIds = [...new Set(conversations.map(c => c.profile_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', profileIds);

    const profileNames = new Map(
      (profiles || []).map(p => [p.id, `${p.first_name} ${p.last_name || ''}`.trim()])
    );

    // Build message content per profile for AI analysis
    const messagesByProfile: Record<string, string[]> = {};
    for (const msg of messages) {
      const profileId = conversationToProfile.get(msg.conversation_id);
      if (profileId && msg.content) {
        if (!messagesByProfile[profileId]) {
          messagesByProfile[profileId] = [];
        }
        messagesByProfile[profileId].push(msg.content);
      }
    }

    // Find profiles with enough content to analyze
    const profilesWithContent = Object.entries(messagesByProfile)
      .filter(([_, msgs]) => msgs.length >= 5)
      .slice(0, 20); // Limit to 20 profiles

    if (profilesWithContent.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        sharedExperiences: [],
        message: 'Not enough message data'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to detect shared experiences
    const prompt = `Analyze these conversations with different contacts and identify shared experiences (events, places, activities they attended together or discussed attending).

CONTACTS AND SAMPLE MESSAGES:
${profilesWithContent.map(([profileId, msgs]) => 
  `Contact: ${profileNames.get(profileId) || 'Unknown'} (ID: ${profileId})\nMessages:\n${msgs.slice(0, 10).join('\n')}`
).join('\n\n---\n\n')}

Identify any shared experiences mentioned across conversations. Look for:
- Events they attended together (conferences, parties, meetings)
- Places they visited together (restaurants, trips, venues)
- Activities they did together (sports, hobbies, projects)
- Mutual references to the same events/places`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an experience detection AI. Identify shared experiences from conversations.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'detect_shared_experiences',
            description: 'Detect shared experiences from conversation analysis',
            parameters: {
              type: 'object',
              properties: {
                experiences: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Name/title of the shared experience' },
                      type: { type: 'string', enum: ['event', 'trip', 'activity', 'meeting', 'project', 'other'] },
                      profileIds: { type: 'array', items: { type: 'string' }, description: 'Profile IDs involved' },
                      description: { type: 'string' },
                      approximateDate: { type: 'string', description: 'Approximate date if mentioned' },
                      confidence: { type: 'number', description: 'Confidence score 0-1' }
                    },
                    required: ['title', 'type', 'profileIds', 'description', 'confidence']
                  }
                }
              },
              required: ['experiences']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'detect_shared_experiences' } }
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI analysis failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    let detected: { experiences: any[] } = { experiences: [] };
    
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      detected = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    }

    // Save high-confidence experiences
    const savedExperiences = [];
    for (const exp of detected.experiences) {
      if (exp.confidence >= 0.6 && exp.profileIds.length > 0) {
        // Save to each profile involved
        for (const profileId of exp.profileIds) {
          const { data: existing } = await supabase
            .from('shared_experiences')
            .select('id')
            .eq('profile_id', profileId)
            .eq('title', exp.title)
            .single();

          if (!existing) {
            const { data: inserted } = await supabase
              .from('shared_experiences')
              .insert({
                user_id: userId,
                profile_id: profileId,
                title: exp.title,
                experience_type: exp.type,
                description: exp.description,
                experience_date: exp.approximateDate || null,
                source: 'ai_detected',
              })
              .select()
              .single();

            if (inserted) savedExperiences.push(inserted);
          }
        }
      }
    }

    console.log(`Detected ${detected.experiences.length} experiences, saved ${savedExperiences.length}`);

    return new Response(JSON.stringify({ 
      success: true,
      detected: detected.experiences,
      savedCount: savedExperiences.length,
      analyzedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error detecting shared experiences:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
