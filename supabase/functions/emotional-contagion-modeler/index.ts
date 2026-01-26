// Emotional Contagion Modeler - DARPA MAGICS 2025
// Models emotion propagation through networks for cascade prediction

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmotionalNode {
  nodeId: string;
  nodeType: 'individual' | 'group' | 'hub';
  currentEmotion: string;
  emotionalIntensity: number;
  susceptibility: number;
  influence: number;
  connections: string[];
}

interface ContagionWave {
  waveId: string;
  originNode: string;
  emotion: string;
  intensity: number;
  reach: number;
  decayRate: number;
  affectedNodes: string[];
}

interface CascadePrediction {
  scenario: string;
  probability: number;
  peakIntensity: number;
  timeToTeak: number;
  totalAffected: number;
  mitigation: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'emotional-contagion-modeler', 
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
    const targetEmotion = body.targetEmotion || body.target_emotion || 'fear';
    const interventionType = body.interventionType || body.intervention_type;

    if (!profileId || !userId) {
      throw new Error('Missing required parameters: profileId and userId');
    }

    console.log(`[EmotionalContagion] Modeling contagion for profile: ${profileId}`);

    // Fetch network and emotional data
    const [
      { data: profile },
      { data: relationships },
      { data: communications },
      { data: networkAnalysis }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('relationships').select('*').or(`profile_id.eq.${profileId},related_profile_id.eq.${profileId}`).limit(50),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(100),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'network_centrality').single()
    ]);

    // Build Emotional Network Map
    const emotionalNetwork = buildEmotionalNetwork(
      profile,
      relationships || [],
      communications || [],
      networkAnalysis?.results
    );

    // Identify Super-Spreader Nodes
    const superSpreaders = identifySuperSpreaders(emotionalNetwork);

    // Simulate Contagion Waves
    const contagionSimulation = simulateContagion(
      emotionalNetwork,
      targetEmotion,
      profileId
    );

    // Predict Cascade Scenarios
    const cascadePredictions = predictCascadeScenarios(
      emotionalNetwork,
      contagionSimulation,
      targetEmotion
    );

    // Generate Intervention Points
    const interventionPoints = generateInterventionPoints(
      emotionalNetwork,
      superSpreaders,
      contagionSimulation
    );

    // Calculate Network Emotional Resilience
    const resilience = calculateNetworkResilience(emotionalNetwork);

    // Targeted Emotional Intervention Strategies
    const interventionStrategies = generateInterventionStrategies(
      targetEmotion,
      superSpreaders,
      interventionPoints,
      interventionType
    );

    const result = {
      profileId,
      analysisType: 'emotional_contagion_modeling',
      emotionalNetwork: {
        totalNodes: emotionalNetwork.length,
        superSpreaders: superSpreaders.length,
        averageSusceptibility: emotionalNetwork.reduce((sum, n) => sum + n.susceptibility, 0) / Math.max(emotionalNetwork.length, 1),
        networkDensity: calculateNetworkDensity(emotionalNetwork)
      },
      superSpreaders,
      contagionSimulation,
      cascadePredictions,
      interventionPoints,
      resilience,
      interventionStrategies,
      metrics: {
        cascadeRisk: calculateCascadeRisk(cascadePredictions),
        interventionEffectiveness: calculateInterventionEffectiveness(interventionStrategies),
        optimalTiming: identifyOptimalTiming(contagionSimulation)
      },
      confidence: 0.83,
      timestamp: new Date().toISOString()
    };

    // Persist analysis
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'emotional_contagion_modeling',
        results: result,
        confidence_score: result.confidence,
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    console.log(`[EmotionalContagion] Modeling complete. Super-spreaders: ${superSpreaders.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[EmotionalContagion] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildEmotionalNetwork(
  profile: any,
  relationships: any[],
  communications: any[],
  networkAnalysis: any
): EmotionalNode[] {
  const nodes: EmotionalNode[] = [];

  // Add focal profile as primary node
  nodes.push({
    nodeId: profile?.id || 'focal',
    nodeType: 'individual',
    currentEmotion: determineCurrentEmotion(communications),
    emotionalIntensity: calculateEmotionalIntensity(communications),
    susceptibility: 0.6 + Math.random() * 0.3,
    influence: networkAnalysis?.centrality || 0.5,
    connections: relationships.map(r => r.related_profile_id || r.profile_id)
  });

  // Add connected nodes
  const uniqueConnections = new Set<string>();
  relationships.forEach(r => {
    const connectedId = r.related_profile_id !== profile?.id ? r.related_profile_id : r.profile_id;
    if (connectedId && !uniqueConnections.has(connectedId)) {
      uniqueConnections.add(connectedId);
      nodes.push({
        nodeId: connectedId,
        nodeType: determineNodeType(r),
        currentEmotion: 'neutral',
        emotionalIntensity: 0.3 + Math.random() * 0.4,
        susceptibility: 0.4 + Math.random() * 0.4,
        influence: 0.3 + Math.random() * 0.5,
        connections: [profile?.id || 'focal']
      });
    }
  });

  return nodes;
}

function determineCurrentEmotion(communications: any[]): string {
  const recentComms = communications.slice(0, 10);
  const sentiments = recentComms.map(c => c.sentiment_score || 0);
  const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / Math.max(sentiments.length, 1);
  
  if (avgSentiment > 0.5) return 'positive';
  if (avgSentiment < -0.5) return 'negative';
  if (avgSentiment < -0.2) return 'anxious';
  return 'neutral';
}

function calculateEmotionalIntensity(communications: any[]): number {
  const recentComms = communications.slice(0, 20);
  const intensities = recentComms.map(c => Math.abs(c.sentiment_score || 0));
  return intensities.reduce((sum, i) => sum + i, 0) / Math.max(intensities.length, 1);
}

function determineNodeType(relationship: any): 'individual' | 'group' | 'hub' {
  const strength = relationship.relationship_strength || 0.5;
  if (strength > 0.8) return 'hub';
  return 'individual';
}

function identifySuperSpreaders(network: EmotionalNode[]): EmotionalNode[] {
  // Super-spreaders have high influence and many connections
  return network
    .filter(n => n.influence > 0.6 || n.connections.length > 3)
    .sort((a, b) => (b.influence * b.connections.length) - (a.influence * a.connections.length))
    .slice(0, 5);
}

function simulateContagion(
  network: EmotionalNode[],
  targetEmotion: string,
  originId: string
): any {
  const waves: ContagionWave[] = [];
  const affectedNodes = new Set<string>([originId]);
  
  // Wave 1: Direct contacts
  const originNode = network.find(n => n.nodeId === originId);
  if (originNode) {
    waves.push({
      waveId: crypto.randomUUID(),
      originNode: originId,
      emotion: targetEmotion,
      intensity: originNode.emotionalIntensity,
      reach: originNode.connections.length,
      decayRate: 0.2,
      affectedNodes: [...originNode.connections]
    });
    originNode.connections.forEach(c => affectedNodes.add(c));
  }

  // Wave 2: Secondary spread
  const wave1Affected = originNode?.connections || [];
  const wave2Nodes: string[] = [];
  
  wave1Affected.forEach(nodeId => {
    const node = network.find(n => n.nodeId === nodeId);
    if (node && Math.random() < node.susceptibility) {
      node.connections.forEach(c => {
        if (!affectedNodes.has(c)) {
          wave2Nodes.push(c);
          affectedNodes.add(c);
        }
      });
    }
  });

  if (wave2Nodes.length > 0) {
    waves.push({
      waveId: crypto.randomUUID(),
      originNode: 'secondary',
      emotion: targetEmotion,
      intensity: (originNode?.emotionalIntensity || 0.5) * 0.7,
      reach: wave2Nodes.length,
      decayRate: 0.35,
      affectedNodes: wave2Nodes
    });
  }

  // Wave 3: Tertiary spread (diminished)
  const wave3Nodes: string[] = [];
  wave2Nodes.forEach(nodeId => {
    const node = network.find(n => n.nodeId === nodeId);
    if (node && Math.random() < node.susceptibility * 0.5) {
      node.connections.forEach(c => {
        if (!affectedNodes.has(c)) {
          wave3Nodes.push(c);
          affectedNodes.add(c);
        }
      });
    }
  });

  if (wave3Nodes.length > 0) {
    waves.push({
      waveId: crypto.randomUUID(),
      originNode: 'tertiary',
      emotion: targetEmotion,
      intensity: (originNode?.emotionalIntensity || 0.5) * 0.4,
      reach: wave3Nodes.length,
      decayRate: 0.5,
      affectedNodes: wave3Nodes
    });
  }

  return {
    waves,
    totalAffected: affectedNodes.size,
    peakReachWave: waves.reduce((max, w) => w.reach > max.reach ? w : max, waves[0])?.waveId,
    propagationSpeed: 'moderate',
    naturalDecay: '48-72 hours without reinforcement'
  };
}

function predictCascadeScenarios(
  network: EmotionalNode[],
  simulation: any,
  targetEmotion: string
): CascadePrediction[] {
  const predictions: CascadePrediction[] = [];

  // Scenario 1: Natural spread
  predictions.push({
    scenario: 'Natural Propagation',
    probability: 0.7,
    peakIntensity: simulation.waves[0]?.intensity || 0.5,
    timeToTeak: 12, // hours
    totalAffected: simulation.totalAffected,
    mitigation: [
      'Counter-messaging within first 6 hours',
      'Engage super-spreaders with alternative narrative',
      'Provide factual information to reduce uncertainty'
    ]
  });

  // Scenario 2: Amplified spread (super-spreader activation)
  predictions.push({
    scenario: 'Super-Spreader Amplification',
    probability: 0.4,
    peakIntensity: (simulation.waves[0]?.intensity || 0.5) * 1.5,
    timeToTeak: 6, // hours
    totalAffected: simulation.totalAffected * 2,
    mitigation: [
      'Immediately engage key influencers',
      'Deploy rapid response messaging',
      'Provide alternative emotional outlet'
    ]
  });

  // Scenario 3: Cascade failure (burnout)
  predictions.push({
    scenario: 'Cascade Burnout',
    probability: 0.35,
    peakIntensity: (simulation.waves[0]?.intensity || 0.5) * 0.6,
    timeToTeak: 24, // hours
    totalAffected: Math.floor(simulation.totalAffected * 0.5),
    mitigation: [
      'Allow natural decay',
      'Minimize reinforcing stimuli',
      'Prepare for secondary surge'
    ]
  });

  // Scenario 4: Emotional backlash
  if (targetEmotion === 'fear' || targetEmotion === 'anger') {
    predictions.push({
      scenario: 'Emotional Backlash',
      probability: 0.25,
      peakIntensity: (simulation.waves[0]?.intensity || 0.5) * 0.8,
      timeToTeak: 36, // hours
      totalAffected: simulation.totalAffected,
      mitigation: [
        'Prepare for opposite emotional reaction',
        'Have recovery messaging ready',
        'Monitor for signs of collective rejection'
      ]
    });
  }

  return predictions;
}

function generateInterventionPoints(
  network: EmotionalNode[],
  superSpreaders: EmotionalNode[],
  simulation: any
): any {
  return {
    critical: {
      timing: 'First 2 hours',
      targets: superSpreaders.slice(0, 2).map(s => s.nodeId),
      action: 'Direct engagement with alternative emotional framing',
      effectiveness: 0.85
    },
    primary: {
      timing: 'Hours 2-6',
      targets: superSpreaders.slice(2).map(s => s.nodeId),
      action: 'Secondary influencer engagement',
      effectiveness: 0.7
    },
    secondary: {
      timing: 'Hours 6-24',
      targets: ['Affected network periphery'],
      action: 'Broad messaging and emotional support',
      effectiveness: 0.55
    },
    maintenance: {
      timing: 'Days 2-7',
      targets: ['All affected nodes'],
      action: 'Reinforcement of alternative emotional state',
      effectiveness: 0.45
    }
  };
}

function calculateNetworkResilience(network: EmotionalNode[]): any {
  const avgSusceptibility = network.reduce((sum, n) => sum + n.susceptibility, 0) / Math.max(network.length, 1);
  const avgInfluence = network.reduce((sum, n) => sum + n.influence, 0) / Math.max(network.length, 1);
  
  const resilienceScore = (1 - avgSusceptibility) * 0.6 + (1 - avgInfluence * 0.3) * 0.4;

  return {
    overallResilience: resilienceScore,
    vulnerabilityLevel: resilienceScore < 0.4 ? 'high' : resilienceScore < 0.6 ? 'moderate' : 'low',
    strengthFactors: [
      'Diverse emotional states reduce cascade risk',
      'Low susceptibility nodes act as firewalls',
      'Decentralized influence distribution'
    ],
    weaknessFactors: [
      avgSusceptibility > 0.6 ? 'High average susceptibility' : null,
      network.length < 5 ? 'Small network size increases volatility' : null
    ].filter(Boolean)
  };
}

function generateInterventionStrategies(
  targetEmotion: string,
  superSpreaders: EmotionalNode[],
  interventionPoints: any,
  interventionType?: string
): any {
  const strategies = {
    containment: {
      description: 'Limit spread without direct confrontation',
      tactics: [
        'Reduce visibility of emotional content',
        'Delay sharing/forwarding mechanisms',
        'Introduce emotional friction in transmission'
      ],
      effectiveness: 0.65,
      timing: 'Best in first 4 hours'
    },
    redirection: {
      description: 'Channel emotional energy toward alternative target',
      tactics: [
        'Provide alternative emotional outlet',
        'Introduce competing narrative',
        'Redirect focus to actionable response'
      ],
      effectiveness: 0.7,
      timing: 'Effective during peak intensity'
    },
    inoculation: {
      description: 'Pre-emptively reduce susceptibility',
      tactics: [
        'Warn of potential emotional manipulation',
        'Provide context before exposure',
        'Build emotional resilience through preparation'
      ],
      effectiveness: 0.8,
      timing: 'Best before cascade begins'
    },
    counterContagion: {
      description: 'Introduce competing positive emotional cascade',
      tactics: [
        'Deploy super-spreaders with positive message',
        'Create emotional momentum in opposite direction',
        'Amplify resilient voices in network'
      ],
      effectiveness: 0.75,
      timing: 'During or after peak'
    }
  };

  return {
    strategies,
    recommended: interventionType || 'redirection',
    superSpreaderEngagement: superSpreaders.map(s => ({
      nodeId: s.nodeId,
      approach: s.susceptibility > 0.6 ? 'Direct emotional appeal' : 'Logical framing',
      timing: 'Immediate'
    })),
    escalationPath: [
      'Begin with containment',
      'If unsuccessful, escalate to redirection',
      'Deploy counterContagion if cascade persists',
      'Maintain inoculation for future events'
    ]
  };
}

function calculateNetworkDensity(network: EmotionalNode[]): number {
  const totalPossibleConnections = network.length * (network.length - 1);
  const actualConnections = network.reduce((sum, n) => sum + n.connections.length, 0);
  return actualConnections / Math.max(totalPossibleConnections, 1);
}

function calculateCascadeRisk(predictions: CascadePrediction[]): string {
  const highProbScenarios = predictions.filter(p => p.probability > 0.5);
  const highIntensityScenarios = predictions.filter(p => p.peakIntensity > 0.7);
  
  if (highProbScenarios.length > 1 && highIntensityScenarios.length > 0) return 'critical';
  if (highProbScenarios.length > 0 || highIntensityScenarios.length > 0) return 'high';
  return 'moderate';
}

function calculateInterventionEffectiveness(strategies: any): number {
  const allEffectiveness = Object.values(strategies.strategies).map((s: any) => s.effectiveness);
  return allEffectiveness.reduce((sum: number, e: number) => sum + e, 0) / allEffectiveness.length;
}

function identifyOptimalTiming(simulation: any): string {
  const firstWave = simulation.waves[0];
  if (firstWave?.intensity > 0.7) return 'Immediate (within 1 hour)';
  if (firstWave?.intensity > 0.5) return 'Soon (within 4 hours)';
  return 'Standard (within 12 hours)';
}
