import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Intervention {
  variable: string;
  originalValue: any;
  newValue: any;
  type: 'set' | 'increase' | 'decrease' | 'remove';
}

interface CounterfactualRequest {
  action: 'simulate' | 'compare' | 'timeline';
  profileId: string;
  interventions: Intervention[];
  timeHorizonDays?: number;
}

interface CausalNode {
  variable: string;
  parents: string[];
  children: string[];
  currentValue: any;
  conditionalProb: (parentValues: Record<string, any>) => number;
}

// Causal graph structure for behavioral modeling
function buildCausalGraph(profileData: any): Map<string, CausalNode> {
  const graph = new Map<string, CausalNode>();

  // Define causal relationships
  graph.set('stress_level', {
    variable: 'stress_level',
    parents: ['financial_pressure', 'relationship_conflict', 'work_demands'],
    children: ['decision_quality', 'emotional_state', 'health_behavior'],
    currentValue: profileData.stress_level || 50,
    conditionalProb: (p) => {
      const base = 30;
      return Math.min(100, base + (p.financial_pressure || 0) * 0.3 + (p.relationship_conflict || 0) * 0.25 + (p.work_demands || 0) * 0.2);
    }
  });

  graph.set('trust_level', {
    variable: 'trust_level',
    parents: ['past_betrayal', 'positive_interactions', 'time_known'],
    children: ['information_sharing', 'cooperation', 'vulnerability'],
    currentValue: profileData.trust_level || 50,
    conditionalProb: (p) => {
      const base = 50;
      return Math.min(100, Math.max(0, base - (p.past_betrayal || 0) * 0.5 + (p.positive_interactions || 0) * 0.3 + (p.time_known || 0) * 0.1));
    }
  });

  graph.set('cooperation', {
    variable: 'cooperation',
    parents: ['trust_level', 'mutual_benefit', 'relationship_strength'],
    children: ['outcome_success', 'relationship_growth'],
    currentValue: profileData.cooperation || 50,
    conditionalProb: (p) => {
      return Math.min(100, (p.trust_level || 50) * 0.4 + (p.mutual_benefit || 50) * 0.35 + (p.relationship_strength || 50) * 0.25);
    }
  });

  graph.set('decision_quality', {
    variable: 'decision_quality',
    parents: ['stress_level', 'cognitive_load', 'information_quality'],
    children: ['outcome_success', 'regret'],
    currentValue: profileData.decision_quality || 70,
    conditionalProb: (p) => {
      const stressPenalty = (p.stress_level || 50) * 0.3;
      const loadPenalty = (p.cognitive_load || 50) * 0.2;
      const infoBonus = (p.information_quality || 50) * 0.3;
      return Math.min(100, Math.max(0, 80 - stressPenalty - loadPenalty + infoBonus));
    }
  });

  graph.set('relationship_strength', {
    variable: 'relationship_strength',
    parents: ['trust_level', 'interaction_frequency', 'shared_experiences'],
    children: ['cooperation', 'loyalty', 'information_access'],
    currentValue: profileData.relationship_strength || 50,
    conditionalProb: (p) => {
      return Math.min(100, (p.trust_level || 50) * 0.35 + (p.interaction_frequency || 50) * 0.3 + (p.shared_experiences || 50) * 0.35);
    }
  });

  graph.set('loyalty', {
    variable: 'loyalty',
    parents: ['relationship_strength', 'reciprocity_balance', 'shared_values'],
    children: ['betrayal_risk', 'support_reliability'],
    currentValue: profileData.loyalty || 60,
    conditionalProb: (p) => {
      return Math.min(100, (p.relationship_strength || 50) * 0.4 + (p.reciprocity_balance || 50) * 0.3 + (p.shared_values || 50) * 0.3);
    }
  });

  graph.set('betrayal_risk', {
    variable: 'betrayal_risk',
    parents: ['loyalty', 'external_pressure', 'opportunity_cost'],
    children: [],
    currentValue: 100 - (profileData.loyalty || 60),
    conditionalProb: (p) => {
      const loyaltyProtection = (p.loyalty || 60) * 0.5;
      const pressureRisk = (p.external_pressure || 30) * 0.3;
      const opportunityRisk = (p.opportunity_cost || 20) * 0.2;
      return Math.min(100, Math.max(0, 50 - loyaltyProtection + pressureRisk + opportunityRisk));
    }
  });

  return graph;
}

