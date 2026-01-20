import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAIConfig, getPlatformConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  userId: string;
  context?: 'daily_briefing' | 'real_time' | 'opportunity_scan' | 'risk_alert';
  focusProfileId?: string;
}

const ACTION_RECOMMENDATION_PROMPT = `You are an elite strategic advisor generating prioritized, actionable recommendations based on comprehensive intelligence data.

Generate recommendations across these categories:

1. IMMEDIATE ACTIONS (Next 24 hours):
   - Time-sensitive opportunities
   - Relationship maintenance needs
   - Risk mitigation requirements

2. INFLUENCE OPPORTUNITIES:
   - Optimal timing for requests
   - Relationship leverage points
   - Reciprocity opportunities

3. RELATIONSHIP INVESTMENTS:
   - High-value connections needing attention
   - Declining relationships requiring intervention
   - Strategic introduction opportunities

4. RISK ALERTS:
   - Deception indicators detected
   - Relationship decay signals
   - Network vulnerability warnings

5. STRATEGIC PLAYS:
   - Coalition building opportunities
   - Information advantage opportunities
   - Power positioning moves

For each recommendation:
- Be specific and actionable
- Provide exact timing
- Include talking points/scripts
- Estimate success probability
- Assess risk level

Return JSON:
{
  "priority_action": {
    "title": string,
    "description": string,
    "target_contact": string,
    "urgency": "critical" | "high" | "medium" | "low",
    "optimal_timing": string,
    "action_script": string,
    "expected_outcome": string,
    "success_probability": number,
    "risk_level": number
  },
  "immediate_actions": [
    {
      "category": string,
      "title": string,
      "target_contact": string,
      "action_description": string,
      "timing": string,
      "talking_points": string[],
      "success_probability": number,
      "risk_assessment": string
    }
  ],
  "influence_opportunities": [
    {
      "opportunity_type": string,
      "target_contact": string,
      "window_opens": string,
      "window_closes": string,
      "approach_strategy": string,
      "key_leverage": string,
      "success_probability": number,
      "ask_to_make": string
    }
  ],
  "relationship_investments": [
    {
      "contact": string,
      "current_status": string,
      "recommended_action": string,
      "investment_level": "low" | "medium" | "high",
      "expected_return": string,
      "timeline": string
    }
  ],
  "risk_alerts": [
    {
      "alert_type": string,
      "severity": "low" | "medium" | "high" | "critical",
      "affected_contacts": string[],
      "description": string,
      "mitigation_actions": string[],
      "deadline": string
    }
  ],
  "strategic_plays": [
    {
      "play_name": string,
      "objective": string,
      "contacts_involved": string[],
      "steps": string[],
      "timeline": string,
      "success_metrics": string[],
      "contingency_plan": string
    }
  ],
  "daily_focus": {
    "primary_objective": string,
    "key_contacts": string[],
    "avoid_contacts": string[],
    "mindset_guidance": string
  },
  "intelligence_gaps": [
    {
      "gap_type": string,
      "affected_contacts": string[],
      "recommended_gathering_method": string
    }
  ]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, context = 'daily_briefing', focusProfileId } = await req.json() as RecommendationRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get AI configuration from database
    const aiConfig = await getAIConfig(supabase, userId);
    const maxContactsToAnalyze = await getPlatformConfig(supabase, 'analysis.max_contacts_per_recommendation', { userId }) || 100;
    const maxRecentMessages = await getPlatformConfig(supabase, 'analysis.max_recent_messages', { userId }) || 200;

    // Gather comprehensive intelligence
    const [
      { data: profiles },
      { data: recentMessages },
      { data: personalityProfiles },
      { data: influenceCampaigns },
      { data: deceptionAlerts },
      { data: financialIntel },
      { data: powerAnalysis },
      { data: correlations },
      { data: upcomingEvents },
      { data: relationshipHealth }
    ] = await Promise.all([
      supabase.from('profiles').select('id, name, company, title, relationship_type, relationship_strength, last_contact, tags').eq('user_id', userId).eq('is_active', true).limit(maxContactsToAnalyze),
      supabase.from('messages').select('profile_id, content, direction, created_at, ai_analysis').eq('user_id', userId).order('created_at', { ascending: false }).limit(maxRecentMessages),
      supabase.from('personality_profiles').select('profile_id, exploitation_profile, communication_style').eq('user_id', userId),
      supabase.from('influence_campaigns').select('*').eq('user_id', userId).eq('status', 'active'),
      supabase.from('deception_analyses').select('profile_id, overall_deception_score, risk_level, analyzed_at').eq('user_id', userId).gte('analyzed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('financial_intelligence').select('profile_id, wealth_tier, opportunity_windows').eq('user_id', userId),
      supabase.from('power_network_analyses').select('strategic_opportunities, network_risks').eq('user_id', userId).order('analyzed_at', { ascending: false }).limit(1),
      supabase.from('deep_correlations').select('*').eq('user_id', userId).order('discovered_at', { ascending: false }).limit(20),
      supabase.from('events').select('*').eq('user_id', userId).gte('start_time', new Date().toISOString()).limit(20),
      supabase.from('relationship_health_scores').select('*').eq('user_id', userId).order('calculated_at', { ascending: false }).limit(50)
    ]);

    // Build intelligence context
    const intelligenceData = {
      context,
      focusProfile: focusProfileId,
      currentTime: new Date().toISOString(),
      contacts: profiles?.map(p => ({
        id: p.id,
        name: p.name,
        company: p.company,
        relationship: p.relationship_type,
        strength: p.relationship_strength,
        lastContact: p.last_contact,
        personality: personalityProfiles?.find(pp => pp.profile_id === p.id)?.exploitation_profile,
        financialTier: financialIntel?.find(fi => fi.profile_id === p.id)?.wealth_tier,
        deceptionRisk: deceptionAlerts?.find(d => d.profile_id === p.id)?.risk_level,
        healthScore: relationshipHealth?.find(rh => rh.profile_id === p.id)
      })),
      activeCampaigns: influenceCampaigns?.map(c => ({
        target: c.profile_id,
        type: c.campaign_type,
        stage: c.status,
        nextTouch: c.planned_touches?.[0]
      })),
      recentCommunication: recentMessages?.slice(0, 50).map(m => ({
        contact: m.profile_id,
        direction: m.direction,
        sentiment: m.ai_analysis?.sentiment,
        time: m.created_at
      })),
      strategicOpportunities: powerAnalysis?.[0]?.strategic_opportunities,
      networkRisks: powerAnalysis?.[0]?.network_risks,
      hiddenCorrelations: correlations?.filter(c => c.strength > 0.7),
      upcomingCalendar: upcomingEvents
    };

    // Generate recommendations using database-configured model
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.defaultModel,
        messages: [
          { role: 'system', content: ACTION_RECOMMENDATION_PROMPT },
          { role: 'user', content: `Generate action recommendations from this intelligence:\n\n${JSON.stringify(intelligenceData, null, 2)}` }
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.maxTokens
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    let recommendations;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      recommendations = { error: 'Failed to parse recommendations', raw: content };
    }

    // Store recommendations
    const recommendationsToInsert = [
      ...(recommendations.immediate_actions || []).map((a: any) => ({
        user_id: userId,
        recommendation_type: 'immediate_action',
        title: a.title,
        description: a.action_description,
        category: a.category,
        priority_score: a.success_probability * 100,
        urgency: 'high',
        suggested_action: a.action_description,
        talking_points: a.talking_points,
        success_probability: a.success_probability,
        risk_assessment: { risk: a.risk_assessment }
      })),
      ...(recommendations.influence_opportunities || []).map((o: any) => ({
        user_id: userId,
        recommendation_type: 'influence_opportunity',
        title: o.opportunity_type,
        description: o.approach_strategy,
        priority_score: o.success_probability * 100,
        urgency: 'medium',
        suggested_action: o.ask_to_make,
        opportunity_window: { opens: o.window_opens, closes: o.window_closes },
        success_probability: o.success_probability
      })),
      ...(recommendations.risk_alerts || []).map((r: any) => ({
        user_id: userId,
        recommendation_type: 'risk_alert',
        title: r.alert_type,
        description: r.description,
        priority_score: r.severity === 'critical' ? 100 : r.severity === 'high' ? 80 : 50,
        urgency: r.severity,
        suggested_action: r.mitigation_actions?.join('; ')
      }))
    ];

    if (recommendationsToInsert.length > 0) {
      await supabase.from('action_recommendations').insert(recommendationsToInsert);
    }

    // Log AI usage with actual model used
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'action-recommendation-engine',
      model_name: aiConfig.defaultModel,
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.0001),
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      recommendations,
      generatedAt: new Date().toISOString(),
      contactsAnalyzed: profiles?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Action recommendation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
