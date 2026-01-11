import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Micro-expression detection categories
const MICRO_EXPRESSIONS = [
  'contempt', 'disgust', 'fear', 'anger', 'sadness', 'surprise', 'happiness',
  'lip_compression', 'eyebrow_flash', 'nostril_flare', 'eye_dart', 'forced_smile',
  'asymmetric_smile', 'chin_raise', 'eye_roll', 'mouth_corner_depression',
  'brow_furrow', 'eye_widening', 'jaw_clench', 'lip_purse', 'facial_pallor'
];

// Voice stress indicators
const VOICE_STRESS_INDICATORS = [
  'pitch_variation', 'speech_rate_change', 'pause_frequency', 'volume_fluctuation',
  'vocal_fry', 'throat_clearing', 'breathing_pattern', 'hesitation_markers',
  'word_repetition', 'self_correction', 'incomplete_sentences', 'filler_words'
];

interface ModalityStream {
  modality: 'vocal' | 'facial' | 'body_language' | 'behavioral' | 'physiological';
  timestamp: number;
  data: Record<string, unknown>;
  confidence: number;
}

interface FusionResult {
  timestamp: number;
  emotional_state: {
    primary: string;
    secondary: string[];
    intensity: number;
    confidence: number;
  };
  deception_indicators: {
    micro_expressions: string[];
    voice_stress: string[];
    body_language: string[];
    combined_score: number;
  };
  modality_agreement: {
    matrix: Record<string, Record<string, number>>;
    overall_coherence: number;
  };
  baseline_deviation: {
    significant: boolean;
    deviation_score: number;
    affected_modalities: string[];
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileId, streams, windowSeconds = 10 } = await req.json();
    
