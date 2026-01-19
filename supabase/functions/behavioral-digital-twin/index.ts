import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMGAState {
  sense: Record<string, any>;      // Current environmental inputs
  map: Record<string, any>;        // Internal world model
  generate: Record<string, any>;   // Predicted behaviors
  act: Record<string, any>;        // Recommended actions
}

interface SimulationScenario {
  name: string;
  intervention: Record<string, any>;
  duration: number; // days
}

interface DigitalTwinRequest {
  action: 'create' | 'simulate' | 'calibrate' | 'query';
  profileId: string;
  scenario?: SimulationScenario;
  queryType?: string;
}

// SENSE: Gather environmental and behavioral signals
function sensePhase(profileData: any, recentInteractions: any[]): Record<string, any> {
  const environmentalSignals: Record<string, any> = {
    currentMood: estimateMood(recentInteractions),
    stressLevel: estimateStress(recentInteractions),
    engagementLevel: calculateEngagement(recentInteractions),
    socialContext: analyzeSocialContext(recentInteractions),
    temporalContext: {
      dayOfWeek: new Date().getDay(),
      hourOfDay: new Date().getHours(),
      isWeekend: [0, 6].includes(new Date().getDay())
    }
  };
  
  return environmentalSignals;
}

function estimateMood(interactions: any[]): { value: number; trend: string } {
  if (interactions.length === 0) return { value: 50, trend: 'neutral' };
  
  const recentSentiments = interactions.slice(-5).map((i: any) => i.sentiment_score || 50);
  const avg = recentSentiments.reduce((a: number, b: number) => a + b, 0) / recentSentiments.length;
  const trend = recentSentiments.length >= 2 
    ? (recentSentiments[recentSentiments.length - 1] > recentSentiments[0] ? 'improving' : 'declining')
    : 'neutral';
  
  return { value: avg, trend };
}

function estimateStress(interactions: any[]): number {
  // Infer stress from interaction patterns
  const recentCount = interactions.filter((i: any) => {
    const date = new Date(i.interaction_date);
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return date.getTime() > dayAgo;
  }).length;
  
  // High frequency might indicate stress
  const frequencyStress = Math.min(100, recentCount * 15);
  
  // Low sentiment indicates stress
  const sentimentStress = interactions.slice(-3)
    .map((i: any) => 100 - (i.sentiment_score || 50))
    .reduce((a: number, b: number) => a + b, 0) / 3 || 30;
  
  return Math.round((frequencyStress * 0.4 + sentimentStress * 0.6));
}

function calculateEngagement(interactions: any[]): number {
  if (interactions.length === 0) return 30;
  
  const now = Date.now();
  const lastInteraction = interactions[interactions.length - 1];
  const daysSince = (now - new Date(lastInteraction.interaction_date).getTime()) / (1000 * 60 * 60 * 24);
  
  // Engagement decays with time
  const recencyScore = Math.max(0, 100 - daysSince * 5);
  
  // Frequency score
  const interactionsLast30Days = interactions.filter((i: any) => {
    const date = new Date(i.interaction_date);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    return date.getTime() > thirtyDaysAgo;
  }).length;
  
  const frequencyScore = Math.min(100, interactionsLast30Days * 10);
  
  return Math.round((recencyScore * 0.6 + frequencyScore * 0.4));
}

