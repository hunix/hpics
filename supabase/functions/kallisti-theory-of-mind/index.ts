import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Kallisti Theory of Mind Engine
 * Based on DARPA Kallisti Program (Dec 2024)
 * 
 * Implements algorithmic theory of mind to model adversary situational awareness
 * using basis vector decomposition and non-stationary strategy tracking.
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
      function: 'kallisti-theory-of-mind', 
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

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) throw new Error('userId required for service calls');
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log(`[Kallisti ToM] Analyzing adversary mental model for profile ${profileId}`);

    // Gather behavioral data for mental model construction
    const [profileResult, behavioralResult, communicationsResult, interactionsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['behavioral_dna', 'manipulation_susceptibility', 'cognitive_warfare'])
        .limit(10),
      supabase.from('communications')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('contact_interaction_notes')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    const profile = profileResult.data;
    const behavioralAnalyses = behavioralResult.data || [];
    const communications = communicationsResult.data || [];
    const interactions = interactionsResult.data || [];

    // Build basis vectors for adversary mental model
    const basisVectors = buildBasisVectors(behavioralAnalyses, communications);
    
    // Estimate belief state
    const beliefState = estimateBeliefState(behavioralAnalyses, interactions);
    
    // Calculate strategy distribution
    const strategyDistribution = calculateStrategyDistribution(basisVectors, beliefState);
    
    // Assess non-stationary indicators
    const nonStationaryIndicators = detectNonStationarity(communications, interactions);
    
    // Calculate deception susceptibility
    const deceptionSusceptibility = calculateDeceptionSusceptibility(beliefState, basisVectors);
    
    // Estimate situational awareness
    const situationalAwareness = estimateSituationalAwareness(basisVectors, beliefState);

    const mentalModel = {
      profileId,
      modelVersion: '1.0.0-kallisti',
      analyzedAt: new Date().toISOString(),
      basisVectors,
      beliefState,
      strategyDistribution,
      nonStationaryIndicators,
      deceptionSusceptibility,
      situationalAwarenessEstimate: situationalAwareness,
      predictionAccuracyHistory: [],
      lastCalibratedAt: new Date().toISOString(),
      recommendations: generateToMRecommendations(deceptionSusceptibility, situationalAwareness),
    };

    // Persist to adversary_mental_models table
    await supabase
      .from('adversary_mental_models')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        basis_vectors: basisVectors,
        belief_state: beliefState,
        strategy_distribution: strategyDistribution,
        non_stationary_indicators: nonStationaryIndicators,
        deception_susceptibility: deceptionSusceptibility,
        situational_awareness_estimate: situationalAwareness,
        model_version: '1.0.0-kallisti',
        last_calibrated_at: new Date().toISOString(),
        prediction_accuracy_history: [],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,user_id',
      });

    // Also persist to ai_analyses for dossier integration
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'adversary_mental_model',
        result: mentalModel,
        confidence_score: calculateConfidence(basisVectors, beliefState),
        model_used: 'kallisti-theory-of-mind-v1.0',
        tokens_used: 0,
        cost_cents: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    console.log(`[Kallisti ToM] Mental model built for ${profileId} with ${Object.keys(basisVectors).length} basis vectors`);

    return new Response(JSON.stringify({
      success: true,
      mentalModel,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Kallisti ToM] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildBasisVectors(analyses: any[], communications: any[]): Record<string, number[]> {
  // Construct basis vectors from behavioral dimensions
  const vectors: Record<string, number[]> = {
    riskTolerance: [0.5, 0.3, 0.2], // Low, Medium, High
    informationSeeking: [0.4, 0.4, 0.2],
    cooperationTendency: [0.3, 0.4, 0.3],
    deceptionAwareness: [0.6, 0.3, 0.1],
    emotionalReactivity: [0.3, 0.5, 0.2],
  };

  // Adjust based on behavioral analyses
  for (const analysis of analyses) {
    const result = analysis.result || {};
    
    if (analysis.analysis_type === 'behavioral_dna') {
      if (result.riskProfile) {
        vectors.riskTolerance = normalizeVector([
          1 - (result.riskProfile.tolerance || 0.5),
          0.3,
          result.riskProfile.tolerance || 0.5,
        ]);
      }
    }
    
    if (analysis.analysis_type === 'manipulation_susceptibility') {
      if (result.susceptibilityScore !== undefined) {
        const susc = result.susceptibilityScore;
        vectors.deceptionAwareness = normalizeVector([
          1 - susc,
          0.3,
          susc * 0.5,
        ]);
      }
    }
  }

  // Adjust based on communication patterns
  const avgLength = communications.reduce((sum, c) => sum + ((c.content?.length || 0) / 100), 0) / Math.max(communications.length, 1);
  vectors.informationSeeking = normalizeVector([
    Math.max(0.1, 0.5 - avgLength * 0.1),
    0.4,
    Math.min(0.5, avgLength * 0.1),
  ]);

  return vectors;
}

function normalizeVector(vec: number[]): number[] {
  const sum = vec.reduce((a, b) => a + b, 0);
  return vec.map(v => v / sum);
}

function estimateBeliefState(analyses: any[], interactions: any[]): Record<string, any> {
  const beliefState = {
    perceivedRelationshipQuality: 0.5,
    estimatedTrustLevel: 0.5,
    awarenessOfOurIntentions: 0.3,
    confidenceInOwnPosition: 0.5,
    expectedCooperation: 0.5,
    uncertaintyLevel: 0.5,
  };

  // Derive from analyses
  for (const analysis of analyses) {
    const result = analysis.result || {};
    if (result.trustLevel !== undefined) {
      beliefState.estimatedTrustLevel = result.trustLevel;
    }
    if (result.confidenceScore !== undefined) {
      beliefState.confidenceInOwnPosition = result.confidenceScore;
    }
  }

  // Derive from interaction patterns
  const positiveInteractions = interactions.filter(i => 
    (i.sentiment_score || 0) > 0.5 || (i.interaction_type === 'positive')
  ).length;
  const totalInteractions = interactions.length || 1;
  
  beliefState.perceivedRelationshipQuality = positiveInteractions / totalInteractions;
  beliefState.expectedCooperation = (beliefState.perceivedRelationshipQuality + beliefState.estimatedTrustLevel) / 2;
  beliefState.uncertaintyLevel = 1 - Math.abs(beliefState.expectedCooperation - 0.5) * 2;

  return beliefState;
}

function calculateStrategyDistribution(basisVectors: Record<string, number[]>, beliefState: Record<string, any>): Record<string, number> {
  // Map to likely strategy preferences
  const strategies: Record<string, number> = {
    cooperative: 0.25,
    competitive: 0.25,
    accommodating: 0.2,
    avoiding: 0.15,
    compromising: 0.15,
  };

  // Adjust based on basis vectors and belief state
  if (basisVectors.cooperationTendency) {
    strategies.cooperative += basisVectors.cooperationTendency[2] * 0.2;
    strategies.competitive -= basisVectors.cooperationTendency[2] * 0.1;
  }

  if (beliefState.expectedCooperation > 0.6) {
    strategies.cooperative += 0.15;
    strategies.accommodating += 0.1;
  } else if (beliefState.expectedCooperation < 0.4) {
    strategies.competitive += 0.15;
    strategies.avoiding += 0.1;
  }

  // Normalize
  const total = Object.values(strategies).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(strategies)) {
    strategies[key] = strategies[key] / total;
  }

  return strategies;
}

function detectNonStationarity(communications: any[], interactions: any[]): Record<string, any> {
  const indicators: Record<string, any> = {
    behaviorShiftDetected: false,
    trendDirection: 'stable',
    volatilityScore: 0.3,
    lastShiftDate: null,
    shiftMagnitude: 0,
  };

  if (communications.length < 5) return indicators;

  // Analyze sentiment trend
  const recentComms = communications.slice(0, 10);
  const olderComms = communications.slice(10, 25);

  const recentAvg = recentComms.reduce((sum, c) => sum + (c.sentiment_score || 0.5), 0) / recentComms.length;
  const olderAvg = olderComms.length > 0 
    ? olderComms.reduce((sum, c) => sum + (c.sentiment_score || 0.5), 0) / olderComms.length 
    : 0.5;

  const delta = recentAvg - olderAvg;
  
  if (Math.abs(delta) > 0.2) {
    indicators.behaviorShiftDetected = true;
    indicators.trendDirection = delta > 0 ? 'improving' : 'deteriorating';
    indicators.shiftMagnitude = Math.abs(delta);
    indicators.lastShiftDate = recentComms[0]?.created_at || null;
  }

  // Calculate volatility
  const sentiments = communications.slice(0, 15).map(c => c.sentiment_score || 0.5);
  if (sentiments.length > 2) {
    const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - recentAvg, 2), 0) / sentiments.length;
    indicators.volatilityScore = Math.min(1, Math.sqrt(variance) * 2);
  }

  return indicators;
}

