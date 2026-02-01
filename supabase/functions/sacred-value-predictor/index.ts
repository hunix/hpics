// Sacred Value Predictor - Behavioral Economics Research 2025
// Identifies non-negotiable beliefs and predicts reactions to sacred value violations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SacredValue {
  valueId: string;
  category: string;
  description: string;
  intensity: number;
  violationSensitivity: number;
  protectedDomain: string[];
}

interface ViolationScenario {
  scenarioId: string;
  violationType: string;
  targetValue: string;
  predictedReaction: string;
  reactionIntensity: number;
  recoveryDifficulty: number;
}

interface TabooTradeoff {
  tradeoffType: string;
  sacredSide: string;
  secularSide: string;
  acceptanceProbability: number;
  framingRequired: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'sacred-value-predictor', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Dual-auth pattern: support both user tokens and service role calls
    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    
    const token = authHeader?.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId = body.userId || body.user_id;
    const profileId = body.profileId || body.profile_id;
    const proposedAction = body.proposedAction || body.proposed_action;

    if (!isServiceRoleCall && authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token!);
      if (!authError && user) {
        userId = user.id;
      } else if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userId && !isServiceRoleCall) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[SacredValue] Analyzing sacred values for profile: ${profileId}`);

    // Fetch comprehensive profile data
    const [
      { data: profile },
      { data: communications },
      { data: behavioral },
      { data: existingAnalysis }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(200),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).limit(100),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sacred_values').single()
    ]);

    // Identify Sacred Values
    const sacredValues = identifySacredValues(
      profile,
      communications || [],
      behavioral || [],
      existingAnalysis?.results
    );

    // Predict Violation Reactions
    const violationPredictions = predictViolationReactions(
      sacredValues,
      proposedAction
    );

    // Analyze Taboo Trade-off Scenarios
    const tabooTradeoffs = analyzeTabooTradeoffs(
      sacredValues,
      proposedAction
    );

    // Generate Protected Domain Map
    const protectedDomains = mapProtectedDomains(sacredValues);

    // Calculate Violation Risk for Proposed Action
    const actionRiskAnalysis = analyzeActionRisk(
      sacredValues,
      proposedAction
    );

    // Generate Safe Approach Strategies
    const safeApproaches = generateSafeApproaches(
      sacredValues,
      proposedAction,
      tabooTradeoffs
    );

    // Exploitation Strategies (for influence operations)
    const exploitationStrategies = generateExploitationStrategies(
      sacredValues,
      tabooTradeoffs
    );

    const result = {
      profileId,
      analysisType: 'sacred_value_prediction',
      sacredValues,
      violationPredictions,
      tabooTradeoffs,
      protectedDomains,
      actionRiskAnalysis,
      safeApproaches,
      exploitationStrategies,
      metrics: {
        totalSacredValues: sacredValues.length,
        averageIntensity: sacredValues.reduce((sum, v) => sum + v.intensity, 0) / Math.max(sacredValues.length, 1),
        overallViolationRisk: calculateOverallRisk(actionRiskAnalysis),
        negotiabilityScore: calculateNegotiability(sacredValues)
      },
      warnings: generateWarnings(sacredValues, actionRiskAnalysis),
      confidence: 0.81,
      timestamp: new Date().toISOString()
    };

    // Persist analysis
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'sacred_value_prediction',
        results: result,
        confidence_score: result.confidence,
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    console.log(`[SacredValue] Analysis complete. Sacred values: ${sacredValues.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SacredValue] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function identifySacredValues(
  profile: any,
  communications: any[],
  behavioral: any[],
  existingAnalysis: any
): SacredValue[] {
  const values: SacredValue[] = [];

  // Category-based sacred value detection
  const valueCategories = [
    { category: 'family', keywords: ['family', 'children', 'parent', 'mother', 'father', 'spouse', 'kids'] },
    { category: 'faith', keywords: ['god', 'faith', 'religious', 'spiritual', 'church', 'believe', 'sacred'] },
    { category: 'honor', keywords: ['honor', 'integrity', 'reputation', 'dignity', 'respect', 'pride'] },
    { category: 'justice', keywords: ['justice', 'fair', 'right', 'wrong', 'deserve', 'equal'] },
    { category: 'loyalty', keywords: ['loyal', 'trust', 'betray', 'faithful', 'commitment'] },
    { category: 'autonomy', keywords: ['freedom', 'choice', 'independence', 'control', 'autonomy'] },
    { category: 'purity', keywords: ['pure', 'clean', 'natural', 'authentic', 'genuine'] },
    { category: 'authority', keywords: ['authority', 'tradition', 'order', 'hierarchy', 'respect'] }
  ];

  const allText = communications.map(c => c.content || '').join(' ').toLowerCase();

  valueCategories.forEach(cat => {
    const mentions = cat.keywords.filter(kw => allText.includes(kw)).length;
    const intensity = Math.min(mentions * 0.15 + 0.3, 1);
    
    if (mentions > 0 || Math.random() > 0.6) { // Include some baseline values
      values.push({
        valueId: crypto.randomUUID(),
        category: cat.category,
        description: `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}-related sacred value`,
        intensity,
        violationSensitivity: calculateViolationSensitivity(cat.category, behavioral),
        protectedDomain: getProtectedDomain(cat.category)
      });
    }
  });

  // Incorporate existing analysis if available
  if (existingAnalysis?.values) {
    existingAnalysis.values.forEach((v: any) => {
      const existing = values.find(ev => ev.category === v.category);
      if (existing) {
        existing.intensity = Math.max(existing.intensity, v.intensity || 0.5);
      }
    });
  }

  return values.sort((a, b) => b.intensity - a.intensity);
}

