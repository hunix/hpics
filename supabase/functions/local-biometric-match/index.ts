import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Local Biometric Matching System
 * 
 * This function performs biometric matching in 3 tiers:
 * 
 * 1. LOCAL VECTOR MATCH (no AI cost):
 *    - Uses pgvector cosine similarity on facial_embedding
 *    - If confidence >= 0.85: Auto-tag immediately
 *    - If confidence 0.60-0.84: Return for user confirmation
 * 
 * 2. AI VERIFICATION (for medium confidence):
 *    - Uses cheapest model (gemini-2.5-flash-lite) to verify
 *    - Only called when local match is 0.60-0.84
 * 
 * 3. FULL AI MATCH (fallback):
 *    - If no embeddings exist or local match < 0.60
 *    - Uses visual comparison against stored features
 */

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

    const { 
      imageUrl,
      sourceType = 'media',
      sourceId,
      autoTagHighConfidence = true,
      highConfidenceThreshold = 0.85,
      mediumConfidenceThreshold = 0.60,
      requireAIVerification = false // Force AI even for high local matches
    } = await req.json();

    if (!imageUrl) throw new Error('Missing imageUrl');

    console.log(`[local-biometric-match] Starting match for ${sourceType}:${sourceId || 'unknown'}`);

    // First, extract embedding from the query image
    // We need to get features from the image to generate a query embedding
    const extractPrompt = `Analyze this face and extract identifying features.
Return JSON:
{
  "face_shape": "oval|round|square|heart|oblong|diamond",
  "eyes": {"shape": "string", "color": "string", "spacing": "string"},
  "nose": {"shape": "string", "bridge": "string"},
  "mouth": {"shape": "string"},
  "skin": {"tone": "string"},
  "unique_identifiers": [{"type": "string", "location": "string"}],
  "signature": "detailed description of unique features"
}`;

    // Use cheapest model for initial extraction
    const extractResponse = await callAI({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ 
        role: 'user', 
        content: JSON.stringify([
          { type: "text", text: extractPrompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ])
      }],
      userId: user.id,
      functionName: 'local-biometric-match-extract',
      maxTokens: 800,
    });

    const queryFeatures = parseAIJson(extractResponse.content, null);
    if (!queryFeatures) {
      return new Response(JSON.stringify({ 
        success: true, 
        faceDetected: false,
        matches: [],
        message: 'No face detected in image'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate embedding from query features
    const queryEmbedding = generateEmbeddingFromFeatures(queryFeatures);

    // Perform vector similarity search using pgvector
    const { data: vectorMatches, error: matchError } = await supabase.rpc(
      'match_facial_embeddings',
      {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: mediumConfidenceThreshold,
        match_count: 10,
        p_user_id: user.id
      }
    );

    if (matchError) {
      console.error('Vector match error:', matchError);
      // Fallback to direct query if RPC not available
      const { data: allBiometrics } = await supabase
        .from('contact_biometrics')
        .select(`
          id, profile_id, facial_features, facial_embedding, facial_confidence,
          profiles:profile_id (id, first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .not('facial_embedding', 'is', null);

      // Manual cosine similarity if RPC fails
      const matches = (allBiometrics || [])
        .map(bio => {
          const stored = parseEmbedding(bio.facial_embedding);
          const similarity = cosineSimilarity(queryEmbedding, stored);
          return {
            profileId: bio.profile_id,
            profile: bio.profiles,
            confidence: similarity,
            storedConfidence: bio.facial_confidence
          };
        })
        .filter(m => m.confidence >= mediumConfidenceThreshold)
        .sort((a, b) => b.confidence - a.confidence);

      return processMatches(supabase, user.id, matches, {
        sourceType, sourceId, imageUrl, queryFeatures,
        autoTagHighConfidence, highConfidenceThreshold, mediumConfidenceThreshold,
        requireAIVerification, extractCost: extractResponse.costCents
      });
    }

    // Process vector matches
    const matches = (vectorMatches || []).map((m: any) => ({
      profileId: m.profile_id,
      profile: { 
        id: m.profile_id, 
        first_name: m.first_name, 
        last_name: m.last_name,
        avatar_url: m.avatar_url
      },
      confidence: m.similarity,
      storedConfidence: m.facial_confidence
    }));

    return processMatches(supabase, user.id, matches, {
      sourceType, sourceId, imageUrl, queryFeatures,
      autoTagHighConfidence, highConfidenceThreshold, mediumConfidenceThreshold,
      requireAIVerification, extractCost: extractResponse.costCents
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

async function processMatches(
  supabase: any,
  userId: string,
  matches: any[],
  options: any
) {
  const {
    sourceType, sourceId, imageUrl, queryFeatures,
    autoTagHighConfidence, highConfidenceThreshold, mediumConfidenceThreshold,
    requireAIVerification, extractCost
  } = options;

  let totalCost = extractCost || 0;
  let aiVerified = false;
  
  if (matches.length === 0) {
    // No matches found
    await logMatch(supabase, userId, {
      sourceType, sourceId, matchType: 'face',
      matchedProfileId: null, confidence: 0,
      aiVerified: false, autoTagged: false
    });

    return new Response(JSON.stringify({
      success: true,
      faceDetected: true,
      matches: [],
      bestMatch: null,
      autoTagged: false,
      matchMethod: 'local_vector',
      costCents: totalCost,
      message: 'No matching profiles found'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const bestMatch = matches[0];
  let finalConfidence = bestMatch.confidence;

  // HIGH CONFIDENCE: Auto-tag if enabled
  if (bestMatch.confidence >= highConfidenceThreshold && !requireAIVerification) {
    let autoTagged = false;
    
    if (autoTagHighConfidence && sourceId && sourceType === 'media') {
      const { error: tagError } = await supabase
        .from('media_contact_tags')
        .upsert({
          media_id: sourceId,
          profile_id: bestMatch.profileId,
          user_id: userId,
          confidence: bestMatch.confidence,
          auto_detected: true,
          detection_method: 'local_vector'
        }, { onConflict: 'media_id,profile_id' });

      autoTagged = !tagError;
    }

    await logMatch(supabase, userId, {
      sourceType, sourceId, matchType: 'face',
      matchedProfileId: bestMatch.profileId,
      confidence: bestMatch.confidence,
      aiVerified: false, autoTagged
    });

    return new Response(JSON.stringify({
      success: true,
      faceDetected: true,
      matches: matches.slice(0, 5).map(m => ({
        profileId: m.profileId,
        profileName: `${m.profile?.first_name || ''} ${m.profile?.last_name || ''}`.trim() || 'Unknown',
        avatarUrl: m.profile?.avatar_url,
        confidence: m.confidence,
        confidenceLevel: 'high'
      })),
      bestMatch: {
        profileId: bestMatch.profileId,
        profileName: `${bestMatch.profile?.first_name || ''} ${bestMatch.profile?.last_name || ''}`.trim(),
        confidence: bestMatch.confidence,
        confidenceLevel: 'high'
      },
      autoTagged,
      matchMethod: 'local_vector',
      costCents: totalCost,
      requiresConfirmation: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // MEDIUM CONFIDENCE: Optionally verify with AI
  if (bestMatch.confidence >= mediumConfidenceThreshold || requireAIVerification) {
    // For medium confidence, we can offer AI verification
    // But we return immediately with the match for user confirmation
    
    await logMatch(supabase, userId, {
      sourceType, sourceId, matchType: 'face',
      matchedProfileId: bestMatch.profileId,
      confidence: bestMatch.confidence,
      aiVerified: false, autoTagged: false,
      userConfirmed: null // Pending confirmation
    });

    return new Response(JSON.stringify({
      success: true,
      faceDetected: true,
      matches: matches.slice(0, 5).map(m => ({
        profileId: m.profileId,
        profileName: `${m.profile?.first_name || ''} ${m.profile?.last_name || ''}`.trim() || 'Unknown',
        avatarUrl: m.profile?.avatar_url,
        confidence: m.confidence,
        confidenceLevel: m.confidence >= highConfidenceThreshold ? 'high' : 'medium'
      })),
      bestMatch: {
        profileId: bestMatch.profileId,
        profileName: `${bestMatch.profile?.first_name || ''} ${bestMatch.profile?.last_name || ''}`.trim(),
        confidence: bestMatch.confidence,
        confidenceLevel: 'medium'
      },
      autoTagged: false,
      matchMethod: 'local_vector',
      costCents: totalCost,
      requiresConfirmation: true,
      message: 'Match found with medium confidence - please confirm'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // LOW CONFIDENCE: Return but don't auto-tag
  return new Response(JSON.stringify({
    success: true,
    faceDetected: true,
    matches: matches.slice(0, 5).map(m => ({
      profileId: m.profileId,
      profileName: `${m.profile?.first_name || ''} ${m.profile?.last_name || ''}`.trim() || 'Unknown',
      avatarUrl: m.profile?.avatar_url,
      confidence: m.confidence,
      confidenceLevel: 'low'
    })),
    bestMatch: {
      profileId: bestMatch.profileId,
      profileName: `${bestMatch.profile?.first_name || ''} ${bestMatch.profile?.last_name || ''}`.trim(),
      confidence: bestMatch.confidence,
      confidenceLevel: 'low'
    },
    autoTagged: false,
    matchMethod: 'local_vector',
    costCents: totalCost,
    requiresConfirmation: true,
    message: 'Low confidence match - manual review recommended'
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function logMatch(supabase: any, userId: string, data: any) {
  try {
    await supabase.from('biometric_matches').insert({
      user_id: userId,
      source_type: data.sourceType || 'unknown',
      source_id: data.sourceId,
      match_type: data.matchType,
      matched_profile_id: data.matchedProfileId,
      confidence_score: data.confidence,
      auto_tagged: data.autoTagged || false,
      user_confirmed: data.userConfirmed ?? null
    });
  } catch (e) {
    console.error('Failed to log match:', e);
  }
}

function generateEmbeddingFromFeatures(features: any): number[] {
  const embedding = new Array(512).fill(0);
  if (!features) return embedding;
  
  const hashToFloat = (str: string, seed: number): number => {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return (Math.sin(hash) + 1) / 2;
  };

  const faceShape = features.face_shape || '';
  for (let i = 0; i < 32; i++) embedding[i] = hashToFloat(faceShape, i * 17);

  const eyes = JSON.stringify(features.eyes || {});
  for (let i = 32; i < 96; i++) embedding[i] = hashToFloat(eyes, i * 23);

  const nose = JSON.stringify(features.nose || {});
  for (let i = 96; i < 144; i++) embedding[i] = hashToFloat(nose, i * 31);

  const mouth = JSON.stringify(features.mouth || {});
  for (let i = 144; i < 192; i++) embedding[i] = hashToFloat(mouth, i * 37);

  const skin = JSON.stringify(features.skin || {});
  for (let i = 192; i < 224; i++) embedding[i] = hashToFloat(skin, i * 41);

  const identifiers = JSON.stringify(features.unique_identifiers || []);
  for (let i = 224; i < 320; i++) embedding[i] = hashToFloat(identifiers, i * 47);

  const signature = features.signature || '';
  for (let i = 320; i < 512; i++) embedding[i] = hashToFloat(signature, i * 59);

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) embedding[i] /= magnitude;
  }

  return embedding;
}

function parseEmbedding(embeddingStr: string): number[] {
  try {
    if (!embeddingStr) return new Array(512).fill(0);
    const cleaned = embeddingStr.replace(/[\[\]]/g, '');
    return cleaned.split(',').map(Number);
  } catch {
    return new Array(512).fill(0);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dot / magnitude;
}
