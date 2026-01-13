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

  try {
    const { profileId, modelKey = 'google/gemini-2.5-flash' } = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gather all contact data for analysis
    const [
      { data: profile },
      { data: messages },
      { data: communications },
      { data: events },
      { data: psychProfile },
      { data: commPrefs },
      { data: interactions },
      { data: mediaAnalyses }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).eq('user_id', user.id).single(),
      supabase.from('messages').select('*, conversations!inner(profile_id, user_id)')
        .eq('conversations.profile_id', profileId).eq('conversations.user_id', user.id).limit(100),
      supabase.from('communications').select('*').eq('profile_id', profileId).eq('user_id', user.id).limit(50),
      supabase.from('events').select('*').eq('profile_id', profileId).eq('user_id', user.id).limit(30),
      supabase.from('psychological_profiles').select('*').eq('profile_id', profileId).eq('user_id', user.id).maybeSingle(),
      supabase.from('contact_communication_preferences').select('*').eq('profile_id', profileId).eq('user_id', user.id).maybeSingle(),
      supabase.from('interaction_notes').select('*').eq('profile_id', profileId).eq('user_id', user.id).limit(50),
      supabase.from('media_analyses').select('*').eq('profile_id', profileId).eq('user_id', user.id).limit(20)
    ]);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build comprehensive context
    const context = {
      profile: {
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        organization: profile.organization,
        job_title: profile.job_title,
        relationship_type: profile.relationship_type,
        tags: profile.tags,
        notes: profile.notes
      },
      messages: messages?.map(m => ({
        content: m.content?.substring(0, 500),
        from_contact: m.is_from_contact,
        date: m.sent_at
      })) || [],
      communications: communications?.map(c => ({
        channel: c.channel,
        direction: c.direction,
        subject: c.subject,
        sentiment: c.sentiment_score,
        date: c.occurred_at
      })) || [],
      events: events?.map(e => ({
        type: e.event_type,
        title: e.title,
        date: e.event_date
      })) || [],
      psychological_profile: psychProfile ? {
        personality: psychProfile.personality_ocean,
        dark_triad: psychProfile.dark_triad,
        attachment: psychProfile.attachment_style,
        emotional_intelligence: psychProfile.emotional_intelligence,
        communication_dna: psychProfile.communication_dna
      } : null,
      communication_preferences: commPrefs ? {
        style: commPrefs.communication_style,
        decision_style: commPrefs.decision_style,
        preferred_channels: commPrefs.preferred_channels,
        favorite_topics: commPrefs.favorite_topics,
        topics_to_avoid: commPrefs.topics_to_avoid
      } : null,
      interaction_notes: interactions?.map(n => ({
        title: n.title,
        content: n.content?.substring(0, 300),
        mood: n.mood,
        importance: n.importance
      })) || [],
      behavioral_observations: mediaAnalyses?.map(a => ({
        type: a.analysis_type,
        result: a.analysis_result
      })) || []
    };

    const systemPrompt = `You are an expert psychological profiler and influence strategist with deep knowledge of:
- Cialdini's 7 Principles of Persuasion (Reciprocity, Commitment/Consistency, Social Proof, Authority, Liking, Scarcity, Unity)
- Behavioral economics and cognitive biases
- Communication psychology and NLP
- Decision-making patterns and personality psychology
- Strategic relationship management

Analyze the provided contact data to create a comprehensive influence profile. Be specific and actionable.
Consider all available evidence including messages, communications, events, existing psychological profiles, and behavioral observations.
Base your analysis on observable patterns, not assumptions.`;

    const userPrompt = `Analyze this contact's influence susceptibilities, decision-making patterns, and communication triggers:

${JSON.stringify(context, null, 2)}

Generate a comprehensive influence profile including:
1. Susceptibility scores (0-100) for each of Cialdini's 7 principles
2. Decision-making style and information preferences
3. Positive and negative triggers
4. Power words that resonate vs words to avoid
5. Emotional patterns (fears, desires, ego sensitivities)
6. Recommended influence methodologies
7. Optimal approach sequence
8. Timing and channel preferences
9. Overall influence score and confidence level`;

    // Get platform config for AI model
    const aiConfig = await getAIConfig(supabase, user.id);

    // Call AI using unified client
    const aiResult = await callAI({
      model: aiConfig.qualityModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'analyze-influence-profile',
      profileId: profileId,
      maxTokens: aiConfig.maxTokens,
    });

    // Parse response - use any for flexible AI response structure
    const analysis: any = parseAIJson(aiResult.content, {
      reciprocity_susceptibility: 50,
      commitment_consistency_susceptibility: 50,
      social_proof_susceptibility: 50,
      authority_susceptibility: 50,
      liking_susceptibility: 50,
      scarcity_susceptibility: 50,
      unity_susceptibility: 50,
      positive_triggers: [],
      negative_triggers: [],
      power_words: [],
      avoid_words: [],
      recommended_methodologies: [],
      overall_influence_score: 50,
      confidence_score: 30
    });

    // Upsert the influence profile
    const { data: savedProfile, error: saveError } = await supabase
      .from('contact_influence_profiles')
      .upsert({
        user_id: user.id,
        profile_id: profileId,
        reciprocity_susceptibility: analysis.reciprocity_susceptibility,
        commitment_consistency_susceptibility: analysis.commitment_consistency_susceptibility,
        social_proof_susceptibility: analysis.social_proof_susceptibility,
        authority_susceptibility: analysis.authority_susceptibility,
        liking_susceptibility: analysis.liking_susceptibility,
        scarcity_susceptibility: analysis.scarcity_susceptibility,
        unity_susceptibility: analysis.unity_susceptibility,
        decision_style: analysis.decision_style,
        information_preference: analysis.information_preference,
        risk_appetite: analysis.risk_appetite,
        time_pressure_response: analysis.time_pressure_response,
        thinking_style: analysis.thinking_style,
        attention_span: analysis.attention_span,
        positive_triggers: analysis.positive_triggers || [],
        negative_triggers: analysis.negative_triggers || [],
        power_words: analysis.power_words || [],
        avoid_words: analysis.avoid_words || [],
        fear_motivators: analysis.fear_motivators || [],
        desire_motivators: analysis.desire_motivators || [],
        ego_sensitivities: analysis.ego_sensitivities || [],
        recommended_methodologies: analysis.recommended_methodologies || [],
        approach_sequence: analysis.approach_sequence || [],
        timing_preferences: analysis.timing_preferences || {},
        channel_preferences: analysis.channel_preferences || {},
        overall_influence_score: analysis.overall_influence_score,
        confidence_score: analysis.confidence_score,
        evidence_sources: analysis.evidence_sources || [],
        ai_model_used: modelKey,
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,profile_id' })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      throw saveError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      profile: savedProfile,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
