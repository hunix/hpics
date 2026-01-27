import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Red Team Adversary Simulator v8.0
 * Digital Enemy Commander - Monte Carlo simulations for enemy response prediction
 * Source: Military Intelligence Professional Bulletin (Oct 2025)
 * 
 * Capabilities:
 * - Deploy "Digital Personas" trained on adversary doctrine
 * - Monte Carlo simulations for response prediction
 * - Bayesian Networks for course-of-action wargaming
 */

interface AdversaryPersona {
  id: string;
  name: string;
  doctrine: string;
  motivations: string[];
  capabilities: string[];
  constraints: string[];
  decisionStyle: 'aggressive' | 'cautious' | 'opportunistic' | 'methodical';
  riskTolerance: number;
}

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  yourAction: string;
  context: Record<string, unknown>;
}

interface SimulationResult {
  scenarioId: string;
  personaId: string;
  predictedResponse: string;
  probability: number;
  confidence: number;
  reasoning: string[];
  counterMeasures: string[];
  escalationRisk: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'red-team-adversary-simulator', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) throw new Error('userId required for service calls');
    } else {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) throw new Error('Unauthorized');
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;
    const simulationType = body.simulationType || 'full_simulation';
    const scenarios = body.scenarios || [];

    console.log(`[Red Team Simulator] Profile: ${profileId}, Type: ${simulationType}`);

    // Fetch profile data for persona modeling
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    // Fetch behavioral patterns
    const { data: behavioralDna } = await supabaseClient
      .from('ai_analyses')
      .select('*')
      .eq('profile_id', profileId)
      .eq('analysis_type', 'behavioral_dna')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch threat assessments
    const { data: threatData } = await supabaseClient
      .from('ai_analyses')
      .select('*')
      .eq('profile_id', profileId)
      .in('analysis_type', ['threat_assessment', 'adversary_mental_model', 'mice_assessment'])
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch communication patterns
    const { data: communications } = await supabaseClient
      .from('communications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Build adversary persona from data
    const adversaryPersonas: AdversaryPersona[] = buildAdversaryPersonas(
      profile,
      behavioralDna,
      threatData || [],
      communications || []
    );

    // Generate simulation scenarios if none provided
    const simulationScenarios: SimulationScenario[] = scenarios.length > 0 
      ? scenarios 
      : generateDefaultScenarios(profile, threatData || []);

    // Run Monte Carlo simulations
    const simulationResults: SimulationResult[] = [];
    
    for (const scenario of simulationScenarios) {
      for (const persona of adversaryPersonas) {
        const result = runMonteCarloSimulation(scenario, persona, 1000);
        simulationResults.push(result);
      }
    }

    // Generate Bayesian network analysis
    const bayesianAnalysis = buildBayesianNetwork(simulationResults, adversaryPersonas);

    // Calculate strategic recommendations
    const strategicRecommendations = generateStrategicRecommendations(
      simulationResults,
      bayesianAnalysis
    );

    // Generate wargaming scenarios
    const wargamingScenarios = generateWargamingScenarios(
      adversaryPersonas,
      simulationResults,
      bayesianAnalysis
    );

    const analysisResult = {
      profileId,
      analysisType: 'red_team_simulation',
      timestamp: new Date().toISOString(),
      
      adversaryPersonas: adversaryPersonas.map(p => ({
        id: p.id,
        name: p.name,
        doctrine: p.doctrine,
        decisionStyle: p.decisionStyle,
        riskTolerance: p.riskTolerance,
        motivationProfile: p.motivations,
        capabilityAssessment: p.capabilities,
      })),
      
      simulationResults: simulationResults.slice(0, 20).map(r => ({
        scenario: r.scenarioId,
        persona: r.personaId,
        predictedResponse: r.predictedResponse,
        probability: r.probability,
        confidence: r.confidence,
        escalationRisk: r.escalationRisk,
        counterMeasures: r.counterMeasures,
      })),
      
      bayesianNetwork: {
        nodes: bayesianAnalysis.nodes,
        edges: bayesianAnalysis.edges,
        posteriorProbabilities: bayesianAnalysis.posteriors,
        decisionPoints: bayesianAnalysis.decisionPoints,
      },
      
      strategicRecommendations,
      
      wargamingScenarios: wargamingScenarios.slice(0, 5),
      
      overallAssessment: {
        primaryThreatVector: identifyPrimaryThreat(simulationResults),
        mostLikelyResponse: getMostLikelyResponse(simulationResults),
        worstCaseScenario: getWorstCase(simulationResults),
        bestCaseScenario: getBestCase(simulationResults),
        recommendedPosture: getRecommendedPosture(bayesianAnalysis),
        confidenceLevel: calculateOverallConfidence(simulationResults),
      },
      
      metadata: {
        simulationsRun: simulationResults.length * 1000,
        personasModeled: adversaryPersonas.length,
        scenariosAnalyzed: simulationScenarios.length,
        processingTimeMs: Date.now(),
      },
    };

    // Persist to ai_analyses
    await supabaseClient
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'red_team_simulation',
        results: analysisResult as unknown as Record<string, unknown>,
        confidence_score: analysisResult.overallAssessment.confidenceLevel,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Red Team Simulator] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildAdversaryPersonas(
  profile: any,
  behavioralDna: any,
  threatData: any[],
  communications: any[]
): AdversaryPersona[] {
  const personas: AdversaryPersona[] = [];
  
  // Primary persona based on behavioral data
  const primaryPersona: AdversaryPersona = {
    id: 'primary',
    name: profile?.first_name ? `${profile.first_name} (Primary Model)` : 'Primary Adversary Model',
    doctrine: inferDoctrine(behavioralDna, threatData),
    motivations: extractMotivations(behavioralDna, threatData),
    capabilities: assessCapabilities(profile, communications),
    constraints: identifyConstraints(behavioralDna),
    decisionStyle: inferDecisionStyle(behavioralDna),
    riskTolerance: calculateRiskTolerance(behavioralDna, threatData),
  };
  personas.push(primaryPersona);
  
  // Alternative personas for scenario analysis
  const alternativeStyles: Array<'aggressive' | 'cautious' | 'opportunistic' | 'methodical'> = 
    ['aggressive', 'cautious', 'opportunistic', 'methodical'];
  
  for (const style of alternativeStyles) {
    if (style !== primaryPersona.decisionStyle) {
      personas.push({
        ...primaryPersona,
        id: `alt_${style}`,
        name: `Alternative Model (${style})`,
        decisionStyle: style,
        riskTolerance: style === 'aggressive' ? 0.8 : style === 'cautious' ? 0.2 : 0.5,
      });
    }
  }
  
  return personas;
}

