import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BehavioralState {
  id: string;
  name: string;
  features: Record<string, number>;
}

interface MDPRequest {
  profileId: string;
  historicalBehaviors: {
    state: string;
    action: string;
    nextState: string;
    reward: number;
    timestamp: string;
  }[];
  currentState: string;
  predictionHorizon: number;
  discountFactor?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'mdp-behavior-predictor', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { 
      profileId, 
      historicalBehaviors, 
      currentState,
      predictionHorizon,
      discountFactor = 0.95 
    }: MDPRequest = await req.json();

    // Extract unique states and actions
    const states = new Set<string>();
    const actions = new Set<string>();
    
    historicalBehaviors.forEach(b => {
      states.add(b.state);
      states.add(b.nextState);
      actions.add(b.action);
    });

    const stateList = Array.from(states);
    const actionList = Array.from(actions);

    // Build transition probability matrix P(s'|s,a)
    const transitionCounts: Record<string, Record<string, Record<string, number>>> = {};
    const rewardSums: Record<string, Record<string, number>> = {};
    const rewardCounts: Record<string, Record<string, number>> = {};

    // Initialize
    for (const s of stateList) {
      transitionCounts[s] = {};
      rewardSums[s] = {};
      rewardCounts[s] = {};
      for (const a of actionList) {
        transitionCounts[s][a] = {};
        rewardSums[s][a] = 0;
        rewardCounts[s][a] = 0;
        for (const sp of stateList) {
          transitionCounts[s][a][sp] = 0;
        }
      }
    }

    // Count transitions
    for (const b of historicalBehaviors) {
      if (transitionCounts[b.state]?.[b.action]) {
        transitionCounts[b.state][b.action][b.nextState]++;
        rewardSums[b.state][b.action] += b.reward;
        rewardCounts[b.state][b.action]++;
      }
    }

    // Calculate transition probabilities and average rewards
    const transitionProbs: Record<string, Record<string, Record<string, number>>> = {};
    const avgRewards: Record<string, Record<string, number>> = {};

    for (const s of stateList) {
      transitionProbs[s] = {};
      avgRewards[s] = {};
      for (const a of actionList) {
        transitionProbs[s][a] = {};
        const total = Object.values(transitionCounts[s][a]).reduce((sum, c) => sum + c, 0);
        for (const sp of stateList) {
          transitionProbs[s][a][sp] = total > 0 ? transitionCounts[s][a][sp] / total : 1 / stateList.length;
        }
        avgRewards[s][a] = rewardCounts[s][a] > 0 ? rewardSums[s][a] / rewardCounts[s][a] : 0;
      }
    }

    // Value Iteration to find optimal policy
    let values: Record<string, number> = {};
    for (const s of stateList) {
      values[s] = 0;
    }

    const maxIterations = 100;
    const tolerance = 0.001;

    for (let iter = 0; iter < maxIterations; iter++) {
      const newValues: Record<string, number> = {};
      let maxDelta = 0;

      for (const s of stateList) {
        let maxValue = -Infinity;
        for (const a of actionList) {
          let value = avgRewards[s][a];
          for (const sp of stateList) {
            value += discountFactor * transitionProbs[s][a][sp] * values[sp];
          }
          maxValue = Math.max(maxValue, value);
        }
        newValues[s] = maxValue;
        maxDelta = Math.max(maxDelta, Math.abs(newValues[s] - values[s]));
      }

      values = newValues;
      if (maxDelta < tolerance) break;
    }

    // Extract optimal policy
    const optimalPolicy: Record<string, { action: string; value: number }> = {};
    for (const s of stateList) {
      let bestAction = actionList[0];
      let bestValue = -Infinity;

      for (const a of actionList) {
        let value = avgRewards[s][a];
        for (const sp of stateList) {
          value += discountFactor * transitionProbs[s][a][sp] * values[sp];
        }
        if (value > bestValue) {
          bestValue = value;
          bestAction = a;
        }
      }
      optimalPolicy[s] = { action: bestAction, value: bestValue };
    }

    // Predict trajectory from current state
    const predictedTrajectory: { state: string; action: string; probability: number }[] = [];
    let currentPredState = currentState;

    for (let t = 0; t < predictionHorizon; t++) {
      const policy = optimalPolicy[currentPredState];
      if (!policy) break;

      // Find most likely next state
      let maxProb = 0;
      let nextState = currentPredState;
      for (const sp of stateList) {
        const prob = transitionProbs[currentPredState]?.[policy.action]?.[sp] || 0;
        if (prob > maxProb) {
          maxProb = prob;
          nextState = sp;
        }
      }

      predictedTrajectory.push({
        state: currentPredState,
        action: policy.action,
        probability: maxProb,
      });

      currentPredState = nextState;
    }

    // Calculate state transition probability matrix for predictions
    const stateTransitionMatrix: Record<string, Record<string, number>> = {};
    for (const s of stateList) {
      stateTransitionMatrix[s] = {};
      const policy = optimalPolicy[s];
      for (const sp of stateList) {
        stateTransitionMatrix[s][sp] = transitionProbs[s]?.[policy?.action]?.[sp] || 0;
      }
    }

    // Calculate intervention opportunities (states where action can shift trajectory)
    const interventionOpportunities = stateList
      .filter(s => {
        const actionValues = actionList.map(a => {
          let value = avgRewards[s][a];
          for (const sp of stateList) {
            value += discountFactor * transitionProbs[s][a][sp] * values[sp];
          }
          return value;
        });
        const maxVal = Math.max(...actionValues);
        const minVal = Math.min(...actionValues);
        return (maxVal - minVal) > 1; // Significant difference means intervention matters
      })
      .map(s => ({
        state: s,
        optimal_action: optimalPolicy[s].action,
        impact_score: optimalPolicy[s].value,
      }));

    return new Response(
      JSON.stringify({
        profile_id: profileId,
        mdp_model: {
          states: stateList,
          actions: actionList,
          transition_probabilities: transitionProbs,
          rewards: avgRewards,
          discount_factor: discountFactor,
        },
        optimal_policy: optimalPolicy,
        predicted_trajectory: predictedTrajectory,
        state_values: values,
        intervention_opportunities: interventionOpportunities,
        model_confidence: Math.min(1, historicalBehaviors.length / 50),
        analyzed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("MDP Behavior Predictor error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