function calculateDeceptionSusceptibility(beliefState: Record<string, any>, basisVectors: Record<string, number[]>): number {
  let susceptibility = 0.5;

  // High uncertainty increases susceptibility
  susceptibility += (beliefState.uncertaintyLevel - 0.5) * 0.3;

  // Low awareness of our intentions increases susceptibility
  susceptibility += (0.5 - beliefState.awarenessOfOurIntentions) * 0.2;

  // Low deception awareness from basis vectors
  if (basisVectors.deceptionAwareness) {
    susceptibility += (1 - basisVectors.deceptionAwareness[0]) * 0.2;
  }

  // High confidence can lead to overconfidence
  if (beliefState.confidenceInOwnPosition > 0.7) {
    susceptibility += 0.1;
  }

  return Math.max(0, Math.min(1, susceptibility));
}

function estimateSituationalAwareness(basisVectors: Record<string, number[]>, beliefState: Record<string, any>): Record<string, any> {
  return {
    overallAwareness: Math.min(0.8, Math.max(0.2, 
      0.5 + (beliefState.awarenessOfOurIntentions - 0.5) * 0.5
    )),
    blindSpots: [
      'Hidden strategic options we possess',
      'Our actual resource capabilities',
      'Third-party alliances',
    ],
    knowledgeGaps: [
      'Our true intentions',
      'Timeline of our planned actions',
      'Fallback positions',
    ],
    accuratePerceptions: [
      'General relationship dynamics',
      'Surface-level communication patterns',
    ],
    exploitableAssumptions: [
      beliefState.expectedCooperation > 0.6 
        ? 'Assumes continued cooperation' 
        : 'Assumes adversarial stance',
      'May underestimate our information advantage',
    ],
  };
}

function generateToMRecommendations(deceptionSusceptibility: number, awareness: Record<string, any>): string[] {
  const recommendations: string[] = [];

  if (deceptionSusceptibility > 0.6) {
    recommendations.push('Target is highly susceptible to strategic misdirection');
    recommendations.push('Consider information asymmetry exploitation');
  } else if (deceptionSusceptibility < 0.4) {
    recommendations.push('Target has strong deception detection - use subtle approaches');
    recommendations.push('Build credibility before attempting influence operations');
  }

  if (awareness.overallAwareness < 0.4) {
    recommendations.push('Significant information advantage exists - exploit blind spots');
    recommendations.push('Control narrative through selective information disclosure');
  }

  recommendations.push('Monitor for non-stationary behavior shifts that may indicate strategy changes');
  recommendations.push('Regularly recalibrate mental model with new behavioral data');

  return recommendations;
}

function calculateConfidence(basisVectors: Record<string, number[]>, beliefState: Record<string, any>): number {
  const vectorCount = Object.keys(basisVectors).length;
  const beliefCount = Object.keys(beliefState).filter(k => beliefState[k] !== undefined).length;
  
  return Math.min(0.95, 0.5 + (vectorCount * 0.05) + (beliefCount * 0.03));
}
