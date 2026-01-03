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
    const { profileId } = await req.json();
    
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all available data for this profile
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

For each interest, provide a confidence score (0-1) based on how strongly the evidence supports it.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an interest detection AI. Analyze profiles to identify likely interests and hobbies.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'detect_interests',
            description: 'Detect interests from profile data',
            parameters: {
              type: 'object',
              properties: {
                interests: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string', enum: ['hobby', 'topic', 'brand', 'food', 'travel', 'sport', 'music', 'other'] },
                      confidence: { type: 'number' },
                      reasoning: { type: 'string' }
                    },
                    required: ['name', 'type', 'confidence', 'reasoning']
                  }
                }
              },
              required: ['interests']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'detect_interests' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));
    
    let detected;
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      detected = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
    } else {
      throw new Error('Unexpected AI response format');
    }

    // Get user_id from profile
    const userId = profile.user_id;

    // Store detected interests (only high confidence ones)
    const highConfidenceInterests = detected.interests.filter((i: any) => i.confidence >= 0.6);
    
    if (highConfidenceInterests.length > 0) {
      const interestsToInsert = highConfidenceInterests.map((interest: any) => ({
        user_id: userId,
        profile_id: profileId,
        interest_type: interest.type,
        name: interest.name,
        notes: interest.reasoning,
        source: 'ai_detected',
        confidence_score: interest.confidence
      }));

      // Upsert to avoid duplicates
      for (const interest of interestsToInsert) {
        await supabase.from('contact_interests')
          .upsert(interest, { 
            onConflict: 'profile_id,name',
            ignoreDuplicates: true 
          });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      detectedInterests: detected.interests,
      savedCount: highConfidenceInterests.length,
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