// Apply intervention and propagate effects
function applyIntervention(
  graph: Map<string, CausalNode>,
  intervention: Intervention
): Map<string, number> {
  const effects = new Map<string, number>();
  const node = graph.get(intervention.variable);
  
  if (!node) {
    console.warn(`Variable ${intervention.variable} not found in causal graph`);
    return effects;
  }

  // Calculate new value based on intervention type
  let newValue: number;
  switch (intervention.type) {
    case 'set':
      newValue = intervention.newValue;
      break;
    case 'increase':
      newValue = Math.min(100, (node.currentValue as number) + intervention.newValue);
      break;
    case 'decrease':
      newValue = Math.max(0, (node.currentValue as number) - intervention.newValue);
      break;
    case 'remove':
      newValue = 0;
      break;
    default:
      newValue = intervention.newValue;
  }

  effects.set(intervention.variable, newValue);

  // Propagate to children using topological order with safety counter
  const visited = new Set<string>();
  const queue = [...node.children];
  const MAX_ITERATIONS = 1000;
  let safetyCounter = 0;

  while (queue.length > 0 && safetyCounter < MAX_ITERATIONS) {
    safetyCounter++;
    const childVar = queue.shift();
    if (!childVar || visited.has(childVar)) continue;
    visited.add(childVar);

    const childNode = graph.get(childVar);
    if (!childNode) continue;

    // Build parent values for conditional probability
    const parentValues: Record<string, any> = {};
    for (const parent of childNode.parents) {
      parentValues[parent] = effects.get(parent) ?? graph.get(parent)?.currentValue ?? 50;
    }

    // Calculate new value for child
    const newChildValue = childNode.conditionalProb(parentValues);
    effects.set(childVar, Math.round(newChildValue * 10) / 10);

    // Add grandchildren to queue
    queue.push(...childNode.children);
  }

  if (safetyCounter >= MAX_ITERATIONS) {
    console.warn('[Counterfactual] Loop guard triggered in applyIntervention');
  }

  return effects;
}

// Generate alternative timelines
function generateTimelines(
  graph: Map<string, CausalNode>,
  interventions: Intervention[],
  days: number
): Array<{ day: number; baseline: Record<string, number>; counterfactual: Record<string, number> }> {
  const timelines: Array<{ day: number; baseline: Record<string, number>; counterfactual: Record<string, number> }> = [];
  
  // Baseline values
  const baseline: Record<string, number> = {};
  for (const [key, node] of graph) {
    baseline[key] = node.currentValue as number;
  }

  // Apply all interventions
  let effects = new Map<string, number>();
  for (const intervention of interventions) {
    const newEffects = applyIntervention(graph, intervention);
    for (const [k, v] of newEffects) {
      effects.set(k, v);
    }
  }

  // Generate daily projections
  for (let day = 1; day <= Math.min(days, 90); day++) {
    const dayBaseline: Record<string, number> = {};
    const dayCounterfactual: Record<string, number> = {};

    for (const [key] of graph) {
      // Baseline with natural drift
      const baseValue = baseline[key];
      const drift = (Math.random() - 0.5) * 2; // Small random walk
      dayBaseline[key] = Math.round(Math.max(0, Math.min(100, baseValue + drift * (day / 30))));

      // Counterfactual with intervention effects
      const effectValue = effects.get(key) ?? baseline[key];
      // Effects decay/strengthen over time based on variable type
      const decayRate = ['trust_level', 'relationship_strength'].includes(key) ? 0.02 : 0.05;
      const timeEffect = effectValue + (baseline[key] - effectValue) * (1 - Math.exp(-decayRate * day));
      dayCounterfactual[key] = Math.round(Math.max(0, Math.min(100, timeEffect)));
    }

    timelines.push({
      day,
      baseline: dayBaseline,
      counterfactual: dayCounterfactual
    });
  }

  return timelines;
}

