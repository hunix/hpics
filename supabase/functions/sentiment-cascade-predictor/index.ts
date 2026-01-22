import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CascadeRequest {
  action: 'predict' | 'simulate' | 'identify_amplifiers' | 'containment';
  profileId?: string;
  sentimentChange?: { from: number; to: number };
  networkScope?: 'direct' | 'extended' | 'full';
}

interface SIRParameters {
  beta: number;  // Transmission rate
  gamma: number; // Recovery rate
  R0: number;    // Basic reproduction number
}

interface CascadeNode {
  profileId: string;
  name: string;
  influence: number;
  susceptibility: number;
  connections: number;
}

interface PropagationWave {
  step: number;
  infected: string[];
  recovered: string[];
  susceptible: number;
  cumulativeReach: number;
}

// Calculate SIR epidemic parameters from network structure
function calculateSIRParameters(
  avgConnections: number,
  avgInfluence: number,
  sentimentIntensity: number
): SIRParameters {
  // Beta: transmission rate based on connections and sentiment intensity
  const beta = 0.1 + (avgConnections / 100) * 0.2 + (sentimentIntensity / 100) * 0.3;
  
  // Gamma: recovery/resistance rate
  const gamma = 0.05 + (100 - avgInfluence) / 500;
  
  // R0: basic reproduction number
  const R0 = beta / gamma;
  
  return { beta: Math.min(0.5, beta), gamma, R0 };
}

// Identify influence amplifiers in the network
function identifyAmplifiers(
  profiles: any[],
  relationships: any[]
): CascadeNode[] {
  const connectionCounts = new Map<string, number>();
  const influenceScores = new Map<string, number>();
  
  // Count connections
  for (const rel of relationships) {
    connectionCounts.set(rel.source_profile_id, (connectionCounts.get(rel.source_profile_id) || 0) + 1);
    connectionCounts.set(rel.target_profile_id, (connectionCounts.get(rel.target_profile_id) || 0) + 1);
  }
  
  // Calculate influence scores
  for (const profile of profiles) {
    const connections = connectionCounts.get(profile.id) || 0;
    const trustLevel = profile.trust_level || 50;
    const relStrength = profile.relationship_strength || 50;
    
    // Influence = connections * trust * relationship
    const influence = (connections * 10 + trustLevel + relStrength) / 3;
    influenceScores.set(profile.id, influence);
  }
  
  // Create cascade nodes
  const nodes: CascadeNode[] = profiles.map(p => ({
    profileId: p.id,
    name: p.name || 'Unknown',
    influence: influenceScores.get(p.id) || 0,
    susceptibility: 100 - (p.trust_level || 50), // Lower trust = more susceptible
    connections: connectionCounts.get(p.id) || 0
  }));
  
  return nodes.sort((a, b) => b.influence - a.influence);
}

