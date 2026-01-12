import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiometricSample {
  profileId: string;
  type: 'face' | 'voice';
  embedding: number[];
  quality: number;
  timestamp: string;
  source: string;
}

interface ProfileBiometrics {
  profileId: string;
  faceEmbeddings: number[][];
  voiceEmbeddings: number[][];
  aggregateFaceEmbedding?: number[];
  aggregateVoiceEmbedding?: number[];
  faceQualityAvg: number;
  voiceQualityAvg: number;
  sampleCount: number;
  lastUpdated: string;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  
  const result = new Array(embeddings[0].length).fill(0);
  
  for (const embedding of embeddings) {
    for (let i = 0; i < embedding.length; i++) {
      result[i] += embedding[i];
    }
  }
  
  for (let i = 0; i < result.length; i++) {
    result[i] /= embeddings.length;
  }
  
  return result;
}

function findBestMatch(
  queryEmbedding: number[],
  profiles: ProfileBiometrics[],
  type: 'face' | 'voice',
  threshold: number
): { profileId: string; similarity: number } | null {
  let bestMatch: { profileId: string; similarity: number } | null = null;
  
  for (const profile of profiles) {
    const aggregateEmbedding = type === 'face' 
      ? profile.aggregateFaceEmbedding 
      : profile.aggregateVoiceEmbedding;
    
    if (!aggregateEmbedding || aggregateEmbedding.length === 0) continue;
    
    const similarity = cosineSimilarity(queryEmbedding, aggregateEmbedding);
    
    if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = {
        profileId: profile.profileId,
        similarity: Math.round(similarity * 1000) / 1000
      };
    }
  }
  
  return bestMatch;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action,
      samples,
      existingProfiles,
      queryEmbedding,
      queryType,
      matchThreshold = 0.75
    } = await req.json() as {
      action: 'learn' | 'match' | 'aggregate';
      samples?: BiometricSample[];
      existingProfiles?: ProfileBiometrics[];
      queryEmbedding?: number[];
      queryType?: 'face' | 'voice';
      matchThreshold?: number;
    };

    switch (action) {
      case 'learn': {
        if (!samples || samples.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No samples provided for learning' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Group samples by profile
        const profileSamples: Record<string, BiometricSample[]> = {};
        for (const sample of samples) {
          if (!profileSamples[sample.profileId]) {
            profileSamples[sample.profileId] = [];
          }
          profileSamples[sample.profileId].push(sample);
        }

        // Process each profile
        const updatedProfiles: ProfileBiometrics[] = [];
        
        for (const [profileId, pSamples] of Object.entries(profileSamples)) {
          const faceSamples = pSamples.filter(s => s.type === 'face');
          const voiceSamples = pSamples.filter(s => s.type === 'voice');
          
          const faceEmbeddings = faceSamples.map(s => s.embedding);
          const voiceEmbeddings = voiceSamples.map(s => s.embedding);
          
          updatedProfiles.push({
            profileId,
            faceEmbeddings,
            voiceEmbeddings,
            aggregateFaceEmbedding: faceEmbeddings.length > 0 ? averageEmbeddings(faceEmbeddings) : undefined,
            aggregateVoiceEmbedding: voiceEmbeddings.length > 0 ? averageEmbeddings(voiceEmbeddings) : undefined,
            faceQualityAvg: faceSamples.length > 0 
              ? faceSamples.reduce((sum, s) => sum + s.quality, 0) / faceSamples.length 
              : 0,
            voiceQualityAvg: voiceSamples.length > 0 
              ? voiceSamples.reduce((sum, s) => sum + s.quality, 0) / voiceSamples.length 
              : 0,
            sampleCount: pSamples.length,
            lastUpdated: new Date().toISOString()
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: 'learn',
            profilesUpdated: updatedProfiles.length,
            totalSamplesProcessed: samples.length,
            profiles: updatedProfiles
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'match': {
        if (!queryEmbedding || !queryType || !existingProfiles) {
          return new Response(
            JSON.stringify({ error: 'Missing query parameters for matching' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const match = findBestMatch(queryEmbedding, existingProfiles, queryType, matchThreshold);

        return new Response(
          JSON.stringify({
            success: true,
            action: 'match',
            match,
            threshold: matchThreshold,
            profilesSearched: existingProfiles.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'aggregate': {
        if (!existingProfiles) {
          return new Response(
            JSON.stringify({ error: 'No profiles provided for aggregation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Re-calculate aggregates for all profiles
        const aggregatedProfiles = existingProfiles.map(profile => ({
          ...profile,
          aggregateFaceEmbedding: profile.faceEmbeddings.length > 0 
            ? averageEmbeddings(profile.faceEmbeddings) 
            : undefined,
          aggregateVoiceEmbedding: profile.voiceEmbeddings.length > 0 
            ? averageEmbeddings(profile.voiceEmbeddings) 
            : undefined,
          lastUpdated: new Date().toISOString()
        }));

        return new Response(
          JSON.stringify({
            success: true,
            action: 'aggregate',
            profilesAggregated: aggregatedProfiles.length,
            profiles: aggregatedProfiles
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: learn, match, or aggregate' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in learn-biometric-patterns:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
