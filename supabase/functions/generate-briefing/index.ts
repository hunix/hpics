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

    // Fetch all relevant data for the contact
    const [profileResult, communicationsResult, eventsResult, analysesResult, interestsResult, experiencesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(10),
      supabase.from('events').select('*').eq('profile_id', profileId).gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(5),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).order('generated_at', { ascending: false }),
      supabase.from('contact_interests').select('*').eq('profile_id', profileId),
      supabase.from('shared_experiences').select('*').eq('profile_id', profileId).order('experience_date', { ascending: false }).limit(5),
    ]);

    if (profileResult.error) throw profileResult.error;
    
    const profile = profileResult.data;
    const communications = communicationsResult.data || [];
    const upcomingEvents = eventsResult.data || [];
    const analyses = analysesResult.data || [];
    const interests = interestsResult.data || [];
    const experiences = experiencesResult.data || [];

    // Extract existing AI analyses
    const personalityAnalysis = analyses.find(a => a.analysis_type === 'personality');
    const sentimentAnalysis = analyses.find(a => a.analysis_type === 'sentiment');
    const playbookAnalysis = analyses.find(a => a.analysis_type === 'social_playbook');
    const scoreAnalysis = analyses.find(a => a.analysis_type === 'relationship_score');

    const prompt = `You are a professional relationship intelligence assistant. Generate a comprehensive meeting briefing for the following contact.

CONTACT PROFILE:
Name: ${profile.first_name} ${profile.last_name || ''}
${profile.nickname ? `Nickname: ${profile.nickname}` : ''}
${profile.job_title ? `Title: ${profile.job_title}` : ''}
${profile.organization ? `Organization: ${profile.organization}` : ''}
Relationship: ${profile.relationship_type || 'Unknown'}
${profile.bio ? `Bio: ${profile.bio}` : ''}
${profile.notes ? `Notes: ${profile.notes}` : ''}

KNOWN INTERESTS:
${interests.length > 0 ? interests.map(i => `- ${i.name} (${i.interest_type})`).join('\n') : 'No interests recorded'}

RECENT COMMUNICATIONS (last 10):
${communications.length > 0 ? communications.map(c => 
  `- ${new Date(c.occurred_at).toLocaleDateString()}: ${c.channel} (${c.direction}) - ${c.subject || 'No subject'}`
).join('\n') : 'No recent communications'}

SHARED EXPERIENCES:
${experiences.length > 0 ? experiences.map(e => 
  `- ${e.title} (${e.experience_type}) - ${e.experience_date || 'Date unknown'}`
).join('\n') : 'No shared experiences recorded'}

UPCOMING EVENTS:
${upcomingEvents.length > 0 ? upcomingEvents.map(e => 
  `- ${e.title} (${e.event_type}) - ${new Date(e.event_date).toLocaleDateString()}`
).join('\n') : 'No upcoming events'}

EXISTING AI ANALYSES:
${personalityAnalysis ? `Personality: ${JSON.stringify(personalityAnalysis.result)}` : 'No personality analysis'}
${sentimentAnalysis ? `Sentiment: ${JSON.stringify(sentimentAnalysis.result)}` : 'No sentiment analysis'}
${playbookAnalysis ? `Social Playbook: ${JSON.stringify(playbookAnalysis.result)}` : 'No social playbook'}
${scoreAnalysis ? `Relationship Score: ${JSON.stringify(scoreAnalysis.result)}` : 'No relationship score'}

Generate a comprehensive meeting briefing with the following sections:
1. EXECUTIVE SUMMARY: 2-3 sentences about this person and your relationship
2. KEY FACTS: Important things to remember (bullet points)
3. RECENT CONTEXT: What's been happening in your relationship recently
4. CONVERSATION STARTERS: 3-5 personalized topics to bring up
5. TOPICS TO AVOID: Any sensitive areas based on sentiment/history
6. ACTION ITEMS: Things you should do before/during/after the meeting
7. RELATIONSHIP HEALTH: Current status and recommendations for improvement

Return as JSON with these exact keys: executiveSummary, keyFacts (array), recentContext, conversationStarters (array), topicsToAvoid (array), actionItems (array), relationshipHealth (object with status, score, recommendations array)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional relationship intelligence assistant. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_briefing',
            description: 'Generate a comprehensive meeting briefing',
            parameters: {
              type: 'object',
              properties: {
                executiveSummary: { type: 'string' },
                keyFacts: { type: 'array', items: { type: 'string' } },
                recentContext: { type: 'string' },
                conversationStarters: { type: 'array', items: { type: 'string' } },
                topicsToAvoid: { type: 'array', items: { type: 'string' } },
                actionItems: { type: 'array', items: { type: 'string' } },
                relationshipHealth: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    score: { type: 'number' },
                    recommendations: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['status', 'score', 'recommendations']
                }
              },
              required: ['executiveSummary', 'keyFacts', 'recentContext', 'conversationStarters', 'topicsToAvoid', 'actionItems', 'relationshipHealth']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_briefing' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));
    
    let briefing;
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      briefing = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
    } else if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      briefing = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } else {
      throw new Error('Unexpected AI response format');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      briefing,
      profile: {
        name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        title: profile.job_title,
        organization: profile.organization,
        avatarUrl: profile.avatar_url
      },
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating briefing:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
