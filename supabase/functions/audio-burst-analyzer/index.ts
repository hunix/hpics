/**
 * Audio Burst Analyzer Edge Function
 * 
 * Predicts mental conditions through "audio burst" analysis using Hilbert transforms.
 * Based on US20240071412A1 (Eleos Mental Systems, 2024) patent.
 * 
 * Features:
 * - Hilbert transform for envelope extraction
 * - Rhythmic vs irregular speech pattern detection
 * - Depression/anxiety indicator scoring
 * - Mental state prediction
 * 
 * @version 7.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioBurstRequest {
  profileId: string;
  voiceInsightId?: string;
  // Audio signal data (pre-processed on client)
  signalData?: number[];
  sampleRate?: number;
  // Or speech pattern metrics (if signal not available)
  speechMetrics?: {
    pauseDurations: number[];
    syllableRates: number[];
    pitchVariations: number[];
    energyLevels: number[];
  };
}

interface AudioBurstAnalysis {
  hilbertEnvelope: number[];
  rhythmicScore: number;  // 0-1, higher = more rhythmic (depressive pattern)
  irregularScore: number; // 0-1, higher = more irregular (anxiety pattern)
  aucIntegral: number;
  mentalStateIndicators: {
    depression: number;
    anxiety: number;
    stress: number;
    fatigue: number;
    neutral: number;
  };
  prediction: string;
  confidence: number;
}

/**
 * Simplified Hilbert transform envelope extraction
 * In production, this would use proper DSP libraries
 */
function computeHilbertEnvelope(signal: number[]): number[] {
  if (signal.length === 0) return [];
  
  const envelope: number[] = [];
  const windowSize = 5;
  
  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize); j <= Math.min(signal.length - 1, i + windowSize); j++) {
      sum += Math.abs(signal[j]);
      count++;
    }
    envelope.push(sum / count);
  }
  
  return envelope;
}

/**
 * Calculate rhythmicity score based on autocorrelation
 */
function calculateRhythmicity(envelope: number[]): number {
  if (envelope.length < 10) return 0.5;
  
  const mean = envelope.reduce((a, b) => a + b, 0) / envelope.length;
  const normalized = envelope.map(v => v - mean);
  
  // Calculate autocorrelation at various lags
  let maxCorr = 0;
  for (let lag = 5; lag < Math.min(50, envelope.length / 2); lag++) {
    let corr = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < envelope.length - lag; i++) {
      corr += normalized[i] * normalized[i + lag];
      norm1 += normalized[i] * normalized[i];
      norm2 += normalized[i + lag] * normalized[i + lag];
    }
    
    const normCorr = corr / (Math.sqrt(norm1 * norm2) + 0.001);
    maxCorr = Math.max(maxCorr, Math.abs(normCorr));
  }
  
  return Math.min(1, maxCorr);
}

/**
 * Calculate irregularity score based on variance patterns
 */
function calculateIrregularity(envelope: number[]): number {
  if (envelope.length < 10) return 0.5;
  
  const windowSize = 10;
  const localVariances: number[] = [];
  
  for (let i = 0; i < envelope.length - windowSize; i += windowSize) {
    const window = envelope.slice(i, i + windowSize);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const variance = window.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / window.length;
    localVariances.push(variance);
  }
  
  if (localVariances.length < 2) return 0.5;
  
  // Coefficient of variation of local variances
  const meanVar = localVariances.reduce((a, b) => a + b, 0) / localVariances.length;
  const varOfVar = localVariances.reduce((sum, v) => sum + Math.pow(v - meanVar, 2), 0) / localVariances.length;
  
  // Normalize to 0-1 range
  return Math.min(1, Math.sqrt(varOfVar) / (meanVar + 0.001));
}

/**
 * Calculate AUC (Area Under Curve) integral of envelope
 */
function calculateAUC(envelope: number[]): number {
  if (envelope.length === 0) return 0;
  return envelope.reduce((a, b) => a + b, 0);
}