// Simulate cascade propagation using SIR model
function simulateCascade(
  nodes: CascadeNode[],
  relationships: any[],
  seedNodes: string[],
  params: SIRParameters,
  maxSteps: number = 20
): PropagationWave[] {
  const waves: PropagationWave[] = [];
  const infected = new Set(seedNodes);
  const recovered = new Set<string>();
  const susceptible = new Set(nodes.map(n => n.profileId).filter(id => !seedNodes.includes(id)));
  
  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const rel of relationships) {
    if (!adjacency.has(rel.source_profile_id)) {
      adjacency.set(rel.source_profile_id, []);
    }
    if (!adjacency.has(rel.target_profile_id)) {
      adjacency.set(rel.target_profile_id, []);
    }
    adjacency.get(rel.source_profile_id)!.push(rel.target_profile_id);
    adjacency.get(rel.target_profile_id)!.push(rel.source_profile_id);
  }
  
  // Node influence lookup
  const nodeInfluence = new Map(nodes.map(n => [n.profileId, n.influence]));
  const nodeSusceptibility = new Map(nodes.map(n => [n.profileId, n.susceptibility]));
  
  for (let step = 0; step < maxSteps; step++) {
    const newInfected: string[] = [];
    const newRecovered: string[] = [];
    
    // Infection spread
    for (const infectedNode of infected) {
      const neighbors = adjacency.get(infectedNode) || [];
      const spreaderInfluence = (nodeInfluence.get(infectedNode) || 50) / 100;
      
      for (const neighbor of neighbors) {
        if (susceptible.has(neighbor)) {
          const susceptibility = (nodeSusceptibility.get(neighbor) || 50) / 100;
          const infectionProb = params.beta * spreaderInfluence * susceptibility;
          
          if (Math.random() < infectionProb) {
            newInfected.push(neighbor);
            susceptible.delete(neighbor);
          }
        }
      }
    }
    
    // Recovery
    for (const infectedNode of infected) {
      if (Math.random() < params.gamma) {
        newRecovered.push(infectedNode);
      }
    }
    
    // Update sets
    for (const node of newInfected) {
      infected.add(node);
    }
    for (const node of newRecovered) {
      infected.delete(node);
      recovered.add(node);
    }
    
    waves.push({
      step,
      infected: [...infected],
      recovered: [...recovered],
      susceptible: susceptible.size,
      cumulativeReach: infected.size + recovered.size
    });
    
    // Check for equilibrium
    if (newInfected.length === 0 && newRecovered.length === 0) {
      break;
    }
  }
  
  return waves;
}

