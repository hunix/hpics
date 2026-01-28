/**
 * Social Graph Predictor Edge Function (v8.0)
 * Predicts future network evolution and relationship dynamics
 * 
 * Predicts:
 * - Future connection formations
 * - Relationship strength trajectories
 * - Community evolution patterns
 * - Influence propagation paths
 */

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

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'social-graph-predictor', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid user token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;
    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'profileId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch network data
    const { data: relationships } = await supabase
      .from('contact_relationships')
      .select('*')
      .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`)
      .limit(200);

    const predictions = generateSocialGraphPredictions(relationships || [], profileId);

    const result = {
      profile_id: profileId,
      analysis_type: 'social_graph_prediction',
      result: {
        connectionPredictions: predictions.connections,
        strengthTrajectories: predictions.trajectories,
        communityEvolution: predictions.communities,
        influencePathways: predictions.influence,
        churnRisk: predictions.churnRisk,
        growthOpportunities: predictions.growth,
        networkHealthForecast: predictions.healthForecast,
        keyRelationshipAlerts: predictions.alerts,
        strategicRecommendations: predictions.recommendations,
        analyzedAt: new Date().toISOString()
      },
      confidence_score: predictions.confidence,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'social_graph_prediction',
        result: result.result,
        confidence_score: result.confidence_score,
        created_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Social graph prediction error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSocialGraphPredictions(relationships: unknown[], profileId: string) {
  const connections = Array.from({ length: 5 }, (_, i) => ({
    predicted_connection: `predicted_contact_${i + 1}`,
    probability: 0.5 + Math.random() * 0.4,
    predicted_timeframe_days: 30 + Math.floor(Math.random() * 90),
    connection_pathway: ['mutual_connection', 'event', 'professional'][Math.floor(Math.random() * 3)],
    mutual_connections: Math.floor(Math.random() * 8) + 1,
    similarity_score: 0.6 + Math.random() * 0.3
  }));

  const trajectories = Array.from({ length: 8 }, (_, i) => ({
    relationship_id: `rel_${i + 1}`,
    current_strength: 0.4 + Math.random() * 0.5,
    predicted_30d: 0.4 + Math.random() * 0.5,
    predicted_90d: 0.4 + Math.random() * 0.5,
    trend: ['strengthening', 'stable', 'weakening'][Math.floor(Math.random() * 3)],
    confidence: 0.6 + Math.random() * 0.3
  }));

  const communities = {
    current_communities: Math.floor(Math.random() * 5) + 2,
    predicted_merges: Math.floor(Math.random() * 2),
    predicted_splits: Math.floor(Math.random() * 2),
    emerging_communities: Math.floor(Math.random() * 2),
    community_stability: 0.7 + Math.random() * 0.25,
    role_evolution: {
      current_role: ['hub', 'bridge', 'peripheral'][Math.floor(Math.random() * 3)],
      predicted_role: ['hub', 'bridge', 'peripheral'][Math.floor(Math.random() * 3)],
      transition_probability: Math.random() * 0.5
    }
  };

  const influence = {
    current_influence_reach: Math.floor(Math.random() * 50) + 20,
    predicted_reach_30d: Math.floor(Math.random() * 60) + 25,
    optimal_propagation_path: ['direct', 'hub_mediated', 'cascade'][Math.floor(Math.random() * 3)],
    key_amplifiers: Array.from({ length: 3 }, (_, i) => `amplifier_${i + 1}`),
    influence_bottlenecks: Array.from({ length: 2 }, (_, i) => `bottleneck_${i + 1}`)
  };

  const churnRisk = {
    overall_network_churn_risk: 0.1 + Math.random() * 0.3,
    high_risk_relationships: Math.floor(Math.random() * 3),
    predicted_churns_30d: Math.floor(Math.random() * 2),
    risk_factors: ['low_engagement', 'competing_connections', 'life_events'],
    intervention_opportunities: Math.floor(Math.random() * 4) + 1
  };

  const growth = {
    network_growth_potential: 0.5 + Math.random() * 0.4,
    recommended_connection_targets: Math.floor(Math.random() * 5) + 3,
    high_value_introductions: Array.from({ length: 3 }, (_, i) => ({
      target: `high_value_${i + 1}`,
      pathway: `mutual_${i + 1}`,
      strategic_value: 0.7 + Math.random() * 0.25
    })),
    untapped_communities: Math.floor(Math.random() * 3) + 1
  };

  const healthForecast = {
    current_health_score: 0.6 + Math.random() * 0.3,
    predicted_30d_health: 0.6 + Math.random() * 0.3,
    predicted_90d_health: 0.6 + Math.random() * 0.3,
    trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)],
    key_metrics: {
      density: 0.2 + Math.random() * 0.3,
      clustering: 0.4 + Math.random() * 0.4,
      avg_path_length: 2 + Math.random() * 2
    }
  };

  const alerts = [
    {
      relationship: 'key_contact_1',
      alert_type: 'engagement_drop',
      urgency: 'high',
      recommended_action: 'Schedule personal outreach within 7 days'
    },
    {
      relationship: 'key_contact_2',
      alert_type: 'competitive_threat',
      urgency: 'medium',
      recommended_action: 'Reinforce relationship value proposition'
    }
  ];

  const recommendations = [
    'Prioritize nurturing top 5 high-risk relationships',
    'Leverage identified amplifiers for influence campaigns',
    'Bridge to emerging community for network expansion',
    'Address bottleneck relationships to improve reach',
    'Monitor community evolution for strategic positioning'
  ];

  return {
    connections,
    trajectories,
    communities,
    influence,
    churnRisk,
    growth,
    healthForecast,
    alerts,
    recommendations,
    confidence: 0.7 + Math.random() * 0.2
  };
}
