import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Gated Biological Fusion Engine (GBV-Net)
 * Based on Sensors Journal (Oct 2025)
 * 
 * Implements hierarchical fusion with gated attention to adaptively weight
 * biometric modalities based on reliability/signal quality.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'gated-biological-fusion', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) throw new Error('userId required for service calls');
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) throw new Error('Invalid user token');
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log(`[GBV-Net] Running gated biological fusion for profile ${profileId}`);

    // Gather all biometric modalities
    const [voiceResult, facialResult, hrvResult, behavioralResult] = await Promise.all([
      supabase.from('voice_insights')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('facial_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('analyzed_at', { ascending: false })
        .limit(20),
      supabase.from('biometric_readings')
        .select('*')
        .eq('profile_id', profileId)
        .order('recorded_at', { ascending: false })
        .limit(50),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['behavioral_dna', 'biometric_behavioral_fusion'])
        .limit(5),
    ]);

    const voiceData = voiceResult.data || [];
    const facialData = facialResult.data || [];
    const hrvData = hrvResult.data || [];
    const behavioralData = behavioralResult.data || [];

    // Calculate modality quality scores (gating mechanism)
    const modalityScores = calculateModalityQuality(voiceData, facialData, hrvData);
    
    // Apply gated attention weights
    const gatedWeights = applyGatedAttention(modalityScores);
    
    // Perform hierarchical fusion
    const fusedState = performHierarchicalFusion(
      voiceData, 
      facialData, 
      hrvData, 
      behavioralData,
      gatedWeights
    );
    
    // Generate reliability assessment
    const reliabilityAssessment = assessFusionReliability(modalityScores, gatedWeights);

    const fusionResult = {
      profileId,
      modelVersion: '1.0.0-gbvnet',
      analyzedAt: new Date().toISOString(),
      modalityScores,
      gatedWeights,
      fusedState,
      reliabilityAssessment,
      recommendations: generateFusionRecommendations(modalityScores, fusedState),
    };

    // Persist to ai_analyses
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'gated_bio_fusion',
        result: fusionResult,
        confidence_score: reliabilityAssessment.overallConfidence,
        model_used: 'gbv-net-v1.0',
        tokens_used: 0,
        cost_cents: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    console.log(`[GBV-Net] Fusion complete for ${profileId} with confidence ${reliabilityAssessment.overallConfidence.toFixed(2)}`);

    return new Response(JSON.stringify({
      success: true,
      fusionResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[GBV-Net] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateModalityQuality(voice: any[], facial: any[], hrv: any[]): Record<string, any> {
  // Voice modality quality
  const voiceQuality = {
    sampleCount: voice.length,
    recency: voice.length > 0 ? getRecencyScore(voice[0]?.created_at) : 0,
    consistency: calculateConsistency(voice.map(v => v.confidence_score || 0.5)),
    signalStrength: voice.length > 0 ? (voice[0]?.audio_quality_score || 0.7) : 0,
    overallQuality: 0,
  };
  voiceQuality.overallQuality = (
    Math.min(1, voiceQuality.sampleCount / 10) * 0.3 +
    voiceQuality.recency * 0.3 +
    voiceQuality.consistency * 0.2 +
    voiceQuality.signalStrength * 0.2
  );

  // Facial modality quality
  const facialQuality = {
    sampleCount: facial.length,
    recency: facial.length > 0 ? getRecencyScore(facial[0]?.analyzed_at) : 0,
    consistency: calculateConsistency(facial.map(f => f.confidence || 0.5)),
    signalStrength: facial.length > 0 ? estimateFacialSignalStrength(facial[0]) : 0,
    overallQuality: 0,
  };
  facialQuality.overallQuality = (
    Math.min(1, facialQuality.sampleCount / 10) * 0.3 +
    facialQuality.recency * 0.3 +
    facialQuality.consistency * 0.2 +
    facialQuality.signalStrength * 0.2
  );

  // HRV/Biometric modality quality
  const hrvQuality = {
    sampleCount: hrv.length,
    recency: hrv.length > 0 ? getRecencyScore(hrv[0]?.recorded_at) : 0,
    consistency: calculateConsistency(hrv.map(h => h.reading_value || 0)),
    signalStrength: hrv.length > 5 ? 0.8 : hrv.length > 0 ? 0.5 : 0,
    overallQuality: 0,
  };
  hrvQuality.overallQuality = (
    Math.min(1, hrvQuality.sampleCount / 20) * 0.3 +
    hrvQuality.recency * 0.3 +
    hrvQuality.consistency * 0.2 +
    hrvQuality.signalStrength * 0.2
  );

  return {
    voice: voiceQuality,
    facial: facialQuality,
    hrv: hrvQuality,
  };
}

function getRecencyScore(timestamp: string | null): number {
  if (!timestamp) return 0;
  const hoursAgo = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) return 1;
  if (hoursAgo < 72) return 0.8;
  if (hoursAgo < 168) return 0.6;
  if (hoursAgo < 720) return 0.4;
  return 0.2;
}

function calculateConsistency(values: number[]): number {
  if (values.length < 2) return 0.5;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  // Higher consistency = lower variance
  return Math.max(0, 1 - Math.sqrt(variance) * 2);
}

function estimateFacialSignalStrength(facial: any): number {
  if (!facial) return 0;
  // Estimate based on face detection quality indicators
  const hasLandmarks = facial.landmarks ? 0.3 : 0;
  const hasEmotions = facial.emotions ? 0.3 : 0;
  const confidence = facial.confidence || 0;
  return hasLandmarks + hasEmotions + confidence * 0.4;
}

function applyGatedAttention(modalityScores: Record<string, any>): Record<string, number> {
  // Softmax-style gating based on quality scores
  const qualities = {
    voice: modalityScores.voice.overallQuality,
    facial: modalityScores.facial.overallQuality,
    hrv: modalityScores.hrv.overallQuality,
  };

  // Temperature parameter for softmax
  const temperature = 0.5;
  
  // Calculate exponentials
  const exps: Record<string, number> = {};
  let expSum = 0;
  
  for (const [modality, quality] of Object.entries(qualities)) {
    const exp = Math.exp(quality / temperature);
    exps[modality] = exp;
    expSum += exp;
  }

  // Normalize to get attention weights
  const weights: Record<string, number> = {};
  for (const modality of Object.keys(qualities)) {
    weights[modality] = expSum > 0 ? exps[modality] / expSum : 1 / 3;
  }

  return weights;
}

function performHierarchicalFusion(
  voice: any[], 
  facial: any[], 
  hrv: any[], 
  behavioral: any[],
  weights: Record<string, number>
): Record<string, any> {
  // Level 1: Extract features from each modality
  const voiceFeatures = extractVoiceFeatures(voice);
  const facialFeatures = extractFacialFeatures(facial);
  const hrvFeatures = extractHRVFeatures(hrv);

  // Level 2: Weighted fusion of features
  const fusedEmotionalState = {
    stress: voiceFeatures.stress * weights.voice + facialFeatures.stress * weights.facial + hrvFeatures.stress * weights.hrv,
    valence: voiceFeatures.valence * weights.voice + facialFeatures.valence * weights.facial + hrvFeatures.valence * weights.hrv,
    arousal: voiceFeatures.arousal * weights.voice + facialFeatures.arousal * weights.facial + hrvFeatures.arousal * weights.hrv,
    authenticity: voiceFeatures.authenticity * weights.voice + facialFeatures.authenticity * weights.facial,
  };

  // Level 3: Integrate with behavioral context
  let behavioralModifier = 1.0;
  for (const analysis of behavioral) {
    const result = analysis.result || {};
    if (result.emotionalStability !== undefined) {
      behavioralModifier = result.emotionalStability;
    }
  }

  return {
    emotionalState: fusedEmotionalState,
    dominantEmotion: getDominantEmotion(fusedEmotionalState),
    stressLevel: categorizeStress(fusedEmotionalState.stress),
    deceptionIndicators: calculateDeceptionIndicators(voiceFeatures, facialFeatures, fusedEmotionalState),
    cognitiveLoad: (fusedEmotionalState.stress + fusedEmotionalState.arousal) / 2,
    temporalStability: behavioralModifier,
  };
}

function extractVoiceFeatures(voice: any[]): Record<string, number> {
  if (voice.length === 0) {
    return { stress: 0.5, valence: 0.5, arousal: 0.5, authenticity: 0.5 };
  }

  const recent = voice.slice(0, 5);
  const avgStress = recent.reduce((sum, v) => sum + (v.stress_indicators?.level || 0.5), 0) / recent.length;
  const avgValence = recent.reduce((sum, v) => sum + (v.emotional_state?.valence || 0.5), 0) / recent.length;
  const avgArousal = recent.reduce((sum, v) => sum + (v.emotional_state?.arousal || 0.5), 0) / recent.length;
  const avgAuth = recent.reduce((sum, v) => sum + (1 - (v.deception_score || 0.3)), 0) / recent.length;

  return { stress: avgStress, valence: avgValence, arousal: avgArousal, authenticity: avgAuth };
}

function extractFacialFeatures(facial: any[]): Record<string, number> {
  if (facial.length === 0) {
    return { stress: 0.5, valence: 0.5, arousal: 0.5, authenticity: 0.5 };
  }

  const recent = facial.slice(0, 5);
  
  let stress = 0.5, valence = 0.5, arousal = 0.5, authenticity = 0.5;
  
  for (const f of recent) {
    const emotions = f.emotions || {};
    // Map facial emotions to dimensions
    stress += (emotions.fear || 0) + (emotions.anger || 0) + (emotions.disgust || 0);
    valence += (emotions.happy || 0) - (emotions.sad || 0);
    arousal += (emotions.surprise || 0) + (emotions.anger || 0);
    authenticity += emotions.neutral !== undefined ? (1 - emotions.neutral) : 0.5;
  }

  return {
    stress: Math.min(1, stress / recent.length / 3),
    valence: Math.max(0, Math.min(1, 0.5 + valence / recent.length)),
    arousal: Math.min(1, arousal / recent.length / 2),
    authenticity: authenticity / recent.length,
  };
}

function extractHRVFeatures(hrv: any[]): Record<string, number> {
  if (hrv.length === 0) {
    return { stress: 0.5, valence: 0.5, arousal: 0.5, authenticity: 0.5 };
  }

  // HRV primarily indicates stress/autonomic arousal
  const readings = hrv.filter(h => h.reading_type === 'hrv' || h.reading_type === 'heart_rate');
  
  if (readings.length === 0) {
    return { stress: 0.5, valence: 0.5, arousal: 0.5, authenticity: 0.5 };
  }

  const values = readings.map(r => r.reading_value || 60);
  const avgHR = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Higher HR = higher stress/arousal
  const stress = Math.min(1, Math.max(0, (avgHR - 60) / 60));
  const arousal = stress;
  
  return { stress, valence: 0.5, arousal, authenticity: 0.5 };
}

function getDominantEmotion(state: Record<string, number>): string {
  if (state.stress > 0.7) return 'stressed';
  if (state.valence > 0.6) return 'positive';
  if (state.valence < 0.4) return 'negative';
  if (state.arousal > 0.6) return 'activated';
  return 'neutral';
}

function categorizeStress(stress: number): string {
  if (stress > 0.8) return 'critical';
  if (stress > 0.6) return 'high';
  if (stress > 0.4) return 'moderate';
  if (stress > 0.2) return 'low';
  return 'minimal';
}

function calculateDeceptionIndicators(voice: Record<string, number>, facial: Record<string, number>, fused: Record<string, number>): Record<string, any> {
  // Cross-modal inconsistency indicates potential deception
  const voiceFacialDelta = Math.abs(voice.authenticity - facial.authenticity);
  const arousalStressDelta = Math.abs(fused.arousal - fused.stress);
  
  return {
    crossModalInconsistency: voiceFacialDelta,
    arousalStressMismatch: arousalStressDelta,
    overallDeceptionRisk: (voiceFacialDelta * 0.6 + arousalStressDelta * 0.4),
    indicators: voiceFacialDelta > 0.3 ? ['Voice-facial emotion mismatch detected'] : [],
  };
}

function assessFusionReliability(scores: Record<string, any>, weights: Record<string, number>): Record<string, any> {
  const avgQuality = (scores.voice.overallQuality + scores.facial.overallQuality + scores.hrv.overallQuality) / 3;
  const maxWeight = Math.max(...Object.values(weights));
  
  // Check for overreliance on single modality
  const diversityScore = 1 - (maxWeight - 1/3);
  
  return {
    overallConfidence: (avgQuality * 0.6 + diversityScore * 0.4),
    dataQuality: avgQuality > 0.6 ? 'good' : avgQuality > 0.3 ? 'moderate' : 'poor',
    modalityDiversity: diversityScore > 0.5 ? 'balanced' : 'skewed',
    primaryModality: Object.entries(weights).sort((a, b) => b[1] - a[1])[0][0],
    warnings: maxWeight > 0.7 ? ['Over-reliance on single modality'] : [],
  };
}

function generateFusionRecommendations(scores: Record<string, any>, state: Record<string, any>): string[] {
  const recommendations: string[] = [];

  if (scores.voice.overallQuality < 0.3) {
    recommendations.push('Collect more voice samples to improve fusion accuracy');
  }
  if (scores.facial.overallQuality < 0.3) {
    recommendations.push('Capture additional facial data for better emotional state detection');
  }
  if (scores.hrv.overallQuality < 0.3) {
    recommendations.push('Integrate biometric sensors for physiological state monitoring');
  }

  if (state.deceptionIndicators?.overallDeceptionRisk > 0.5) {
    recommendations.push('Cross-modal inconsistencies detected - verify authenticity through additional channels');
  }

  if (state.stressLevel === 'high' || state.stressLevel === 'critical') {
    recommendations.push('Target shows elevated stress - optimal time for vulnerability exploitation');
  }

  return recommendations;
}
