import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a pseudo-embedding from facial features
// This creates a 512-dimensional vector from AI-extracted feature descriptions
function generateEmbeddingFromFeatures(features: any): number[] {
  const embedding = new Array(512).fill(0);
  
  if (!features) return embedding;
  
  // Helper to hash a string to consistent float values
  const hashToFloat = (str: string, seed: number): number => {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return (Math.sin(hash) + 1) / 2; // Normalize to 0-1
  };

  // Encode face shape (dims 0-31)
  const faceShape = features.face_shape || features.faceShape || '';
  for (let i = 0; i < 32; i++) {
    embedding[i] = hashToFloat(faceShape, i * 17);
  }

  // Encode eye features (dims 32-95)
  const eyes = JSON.stringify(features.eyes || features.eyeFeatures || {});
  for (let i = 32; i < 96; i++) {
    embedding[i] = hashToFloat(eyes, i * 23);
  }

  // Encode nose features (dims 96-143)
  const nose = JSON.stringify(features.nose || features.noseFeatures || {});
  for (let i = 96; i < 144; i++) {
    embedding[i] = hashToFloat(nose, i * 31);
  }

  // Encode mouth features (dims 144-191)
  const mouth = JSON.stringify(features.mouth || features.mouthFeatures || {});
  for (let i = 144; i < 192; i++) {
    embedding[i] = hashToFloat(mouth, i * 37);
  }

  // Encode skin features (dims 192-223)
  const skin = JSON.stringify(features.skin || features.skinFeatures || {});
  for (let i = 192; i < 224; i++) {
    embedding[i] = hashToFloat(skin, i * 41);
  }

  // Encode unique identifiers (dims 224-319)
  const identifiers = JSON.stringify(features.unique_identifiers || features.uniqueMarks || []);
  for (let i = 224; i < 320; i++) {
    embedding[i] = hashToFloat(identifiers, i * 47);
  }

  // Encode age estimation (dims 320-351)
  const age = JSON.stringify(features.age_estimation || features.ageRange || {});
  for (let i = 320; i < 352; i++) {
    embedding[i] = hashToFloat(age, i * 53);
  }

  // Encode multi-view signature (dims 352-511)
  const signature = features.multi_view_signature || features.signature || '';
  for (let i = 352; i < 512; i++) {
    embedding[i] = hashToFloat(signature, i * 59);
  }

  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Invalid token');

    const { profileId, imageUrls, regenerate = false } = await req.json();
    if (!profileId) throw new Error('Missing profileId');

    // Check existing biometrics
    const { data: existing } = await supabase
      .from('contact_biometrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .maybeSingle();

    // If we have features and not regenerating, just compute embedding from existing
    if (existing?.facial_features && !regenerate && !imageUrls?.length) {
      const embedding = generateEmbeddingFromFeatures({
        ...existing.facial_features,
        unique_identifiers: existing.facial_unique_identifiers,
        age_estimation: existing.facial_age_estimation,
        multi_view_signature: existing.facial_multi_angle_data?.multi_view_signature
      });

      // Update with computed embedding
      await supabase
        .from('contact_biometrics')
        .update({ 
          facial_embedding: `[${embedding.join(',')}]`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      return new Response(JSON.stringify({ 
        success: true, 
        embeddingGenerated: true,
        fromExisting: true,
        dimensions: embedding.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Need to extract features from images first
    if (!imageUrls?.length) {
      throw new Error('No images provided and no existing features to generate embedding from');
    }

    // Use cheapest model for feature extraction
    const prompt = `Analyze these facial images and extract detailed biometric features for identification.

Return JSON with:
{
  "face_shape": "oval|round|square|heart|oblong|diamond",
  "eyes": {
    "shape": "almond|round|hooded|monolid|upturned|downturned",
    "color": "brown|blue|green|hazel|gray|black",
    "spacing": "close|average|wide",
    "size": "small|medium|large"
  },
  "nose": {
    "shape": "straight|roman|button|upturned|hawk|wide|narrow",
    "bridge": "high|medium|low|flat",
    "tip": "pointed|rounded|bulbous"
  },
  "mouth": {
    "shape": "thin|full|heart|wide|small",
    "cupid_bow": "pronounced|subtle|flat"
  },
  "skin": {
    "tone": "very_fair|fair|light|medium|olive|tan|brown|dark",
    "texture": "smooth|freckled|scarred|lined"
  },
  "unique_identifiers": [
    {"type": "mole|scar|birthmark|dimple|wrinkle", "location": "position description", "size": "small|medium|large"}
  ],
  "age_estimation": {"range": "20-30", "confidence": 0.8},
  "signature": "A detailed description of unique identifying characteristics"
}`;

    const content: any[] = [
      { type: "text", text: prompt },
      ...imageUrls.map((url: string) => ({ type: "image_url", image_url: { url } }))
    ];

    // Use flash-lite for cost efficiency
    const aiResponse = await callAI({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: JSON.stringify(content) }],
      userId: user.id,
      functionName: 'generate-facial-embedding',
      profileId,
      maxTokens: 1500,
    });

    const features = parseAIJson(aiResponse.content, null) as Record<string, any> | null;
    if (!features) {
      throw new Error('Failed to extract facial features');
    }

    // Generate embedding from extracted features
    const embedding = generateEmbeddingFromFeatures(features);

    // Save both features and embedding
    const biometricData = {
      user_id: user.id,
      profile_id: profileId,
      facial_features: features,
      facial_embedding: `[${embedding.join(',')}]`,
      facial_unique_identifiers: features.unique_identifiers || [],
      facial_age_estimation: features.age_estimation || null,
      facial_sample_count: (existing?.facial_sample_count || 0) + imageUrls.length,
      facial_confidence: 0.8,
      facial_last_updated: new Date().toISOString(),
      cross_id_enabled: true,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      await supabase.from('contact_biometrics').update(biometricData).eq('id', existing.id);
    } else {
      await supabase.from('contact_biometrics').insert(biometricData);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      embeddingGenerated: true,
      features,
      dimensions: embedding.length,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