    if (!profileId || !streams || !Array.isArray(streams)) {
      return new Response(JSON.stringify({ error: "profileId and streams array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch baseline data for comparison
    const { data: baseline } = await supabase
      .from('behavioral_baselines')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id);

    const baselineMap = new Map(
      (baseline || []).map(b => [b.baseline_type, b.baseline_data])
    );

    // Process streams with temporal alignment
    const typedStreams = streams as ModalityStream[];
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    // Filter to recent streams
    const recentStreams = typedStreams.filter(s => s.timestamp >= windowStart);
    
    // Group by modality
    const modalityGroups = new Map<string, ModalityStream[]>();
    recentStreams.forEach(stream => {
      const group = modalityGroups.get(stream.modality) || [];
      group.push(stream);
      modalityGroups.set(stream.modality, group);
    });

    // Calculate modality agreement matrix
    const modalities = Array.from(modalityGroups.keys());
    const agreementMatrix: Record<string, Record<string, number>> = {};
    
    for (const m1 of modalities) {
      agreementMatrix[m1] = {};
      for (const m2 of modalities) {
        if (m1 === m2) {
          agreementMatrix[m1][m2] = 1.0;
        } else {
          // Calculate agreement based on emotional state overlap
          const streams1 = modalityGroups.get(m1) || [];
          const streams2 = modalityGroups.get(m2) || [];
          agreementMatrix[m1][m2] = calculateModalityAgreement(streams1, streams2);
        }
      }
    }

    // Calculate overall coherence
    let coherenceSum = 0;
    let coherenceCount = 0;
    for (const m1 of modalities) {
      for (const m2 of modalities) {
        if (m1 !== m2) {
          coherenceSum += agreementMatrix[m1][m2];
          coherenceCount++;
        }
      }
    }
    const overallCoherence = coherenceCount > 0 ? coherenceSum / coherenceCount : 0;

    // Detect micro-expressions from facial stream
    const facialStreams = modalityGroups.get('facial') || [];
    const detectedMicroExpressions = detectMicroExpressions(facialStreams);

    // Detect voice stress from vocal stream
    const vocalStreams = modalityGroups.get('vocal') || [];
    const detectedVoiceStress = detectVoiceStress(vocalStreams);

    // Detect body language deception indicators
    const bodyStreams = modalityGroups.get('body_language') || [];
    const bodyDeceptionIndicators = detectBodyLanguageDeception(bodyStreams);

    // Calculate combined deception score
    const microExpressionScore = detectedMicroExpressions.length * 0.15;
    const voiceStressScore = detectedVoiceStress.length * 0.12;
    const bodyLanguageScore = bodyDeceptionIndicators.length * 0.10;
    const coherenceImpact = (1 - overallCoherence) * 0.3;
    
    const combinedDeceptionScore = Math.min(1, 
      microExpressionScore + voiceStressScore + bodyLanguageScore + coherenceImpact
    );

    // Determine primary emotional state
    const emotionalState = determineEmotionalState(recentStreams);

    // Check baseline deviation
    const baselineDeviation = calculateBaselineDeviation(
      recentStreams, 
      baselineMap,
      modalities
    );

    const fusionResult: FusionResult = {
      timestamp: now,
      emotional_state: emotionalState,
      deception_indicators: {
        micro_expressions: detectedMicroExpressions,
        voice_stress: detectedVoiceStress,
        body_language: bodyDeceptionIndicators,
        combined_score: combinedDeceptionScore,
      },
      modality_agreement: {
        matrix: agreementMatrix,
        overall_coherence: overallCoherence,
      },
      baseline_deviation: baselineDeviation,
    };

    // Store result for historical analysis
    await supabase.from('behavioral_analyses').insert({
      profile_id: profileId,
      user_id: user.id,
      analysis_type: 'realtime_fusion',
      confidence_score: overallCoherence,
      raw_analysis: fusionResult,
      behavioral_patterns: {
        micro_expressions: detectedMicroExpressions,
        voice_stress: detectedVoiceStress,
      },
    });

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'cross-modal-fusion-realtime',
      model_name: 'local-fusion',
      provider: 'local',
      estimated_cost_cents: 0,
      status: 'completed',
    });

    // If deception score is high, create surveillance alert
    if (combinedDeceptionScore > 0.6) {
      await supabase.from('surveillance_alerts').insert({
        user_id: user.id,
        profile_id: profileId,
        alert_type: 'deception_detected',
        severity: combinedDeceptionScore > 0.8 ? 'critical' : 'high',
        title: 'Potential deception indicators detected',
        description: `Combined deception score: ${(combinedDeceptionScore * 100).toFixed(0)}%`,
        alert_data: {
          micro_expressions: detectedMicroExpressions,
          voice_stress: detectedVoiceStress,
          body_language: bodyDeceptionIndicators,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      fusion: fusionResult,
      streamsProcessed: recentStreams.length,
      modalitiesAnalyzed: modalities,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Fusion error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateModalityAgreement(streams1: ModalityStream[], streams2: ModalityStream[]): number {
  if (streams1.length === 0 || streams2.length === 0) return 0;
  
  // Compare emotional valence and arousal between modalities
  const getValence = (stream: ModalityStream): number => {
    const data = stream.data as Record<string, unknown>;
    if (data.sentiment_score) return data.sentiment_score as number;
    if (data.emotion) {
      const emotion = data.emotion as string;
      if (['happiness', 'joy', 'excitement'].includes(emotion)) return 0.8;
      if (['sadness', 'fear', 'anger', 'disgust'].includes(emotion)) return -0.6;
    }
    return 0;
  };

  const valence1 = streams1.reduce((sum, s) => sum + getValence(s), 0) / streams1.length;
  const valence2 = streams2.reduce((sum, s) => sum + getValence(s), 0) / streams2.length;
  
  // Agreement is high when valences are similar
  const valenceDiff = Math.abs(valence1 - valence2);
  return Math.max(0, 1 - valenceDiff);
}

function detectMicroExpressions(streams: ModalityStream[]): string[] {
  const detected: string[] = [];
  
  streams.forEach(stream => {
    const data = stream.data as Record<string, unknown>;
    
    // Check for rapid expression changes
    if (data.expression_duration && (data.expression_duration as number) < 500) {
      const expression = data.expression as string;
      if (MICRO_EXPRESSIONS.includes(expression)) {
        detected.push(expression);
      }
    }
    
    // Check for asymmetric expressions
    if (data.facial_asymmetry && (data.facial_asymmetry as number) > 0.3) {
      detected.push('asymmetric_smile');
    }
    
    // Check for eye movement patterns
    if (data.gaze_aversion && (data.gaze_aversion as boolean)) {
      detected.push('eye_dart');
    }
  });
  
  return [...new Set(detected)];
}

function detectVoiceStress(streams: ModalityStream[]): string[] {
  const detected: string[] = [];
  
  streams.forEach(stream => {
    const data = stream.data as Record<string, unknown>;
    
    // Check pitch variation
    if (data.pitch_variance && (data.pitch_variance as number) > 50) {
      detected.push('pitch_variation');
    }
    
    // Check speech rate
    if (data.speech_rate_change && Math.abs(data.speech_rate_change as number) > 0.3) {
      detected.push('speech_rate_change');
    }
    
    // Check for hesitation markers
    if (data.hesitations && (data.hesitations as number) > 3) {
      detected.push('hesitation_markers');
    }
    
    // Check for filler words
    if (data.filler_word_count && (data.filler_word_count as number) > 5) {
      detected.push('filler_words');
    }
  });
  
  return [...new Set(detected)];
}

function detectBodyLanguageDeception(streams: ModalityStream[]): string[] {
  const indicators: string[] = [];
  
  streams.forEach(stream => {
    const data = stream.data as Record<string, unknown>;
    
    if (data.self_touching && (data.self_touching as boolean)) {
      indicators.push('self_touching');
    }
    
    if (data.reduced_gestures && (data.reduced_gestures as boolean)) {
      indicators.push('gesture_reduction');
    }
    
    if (data.postural_shifts && (data.postural_shifts as number) > 3) {
      indicators.push('postural_shifting');
    }
    
    if (data.gaze_avoidance && (data.gaze_avoidance as boolean)) {
      indicators.push('gaze_avoidance');
    }
  });
  
  return [...new Set(indicators)];
}

function determineEmotionalState(streams: ModalityStream[]): {
  primary: string;
  secondary: string[];
  intensity: number;
  confidence: number;
} {
  const emotionCounts: Record<string, number> = {};
  let totalConfidence = 0;
  
  streams.forEach(stream => {
    const data = stream.data as Record<string, unknown>;
    const emotion = (data.emotion || data.primary_emotion || 'neutral') as string;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + stream.confidence;
    totalConfidence += stream.confidence;
  });
  
  const sorted = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a);
  
  const primary = sorted[0]?.[0] || 'neutral';
  const secondary = sorted.slice(1, 4).map(([e]) => e);
  const intensity = sorted[0]?.[1] || 0;
  const confidence = streams.length > 0 ? totalConfidence / streams.length : 0;
  
  return { primary, secondary, intensity, confidence };
}

function calculateBaselineDeviation(
  streams: ModalityStream[], 
  baselineMap: Map<string, unknown>,
  modalities: string[]
): {
  significant: boolean;
  deviation_score: number;
  affected_modalities: string[];
} {
  const affectedModalities: string[] = [];
  let totalDeviation = 0;
  
  modalities.forEach(modality => {
    const baseline = baselineMap.get(modality) as Record<string, unknown> | undefined;
    if (!baseline) return;
    
    const modalityStreams = streams.filter(s => s.modality === modality);
    if (modalityStreams.length === 0) return;
    
    // Compare current to baseline metrics
    const currentAvgConfidence = modalityStreams.reduce((sum, s) => sum + s.confidence, 0) / modalityStreams.length;
    const baselineConfidence = (baseline.avg_confidence || 0.7) as number;
    
    const deviation = Math.abs(currentAvgConfidence - baselineConfidence);
    if (deviation > 0.2) {
      affectedModalities.push(modality);
      totalDeviation += deviation;
    }
  });
  
  const avgDeviation = modalities.length > 0 ? totalDeviation / modalities.length : 0;
  
  return {
    significant: affectedModalities.length >= 2 || avgDeviation > 0.3,
    deviation_score: avgDeviation,
    affected_modalities: affectedModalities,
  };
}