function inferDoctrine(behavioralDna: any, threatData: any[]): string {
  const traits = behavioralDna?.results?.primaryTraits || [];
  
  if (traits.includes('competitive') || traits.includes('dominant')) {
    return 'Offensive Dominance';
  }
  if (traits.includes('analytical') || traits.includes('strategic')) {
    return 'Calculated Maneuvering';
  }
  if (traits.includes('adaptive') || traits.includes('opportunistic')) {
    return 'Opportunistic Exploitation';
  }
  return 'Balanced Engagement';
}

function extractMotivations(behavioralDna: any, threatData: any[]): string[] {
  const motivations: string[] = [];
  
  // From MICE analysis
  const miceData = threatData?.find(t => t.analysis_type === 'mice_assessment');
  if (miceData?.results) {
    const mice = miceData.results;
    if (mice.money?.score > 0.6) motivations.push('Financial gain');
    if (mice.ideology?.score > 0.6) motivations.push('Ideological commitment');
    if (mice.coercion?.score > 0.6) motivations.push('External pressure');
    if (mice.ego?.score > 0.6) motivations.push('Status/recognition');
  }
  
  // From behavioral DNA
  if (behavioralDna?.results?.motivationalDrivers) {
    motivations.push(...behavioralDna.results.motivationalDrivers.slice(0, 3));
  }
  
  return motivations.length > 0 ? motivations : ['Self-interest', 'Status preservation'];
}