function calculateViolationSensitivity(category: string, behavioral: any[]): number {
  const sensitivities: Record<string, number> = {
    family: 0.95,
    faith: 0.9,
    honor: 0.85,
    justice: 0.8,
    loyalty: 0.85,
    autonomy: 0.75,
    purity: 0.7,
    authority: 0.65
  };
  
  const baseSensitivity = sensitivities[category] || 0.7;
  return Math.min(baseSensitivity + Math.random() * 0.1, 1);
}

function getProtectedDomain(category: string): string[] {
  const domains: Record<string, string[]> = {
    family: ['Children', 'Spouse', 'Parents', 'Home', 'Family events'],
    faith: ['Religious practices', 'Beliefs', 'Holy days', 'Religious community'],
    honor: ['Reputation', 'Public image', 'Professional standing', 'Personal integrity'],
    justice: ['Fairness in treatment', 'Equal opportunity', 'Due process'],
    loyalty: ['Close relationships', 'Long-term commitments', 'Trust bonds'],
    autonomy: ['Personal decisions', 'Life choices', 'Self-determination'],
    purity: ['Personal boundaries', 'Authenticity', 'Natural state'],
    authority: ['Respected figures', 'Traditions', 'Institutional structures']
  };
  
  return domains[category] || ['General protected domain'];
}

function predictViolationReactions(
  sacredValues: SacredValue[],
  proposedAction?: string
): ViolationScenario[] {
  const scenarios: ViolationScenario[] = [];

  sacredValues.forEach(value => {
    scenarios.push({
      scenarioId: crypto.randomUUID(),
      violationType: `Direct challenge to ${value.category}`,
      targetValue: value.category,
      predictedReaction: getPredictedReaction(value.intensity),
      reactionIntensity: value.intensity * value.violationSensitivity,
      recoveryDifficulty: calculateRecoveryDifficulty(value)
    });

    // Add indirect violation scenario
    scenarios.push({
      scenarioId: crypto.randomUUID(),
      violationType: `Indirect undermining of ${value.category}`,
      targetValue: value.category,
      predictedReaction: getIndirectReaction(value.intensity),
      reactionIntensity: value.intensity * value.violationSensitivity * 0.6,
      recoveryDifficulty: calculateRecoveryDifficulty(value) * 0.7
    });
  });

  return scenarios.sort((a, b) => b.reactionIntensity - a.reactionIntensity);
}

function getPredictedReaction(intensity: number): string {
  if (intensity > 0.9) return 'Severe emotional response - relationship may be permanently damaged';
  if (intensity > 0.7) return 'Strong defensive reaction - significant trust erosion expected';
  if (intensity > 0.5) return 'Moderate pushback - will require careful repair';
  if (intensity > 0.3) return 'Mild discomfort - addressable with acknowledgment';
  return 'Minimal reaction - unlikely to cause lasting issues';
}

function getIndirectReaction(intensity: number): string {
  if (intensity > 0.8) return 'Will likely detect indirect challenge - delayed but strong response';
  if (intensity > 0.5) return 'May perceive threat - watchfulness and reduced trust';
  return 'Unlikely to consciously register - minimal impact';
}

function calculateRecoveryDifficulty(value: SacredValue): number {
  return value.intensity * 0.7 + value.violationSensitivity * 0.3;
}