/**
 * Process speech metrics into mental state indicators
 */
function analyzeSpeechMetrics(metrics: {
  pauseDurations: number[];
  syllableRates: number[];
  pitchVariations: number[];
  energyLevels: number[];
}): AudioBurstAnalysis {
  const { pauseDurations, syllableRates, pitchVariations, energyLevels } = metrics;
  
  // Generate synthetic envelope from metrics
  const envelope = energyLevels.length > 0 ? energyLevels : [0.5];
  
  // Pause analysis
  const avgPause = pauseDurations.length > 0 
    ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length 
    : 0.5;
  const pauseVariability = pauseDurations.length > 1
    ? Math.sqrt(pauseDurations.reduce((sum, p) => sum + Math.pow(p - avgPause, 2), 0) / pauseDurations.length)
    : 0;
  
  // Syllable rate analysis
  const avgSyllableRate = syllableRates.length > 0
    ? syllableRates.reduce((a, b) => a + b, 0) / syllableRates.length
    : 4; // Normal ~4 syllables/second
  
  // Pitch variation
  const avgPitchVar = pitchVariations.length > 0
    ? pitchVariations.reduce((a, b) => a + b, 0) / pitchVariations.length
    : 0.3;
  
  // Calculate scores
  // Depression: slower rate, longer pauses, low pitch variation, rhythmic speech
  const depressionScore = Math.min(1, 
    (avgPause > 0.8 ? 0.3 : 0) +
    (avgSyllableRate < 3 ? 0.3 : 0) +
    (avgPitchVar < 0.2 ? 0.2 : 0) +
    (pauseVariability < 0.2 ? 0.2 : 0)
  );
  
  // Anxiety: faster rate, shorter pauses, high pitch, irregular patterns
  const anxietyScore = Math.min(1,
    (avgPause < 0.3 ? 0.3 : 0) +
    (avgSyllableRate > 5 ? 0.3 : 0) +
    (pauseVariability > 0.5 ? 0.2 : 0) +
    (avgPitchVar > 0.5 ? 0.2 : 0)
  );
  
  // Stress: moderate features of both
  const stressScore = Math.min(1, (depressionScore + anxietyScore) * 0.5 + 0.1);
  
  // Fatigue: slow rate, low energy, rhythmic but fading
  const avgEnergy = energyLevels.length > 0
    ? energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length
    : 0.5;
  const fatigueScore = Math.min(1,
    (avgEnergy < 0.3 ? 0.4 : 0) +
    (avgSyllableRate < 3.5 ? 0.3 : 0) +
    (avgPause > 0.6 ? 0.3 : 0)
  );
  
  // Neutral: absence of other indicators
  const neutralScore = Math.max(0, 1 - (depressionScore + anxietyScore + stressScore + fatigueScore) / 4);
  
  // Determine primary prediction
  const scores = { depression: depressionScore, anxiety: anxietyScore, stress: stressScore, fatigue: fatigueScore, neutral: neutralScore };
  const maxScore = Math.max(...Object.values(scores));
  const prediction = Object.entries(scores).find(([_, v]) => v === maxScore)?.[0] || 'neutral';
  
  // Calculate rhythmic/irregular from pause patterns
  const rhythmicScore = 1 - (pauseVariability / (avgPause + 0.001));
  const irregularScore = pauseVariability / (avgPause + 0.001);
  
  return {
    hilbertEnvelope: envelope,
    rhythmicScore: Math.min(1, Math.max(0, rhythmicScore)),
    irregularScore: Math.min(1, Math.max(0, irregularScore)),
    aucIntegral: calculateAUC(envelope),
    mentalStateIndicators: {
      depression: depressionScore,
      anxiety: anxietyScore,
      stress: stressScore,
      fatigue: fatigueScore,
      neutral: neutralScore,
    },
    prediction,
    confidence: Math.min(0.85, maxScore + 0.3),
  };
}

