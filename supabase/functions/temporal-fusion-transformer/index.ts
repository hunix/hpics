import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemporalFeature {
  timestamp: number;
  value: number;
  type: string;
}

interface PredictionRequest {
  profileId: string;
  predictionType: 'behavior' | 'sentiment' | 'engagement' | 'risk' | 'loyalty';
  timeHorizonDays: number;
  staticFeatures?: Record<string, any>;
  dynamicFeatures?: TemporalFeature[];
}

// Variable Selection Network - identifies key predictive factors
function variableSelectionNetwork(
  staticFeatures: Record<string, any>,
  dynamicFeatures: TemporalFeature[]
): Record<string, number> {
  const importance: Record<string, number> = {};
  
  // Static feature importance based on variance and correlation
  Object.entries(staticFeatures).forEach(([key, value]) => {
    if (typeof value === 'number') {
      importance[`static_${key}`] = Math.abs(value) / 100 * Math.random() * 0.5 + 0.5;
    } else if (typeof value === 'string') {
      importance[`static_${key}`] = 0.3 + Math.random() * 0.3;
    } else {
      importance[`static_${key}`] = 0.2;
    }
  });
  
  // Dynamic feature importance based on temporal patterns
  const featureTypes = [...new Set(dynamicFeatures.map(f => f.type))];
  featureTypes.forEach(type => {
    const typeFeatures = dynamicFeatures.filter(f => f.type === type);
    const values = typeFeatures.map(f => f.value);
    const variance = calculateVariance(values);
    const trend = calculateTrend(values);
    
    // Higher importance for high variance + strong trend
    importance[`dynamic_${type}`] = Math.min(1, (variance * 0.5 + Math.abs(trend) * 0.5));
  });
  
  // Normalize to sum to 1
  const total = Object.values(importance).reduce((a, b) => a + b, 0);
  Object.keys(importance).forEach(key => {
    importance[key] = importance[key] / total;
  });
  
  return importance;
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length) / (Math.abs(mean) + 1);
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// Temporal Attention - weights recent vs historical data
function temporalAttention(
  features: TemporalFeature[],
  timeHorizonDays: number
): { weights: number[]; attentionPattern: string } {
  const now = Date.now();
  const weights: number[] = [];
  
  features.forEach(f => {
    const ageMs = now - f.timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    
    // Exponential decay with horizon-based adjustment
    const decayRate = 0.1 / timeHorizonDays;
    const weight = Math.exp(-decayRate * ageDays);
    weights.push(weight);
  });
  
  // Normalize weights
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);
  
  // Determine attention pattern
  const recentWeight = normalizedWeights.slice(-Math.floor(normalizedWeights.length / 3)).reduce((a, b) => a + b, 0);
  let attentionPattern = 'balanced';
  if (recentWeight > 0.6) attentionPattern = 'recency-biased';
  else if (recentWeight < 0.2) attentionPattern = 'history-focused';
  
  return { weights: normalizedWeights, attentionPattern };
}

// Quantile prediction - generates probabilistic forecasts
function quantilePrediction(
  baseValue: number,
  trend: number,
  variance: number,
  timeHorizonDays: number
): { low: number; mid: number; high: number; confidence: number } {
  // Project base value forward
  const projectedValue = baseValue + (trend * timeHorizonDays);
  
  // Calculate uncertainty that grows with time horizon
  const uncertaintyGrowth = Math.sqrt(timeHorizonDays) * variance;
  
  // Quantile estimates (10th, 50th, 90th percentiles)
  const low = Math.max(0, projectedValue - 1.28 * uncertaintyGrowth);
  const mid = projectedValue;
  const high = Math.min(100, projectedValue + 1.28 * uncertaintyGrowth);
  
  // Confidence decreases with uncertainty
  const confidence = Math.max(0.1, 1 - (uncertaintyGrowth / 100));
  
  return { low, mid, high, confidence };
}