function assessCapabilities(profile: any, communications: any[]): string[] {
  const capabilities: string[] = [];
  
  if (profile?.job_title) {
    capabilities.push(`Professional expertise: ${profile.job_title}`);
  }
  if (profile?.company) {
    capabilities.push(`Organizational resources: ${profile.company}`);
  }
  
  const communicationVolume = communications?.length || 0;
  if (communicationVolume > 50) {
    capabilities.push('Active communication network');
  }
  
  capabilities.push('Information gathering');
  capabilities.push('Relationship leverage');
  
  return capabilities;
}

function identifyConstraints(behavioralDna: any): string[] {
  const constraints: string[] = [];
  
  if (behavioralDna?.results?.vulnerabilities) {
    constraints.push(...behavioralDna.results.vulnerabilities.map((v: any) => 
      typeof v === 'string' ? v : v.name || 'Unknown constraint'
    ));
  }
  
  constraints.push('Resource limitations');
  constraints.push('Time constraints');
  constraints.push('Reputational concerns');
  
  return constraints;
}

function inferDecisionStyle(behavioralDna: any): 'aggressive' | 'cautious' | 'opportunistic' | 'methodical' {
  const traits = behavioralDna?.results?.primaryTraits || [];
  
  if (traits.includes('impulsive') || traits.includes('bold')) return 'aggressive';
  if (traits.includes('careful') || traits.includes('risk-averse')) return 'cautious';
  if (traits.includes('adaptive') || traits.includes('flexible')) return 'opportunistic';
  return 'methodical';
}

function calculateRiskTolerance(behavioralDna: any, threatData: any[]): number {
  let baseScore = 0.5;
  
  if (behavioralDna?.results?.riskProfile) {
    baseScore = behavioralDna.results.riskProfile;
  }
  
  const threatAssessment = threatData?.find(t => t.analysis_type === 'threat_assessment');
  if (threatAssessment?.results?.aggressiveness) {
    baseScore = (baseScore + threatAssessment.results.aggressiveness) / 2;
  }
  
  return Math.max(0.1, Math.min(0.9, baseScore));
}

function generateDefaultScenarios(profile: any, threatData: any[]): SimulationScenario[] {
  return [
    {
      id: 'confrontation',
      name: 'Direct Confrontation',
      description: 'Direct challenge to adversary position or claims',
      yourAction: 'Challenge their core position publicly',
      context: { setting: 'professional', stakes: 'high' },
    },
    {
      id: 'negotiation',
      name: 'Negotiation Pressure',
      description: 'Apply pressure during negotiation to gain concessions',
      yourAction: 'Present ultimatum with deadline',
      context: { setting: 'negotiation', stakes: 'medium' },
    },
    {
      id: 'alliance',
      name: 'Third-Party Alliance',
      description: 'Form alliance with adversary competitor or opponent',
      yourAction: 'Announce strategic partnership with their rival',
      context: { setting: 'competitive', stakes: 'high' },
    },
    {
      id: 'exposure',
      name: 'Information Exposure',
      description: 'Reveal damaging information about adversary',
      yourAction: 'Selectively leak compromising information',
      context: { setting: 'information_warfare', stakes: 'extreme' },
    },
    {
      id: 'withdrawal',
      name: 'Strategic Withdrawal',
      description: 'Appear to concede or withdraw from conflict',
      yourAction: 'Signal willingness to compromise significantly',
      context: { setting: 'diplomatic', stakes: 'medium' },
    },
  ];
}

