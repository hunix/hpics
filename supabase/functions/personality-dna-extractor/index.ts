import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonalityRequest {
  profileId: string;
  userId: string;
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

const PERSONALITY_EXTRACTION_PROMPT = `You are an expert psychologist specializing in Big Five/OCEAN personality assessment through behavioral and linguistic analysis.

Analyze the provided data to extract personality traits with scientific precision.

For each OCEAN dimension, provide:
1. Score (0-100)
2. Confidence (0-1)
3. Key evidence from the data
4. Subfacet breakdown (6 subfacets per dimension)

OCEAN Dimensions:
- Openness: Creativity, curiosity, intellectual interests, aesthetic sensitivity
- Conscientiousness: Organization, dependability, self-discipline, achievement-striving
- Extraversion: Sociability, assertiveness, positive emotions, energy level
- Agreeableness: Cooperation, trust, empathy, altruism
- Neuroticism: Anxiety, emotional volatility, self-consciousness, vulnerability

Linguistic Markers to Analyze:
- First-person pronoun usage patterns
- Emotional vocabulary diversity
- Temporal orientation (past/present/future focus)
- Social reference frequency
- Certainty vs. hedging language
- Question vs. statement ratio
- Vocabulary sophistication
- Topic diversity

Behavioral Markers:
- Response latency patterns
- Communication frequency rhythms
- Engagement depth indicators
- Conflict/harmony patterns
- Initiative vs. reactive behavior

Return JSON:
{
  "openness": {
    "score": number,
    "confidence": number,
    "evidence": string[],
    "facets": {
      "fantasy": number,
      "aesthetics": number,
      "feelings": number,
      "actions": number,
      "ideas": number,
      "values": number
    }
  },
  "conscientiousness": {
    "score": number,
    "confidence": number,
    "evidence": string[],
    "facets": {
      "competence": number,
      "order": number,
      "dutifulness": number,
      "achievement_striving": number,
      "self_discipline": number,
      "deliberation": number
    }
  },
  "extraversion": {
    "score": number,
    "confidence": number,
    "evidence": string[],
    "facets": {
      "warmth": number,
      "gregariousness": number,
      "assertiveness": number,
      "activity": number,
      "excitement_seeking": number,
      "positive_emotions": number
    }
  },
  "agreeableness": {
    "score": number,
    "confidence": number,
    "evidence": string[],
    "facets": {
      "trust": number,
      "straightforwardness": number,
      "altruism": number,
      "compliance": number,
      "modesty": number,
      "tender_mindedness": number
    }
  },
  "neuroticism": {
    "score": number,
    "confidence": number,
    "evidence": string[],
    "facets": {
      "anxiety": number,
      "angry_hostility": number,
      "depression": number,
      "self_consciousness": number,
      "impulsiveness": number,
      "vulnerability": number
    }
  },
  "personality_dna": {
    "signature": string,
    "dominant_traits": string[],
    "recessive_traits": string[],
    "stability_coefficient": number,
    "predictability_score": number
  },
  "exploitation_profile": {
    "primary_motivators": string[],
    "fear_triggers": string[],
    "reward_sensitivity": string,
    "social_proof_susceptibility": number,
    "authority_deference": number,
    "scarcity_reactivity": number,
    "commitment_consistency": number,
    "reciprocity_obligation": number,
    "liking_influence": number
  },
  "communication_style": {
    "preferred_channel": string,
    "optimal_message_length": string,
    "emotional_vs_logical": number,
    "direct_vs_indirect": number,
    "formal_vs_casual": number
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, userId, analysisDepth = 'standard' } = await req.json() as PersonalityRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather all relevant data for personality analysis
    const [
      { data: profile },
      { data: messages },
      { data: observations },
      { data: voiceInsights },
      { data: behavioralData },
      { data: recordings }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('messages').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(analysisDepth === 'deep' ? 500 : analysisDepth === 'standard' ? 200 : 50),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).limit(100),
      supabase.from('voice_insights').select('*').eq('profile_id', profileId).limit(50),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profileId).limit(20),
      supabase.from('meeting_recordings').select('id, transcription, summary').eq('profile_id', profileId).limit(20)
    ]);

    // Compile linguistic corpus
    const textCorpus = [
      ...(messages || []).map(m => m.content),
      ...(observations || []).map(o => o.observation),
      ...(recordings || []).filter(r => r.transcription).map(r => r.transcription)
    ].filter(Boolean).join('\n\n');

    const contextData = {
      profile,
      messageCount: messages?.length || 0,
      textCorpus: textCorpus.slice(0, 50000), // Limit context size
      voicePatterns: voiceInsights,
      behavioralPatterns: behavioralData,
      observationNotes: observations?.map(o => ({ note: o.observation, type: o.category }))
    };

    // Get AI config from platform settings
    const aiConfig = await getAIConfig(supabase, userId);

    // Call AI for personality extraction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.qualityModel,
        messages: [
          { role: 'system', content: PERSONALITY_EXTRACTION_PROMPT },
          { role: 'user', content: `Analyze this contact's personality from the following data:\n\n${JSON.stringify(contextData, null, 2)}` }
        ],
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      analysis = { error: 'Failed to parse personality analysis', raw: content };
    }

    // Store in personality_profiles table
    const { error: insertError } = await supabase
      .from('personality_profiles')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        openness: analysis.openness,
        conscientiousness: analysis.conscientiousness,
        extraversion: analysis.extraversion,
        agreeableness: analysis.agreeableness,
        neuroticism: analysis.neuroticism,
        facet_scores: {
          openness_facets: analysis.openness?.facets,
          conscientiousness_facets: analysis.conscientiousness?.facets,
          extraversion_facets: analysis.extraversion?.facets,
          agreeableness_facets: analysis.agreeableness?.facets,
          neuroticism_facets: analysis.neuroticism?.facets
        },
        personality_dna: analysis.personality_dna,
        exploitation_profile: analysis.exploitation_profile,
        communication_style: analysis.communication_style,
        stability_coefficient: analysis.personality_dna?.stability_coefficient,
        extraction_sources: ['messages', 'observations', 'voice_insights', 'behavioral_analyses'],
        last_analyzed_at: new Date().toISOString()
      }, { onConflict: 'profile_id' });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      profile_id: profileId,
      function_name: 'personality-dna-extractor',
      model_name: aiConfig.qualityModel,
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.0001),
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      dataPointsAnalyzed: {
        messages: messages?.length || 0,
        observations: observations?.length || 0,
        voiceInsights: voiceInsights?.length || 0,
        recordings: recordings?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Personality extraction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
