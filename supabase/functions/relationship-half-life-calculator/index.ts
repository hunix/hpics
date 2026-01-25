/**
 * Relationship Half-Life Calculator Edge Function (v6.0)
 * 
 * Calculates trust decay curves using exponential decay models
 * with configurable half-lives based on relationship type and interaction history.
 * 
 * Formula: T(t) = T₀ × (0.5)^(t/h) where h = half-life in days
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Half-life constants by relationship type (in days)
const HALF_LIFE_BY_TYPE: Record<string, number> = {
  professional: 14,
  colleague: 14,
  client: 21,
  personal: 30,
  friend: 30,
  family: 90,
  intimate: 60,
  strategic: 7,
  asset: 7,
  acquaintance: 10,
};

// Trust reinforcement actions by urgency
const REINFORCEMENT_ACTIONS: Record<string, string[]> = {
  immediate: [
    'Initiate direct contact within 24 hours',
    'Schedule face-to-face meeting',
    'Provide unexpected value or assistance',
    'Address any outstanding grievances',
  ],
  soon: [
    'Send personalized message within 3 days',
    'Share relevant information or opportunity',
    'Acknowledge their recent achievements',
    'Invite to collaborative activity',
  ],
  scheduled: [
    'Plan regular check-in cadence',
    'Include in group activities',
    'Maintain presence in shared spaces',
    'Send occasional value-adding content',
  ],
  none: [
    'Continue current engagement patterns',
    'Monitor for any changes in behavior',
  ],
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({
      ok: true,
      function: 'relationship-half-life-calculator',
      timestamp: Date.now(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[relationship-half-life-calculator] Processing profile: ${profileId}`);

    // Fetch all required data in parallel
    const [
      profileResult,
      trustTrajectoryResult,
      betrayalResult,
      interactionsResult,
      communicationsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('trust_trajectories').select('*')
        .eq('profile_id', profileId)
        .order('trajectory_date', { ascending: false })
        .limit(180),
      supabase.from('betrayal_predictions').select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase.from('contact_interaction_notes').select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('communications').select('*')
        .eq('profile_id', profileId)
        .order('communication_date', { ascending: false })
        .limit(100),
    ]);

    const profile = profileResult.data;
    const trustTrajectory = trustTrajectoryResult.data || [];
    const betrayalPrediction = betrayalResult.data?.[0];
    const interactions = interactionsResult.data || [];
    const communications = communicationsResult.data || [];

    // Determine relationship type and base half-life
    const relationshipType = profile?.relationship_type || 'acquaintance';
    const baseHalfLife = HALF_LIFE_BY_TYPE[relationshipType] || 14;

    // Calculate current trust level from most recent trajectory or default
    const latestTrust = trustTrajectory.length > 0 
      ? (trustTrajectory[0].trust_level || 0.5)
      : 0.5;

    // Calculate interaction recency factor
    const now = new Date();
    const lastInteractionDate = interactions.length > 0
      ? new Date(interactions[0].created_at)
      : communications.length > 0
        ? new Date(communications[0].communication_date)
        : null;

    const daysSinceLastInteraction = lastInteractionDate
      ? Math.floor((now.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    // Adjust half-life based on interaction patterns
    // More frequent positive interactions extend the half-life
    const recentPositiveInteractions = interactions.filter(i => {
      const date = new Date(i.created_at);
      const daysSince = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince <= 30 && (i.sentiment_score || 0) > 0;
    }).length;

    const interactionModifier = Math.min(1.5, 1 + (recentPositiveInteractions * 0.1));
    const adjustedHalfLife = Math.round(baseHalfLife * interactionModifier);

    // Calculate decay rate (lambda) from half-life
    // T(t) = T₀ × e^(-λt) where λ = ln(2) / half_life
    const decayRate = Math.log(2) / adjustedHalfLife;

    // Project trust levels for the next 90 days
    const decayCurve: Array<{ date: string; projectedTrust: number }> = [];
    for (let day = 0; day <= 90; day += 7) {
      const projectedTrust = latestTrust * Math.pow(0.5, day / adjustedHalfLife);
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + day);
      decayCurve.push({
        date: futureDate.toISOString().split('T')[0],
        projectedTrust: Math.round(projectedTrust * 1000) / 1000,
      });
    }

    // Calculate specific projections
    const projectedAt30 = latestTrust * Math.pow(0.5, 30 / adjustedHalfLife);
    const projectedAt90 = latestTrust * Math.pow(0.5, 90 / adjustedHalfLife);

    // Find critical threshold date (when trust drops below 0.3)
    const criticalThreshold = 0.3;
    let criticalDate: string | null = null;
    let daysUntilCritical = -1;

    if (latestTrust > criticalThreshold) {
      // Solve: criticalThreshold = latestTrust × (0.5)^(t/h)
      // t = h × log₂(latestTrust/criticalThreshold)
      daysUntilCritical = Math.ceil(
        adjustedHalfLife * Math.log(latestTrust / criticalThreshold) / Math.log(2)
      );
      const criticalDateObj = new Date(now);
      criticalDateObj.setDate(criticalDateObj.getDate() + daysUntilCritical);
      criticalDate = criticalDateObj.toISOString().split('T')[0];
    }

    // Determine reinforcement urgency
    let urgency: 'immediate' | 'soon' | 'scheduled' | 'none' = 'none';
    if (latestTrust < 0.4 || daysUntilCritical < 7) {
      urgency = 'immediate';
    } else if (latestTrust < 0.6 || daysUntilCritical < 21) {
      urgency = 'soon';
    } else if (daysUntilCritical < 60) {
      urgency = 'scheduled';
    }

    // Build the result
    const result = {
      currentTrustLevel: Math.round(latestTrust * 1000) / 1000,
      decayRate: Math.round(decayRate * 10000) / 10000,
      halfLifeDays: adjustedHalfLife,
      baseHalfLifeDays: baseHalfLife,
      relationshipType,
      projectedTrustAt30Days: Math.round(projectedAt30 * 1000) / 1000,
      projectedTrustAt90Days: Math.round(projectedAt90 * 1000) / 1000,
      criticalThresholdDate: criticalDate,
      daysSinceLastInteraction,
      reinforcementNeeded: {
        urgency,
        suggestedActions: REINFORCEMENT_ACTIONS[urgency],
        daysUntilCritical: daysUntilCritical > 0 ? daysUntilCritical : null,
      },
      decayCurve,
      metadata: {
        recentPositiveInteractions,
        interactionModifier: Math.round(interactionModifier * 100) / 100,
        betrayalRisk: betrayalPrediction?.defection_probability || null,
        trajectoryDataPoints: trustTrajectory.length,
      },
    };

    // Update trust_trajectories with half-life data
    if (trustTrajectory.length > 0) {
      await supabase.from('trust_trajectories')
        .update({
          half_life_days: adjustedHalfLife,
          decay_rate: decayRate,
          projected_critical_date: criticalDate,
          reinforcement_urgency: urgency,
        })
        .eq('id', trustTrajectory[0].id);
    }

    // Save analysis result
    const { error: saveError } = await supabase.from('ai_analyses').upsert({
      user_id: user.id,
      profile_id: profileId,
      analysis_type: 'relationship_half_life',
      result,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,analysis_type',
    });

    if (saveError) {
      console.error('[relationship-half-life-calculator] Save error:', saveError);
    }

    console.log(`[relationship-half-life-calculator] Completed for ${profileId}: half-life=${adjustedHalfLife}d, urgency=${urgency}`);

    return new Response(JSON.stringify({
      success: true,
      result,
      confidence: 0.85,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[relationship-half-life-calculator] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
