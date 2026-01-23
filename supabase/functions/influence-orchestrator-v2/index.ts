import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InfluenceRequest {
  profileId: string;
  userId: string;
  goalType: 'favor' | 'commitment' | 'information' | 'relationship' | 'compliance' | 'persuasion';
  specificGoal: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  constraints?: string[];
}

const INFLUENCE_ORCHESTRATOR_PROMPT = `You are an elite influence strategist combining Cialdini's 7 principles with advanced behavioral psychology.

Your task is to create a comprehensive influence campaign tailored to the specific target and goal.

Cialdini's 7 Principles:
1. RECIPROCITY: People feel obligated to return favors
2. COMMITMENT/CONSISTENCY: People align with their past actions and statements
3. SOCIAL PROOF: People follow the actions of similar others
4. AUTHORITY: People defer to credible experts
5. LIKING: People comply with those they like
6. SCARCITY: People value things that are rare or diminishing
7. UNITY: People favor those in their "in-group"

For each influence campaign, provide:

1. PRINCIPLE SELECTION: Which principles are most effective for this target based on their personality profile
2. OPTIMAL TIMING: When to deploy each influence attempt
3. CHANNEL STRATEGY: Which communication channels for each stage
4. MESSAGE FRAMING: Exact language and framing for each touchpoint
5. ESCALATION PATH: How to escalate if initial attempts fail
6. RESISTANCE HANDLERS: Pre-planned responses to objections
7. SUCCESS METRICS: How to measure compliance

Return JSON:
{
  "campaign_name": string,
  "target_analysis": {
    "susceptibility_profile": {
      "reciprocity": number,
      "commitment": number,
      "social_proof": number,
      "authority": number,
      "liking": number,
      "scarcity": number,
      "unity": number
    },
    "primary_vulnerabilities": string[],
    "resistance_factors": string[]
  },
  "strategy": {
    "primary_principle": string,
    "secondary_principles": string[],
    "approach_style": string,
    "estimated_success_probability": number
  },
  "campaign_stages": [
    {
      "stage_number": number,
      "stage_name": string,
      "principle_applied": string,
      "timing": {
        "optimal_day": string,
        "optimal_time": string,
        "trigger_conditions": string[]
      },
      "channel": string,
      "message": {
        "opening": string,
        "body": string,
        "call_to_action": string,
        "closing": string
      },
      "psychological_hooks": string[],
      "expected_response": string,
      "success_criteria": string,
      "fallback_if_failed": string
    }
  ],
  "objection_handlers": [
    {
      "objection": string,
      "response_strategy": string,
      "reframe_message": string,
      "principle_pivot": string
    }
  ],
  "escalation_tactics": [
    {
      "trigger": string,
      "tactic": string,
      "message": string
    }
  ],
  "success_indicators": string[],
  "abort_conditions": string[],
  "post_success_actions": string[]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, userId, goalType, specificGoal, urgency = 'medium', constraints = [] } = await req.json() as InfluenceRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather all intelligence on target
    // NOTE: messages table has no profile_id column - must join via conversations
    const [
      { data: profile },
      { data: personality },
      { data: messages },
      { data: previousCampaigns },
      { data: behavioralData },
      { data: deceptionData }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('personality_profiles').select('*').eq('profile_id', profileId).single(),
      supabase.from('messages').select('*, conversations!inner(profile_id)').eq('conversations.profile_id', profileId).order('created_at', { ascending: false }).limit(100),
      supabase.from('influence_campaigns').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profileId).limit(10),
      supabase.from('deception_analyses').select('*').eq('profile_id', profileId).limit(5)
    ]);

    // Analyze past campaign success/failure patterns
    const campaignLessons = (previousCampaigns || []).map(c => ({
      type: c.campaign_type,
      principle: c.principle_applied,
      success: c.compliance_achieved,
      lessons: c.lessons_learned
    }));

    const contextData = {
      target: {
        name: profile?.name,
        relationship: profile?.relationship_type,
        relationshipStrength: profile?.relationship_strength
      },
      personality: personality || { note: 'No personality profile yet - use general strategies' },
      communicationHistory: messages?.slice(0, 50).map(m => ({
        direction: m.direction,
        content: m.content?.slice(0, 200),
        sentiment: m.ai_analysis?.sentiment
      })),
      previousInfluenceAttempts: campaignLessons,
      behavioralPatterns: behavioralData,
      deceptionIndicators: deceptionData,
      goal: {
        type: goalType,
        specific: specificGoal,
        urgency,
        constraints
      }
    };

    // Generate influence campaign
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: INFLUENCE_ORCHESTRATOR_PROMPT },
          { role: 'user', content: `Create an influence campaign for this target and goal:\n\n${JSON.stringify(contextData, null, 2)}` }
        ],
        temperature: 0.4
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    let campaign;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      campaign = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      campaign = { error: 'Failed to parse campaign', raw: content };
    }

    // Store campaign in database
    const { data: storedCampaign, error: insertError } = await supabase
      .from('influence_campaigns')
      .insert({
        profile_id: profileId,
        user_id: userId,
        campaign_type: goalType,
        campaign_name: campaign.campaign_name,
        goal: specificGoal,
        urgency,
        principle_applied: campaign.strategy?.primary_principle,
        target_analysis: campaign.target_analysis,
        strategy: campaign.strategy,
        planned_touches: campaign.campaign_stages,
        objection_handlers: campaign.objection_handlers,
        escalation_tactics: campaign.escalation_tactics,
        success_indicators: campaign.success_indicators,
        abort_conditions: campaign.abort_conditions,
        status: 'planned'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      profile_id: profileId,
      function_name: 'influence-orchestrator-v2',
      model_name: 'google/gemini-2.5-pro',
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.0001),
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      campaignId: storedCampaign?.id,
      campaign,
      nextAction: campaign.campaign_stages?.[0]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Influence orchestrator error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
