import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel, getUserPreferredModel, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, occasion, priceRange, modelTier = 'balanced' } = await req.json();
    
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch profile, interests, education, skills, and shared experiences in parallel
    const [profileResult, interestsResult, educationResult, skillsResult, experiencesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_interests').select('*').eq('profile_id', profileId),
      supabase.from('education').select('*').eq('profile_id', profileId),
      supabase.from('contact_skills').select('*').eq('profile_id', profileId),
      supabase.from('shared_experiences').select('*').eq('profile_id', profileId).limit(10),
    ]);

    if (profileResult.error) throw profileResult.error;
    
    const profile = profileResult.data;
    const interests = interestsResult.data || [];
    const education = educationResult.data || [];
    const skills = skillsResult.data || [];
    const experiences = experiencesResult.data || [];

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

SHARED EXPERIENCES:
${experiences.length > 0 ? experiences.map(e => `- ${e.title} (${e.experience_type})`).join('\n') : 'No shared experiences'}

${occasion ? `OCCASION: ${occasion}` : ''}
${priceRange ? `PRICE RANGE: ${priceRange}` : 'PRICE RANGE: Any'}

Return a JSON object with a "gifts" array containing 5 gift suggestions. Each gift should have: title, description, reasoning (why it's meaningful), priceRange (budget/moderate/premium/luxury), and category.`;

    // Get user's preferred model for gift suggestions
    const analysisType = FUNCTION_TO_ANALYSIS_TYPE['suggest-gifts'] || 'gift_suggestions';
    const preferredModel = await getUserPreferredModel(profile.user_id, analysisType, selectModel(modelTier as any));

    // Use unified AI client
    const aiResponse = await callAI({
      model: preferredModel,
      messages: [
        { role: 'system', content: 'You are a thoughtful gift suggestion expert. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt }
      ],
      userId: profile.user_id,
      functionName: 'suggest-gifts',
      profileId: profileId,
      temperature: 0.8,
      promptKey: 'GIFT_SUGGESTIONS',
      metadata: { occasion, priceRange },
    });

    const suggestions = parseAIJson(aiResponse.content, { gifts: [] });

    return new Response(JSON.stringify({ 
      success: true, 
      gifts: suggestions.gifts || [],
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
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
