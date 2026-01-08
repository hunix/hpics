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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const { data: claimsData, error: authError } = await (authClient.auth as any).getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { profile_id } = await req.json();
    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'profile_id required' }), { status: 400, headers: corsHeaders });
    }

    // Gather all available data about the contact
    const [
      { data: profile },
      { data: personalInfo },
      { data: interests },
      { data: observations },
      { data: commPrefs },
      { data: milestones },
      { data: interactionNotes },
      { data: communications },
      { data: psychProfile },
      { data: behavioralAnalyses },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profile_id).single(),
      supabase.from('contact_personal_info').select('*').eq('profile_id', profile_id).maybeSingle(),
      supabase.from('contact_interests').select('*').eq('profile_id', profile_id),
      supabase.from('contact_observations').select('*').eq('profile_id', profile_id).limit(20),
      supabase.from('contact_communication_preferences').select('*').eq('profile_id', profile_id).maybeSingle(),
      supabase.from('contact_life_milestones').select('*').eq('profile_id', profile_id).order('event_date', { ascending: false }).limit(20),
      supabase.from('contact_interaction_notes').select('*').eq('profile_id', profile_id).order('interaction_date', { ascending: false }).limit(20),
      supabase.from('communications').select('*').eq('profile_id', profile_id).order('occurred_at', { ascending: false }).limit(50),
      supabase.from('psychological_profiles').select('*').eq('profile_id', profile_id).maybeSingle(),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profile_id).limit(5),
    ]);

    const contactName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

    // Build context for AI
    const context = {
      profile: {
        name: contactName,
        relationship_type: profile?.relationship_type,
        organization: profile?.organization,
        job_title: profile?.job_title,
        bio: profile?.bio,
      },
      personalInfo: personalInfo ? {
        mbti: personalInfo.mbti_type,
        zodiac: personalInfo.zodiac_sign,
        dietary: personalInfo.dietary_preferences,
        marital: personalInfo.marital_status,
      } : null,
      interests: interests?.map(i => ({ name: i.name, type: i.interest_type })),
      observations: observations?.map(o => ({ title: o.title, observation: o.observation, category: o.category })),
      communicationPreferences: commPrefs ? {
        preferred_channels: commPrefs.preferred_channels,
        communication_style: commPrefs.communication_style,
        favorite_topics: commPrefs.favorite_topics,
        topics_to_avoid: commPrefs.topics_to_avoid,
        decision_style: commPrefs.decision_style,
        humor_receptivity: commPrefs.humor_receptivity,
      } : null,
      recentMilestones: milestones?.slice(0, 10).map(m => ({ title: m.title, type: m.milestone_type, date: m.event_date })),
      recentInteractions: interactionNotes?.slice(0, 10).map(n => ({
        type: n.interaction_type,
        mood: n.mood_observed,
        temperature: n.relationship_temperature,
        topics: n.topics_discussed,
        note: n.note_text?.substring(0, 200),
      })),
      communicationPatterns: {
        totalCount: communications?.length || 0,
        channels: [...new Set(communications?.map(c => c.channel))],
        avgSentiment: communications?.length 
          ? communications.filter(c => c.sentiment_score).reduce((a, c) => a + (c.sentiment_score || 0), 0) / communications.filter(c => c.sentiment_score).length
          : null,
      },
      psychologicalProfile: psychProfile ? {
        personalityTraits: psychProfile.personality_traits,
        communicationStyle: psychProfile.communication_style,
        emotionalPatterns: psychProfile.emotional_patterns,
      } : null,
      behavioralInsights: behavioralAnalyses?.map(a => a.personality_indicators),
    };

    const systemPrompt = `You are an expert relationship advisor and communication strategist. Your task is to create a comprehensive interaction playbook for maintaining and deepening a relationship with someone.

Based on the provided data about a person, generate a detailed playbook that will help the user interact more effectively with them.

Output a JSON object with these exact fields:
{
  "personality_summary": "A one-paragraph summary of their personality based on available data",
  "working_with_them": "How to effectively work or interact with them",
  "dos": ["Array of 5-8 things to DO when interacting with them"],
  "donts": ["Array of 5-8 things to AVOID when interacting with them"],
  "how_to_ask_favor": "The best approach when asking them for something",
  "how_to_give_feedback": "How to give them constructive feedback",
  "how_to_deliver_bad_news": "How to share difficult news with them",
  "how_to_celebrate_with": "How to celebrate successes with them",
  "how_to_comfort": "How to support them during difficult times",
  "ideal_contact_frequency": "daily|weekly|biweekly|monthly|quarterly - how often to reach out",
  "relationship_investment_tips": ["Array of 3-5 specific tips for investing in this relationship"],
  "gift_giving_notes": "What to consider when giving them gifts",
  "signs_of_distance": ["Array of 3-5 warning signs the relationship is cooling"],
  "signs_of_stress": ["Array of 3-5 signs they're stressed or overwhelmed"],
  "signs_of_openness": ["Array of 3-5 signs they're receptive to interaction"]
}

Be specific and actionable. Base recommendations on the actual data provided.`;

    const aiResponse = await callAI({
      model: selectModel('balanced'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate an interaction playbook for ${contactName} based on this data:\n\n${JSON.stringify(context, null, 2)}` },
      ],
      userId,
      functionName: 'generate-playbook',
      profileId: profile_id,
      temperature: 0.6,
      maxTokens: 2500,
      metadata: {
        has_personal_info: !!personalInfo,
        interests_count: interests?.length || 0,
        observations_count: observations?.length || 0,
        communications_count: communications?.length || 0,
      },
    });

    // Parse JSON from response
    const playbook = parseAIJson(aiResponse.content, {
      personality_summary: 'Unable to generate personality summary',
      dos: [],
      donts: [],
      ideal_contact_frequency: 'monthly',
    });

    // Save to database
    const { data: existing } = await supabase
      .from('contact_playbooks')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('contact_playbooks')
        .update({
          ...playbook,
          ai_generated: true,
          ai_model_used: aiResponse.model,
          ai_generated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('contact_playbooks')
        .insert({
          user_id: userId,
          profile_id: profile_id,
          ...playbook,
          ai_generated: true,
          ai_model_used: aiResponse.model,
          ai_generated_at: new Date().toISOString(),
        });
    }

    console.log(`Playbook generated for ${contactName}. Cost: ${aiResponse.costCents}¢`);

    return new Response(JSON.stringify({ 
      success: true, 
      playbook,
      cost_cents: aiResponse.costCents,
      response_time_ms: aiResponse.responseTimeMs,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate playbook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
