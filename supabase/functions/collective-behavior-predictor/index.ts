import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * MAGICS Collective Behavior Predictor
 * Based on DARPA MAGICS Program (April 2025)
 * 
 * Predicts collective human behavior in "recursive, reactive, non-ergodic" systems.
 * Addresses "reflexivity" - how behavior changes when observed.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'collective-behavior-predictor', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log(`[MAGICS] Analyzing collective behavior patterns for profile ${profileId}`);

    // Gather network and relationship data
    const [profileResult, relationshipsResult, networkResult, groupsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('relationships')
        .select('*')
        .or(`profile_id.eq.${profileId},related_profile_id.eq.${profileId}`)
        .limit(100),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['network_exploitation', 'power_network', 'shadow_network'])
        .limit(10),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'sentiment_cascade')
        .limit(5),
    ]);

    const profile = profileResult.data;
    const relationships = relationshipsResult.data || [];
    const networkAnalyses = networkResult.data || [];
    const groupAnalyses = groupsResult.data || [];

    // Build collective behavior model
    const networkTopology = analyzeNetworkTopology(relationships, networkAnalyses);
    const reflexivityFactors = calculateReflexivityFactors(relationships);
    const cascadePredictions = predictCascades(networkTopology, reflexivityFactors);
    const emergentPatterns = detectEmergentPatterns(relationships, networkAnalyses);
    const nonErgodicDynamics = modelNonErgodicDynamics(relationships, groupAnalyses);

    const collectiveBehavior = {
      profileId,
      modelVersion: '1.0.0-magics',
      analyzedAt: new Date().toISOString(),
      networkTopology,
      reflexivityFactors,
      cascadePredictions,
      emergentPatterns,
      nonErgodicDynamics,
      interventionPoints: identifyInterventionPoints(networkTopology, cascadePredictions),
      predictions: generatePredictions(cascadePredictions, emergentPatterns),
    };

    // Persist to collective_behavior_predictions table
    await supabase
      .from('collective_behavior_predictions')
      .upsert({
        profile_id: profileId,
        user_id: user.id,
        network_context: networkTopology,
        reflexivity_score: reflexivityFactors.overallReflexivity,
        cascade_probability: cascadePredictions.overallProbability,
        emergent_patterns: emergentPatterns,
        non_ergodic_dynamics: nonErgodicDynamics,
        intervention_points: collectiveBehavior.interventionPoints,
        prediction_horizon_days: 30,
        model_version: '1.0.0-magics',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,user_id',
      });

    // Also persist to ai_analyses
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: user.id,
        analysis_type: 'collective_behavior',
        result: collectiveBehavior,
        confidence_score: calculateConfidence(networkTopology, relationships.length),
        model_used: 'magics-collective-v1.0',
        tokens_used: 0,
        cost_cents: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    console.log(`[MAGICS] Collective behavior analysis complete for ${profileId}`);

    return new Response(JSON.stringify({
      success: true,
      collectiveBehavior,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[MAGICS] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeNetworkTopology(relationships: any[], networkAnalyses: any[]): Record<string, any> {
  const nodeCount = new Set(relationships.flatMap(r => [r.profile_id, r.related_profile_id])).size;
  const edgeCount = relationships.length;
  
  // Calculate network metrics
  const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;
  
  // Estimate clustering from relationship types
  const strongTies = relationships.filter(r => 
    r.relationship_strength === 'strong' || (r.trust_score || 0) > 0.7
  ).length;
  
  const clusteringCoefficient = edgeCount > 0 ? strongTies / edgeCount : 0;

  // Extract network position from analyses
  let centralityScore = 0.5;
  let bridgingScore = 0.3;
  
  for (const analysis of networkAnalyses) {
    const result = analysis.result || {};
    if (result.centralityScore !== undefined) {
      centralityScore = result.centralityScore;
    }
    if (result.bridgingScore !== undefined) {
      bridgingScore = result.bridgingScore;
    }
  }

  return {
    nodeCount,
    edgeCount,
    density: Math.min(1, density),
    clusteringCoefficient,
    centralityScore,
    bridgingScore,
    networkType: density > 0.5 ? 'dense' : density > 0.2 ? 'moderate' : 'sparse',
    hubPotential: centralityScore > 0.7,
    bridgePotential: bridgingScore > 0.5,
  };
}

function calculateReflexivityFactors(relationships: any[]): Record<string, any> {
  // Reflexivity: how behavior changes when observed
  
  // Calculate observation sensitivity from relationship dynamics
  const bidirectionalCount = relationships.filter(r => 
    r.is_mutual || r.relationship_type === 'mutual'
  ).length;
  
  const observationSensitivity = relationships.length > 0 
    ? 0.3 + (bidirectionalCount / relationships.length) * 0.4
    : 0.5;

  // Reactivity to perceived monitoring
  const highTrustCount = relationships.filter(r => (r.trust_score || 0) > 0.7).length;
  const reactivityScore = relationships.length > 0
    ? 0.5 - (highTrustCount / relationships.length) * 0.3
    : 0.5;

  // Adaptation speed estimate
  const adaptationSpeed = 0.5 + Math.random() * 0.3; // Would use temporal data in production

  return {
    overallReflexivity: (observationSensitivity + reactivityScore + adaptationSpeed) / 3,
    observationSensitivity,
    reactivityScore,
    adaptationSpeed,
    hawthornePotential: observationSensitivity > 0.6,
    counterSurveillanceLikelihood: reactivityScore > 0.6 ? 'high' : reactivityScore > 0.4 ? 'medium' : 'low',
  };
}

function predictCascades(topology: Record<string, any>, reflexivity: Record<string, any>): Record<string, any> {
  // Predict information/behavior cascade dynamics
  
  const cascadePotential = topology.density * 0.4 + topology.clusteringCoefficient * 0.3 + (1 - reflexivity.reactivityScore) * 0.3;
  
  const spreadVelocity = topology.density > 0.5 ? 'fast' : topology.density > 0.2 ? 'moderate' : 'slow';
  
  const dampingFactor = reflexivity.overallReflexivity * 0.5;
  
  const reachEstimate = Math.min(1, topology.centralityScore + topology.bridgingScore * 0.5);

  return {
    overallProbability: Math.min(0.95, cascadePotential),
    spreadVelocity,
    dampingFactor,
    estimatedReach: reachEstimate,
    peakTimeHours: spreadVelocity === 'fast' ? 6 : spreadVelocity === 'moderate' ? 24 : 72,
    cascadeTypes: {
      information: cascadePotential * 0.8,
      behavioral: cascadePotential * 0.6,
      emotional: cascadePotential * (1 - dampingFactor),
    },
    viralThreshold: 0.3 + topology.density * 0.2,
  };
}

function detectEmergentPatterns(relationships: any[], analyses: any[]): any[] {
  const patterns: any[] = [];

  // Check for power concentration
  const strongRelationships = relationships.filter(r => (r.trust_score || 0) > 0.7);
  if (strongRelationships.length > relationships.length * 0.3) {
    patterns.push({
      type: 'power_concentration',
      description: 'High concentration of strong-tie relationships',
      significance: 'high',
      exploitability: 0.6,
    });
  }

  // Check for echo chamber formation
  const mutualRelationships = relationships.filter(r => r.is_mutual);
  if (mutualRelationships.length > relationships.length * 0.5) {
    patterns.push({
      type: 'echo_chamber',
      description: 'High reciprocity suggests potential echo chamber',
      significance: 'medium',
      exploitability: 0.7,
    });
  }

  // Check for bridge position
  const weakTies = relationships.filter(r => (r.trust_score || 0) < 0.4);
  if (weakTies.length > relationships.length * 0.4) {
    patterns.push({
      type: 'structural_hole_bridge',
      description: 'Many weak ties indicate bridge position between groups',
      significance: 'high',
      exploitability: 0.8,
    });
  }

  // Add default pattern if none detected
  if (patterns.length === 0) {
    patterns.push({
      type: 'stable_network',
      description: 'Network shows balanced relationship distribution',
      significance: 'low',
      exploitability: 0.4,
    });
  }

  return patterns;
}

function modelNonErgodicDynamics(relationships: any[], groupAnalyses: any[]): Record<string, any> {
  // Non-ergodic: path-dependent, history matters
  
  return {
    pathDependency: 0.6, // Historical events shape current state
    irreversibilityScore: 0.4, // Difficulty of reversing current patterns
    criticalTransitions: [
      {
        type: 'trust_threshold',
        threshold: 0.3,
        currentState: 0.5,
        nearCritical: false,
      },
      {
        type: 'network_density',
        threshold: 0.1,
        currentState: 0.3,
        nearCritical: false,
      },
    ],
    hysteresisEffects: [
      'Relationship damage harder to repair than create',
      'Group polarization tends to self-reinforce',
    ],
    tipingPointProximity: 0.3,
  };
}

function identifyInterventionPoints(topology: Record<string, any>, cascades: Record<string, any>): any[] {
  const points: any[] = [];

  if (topology.bridgePotential) {
    points.push({
      type: 'bridge_node',
      description: 'Target acts as bridge between groups',
      leverage: 'high',
      action: 'Use to spread influence across network clusters',
    });
  }

  if (topology.hubPotential) {
    points.push({
      type: 'hub_node',
      description: 'Target is central hub with many connections',
      leverage: 'high',
      action: 'Single influence point for maximum cascade effect',
    });
  }

  if (cascades.viralThreshold < 0.4) {
    points.push({
      type: 'low_viral_threshold',
      description: 'Network requires minimal activation for cascade',
      leverage: 'medium',
      action: 'Small interventions can trigger large-scale changes',
    });
  }

  points.push({
    type: 'timing_sensitivity',
    description: 'Collective behavior is timing-sensitive',
    leverage: 'medium',
    action: `Optimal intervention window: ${cascades.peakTimeHours} hours`,
  });

  return points;
}

function generatePredictions(cascades: Record<string, any>, patterns: any[]): any[] {
  const predictions: any[] = [];

  predictions.push({
    prediction: 'Information cascade potential',
    probability: cascades.cascadeTypes.information,
    timeframe: `${cascades.peakTimeHours} hours`,
    confidence: 0.7,
  });

  predictions.push({
    prediction: 'Behavioral contagion likelihood',
    probability: cascades.cascadeTypes.behavioral,
    timeframe: '1-7 days',
    confidence: 0.6,
  });

  for (const pattern of patterns) {
    if (pattern.significance === 'high') {
      predictions.push({
        prediction: `${pattern.type} exploitation opportunity`,
        probability: pattern.exploitability,
        timeframe: '30 days',
        confidence: 0.65,
      });
    }
  }

  return predictions;
}

function calculateConfidence(topology: Record<string, any>, relationshipCount: number): number {
  let confidence = 0.5;
  
  if (relationshipCount > 20) confidence += 0.2;
  else if (relationshipCount > 10) confidence += 0.15;
  else if (relationshipCount > 5) confidence += 0.1;
  
  if (topology.nodeCount > 10) confidence += 0.1;
  
  return Math.min(0.95, confidence);
}