function runMonteCarloSimulation(
  scenario: SimulationScenario,
  persona: AdversaryPersona,
  iterations: number
): SimulationResult {
  const responses: Record<string, number> = {};
  let totalEscalation = 0;
  
  for (let i = 0; i < iterations; i++) {
    const response = simulateResponse(scenario, persona);
    responses[response.type] = (responses[response.type] || 0) + 1;
    totalEscalation += response.escalation;
  }
  
  // Find most likely response
  const sortedResponses = Object.entries(responses).sort((a, b) => b[1] - a[1]);
  const mostLikely = sortedResponses[0];
  
  return {
    scenarioId: scenario.id,
    personaId: persona.id,
    predictedResponse: mostLikely[0],
    probability: mostLikely[1] / iterations,
    confidence: calculateConfidence(sortedResponses, iterations),
    reasoning: generateReasoning(scenario, persona, mostLikely[0]),
    counterMeasures: generateCounterMeasures(mostLikely[0], persona),
    escalationRisk: totalEscalation / iterations,
  };
}

function simulateResponse(
  scenario: SimulationScenario,
  persona: AdversaryPersona
): { type: string; escalation: number } {
  const random = Math.random();
  
  // Decision matrix based on persona and scenario
  const responseMatrix = {
    aggressive: {
      confrontation: { retaliate: 0.6, escalate: 0.25, negotiate: 0.1, withdraw: 0.05 },
      negotiation: { hardball: 0.5, escalate: 0.2, compromise: 0.2, stall: 0.1 },
      alliance: { counter_alliance: 0.4, preemptive: 0.3, accept: 0.2, ignore: 0.1 },
      exposure: { retaliate: 0.5, counter_expose: 0.3, legal: 0.15, accept: 0.05 },
      withdrawal: { exploit: 0.5, cautious: 0.3, accept: 0.15, ignore: 0.05 },
    },
    cautious: {
      confrontation: { negotiate: 0.4, withdraw: 0.3, delay: 0.2, retaliate: 0.1 },
      negotiation: { compromise: 0.5, stall: 0.3, withdraw: 0.15, hardball: 0.05 },
      alliance: { assess: 0.4, counter_alliance: 0.3, accept: 0.2, ignore: 0.1 },
      exposure: { legal: 0.4, damage_control: 0.35, negotiate: 0.2, accept: 0.05 },
      withdrawal: { cautious: 0.5, accept: 0.3, assess: 0.15, ignore: 0.05 },
    },
    opportunistic: {
      confrontation: { assess: 0.3, exploit: 0.3, negotiate: 0.25, retaliate: 0.15 },
      negotiation: { exploit: 0.4, compromise: 0.3, hardball: 0.2, stall: 0.1 },
      alliance: { exploit: 0.35, counter_alliance: 0.3, assess: 0.25, accept: 0.1 },
      exposure: { counter_expose: 0.35, damage_control: 0.3, exploit: 0.25, accept: 0.1 },
      withdrawal: { exploit: 0.6, cautious: 0.25, accept: 0.1, ignore: 0.05 },
    },
    methodical: {
      confrontation: { assess: 0.35, negotiate: 0.3, delay: 0.25, retaliate: 0.1 },
      negotiation: { assess: 0.35, compromise: 0.3, stall: 0.25, hardball: 0.1 },
      alliance: { assess: 0.4, counter_alliance: 0.3, accept: 0.2, ignore: 0.1 },
      exposure: { assess: 0.35, legal: 0.3, damage_control: 0.25, accept: 0.1 },
      withdrawal: { assess: 0.4, cautious: 0.35, accept: 0.2, ignore: 0.05 },
    },
  };

  const style = persona.decisionStyle;
  const scenarioType = scenario.id as keyof typeof responseMatrix.aggressive;
  const matrix = responseMatrix[style][scenarioType] || responseMatrix[style].confrontation;
  
  // Apply risk tolerance modifier
  let cumulative = 0;
  const modifiedRandom = random * (1 + (persona.riskTolerance - 0.5) * 0.3);
  
  for (const [response, prob] of Object.entries(matrix)) {
    cumulative += prob;
    if (modifiedRandom <= cumulative) {
      const escalation = getEscalationLevel(response);
      return { type: response, escalation };
    }
  }
  
  return { type: 'assess', escalation: 0.3 };
}

