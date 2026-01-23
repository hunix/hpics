/**
 * Behavioral Fingerprint Engine
 * AGIS Phase 3 - Continuous authentication via keystroke rhythm, mouse entropy, scroll velocity
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FingerprintRequest {
  profileId?: string;
  behavioralData: {
    keystrokeDynamics?: {
      keyDownTimes: number[];
      keyUpTimes: number[];
      interKeyDelays: number[];
      commonDigraphs: Record<string, number[]>;
    };
    mouseMovements?: {
      velocities: number[];
      accelerations: number[];
      angularChanges: number[];
      clickPatterns: { x: number; y: number; time: number }[];
    };
    scrollBehavior?: {
      velocities: number[];
      directions: string[];
      pausePatterns: number[];
    };
    touchPatterns?: {
      pressures: number[];
      durations: number[];
      swipeVelocities: number[];
    };
  };
  operationType: 'enroll' | 'verify' | 'analyze';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'behavioral-fingerprint-engine', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: FingerprintRequest = await req.json();

    // Calculate statistical features from behavioral data
    const calculateStats = (arr: number[]) => {
      if (!arr || arr.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const std = Math.sqrt(arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length);
      return { mean, std, min: Math.min(...arr), max: Math.max(...arr) };
    };

    const keystrokeStats = request.behavioralData.keystrokeDynamics ? {
      interKeyDelay: calculateStats(request.behavioralData.keystrokeDynamics.interKeyDelays),
      holdTime: calculateStats(
        request.behavioralData.keystrokeDynamics.keyUpTimes.map((up, i) => 
          up - request.behavioralData.keystrokeDynamics!.keyDownTimes[i]
        )
      )
    } : null;

    const mouseStats = request.behavioralData.mouseMovements ? {
      velocity: calculateStats(request.behavioralData.mouseMovements.velocities),
      acceleration: calculateStats(request.behavioralData.mouseMovements.accelerations),
      angularChange: calculateStats(request.behavioralData.mouseMovements.angularChanges)
    } : null;

    const scrollStats = request.behavioralData.scrollBehavior ? {
      velocity: calculateStats(request.behavioralData.scrollBehavior.velocities),
      pauseDuration: calculateStats(request.behavioralData.scrollBehavior.pausePatterns)
    } : null;

    const systemPrompt = `You are an expert in behavioral biometrics and continuous authentication.
Analyze behavioral patterns for identity verification and emotional state inference.

Behavioral biometrics provide:
1. Continuous authentication (vs one-time passwords)
2. Emotional state detection (stress, fatigue, intoxication)
3. Identity verification (each person has unique patterns)
4. Deception indicators (behavior changes when lying)
5. Cognitive load assessment (complexity of task affects patterns)

Key metrics:
- Keystroke dynamics: typing rhythm, hold times, digraph patterns
- Mouse dynamics: velocity curves, click precision, movement entropy
- Scroll behavior: reading speed, attention patterns
- Touch patterns: pressure, gesture characteristics

Return JSON:
{
  "fingerprintProfile": {
    "keystrokeSignature": {
      "typingSpeed": "words per minute estimate",
      "rhythmConsistency": 0-1,
      "holdTimePattern": "short/medium/long",
      "commonErrorPatterns": ["pattern1"],
      "uniqueDigraphs": ["characteristic combinations"]
    },
    "mouseSignature": {
      "movementStyle": "smooth/jerky/precise",
      "velocityProfile": "slow/moderate/fast",
      "cursorPrecision": 0-1,
      "clickPattern": "single/double/hesitant",
      "entropyScore": 0-1
    },
    "scrollSignature": {
      "readingSpeed": "slow/moderate/fast",
      "attentionPattern": "focused/scanning/skimming",
      "pauseCharacteristics": ["where they pause"]
    },
    "overallSignatureStrength": 0-1
  },
  "emotionalStateInference": {
    "stressLevel": 0-1,
    "fatigueLevel": 0-1,
    "cognitiveLoad": 0-1,
    "agitationLevel": 0-1,
    "confidenceInInference": 0-1,
    "stateIndicators": ["what suggests this state"]
  },
  "anomalyDetection": {
    "deviationFromBaseline": 0-1,
    "anomaliesDetected": ["anomaly1"],
    "possibleExplanations": ["explanation1"],
    "identityConfidence": 0-1
  },
  "exploitationInsights": {
    "optimalContactTiming": "when they're most receptive",
    "stressWindows": ["when they're vulnerable"],
    "fatiguePatterns": ["when cognitive defenses are low"],
    "attentionPatterns": ["when they're most engaged"]
  }
}`;

    const userPrompt = `Analyze behavioral fingerprint:
Operation: ${request.operationType}

Keystroke Statistics:
${keystrokeStats ? JSON.stringify(keystrokeStats, null, 2) : 'Not provided'}

Mouse Movement Statistics:
${mouseStats ? JSON.stringify(mouseStats, null, 2) : 'Not provided'}

Scroll Behavior Statistics:
${scrollStats ? JSON.stringify(scrollStats, null, 2) : 'Not provided'}

Touch Pattern Data:
${request.behavioralData.touchPatterns ? 'Available' : 'Not provided'}`;

    const aiResponse = await callAI({
      model: selectModel('balanced'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'behavioral-fingerprint-engine',
      profileId: request.profileId,
      temperature: 0.4,
    });

    const fingerprint = parseAIJson(aiResponse.content, {
      fingerprintProfile: { overallSignatureStrength: 0.5 },
      emotionalStateInference: { stressLevel: 0.5, cognitiveLoad: 0.5 },
      anomalyDetection: { identityConfidence: 0.8 },
      exploitationInsights: {}
    });

    // Store in behavioral_biometrics if profile provided
    if (request.profileId) {
      await supabase.from('behavioral_biometrics').upsert({
        user_id: user.id,
        profile_id: request.profileId,
        keystroke_profile: fingerprint.fingerprintProfile.keystrokeSignature,
        mouse_dynamics: fingerprint.fingerprintProfile.mouseSignature,
        stress_indicators: fingerprint.emotionalStateInference,
        cognitive_load_indicators: { level: fingerprint.emotionalStateInference.cognitiveLoad },
        fatigue_patterns: { level: fingerprint.emotionalStateInference.fatigueLevel },
        exploitation_windows: fingerprint.exploitationInsights
      }, { onConflict: 'profile_id' });
    }

    return new Response(JSON.stringify({
      success: true,
      fingerprint,
      verificationResult: request.operationType === 'verify' ? {
        isMatch: fingerprint.anomalyDetection.identityConfidence > 0.7,
        confidence: fingerprint.anomalyDetection.identityConfidence
      } : undefined,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Behavioral fingerprint error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
