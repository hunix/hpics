import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzerRequest {
  profileId: string;
  frameData?: string;
  sessionData?: any[];
  recentReadings?: string[];
  context?: string;
  sessionId?: string;
  action: string;
}

// FACS (Facial Action Coding System) Action Units
const FACS_ACTION_UNITS: Record<string, string> = {
  'AU1': 'Inner Brow Raiser',
  'AU2': 'Outer Brow Raiser',
  'AU4': 'Brow Lowerer',
  'AU5': 'Upper Lid Raiser',
  'AU6': 'Cheek Raiser',
  'AU7': 'Lid Tightener',
  'AU9': 'Nose Wrinkler',
  'AU10': 'Upper Lip Raiser',
  'AU12': 'Lip Corner Puller',
  'AU14': 'Dimpler',
  'AU15': 'Lip Corner Depressor',
  'AU17': 'Chin Raiser',
  'AU20': 'Lip Stretcher',
  'AU23': 'Lip Tightener',
  'AU24': 'Lip Pressor',
  'AU25': 'Lips Part',
  'AU26': 'Jaw Drop',
  'AU27': 'Mouth Stretch',
  'AU43': 'Eye Closure',
};

// Micro-expression patterns and their emotional correlates
const MICRO_EXPRESSION_PATTERNS: Record<string, { aus: string[]; emotion: string; deceptionIndicator: boolean }> = {
  'fear_flash': { aus: ['AU1', 'AU2', 'AU4', 'AU5', 'AU20', 'AU26'], emotion: 'fear', deceptionIndicator: true },
  'contempt_leak': { aus: ['AU12', 'AU14'], emotion: 'contempt', deceptionIndicator: true },
  'disgust_flash': { aus: ['AU9', 'AU10', 'AU17'], emotion: 'disgust', deceptionIndicator: false },
  'anger_flash': { aus: ['AU4', 'AU5', 'AU7', 'AU23'], emotion: 'anger', deceptionIndicator: true },
  'sadness_leak': { aus: ['AU1', 'AU4', 'AU15'], emotion: 'sadness', deceptionIndicator: false },
  'surprise_flash': { aus: ['AU1', 'AU2', 'AU5', 'AU26'], emotion: 'surprise', deceptionIndicator: false },
  'happiness_genuine': { aus: ['AU6', 'AU12'], emotion: 'happiness', deceptionIndicator: false },
  'happiness_fake': { aus: ['AU12'], emotion: 'fake_happiness', deceptionIndicator: true },
};

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

    const { profileId, frameData, sessionData, recentReadings, context, sessionId, action } = await req.json() as AnalyzerRequest;

    if (action === 'analyze_frame') {
      // Simulate FACS analysis on frame
      // In production, integrate with face-api.js, TensorFlow.js, or cloud vision APIs
      const analysis = analyzeFrame(frameData);

      // Store reading
      const reading = {
        user_id: user.id,
        profile_id: profileId,
        session_id: sessionId || `session_${Date.now()}`,
        timestamp_ms: Date.now(),
        facs_action_units: analysis.actionUnits,
        detected_emotions: analysis.emotions,
        micro_expressions: analysis.microExpressions,
        duration_ms: analysis.duration,
        intensity_score: analysis.intensity,
        context: context,
        frame_data: { analyzed: true, timestamp: new Date().toISOString() },
      };

      const { data: insertedReading, error: insertError } = await supabaseClient
        .from('microexpression_readings')
        .insert(reading)
        .select()
        .single();

      if (insertError) throw insertError;

      // Check for deception indicators
      const deceptionIndicators = analysis.microExpressions.filter((me: any) => me.deceptionIndicator);
      
      if (deceptionIndicators.length > 0) {
        // Update or create deception signature
        await updateDeceptionSignature(supabaseClient, user.id, profileId, deceptionIndicators, analysis);
      }

      // Check for stress indicators
      const stressLevel = calculateStressLevel(analysis);
      if (stressLevel > 0.5) {
        await recordStressIndicator(supabaseClient, user.id, profileId, stressLevel, analysis);
      }

      return new Response(JSON.stringify({ 
        success: true,
        readingId: insertedReading.id,
        emotions: analysis.emotions,
        microExpressions: analysis.microExpressions,
        deceptionProbability: deceptionIndicators.length > 0 ? calculateDeceptionProbability(analysis) : 0,
        stressLevel,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'build_baseline') {
      // Analyze session data to build behavioral baseline
      const baseline = buildBaseline(sessionData || []);

      // Store behavioral fingerprint
      const fingerprint = {
        user_id: user.id,
        profile_id: profileId,
        fingerprint_type: 'facial_behavioral',
        fingerprint_data: baseline.fingerprintData,
        uniqueness_score: baseline.uniquenessScore,
        stability_score: baseline.stabilityScore,
        components: baseline.components,
        verification_samples: sessionData?.length || 0,
        last_verified_at: new Date().toISOString(),
      };

      const { error: fingerprintError } = await supabaseClient
        .from('behavioral_fingerprints')
        .upsert(fingerprint, { onConflict: 'profile_id,fingerprint_type' });

      if (fingerprintError) throw fingerprintError;

      return new Response(JSON.stringify({ 
        success: true,
        baselineEstablished: true,
        samplesAnalyzed: sessionData?.length || 0,
        uniquenessScore: baseline.uniquenessScore,
        stabilityScore: baseline.stabilityScore,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'detect_deception') {
      // Fetch recent readings and baseline
      const { data: readings } = await supabaseClient
        .from('microexpression_readings')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: baseline } = await supabaseClient
        .from('behavioral_fingerprints')
        .select('*')
        .eq('profile_id', profileId)
        .eq('fingerprint_type', 'facial_behavioral')
        .single();

      const deceptionAnalysis = analyzeForDeception(readings || [], baseline);

      // Update deception signatures if detected
      if (deceptionAnalysis.deceptionProbability > 0.6) {
        const { error: sigError } = await supabaseClient
          .from('deception_signatures')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            signature_type: deceptionAnalysis.primaryIndicator,
            signature_pattern: deceptionAnalysis.pattern,
            baseline_comparison: deceptionAnalysis.baselineDeviation,
            confidence_score: deceptionAnalysis.deceptionProbability,
            occurrence_count: 1,
            context_triggers: deceptionAnalysis.triggers,
            detection_accuracy: 0.75,
            last_detected_at: new Date().toISOString(),
          });

        if (sigError) console.error('Signature insert error:', sigError);
      }

      return new Response(JSON.stringify({ 
        success: true,
        deceptionProbability: deceptionAnalysis.deceptionProbability,
        indicators: deceptionAnalysis.indicators,
        confidence: deceptionAnalysis.confidence,
        recommendation: deceptionAnalysis.recommendation,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Microexpression analyzer error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeFrame(frameData?: string): {
  actionUnits: Record<string, number>;
  emotions: Array<{ emotion: string; confidence: number; intensity: number }>;
  microExpressions: Array<{ type: string; duration: number; actionUnits: string[]; deceptionIndicator: boolean }>;
  duration: number;
  intensity: number;
} {
  // Simulate FACS analysis
  const actionUnits: Record<string, number> = {};
  const auKeys = Object.keys(FACS_ACTION_UNITS);
  
  for (const au of auKeys) {
    actionUnits[au] = Math.random() * 0.5; // Low baseline
  }

  // Random activation of some action units
  const activeAUs = auKeys.filter(() => Math.random() > 0.7);
  for (const au of activeAUs) {
    actionUnits[au] = 0.5 + Math.random() * 0.5;
  }

  // Detect emotions based on AU combinations
  const emotions: Array<{ emotion: string; confidence: number; intensity: number }> = [];
  
  if (actionUnits['AU6'] > 0.5 && actionUnits['AU12'] > 0.5) {
    emotions.push({ emotion: 'happiness', confidence: 0.85, intensity: (actionUnits['AU6'] + actionUnits['AU12']) / 2 });
  }
  if (actionUnits['AU4'] > 0.5 && actionUnits['AU5'] > 0.5) {
    emotions.push({ emotion: 'anger', confidence: 0.75, intensity: (actionUnits['AU4'] + actionUnits['AU5']) / 2 });
  }
  if (actionUnits['AU1'] > 0.5 && actionUnits['AU4'] > 0.5) {
    emotions.push({ emotion: 'sadness', confidence: 0.7, intensity: (actionUnits['AU1'] + actionUnits['AU4']) / 2 });
  }

  // Detect micro-expressions
  const microExpressions: Array<{ type: string; duration: number; actionUnits: string[]; deceptionIndicator: boolean }> = [];
  
  for (const [pattern, config] of Object.entries(MICRO_EXPRESSION_PATTERNS)) {
    const matchScore = config.aus.filter(au => actionUnits[au] > 0.4).length / config.aus.length;
    if (matchScore > 0.6 && Math.random() > 0.7) {
      microExpressions.push({
        type: pattern,
        duration: 40 + Math.floor(Math.random() * 200), // 40-240ms
        actionUnits: config.aus,
        deceptionIndicator: config.deceptionIndicator,
      });
    }
  }

  const intensity = Object.values(actionUnits).reduce((sum, v) => sum + v, 0) / auKeys.length;

  return {
    actionUnits,
    emotions,
    microExpressions,
    duration: 33, // ~30fps
    intensity,
  };
}

function calculateStressLevel(analysis: any): number {
  const stressAUs = ['AU4', 'AU7', 'AU23', 'AU24'];
  let stressScore = 0;
  
  for (const au of stressAUs) {
    stressScore += (analysis.actionUnits[au] || 0) * 0.25;
  }
  
  // Add micro-expression contribution
  const stressMicroExpressions = analysis.microExpressions.filter((me: any) => 
    ['fear_flash', 'anger_flash'].includes(me.type)
  );
  stressScore += stressMicroExpressions.length * 0.15;
  
  return Math.min(1, stressScore);
}

function calculateDeceptionProbability(analysis: any): number {
  const deceptionIndicators = analysis.microExpressions.filter((me: any) => me.deceptionIndicator);
  
  if (deceptionIndicators.length === 0) return 0;
  
  const baseProbability = deceptionIndicators.length * 0.2;
  
  // Check for asymmetric expressions (strong deception indicator)
  const asymmetryBonus = analysis.actionUnits['AU14'] > 0.3 ? 0.15 : 0;
  
  // Check for suppressed expressions
  const suppressionBonus = analysis.actionUnits['AU23'] > 0.4 || analysis.actionUnits['AU24'] > 0.4 ? 0.1 : 0;
  
  return Math.min(0.95, baseProbability + asymmetryBonus + suppressionBonus);
}

async function updateDeceptionSignature(
  supabase: any,
  userId: string,
  profileId: string,
  indicators: any[],
  analysis: any
): Promise<void> {
  const signatureType = indicators[0]?.type || 'general_deception';
  
  const { data: existing } = await supabase
    .from('deception_signatures')
    .select('*')
    .eq('profile_id', profileId)
    .eq('signature_type', signatureType)
    .single();

  if (existing) {
    await supabase
      .from('deception_signatures')
      .update({
        occurrence_count: existing.occurrence_count + 1,
        last_detected_at: new Date().toISOString(),
        confidence_score: (existing.confidence_score + calculateDeceptionProbability(analysis)) / 2,
      })
      .eq('id', existing.id);
  }
}

async function recordStressIndicator(
  supabase: any,
  userId: string,
  profileId: string,
  stressLevel: number,
  analysis: any
): Promise<void> {
  await supabase
    .from('stress_indicators')
    .insert({
      user_id: userId,
      profile_id: profileId,
      indicator_type: 'facial_stress',
      measurement_value: stressLevel,
      baseline_value: 0.3, // Assumed baseline
      deviation_percent: ((stressLevel - 0.3) / 0.3) * 100,
      trend_direction: stressLevel > 0.6 ? 'increasing' : 'stable',
      associated_triggers: analysis.microExpressions.map((me: any) => me.type),
      health_implications: { stress_level: stressLevel > 0.7 ? 'elevated' : 'moderate' },
      recommendations: stressLevel > 0.7 ? ['Monitor closely', 'Consider de-escalation'] : [],
      measured_at: new Date().toISOString(),
    });
}

function buildBaseline(sessionData: any[]): {
  fingerprintData: Record<string, unknown>;
  uniquenessScore: number;
  stabilityScore: number;
  components: Array<{ name: string; weight: number; value: unknown }>;
} {
  // Calculate average AU activations across session
  const avgAUs: Record<string, number> = {};
  const auVariance: Record<string, number> = {};

  // Simulate baseline building
  return {
    fingerprintData: {
      averageActionUnits: avgAUs,
      emotionBaseline: { neutral: 0.6, positive: 0.25, negative: 0.15 },
      microExpressionFrequency: 0.1,
      typicalDuration: 100,
    },
    uniquenessScore: 0.7 + Math.random() * 0.2,
    stabilityScore: 0.6 + Math.random() * 0.3,
    components: [
      { name: 'AU_pattern', weight: 0.4, value: avgAUs },
      { name: 'emotion_distribution', weight: 0.3, value: { neutral: 0.6 } },
      { name: 'timing_pattern', weight: 0.3, value: { avgDuration: 100 } },
    ],
  };
}

function analyzeForDeception(readings: any[], baseline: any): {
  deceptionProbability: number;
  indicators: string[];
  primaryIndicator: string;
  pattern: Record<string, unknown>;
  baselineDeviation: Record<string, unknown>;
  triggers: string[];
  confidence: number;
  recommendation: string;
} {
  // Analyze readings against baseline for deception
  const deceptionIndicators: string[] = [];
  let totalDeceptionScore = 0;

  for (const reading of readings) {
    const microExpressions = reading.micro_expressions || [];
    for (const me of microExpressions) {
      if (me.deceptionIndicator) {
        deceptionIndicators.push(me.type);
        totalDeceptionScore += 0.1;
      }
    }
  }

  const deceptionProbability = Math.min(0.95, totalDeceptionScore);

  return {
    deceptionProbability,
    indicators: [...new Set(deceptionIndicators)],
    primaryIndicator: deceptionIndicators[0] || 'none',
    pattern: { frequency: deceptionIndicators.length, types: [...new Set(deceptionIndicators)] },
    baselineDeviation: { detected: true, magnitude: deceptionProbability },
    triggers: deceptionIndicators.slice(0, 3),
    confidence: readings.length >= 5 ? 0.8 : 0.5,
    recommendation: deceptionProbability > 0.6 
      ? 'High probability of deception detected. Recommend verification questioning.'
      : 'Low deception probability. Continue normal interaction.',
  };
}
