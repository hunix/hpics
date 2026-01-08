import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, getUserPreferredModel, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";
import { getRAGContext } from "../_shared/rag-helper.ts";

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

    // Get user ID from auth if possible
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || 'anonymous';
    }

    // Get RAG context from documents and observations
    const ragContext = await getRAGContext(
      userId,
      profileId,
      `${profile.first_name} ${profile.last_name || ''} personality interests history background`,
      { maxResults: 10, sourceTypes: ['document', 'observation', 'analysis', 'communication'] }
    );

    // Enrich prompt with RAG context
    const enrichedPrompt = ragContext.sourceCount > 0 
      ? `${prompt}\n\nADDITIONAL CONTEXT FROM DOCUMENTS AND RECORDS:\n${ragContext.context}\n\nWhen using information from these sources, cite them as [Source N].`
      : prompt;

    // Get user's preferred model for briefings
    const analysisType = FUNCTION_TO_ANALYSIS_TYPE['generate-briefing'] || 'briefing';
    const preferredModel = await getUserPreferredModel(userId, analysisType, 'google/gemini-2.5-flash');

    const aiResponse = await callAI({
      model: preferredModel,
      messages: [
        { role: 'system', content: 'You are a professional relationship intelligence assistant. Always respond with valid JSON. When citing sources, use [Source N] format.' },
        { role: 'user', content: enrichedPrompt }
      ],
      userId,
      functionName: 'generate-briefing',
      profileId: profileId,
      maxTokens: 2500,
      promptKey: 'BRIEFING_GENERATION',
    });

    let briefing;
    try {
      briefing = parseAIJson(aiResponse.content, {
        executiveSummary: 'Unable to generate briefing',
        keyFacts: [],
        recentContext: 'No recent context available',
        conversationStarters: [],
        topicsToAvoid: [],
        actionItems: [],
        relationshipHealth: { status: 'unknown', score: 50, recommendations: [] }
      });
    } catch (e) {
      throw new Error('Failed to parse briefing response');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      briefing,
      citations: ragContext.citations.length > 0 ? ragContext.citations : undefined,
      profile: {
        name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        title: profile.job_title,
        organization: profile.organization,
        avatarUrl: profile.avatar_url
      },
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
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