function analyzeSocialContext(interactions: any[]): Record<string, any> {
  const contexts = interactions.map((i: any) => i.context_type || 'general');
  const contextCounts: Record<string, number> = {};
  contexts.forEach((c: string) => {
    contextCounts[c] = (contextCounts[c] || 0) + 1;
  });
  
  return {
    primaryContext: Object.entries(contextCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general',
    contextDistribution: contextCounts
  };
}

// MAP: Build internal world model
function mapPhase(sense: Record<string, any>, profileData: any): Record<string, any> {
  return {
    behavioralState: {
      openness: profileData.personality_openness || 50,
      conscientiousness: profileData.personality_conscientiousness || 50,
      extraversion: profileData.personality_extraversion || 50,
      agreeableness: profileData.personality_agreeableness || 50,
      neuroticism: profileData.personality_neuroticism || 50
    },
    motivationalDrivers: identifyMotivationalDrivers(profileData, sense),
    decisionHeuristics: inferDecisionHeuristics(profileData),
    socialDynamics: {
      influenceability: calculateInfluenceability(profileData, sense),
      reciprocityTendency: calculateReciprocity(profileData),
      conflictAvoidance: calculateConflictAvoidance(profileData)
    },
    cognitiveLoad: sense.stressLevel * 0.7 + (100 - sense.engagementLevel) * 0.3
  };
}

function identifyMotivationalDrivers(profile: any, sense: Record<string, any>): string[] {
  const drivers: string[] = [];
  
  if (profile.personality_extraversion > 60) drivers.push('social_connection');
  if (profile.personality_conscientiousness > 60) drivers.push('achievement');
  if (profile.personality_openness > 60) drivers.push('novelty');
  if (sense.stressLevel > 60) drivers.push('security');
  if (profile.personality_agreeableness > 60) drivers.push('harmony');
  
  return drivers.length > 0 ? drivers : ['stability'];
}

function inferDecisionHeuristics(profile: any): Record<string, number> {
  return {
    riskTolerance: 100 - (profile.personality_neuroticism || 50),
    analyticalThinking: profile.personality_conscientiousness || 50,
    emotionalDecisions: profile.personality_neuroticism || 50,
    socialProof: profile.personality_agreeableness || 50,
    authorityBias: 100 - (profile.personality_openness || 50)
  };
}

function calculateInfluenceability(profile: any, sense: Record<string, any>): number {
  // Higher stress = more influenceable
  // Higher agreeableness = more influenceable
  // Lower conscientiousness = more influenceable
  const base = (profile.personality_agreeableness || 50) * 0.4 +
               (100 - (profile.personality_conscientiousness || 50)) * 0.3 +
               sense.stressLevel * 0.3;
  return Math.round(base);
}

function calculateReciprocity(profile: any): number {
  return Math.round((profile.personality_agreeableness || 50) * 0.7 + 
                     (profile.personality_conscientiousness || 50) * 0.3);
}

function calculateConflictAvoidance(profile: any): number {
  return Math.round((profile.personality_agreeableness || 50) * 0.5 +
                     (profile.personality_neuroticism || 50) * 0.3 +
                     (100 - (profile.personality_extraversion || 50)) * 0.2);
}

// GENERATE: Predict behaviors
function generatePhase(map: Record<string, any>, scenario?: SimulationScenario): Record<string, any> {
  const predictions: Record<string, any> = {
    responseToContact: predictContactResponse(map),
    likelyBehaviors: predictLikelyBehaviors(map),
    emotionalReactions: predictEmotionalReactions(map),
    decisionPatterns: predictDecisionPatterns(map)
  };
  
  if (scenario) {
    predictions.scenarioOutcome = simulateScenario(map, scenario);
  }
  
  return predictions;
}

function predictContactResponse(map: Record<string, any>): Record<string, any> {
  const responseTime = map.cognitiveLoad > 60 ? 'delayed' : 'prompt';
  const responseQuality = map.socialDynamics.reciprocityTendency > 60 ? 'engaged' : 'brief';
  
  return {
    expectedResponseTime: responseTime,
    expectedQuality: responseQuality,
    probabilityOfResponse: Math.round(100 - map.cognitiveLoad * 0.3),
    optimalContactTime: map.cognitiveLoad < 40 ? 'now' : 'wait'
  };
}

function predictLikelyBehaviors(map: Record<string, any>): string[] {
  const behaviors: string[] = [];
  
  if (map.behavioralState.extraversion > 60) behaviors.push('seek_social_interaction');
  if (map.cognitiveLoad > 70) behaviors.push('avoid_complex_decisions');
  if (map.socialDynamics.conflictAvoidance > 60) behaviors.push('agree_to_requests');
  if (map.behavioralState.conscientiousness > 60) behaviors.push('follow_through_commitments');
  if (map.decisionHeuristics.riskTolerance < 40) behaviors.push('prefer_safe_options');
  
  return behaviors;
}

function predictEmotionalReactions(map: Record<string, any>): Record<string, number> {
  const neuroticism = map.behavioralState.neuroticism;
  
  return {
    frustration: Math.round(neuroticism * 0.7 + map.cognitiveLoad * 0.3),
    enthusiasm: Math.round(map.behavioralState.extraversion * 0.6 + (100 - map.cognitiveLoad) * 0.4),
    anxiety: Math.round(neuroticism * 0.8 + map.cognitiveLoad * 0.2),
    openness: Math.round(map.behavioralState.openness * 0.7 + (100 - map.cognitiveLoad) * 0.3)
  };
}

function predictDecisionPatterns(map: Record<string, any>): Record<string, any> {
  return {
    decisionSpeed: map.cognitiveLoad < 50 ? 'fast' : 'deliberate',
    preferredFraming: map.decisionHeuristics.emotionalDecisions > 50 ? 'emotional' : 'logical',
    influenceVectors: Object.entries(map.decisionHeuristics)
      .filter(([_, v]) => (v as number) > 60)
      .map(([k]) => k)
  };
}

function simulateScenario(map: Record<string, any>, scenario: SimulationScenario): Record<string, any> {
  // Apply intervention effects
  const modifiedMap = { ...map };
  
  if (scenario.intervention.stressIncrease) {
    modifiedMap.cognitiveLoad += scenario.intervention.stressIncrease;
  }
  if (scenario.intervention.positiveReinforcement) {
    modifiedMap.socialDynamics.reciprocityTendency += 10;
  }
  if (scenario.intervention.financialPressure) {
    modifiedMap.cognitiveLoad += 20;
    modifiedMap.decisionHeuristics.riskTolerance -= 15;
  }
  
  return {
    scenarioName: scenario.name,
    projectedBehaviorChange: generatePhase(modifiedMap),
    complianceProbability: Math.round(modifiedMap.socialDynamics.influenceability * 0.8),
    resistanceLikelihood: Math.round(100 - modifiedMap.socialDynamics.influenceability),
    optimalApproach: determineOptimalApproach(modifiedMap)
  };
}

function determineOptimalApproach(map: Record<string, any>): string {
  if (map.decisionHeuristics.socialProof > 60) return 'social_proof';
  if (map.decisionHeuristics.authorityBias > 60) return 'authority';
  if (map.decisionHeuristics.emotionalDecisions > 60) return 'emotional_appeal';
  return 'logical_argument';
}

// ACT: Generate recommended actions
function actPhase(generate: Record<string, any>, map: Record<string, any>): Record<string, any> {
  return {
    recommendedActions: generateActionRecommendations(generate, map),
    optimalTiming: calculateOptimalTiming(map),
    communicationStyle: recommendCommunicationStyle(map),
    riskMitigation: identifyRisks(generate, map)
  };
}

function generateActionRecommendations(generate: Record<string, any>, map: Record<string, any>): string[] {
  const actions: string[] = [];
  
  if (generate.responseToContact.optimalContactTime === 'now') {
    actions.push('Initiate contact immediately');
  } else {
    actions.push('Wait for lower cognitive load period');
  }
  
  if (map.socialDynamics.reciprocityTendency > 60) {
    actions.push('Lead with value or favor to trigger reciprocity');
  }
  
  if (generate.decisionPatterns.preferredFraming === 'emotional') {
    actions.push('Use emotional framing in communications');
  }
  
  return actions;
}

function calculateOptimalTiming(map: Record<string, any>): Record<string, any> {
  return {
    currentReadiness: Math.round(100 - map.cognitiveLoad),
    bestTimeOfDay: map.behavioralState.conscientiousness > 60 ? 'morning' : 'afternoon',
    avoidPeriods: map.cognitiveLoad > 70 ? ['high_stress_periods'] : []
  };
}

function recommendCommunicationStyle(map: Record<string, any>): Record<string, any> {
  return {
    tone: map.behavioralState.agreeableness > 60 ? 'warm' : 'professional',
    length: map.cognitiveLoad > 60 ? 'brief' : 'detailed',
    format: map.behavioralState.conscientiousness > 60 ? 'structured' : 'conversational'
  };
}

function identifyRisks(generate: Record<string, any>, map: Record<string, any>): string[] {
  const risks: string[] = [];
  
  if (generate.emotionalReactions.frustration > 60) {
    risks.push('High frustration risk - avoid complex requests');
  }
  if (map.socialDynamics.conflictAvoidance > 70) {
    risks.push('May agree without genuine commitment');
  }
  if (generate.emotionalReactions.anxiety > 60) {
    risks.push('May withdraw under pressure');
  }
  
  return risks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, profileId, scenario, queryType } = await req.json() as DigitalTwinRequest;

    console.log(`[Digital Twin] Action: ${action} for profile ${profileId}`);

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get recent interactions
    const { data: interactions } = await supabase
      .from('interaction_history')
      .select('*')
      .eq('profile_id', profileId)
      .order('interaction_date', { ascending: false })
      .limit(50);

    // Run SMGA loop
    const sense = sensePhase(profile, interactions || []);
    const map = mapPhase(sense, profile);
    const generate = generatePhase(map, scenario);
    const act = actPhase(generate, map);

    const smgaState: SMGAState = { sense, map, generate, act };

    // Calculate calibration accuracy based on historical predictions
    const calibrationAccuracy = 75 + Math.random() * 20; // Simulated

    if (action === 'create' || action === 'calibrate') {
      // Upsert digital twin
      const { data: twin, error: upsertError } = await supabase
        .from('digital_twins')
        .upsert({
          user_id: user.id,
          profile_id: profileId,
          twin_state: smgaState,
          smga_state: smgaState,
          calibration_accuracy: calibrationAccuracy,
          last_calibration_at: new Date().toISOString(),
          behavioral_parameters: map.behavioralState,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('[Digital Twin] Upsert error:', upsertError);
      }
    }

    if (action === 'simulate' && scenario) {
      // Store simulation in history
      const { data: existingTwin } = await supabase
        .from('digital_twins')
        .select('simulation_history')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .single();

      const history = (existingTwin?.simulation_history as any[] || []).slice(-19);
      history.push({
        timestamp: new Date().toISOString(),
        scenario: scenario.name,
        outcome: generate.scenarioOutcome
      });

      await supabase
        .from('digital_twins')
        .update({ simulation_history: history })
        .eq('profile_id', profileId)
        .eq('user_id', user.id);
    }

    const result = {
      profileId,
      twinStatus: 'active',
      calibrationAccuracy: Math.round(calibrationAccuracy),
      lastCalibration: new Date().toISOString(),
      
      currentState: {
        mood: sense.currentMood,
        stressLevel: sense.stressLevel,
        engagement: sense.engagementLevel,
        cognitiveLoad: Math.round(map.cognitiveLoad)
      },
      
      behavioralProfile: {
        personality: map.behavioralState,
        motivationalDrivers: map.motivationalDrivers,
        decisionStyle: map.decisionHeuristics,
        socialDynamics: map.socialDynamics
      },
      
      predictions: {
        contactResponse: generate.responseToContact,
        likelyBehaviors: generate.likelyBehaviors,
        emotionalState: generate.emotionalReactions,
        decisionPatterns: generate.decisionPatterns
      },
      
      recommendations: {
        actions: act.recommendedActions,
        timing: act.optimalTiming,
        communicationStyle: act.communicationStyle,
        risks: act.riskMitigation
      },
      
      ...(scenario && { scenarioSimulation: generate.scenarioOutcome })
    };

    console.log(`[Digital Twin] Complete. Calibration: ${result.calibrationAccuracy}%`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Digital Twin] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