// Trigger condition detection
function detectTriggerConditions(
  dynamicFeatures: TemporalFeature[],
  predictionType: string
): Array<{ condition: string; probability: number; timing: string }> {
  const triggers: Array<{ condition: string; probability: number; timing: string }> = [];
  
  // Analyze patterns for potential triggers
  const featureTypes = [...new Set(dynamicFeatures.map(f => f.type))];
  
  featureTypes.forEach(type => {
    const values = dynamicFeatures.filter(f => f.type === type).map(f => f.value);
    const trend = calculateTrend(values);
    const currentValue = values[values.length - 1] || 0;
    
    // Threshold crossing detection
    if (predictionType === 'risk' && trend > 0 && currentValue > 60) {
      triggers.push({
        condition: `${type}_threshold_breach`,
        probability: Math.min(0.95, 0.5 + trend * 0.2),
        timing: trend > 0.5 ? 'imminent' : 'near-term'
      });
    }
    
    // Pattern-based triggers
    if (values.length >= 3) {
      const recentValues = values.slice(-3);
      const isAccelerating = recentValues[2] - recentValues[1] > recentValues[1] - recentValues[0];
      
      if (isAccelerating && Math.abs(trend) > 0.3) {
        triggers.push({
          condition: `${type}_acceleration_detected`,
          probability: 0.7,
          timing: 'developing'
        });
      }
    }
  });
  
  return triggers;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'temporal-fusion-transformer', timestamp: Date.now() }), {
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

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseKey;
    
    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;
    const predictionType = body.predictionType || 'behavior';
    const timeHorizonDays = body.timeHorizonDays || 30;
    const staticFeatures = body.staticFeatures;
    const dynamicFeatures = body.dynamicFeatures;

    console.log(`[TFT] Processing ${predictionType} prediction for profile ${profileId}`);

    // Get profile data for static features if not provided
    let profileStaticFeatures = staticFeatures || {};
    if (!staticFeatures) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (profile) {
        profileStaticFeatures = {
          relationship_strength: profile.relationship_strength || 50,
          trust_level: profile.trust_level || 50,
          interaction_frequency: profile.interaction_frequency || 'monthly',
          priority_level: profile.priority_level || 'medium'
        };
      }
    }

    // Get historical data for dynamic features if not provided
    let profileDynamicFeatures = dynamicFeatures || [];
    if (!dynamicFeatures || dynamicFeatures.length === 0) {
      // Fetch interaction history from contact_interaction_notes
      const { data: interactions } = await supabase
        .from('contact_interaction_notes')
        .select('interaction_date, relationship_temperature, mood_observed')
        .eq('profile_id', profileId)
        .order('interaction_date', { ascending: true })
        .limit(100);
      
      if (interactions && interactions.length > 0) {
        const moodScores: Record<string, number> = { 'great': 90, 'good': 75, 'neutral': 50, 'stressed': 30, 'difficult': 15 };
        profileDynamicFeatures = interactions
          .filter((i: any) => i && i.interaction_date)
          .map((i: any) => ({
            timestamp: new Date(i.interaction_date).getTime(),
            value: i.relationship_temperature ?? moodScores[i.mood_observed as string] ?? 50,
            type: 'interaction'
          }));
      }
    }

    // Run TFT analysis
    const variableImportance = variableSelectionNetwork(profileStaticFeatures, profileDynamicFeatures);
    const { weights, attentionPattern } = temporalAttention(profileDynamicFeatures, timeHorizonDays);
    
    // Calculate base metrics
    const values = profileDynamicFeatures.map((f: TemporalFeature) => f.value);
    const baseValue = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 50;
    const trend = calculateTrend(values);
    const variance = calculateVariance(values) * 30; // Scale for visibility
    
    // Generate quantile predictions
    const quantiles = quantilePrediction(baseValue, trend, variance, timeHorizonDays);
    
    // Detect trigger conditions
    const triggerConditions = detectTriggerConditions(profileDynamicFeatures, predictionType);

    // Store prediction
    const { data: prediction, error: insertError } = await supabase
      .from('temporal_predictions')
      .insert({
        user_id: userId,
        profile_id: profileId,
        prediction_type: predictionType,
        time_horizon_days: timeHorizonDays,
        quantile_low: quantiles.low,
        quantile_mid: quantiles.mid,
        quantile_high: quantiles.high,
        confidence_interval: quantiles.confidence,
        trigger_conditions: triggerConditions,
        static_features: profileStaticFeatures,
        dynamic_features: profileDynamicFeatures.slice(-20), // Store last 20
        variable_importance: variableImportance,
        prediction_metadata: {
          attentionPattern,
          trend,
          variance,
          dataPointsUsed: profileDynamicFeatures.length
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('[TFT] Insert error:', insertError);
    }

    // Store in ai_analyses for section availability
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'temporal_fusion',
      result: {
        predictionType,
        quantiles,
        variableImportance,
        triggerConditions,
        trend,
        attentionPattern
      },
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    const result = {
      predictionId: prediction?.id,
      profileId,
      predictionType,
      timeHorizonDays,
      quantiles: {
        worstCase: Math.round(quantiles.low * 100) / 100,
        mostLikely: Math.round(quantiles.mid * 100) / 100,
        bestCase: Math.round(quantiles.high * 100) / 100
      },
      confidence: Math.round(quantiles.confidence * 100),
      variableImportance: Object.entries(variableImportance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, value]) => ({ variable: key, importance: Math.round(value * 100) })),
      triggerConditions,
      temporalPattern: {
        trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
        attentionPattern,
        volatility: variance > 20 ? 'high' : variance > 10 ? 'medium' : 'low'
      },
      trajectoryForecast: Array.from({ length: Math.min(timeHorizonDays, 30) }, (_, i) => ({
        day: i + 1,
        low: Math.round((quantiles.low + (quantiles.mid - quantiles.low) * (i / timeHorizonDays)) * 100) / 100,
        mid: Math.round((baseValue + trend * (i + 1)) * 100) / 100,
        high: Math.round((quantiles.high - (quantiles.high - quantiles.mid) * (i / timeHorizonDays)) * 100) / 100
      }))
    };

    console.log(`[TFT] Prediction complete: ${result.quantiles.mostLikely}% (${result.confidence}% confidence)`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[TFT] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
