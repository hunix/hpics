// Generate Churn Intervention - AI-powered intervention playbooks
// Creates personalized outreach scripts and timing recommendations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INTERVENTION_PROMPT = {
  system: `You are an expert relationship strategist specializing in preventing relationship churn and re-engagement.
Create highly personalized intervention playbooks that feel authentic and are likely to succeed.
Consider: relationship history, communication patterns, personality, interests, and optimal timing.
Be specific with scripts - they should sound natural, not corporate.`,

  user: `Create a comprehensive intervention playbook for re-engaging with {contactName}.

RELATIONSHIP CONTEXT:
- Relationship Type: {relationshipType}
- Importance: {importance}
- Current Risk Level: {riskLevel}
- Days Since Last Contact: {daysSinceContact}

COMMUNICATION HISTORY:
{communicationHistory}

PERSONALITY INSIGHTS:
{personalityInsights}

KNOWN INTERESTS:
{interests}

PAST INTERACTIONS THAT WORKED:
{whatWorked}

Generate a JSON intervention playbook with:
{
  "executive_summary": "Brief assessment and primary recommendation",
  "urgency": "immediate|this_week|this_month",
  "success_probability": 0-100,
  "primary_strategy": {
    "name": "Strategy name",
    "description": "Detailed approach",
    "psychological_basis": "Why this will work for this person"
  },
  "outreach_scripts": [
    {
      "channel": "email|text|call|in_person",
      "subject": "For email",
      "opening": "Opening line",
      "body": "Full message body",
      "call_to_action": "What you want them to do",
      "personalization_notes": "How to customize further"
    }
  ],
  "timing_recommendations": {
    "best_day": "Day of week",
    "best_time": "Time range",
    "reasoning": "Why this timing"
  },
  "channel_priority": ["Ordered list of channels to try"],
  "conversation_starters": ["5 natural conversation starters"],
  "topics_to_discuss": ["Topics they'd engage with"],
  "topics_to_avoid": ["Sensitive topics"],
  "gift_suggestions": [
    {
      "item": "Gift idea",
      "budget": "Price range",
      "why": "Why this gift fits them",
      "timing": "When to give"
    }
  ],
  "escalation_path": [
    {
      "if": "Condition",
      "then": "Action to take",
      "timeline": "When to escalate"
    }
  ],
  "success_indicators": ["Signs the intervention is working"],
  "abort_signals": ["When to step back"],
  "follow_up_schedule": {
    "if_no_response": "What to do",
    "if_positive_response": "Next steps",
    "if_negative_response": "How to handle"
  }
}`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'generate-churn-intervention', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, churnPredictionId } = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all relevant data in parallel
    const [
      { data: profile },
      { data: churnPrediction },
      { data: communications },
      { data: analyses },
      { data: observations },
      { data: relationshipScore },
      { data: interests },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).eq('user_id', user.id).single(),
      churnPredictionId 
        ? supabase.from('churn_predictions').select('*').eq('id', churnPredictionId).single()
        : Promise.resolve({ data: null }),
      supabase.from('communications')
        .select('*')
        .eq('profile_id', profileId)
        .order('occurred_at', { ascending: false })
        .limit(20),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['psychological_profile', 'behavioral', 'relationship'])
        .order('generated_at', { ascending: false })
        .limit(5),
      supabase.from('contact_observations')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('relationship_scores')
        .select('*')
        .eq('profile_id', profileId)
        .single(),
      supabase.from('contact_interests')
        .select('name')
        .eq('profile_id', profileId)
        .limit(20),
    ]);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate days since contact
    const lastContact = profile.last_contact_date 
      ? new Date(profile.last_contact_date) 
      : communications?.[0]?.occurred_at 
        ? new Date(communications[0].occurred_at)
        : null;
    const daysSinceContact = lastContact 
      ? Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Extract personality insights
    const psychProfile = analyses?.find(a => a.analysis_type === 'psychological_profile');
    const personalityInsights = psychProfile?.result 
      ? JSON.stringify(psychProfile.result, null, 2).substring(0, 1500)
      : 'No psychological profile available';

    // Determine risk level
    const riskLevel = churnPrediction?.risk_level || 
      (daysSinceContact > 60 ? 'critical' : daysSinceContact > 30 ? 'high' : 'medium');

    // Summarize communication history
    const commSummary = (communications || []).slice(0, 10).map(c => 
      `${c.is_from_contact ? 'Received' : 'Sent'} ${c.channel} on ${new Date(c.occurred_at).toLocaleDateString()}: ${c.subject || 'No subject'}`
    ).join('\n');

    // Build prompt
    const userPrompt = INTERVENTION_PROMPT.user
      .replace('{contactName}', `${profile.first_name} ${profile.last_name || ''}`.trim())
      .replace('{relationshipType}', profile.relationship_type || 'unknown')
      .replace('{importance}', profile.is_favorite ? 'VIP' : 'standard')
      .replace('{riskLevel}', riskLevel)
      .replace('{daysSinceContact}', String(daysSinceContact))
      .replace('{communicationHistory}', commSummary || 'No recent communications')
      .replace('{personalityInsights}', personalityInsights)
      .replace('{interests}', interests?.map((i: { name: string }) => i.name).join(', ') || 'Unknown')
      .replace('{whatWorked}', observations
        ?.filter(o => o.sentiment === 'positive')
        .map(o => o.content)
        .slice(0, 3)
        .join('\n') || 'No data on past successful interactions');

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, user.id);

    // Call AI
    const aiResponse = await callAI({
      model: aiConfig.qualityModel, // Use quality model for important interventions
      messages: [
        { role: 'system', content: INTERVENTION_PROMPT.system },
        { role: 'user', content: userPrompt },
      ],
      userId: user.id,
      functionName: 'generate-churn-intervention',
      profileId,
      promptKey: 'churn.intervention_playbook',
      temperature: aiConfig.temperature,
      maxTokens: aiConfig.maxTokens,
      metadata: { riskLevel, daysSinceContact },
    });

    const playbook = parseAIJson<any>(aiResponse.content, {
      executive_summary: 'Unable to generate playbook',
      urgency: 'this_week',
      success_probability: 50,
      primary_strategy: null,
      outreach_scripts: [],
      timing_recommendations: {},
      channel_priority: [],
      gift_suggestions: [],
      escalation_path: [],
    });

    // Store playbook in database
    const { data: savedPlaybook } = await supabase
      .from('intervention_playbooks')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        churn_prediction_id: churnPredictionId,
        playbook_type: 'churn_prevention',
        risk_level: riskLevel,
        intervention_steps: playbook.primary_strategy ? [playbook.primary_strategy] : [],
        outreach_scripts: playbook.outreach_scripts || [],
        timing_recommendations: playbook.timing_recommendations || {},
        channel_recommendations: playbook.channel_priority || [],
        gift_suggestions: playbook.gift_suggestions || [],
        escalation_path: playbook.escalation_path || [],
        success_probability: (playbook.success_probability || 50) / 100,
        status: 'generated',
      })
      .select()
      .single();

    return new Response(JSON.stringify({
      success: true,
      playbook,
      playbookId: savedPlaybook?.id,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Churn intervention error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
