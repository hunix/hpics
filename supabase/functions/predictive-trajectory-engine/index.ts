import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrajectoryRequest {
  profileId: string;
  userId: string;
  forecastHorizon?: '7d' | '30d' | '90d' | '1y';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { profileId, userId, forecastHorizon = '30d' } = await req.json() as TrajectoryRequest;

    if (!profileId || !userId) {
      return new Response(JSON.stringify({ error: 'profileId and userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gather historical data for trajectory modeling
    const [
      { data: profile },
      { data: interactionHistory },
      { data: sentimentTrend },
      { data: behavioralPredictions },
      { data: relationshipScore },
      { data: churnRisks },
      { data: anomalies },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_interaction_notes')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('messages')
        .select('sentiment_score, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('behavioral_predictions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('relationship_scores')
        .select('*')
        .eq('profile_id', profileId)
        .order('calculated_at', { ascending: false })
        .limit(30),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'churn_prediction')
        .order('generated_at', { ascending: false })
        .limit(5),
      supabase.from('behavioral_anomalies')
        .select('*')
        .eq('profile_id', profileId)
        .order('detected_at', { ascending: false })
        .limit(20),
    ]);

    // Build trajectory context
    const trajectoryData = {
      profile: profile || {},
      interactionFrequency: calculateFrequencyTrend(interactionHistory || []),
      sentimentTrajectory: calculateSentimentTrajectory(sentimentTrend || []),
      behavioralBaseline: extractBehavioralBaseline(behavioralPredictions || []),
      relationshipHealthTrend: (relationshipScore || []).map(r => ({
        score: r.overall_score,
        components: r.score_components,
        date: r.calculated_at,
      })),
      existingChurnRisks: (churnRisks || []).map(c => c.result),
      recentAnomalies: (anomalies || []).map(a => ({
        type: a.anomaly_type,
        severity: a.severity,
        date: a.detected_at,
        resolved: a.is_resolved,
      })),
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { 
            role: 'system', 
            content: `You are an advanced predictive analytics engine for human relationship trajectory modeling. Your task is to:

1. **RELATIONSHIP TRAJECTORY FORECAST**
   - Current relationship phase identification
   - Trajectory direction (strengthening/stable/declining)
   - Critical inflection points
   - Probability curves for different outcomes

2. **BEHAVIORAL PREDICTIONS**
   - Next likely behavioral patterns
   - Response predictions to various stimuli
   - Decision-making forecasts
   - Stress response predictions

3. **CHURN/DISENGAGEMENT RISK**
   - Churn probability with confidence intervals
   - Risk factors ranked by impact
   - Early warning signals
   - Time-to-churn estimate

4. **INTERVENTION OPTIMIZATION**
   - Optimal intervention timing windows
   - Recommended engagement strategies
   - Counter-deterioration tactics
   - Relationship repair probability

5. **SCENARIO MODELING**
   - Best case trajectory
   - Most likely trajectory  
   - Worst case trajectory
   - Black swan event triggers

Return comprehensive JSON with:
- trajectoryForecast: object with short/medium/long term predictions
- churnRisk: object with probability, timeframe, factors
- interventionWindows: array of optimal timing windows
- scenarioModeling: best/likely/worst case objects
- confidenceMetrics: data quality and prediction reliability
- actionableInsights: prioritized recommendations`
          },
          { 
            role: 'user', 
            content: `Generate ${forecastHorizon} trajectory forecast for this relationship:

SUBJECT PROFILE:
${JSON.stringify(trajectoryData.profile, null, 2)}

INTERACTION FREQUENCY TREND:
${JSON.stringify(trajectoryData.interactionFrequency, null, 2)}

SENTIMENT TRAJECTORY (last 200 data points):
${JSON.stringify(trajectoryData.sentimentTrajectory, null, 2)}

BEHAVIORAL BASELINE:
${JSON.stringify(trajectoryData.behavioralBaseline, null, 2)}

RELATIONSHIP HEALTH HISTORY:
${JSON.stringify(trajectoryData.relationshipHealthTrend, null, 2)}

EXISTING CHURN RISK ASSESSMENTS:
${JSON.stringify(trajectoryData.existingChurnRisks, null, 2)}

RECENT BEHAVIORAL ANOMALIES:
${JSON.stringify(trajectoryData.recentAnomalies, null, 2)}

Provide comprehensive trajectory analysis with actionable predictions.`
          }
        ],
        temperature: 0.3,
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisContent = aiResponse.choices?.[0]?.message?.content || '';

    let analysisResult;
    try {
      const jsonMatch = analysisContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisContent;
      analysisResult = JSON.parse(jsonStr);
    } catch {
      analysisResult = { rawAnalysis: analysisContent };
    }

    // Store prediction
    await supabase.from('behavioral_predictions').insert({
      profile_id: profileId,
      user_id: userId,
      prediction_type: 'trajectory_forecast',
      prediction_value: analysisResult,
      confidence_score: analysisResult.confidenceMetrics?.overall || 0.7,
      valid_from: new Date().toISOString(),
      valid_until: calculateValidUntil(forecastHorizon),
    });

    const inputTokens = aiResponse.usage?.prompt_tokens || 0;
    const outputTokens = aiResponse.usage?.completion_tokens || 0;
    const costCents = Math.round((inputTokens * 0.00125 + outputTokens * 0.005) * 100);

    return new Response(JSON.stringify({
      success: true,
      forecastHorizon,
      analysis: analysisResult,
      dataQuality: {
        interactionDataPoints: trajectoryData.interactionFrequency.dataPoints || 0,
        sentimentDataPoints: trajectoryData.sentimentTrajectory.dataPoints || 0,
        anomalyCount: trajectoryData.recentAnomalies.length,
      },
      cost: costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Predictive trajectory engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateFrequencyTrend(interactions: any[]) {
  if (!interactions.length) return { trend: 'unknown', dataPoints: 0 };
  
  const recent = interactions.slice(0, 10);
  const older = interactions.slice(10, 20);
  
  const recentFreq = recent.length / 10;
  const olderFreq = older.length / 10;
  
  return {
    trend: recentFreq > olderFreq * 1.2 ? 'increasing' : 
           recentFreq < olderFreq * 0.8 ? 'decreasing' : 'stable',
    recentAvgPerPeriod: recentFreq,
    previousAvgPerPeriod: olderFreq,
    dataPoints: interactions.length,
  };
}

function calculateSentimentTrajectory(messages: any[]) {
  if (!messages.length) return { trend: 'unknown', dataPoints: 0 };
  
  const withScores = messages.filter(m => m.sentiment_score != null);
  if (withScores.length < 5) return { trend: 'insufficient_data', dataPoints: withScores.length };
  
  const recent = withScores.slice(0, Math.floor(withScores.length / 2));
  const older = withScores.slice(Math.floor(withScores.length / 2));
  
  const recentAvg = recent.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / older.length;
  
  return {
    trend: recentAvg > olderAvg + 0.1 ? 'improving' :
           recentAvg < olderAvg - 0.1 ? 'declining' : 'stable',
    recentAverage: recentAvg,
    historicalAverage: olderAvg,
    volatility: calculateVolatility(withScores.map(m => m.sentiment_score)),
    dataPoints: withScores.length,
  };
}

function calculateVolatility(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function extractBehavioralBaseline(predictions: any[]) {
  if (!predictions.length) return null;
  
  return {
    dominantPatterns: predictions[0]?.prediction_value?.patterns || [],
    consistencyScore: predictions[0]?.confidence_score || 0,
    lastUpdated: predictions[0]?.created_at,
  };
}

function calculateValidUntil(horizon: string): string {
  const now = new Date();
  switch (horizon) {
    case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d': return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    case '1y': return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}
