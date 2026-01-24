// Analyze Gait Pattern
// Extract and analyze walking patterns from video for identification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GaitFeatures {
  stepLength: number;
  stepWidth: number;
  cadence: number;
  armSwing: number;
  bodyLean: number;
  footAngle: number;
  kneeFlexion: number;
  hipRotation: number;
  shoulderMovement: number;
  headPosition: number;
}

interface GaitAnalysisResult {
  profileId: string;
  features: GaitFeatures;
  normalizedSignature: number[];
  confidence: number;
  healthIndicators: {
    indicator: string;
    observation: string;
    severity: 'normal' | 'mild' | 'moderate' | 'significant';
  }[];
  emotionalIndicators: {
    emotion: string;
    confidence: number;
  }[];
  matchedProfiles: {
    profileId: string;
    similarity: number;
    profileName: string;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { profileId, videoUrl, videoFrames, enrollmentMode = false } = await req.json();

    if (!videoUrl && !videoFrames) {
      throw new Error('Video URL or frames required');
    }

    // Analyze gait using AI vision
    const analysis = await analyzeGaitWithAI(
      videoUrl || videoFrames,
      supabase,
      user.id
    );

    if (enrollmentMode && profileId) {
      // Store as gait enrollment
      await supabase.from('gait_analyses').insert({
        user_id: user.id,
        profile_id: profileId,
        gait_features: analysis.features,
        normalized_signature: analysis.normalizedSignature,
        confidence_score: analysis.confidence,
        health_indicators: analysis.healthIndicators,
        emotional_indicators: analysis.emotionalIndicators,
        source_url: videoUrl,
        is_enrollment: true,
        created_at: new Date().toISOString()
      });

      // Update biometric samples
      await supabase.from('biometric_samples').insert({
        user_id: user.id,
        profile_id: profileId,
        biometric_type: 'gait',
        source_type: 'video',
        source_url: videoUrl,
        features: analysis.features,
        quality_score: analysis.confidence,
        status: 'processed',
        processed_at: new Date().toISOString()
      });

      return new Response(JSON.stringify({
        success: true,
        enrolled: true,
        analysis
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Match against enrolled gaits
    const { data: enrolledGaits } = await supabase
      .from('gait_analyses')
      .select('profile_id, normalized_signature, profiles(first_name, last_name)')
      .eq('user_id', user.id)
      .eq('is_enrollment', true);

    const matches: any[] = [];
    
    if (enrolledGaits) {
      for (const enrolled of enrolledGaits) {
        const similarity = calculateGaitSimilarity(
          analysis.normalizedSignature,
          enrolled.normalized_signature
        );
        
        if (similarity > 0.6) {
          const profile = enrolled.profiles as any;
          matches.push({
            profileId: enrolled.profile_id,
            similarity,
            profileName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
          });
        }
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);
    analysis.matchedProfiles = matches.slice(0, 5);

    // Store analysis result
    await supabase.from('gait_analyses').insert({
      user_id: user.id,
      profile_id: matches[0]?.profileId || profileId || null,
      gait_features: analysis.features,
      normalized_signature: analysis.normalizedSignature,
      confidence_score: analysis.confidence,
      health_indicators: analysis.healthIndicators,
      emotional_indicators: analysis.emotionalIndicators,
      matched_profiles: matches,
      source_url: videoUrl,
      is_enrollment: false
    });

    return new Response(JSON.stringify({
      success: true,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Gait analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeGaitWithAI(videoData: string | string[], supabase: any, userId: string): Promise<GaitAnalysisResult> {
  const startTime = Date.now();

  const isFrames = Array.isArray(videoData);
  
  const prompt = `Analyze the walking/gait pattern in this ${isFrames ? 'sequence of video frames' : 'video'}.

Extract detailed gait characteristics:
1. Step length (normalized 0-1)
2. Step width (normalized 0-1) 
3. Cadence/rhythm (normalized 0-1)
4. Arm swing amplitude (normalized 0-1)
5. Body lean angle (normalized 0-1)
6. Foot angle at heel strike (normalized 0-1)
7. Knee flexion (normalized 0-1)
8. Hip rotation (normalized 0-1)
9. Shoulder movement (normalized 0-1)
10. Head position stability (normalized 0-1)

Also assess:
- Health indicators (limp, asymmetry, stiffness, etc.)
- Emotional indicators (confidence, fatigue, stress, urgency)

Return JSON:
{
  "features": {
    "stepLength": 0.6,
    "stepWidth": 0.4,
    "cadence": 0.7,
    "armSwing": 0.5,
    "bodyLean": 0.3,
    "footAngle": 0.5,
    "kneeFlexion": 0.6,
    "hipRotation": 0.4,
    "shoulderMovement": 0.5,
    "headPosition": 0.7
  },
  "confidence": 0.85,
  "healthIndicators": [
    {"indicator": "symmetry", "observation": "Slight asymmetry in step length", "severity": "mild"}
  ],
  "emotionalIndicators": [
    {"emotion": "confidence", "confidence": 0.7},
    {"emotion": "fatigue", "confidence": 0.3}
  ]
}`;

  try {
    const messages: any[] = [{
      role: 'user',
      content: isFrames 
        ? [
            { type: 'text', text: prompt },
            ...(videoData as string[]).slice(0, 5).map(frame => ({
              type: 'image_url',
              image_url: { url: frame.startsWith('data:') ? frame : `data:image/jpeg;base64,${frame}` }
            }))
          ]
        : [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: videoData } }
          ]
    }];

    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-gateway`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'analyze-gait-pattern',
      model_name: 'gemini-2.5-flash',
      provider: 'google',
      estimated_cost_cents: 3,
      response_time_ms: Date.now() - startTime,
      status: 'success'
    });

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Create normalized signature from features
      const features = parsed.features as GaitFeatures;
      const normalizedSignature = [
        features.stepLength,
        features.stepWidth,
        features.cadence,
        features.armSwing,
        features.bodyLean,
        features.footAngle,
        features.kneeFlexion,
        features.hipRotation,
        features.shoulderMovement,
        features.headPosition
      ];

      return {
        profileId: '',
        features,
        normalizedSignature,
        confidence: parsed.confidence || 0.7,
        healthIndicators: parsed.healthIndicators || [],
        emotionalIndicators: parsed.emotionalIndicators || [],
        matchedProfiles: []
      };
    }
  } catch (error) {
    console.error('AI gait analysis error:', error);
  }

  // Return default if AI fails
  return {
    profileId: '',
    features: {
      stepLength: 0.5, stepWidth: 0.5, cadence: 0.5, armSwing: 0.5,
      bodyLean: 0.5, footAngle: 0.5, kneeFlexion: 0.5, hipRotation: 0.5,
      shoulderMovement: 0.5, headPosition: 0.5
    },
    normalizedSignature: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    confidence: 0.3,
    healthIndicators: [],
    emotionalIndicators: [],
    matchedProfiles: []
  };
}

function calculateGaitSimilarity(sig1: number[], sig2: number[]): number {
  if (!sig1 || !sig2 || sig1.length !== sig2.length) return 0;

  let sumSquaredDiff = 0;
  for (let i = 0; i < sig1.length; i++) {
    const diff = sig1[i] - sig2[i];
    sumSquaredDiff += diff * diff;
  }

  const distance = Math.sqrt(sumSquaredDiff / sig1.length);
  return Math.max(0, 1 - distance);
}
