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

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'suggest-introductions', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
    let userId: string;
    try {
      const { data: claimsData, error: userError } = await (authClient.auth as any).getClaims(token);
      if (userError || !claimsData?.claims) {
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

    // Fetch all active contacts with their details
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, organization, job_title, relationship_type, notes, tags')
      .eq('user_id', userId)
      .eq('is_active', true);

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
      .eq('user_id', userId);

    if (interestsError) throw interestsError;

    // Fetch skills for all contacts
    const { data: skills, error: skillsError } = await supabaseClient
      .from('contact_skills')
      .select('profile_id, skill_name')
      .eq('user_id', userId);

    if (skillsError) throw skillsError;

    // Build enriched contact data
    const contactsData = profiles.map(profile => ({
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
      organization: profile.organization,
      jobTitle: profile.job_title,
      relationshipType: profile.relationship_type,
      tags: profile.tags || [],
      interests: (interests || []).filter(i => i.profile_id === profile.id).map(i => i.name),
      skills: (skills || []).filter(s => s.profile_id === profile.id).map(s => s.skill_name),
    }));

    // Use AI for intelligent introduction matching
    const systemPrompt = `You are a networking expert AI. Analyze the user's contacts and identify pairs who would benefit from being introduced to each other. Consider:
- Shared interests and hobbies
- Complementary skills (someone looking for expertise + someone who has it)
- Same industry or related industries
- Potential business synergies
- Geographic proximity if mentioned
- Career stage alignment (mentorship opportunities)

Return up to 5 high-value introduction suggestions as JSON:
{ "introductions": [{ "contact1Id": "...", "contact1Name": "...", "contact2Id": "...", "contact2Name": "...", "reason": "...", "potentialValue": 1-10, "suggestedContext": "..." }] }`;

    const userPrompt = `Here are my contacts with their profiles:
${JSON.stringify(contactsData, null, 2)}

Analyze these contacts and suggest which pairs I should introduce to each other, explaining why each introduction would be valuable.`;

    try {
      // Get AI config for model selection
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const aiConfig = await getAIConfig(supabaseService, userId);

      const aiResponse = await callAI({
        model: aiConfig.speedModel, // Use speed model for introductions
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        userId,
        functionName: 'suggest-introductions',
        temperature: aiConfig.temperature,
      });
      const result = parseAIJson(aiResponse.content, { introductions: [] });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('AI gateway error:', e);
      return new Response(JSON.stringify({ introductions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in suggest-introductions:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
