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
    const { profileId, goalType, goalDescription, context, modelKey = 'google/gemini-2.5-flash' } = await req.json();

    if (!profileId || !goalType) {
      return new Response(JSON.stringify({ error: 'profileId and goalType are required' }), {
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
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gather context
    const [
      { data: profile },
      { data: influenceProfile },
      { data: methodologies },
      { data: pastStrategies },
      { data: pastOutcomes }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).eq('user_id', user.id).single(),
      supabase.from('contact_influence_profiles').select('*').eq('profile_id', profileId).eq('user_id', user.id).maybeSingle(),
      supabase.from('intelligence_methodologies').select('*').limit(50),
      supabase.from('influence_strategies').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('methodology_outcomes').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('applied_at', { ascending: false }).limit(10)
    ]);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const contactContext = {
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      organization: profile.organization,
      job_title: profile.job_title,
      relationship_type: profile.relationship_type,
      influenceProfile: influenceProfile ? {
        susceptibilities: {
          reciprocity: influenceProfile.reciprocity_susceptibility,
          commitment: influenceProfile.commitment_consistency_susceptibility,
          socialProof: influenceProfile.social_proof_susceptibility,
          authority: influenceProfile.authority_susceptibility,
          liking: influenceProfile.liking_susceptibility,
          scarcity: influenceProfile.scarcity_susceptibility,
          unity: influenceProfile.unity_susceptibility
        },
        decisionStyle: influenceProfile.decision_style,
        informationPreference: influenceProfile.information_preference,
        positiveTriggers: influenceProfile.positive_triggers,
        negativeTriggers: influenceProfile.negative_triggers,
        powerWords: influenceProfile.power_words,
        avoidWords: influenceProfile.avoid_words,
        recommendedMethodologies: influenceProfile.recommended_methodologies
      } : null,
      availableMethodologies: methodologies?.map(m => ({
        name: m.name,
        category: m.category,
        description: m.description,
        bestFor: m.best_for,
        steps: m.technique_steps
      })) || [],
      pastStrategies: pastStrategies?.map(s => ({
        goal: s.goal_type,
        status: s.status,
        outcome: s.outcome,
        rating: s.outcome_rating
      })) || [],
      whatWorked: pastOutcomes?.filter(o => o.outcome === 'very_effective' || o.outcome === 'effective').map(o => o.methodology_name) || [],
      whatDidntWork: pastOutcomes?.filter(o => o.outcome === 'ineffective' || o.outcome === 'backfired').map(o => o.methodology_name) || []
    };

    const systemPrompt = `You are an expert influence strategist and relationship psychologist. Create detailed, actionable influence strategies based on:
- The contact's psychological profile and susceptibilities
- Proven influence methodologies from the library
- Past outcomes with this specific contact
- The specific goal and context

Your strategies should be ethical, focusing on mutual benefit and genuine relationship building while being strategically effective.
Include specific scripts, timing, and contingency plans.`;

    const userPrompt = `Create a detailed influence strategy for this contact:

CONTACT: ${JSON.stringify(contactContext, null, 2)}

GOAL TYPE: ${goalType}
GOAL DESCRIPTION: ${goalDescription || 'Not specified'}
CONTEXT: ${context || 'General approach needed'}

Generate a comprehensive strategy including:
1. Strategy name and summary
2. Preparation steps (what to do before)
3. Execution steps (the actual approach)
4. Follow-up steps (after the interaction)
5. Opening scripts (3 options)
6. Transition phrases to key ask
7. Closing scripts (3 options)
8. Objection handlers for likely objections
9. Things to specifically mention (personalization)
10. Things to avoid saying/doing
11. Emotional hooks to use
12. Optimal timing and duration
13. Success probability estimate
14. Risks and fallback strategy
15. Abort signals (when to stop)`;

    // Get platform config for AI model
    const aiConfig = await getAIConfig(supabase, user.id);

    // Call AI using unified client
    const aiResult = await callAI({
      model: aiConfig.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'generate-influence-strategy',
      profileId: profileId,
      maxTokens: aiConfig.maxTokens,
      metadata: { goalType, goalDescription },
    });

    // Parse the strategy response - use any for flexible AI response structure
    const strategy: any = parseAIJson(aiResult.content, {
      strategy_name: 'Default Strategy',
      strategy_summary: 'Unable to generate strategy',
      preparation_steps: [],
      execution_steps: [],
      opening_scripts: [],
      closing_scripts: [],
      things_to_mention: [],
      things_to_avoid: [],
      success_probability: 50,
      methodologies_applied: []
    });

    // Save the strategy
    const { data: savedStrategy, error: saveError } = await supabase
      .from('influence_strategies')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        goal_type: goalType,
        goal_description: goalDescription,
        context: context,
        strategy_name: strategy.strategy_name,
        strategy_summary: strategy.strategy_summary,
        preparation_steps: strategy.preparation_steps || [],
        execution_steps: strategy.execution_steps || [],
        follow_up_steps: strategy.follow_up_steps || [],
        opening_scripts: strategy.opening_scripts || [],
        transition_phrases: strategy.transition_phrases || [],
        closing_scripts: strategy.closing_scripts || [],
        objection_handlers: strategy.objection_handlers || {},
        recovery_phrases: strategy.recovery_phrases || [],
        things_to_mention: strategy.things_to_mention || [],
        things_to_avoid: strategy.things_to_avoid || [],
        emotional_hooks: strategy.emotional_hooks || [],
        optimal_timing: strategy.optimal_timing || {},
        duration_estimate: strategy.duration_estimate,
        urgency_level: strategy.urgency_level || 'medium',
        success_probability: strategy.success_probability,
        risks: strategy.risks || [],
        fallback_strategy: strategy.fallback_strategy,
        abort_signals: strategy.abort_signals || [],
        methodologies_applied: strategy.methodologies_applied || [],
        status: 'draft',
        ai_model_used: modelKey
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      throw saveError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      strategy: savedStrategy
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
