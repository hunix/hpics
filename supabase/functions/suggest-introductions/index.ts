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

    // Fetch all contacts with their details
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, organization, job_title, relationship_type, bio, tags')
      .eq('user_id', user.id);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length < 2) {
      return new Response(JSON.stringify({ 
        introductions: [],
        message: 'Need at least 2 contacts to suggest introductions' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch interests for all contacts
    const { data: interests, error: interestsError } = await supabaseClient
      .from('contact_interests')
      .select('profile_id, name, interest_type')
      .eq('user_id', user.id);

    if (interestsError) throw interestsError;

    // Fetch skills for all contacts
    const { data: skills, error: skillsError } = await supabaseClient
      .from('contact_skills')
      .select('profile_id, skill_name')
      .eq('user_id', user.id);

    if (skillsError) throw skillsError;

    // Build enriched contact data
    const contactsData = profiles.map(profile => ({
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
      organization: profile.organization,
      jobTitle: profile.job_title,
      relationshipType: profile.relationship_type,
      bio: profile.bio,
      tags: profile.tags || [],
      interests: (interests || []).filter(i => i.profile_id === profile.id).map(i => i.name),
      skills: (skills || []).filter(s => s.profile_id === profile.id).map(s => s.skill_name),
    }));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      // Fallback: find contacts with overlapping interests/skills/industries
      const introductions: any[] = [];
      
      for (let i = 0; i < contactsData.length; i++) {
        for (let j = i + 1; j < contactsData.length; j++) {
          const c1 = contactsData[i];
          const c2 = contactsData[j];
          
          const sharedInterests = c1.interests.filter(int => 
            c2.interests.some(int2 => int2.toLowerCase() === int.toLowerCase())
          );
          const sharedSkills = c1.skills.filter(skill => 
            c2.skills.some(skill2 => skill2.toLowerCase() === skill.toLowerCase())
          );
          const sameOrg = c1.organization && c2.organization && 
            c1.organization.toLowerCase() === c2.organization.toLowerCase();
          
          if (sharedInterests.length > 0 || sharedSkills.length > 0 || sameOrg) {
            let reason = '';
            if (sharedInterests.length > 0) {
              reason = `Both are interested in ${sharedInterests.slice(0, 2).join(' and ')}`;
            } else if (sharedSkills.length > 0) {
              reason = `Both have skills in ${sharedSkills.slice(0, 2).join(' and ')}`;
            } else if (sameOrg) {
              reason = `Both work at ${c1.organization}`;
            }
            
            introductions.push({
              contact1Id: c1.id,
              contact1Name: c1.name,
              contact2Id: c2.id,
              contact2Name: c2.name,
              reason,
              potentialValue: sharedInterests.length + sharedSkills.length + (sameOrg ? 2 : 0),
              suggestedContext: `Consider introducing them at your next networking event`,
            });
          }
        }
      }

      return new Response(JSON.stringify({ 
        introductions: introductions.sort((a, b) => b.potentialValue - a.potentialValue).slice(0, 5)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI for intelligent introduction matching
    const systemPrompt = `You are a networking expert AI. Analyze the user's contacts and identify pairs who would benefit from being introduced to each other. Consider:
- Shared interests and hobbies
- Complementary skills (someone looking for expertise + someone who has it)
- Same industry or related industries
- Potential business synergies
- Geographic proximity if mentioned
- Career stage alignment (mentorship opportunities)

Return up to 5 high-value introduction suggestions.`;

    const userPrompt = `Here are my contacts with their profiles:
${JSON.stringify(contactsData, null, 2)}

Analyze these contacts and suggest which pairs I should introduce to each other, explaining why each introduction would be valuable.`;

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
            name: 'suggest_introductions',
            description: 'Return introduction suggestions for contact pairs',
            parameters: {
              type: 'object',
              properties: {
                introductions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      contact1Id: { type: 'string' },
                      contact1Name: { type: 'string' },
                      contact2Id: { type: 'string' },
                      contact2Name: { type: 'string' },
                      reason: { type: 'string', description: 'Why these two should meet' },
                      potentialValue: { type: 'number', description: 'Score 1-10 of how valuable this intro could be' },
                      suggestedContext: { type: 'string', description: 'How to frame the introduction' },
                    },
                    required: ['contact1Id', 'contact1Name', 'contact2Id', 'contact2Name', 'reason', 'potentialValue', 'suggestedContext'],
                  },
                },
              },
              required: ['introductions'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_introductions' } },
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      return new Response(JSON.stringify({ introductions: [] }), {
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

    return new Response(JSON.stringify({ introductions: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-introductions:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