// Calculate scenario comparison
function compareScenarios(
  graph: Map<string, CausalNode>,
  interventions: Intervention[]
): Record<string, { before: number; after: number; change: number; significance: string }> {
  const comparison: Record<string, { before: number; after: number; change: number; significance: string }> = {};

  // Apply interventions
  let effects = new Map<string, number>();
  for (const intervention of interventions) {
    const newEffects = applyIntervention(graph, intervention);
    for (const [k, v] of newEffects) {
      effects.set(k, v);
    }
  }

  // Compare all variables
  for (const [key, node] of graph) {
    const before = node.currentValue as number;
    const after = effects.get(key) ?? before;
    const change = after - before;
    
    let significance = 'minimal';
    if (Math.abs(change) > 20) significance = 'major';
    else if (Math.abs(change) > 10) significance = 'moderate';
    else if (Math.abs(change) > 5) significance = 'minor';

    comparison[key] = {
      before: Math.round(before),
      after: Math.round(after),
      change: Math.round(change),
      significance
    };
  }

  return comparison;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'counterfactual-engine', timestamp: Date.now() }), {
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

    const { action, profileId, interventions, timeHorizonDays } = await req.json() as CounterfactualRequest;

    console.log(`[Counterfactual] Action: ${action} for profile ${profileId}`);

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

    // Build causal graph
    const graph = buildCausalGraph(profile);

    let result: any = {
      profileId,
      profileName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
      interventionCount: interventions.length,
      interventions: interventions.map(i => ({
        variable: i.variable,
        type: i.type,
        originalValue: graph.get(i.variable)?.currentValue,
        targetValue: i.newValue
      }))
    };

    if (action === 'simulate' || action === 'compare') {
      const comparison = compareScenarios(graph, interventions);
      
      result.scenarioComparison = comparison;
      result.significantChanges = Object.entries(comparison)
        .filter(([_, v]) => v.significance !== 'minimal')
        .map(([k, v]) => ({ variable: k, ...v }))
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      
      // Calculate overall impact
      const totalPositiveChange = Object.values(comparison)
        .filter(v => v.change > 0)
        .reduce((a, v) => a + v.change, 0);
      const totalNegativeChange = Object.values(comparison)
        .filter(v => v.change < 0)
        .reduce((a, v) => a + Math.abs(v.change), 0);

      result.impactSummary = {
        netImpact: totalPositiveChange - totalNegativeChange,
        positiveEffects: totalPositiveChange,
        negativeEffects: totalNegativeChange,
        recommendation: totalPositiveChange > totalNegativeChange * 1.5 
          ? 'Favorable intervention' 
          : totalNegativeChange > totalPositiveChange * 1.5
          ? 'Risky intervention'
          : 'Mixed outcomes - proceed with caution'
      };

      // Store scenario
      await supabase.from('counterfactual_scenarios').insert({
        user_id: user.id,
        profile_id: profileId,
        scenario_name: `Intervention: ${interventions.map(i => i.variable).join(', ')}`,
        intervention_type: interventions[0]?.type || 'set',
        modified_variables: interventions.reduce((acc, i) => ({ ...acc, [i.variable]: i.newValue }), {}),
        predicted_outcomes: result.scenarioComparison,
        confidence: 0.7,
        baseline_state: Object.fromEntries([...graph].map(([k, v]) => [k, v.currentValue])),
        causal_justification: `Causal propagation through ${result.significantChanges.length} significant pathways`
      });
    }

    if (action === 'timeline') {
      const days = timeHorizonDays || 30;
      const timelines = generateTimelines(graph, interventions, days);
      
      result.timelines = timelines;
      result.trajectoryAnalysis = {
        convergenceDay: timelines.findIndex(t => {
          const diffs = Object.keys(t.baseline).map(k => Math.abs(t.baseline[k] - t.counterfactual[k]));
          return diffs.every(d => d < 5);
        }) + 1 || null,
        peakDivergenceDay: timelines.reduce((maxDay, t, i) => {
          const currentMax = Object.keys(t.baseline).reduce((max, k) => 
            Math.max(max, Math.abs(t.baseline[k] - t.counterfactual[k])), 0);
          const prevMax = i === 0 ? 0 : Object.keys(timelines[maxDay - 1].baseline).reduce((max, k) => 
            Math.max(max, Math.abs(timelines[maxDay - 1].baseline[k] - timelines[maxDay - 1].counterfactual[k])), 0);
          return currentMax > prevMax ? i + 1 : maxDay;
        }, 1),
        sustainedEffects: Object.keys(timelines[timelines.length - 1]?.counterfactual || {}).filter(k => {
          const lastTimeline = timelines[timelines.length - 1];
          return Math.abs(lastTimeline.baseline[k] - lastTimeline.counterfactual[k]) > 10;
        })
      };
    }

    // Store in ai_analyses for section availability detection
    await supabase.from('ai_analyses').upsert({
      user_id: user.id,
      profile_id: profileId,
      analysis_type: 'counterfactual_reasoning',
      result: result,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    console.log(`[Counterfactual] Complete. ${result.significantChanges?.length || 0} significant changes`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Counterfactual] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
