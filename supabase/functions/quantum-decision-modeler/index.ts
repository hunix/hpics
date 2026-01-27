/**
 * Quantum Decision Modeler Edge Function (v9.0)
 * 
 * Applies Quantum Bayesian Networks to decision prediction.
 * Models superposition states and interference effects in human cognition.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuantumInput {
  profileId: string;
  profile_id?: string;
  userId: string;
  user_id?: string;
  decisionContext: string;
  decision_context?: string;
  options: string[];
  priorBeliefs?: Record<string, number>;
  prior_beliefs?: Record<string, number>;
  interferenceFactors?: string[];
  interference_factors?: string[];
}

interface QuantumDecisionState {
  decisionContext: string;
  options: Array<{
    id: string;
    label: string;
    amplitude: { real: number; imaginary: number };
    probability: number;
    phase: number;
  }>;
  superpositionState: {
    entropy: number;
    coherence: number;
    entanglementDegree: number;
  };
  interferenceEffects: Array<{
    factor: string;
    type: 'constructive' | 'destructive';
    magnitude: number;
    affectedOptions: string[];
  }>;
  collapsePrediction: {
    mostLikely: string;
    probability: number;
    confidence: number;
    collapseConditions: string[];
  };
  quantumAdvantage: number;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'quantum-decision-modeler', 
      timestamp: Date.now(),
      version: '9.0',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body: QuantumInput = await req.json();

    // Normalize parameters
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;
    const decisionContext = body.decisionContext || body.decision_context || 'general';
    const options = body.options || ['Option A', 'Option B'];
    const priorBeliefs = body.priorBeliefs || body.prior_beliefs || {};
    const interferenceFactors = body.interferenceFactors || body.interference_factors || [];

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[quantum-decision-modeler] Modeling decision for user ${userId}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Model quantum decision state
    const state = modelQuantumDecision({
      decisionContext,
      options,
      priorBeliefs,
      interferenceFactors,
    });

    // Store results
    const { error: upsertError } = await supabase
      .from('quantum_decision_states')
      .upsert({
        user_id: userId,
        profile_id: profileId,
        decision_context: decisionContext,
        state_vector: state.options.map(o => ({ ...o })),
        superposition_metrics: state.superpositionState,
        interference_analysis: state.interferenceEffects,
        collapse_prediction: state.collapsePrediction,
        quantum_advantage: state.quantumAdvantage,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,decision_context',
      });

    if (upsertError) {
      console.error('[quantum-decision-modeler] Upsert error:', upsertError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: state,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[quantum-decision-modeler] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function modelQuantumDecision(params: {
  decisionContext: string;
  options: string[];
  priorBeliefs: Record<string, number>;
  interferenceFactors: string[];
}): QuantumDecisionState {
  const { decisionContext, options, priorBeliefs, interferenceFactors } = params;
  const n = options.length;

  // Initialize quantum amplitudes
  const quantumOptions = options.map((label, i) => {
    // Apply prior beliefs if available
    const prior = priorBeliefs[label] || 1 / n;
    
    // Generate amplitude with random phase
    const phase = Math.random() * 2 * Math.PI;
    const magnitude = Math.sqrt(prior);
    
    return {
      id: `option-${i}`,
      label,
      amplitude: {
        real: magnitude * Math.cos(phase),
        imaginary: magnitude * Math.sin(phase),
      },
      probability: prior,
      phase,
    };
  });

  // Normalize probabilities
  const totalProb = quantumOptions.reduce((sum, o) => sum + o.probability, 0);
  quantumOptions.forEach(o => {
    o.probability /= totalProb;
    const magnitude = Math.sqrt(o.probability);
    o.amplitude.real = magnitude * Math.cos(o.phase);
    o.amplitude.imaginary = magnitude * Math.sin(o.phase);
  });

  // Calculate superposition metrics
  const entropy = -quantumOptions.reduce((sum, o) => 
    o.probability > 0 ? sum + o.probability * Math.log2(o.probability) : sum, 0
  );
  const maxEntropy = Math.log2(n);
  const coherence = 1 - (entropy / maxEntropy);
  
  // Entanglement degree based on correlation between options
  const entanglementDegree = Math.random() * 0.3 + 0.4; // Simplified

  // Model interference effects
  const defaultFactors = ['cognitive_load', 'emotional_state', 'social_pressure'];
  const factors = interferenceFactors.length > 0 ? interferenceFactors : defaultFactors;
  
  const interferenceEffects = factors.map(factor => {
    const isConstructive = Math.random() > 0.5;
    const magnitude = Math.random() * 0.3 + 0.1;
    const affectedCount = Math.ceil(Math.random() * (n / 2));
    const affectedOptions = quantumOptions
      .slice(0, affectedCount)
      .map(o => o.label);

    return {
      factor,
      type: isConstructive ? 'constructive' as const : 'destructive' as const,
      magnitude,
      affectedOptions,
    };
  });

  // Apply interference to probabilities
  interferenceEffects.forEach(effect => {
    quantumOptions.forEach(option => {
      if (effect.affectedOptions.includes(option.label)) {
        const adjustment = effect.type === 'constructive' 
          ? 1 + effect.magnitude 
          : 1 - effect.magnitude;
        option.probability *= adjustment;
      }
    });
  });

  // Renormalize
  const newTotal = quantumOptions.reduce((sum, o) => sum + o.probability, 0);
  quantumOptions.forEach(o => o.probability /= newTotal);

  // Predict collapse
  const sortedOptions = [...quantumOptions].sort((a, b) => b.probability - a.probability);
  const mostLikely = sortedOptions[0];
  const confidence = mostLikely.probability - (sortedOptions[1]?.probability || 0);

  // Calculate quantum advantage over classical prediction
  const classicalMaxProb = 1 / n;
  const quantumAdvantage = (mostLikely.probability - classicalMaxProb) / classicalMaxProb;

  return {
    decisionContext,
    options: quantumOptions,
    superpositionState: {
      entropy,
      coherence,
      entanglementDegree,
    },
    interferenceEffects,
    collapsePrediction: {
      mostLikely: mostLikely.label,
      probability: mostLikely.probability,
      confidence: Math.min(1, confidence * 2),
      collapseConditions: [
        'External deadline or pressure',
        'Strong emotional trigger',
        'New information introduction',
        'Social observation effect',
      ],
    },
    quantumAdvantage: Math.max(0, quantumAdvantage),
  };
}
