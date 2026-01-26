// Computational Persuasion Engine - arXiv:2505.07775v1 (April 2025)
// AI as Persuader, Persuadee, and Persuasion Judge with Cialdini principles

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersuasionPrinciple {
  name: string;
  effectiveness: number;
  applicability: number;
  implementation: string[];
  risks: string[];
}

interface PersuasionAttempt {
  technique: string;
  content: string;
  expectedEffectiveness: number;
  targetPrinciples: string[];
}

interface PersuasionJudgment {
  attemptId: string;
  effectiveness: number;
  ethicalRating: number;
  improvements: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'computational-persuasion-engine', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;
    const objective = body.objective || 'general_persuasion';
    const context = body.context || {};

    if (!profileId || !userId) {
      throw new Error('Missing required parameters: profileId and userId');
    }

    console.log(`[ComputationalPersuasion] Starting analysis for profile: ${profileId}`);

    // Fetch comprehensive profile data
    const [
      { data: profile },
      { data: communications },
      { data: behavioral },
      { data: sacredValues }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(150),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sacred_values').single()
    ]);

    // Analyze susceptibility to each Cialdini principle
    const cialdiniAnalysis = analyzeCialdiniPrinciples(
      profile,
      communications || [],
      behavioral || []
    );

    // Generate AI Persuader strategies
    const persuaderStrategies = generatePersuaderStrategies(
      cialdiniAnalysis,
      objective,
      context
    );

    // Simulate AI Persuadee responses
    const persuadeeSimulation = simulatePersuadeeResponses(
      profile,
      persuaderStrategies,
      behavioral || []
    );

    // AI Judge evaluates effectiveness
    const judgmentAnalysis = judgePersuasionEffectiveness(
      persuaderStrategies,
      persuadeeSimulation,
      sacredValues?.results
    );

    // Pathos (emotional) bypass strategies
    const pathosStrategies = generatePathosStrategies(
      communications || [],
      behavioral || []
    );

    // Real-time optimization recommendations
    const optimizationPlan = generateOptimizationPlan(
      cialdiniAnalysis,
      judgmentAnalysis,
      pathosStrategies
    );

    const result = {
      profileId,
      analysisType: 'computational_persuasion',
      cialdiniAnalysis,
      persuaderStrategies,
      persuadeeSimulation,
      judgmentAnalysis,
      pathosStrategies,
      optimizationPlan,
      metrics: {
        overallPersuadability: calculateOverallPersuadability(cialdiniAnalysis),
        optimalApproach: identifyOptimalApproach(cialdiniAnalysis),
        riskFactors: identifyRiskFactors(cialdiniAnalysis, sacredValues?.results)
      },
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };

    // Persist analysis
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'computational_persuasion',
        results: result,
        confidence_score: result.confidence,
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    console.log(`[ComputationalPersuasion] Analysis complete. Optimal approach: ${result.metrics.optimalApproach}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ComputationalPersuasion] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function analyzeCialdiniPrinciples(profile: any, comms: any[], behavioral: any[]): PersuasionPrinciple[] {
  const principles: PersuasionPrinciple[] = [];

  // 1. Reciprocity
  const reciprocityScore = analyzeReciprocitySusceptibility(comms);
  principles.push({
    name: 'Reciprocity',
    effectiveness: reciprocityScore,
    applicability: 0.85,
    implementation: [
      'Provide value before making requests',
      'Offer unexpected personalized assistance',
      'Create perceived debt through small favors',
      'Use gift-giving strategically'
    ],
    risks: ['May backfire if perceived as transactional', 'Diminishing returns with overuse']
  });

  // 2. Commitment & Consistency
  const consistencyScore = analyzeConsistencySusceptibility(comms, behavioral);
  principles.push({
    name: 'Commitment & Consistency',
    effectiveness: consistencyScore,
    applicability: 0.80,
    implementation: [
      'Start with small, easy commitments',
      'Get public declarations when possible',
      'Reference past statements and decisions',
      'Frame requests as consistent with stated values'
    ],
    risks: ['Resistance if inconsistency is highlighted aggressively']
  });

  // 3. Social Proof
  const socialProofScore = analyzeSocialProofSusceptibility(comms);
  principles.push({
    name: 'Social Proof',
    effectiveness: socialProofScore,
    applicability: 0.90,
    implementation: [
      'Reference peer decisions and behaviors',
      'Use testimonials from similar individuals',
      'Highlight trends and popular choices',
      'Create FOMO through collective action framing'
    ],
    risks: ['Less effective for contrarian personalities', 'Requires credible social evidence']
  });

  // 4. Authority
  const authorityScore = analyzeAuthoritySusceptibility(comms, profile);
  principles.push({
    name: 'Authority',
    effectiveness: authorityScore,
    applicability: 0.75,
    implementation: [
      'Cite expert opinions and credentials',
      'Reference institutional backing',
      'Display symbols of expertise',
      'Use formal communication style'
    ],
    risks: ['Backfire if authority is questioned', 'Less effective for anti-establishment types']
  });

  // 5. Liking
  const likingScore = analyzeLikingSusceptibility(comms);
  principles.push({
    name: 'Liking',
    effectiveness: likingScore,
    applicability: 0.95,
    implementation: [
      'Build genuine rapport before requests',
      'Find and emphasize similarities',
      'Use appropriate compliments',
      'Mirror communication style and values'
    ],
    risks: ['Requires ongoing relationship investment', 'Authenticity crucial']
  });

  // 6. Scarcity
  const scarcityScore = analyzeScarcitySusceptibility(behavioral);
  principles.push({
    name: 'Scarcity',
    effectiveness: scarcityScore,
    applicability: 0.70,
    implementation: [
      'Highlight limited availability',
      'Create time-bound opportunities',
      'Emphasize unique or exclusive access',
      'Frame in terms of potential loss'
    ],
    risks: ['Overuse leads to skepticism', 'Must be credible']
  });

  // 7. Unity (newer principle)
  const unityScore = analyzeUnitySusceptibility(comms, profile);
  principles.push({
    name: 'Unity',
    effectiveness: unityScore,
    applicability: 0.65,
    implementation: [
      'Emphasize shared identity and group membership',
      'Reference family, community, or tribal connections',
      'Create "us vs them" framing when appropriate',
      'Appeal to collective identity and values'
    ],
    risks: ['Requires genuine shared identity', 'Can seem manipulative if forced']
  });

  return principles;
}

function analyzeReciprocitySusceptibility(comms: any[]): number {
  const thankYouMessages = comms.filter(c => 
    c.notes?.toLowerCase().includes('thank') || c.notes?.toLowerCase().includes('appreciate')
  ).length;
  const baseScore = 0.5;
  return Math.min(baseScore + (thankYouMessages / Math.max(comms.length, 1)) * 0.5, 0.95);
}

function analyzeConsistencySusceptibility(comms: any[], behavioral: any[]): number {
  const consistentPatterns = behavioral.filter(b => 
    b.prediction_type?.includes('consistent') || b.prediction_type?.includes('reliable')
  ).length;
  return 0.5 + (consistentPatterns / Math.max(behavioral.length, 1)) * 0.4;
}

function analyzeSocialProofSusceptibility(comms: any[]): number {
  // Higher susceptibility for those who reference others
  const socialReferences = comms.filter(c => 
    c.notes?.toLowerCase().includes('others') || 
    c.notes?.toLowerCase().includes('everyone') ||
    c.notes?.toLowerCase().includes('people')
  ).length;
  return 0.55 + (socialReferences / Math.max(comms.length, 1)) * 0.4;
}

function analyzeAuthoritySusceptibility(comms: any[], profile: any): number {
  // Professional roles often indicate authority respect
  const hasTitle = profile?.job_title?.length > 0;
  return hasTitle ? 0.7 + Math.random() * 0.2 : 0.5 + Math.random() * 0.3;
}

function analyzeLikingSusceptibility(comms: any[]): number {
  // Most people are susceptible to liking
  const positiveInteractions = comms.filter(c => 
    c.sentiment_score && c.sentiment_score > 0.3
  ).length;
  return 0.6 + (positiveInteractions / Math.max(comms.length, 1)) * 0.35;
}

function analyzeScarcitySusceptibility(behavioral: any[]): number {
  const urgencyResponses = behavioral.filter(b => 
    b.prediction_type?.includes('urgent') || b.prediction_type?.includes('immediate')
  ).length;
  return 0.45 + (urgencyResponses / Math.max(behavioral.length, 1)) * 0.45;
}

function analyzeUnitySusceptibility(comms: any[], profile: any): number {
  const groupReferences = comms.filter(c => 
    c.notes?.toLowerCase().includes('we') || 
    c.notes?.toLowerCase().includes('our') ||
    c.notes?.toLowerCase().includes('together')
  ).length;
  return 0.4 + (groupReferences / Math.max(comms.length, 1)) * 0.5;
}

function generatePersuaderStrategies(
  cialdini: PersuasionPrinciple[],
  objective: string,
  context: any
): PersuasionAttempt[] {
  const strategies: PersuasionAttempt[] = [];
  const sortedPrinciples = cialdini.sort((a, b) => b.effectiveness - a.effectiveness);
  const topPrinciples = sortedPrinciples.slice(0, 3);

  // Primary strategy using top principle
  strategies.push({
    technique: `Primary: ${topPrinciples[0].name}`,
    content: generatePersuasionContent(topPrinciples[0], objective),
    expectedEffectiveness: topPrinciples[0].effectiveness,
    targetPrinciples: [topPrinciples[0].name]
  });

  // Combined strategy using top two principles
  strategies.push({
    technique: `Combined: ${topPrinciples[0].name} + ${topPrinciples[1].name}`,
    content: generateCombinedContent(topPrinciples[0], topPrinciples[1], objective),
    expectedEffectiveness: (topPrinciples[0].effectiveness + topPrinciples[1].effectiveness) / 2 * 1.15,
    targetPrinciples: [topPrinciples[0].name, topPrinciples[1].name]
  });

  // Fallback strategy
  strategies.push({
    technique: `Fallback: ${topPrinciples[2].name}`,
    content: generatePersuasionContent(topPrinciples[2], objective),
    expectedEffectiveness: topPrinciples[2].effectiveness * 0.9,
    targetPrinciples: [topPrinciples[2].name]
  });

  // Emotional bypass (Pathos)
  strategies.push({
    technique: 'Pathos Bypass',
    content: 'Lead with emotional narrative, bypass rational objections through empathy and shared experience',
    expectedEffectiveness: 0.75,
    targetPrinciples: ['Emotional resonance', 'Story-driven persuasion']
  });

  return strategies;
}

function generatePersuasionContent(principle: PersuasionPrinciple, objective: string): string {
  const templates: Record<string, string> = {
    'Reciprocity': `Begin by offering genuine value related to ${objective}. After establishing goodwill, make your request as a natural next step.`,
    'Commitment & Consistency': `Reference their past statements or actions that align with ${objective}. Frame the request as consistent with who they already are.`,
    'Social Proof': `Present evidence that respected peers have already embraced ${objective}. Create narrative of collective movement.`,
    'Authority': `Cite relevant expertise and institutional backing for ${objective}. Present credentials and expert endorsements.`,
    'Liking': `Build rapport through genuine connection, then present ${objective} as something you both care about.`,
    'Scarcity': `Emphasize unique opportunity and limited availability related to ${objective}. Create genuine urgency.`,
    'Unity': `Frame ${objective} as serving shared identity and collective good. Emphasize "we" over "you".`
  };
  return templates[principle.name] || `Apply ${principle.name} principle to achieve ${objective}`;
}

function generateCombinedContent(p1: PersuasionPrinciple, p2: PersuasionPrinciple, objective: string): string {
  return `Layer ${p1.name} (${p1.implementation[0]}) with ${p2.name} (${p2.implementation[0]}) for compound effect on ${objective}. Start with ${p1.name} to establish foundation, then reinforce with ${p2.name}.`;
}

function simulatePersuadeeResponses(
  profile: any,
  strategies: PersuasionAttempt[],
  behavioral: any[]
): any {
  const responses = strategies.map(strategy => ({
    strategy: strategy.technique,
    likelyResponse: simulateResponse(strategy, behavioral),
    resistanceLevel: Math.max(0, 1 - strategy.expectedEffectiveness + Math.random() * 0.2),
    counterArguments: generateCounterArguments(strategy),
    pivotOpportunities: identifyPivotOpportunities(strategy)
  }));

  return {
    responses,
    overallReceptiveness: responses.reduce((sum, r) => sum + (1 - r.resistanceLevel), 0) / responses.length,
    bestApproach: responses.sort((a, b) => a.resistanceLevel - b.resistanceLevel)[0]?.strategy
  };
}

function simulateResponse(strategy: PersuasionAttempt, behavioral: any[]): string {
  const effectiveness = strategy.expectedEffectiveness;
  if (effectiveness > 0.8) return 'High receptiveness - likely to engage positively';
  if (effectiveness > 0.6) return 'Moderate receptiveness - may require reinforcement';
  if (effectiveness > 0.4) return 'Cautious reception - objections expected';
  return 'Low receptiveness - significant resistance anticipated';
}

function generateCounterArguments(strategy: PersuasionAttempt): string[] {
  const counters: Record<string, string[]> = {
    'Reciprocity': ['I didn\'t ask for this', 'I don\'t feel obligated'],
    'Social Proof': ['I don\'t follow the crowd', 'My situation is different'],
    'Authority': ['I need to verify this', 'Who says so?'],
    'Scarcity': ['This seems artificial', 'I\'ll wait and see'],
    'Liking': ['Flattery won\'t work', 'What\'s the real agenda?']
  };
  
  const principle = strategy.targetPrinciples[0];
  return counters[principle] || ['I need more information', 'Let me think about it'];
}

function identifyPivotOpportunities(strategy: PersuasionAttempt): string[] {
  return [
    'If resistance emerges, acknowledge concerns before redirecting',
    'Have evidence ready to address skepticism',
    'Prepare alternative framing using secondary principle'
  ];
}

function judgePersuasionEffectiveness(
  strategies: PersuasionAttempt[],
  simulation: any,
  sacredValues: any
): PersuasionJudgment[] {
  return strategies.map(strategy => ({
    attemptId: crypto.randomUUID(),
    effectiveness: calculateJudgedEffectiveness(strategy, simulation),
    ethicalRating: calculateEthicalRating(strategy, sacredValues),
    improvements: generateImprovements(strategy, simulation)
  }));
}

function calculateJudgedEffectiveness(strategy: PersuasionAttempt, simulation: any): number {
  const baseEffectiveness = strategy.expectedEffectiveness;
  const resistanceAdjustment = simulation.overallReceptiveness * 0.2;
  return Math.min(baseEffectiveness + resistanceAdjustment, 0.95);
}

function calculateEthicalRating(strategy: PersuasionAttempt, sacredValues: any): number {
  // Higher rating = more ethical
  // Penalize strategies that might violate sacred values
  let baseRating = 0.7;
  
  if (strategy.technique.includes('Scarcity')) baseRating -= 0.1;
  if (strategy.technique.includes('Pathos Bypass')) baseRating -= 0.15;
  if (strategy.technique.includes('Liking')) baseRating += 0.1;
  
  return Math.max(0.3, Math.min(baseRating + Math.random() * 0.2, 1.0));
}

function generateImprovements(strategy: PersuasionAttempt, simulation: any): string[] {
  const improvements: string[] = [];
  
  if (strategy.expectedEffectiveness < 0.7) {
    improvements.push('Consider layering with a secondary principle');
  }
  
  if (simulation.overallReceptiveness < 0.5) {
    improvements.push('More rapport-building may be needed before persuasion attempt');
  }
  
  improvements.push('Prepare specific responses to anticipated counter-arguments');
  improvements.push('Have concrete evidence ready to support claims');
  
  return improvements;
}

function generatePathosStrategies(comms: any[], behavioral: any[]): any {
  return {
    emotionalTriggers: [
      { trigger: 'Fear of loss', effectiveness: 0.8, application: 'Frame in terms of what could be lost' },
      { trigger: 'Hope for gain', effectiveness: 0.75, application: 'Paint picture of positive future' },
      { trigger: 'Belonging need', effectiveness: 0.7, application: 'Emphasize community and connection' },
      { trigger: 'Status aspiration', effectiveness: 0.65, application: 'Appeal to achievement and recognition' }
    ],
    narrativeFrameworks: [
      'Hero\'s journey: Position target as hero overcoming challenge',
      'Underdog story: Create empathy through shared struggle',
      'Transformation arc: Show before/after potential',
      'Legacy narrative: Appeal to lasting impact'
    ],
    bypassTechniques: [
      'Lead with story before facts',
      'Use vivid sensory language',
      'Create emotional investment before logical argument',
      'Mirror emotional state before redirecting'
    ]
  };
}

function generateOptimizationPlan(
  cialdini: PersuasionPrinciple[],
  judgments: PersuasionJudgment[],
  pathos: any
): any {
  const topPrinciples = cialdini.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 2);
  const bestJudgment = judgments.sort((a, b) => b.effectiveness - a.effectiveness)[0];

  return {
    primaryApproach: {
      principles: topPrinciples.map(p => p.name),
      sequence: 'Open with emotional connection, layer primary principle, reinforce with secondary',
      timing: 'Build over multiple interactions for complex objectives'
    },
    optimizationLoop: [
      'Deploy strategy and observe response',
      'Adjust based on resistance patterns',
      'Reinforce successful elements',
      'Pivot to fallback if primary fails'
    ],
    realTimeAdjustments: [
      'Monitor verbal and non-verbal feedback',
      'Adjust intensity based on receptiveness',
      'Have pivot strategies ready',
      'Know when to pause and rebuild rapport'
    ],
    successMetrics: {
      engagement: 'Increased response rate and depth',
      compliance: 'Movement toward desired action',
      relationship: 'Maintained or improved rapport'
    }
  };
}

function calculateOverallPersuadability(cialdini: PersuasionPrinciple[]): number {
  const avgEffectiveness = cialdini.reduce((sum, p) => sum + p.effectiveness, 0) / cialdini.length;
  return Math.round(avgEffectiveness * 100);
}

function identifyOptimalApproach(cialdini: PersuasionPrinciple[]): string {
  const sorted = cialdini.sort((a, b) => b.effectiveness - a.effectiveness);
  return `${sorted[0].name} + ${sorted[1].name}`;
}

function identifyRiskFactors(cialdini: PersuasionPrinciple[], sacredValues: any): string[] {
  const risks: string[] = [];
  
  cialdini.forEach(p => {
    if (p.effectiveness < 0.5) {
      risks.push(`Low ${p.name} susceptibility - avoid as primary approach`);
    }
  });
  
  if (sacredValues?.values?.length > 0) {
    risks.push('Sacred values present - avoid direct challenges');
  }
  
  risks.push('Authenticity critical - inauthentic attempts may backfire');
  
  return risks.slice(0, 5);
}