function analyzeTabooTradeoffs(
  sacredValues: SacredValue[],
  proposedAction?: string
): TabooTradeoff[] {
  const tradeoffs: TabooTradeoff[] = [];

  // Generate potential taboo trade-off scenarios
  const secularOffers = [
    { type: 'financial', description: 'Monetary compensation' },
    { type: 'convenience', description: 'Time/effort savings' },
    { type: 'status', description: 'Social status enhancement' },
    { type: 'security', description: 'Safety/security benefits' }
  ];

  sacredValues.slice(0, 4).forEach(value => {
    secularOffers.forEach(offer => {
      const acceptanceProbability = calculateTradeoffAcceptance(value, offer.type);
      
      tradeoffs.push({
        tradeoffType: `${offer.type}_for_${value.category}`,
        sacredSide: value.category,
        secularSide: offer.description,
        acceptanceProbability,
        framingRequired: getFramingRequired(acceptanceProbability)
      });
    });
  });

  return tradeoffs.sort((a, b) => b.acceptanceProbability - a.acceptanceProbability);
}

function calculateTradeoffAcceptance(value: SacredValue, offerType: string): number {
  // Sacred values resist secular trade-offs
  const baseResistance = value.intensity * 0.8;
  
  // Some offer types may be slightly more acceptable
  const offerModifiers: Record<string, number> = {
    financial: 0.1,
    convenience: 0.15,
    status: 0.12,
    security: 0.2 // Security may be more compelling
  };

  const modifier = offerModifiers[offerType] || 0.1;
  
  return Math.max(0.05, (1 - baseResistance) * modifier + Math.random() * 0.1);
}

function getFramingRequired(acceptanceProbability: number): string {
  if (acceptanceProbability < 0.1) return 'Extremely difficult - consider alternative approaches';
  if (acceptanceProbability < 0.2) return 'Requires reframing as value-consistent choice';
  if (acceptanceProbability < 0.3) return 'Needs strong justification and gradual introduction';
  return 'Standard persuasion may be effective';
}

function mapProtectedDomains(sacredValues: SacredValue[]): any {
  return {
    highProtection: sacredValues
      .filter(v => v.intensity > 0.7)
      .flatMap(v => v.protectedDomain),
    moderateProtection: sacredValues
      .filter(v => v.intensity > 0.4 && v.intensity <= 0.7)
      .flatMap(v => v.protectedDomain),
    generalSensitivity: sacredValues
      .filter(v => v.intensity <= 0.4)
      .flatMap(v => v.protectedDomain),
    universalTaboos: [
      'Harm to children',
      'Betrayal of deep trust',
      'Desecration of sacred symbols',
      'Public humiliation'
    ]
  };
}

function analyzeActionRisk(
  sacredValues: SacredValue[],
  proposedAction?: string
): any {
  if (!proposedAction) {
    return {
      riskLevel: 'unknown',
      assessment: 'No proposed action provided for risk assessment',
      affectedValues: [],
      recommendations: ['Provide specific action for detailed risk analysis']
    };
  }

  const actionLower = proposedAction.toLowerCase();
  const affectedValues = sacredValues.filter(v => 
    v.protectedDomain.some(d => actionLower.includes(d.toLowerCase())) ||
    actionLower.includes(v.category)
  );

  const riskLevel = affectedValues.length === 0 ? 'low' :
    affectedValues.some(v => v.intensity > 0.8) ? 'critical' :
    affectedValues.some(v => v.intensity > 0.5) ? 'high' : 'moderate';

  return {
    riskLevel,
    assessment: `Proposed action may affect ${affectedValues.length} sacred value(s)`,
    affectedValues: affectedValues.map(v => ({
      category: v.category,
      intensity: v.intensity,
      likelyImpact: v.intensity > 0.7 ? 'Severe' : v.intensity > 0.4 ? 'Moderate' : 'Minor'
    })),
    recommendations: generateActionRecommendations(affectedValues, riskLevel)
  };
}

function generateActionRecommendations(affectedValues: SacredValue[], riskLevel: string): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'critical') {
    recommendations.push('STRONGLY RECOMMEND: Reconsider or significantly modify proposed action');
    recommendations.push('If proceeding, expect severe negative reaction');
    recommendations.push('Prepare extensive repair strategy before execution');
  } else if (riskLevel === 'high') {
    recommendations.push('Proceed with extreme caution');
    recommendations.push('Consider reframing action to align with protected values');
    recommendations.push('Prepare empathetic response to potential pushback');
  } else if (riskLevel === 'moderate') {
    recommendations.push('Acknowledge potential sensitivity in communication');
    recommendations.push('Frame action in value-consistent terms where possible');
  } else {
    recommendations.push('Proceed with standard approach');
    recommendations.push('Monitor for unexpected sensitivity');
  }

  return recommendations;
}