/**
 * Analyze raw signal data
 */
function analyzeSignal(signal: number[], sampleRate: number): AudioBurstAnalysis {
  const envelope = computeHilbertEnvelope(signal);
  const rhythmicScore = calculateRhythmicity(envelope);
  const irregularScore = calculateIrregularity(envelope);
  const aucIntegral = calculateAUC(envelope);
  
  // Map rhythmic/irregular to mental states
  // Research indicates: rhythmic = depressive, irregular = anxious
  const depressionScore = rhythmicScore * 0.7 + (1 - irregularScore) * 0.3;
  const anxietyScore = irregularScore * 0.7 + (1 - rhythmicScore) * 0.3;
  const stressScore = (depressionScore + anxietyScore) * 0.4;
  const fatigueScore = rhythmicScore * 0.5 * (aucIntegral < signal.length * 0.3 ? 1 : 0.5);
  const neutralScore = Math.max(0, 1 - (depressionScore + anxietyScore) / 2);
  
  const scores = { depression: depressionScore, anxiety: anxietyScore, stress: stressScore, fatigue: fatigueScore, neutral: neutralScore };
  const maxScore = Math.max(...Object.values(scores));
  const prediction = Object.entries(scores).find(([_, v]) => v === maxScore)?.[0] || 'neutral';
  
  return {
    hilbertEnvelope: envelope.slice(0, 100), // Truncate for storage
    rhythmicScore,
    irregularScore,
    aucIntegral,
    mentalStateIndicators: {
      depression: depressionScore,
      anxiety: anxietyScore,
      stress: stressScore,
      fatigue: fatigueScore,
      neutral: neutralScore,
    },
    prediction,
    confidence: Math.min(0.85, maxScore + 0.3),
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(
      JSON.stringify({ ok: true, function: 'audio-burst-analyzer', timestamp: Date.now() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const body: AudioBurstRequest = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = (body as any).userId || (body as any).user_id;
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId required for service calls' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = user.id;
    }

    const { profileId, voiceInsightId, signalData, sampleRate = 16000, speechMetrics } = body;

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'profileId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let analysis: AudioBurstAnalysis;

    if (signalData && signalData.length > 0) {
      // Analyze raw audio signal
      analysis = analyzeSignal(signalData, sampleRate);
    } else if (speechMetrics) {
      // Analyze speech pattern metrics
      analysis = analyzeSpeechMetrics(speechMetrics);
    } else {
      // No data provided - return neutral analysis
      analysis = {
        hilbertEnvelope: [],
        rhythmicScore: 0.5,
        irregularScore: 0.5,
        aucIntegral: 0,
        mentalStateIndicators: {
          depression: 0.2,
          anxiety: 0.2,
          stress: 0.2,
          fatigue: 0.2,
          neutral: 0.6,
        },
        prediction: 'neutral',
        confidence: 0.3,
      };
    }

    // Store in audio_burst_analyses table
    const { error: insertError } = await supabaseClient
      .from('audio_burst_analyses')
      .insert({
        voice_insight_id: voiceInsightId,
        user_id: userId,
        hilbert_transform_data: { envelope: analysis.hilbertEnvelope.slice(0, 50) },
        rhythmic_score: analysis.rhythmicScore,
        irregular_score: analysis.irregularScore,
        auc_integral: analysis.aucIntegral,
        mental_state_prediction: analysis.prediction,
        confidence: analysis.confidence,
      });

    if (insertError) {
      console.error('[audio-burst-analyzer] Insert error:', insertError);
    }

    // Store in ai_analyses for fusion
    const analysisResult = {
      ...analysis,
      profileId,
      voiceInsightId,
      analysisVersion: '7.0.0',
      patentReference: 'US20240071412A1',
    };

    await supabaseClient
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'audio_burst_mental_state',
        result: analysisResult,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(
      JSON.stringify({
        success: true,
        confidence: analysis.confidence,
        payload: analysisResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[audio-burst-analyzer] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
