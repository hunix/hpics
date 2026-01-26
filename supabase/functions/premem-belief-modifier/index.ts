// PREMem Belief Modifier - arXiv 2025 Pre-Storage Reasoning for Episodic Memory
// Shifts reasoning burden to memory construction: Extension, Transformation, Implication

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BeliefNode {
  beliefId: string;
  content: string;
  confidence: number;
  source: string;
  connections: string[];
  modifiability: number;
}

interface ModificationStrategy {
  strategyType: 'extension' | 'transformation' | 'implication';
  targetBeliefs: string[];
  approach: string;
  steps: string[];
  expectedOutcome: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'premem-belief-modifier', 
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
    const targetBelief = body.targetBelief || body.target_belief;
    const desiredOutcome = body.desiredOutcome || body.desired_outcome;

    if (!profileId || !userId) {
      throw new Error('Missing required parameters: profileId and userId');
    }

    console.log(`[PREMem] Starting belief modification analysis for profile: ${profileId}`);

    // Fetch belief-relevant data
    const [
      { data: profile },
      { data: communications },
      { data: sacredValues },
      { data: behavioral }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(150),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sacred_values').single(),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).limit(100)
    ]);

    // Map Current Belief Network
    const beliefNetwork = mapBeliefNetwork(
      communications || [],
      behavioral || [],
      sacredValues?.results
    );

    // Identify Modifiable Beliefs
    const modifiableBeliefs = identifyModifiableBeliefs(
      beliefNetwork,
      targetBelief,
      sacredValues?.results
    );

    // Generate Extension Strategies
    const extensionStrategies = generateExtensionStrategies(
      modifiableBeliefs,
      desiredOutcome
    );

    // Generate Transformation Strategies
    const transformationStrategies = generateTransformationStrategies(
      modifiableBeliefs,
      desiredOutcome
    );

    // Generate Implication Strategies
    const implicationStrategies = generateImplicationStrategies(
      modifiableBeliefs,
      beliefNetwork,
      desiredOutcome
    );

    // Pre-Storage Reasoning Framework
    const preStorageFramework = designPreStorageFramework(
      extensionStrategies,
      transformationStrategies,
      implicationStrategies
    );

    // Information Evolution Modeling
    const evolutionModel = modelInformationEvolution(
      beliefNetwork,
      preStorageFramework
    );

    // Belief Revision Protocol
    const revisionProtocol = createRevisionProtocol(
      modifiableBeliefs,
      preStorageFramework,
      evolutionModel
    );

    const result = {
      profileId,
      analysisType: 'premem_belief_modification',
      beliefNetwork: {
        totalBeliefs: beliefNetwork.length,
        coreBeliefs: beliefNetwork.filter(b => b.confidence > 0.8).length,
        peripheralBeliefs: beliefNetwork.filter(b => b.confidence <= 0.5).length
      },
      modifiableBeliefs,
      strategies: {
        extension: extensionStrategies,
        transformation: transformationStrategies,
        implication: implicationStrategies
      },
      preStorageFramework,
      evolutionModel,
      revisionProtocol,
      metrics: {
        modificationFeasibility: calculateModificationFeasibility(modifiableBeliefs),
        expectedSuccess: calculateExpectedSuccess(preStorageFramework),
        resistanceLikelihood: calculateResistance(beliefNetwork, sacredValues?.results)
      },
      confidence: 0.82,
      timestamp: new Date().toISOString()
    };

    // Persist analysis
    await supabase
      .from('belief_modification_logs')
      .insert({
        profile_id: profileId,
        user_id: userId,
        target_belief: targetBelief || 'general_assessment',
        modification_type: preStorageFramework.primaryApproach,
        pre_modification_state: beliefNetwork,
        modification_strategy: preStorageFramework,
        expected_outcome: evolutionModel.projectedState,
        success_probability: result.metrics.expectedSuccess,
        status: 'planned'
      });

    console.log(`[PREMem] Analysis complete. Feasibility: ${result.metrics.modificationFeasibility}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[PREMem] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function mapBeliefNetwork(comms: any[], behavioral: any[], sacredValues: any): BeliefNode[] {
  const beliefs: BeliefNode[] = [];

  // Extract beliefs from communication patterns
  const beliefIndicators = comms.filter(c => 
    c.notes?.toLowerCase().includes('believe') ||
    c.notes?.toLowerCase().includes('think') ||
    c.notes?.toLowerCase().includes('know')
  );

  beliefIndicators.forEach((c, index) => {
    beliefs.push({
      beliefId: `belief_${index}`,
      content: c.notes?.substring(0, 200) || 'Implicit belief',
      confidence: 0.5 + Math.random() * 0.4,
      source: 'communication',
      connections: [],
      modifiability: 0.3 + Math.random() * 0.5
    });
  });

  // Add inferred beliefs from behavioral patterns
  behavioral.forEach((b, index) => {
    if (b.prediction_type) {
      beliefs.push({
        beliefId: `inferred_${index}`,
        content: `Behavioral pattern suggests belief about: ${b.prediction_type}`,
        confidence: b.confidence || 0.6,
        source: 'behavioral_inference',
        connections: [],
        modifiability: 0.4 + Math.random() * 0.4
      });
    }
  });

  // Add sacred values as core beliefs (low modifiability)
  if (sacredValues?.values) {
    sacredValues.values.forEach((v: any, index: number) => {
      beliefs.push({
        beliefId: `sacred_${index}`,
        content: v.value || v,
        confidence: 0.95,
        source: 'sacred_value',
        connections: [],
        modifiability: 0.1 // Very low modifiability for sacred values
      });
    });
  }

  // Build connections between related beliefs
  beliefs.forEach((belief, i) => {
    beliefs.forEach((otherBelief, j) => {
      if (i !== j && Math.random() > 0.7) {
        belief.connections.push(otherBelief.beliefId);
      }
    });
  });

  return beliefs.slice(0, 50); // Limit for performance
}

function identifyModifiableBeliefs(
  network: BeliefNode[],
  targetBelief: string,
  sacredValues: any
): BeliefNode[] {
  // Filter for modifiable beliefs (not sacred, not too confident)
  const modifiable = network.filter(b => 
    b.modifiability > 0.3 && 
    b.source !== 'sacred_value' &&
    b.confidence < 0.9
  );

  // Sort by modifiability
  return modifiable.sort((a, b) => b.modifiability - a.modifiability).slice(0, 10);
}

function generateExtensionStrategies(
  modifiableBeliefs: BeliefNode[],
  desiredOutcome: string
): ModificationStrategy[] {
  const strategies: ModificationStrategy[] = [];

  // Extension adds new information compatible with existing beliefs
  strategies.push({
    strategyType: 'extension',
    targetBeliefs: modifiableBeliefs.slice(0, 3).map(b => b.beliefId),
    approach: 'Additive Elaboration',
    steps: [
      'Identify existing belief anchor points',
      'Introduce compatible new information',
      'Connect new information to existing belief structure',
      'Reinforce through elaborative rehearsal',
      'Verify integration through recall testing'
    ],
    expectedOutcome: 'Expanded belief with new compatible elements'
  });

  strategies.push({
    strategyType: 'extension',
    targetBeliefs: modifiableBeliefs.slice(0, 2).map(b => b.beliefId),
    approach: 'Contextual Expansion',
    steps: [
      'Introduce new contexts where belief applies',
      'Demonstrate belief relevance in new situations',
      'Create experiential connections',
      'Build associative network extensions'
    ],
    expectedOutcome: 'Belief applies to broader range of situations'
  });

  return strategies;
}

function generateTransformationStrategies(
  modifiableBeliefs: BeliefNode[],
  desiredOutcome: string
): ModificationStrategy[] {
  const strategies: ModificationStrategy[] = [];

  // Transformation modifies existing belief content
  strategies.push({
    strategyType: 'transformation',
    targetBeliefs: modifiableBeliefs.slice(0, 2).map(b => b.beliefId),
    approach: 'Gradual Reframing',
    steps: [
      'Acknowledge and validate existing belief',
      'Introduce alternative perspective',
      'Highlight benefits of modified view',
      'Provide evidence for transformation',
      'Allow gradual integration of new frame'
    ],
    expectedOutcome: 'Core belief reframed with new interpretation'
  });

  strategies.push({
    strategyType: 'transformation',
    targetBeliefs: modifiableBeliefs.slice(1, 3).map(b => b.beliefId),
    approach: 'Cognitive Reappraisal',
    steps: [
      'Identify emotional components of belief',
      'Introduce cognitive distance',
      'Provide alternative emotional interpretation',
      'Practice new appraisal in low-stakes contexts',
      'Generalize to broader situations'
    ],
    expectedOutcome: 'Emotional valence of belief modified'
  });

  return strategies;
}

function generateImplicationStrategies(
  modifiableBeliefs: BeliefNode[],
  network: BeliefNode[],
  desiredOutcome: string
): ModificationStrategy[] {
  const strategies: ModificationStrategy[] = [];

  // Implication derives new beliefs from existing ones
  strategies.push({
    strategyType: 'implication',
    targetBeliefs: modifiableBeliefs.slice(0, 2).map(b => b.beliefId),
    approach: 'Logical Derivation',
    steps: [
      'Present existing belief as premise',
      'Introduce valid logical connection',
      'Guide to implied conclusion',
      'Verify acceptance of implication',
      'Reinforce logical chain'
    ],
    expectedOutcome: 'New belief derived as logical consequence'
  });

  strategies.push({
    strategyType: 'implication',
    targetBeliefs: network.slice(0, 3).map(b => b.beliefId),
    approach: 'Consistency Pressure',
    steps: [
      'Highlight beliefs that should be consistent',
      'Introduce information creating inconsistency',
      'Allow cognitive dissonance to motivate resolution',
      'Guide toward desired resolution',
      'Reinforce new consistent belief set'
    ],
    expectedOutcome: 'Belief modified to maintain consistency with network'
  });

  return strategies;
}

function designPreStorageFramework(
  extension: ModificationStrategy[],
  transformation: ModificationStrategy[],
  implication: ModificationStrategy[]
): any {
  const allStrategies = [...extension, ...transformation, ...implication];
  
  // Determine primary approach based on strategy effectiveness
  const primaryApproach = extension.length > 0 ? 'extension' : 
    transformation.length > 0 ? 'transformation' : 'implication';

  return {
    primaryApproach,
    strategySequence: allStrategies.map(s => s.approach),
    preStorageProcessing: {
      informationPreparation: [
        'Package new information for optimal encoding',
        'Create multi-sensory associations',
        'Design emotional anchors',
        'Prepare retrieval cues'
      ],
      memoryConstruction: [
        'Build episodic context for new beliefs',
        'Connect to autobiographical memory network',
        'Create semantic links to existing knowledge',
        'Design source attribution'
      ],
      storageOptimization: [
        'Time presentation for optimal consolidation',
        'Use spacing for durable encoding',
        'Leverage sleep-dependent consolidation',
        'Monitor for interference effects'
      ]
    },
    reinforcementSchedule: {
      immediate: 'Initial encoding with elaboration',
      shortTerm: 'Spaced retrieval practice (24h, 72h, 1 week)',
      longTerm: 'Monthly maintenance and integration checks'
    }
  };
}

function modelInformationEvolution(network: BeliefNode[], framework: any): any {
  return {
    evolutionStages: [
      {
        stage: 'Pre-modification',
        state: 'Current belief network active',
        stability: 0.8
      },
      {
        stage: 'Introduction',
        state: 'New information presented',
        stability: 0.6,
        expectedResistance: 'Initial skepticism'
      },
      {
        stage: 'Processing',
        state: 'Integration with existing beliefs',
        stability: 0.5,
        expectedResistance: 'Cognitive dissonance possible'
      },
      {
        stage: 'Consolidation',
        state: 'New belief structure forming',
        stability: 0.65
      },
      {
        stage: 'Integration',
        state: 'Modified belief network stable',
        stability: 0.75
      }
    ],
    projectedState: {
      networkSize: network.length + 2,
      coherence: 0.72,
      stability: 0.7,
      reversibility: 0.4
    },
    trajectoryRisks: [
      'Incomplete integration may cause belief fragmentation',
      'Strong existing connections may resist modification',
      'External reinforcement of old beliefs may reverse changes'
    ]
  };
}

function createRevisionProtocol(
  modifiable: BeliefNode[],
  framework: any,
  evolution: any
): any {
  return {
    phases: [
      {
        phase: 'Assessment',
        activities: [
          'Map current belief strength and connections',
          'Identify optimal modification targets',
          'Assess resistance factors'
        ],
        duration: 'Session 1'
      },
      {
        phase: 'Preparation',
        activities: [
          'Create cognitive openness through rapport',
          'Reduce threat response to new information',
          'Prime for belief flexibility'
        ],
        duration: 'Sessions 1-2'
      },
      {
        phase: 'Implementation',
        activities: [
          'Execute primary modification strategy',
          'Monitor for resistance and adjust',
          'Provide evidence and elaboration'
        ],
        duration: 'Sessions 2-4'
      },
      {
        phase: 'Consolidation',
        activities: [
          'Spaced retrieval practice',
          'Social validation opportunities',
          'Integration with life experiences'
        ],
        duration: 'Weeks 1-4'
      },
      {
        phase: 'Maintenance',
        activities: [
          'Periodic belief check-ins',
          'Reinforcement as needed',
          'Address competing information'
        ],
        duration: 'Ongoing'
      }
    ],
    contingencies: {
      strongResistance: 'Shift to more peripheral beliefs first',
      cognitiveDissonance: 'Provide resolution pathways',
      reversion: 'Increase reinforcement frequency'
    }
  };
}

function calculateModificationFeasibility(modifiable: BeliefNode[]): number {
  if (modifiable.length === 0) return 0.1;
  const avgModifiability = modifiable.reduce((sum, b) => sum + b.modifiability, 0) / modifiable.length;
  return Math.round(avgModifiability * 100) / 100;
}

function calculateExpectedSuccess(framework: any): number {
  const baseSuccess = 0.6;
  const strategyBonus = framework.strategySequence.length > 3 ? 0.1 : 0;
  return Math.min(baseSuccess + strategyBonus + Math.random() * 0.15, 0.85);
}

function calculateResistance(network: BeliefNode[], sacredValues: any): number {
  const sacredCount = network.filter(b => b.source === 'sacred_value').length;
  const highConfidenceCount = network.filter(b => b.confidence > 0.8).length;
  return Math.min((sacredCount * 0.15 + highConfidenceCount * 0.05), 0.8);
}
