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
    const { profileId, occasion, priceRange } = await req.json();
    
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch profile and interests
    const [profileResult, interestsResult, educationResult, skillsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_interests').select('*').eq('profile_id', profileId),
      supabase.from('education').select('*').eq('profile_id', profileId),
      supabase.from('contact_skills').select('*').eq('profile_id', profileId),
    ]);

    if (profileResult.error) throw profileResult.error;
    
    const profile = profileResult.data;
    const interests = interestsResult.data || [];
    const education = educationResult.data || [];
    const skills = skillsResult.data || [];

    const prompt = `You are a thoughtful gift suggestion expert. Based on the following information about a person, suggest 5 personalized gift ideas.

PERSON PROFILE:
Name: ${profile.first_name} ${profile.last_name || ''}
${profile.job_title ? `Profession: ${profile.job_title}` : ''}
${profile.organization ? `Organization: ${profile.organization}` : ''}
Relationship Type: ${profile.relationship_type || 'Unknown'}
${profile.bio ? `Bio: ${profile.bio}` : ''}

KNOWN INTERESTS:
${interests.length > 0 ? interests.map(i => `- ${i.name} (${i.interest_type})${i.notes ? `: ${i.notes}` : ''}`).join('\n') : 'No specific interests recorded'}

EDUCATION:
${education.length > 0 ? education.map(e => `- ${e.institution_name}${e.field_of_study ? ` - ${e.field_of_study}` : ''}`).join('\n') : 'No education info'}

SKILLS:
${skills.length > 0 ? skills.map(s => s.skill_name).join(', ') : 'No skills recorded'}

${occasion ? `OCCASION: ${occasion}` : ''}
${priceRange ? `PRICE RANGE: ${priceRange}` : 'PRICE RANGE: Any'}

Suggest 5 thoughtful, personalized gift ideas. For each gift, explain WHY it would be meaningful for this specific person based on their profile.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a thoughtful gift suggestion expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'suggest_gifts',
            description: 'Suggest personalized gift ideas',
            parameters: {
              type: 'object',
              properties: {
                gifts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      reasoning: { type: 'string' },
                      priceRange: { type: 'string', enum: ['budget', 'moderate', 'premium', 'luxury'] },
                      category: { type: 'string' }
                    },
                    required: ['title', 'description', 'reasoning', 'priceRange', 'category']
                  }
                }
              },
              required: ['gifts']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_gifts' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));
    
    let suggestions;
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      suggestions = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
    } else if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      suggestions = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } else {
      throw new Error('Unexpected AI response format');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      gifts: suggestions.gifts,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error suggesting gifts:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
