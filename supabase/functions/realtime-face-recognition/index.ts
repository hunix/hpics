// Realtime Face Recognition
// Low-latency face identification from video frames

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FaceMatch {
  profileId: string;
  profileName: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  landmarks?: any;
}

interface RecognitionResult {
  facesDetected: number;
  matches: FaceMatch[];
  unknownFaces: number;
  processingTimeMs: number;
  frameId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    const { imageData, frameId, minConfidence = 0.7, returnUnknown = false } = await req.json();

    if (!imageData) throw new Error('Image data required');

    // Get enrolled face embeddings for this user
    const { data: enrolledFaces } = await supabase
      .from('biometric_samples')
      .select('profile_id, embedding, features, profiles(first_name, last_name)')
      .eq('user_id', user.id)
      .eq('biometric_type', 'face')
      .eq('status', 'processed')
      .not('embedding', 'is', null);

    if (!enrolledFaces || enrolledFaces.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        result: {
          facesDetected: 0,
          matches: [],
          unknownFaces: 0,
          processingTimeMs: Date.now() - startTime,
          frameId: frameId || crypto.randomUUID()
        },
        message: 'No enrolled faces to match against'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process frame and detect faces using AI vision
    const detectionResult = await detectFacesWithAI(imageData, supabase, user.id);
    
    const matches: FaceMatch[] = [];
    let unknownCount = 0;

    // Match detected faces against enrolled embeddings
    for (const detectedFace of detectionResult.faces) {
      let bestMatch: FaceMatch | null = null;
      let bestScore = 0;

      for (const enrolled of enrolledFaces) {
        const similarity = calculateSimilarity(detectedFace.features, enrolled.features);
        
        if (similarity > bestScore && similarity >= minConfidence) {
          bestScore = similarity;
          const profile = enrolled.profiles as any;
          bestMatch = {
            profileId: enrolled.profile_id,
            profileName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
            confidence: similarity,
            boundingBox: detectedFace.boundingBox,
            landmarks: detectedFace.landmarks
          };
        }
      }

      if (bestMatch) {
        matches.push(bestMatch);
      } else {
        unknownCount++;
        
        // Optionally flag unknown faces for review
        if (returnUnknown) {
          await supabase.from('biometric_matches').insert({
            user_id: user.id,
            source_type: 'realtime_video',
            source_id: frameId,
            match_type: 'face',
            matched_profile_id: null,
            confidence_score: 0,
            alternative_matches: detectionResult.faces.length > 1 ? enrolledFaces.slice(0, 3).map(e => ({
              profileId: e.profile_id,
              score: 0.3
            })) : [],
            auto_tagged: false
          });
        }
      }
    }

    const result: RecognitionResult = {
      facesDetected: detectionResult.faces.length,
      matches,
      unknownFaces: unknownCount,
      processingTimeMs: Date.now() - startTime,
      frameId: frameId || crypto.randomUUID()
    };

    return new Response(JSON.stringify({
      success: true,
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Face recognition error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: message,
      processingTimeMs: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

interface DetectedFace {
  boundingBox: { x: number; y: number; width: number; height: number };
  landmarks: any;
  features: Record<string, number>;
}

async function detectFacesWithAI(imageData: string, supabase: any, userId: string): Promise<{ faces: DetectedFace[] }> {
  const startTime = Date.now();

  // Use vision model for face detection
  const prompt = `Analyze this image for face detection. For each face found, provide:
1. Bounding box coordinates (x, y, width, height as percentages 0-100)
2. Key facial landmarks positions
3. Distinctive features (eye spacing, nose width, face shape, etc.)

Return JSON format:
{
  "faces": [
    {
      "boundingBox": {"x": 10, "y": 10, "width": 20, "height": 25},
      "landmarks": {"leftEye": [x,y], "rightEye": [x,y], "nose": [x,y], "mouth": [x,y]},
      "features": {
        "eyeSpacing": 0.5,
        "noseWidth": 0.3,
        "faceWidth": 0.4,
        "faceHeight": 0.5,
        "jawLine": 0.6,
        "eyebrowArch": 0.4,
        "lipFullness": 0.5,
        "cheekboneProminence": 0.5
      }
    }
  ]
}

If no faces are detected, return {"faces": []}`;

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-gateway`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}` } }
          ]
        }],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'realtime-face-recognition',
      model_name: 'gemini-2.5-flash',
      provider: 'google',
      estimated_cost_cents: 2,
      response_time_ms: Date.now() - startTime,
      status: 'success'
    });

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI face detection error:', error);
  }

  return { faces: [] };
}

function calculateSimilarity(features1: Record<string, number> | null, features2: any): number {
  if (!features1 || !features2) return 0;

  // Parse features2 if it's a string
  const f2 = typeof features2 === 'string' ? JSON.parse(features2) : features2;
  
  const keys = Object.keys(features1);
  if (keys.length === 0) return 0;

  let sumSquaredDiff = 0;
  let matchedKeys = 0;

  for (const key of keys) {
    if (f2[key] !== undefined) {
      const diff = features1[key] - f2[key];
      sumSquaredDiff += diff * diff;
      matchedKeys++;
    }
  }

  if (matchedKeys === 0) return 0;

  // Convert Euclidean distance to similarity score
  const avgSquaredDiff = sumSquaredDiff / matchedKeys;
  const distance = Math.sqrt(avgSquaredDiff);
  const similarity = Math.max(0, 1 - distance);

  return similarity;
}
