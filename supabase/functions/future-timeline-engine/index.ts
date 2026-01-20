import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictionRequest {
  profileId: string;
  horizonMonths?: number;
  action: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, horizonMonths = 12, action } = await req.json() as PredictionRequest;

    if (action === 'generate_predictions') {
      // Fetch historical data for the profile
      const [
        { data: interactions },
        { data: observations },
        { data: communications },
        { data: events },
      ] = await Promise.all([
        supabaseClient.from('contact_interaction_notes').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
        supabaseClient.from('contact_observations').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50),
        supabaseClient.from('communications').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
        supabaseClient.from('events').select('*').eq('profile_id', profileId).order('event_date', { ascending: false }).limit(50),
      ]);

      // Monte Carlo simulation for future predictions
      const predictions = [];
      const predictionTypes = [
        { type: 'career_change', baseProb: 0.15, volatility: 0.3 },
        { type: 'relationship_shift', baseProb: 0.25, volatility: 0.4 },
        { type: 'financial_decision', baseProb: 0.2, volatility: 0.35 },
        { type: 'location_change', baseProb: 0.1, volatility: 0.25 },
        { type: 'health_event', baseProb: 0.12, volatility: 0.2 },
        { type: 'major_purchase', baseProb: 0.18, volatility: 0.3 },
        { type: 'social_expansion', baseProb: 0.22, volatility: 0.35 },
        { type: 'conflict_resolution', baseProb: 0.15, volatility: 0.4 },
      ];

      // Analyze patterns in historical data
      const interactionFrequency = (interactions?.length || 0) / 30; // per month
      const observationDensity = (observations?.length || 0) / 30;
      const communicationVolume = (communications?.length || 0) / 30;

      // Generate predictions using Monte Carlo
      const numSimulations = 1000;
      
      for (const predType of predictionTypes) {
        let successCount = 0;
        const outcomes: number[] = [];

        for (let i = 0; i < numSimulations; i++) {
          // Random walk with drift based on historical patterns
          const drift = (interactionFrequency * 0.1) + (communicationVolume * 0.05);
          const randomFactor = Math.random() * predType.volatility * 2 - predType.volatility;
          const probability = Math.min(1, Math.max(0, predType.baseProb + drift + randomFactor));
          
          outcomes.push(probability);
          if (Math.random() < probability) successCount++;
        }

        const avgProbability = successCount / numSimulations;
        const sortedOutcomes = outcomes.sort((a, b) => a - b);
        const lowConfidence = sortedOutcomes[Math.floor(numSimulations * 0.1)];
        const highConfidence = sortedOutcomes[Math.floor(numSimulations * 0.9)];

        if (avgProbability > 0.3) { // Only include significant predictions
          const startDate = new Date();
          const endDate = new Date();
          startDate.setMonth(startDate.getMonth() + Math.floor(horizonMonths * 0.25));
          endDate.setMonth(endDate.getMonth() + horizonMonths);

          predictions.push({
            user_id: user.id,
            profile_id: profileId,
            prediction_type: predType.type,
            predicted_event: `Predicted ${predType.type.replace('_', ' ')} event`,
            probability_score: avgProbability,
            confidence_interval: { low: lowConfidence, high: highConfidence },
            predicted_date_range: { 
              start: startDate.toISOString(), 
              end: endDate.toISOString() 
            },
            supporting_evidence: [
              { source: 'interaction_analysis', weight: 0.3, detail: `${interactions?.length || 0} interactions analyzed` },
              { source: 'communication_patterns', weight: 0.3, detail: `${communications?.length || 0} communications analyzed` },
              { source: 'behavioral_trends', weight: 0.4, detail: `${observations?.length || 0} observations analyzed` },
            ],
            influencing_factors: [
              { factor: 'engagement_level', impact: interactionFrequency, direction: interactionFrequency > 2 ? 'positive' : 'neutral' },
              { factor: 'communication_density', impact: communicationVolume, direction: communicationVolume > 5 ? 'positive' : 'neutral' },
            ],
            intervention_opportunities: generateInterventions(predType.type, avgProbability),
            status: 'active',
          });
        }
      }

      // Insert predictions
      if (predictions.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('future_predictions')
          .insert(predictions);

        if (insertError) throw insertError;
      }

      // Generate decision windows
      const decisionWindows = generateDecisionWindows(predictions, profileId, user.id);
      if (decisionWindows.length > 0) {
        const { error: windowError } = await supabaseClient
          .from('decision_windows')
          .insert(decisionWindows);

        if (windowError) throw windowError;
      }

      return new Response(JSON.stringify({ 
        success: true,
        predictionsGenerated: predictions.length,
        decisionWindowsCreated: decisionWindows.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Future timeline engine error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateInterventions(predictionType: string, probability: number): Array<{ action: string; timing: string; expectedImpact: number }> {
  const interventions: Record<string, Array<{ action: string; timing: string; expectedImpact: number }>> = {
    career_change: [
      { action: 'Initiate mentorship conversation', timing: 'immediate', expectedImpact: 0.3 },
      { action: 'Offer professional development opportunity', timing: '2_weeks', expectedImpact: 0.25 },
      { action: 'Schedule strategic career discussion', timing: '1_month', expectedImpact: 0.4 },
    ],
    relationship_shift: [
      { action: 'Deepen emotional connection', timing: 'immediate', expectedImpact: 0.35 },
      { action: 'Address potential concerns proactively', timing: '1_week', expectedImpact: 0.3 },
      { action: 'Plan meaningful shared experience', timing: '2_weeks', expectedImpact: 0.4 },
    ],
    financial_decision: [
      { action: 'Position as trusted advisor', timing: 'immediate', expectedImpact: 0.4 },
      { action: 'Share relevant financial insights', timing: '1_week', expectedImpact: 0.25 },
      { action: 'Offer strategic partnership', timing: '1_month', expectedImpact: 0.35 },
    ],
    location_change: [
      { action: 'Strengthen local ties', timing: 'immediate', expectedImpact: 0.3 },
      { action: 'Discuss future plans casually', timing: '1_week', expectedImpact: 0.25 },
      { action: 'Offer compelling local opportunities', timing: '2_weeks', expectedImpact: 0.4 },
    ],
    health_event: [
      { action: 'Express genuine concern and support', timing: 'immediate', expectedImpact: 0.5 },
      { action: 'Offer practical assistance', timing: '1_week', expectedImpact: 0.3 },
    ],
    major_purchase: [
      { action: 'Position as informed resource', timing: 'immediate', expectedImpact: 0.35 },
      { action: 'Share relevant recommendations', timing: '1_week', expectedImpact: 0.3 },
    ],
    social_expansion: [
      { action: 'Facilitate key introductions', timing: 'immediate', expectedImpact: 0.45 },
      { action: 'Invite to exclusive events', timing: '2_weeks', expectedImpact: 0.35 },
    ],
    conflict_resolution: [
      { action: 'Offer mediation support', timing: 'immediate', expectedImpact: 0.4 },
      { action: 'Provide strategic advice', timing: '1_week', expectedImpact: 0.3 },
    ],
  };

  return interventions[predictionType] || [];
}

function generateDecisionWindows(predictions: any[], profileId: string, userId: string): any[] {
  const windows: any[] = [];

  for (const pred of predictions) {
    if (pred.probability_score > 0.5) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 21);

      windows.push({
        user_id: userId,
        profile_id: profileId,
        window_type: pred.prediction_type,
        window_name: `Intervention window for ${pred.prediction_type.replace('_', ' ')}`,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        urgency_score: pred.probability_score,
        influence_potential: pred.probability_score * 0.8,
        recommended_actions: pred.intervention_opportunities.map((i: any, idx: number) => ({
          action: i.action,
          priority: idx + 1,
          reasoning: `Expected impact: ${(i.expectedImpact * 100).toFixed(0)}%`,
        })),
        context_factors: {
          prediction_source: pred.prediction_type,
          confidence: pred.probability_score,
        },
        status: 'upcoming',
      });
    }
  }

  return windows;
}
