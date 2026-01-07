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

    // Call AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelKey,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_influence_profile',
            description: 'Create a comprehensive influence profile for the contact',
            parameters: {
              type: 'object',
              properties: {
                reciprocity_susceptibility: { type: 'number', description: 'Score 0-100 for reciprocity principle' },
                commitment_consistency_susceptibility: { type: 'number', description: 'Score 0-100 for commitment principle' },
                social_proof_susceptibility: { type: 'number', description: 'Score 0-100 for social proof' },
                authority_susceptibility: { type: 'number', description: 'Score 0-100 for authority principle' },
                liking_susceptibility: { type: 'number', description: 'Score 0-100 for liking principle' },
                scarcity_susceptibility: { type: 'number', description: 'Score 0-100 for scarcity principle' },
                unity_susceptibility: { type: 'number', description: 'Score 0-100 for unity principle' },
                decision_style: { type: 'string', enum: ['analytical', 'intuitive', 'spontaneous', 'dependent', 'avoidant'] },
                information_preference: { type: 'string', enum: ['detailed', 'summary', 'visual', 'examples', 'data'] },
                risk_appetite: { type: 'string', enum: ['conservative', 'moderate', 'aggressive'] },
                time_pressure_response: { type: 'string', enum: ['panics', 'focuses', 'stalls', 'avoids'] },
                thinking_style: { type: 'string', enum: ['logical', 'emotional', 'pragmatic', 'creative'] },
                attention_span: { type: 'string', enum: ['short', 'medium', 'long'] },
                positive_triggers: { type: 'array', items: { type: 'string' }, description: 'What makes them receptive' },
                negative_triggers: { type: 'array', items: { type: 'string' }, description: 'What shuts them down' },
                power_words: { type: 'array', items: { type: 'string' }, description: 'Words that resonate' },
                avoid_words: { type: 'array', items: { type: 'string' }, description: 'Words to avoid' },
                fear_motivators: { type: 'array', items: { type: 'string' } },
                desire_motivators: { type: 'array', items: { type: 'string' } },
                ego_sensitivities: { type: 'array', items: { type: 'string' } },
                recommended_methodologies: { type: 'array', items: { type: 'string' }, description: 'Best methodology names for this contact' },
                approach_sequence: { type: 'array', items: { type: 'object', properties: { order: { type: 'number' }, action: { type: 'string' }, rationale: { type: 'string' } } } },
                timing_preferences: { type: 'object', properties: { best_days: { type: 'array', items: { type: 'string' } }, best_times: { type: 'array', items: { type: 'string' } }, avoid_times: { type: 'array', items: { type: 'string' } } } },
                channel_preferences: { type: 'object', properties: { preferred: { type: 'array', items: { type: 'string' } }, avoid: { type: 'array', items: { type: 'string' } } } },
                overall_influence_score: { type: 'number', description: 'Overall ease of influence 0-100' },
                confidence_score: { type: 'number', description: 'Confidence in this analysis 0-100' },
                evidence_sources: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, description: { type: 'string' }, confidence: { type: 'number' } } } }
              },
              required: ['reciprocity_susceptibility', 'commitment_consistency_susceptibility', 'social_proof_susceptibility', 'authority_susceptibility', 'liking_susceptibility', 'scarcity_susceptibility', 'unity_susceptibility', 'positive_triggers', 'negative_triggers', 'power_words', 'avoid_words', 'recommended_methodologies', 'overall_influence_score', 'confidence_score']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_influence_profile' } }
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

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