function getEscalationLevel(response: string): number {
  const escalationMap: Record<string, number> = {
    retaliate: 0.9,
    escalate: 0.95,
    preemptive: 0.85,
    counter_expose: 0.75,
    hardball: 0.7,
    counter_alliance: 0.65,
    exploit: 0.6,
    legal: 0.5,
    damage_control: 0.4,
    assess: 0.3,
    negotiate: 0.25,
    stall: 0.3,
    delay: 0.2,
    cautious: 0.2,
    compromise: 0.15,
    accept: 0.1,
    withdraw: 0.05,
    ignore: 0.1,
  };
  return escalationMap[response] || 0.5;
}

function calculateConfidence(sortedResponses: [string, number][], total: number): number {
  if (sortedResponses.length === 0) return 0;
  
  const topProb = sortedResponses[0][1] / total;
  const secondProb = sortedResponses.length > 1 ? sortedResponses[1][1] / total : 0;
  
  // Higher confidence when top response is clearly dominant
  const dominance = topProb - secondProb;
  return Math.min(0.95, topProb * 0.6 + dominance * 0.4);
}

function generateReasoning(
  scenario: SimulationScenario,
  persona: AdversaryPersona,
  response: string
): string[] {
  const reasoning: string[] = [];
  
  reasoning.push(`${persona.decisionStyle} decision style predisposes toward ${response} responses`);
  reasoning.push(`Risk tolerance (${(persona.riskTolerance * 100).toFixed(0)}%) influences response selection`);
  reasoning.push(`Scenario stakes (${scenario.context.stakes}) factor into decision calculus`);
  
  if (persona.motivations.length > 0) {
    reasoning.push(`Primary motivation (${persona.motivations[0]}) drives response priority`);
  }
  
  return reasoning;
}

function generateCounterMeasures(response: string, persona: AdversaryPersona): string[] {
  const counterMeasures: Record<string, string[]> = {
    retaliate: ['Prepare defensive positions', 'Document for escalation', 'Identify de-escalation paths'],
    escalate: ['Prepare for increased intensity', 'Activate support networks', 'Consider strategic withdrawal'],
    negotiate: ['Prepare negotiation strategy', 'Identify win-win scenarios', 'Document agreements'],
    withdraw: ['Secure gains', 'Prevent re-engagement', 'Monitor for repositioning'],
    exploit: ['Protect vulnerabilities', 'Create honeypots', 'Monitor for exploitation attempts'],
    assess: ['Maintain information security', 'Prepare multiple responses', 'Gather intelligence'],
    compromise: ['Document terms clearly', 'Prepare implementation plan', 'Identify enforcement mechanisms'],
    counter_alliance: ['Strengthen existing alliances', 'Identify neutral parties', 'Prepare counter-offers'],
  };
  
  return counterMeasures[response] || ['Monitor situation', 'Maintain readiness', 'Gather intelligence'];
}

function buildBayesianNetwork(results: SimulationResult[], personas: AdversaryPersona[]): any {
  const nodes = [
    { id: 'scenario', label: 'Scenario Type', type: 'input' },
    { id: 'persona', label: 'Adversary Persona', type: 'input' },
    { id: 'risk', label: 'Risk Tolerance', type: 'intermediate' },
    { id: 'motivation', label: 'Primary Motivation', type: 'intermediate' },
    { id: 'response', label: 'Predicted Response', type: 'output' },
    { id: 'escalation', label: 'Escalation Level', type: 'output' },
  ];
  
  const edges = [
    { from: 'scenario', to: 'response' },
    { from: 'persona', to: 'risk' },
    { from: 'persona', to: 'motivation' },
    { from: 'risk', to: 'response' },
    { from: 'motivation', to: 'response' },
    { from: 'response', to: 'escalation' },
  ];
  
  // Calculate posterior probabilities
  const posteriors: Record<string, number> = {};
  for (const result of results) {
    const key = `${result.scenarioId}_${result.predictedResponse}`;
    posteriors[key] = (posteriors[key] || 0) + result.probability;
  }
  
  const decisionPoints = results
    .filter(r => r.probability > 0.3)
    .map(r => ({
      scenario: r.scenarioId,
      response: r.predictedResponse,
      probability: r.probability,
      escalation: r.escalationRisk,
    }));
  
  return { nodes, edges, posteriors, decisionPoints };
}

