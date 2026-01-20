import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'behavioral-baseline-monitor', timestamp: Date.now() }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization');
    
    let userId: string;
    if (authHeader?.includes(supabaseKey)) {
      userId = body.userId || body.user_id;
    } else {
      const token = authHeader?.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const profileId = body.profileId || body.profile_id;
    const { action, behavioralData } = body;

    // Default analysis mode for intelligence session calls
    if (!action && profileId) {
      // Fetch or establish baseline
      const { data: existingBaseline } = await supabase
        .from('behavioral_baselines')
        .select('*')
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .single();

      if (!existingBaseline) {
        // Establish new baseline
        const { data: interactions } = await supabase
          .from('contact_interaction_notes')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('interaction_date', { ascending: false })
          .limit(100);

        const baseline = calculateBaseline(interactions || []);

        const { data: stored } = await supabase
          .from('behavioral_baselines')
          .upsert({
            user_id: userId,
            profile_id: profileId,
            baseline_type: 'communication',
            baseline_metrics: baseline.metrics,
            deviation_thresholds: baseline.thresholds,
            sample_size: interactions?.length || 0,
            confidence_score: baseline.confidence,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,profile_id,baseline_type' })
          .select()
          .single();

        // Also persist to ai_analyses for section availability detection
        await supabase.from('ai_analyses').upsert({
          user_id: userId,
          profile_id: profileId,
          analysis_type: 'behavioral_baseline',
          result: { baseline: stored, metrics: baseline.metrics },
          generated_at: new Date().toISOString()
        }, { onConflict: 'profile_id,analysis_type' });

        return new Response(JSON.stringify({
          success: true,
          baseline: stored,
          metrics: baseline.metrics,
          profileId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Also persist existing baseline to ai_analyses
      await supabase.from('ai_analyses').upsert({
        user_id: userId,
        profile_id: profileId,
        analysis_type: 'behavioral_baseline',
        result: { baseline: existingBaseline },
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

      return new Response(JSON.stringify({
        success: true,
        baseline: existingBaseline,
        profileId
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    switch (action) {
      case 'establish_baseline': {
        // Fetch historical interaction data
        const { data: interactions } = await supabase
          .from('contact_interaction_notes')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('interaction_date', { ascending: false })
          .limit(100);

        const baseline = calculateBaseline(interactions || []);

        // Store baseline
        const { data: stored } = await supabase
          .from('behavioral_baselines')
          .upsert({
            user_id: userId,
            profile_id: profileId,
            baseline_type: 'communication',
            baseline_metrics: baseline.metrics,
            deviation_thresholds: baseline.thresholds,
            sample_size: interactions?.length || 0,
            confidence_score: baseline.confidence,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,profile_id,baseline_type' })
          .select()
          .single();

        return new Response(JSON.stringify({
          success: true,
          baseline: stored,
          metrics: baseline.metrics
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'detect_anomalies': {
        // Fetch existing baseline
        const { data: baseline } = await supabase
          .from('behavioral_baselines')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .single();

        if (!baseline) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No baseline established',
            recommendation: 'Establish baseline first with action: establish_baseline'
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const anomalies = detectAnomalies(behavioralData, baseline);

        // Update anomaly count
        if (anomalies.length > 0) {
          await supabase
            .from('behavioral_baselines')
            .update({
              anomaly_count: (baseline.anomaly_count || 0) + anomalies.length,
              last_anomaly_at: new Date().toISOString()
            })
            .eq('id', baseline.id);
        }

        return new Response(JSON.stringify({
          success: true,
          anomalies,
          deviationScore: calculateDeviationScore(anomalies),
          riskAssessment: assessRisk(anomalies)
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_baselines': {
        const { data: baselines } = await supabase
          .from('behavioral_baselines')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        return new Response(JSON.stringify({
          success: true,
          baselines
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('Behavioral baseline error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Operation failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function calculateBaseline(interactions: any[]): any {
  if (interactions.length === 0) {
    return {
      metrics: {},
      thresholds: {},
      confidence: 0
    };
  }

  // Calculate communication frequency
  const dates = interactions.map(i => new Date(i.interaction_date || i.created_at));
  const daysDiff = dates.length > 1 
    ? (dates[0].getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24)
    : 30;
  
  const avgFrequency = interactions.length / Math.max(daysDiff, 1);

  // Analyze interaction types
  const typeCounts: Record<string, number> = {};
  interactions.forEach(i => {
    const type = i.interaction_type || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  // Calculate sentiment distribution (if available)
  const sentiments = interactions
    .filter(i => i.sentiment_score !== null)
    .map(i => i.sentiment_score);
  
  const avgSentiment = sentiments.length > 0 
    ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
    : 0;
  const sentimentStdDev = calculateStdDev(sentiments);

  // Response time patterns (if available)
  const responseTimes = interactions
    .filter(i => i.response_time_hours)
    .map(i => i.response_time_hours);
  
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null;

  const metrics = {
    communicationFrequency: avgFrequency,
    interactionTypes: typeCounts,
    averageSentiment: avgSentiment,
    sentimentVariance: sentimentStdDev,
    averageResponseTime: avgResponseTime,
    totalInteractions: interactions.length
  };

  const thresholds = {
    frequencyDeviation: avgFrequency * 0.5,
    sentimentDeviation: Math.max(sentimentStdDev * 2, 0.3),
    responseTimeDeviation: avgResponseTime ? avgResponseTime * 2 : null
  };

  const confidence = Math.min(1, interactions.length / 50);

  return { metrics, thresholds, confidence };
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

function detectAnomalies(currentData: any, baseline: any): any[] {
  const anomalies: any[] = [];
  const metrics = baseline.baseline_metrics || {};
  const thresholds = baseline.deviation_thresholds || {};

  if (!currentData) return anomalies;

  // Check frequency anomaly
  if (currentData.frequency !== undefined && metrics.communicationFrequency) {
    const frequencyDiff = Math.abs(currentData.frequency - metrics.communicationFrequency);
    if (frequencyDiff > (thresholds.frequencyDeviation || metrics.communicationFrequency * 0.5)) {
      anomalies.push({
        type: 'frequency_deviation',
        expected: metrics.communicationFrequency,
        actual: currentData.frequency,
        deviation: frequencyDiff,
        severity: frequencyDiff > metrics.communicationFrequency ? 'high' : 'medium'
      });
    }
  }

  // Check sentiment anomaly
  if (currentData.sentiment !== undefined && metrics.averageSentiment !== undefined) {
    const sentimentDiff = Math.abs(currentData.sentiment - metrics.averageSentiment);
    if (sentimentDiff > (thresholds.sentimentDeviation || 0.3)) {
      anomalies.push({
        type: 'sentiment_shift',
        expected: metrics.averageSentiment,
        actual: currentData.sentiment,
        deviation: sentimentDiff,
        severity: sentimentDiff > 0.5 ? 'high' : 'medium'
      });
    }
  }

  // Check response time anomaly
  if (currentData.responseTime !== undefined && metrics.averageResponseTime) {
    const rtDiff = Math.abs(currentData.responseTime - metrics.averageResponseTime);
    if (rtDiff > (thresholds.responseTimeDeviation || metrics.averageResponseTime * 2)) {
      anomalies.push({
        type: 'response_time_change',
        expected: metrics.averageResponseTime,
        actual: currentData.responseTime,
        deviation: rtDiff,
        severity: currentData.responseTime > metrics.averageResponseTime * 3 ? 'high' : 'low'
      });
    }
  }

  return anomalies;
}

function calculateDeviationScore(anomalies: any[]): number {
  if (anomalies.length === 0) return 0;
  
  let score = 0;
  anomalies.forEach(a => {
    switch (a.severity) {
      case 'high': score += 30; break;
      case 'medium': score += 20; break;
      case 'low': score += 10; break;
    }
  });
  
  return Math.min(100, score);
}

function assessRisk(anomalies: any[]): any {
  const highSeverity = anomalies.filter(a => a.severity === 'high').length;
  const deviationScore = calculateDeviationScore(anomalies);
  
  let riskLevel = 'low';
  if (highSeverity >= 2 || deviationScore >= 60) riskLevel = 'high';
  else if (highSeverity >= 1 || deviationScore >= 30) riskLevel = 'medium';

  return {
    level: riskLevel,
    factors: anomalies.map(a => a.type),
    recommendations: generateRecommendations(anomalies)
  };
}

function generateRecommendations(anomalies: any[]): string[] {
  const recommendations: string[] = [];
  
  anomalies.forEach(a => {
    switch (a.type) {
      case 'frequency_deviation':
        recommendations.push('Investigate changes in communication patterns');
        break;
      case 'sentiment_shift':
        recommendations.push('Review recent interactions for relationship changes');
        break;
      case 'response_time_change':
        recommendations.push('Consider external factors affecting responsiveness');
        break;
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring for pattern changes');
  }

  return [...new Set(recommendations)];
}
