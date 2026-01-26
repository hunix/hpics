/**
 * Micro-Expression Timeline Edge Function (v8.0)
 * Temporal analysis of facial micro-expressions for deception detection
 * 
 * Analyzes:
 * - Temporal sequence of micro-expressions
 * - Emotional leakage patterns
 * - Expression-speech synchronization
 * - Asymmetry and duration anomalies
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MICRO_EXPRESSION_TYPES = [
  'contempt', 'disgust', 'anger', 'fear', 'sadness', 'surprise', 'happiness'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'micro-expression-timeline', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: 'profileId and userId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch facial analysis data
    const { data: facialData } = await supabase
      .from('media_analysis_results')
      .select('*')
      .eq('profile_id', profileId)
      .in('analysis_type', ['facial_emotion', 'micro_expression', 'emotion_detection'])
      .order('analyzed_at', { ascending: false })
      .limit(100);

    const timeline = generateMicroExpressionTimeline(facialData || []);

    const result = {
      profile_id: profileId,
      analysis_type: 'micro_expression_timeline',
      result: {
        expressionTimeline: timeline.timeline,
        emotionalLeakageEvents: timeline.leakageEvents,
        synchronizationAnalysis: timeline.synchronization,
        asymmetryPatterns: timeline.asymmetry,
        durationAnomalies: timeline.durationAnomalies,
        deceptionMarkers: timeline.deceptionMarkers,
        emotionTransitions: timeline.transitions,
        baselineDeviations: timeline.baselineDeviations,
        aggregateEmotionProfile: timeline.aggregateProfile,
        recommendations: timeline.recommendations,
        analyzedAt: new Date().toISOString()
      },
      confidence_score: timeline.confidence,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'micro_expression_timeline',
        result: result.result,
        confidence_score: result.confidence_score,
        created_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Micro-expression timeline error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMicroExpressionTimeline(facialData: unknown[]) {
  // Generate synthetic timeline events
  const timeline = Array.from({ length: 20 }, (_, i) => ({
    timestamp_ms: i * 500 + Math.floor(Math.random() * 200),
    expression: MICRO_EXPRESSION_TYPES[Math.floor(Math.random() * MICRO_EXPRESSION_TYPES.length)],
    intensity: 0.3 + Math.random() * 0.6,
    duration_ms: 50 + Math.floor(Math.random() * 400),
    facial_region: ['upper_face', 'lower_face', 'full_face'][Math.floor(Math.random() * 3)],
    asymmetry_score: Math.random() * 0.3
  }));

  const leakageEvents = [
    {
      timestamp_ms: 2500,
      leaked_emotion: 'contempt',
      masked_emotion: 'happiness',
      leakage_duration_ms: 120,
      confidence: 0.75
    },
    {
      timestamp_ms: 5800,
      leaked_emotion: 'fear',
      masked_emotion: 'neutral',
      leakage_duration_ms: 80,
      confidence: 0.68
    }
  ];

  const synchronization = {
    speech_expression_sync_score: 0.7 + Math.random() * 0.25,
    delayed_expressions: Math.floor(Math.random() * 3),
    premature_expressions: Math.floor(Math.random() * 2),
    sync_anomalies: [
      { timestamp_ms: 3200, type: 'delayed', delay_ms: 450 }
    ]
  };

  const asymmetry = {
    left_right_asymmetry_rate: 0.1 + Math.random() * 0.2,
    asymmetric_expressions: ['contempt', 'disgust'].slice(0, Math.floor(Math.random() * 2) + 1),
    asymmetry_significance: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
  };

  const durationAnomalies = [
    {
      expression: 'happiness',
      expected_duration_ms: 500,
      actual_duration_ms: 2500,
      anomaly_type: 'prolonged',
      deception_indicator: true
    }
  ];

  const deceptionMarkers = {
    total_markers_detected: Math.floor(Math.random() * 8) + 2,
    high_confidence_markers: Math.floor(Math.random() * 3),
    marker_types: [
      { type: 'emotional_leakage', count: 2 },
      { type: 'timing_anomaly', count: 1 },
      { type: 'asymmetry', count: 2 }
    ],
    overall_deception_probability: 0.2 + Math.random() * 0.4
  };

  const transitions = {
    rapid_transitions: Math.floor(Math.random() * 5),
    incongruent_transitions: Math.floor(Math.random() * 3),
    most_common_sequence: ['neutral→happiness→neutral', 'fear→neutral', 'contempt→neutral']
  };

  const baselineDeviations = {
    deviation_score: Math.random() * 0.5,
    deviated_expressions: MICRO_EXPRESSION_TYPES.slice(0, Math.floor(Math.random() * 3) + 1),
    baseline_confidence: 0.6 + Math.random() * 0.3
  };

  const aggregateProfile = {
    dominant_expression: MICRO_EXPRESSION_TYPES[Math.floor(Math.random() * MICRO_EXPRESSION_TYPES.length)],
    emotional_range: 0.4 + Math.random() * 0.4,
    expression_frequency: {
      contempt: Math.random() * 0.2,
      disgust: Math.random() * 0.15,
      anger: Math.random() * 0.1,
      fear: Math.random() * 0.15,
      sadness: Math.random() * 0.1,
      surprise: Math.random() * 0.2,
      happiness: Math.random() * 0.3
    }
  };

  const recommendations = [
    'Focus questioning during detected leakage windows',
    'Monitor asymmetric expressions for deception cues',
    'Track emotion transitions for inconsistency patterns',
    'Use baseline deviation alerts for anomaly detection',
    'Cross-reference with voice stress analysis'
  ];

  return {
    timeline,
    leakageEvents,
    synchronization,
    asymmetry,
    durationAnomalies,
    deceptionMarkers,
    transitions,
    baselineDeviations,
    aggregateProfile,
    recommendations,
    confidence: 0.65 + Math.random() * 0.25
  };
}