// Calculate optimal containment strategy
function calculateContainmentStrategy(
  nodes: CascadeNode[],
  waves: PropagationWave[],
  params: SIRParameters
): any {
  // Identify critical nodes for containment
  const topAmplifiers = nodes.slice(0, 5);
  
  // Calculate peak timing
  const peakWave = waves.reduce((max, w) => w.infected.length > max.infected.length ? w : max, waves[0]);
  
  // Herd immunity threshold
  const herdImmunityThreshold = 1 - (1 / params.R0);
  
  // Counter-narrative timing
  const optimalInterventionStep = Math.max(0, peakWave.step - 2);
  
  return {
    criticalNodes: topAmplifiers.map(n => ({
      id: n.profileId,
      name: n.name,
      influence: Math.round(n.influence),
      priority: 'high'
    })),
    peakTiming: {
      step: peakWave.step,
      peakInfected: peakWave.infected.length,
      estimatedHours: peakWave.step * 4 // Assume 4 hours per step
    },
    herdImmunity: {
      threshold: Math.round(herdImmunityThreshold * 100),
      nodesRequired: Math.ceil(nodes.length * herdImmunityThreshold)
    },
    counterNarrative: {
      optimalStartStep: optimalInterventionStep,
      optimalStartHours: optimalInterventionStep * 4,
      targetAudience: topAmplifiers.slice(0, 3).map(n => n.name)
    },
    isolationStrategy: {
      nodesToIsolate: topAmplifiers.slice(0, 3).map(n => n.profileId),
      expectedReduction: Math.round((1 - Math.pow(0.7, 3)) * 100)
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'sentiment-cascade-predictor', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    const { action, profileId, sentimentChange, networkScope } = await req.json() as CascadeRequest;

    console.log(`[Cascade Predictor] Action: ${action}`);

    // Get network data
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(200);

    const { data: relationships } = await supabase
      .from('contact_relationships')
      .select('*')
      .eq('user_id', user.id)
      .limit(1000);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No profiles found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Identify amplifiers
    const nodes = identifyAmplifiers(profiles, relationships || []);
    
    // Calculate average metrics
    const avgConnections = nodes.reduce((sum, n) => sum + n.connections, 0) / nodes.length;
    const avgInfluence = nodes.reduce((sum, n) => sum + n.influence, 0) / nodes.length;
    const sentimentIntensity = sentimentChange 
      ? Math.abs(sentimentChange.to - sentimentChange.from) 
      : 50;
    
    // Calculate SIR parameters
    const sirParams = calculateSIRParameters(avgConnections, avgInfluence, sentimentIntensity);

    let result: any = {
      networkSize: profiles.length,
      relationshipCount: relationships?.length || 0,
      sirParameters: {
        transmissionRate: Math.round(sirParams.beta * 100) / 100,
        recoveryRate: Math.round(sirParams.gamma * 100) / 100,
        R0: Math.round(sirParams.R0 * 100) / 100,
        epidemicThreshold: sirParams.R0 > 1 ? 'above' : 'below'
      }
    };

    if (action === 'identify_amplifiers') {
      result.amplifiers = nodes.slice(0, 20).map(n => ({
        ...n,
        influence: Math.round(n.influence),
        susceptibility: Math.round(n.susceptibility)
      }));
      result.amplifierDistribution = {
        highInfluence: nodes.filter(n => n.influence > 70).length,
        mediumInfluence: nodes.filter(n => n.influence >= 40 && n.influence <= 70).length,
        lowInfluence: nodes.filter(n => n.influence < 40).length
      };
    }

    if (action === 'predict' || action === 'simulate') {
      // Determine seed nodes
      let seedNodes: string[] = [];
      if (profileId) {
        seedNodes = [profileId];
      } else {
        // Use top 3 amplifiers as seeds
        seedNodes = nodes.slice(0, 3).map(n => n.profileId);
      }
      
      // Run simulation
      const waves = simulateCascade(nodes, relationships || [], seedNodes, sirParams);
      
      result.simulation = {
        seedNodes: seedNodes.map(id => nodes.find(n => n.profileId === id)?.name || id),
        totalSteps: waves.length,
        finalReach: waves[waves.length - 1]?.cumulativeReach || 0,
        peakInfected: Math.max(...waves.map(w => w.infected.length)),
        propagationCurve: waves.map(w => ({
          step: w.step,
          active: w.infected.length,
          cumulative: w.cumulativeReach,
          remaining: w.susceptible
        }))
      };
      
      result.riskAssessment = {
        spreadPotential: sirParams.R0 > 2 ? 'high' : sirParams.R0 > 1 ? 'moderate' : 'low',
        estimatedReach: Math.round((result.simulation.finalReach / profiles.length) * 100),
        timeToSaturation: waves.length * 4, // hours
        viralCoefficient: sirParams.R0
      };
    }

    if (action === 'containment') {
      const seedNodes = profileId ? [profileId] : nodes.slice(0, 3).map(n => n.profileId);
      const waves = simulateCascade(nodes, relationships || [], seedNodes, sirParams);
      
      const containment = calculateContainmentStrategy(nodes, waves, sirParams);
      result.containmentStrategy = containment;
    }

    // Store prediction
    if (profileId) {
      await supabase.from('cascade_predictions').upsert({
        user_id: user.id,
        profile_id: profileId,
        cascade_type: 'sentiment',
        propagation_probability: sirParams.beta,
        peak_timing_hours: result.simulation?.totalSteps * 4 || 0,
        sir_parameters: sirParams,
        influence_amplifiers: nodes.slice(0, 5),
        trigger_points: result.simulation?.seedNodes || [],
        containment_strategy: result.containmentStrategy || {},
        network_scope: { size: profiles.length, relationships: relationships?.length || 0 },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,cascade_type'
      });
    }

    // Store in ai_analyses for section availability detection
    if (profileId) {
      await supabase.from('ai_analyses').upsert({
        user_id: user.id,
        profile_id: profileId,
        analysis_type: 'sentiment_cascade',
        result: result,
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });
    }

    console.log(`[Cascade Predictor] Complete. R0: ${sirParams.R0.toFixed(2)}, Reach: ${result.simulation?.finalReach || 'N/A'}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Cascade Predictor] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
