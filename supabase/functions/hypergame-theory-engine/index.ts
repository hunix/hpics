/**
 * Hypergame Theory Engine Edge Function (v6.0)
 * 
 * Models strategic interactions where players have different perceptions
 * of the game being played (asymmetric information warfare).
 * 
 * Hypergame Concepts:
 * - Level-0: What game I think we're playing
 * - Level-1: What game you think we're playing  
 * - Level-2: What game I think you think we're playing
 * - Level-N: Recursive modeling of beliefs about beliefs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GamePerception {
  gameType: string;
  strategies: string[];
  perceivedNashEquilibrium: string;
  confidenceLevel: number;
}

interface PerceptionGap {
  gameTypeMismatch: boolean;
  strategySpaceMismatch: boolean;
  payoffMismatch: boolean;
  exploitabilityScore: number;
}

interface StrategicRecommendation {
  strategy: string;
  exploitsGap: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  expectedOutcome: string;
  counterMoves: string[];
}

interface HypergameAnalysis {
  ourPerception: GamePerception;
  theirLikelyPerception: GamePerception;
  perceptionGap: PerceptionGap;
  strategicRecommendations: StrategicRecommendation[];
  informationAdvantages: string[];
  informationVulnerabilities: string[];
  optimalDeceptionStrategies: string[];
  signalingSuggestions: string[];
}

interface MiceAssessmentData {
  money_score?: number;
  ideology_score?: number;
  coercion_score?: number;
  ego_score?: number;
  [key: string]: unknown;
}

interface PsychologicalProfileData {
  personality_traits?: {
    machiavellianism?: number;
    narcissism?: number;
    agreeableness?: number;
    [key: string]: number | undefined;
  };
  cognitive_biases?: string[];
  [key: string]: unknown;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({
      ok: true,
      function: 'hypergame-theory-engine',
      timestamp: Date.now(),
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

    console.log(`[hypergame-theory-engine] Processing profile: ${profileId}`);

    // Fetch all required data for game theory analysis
    const [
      profileResult,
      gameTheoryResult,
      miceResult,
      psychResult,
      betrayalResult,
      influenceResult,
      communicationsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('ai_analyses').select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['game_theory', 'behavioral_prediction', 'strategic_modeling'])
        .order('generated_at', { ascending: false })
        .limit(5),
      supabase.from('mice_assessments').select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase.from('psychological_profiles').select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase.from('betrayal_predictions').select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase.from('contact_influence_profiles').select('*')
        .eq('profile_id', profileId)
        .limit(1),
      supabase.from('communications').select('*')
        .eq('profile_id', profileId)
        .order('occurred_at', { ascending: false })
        .limit(50),
    ]);

    const profile = profileResult.data;
    const gameTheoryData = gameTheoryResult.data || [];
    const miceData = miceResult.data?.[0] as MiceAssessmentData | undefined;
    const psychProfile = psychResult.data?.[0] as PsychologicalProfileData | undefined;
    const betrayalData = betrayalResult.data?.[0];
    const influenceProfile = influenceResult.data?.[0];
    const communications = communicationsResult.data || [];

    // Determine relationship context and game type
    const relationshipType = profile?.relationship_type || 'professional';
    const interactionContext = inferInteractionContext(communications, profile);

    // Build our perception of the game
    const ourPerception = buildOurPerception(
      relationshipType,
      interactionContext,
      miceData,
      influenceProfile
    );

    // Model their likely perception
    const theirPerception = modelTheirPerception(
      psychProfile,
      communications,
      influenceProfile,
      relationshipType
    );

    // Analyze perception gaps
    const perceptionGap = analyzePerceptionGap(ourPerception, theirPerception);

    // Generate strategic recommendations
    const strategicRecommendations = generateStrategicRecommendations(
      ourPerception,
      theirPerception,
      perceptionGap,
      miceData,
      psychProfile
    );

    // Identify information advantages and vulnerabilities
    const informationAdvantages = identifyInformationAdvantages(
      miceData,
      psychProfile,
      betrayalData,
      ourPerception,
      theirPerception
    );

    const informationVulnerabilities = identifyInformationVulnerabilities(
      communications,
      ourPerception,
      theirPerception
    );

    // Generate deception and signaling strategies
    const optimalDeceptionStrategies = generateDeceptionStrategies(
      perceptionGap,
      psychProfile,
      miceData
    );

    const signalingSuggestions = generateSignalingSuggestions(
      perceptionGap,
      ourPerception,
      theirPerception
    );

    const hypergameAnalysis: HypergameAnalysis = {
      ourPerception,
      theirLikelyPerception: theirPerception,
      perceptionGap,
      strategicRecommendations,
      informationAdvantages,
      informationVulnerabilities,
      optimalDeceptionStrategies,
      signalingSuggestions,
    };

    const result = {
      hypergameAnalysis,
      targetProfile: {
        id: profileId,
        name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
        relationshipType,
      },
      analysisMetadata: {
        gameTheoryRecordsUsed: gameTheoryData.length,
        hasPsychProfile: !!psychProfile,
        hasMiceAssessment: !!miceData,
        hasBetrayalPrediction: !!betrayalData,
        communicationsAnalyzed: communications.length,
        analysisDate: new Date().toISOString(),
      },
      confidence: calculateAnalysisConfidence(psychProfile, miceData, communications),
    };

    // Save analysis result
    await supabase.from('ai_analyses').upsert({
      user_id: user.id,
      profile_id: profileId,
      analysis_type: 'hypergame_theory',
      result,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,analysis_type',
    });

    console.log(`[hypergame-theory-engine] Completed: exploitability=${perceptionGap.exploitabilityScore}`);

    return new Response(JSON.stringify({
      success: true,
      result,
      confidence: result.confidence,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[hypergame-theory-engine] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function inferInteractionContext(communications: any[], profile: any): string {
  if (!communications.length) return 'unknown';
  
  // Analyze communication content and patterns
  const channels = new Set(communications.map(c => c.channel));
  const hasPersonal = communications.some(c => 
    c.content?.toLowerCase().includes('family') || 
    c.content?.toLowerCase().includes('personal')
  );
  
  if (hasPersonal) return 'mixed_personal_professional';
  if (channels.has('email') && channels.size === 1) return 'formal_professional';
  if (channels.has('sms') || channels.has('whatsapp')) return 'casual_professional';
  
  return 'professional';
}

function buildOurPerception(
  relationshipType: string,
  context: string,
  miceData: MiceAssessmentData | undefined,
  influenceProfile: Record<string, unknown> | undefined
): GamePerception {
  // Determine game type based on relationship and context
  let gameType = 'cooperation';
  let strategies: string[] = [];
  let nashEquilibrium = 'mutual_cooperation';

  if (relationshipType === 'client' || relationshipType === 'professional') {
    gameType = 'negotiation';
    strategies = ['maximize_value', 'build_relationship', 'maintain_leverage', 'information_asymmetry'];
    nashEquilibrium = 'fair_exchange';
  } else if (relationshipType === 'competitor' || relationshipType === 'adversary') {
    gameType = 'zero_sum';
    strategies = ['compete', 'undermine', 'outmaneuver', 'defensive_posture'];
    nashEquilibrium = 'strategic_balance';
  } else if (relationshipType === 'friend' || relationshipType === 'family') {
    gameType = 'coordination';
    strategies = ['cooperate', 'support', 'reciprocate', 'trust_building'];
    nashEquilibrium = 'mutual_support';
  }

  // Adjust based on MICE vulnerabilities
  if (miceData) {
    const dominantMice = getDominantMiceVector(miceData);
    if (dominantMice === 'ideology') {
      strategies.push('values_alignment');
    } else if (dominantMice === 'ego') {
      strategies.push('recognition_leverage');
    } else if (dominantMice === 'coercion') {
      gameType = 'asymmetric_power';
    }
  }

  return {
    gameType,
    strategies,
    perceivedNashEquilibrium: nashEquilibrium,
    confidenceLevel: 0.7,
  };
}

function modelTheirPerception(
  psychProfile: PsychologicalProfileData | undefined,
  communications: Record<string, unknown>[],
  influenceProfile: Record<string, unknown> | undefined,
  relationshipType: string
): GamePerception {
  // Model how they likely perceive the interaction
  let gameType = 'cooperation';
  let strategies: string[] = [];
  let nashEquilibrium = 'mutual_benefit';
  let confidence = 0.5;

  // Use psychological profile to infer their mental model
  if (psychProfile) {
    const traits = psychProfile.personality_traits || {};
    
    if ((traits.machiavellianism ?? 0) > 0.6 || (traits.narcissism ?? 0) > 0.6) {
      gameType = 'zero_sum';
      strategies = ['win_at_all_costs', 'manipulation', 'self_promotion'];
      nashEquilibrium = 'dominance';
      confidence = 0.75;
    } else if ((traits.agreeableness ?? 0) > 0.7) {
      gameType = 'coordination';
      strategies = ['cooperate', 'harmonize', 'avoid_conflict'];
      nashEquilibrium = 'mutual_accommodation';
      confidence = 0.7;
    }
  }

  // Adjust based on communication patterns
  if (communications.length > 10) {
    const commsWithSentiment = communications.filter(c => 
      typeof c === 'object' && c !== null && 'sentiment_score' in c && c.sentiment_score !== null
    );
    const avgSentiment = commsWithSentiment.length > 0
      ? commsWithSentiment.reduce((sum, c) => sum + (Number((c as { sentiment_score: number }).sentiment_score) || 0), 0) / commsWithSentiment.length
      : 0;
    
    if (avgSentiment < -0.2) {
      gameType = 'conflict';
      strategies.push('defensive', 'cautious');
      confidence *= 0.8;
    } else if (avgSentiment > 0.3) {
      gameType = 'cooperation';
      strategies.push('trusting', 'open');
      confidence *= 1.1;
    }
  }

  // Use influence profile
  if (influenceProfile?.receptivity_profile) {
    strategies.push('susceptible_to_' + influenceProfile.primary_susceptibility);
  }

  if (!strategies.length) {
    strategies = ['rational_self_interest', 'risk_averse', 'status_quo_bias'];
  }

  return {
    gameType,
    strategies,
    perceivedNashEquilibrium: nashEquilibrium,
    confidenceLevel: Math.min(0.9, confidence),
  };
}

function analyzePerceptionGap(our: GamePerception, their: GamePerception): PerceptionGap {
  const gameTypeMismatch = our.gameType !== their.gameType;
  
  const ourStrategiesSet = new Set(our.strategies);
  const theirStrategiesSet = new Set(their.strategies);
  const strategyOverlap = [...ourStrategiesSet].filter(s => theirStrategiesSet.has(s)).length;
  const strategySpaceMismatch = strategyOverlap < Math.min(our.strategies.length, their.strategies.length) / 2;
  
  const payoffMismatch = our.perceivedNashEquilibrium !== their.perceivedNashEquilibrium;
  
  // Calculate exploitability based on gaps
  let exploitabilityScore = 0;
  if (gameTypeMismatch) exploitabilityScore += 0.4;
  if (strategySpaceMismatch) exploitabilityScore += 0.3;
  if (payoffMismatch) exploitabilityScore += 0.3;
  
  // Adjust for confidence levels
  exploitabilityScore *= (our.confidenceLevel + (1 - their.confidenceLevel)) / 2;

  return {
    gameTypeMismatch,
    strategySpaceMismatch,
    payoffMismatch,
    exploitabilityScore: Math.round(exploitabilityScore * 100) / 100,
  };
}

function generateStrategicRecommendations(
  our: GamePerception,
  their: GamePerception,
  gap: PerceptionGap,
  miceData: MiceAssessmentData | undefined,
  psychProfile: PsychologicalProfileData | undefined
): StrategicRecommendation[] {
  const recommendations: StrategicRecommendation[] = [];

  // Exploit game type mismatch
  if (gap.gameTypeMismatch) {
    recommendations.push({
      strategy: `Frame interactions as ${their.gameType} while playing ${our.gameType}`,
      exploitsGap: true,
      riskLevel: 'medium',
      expectedOutcome: 'Gain positional advantage through perception management',
      counterMoves: [
        'They may detect the frame mismatch',
        'Third parties may notice inconsistency',
      ],
    });
  }

  // Exploit strategy space mismatch
  if (gap.strategySpaceMismatch) {
    const ourUniqueStrategies = our.strategies.filter(s => !their.strategies.includes(s));
    if (ourUniqueStrategies.length > 0) {
      recommendations.push({
        strategy: `Leverage strategy they don't anticipate: ${ourUniqueStrategies[0]}`,
        exploitsGap: true,
        riskLevel: 'low',
        expectedOutcome: 'Achieve outcomes they are not defending against',
        counterMoves: [
          'They may adapt strategy space',
          'May damage trust if discovered',
        ],
      });
    }
  }

  // Exploit Nash equilibrium mismatch
  if (gap.payoffMismatch) {
    recommendations.push({
      strategy: `Guide them toward our preferred equilibrium (${our.perceivedNashEquilibrium})`,
      exploitsGap: true,
      riskLevel: 'medium',
      expectedOutcome: 'Shift interaction toward more favorable stable state',
      counterMoves: [
        'They may resist equilibrium shift',
        'May require significant signaling investment',
      ],
    });
  }

  // MICE-based strategies
  if (miceData) {
    const dominantMice = getDominantMiceVector(miceData);
    recommendations.push({
      strategy: `Leverage ${dominantMice} vulnerability in strategic communications`,
      exploitsGap: false,
      riskLevel: dominantMice === 'coercion' ? 'high' : 'medium',
      expectedOutcome: `Increased influence through ${dominantMice} vector`,
      counterMoves: [
        'May create dependency',
        'Ethical considerations apply',
      ],
    });
  }

  // Default cooperative strategy
  recommendations.push({
    strategy: 'Maintain transparent cooperative approach',
    exploitsGap: false,
    riskLevel: 'low',
    expectedOutcome: 'Build long-term trust and sustainable relationship',
    counterMoves: [
      'Vulnerable to exploitation by adversarial actors',
      'May miss short-term opportunities',
    ],
  });

  return recommendations;
}

function identifyInformationAdvantages(
  miceData: MiceAssessmentData | undefined,
  psychProfile: PsychologicalProfileData | undefined,
  betrayalData: Record<string, unknown> | undefined,
  our: GamePerception,
  their: GamePerception
): string[] {
  const advantages: string[] = [];

  if (psychProfile) {
    advantages.push('Detailed psychological profile available');
    const biases = psychProfile.cognitive_biases;
    if (biases && biases.length > 0) {
      advantages.push(`Known cognitive biases: ${biases.slice(0, 3).join(', ')}`);
    }
  }

  if (miceData) {
    advantages.push('MICE vulnerability assessment complete');
  }

  if (betrayalData && 'defection_probability' in betrayalData) {
    const defectionProb = Number(betrayalData.defection_probability) || 0;
    advantages.push(`Defection probability known: ${Math.round(defectionProb * 100)}%`);
  }

  if (our.confidenceLevel > their.confidenceLevel) {
    advantages.push('Higher confidence in our game model vs their likely uncertainty');
  }

  if (advantages.length === 0) {
    advantages.push('Limited information advantages - recommend deeper intelligence gathering');
  }

  return advantages;
}

function identifyInformationVulnerabilities(
  communications: Record<string, unknown>[],
  our: GamePerception,
  their: GamePerception
): string[] {
  const vulnerabilities: string[] = [];

  // Check for information leakage in communications
  if (communications.length > 20) {
    vulnerabilities.push('High communication volume may reveal patterns');
  }

  // Our perception gaps
  if (our.confidenceLevel < 0.6) {
    vulnerabilities.push('Low confidence in our game model - may be misreading situation');
  }

  if (their.confidenceLevel > our.confidenceLevel) {
    vulnerabilities.push('They may have better understanding of the interaction dynamics');
  }

  vulnerabilities.push('Our strategies may be observable through behavior patterns');

  return vulnerabilities;
}

function generateDeceptionStrategies(
  gap: PerceptionGap,
  psychProfile: PsychologicalProfileData | undefined,
  miceData: MiceAssessmentData | undefined
): string[] {
  const strategies: string[] = [];

  if (gap.gameTypeMismatch) {
    strategies.push('Maintain their perception of game type while pursuing different objectives');
  }

  if (psychProfile?.cognitive_biases) {
    const biases = psychProfile.cognitive_biases;
    if (biases.includes('confirmation_bias')) {
      strategies.push('Feed information confirming their existing beliefs');
    }
    if (biases.includes('anchoring')) {
      strategies.push('Set favorable anchors early in negotiations');
    }
  }

  if (miceData) {
    const dominant = getDominantMiceVector(miceData);
    if (dominant === 'ego') {
      strategies.push('Inflate their sense of control while directing outcomes');
    }
  }

  strategies.push('Control information flow to shape their decision space');
  strategies.push('Use ambiguity to maintain strategic flexibility');

  return strategies;
}

function generateSignalingSuggestions(
  gap: PerceptionGap,
  our: GamePerception,
  their: GamePerception
): string[] {
  const suggestions: string[] = [];

  if (gap.exploitabilityScore > 0.5) {
    suggestions.push('Consider whether to exploit or correct perception gap');
  }

  if (our.gameType === 'cooperation' && their.gameType !== 'cooperation') {
    suggestions.push('Signal cooperative intent through consistent behavior');
    suggestions.push('Demonstrate commitment through costly signals');
  }

  if (their.gameType === 'zero_sum') {
    suggestions.push('Reframe to show positive-sum opportunities');
    suggestions.push('Demonstrate credible commitments');
  }

  suggestions.push('Manage expectations through calibrated information release');
  suggestions.push('Build reputation through consistent signaling');

  return suggestions;
}

function getDominantMiceVector(miceData: MiceAssessmentData): string {
  const vectors: Record<string, number> = {
    money: miceData.money_score || 0,
    ideology: miceData.ideology_score || 0,
    coercion: miceData.coercion_score || 0,
    ego: miceData.ego_score || 0,
  };

  let dominant = 'money';
  let maxScore = 0;
  
  Object.entries(vectors).forEach(([key, value]) => {
    if (value > maxScore) {
      maxScore = value;
      dominant = key;
    }
  });

  return dominant;
}

function calculateAnalysisConfidence(
  psychProfile: PsychologicalProfileData | undefined,
  miceData: MiceAssessmentData | undefined,
  communications: Record<string, unknown>[]
): number {
  let confidence = 0.5;

  if (psychProfile) confidence += 0.15;
  if (miceData) confidence += 0.15;
  if (communications.length >= 20) confidence += 0.1;
  if (communications.length >= 50) confidence += 0.1;

  return Math.min(0.95, confidence);
}
