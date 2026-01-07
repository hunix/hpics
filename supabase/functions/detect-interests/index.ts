import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, modelTier = 'speed' } = await req.json();
    
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all available data for this profile in parallel
    const [profileResult, communicationsResult, educationResult, skillsResult, experiencesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(50),
      supabase.from('education').select('*').eq('profile_id', profileId),
      supabase.from('contact_skills').select('*').eq('profile_id', profileId),
      supabase.from('shared_experiences').select('*').eq('profile_id', profileId),
    ]);

    if (profileResult.error) throw profileResult.error;
    
    const profile = profileResult.data;
    const communications = communicationsResult.data || [];
    const education = educationResult.data || [];
    const skills = skillsResult.data || [];
    const experiences = experiencesResult.data || [];

    const prompt = `Analyze this person's profile and detect their likely interests, hobbies, and preferences.

PROFILE:
Name: ${profile.first_name} ${profile.last_name || ''}
${profile.job_title ? `Job: ${profile.job_title}` : ''}
${profile.organization ? `Organization: ${profile.organization}` : ''}
${profile.bio ? `Bio: ${profile.bio}` : ''}
${profile.notes ? `Notes: ${profile.notes}` : ''}

EDUCATION:
${education.length > 0 ? education.map(e => `- ${e.institution_name}${e.field_of_study ? ` - ${e.field_of_study}` : ''}${e.activities ? ` (Activities: ${e.activities})` : ''}`).join('\n') : 'No education data'}

SKILLS:
${skills.length > 0 ? skills.map(s => s.skill_name).join(', ') : 'No skills data'}

COMMUNICATION SUBJECTS:
${communications.filter(c => c.subject).slice(0, 20).map(c => `- ${c.subject}`).join('\n') || 'No subjects available'}

SHARED EXPERIENCES:
${experiences.length > 0 ? experiences.map(e => `- ${e.title} (${e.experience_type})`).join('\n') : 'No experiences recorded'}

Based on all available information, identify likely interests and hobbies. Categorize each as: hobby, topic, brand, food, travel, sport, music, or other.
For each interest, provide a confidence score (0-1) based on how strongly the evidence supports it.

Return JSON: { "interests": [{ "name": "...", "type": "...", "confidence": 0.0-1.0, "reasoning": "..." }] }`;

    // Use unified AI client with speed tier for quick detection
    const aiResponse = await callAI({
      model: selectModel(modelTier as any),
      messages: [
        { role: 'system', content: 'You are an interest detection AI. Analyze profiles to identify likely interests and hobbies. Respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      userId: profile.user_id,
      functionName: 'detect-interests',
      profileId: profileId,
      temperature: 0.5,
      metadata: { dataPoints: communications.length + education.length + skills.length },
    });

    const detected = parseAIJson(aiResponse.content, { interests: [] });

    // Store detected interests (only high confidence ones)
    const allInterests = (detected.interests || []) as Array<{ name: string; type: string; confidence: number; reasoning: string }>;
    const highConfidenceInterests = allInterests.filter(i => i.confidence >= 0.6);
    
    if (highConfidenceInterests.length > 0) {
      for (const interest of highConfidenceInterests) {
        await supabase.from('contact_interests')
          .upsert({
            user_id: profile.user_id,
            profile_id: profileId,
            interest_type: interest.type,
            name: interest.name,
            notes: interest.reasoning,
            source: 'ai_detected',
            confidence_score: interest.confidence
          }, { 
            onConflict: 'profile_id,name',
            ignoreDuplicates: true 
          });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      detectedInterests: detected.interests || [],
      savedCount: highConfidenceInterests.length,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error detecting interests:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
