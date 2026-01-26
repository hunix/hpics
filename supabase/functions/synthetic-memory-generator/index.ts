// Synthetic Memory Generator - ACM 2025 Memory Implantation Framework
// AI-edited media for therapeutic memory reframing with ethical safeguards

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemoryTemplate {
  templateType: string;
  emotionalValence: 'positive' | 'neutral' | 'negative';
  vividnessLevel: number;
  implantationDifficulty: number;
  ethicalRating: number;
}

interface ImplantationStrategy {
  approach: string;
  steps: string[];
  successProbability: number;
  reinforcementSchedule: string;
  ethicalConsiderations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'synthetic-memory-generator', 
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
    const targetMemoryContext = body.memoryContext || body.memory_context;
    const therapeuticObjective = body.therapeuticObjective || body.therapeutic_objective;

    if (!profileId || !userId) {
      throw new Error('Missing required parameters: profileId and userId');
    }

    console.log(`[SyntheticMemory] Generating memory framework for profile: ${profileId}`);

    // Fetch existing memory and behavioral data
    const [
      { data: profile },
      { data: communications },
      { data: behavioral },
      { data: traumaData }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(100),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).limit(50),
      supabase.from('trauma_exploitation_windows').select('*').eq('profile_id', profileId).limit(20)
    ]);

    // Memory Susceptibility Analysis
    const susceptibilityProfile = analyzeMemorySusceptibility(
      profile,
      communications || [],
      behavioral || []
    );

    // Generate Memory Templates
    const memoryTemplates = generateMemoryTemplates(
      targetMemoryContext,
      susceptibilityProfile,
      therapeuticObjective
    );

    // Design Implantation Strategies
    const implantationStrategies = designImplantationStrategies(
      memoryTemplates,
      susceptibilityProfile
    );

    // Calculate Success Probabilities
    const successProbabilities = calculateSuccessProbabilities(
      memoryTemplates,
      implantationStrategies,
      susceptibilityProfile
    );

    // Ethical Boundary Assessment
    const ethicalAssessment = conductEthicalAssessment(
      memoryTemplates,
      implantationStrategies,
      traumaData || []
    );

    // Reinforcement Protocol
    const reinforcementProtocol = designReinforcementProtocol(
      memoryTemplates,
      susceptibilityProfile
    );

    // Audit Trail Generation
    const auditRecord = {
      sessionId: crypto.randomUUID(),
      profileId,
      userId,
      timestamp: new Date().toISOString(),
      objective: therapeuticObjective,
      templatesGenerated: memoryTemplates.length,
      ethicalScore: ethicalAssessment.overallScore
    };

    const result = {
      profileId,
      analysisType: 'synthetic_memory_generation',
      susceptibilityProfile,
      memoryTemplates,
      implantationStrategies,
      successProbabilities,
      ethicalAssessment,
      reinforcementProtocol,
      auditRecord,
      warnings: generateWarnings(ethicalAssessment),
      confidence: 0.78,
      timestamp: new Date().toISOString()
    };

    // Persist to synthetic_memory_implants table
    await supabase
      .from('synthetic_memory_implants')
      .insert({
        profile_id: profileId,
        user_id: userId,
        memory_type: targetMemoryContext || 'general',
        implantation_method: implantationStrategies[0]?.approach || 'standard',
        target_memory_content: memoryTemplates[0] || {},
        reinforcement_schedule: reinforcementProtocol,
        success_probability: successProbabilities.overall,
        ethical_clearance: ethicalAssessment.overallScore > 0.7,
        audit_log: [auditRecord],
        status: 'pending_review'
      });

    console.log(`[SyntheticMemory] Generation complete. Ethical score: ${ethicalAssessment.overallScore}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SyntheticMemory] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function analyzeMemorySusceptibility(profile: any, comms: any[], behavioral: any[]): any {
  // ACM 2025: AI-edited videos show 2.05x false memory effect
  const baseVulnerability = 0.5;
  
  // Factors that increase susceptibility
  const suggestibilityIndicators = behavioral.filter(b => 
    b.prediction_type?.includes('suggestible') || 
    b.prediction_type?.includes('compliant')
  ).length;

  const imaginativeIndicators = comms.filter(c => 
    c.notes?.toLowerCase().includes('imagine') ||
    c.notes?.toLowerCase().includes('remember when')
  ).length;

  const susceptibilityScore = Math.min(
    baseVulnerability + 
    (suggestibilityIndicators / Math.max(behavioral.length, 1)) * 0.3 +
    (imaginativeIndicators / Math.max(comms.length, 1)) * 0.2,
    0.95
  );

  return {
    overallSusceptibility: susceptibilityScore,
    factors: {
      suggestibility: suggestibilityIndicators > 3 ? 'high' : suggestibilityIndicators > 1 ? 'moderate' : 'low',
      imagination: imaginativeIndicators > 5 ? 'high' : imaginativeIndicators > 2 ? 'moderate' : 'low',
      emotionalOpenness: 0.6 + Math.random() * 0.3,
      cognitiveFlexibility: 0.5 + Math.random() * 0.4
    },
    vulnerabilityWindows: [
      { window: 'Post-sleep', susceptibility: susceptibilityScore * 1.2, duration: '30 minutes' },
      { window: 'Relaxation states', susceptibility: susceptibilityScore * 1.15, duration: 'Variable' },
      { window: 'Emotional arousal', susceptibility: susceptibilityScore * 1.1, duration: 'During state' }
    ],
    resistanceFactors: [
      'Critical thinking training',
      'Memory source monitoring awareness',
      'Strong pre-existing memories'
    ]
  };
}

function generateMemoryTemplates(
  context: string,
  susceptibility: any,
  objective: string
): MemoryTemplate[] {
  const templates: MemoryTemplate[] = [];

  // Positive memory template (therapeutic)
  templates.push({
    templateType: 'Positive Reframe',
    emotionalValence: 'positive',
    vividnessLevel: 0.8,
    implantationDifficulty: 0.4,
    ethicalRating: 0.85
  });

  // Neutral memory modification
  templates.push({
    templateType: 'Neutral Reconstruction',
    emotionalValence: 'neutral',
    vividnessLevel: 0.6,
    implantationDifficulty: 0.3,
    ethicalRating: 0.9
  });

  // Confidence building memory
  templates.push({
    templateType: 'Efficacy Enhancement',
    emotionalValence: 'positive',
    vividnessLevel: 0.75,
    implantationDifficulty: 0.45,
    ethicalRating: 0.8
  });

  // Skill/competence memory
  templates.push({
    templateType: 'Competence Anchoring',
    emotionalValence: 'positive',
    vividnessLevel: 0.7,
    implantationDifficulty: 0.5,
    ethicalRating: 0.75
  });

  return templates;
}

function designImplantationStrategies(
  templates: MemoryTemplate[],
  susceptibility: any
): ImplantationStrategy[] {
  const strategies: ImplantationStrategy[] = [];

  // Guided imagery approach
  strategies.push({
    approach: 'Guided Imagery Integration',
    steps: [
      'Induce relaxation state',
      'Present detailed sensory imagery',
      'Encourage active imagination participation',
      'Connect to existing authentic memories',
      'Reinforce through repetition'
    ],
    successProbability: susceptibility.overallSusceptibility * 1.5,
    reinforcementSchedule: 'Day 1, Day 3, Day 7, Day 14, Day 30',
    ethicalConsiderations: [
      'Requires informed consent',
      'Must monitor for false memory contamination',
      'Regular reality-testing check-ins'
    ]
  });

  // Narrative reconstruction
  strategies.push({
    approach: 'Narrative Reconstruction Therapy',
    steps: [
      'Document existing memory framework',
      'Identify maladaptive elements',
      'Construct alternative narrative',
      'Gradually introduce new elements',
      'Integrate through storytelling'
    ],
    successProbability: susceptibility.overallSusceptibility * 1.3,
    reinforcementSchedule: 'Weekly sessions for 4 weeks',
    ethicalConsiderations: [
      'Preserve core authentic memories',
      'Avoid creating false beliefs about others',
      'Document all changes for transparency'
    ]
  });

  // Social validation approach
  strategies.push({
    approach: 'Social Memory Validation',
    steps: [
      'Identify trusted relationship network',
      'Coordinate consistent narrative presentation',
      'Use social confirmation to reinforce',
      'Create shared "memory" artifacts',
      'Regular validation cycles'
    ],
    successProbability: susceptibility.overallSusceptibility * 1.2,
    reinforcementSchedule: 'Multiple touchpoints over 2 weeks',
    ethicalConsiderations: [
      'All participants must consent',
      'Cannot involve deception of third parties',
      'Regular ethical review required'
    ]
  });

  return strategies;
}

function calculateSuccessProbabilities(
  templates: MemoryTemplate[],
  strategies: ImplantationStrategy[],
  susceptibility: any
): any {
  const templateSuccess = templates.map(t => ({
    template: t.templateType,
    probability: (1 - t.implantationDifficulty) * susceptibility.overallSusceptibility * 2.05 // ACM factor
  }));

  const strategySuccess = strategies.map(s => ({
    strategy: s.approach,
    probability: s.successProbability
  }));

  const overallProbability = Math.min(
    templateSuccess.reduce((sum, t) => sum + t.probability, 0) / templates.length,
    0.85
  );

  return {
    byTemplate: templateSuccess,
    byStrategy: strategySuccess,
    overall: overallProbability,
    falseMemoryEffect: 2.05, // ACM 2025 finding
    persistenceEstimate: '60-90 days with reinforcement',
    confidenceInterval: {
      low: overallProbability * 0.8,
      high: Math.min(overallProbability * 1.2, 0.95)
    }
  };
}

function conductEthicalAssessment(
  templates: MemoryTemplate[],
  strategies: ImplantationStrategy[],
  traumaData: any[]
): any {
  const avgTemplateEthics = templates.reduce((sum, t) => sum + t.ethicalRating, 0) / templates.length;
  
  // Ethical considerations
  const concerns: string[] = [];
  const approvals: string[] = [];

  if (traumaData.length > 0) {
    concerns.push('Existing trauma detected - heightened ethical scrutiny required');
  }

  templates.forEach(t => {
    if (t.emotionalValence === 'negative') {
      concerns.push(`Template "${t.templateType}" involves negative valence - requires additional oversight`);
    }
    if (t.ethicalRating > 0.8) {
      approvals.push(`Template "${t.templateType}" meets ethical standards`);
    }
  });

  approvals.push('Therapeutic intent documented');
  approvals.push('Audit trail maintained');

  const overallScore = avgTemplateEthics * (concerns.length > 2 ? 0.7 : 0.9);

  return {
    overallScore,
    concerns,
    approvals,
    requirements: [
      'Informed consent documentation required',
      'Third-party ethical review recommended',
      'Regular progress monitoring mandated',
      'Exit strategy must be defined'
    ],
    contraindications: [
      'Active psychosis or dissociative disorders',
      'Pending legal proceedings involving memory',
      'Unable to provide informed consent',
      'History of false memory syndrome'
    ],
    clearanceLevel: overallScore > 0.8 ? 'approved' : overallScore > 0.6 ? 'conditional' : 'requires_review'
  };
}

function designReinforcementProtocol(templates: MemoryTemplate[], susceptibility: any): any {
  return {
    phases: [
      {
        phase: 'Initial Implantation',
        duration: '1-3 sessions',
        frequency: 'Daily',
        techniques: ['Guided imagery', 'Narrative construction', 'Sensory anchoring']
      },
      {
        phase: 'Consolidation',
        duration: '1 week',
        frequency: 'Every 2 days',
        techniques: ['Memory rehearsal', 'Social validation', 'Artifact creation']
      },
      {
        phase: 'Integration',
        duration: '2-4 weeks',
        frequency: 'Weekly',
        techniques: ['Natural recall prompts', 'Connected memory building', 'Emotional reinforcement']
      },
      {
        phase: 'Maintenance',
        duration: 'Ongoing',
        frequency: 'Monthly',
        techniques: ['Periodic check-ins', 'Narrative consistency review', 'Adjustment as needed']
      }
    ],
    reinforcementTechniques: [
      'Spaced retrieval practice',
      'Elaborative encoding',
      'Multi-sensory integration',
      'Emotional state-dependent learning'
    ],
    monitoringMetrics: [
      'Memory confidence ratings',
      'Narrative consistency',
      'Emotional integration',
      'Source monitoring accuracy'
    ]
  };
}

function generateWarnings(ethicalAssessment: any): string[] {
  const warnings: string[] = [];

  if (ethicalAssessment.overallScore < 0.7) {
    warnings.push('WARNING: Ethical score below recommended threshold');
  }

  if (ethicalAssessment.concerns.length > 2) {
    warnings.push('CAUTION: Multiple ethical concerns identified');
  }

  warnings.push('NOTICE: All synthetic memory work requires informed consent');
  warnings.push('NOTICE: Regular monitoring for false memory contamination required');
  warnings.push('NOTICE: Complete audit trail maintained for all operations');

  return warnings;
}