function generateStrategicRecommendations(
  results: SimulationResult[],
  bayesian: any
): string[] {
  const recommendations: string[] = [];
  
  // Find high-escalation scenarios
  const highEscalation = results.filter(r => r.escalationRisk > 0.7);
  if (highEscalation.length > 0) {
    recommendations.push(`Avoid ${highEscalation[0].scenarioId} scenarios - high escalation risk`);
  }
  
  // Find low-risk opportunities
  const lowRisk = results.filter(r => r.escalationRisk < 0.3 && r.probability > 0.4);
  if (lowRisk.length > 0) {
    recommendations.push(`Consider ${lowRisk[0].scenarioId} approach - favorable response predicted`);
  }
  
  // Add general recommendations
  recommendations.push('Maintain flexibility in response options');
  recommendations.push('Build coalition support before major actions');
  recommendations.push('Document all interactions for future leverage');
  
  return recommendations;
}

function generateWargamingScenarios(
  personas: AdversaryPersona[],
  results: SimulationResult[],
  bayesian: any
): any[] {
  const scenarios = [];
  
  for (const persona of personas.slice(0, 3)) {
    const personaResults = results.filter(r => r.personaId === persona.id);
    const mostLikelyResponse = personaResults.sort((a, b) => b.probability - a.probability)[0];
    
    scenarios.push({
      personaName: persona.name,
      mostLikelyAction: mostLikelyResponse?.predictedResponse || 'unknown',
      probability: mostLikelyResponse?.probability || 0,
      recommendedCounterplay: mostLikelyResponse?.counterMeasures || [],
      alternativeOutcomes: personaResults.slice(1, 4).map(r => ({
        action: r.predictedResponse,
        probability: r.probability,
      })),
    });
  }
  
  return scenarios;
}

function identifyPrimaryThreat(results: SimulationResult[]): string {
  const highEscalation = results.filter(r => r.escalationRisk > 0.7);
  if (highEscalation.length > 0) {
    return `${highEscalation[0].predictedResponse} response to ${highEscalation[0].scenarioId}`;
  }
  return 'No critical threats identified';
}

function getMostLikelyResponse(results: SimulationResult[]): string {
  const sorted = [...results].sort((a, b) => b.probability - a.probability);
  return sorted[0]?.predictedResponse || 'Insufficient data';
}

function getWorstCase(results: SimulationResult[]): string {
  const highest = [...results].sort((a, b) => b.escalationRisk - a.escalationRisk)[0];
  return highest 
    ? `${highest.predictedResponse} (${(highest.escalationRisk * 100).toFixed(0)}% escalation)`
    : 'No extreme scenarios identified';
}

function getBestCase(results: SimulationResult[]): string {
  const lowest = [...results].sort((a, b) => a.escalationRisk - b.escalationRisk)[0];
  return lowest 
    ? `${lowest.predictedResponse} (${(lowest.escalationRisk * 100).toFixed(0)}% escalation)`
    : 'No favorable scenarios identified';
}

function getRecommendedPosture(bayesian: any): string {
  const avgEscalation = bayesian.decisionPoints.reduce(
    (sum: number, dp: any) => sum + dp.escalation, 0
  ) / (bayesian.decisionPoints.length || 1);
  
  if (avgEscalation > 0.6) return 'Defensive - prepare for escalation';
  if (avgEscalation > 0.4) return 'Balanced - maintain options';
  return 'Opportunistic - consider proactive moves';
}

function calculateOverallConfidence(results: SimulationResult[]): number {
  if (results.length === 0) return 0;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  return Math.round(avgConfidence * 100) / 100;
}