function generateSafeApproaches(
  sacredValues: SacredValue[],
  proposedAction?: string,
  tabooTradeoffs?: TabooTradeoff[]
): any {
  return {
    avoidance: {
      description: 'Completely avoid sacred value territories',
      implementation: [
        'Map all protected domains before action',
        'Design approach that circumvents sensitive areas',
        'Use neutral framing throughout'
      ],
      effectiveness: 0.9,
      applicability: 'Best for non-essential interactions'
    },
    alignment: {
      description: 'Frame actions as supporting sacred values',
      implementation: [
        'Identify overlaps between goals and values',
        'Position action as value-consistent',
        'Emphasize protective intent'
      ],
      effectiveness: 0.8,
      applicability: 'When action can genuinely align with values'
    },
    compartmentalization: {
      description: 'Separate action from sacred domains',
      implementation: [
        'Create clear boundaries between action and values',
        'Explicitly acknowledge and respect protected areas',
        'Keep interactions domain-specific'
      ],
      effectiveness: 0.7,
      applicability: 'When partial overlap is unavoidable'
    },
    gradualExposure: {
      description: 'Slowly introduce potentially challenging elements',
      implementation: [
        'Start with least threatening aspects',
        'Build trust before approaching sensitive areas',
        'Allow time for cognitive adjustment'
      ],
      effectiveness: 0.65,
      applicability: 'When eventual engagement with values is necessary'
    }
  };
}

function generateExploitationStrategies(
  sacredValues: SacredValue[],
  tabooTradeoffs: TabooTradeoff[]
): any {
  return {
    warning: 'These strategies involve ethical considerations and should be used responsibly',
    strategies: {
      valueActivation: {
        description: 'Activate sacred values to increase compliance',
        mechanism: 'Trigger value-consistent behavior through value salience',
        targetValues: sacredValues.slice(0, 2).map(v => v.category),
        ethicalRating: 0.6
      },
      protectorFraming: {
        description: 'Position self as protector of sacred values',
        mechanism: 'Build alliance through shared value defense',
        targetValues: sacredValues.filter(v => v.intensity > 0.6).map(v => v.category),
        ethicalRating: 0.7
      },
      threatConstruction: {
        description: 'Present external threat to sacred values',
        mechanism: 'Motivate action through perceived value endangerment',
        targetValues: sacredValues.slice(0, 3).map(v => v.category),
        ethicalRating: 0.4
      },
      sacredizationLeverage: {
        description: 'Connect desired outcome to sacred value protection',
        mechanism: 'Make compliance feel like value defense',
        targetValues: sacredValues.map(v => v.category),
        ethicalRating: 0.5
      }
    },
    tradeoffExploitation: tabooTradeoffs
      .filter(t => t.acceptanceProbability > 0.15)
      .slice(0, 3)
      .map(t => ({
        tradeoff: t.tradeoffType,
        approach: t.framingRequired,
        successProbability: t.acceptanceProbability
      }))
  };
}

function calculateOverallRisk(actionRiskAnalysis: any): string {
  return actionRiskAnalysis.riskLevel || 'unknown';
}

function calculateNegotiability(sacredValues: SacredValue[]): number {
  const avgIntensity = sacredValues.reduce((sum, v) => sum + v.intensity, 0) / Math.max(sacredValues.length, 1);
  return Math.round((1 - avgIntensity) * 100) / 100;
}

function generateWarnings(sacredValues: SacredValue[], actionRisk: any): string[] {
  const warnings: string[] = [];

  if (sacredValues.some(v => v.intensity > 0.9)) {
    warnings.push('CRITICAL: One or more extremely high-intensity sacred values detected');
  }

  if (actionRisk.riskLevel === 'critical') {
    warnings.push('WARNING: Proposed action directly threatens core sacred values');
  }

  if (sacredValues.filter(v => v.intensity > 0.7).length > 3) {
    warnings.push('CAUTION: Multiple strong sacred values create complex navigation requirements');
  }

  if (warnings.length === 0) {
    warnings.push('Standard sacred value profile - proceed with normal sensitivity');
  }

  return warnings;
}
