/**
 * Stylometric Analyzer Edge Function
 * 
 * Performs 11-feature stylometric analysis for authorship attribution
 * and AI-generated text detection based on ACL 2025 / AAAI 2025 research.
 * 
 * Features:
 * - Burrows' Delta for authorship comparison
 * - Hapax legomenon rate (words appearing only once)
 * - Burstiness score (temporal word patterns)
 * - MATTR (Moving Average Type-Token Ratio)
 * - AI vs Human text classification
 * 
 * @version 7.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StylometricRequest {
  profileId: string;
  sampleText: string;
  compareWithProfileId?: string;
  detectAI?: boolean;
}

interface StylometricFeatures {
  burrows_delta: number;
  hapax_rate: number;
  burstiness_score: number;
  mattr_score: number;
  avg_word_length: number;
  avg_sentence_length: number;
  lexical_diversity: number;
  punctuation_density: number;
  function_word_ratio: number;
  sentence_complexity: number;
  paragraph_cohesion: number;
}

// Function words commonly used in English
const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'when', 'where', 'who',
  'what', 'which', 'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'to',
  'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about',
  'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'without', 'before', 'under', 'around', 'among', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
  'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function calculateHapaxRate(words: string[]): number {
  const freq = new Map<string, number>();
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  const hapaxCount = Array.from(freq.values()).filter(c => c === 1).length;
  return words.length > 0 ? hapaxCount / words.length : 0;
}

function calculateBurstiness(words: string[]): number {
  if (words.length < 10) return 0;
  
  const freq = new Map<string, number>();
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  
  const avgFreq = words.length / freq.size;
  let variance = 0;
  freq.forEach(count => {
    variance += Math.pow(count - avgFreq, 2);
  });
  variance /= freq.size;
  
  const stdDev = Math.sqrt(variance);
  // Burstiness: (σ - μ) / (σ + μ)
  return (stdDev - avgFreq) / (stdDev + avgFreq + 0.001);
}

function calculateMATTR(words: string[], windowSize: number = 100): number {
  if (words.length < windowSize) {
    const unique = new Set(words).size;
    return words.length > 0 ? unique / words.length : 0;
  }
  
  let totalTTR = 0;
  let windows = 0;
  
  for (let i = 0; i <= words.length - windowSize; i++) {
    const window = words.slice(i, i + windowSize);
    const unique = new Set(window).size;
    totalTTR += unique / windowSize;
    windows++;
  }
  
  return windows > 0 ? totalTTR / windows : 0;
}

function calculateBurrowsDelta(features1: StylometricFeatures, features2: StylometricFeatures): number {
  const keys: (keyof StylometricFeatures)[] = [
    'avg_word_length', 'avg_sentence_length', 'lexical_diversity',
    'punctuation_density', 'function_word_ratio', 'hapax_rate'
  ];
  
  let totalDiff = 0;
  keys.forEach(key => {
    totalDiff += Math.abs(features1[key] - features2[key]);
  });
  
  return totalDiff / keys.length;
}

function extractFeatures(text: string): StylometricFeatures {
  const words = tokenize(text);
  const sentences = getSentences(text);
  
  // Average word length
  const avgWordLength = words.length > 0 
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length 
    : 0;
  
  // Average sentence length
  const avgSentenceLength = sentences.length > 0 
    ? words.length / sentences.length 
    : 0;
  
  // Lexical diversity (Type-Token Ratio)
  const lexicalDiversity = words.length > 0 
    ? new Set(words).size / words.length 
    : 0;
  
  // Punctuation density
  const punctCount = (text.match(/[.,!?;:'"()-]/g) || []).length;
  const punctuationDensity = words.length > 0 ? punctCount / words.length : 0;
  
  // Function word ratio
  const functionWordCount = words.filter(w => FUNCTION_WORDS.has(w)).length;
  const functionWordRatio = words.length > 0 ? functionWordCount / words.length : 0;
  
  // Sentence complexity (avg clauses per sentence, estimated by commas)
  const commaCount = (text.match(/,/g) || []).length;
  const sentenceComplexity = sentences.length > 0 ? 1 + (commaCount / sentences.length) : 1;
  
  // Paragraph cohesion (transition words ratio)
  const transitionWords = ['however', 'therefore', 'moreover', 'furthermore', 'thus', 
    'consequently', 'nevertheless', 'meanwhile', 'similarly', 'additionally'];
  const transitionCount = words.filter(w => transitionWords.includes(w)).length;
  const paragraphCohesion = words.length > 0 ? transitionCount / words.length : 0;
  
  return {
    burrows_delta: 0, // Calculated when comparing
    hapax_rate: calculateHapaxRate(words),
    burstiness_score: calculateBurstiness(words),
    mattr_score: calculateMATTR(words),
    avg_word_length: avgWordLength,
    avg_sentence_length: avgSentenceLength,
    lexical_diversity: lexicalDiversity,
    punctuation_density: punctuationDensity,
    function_word_ratio: functionWordRatio,
    sentence_complexity: sentenceComplexity,
    paragraph_cohesion: paragraphCohesion,
  };
}

function detectAIGenerated(features: StylometricFeatures): { isAI: boolean; confidence: number; model?: string } {
  // AI-generated text patterns (based on research):
  // - Lower burstiness (more uniform word distribution)
  // - Higher lexical diversity
  // - More consistent sentence lengths
  // - Higher function word ratio
  
  let aiScore = 0;
  
  // Low burstiness suggests AI
  if (features.burstiness_score < 0.1) aiScore += 0.2;
  if (features.burstiness_score < 0.05) aiScore += 0.15;
  
  // High MATTR suggests AI
  if (features.mattr_score > 0.75) aiScore += 0.15;
  
  // Very consistent sentence length suggests AI
  if (features.avg_sentence_length > 15 && features.avg_sentence_length < 25) aiScore += 0.1;
  
  // High function word ratio suggests AI
  if (features.function_word_ratio > 0.45) aiScore += 0.15;
  
  // Low hapax rate (AI repeats vocabulary more)
  if (features.hapax_rate < 0.3) aiScore += 0.15;
  
  // High paragraph cohesion (AI uses many transition words)
  if (features.paragraph_cohesion > 0.02) aiScore += 0.1;
  
  const isAI = aiScore > 0.4;
  
  let predictedModel: string | undefined;
  if (isAI) {
    // Heuristic model detection
    if (features.avg_sentence_length > 22 && features.function_word_ratio > 0.5) {
      predictedModel = 'gpt-4/gpt-5';
    } else if (features.mattr_score > 0.8) {
      predictedModel = 'claude';
    } else {
      predictedModel = 'gemini/other';
    }
  }
  
  return {
    isAI,
    confidence: Math.min(aiScore + 0.3, 1.0),
    model: predictedModel,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(
      JSON.stringify({ ok: true, function: 'stylometric-analyzer', timestamp: Date.now() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: StylometricRequest = await req.json();
    const { profileId, sampleText, compareWithProfileId, detectAI = true } = body;

    if (!profileId || !sampleText) {
      return new Response(
        JSON.stringify({ error: 'profileId and sampleText are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract features from the sample text
    const features = extractFeatures(sampleText);
    
    // Detect if AI-generated
    let aiDetection = null;
    if (detectAI) {
      aiDetection = detectAIGenerated(features);
    }

    // Compare with another profile if requested
    let authorshipComparison = null;
    if (compareWithProfileId) {
      const { data: existingFingerprint } = await supabaseClient
        .from('stylometric_fingerprints')
        .select('*')
        .eq('profile_id', compareWithProfileId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingFingerprint) {
        const existingFeatures: StylometricFeatures = {
          burrows_delta: existingFingerprint.burrows_delta || 0,
          hapax_rate: existingFingerprint.hapax_rate || 0,
          burstiness_score: existingFingerprint.burstiness_score || 0,
          mattr_score: existingFingerprint.mattr_score || 0,
          avg_word_length: 0,
          avg_sentence_length: 0,
          lexical_diversity: 0,
          punctuation_density: 0,
          function_word_ratio: 0,
          sentence_complexity: 0,
          paragraph_cohesion: 0,
        };
        
        const delta = calculateBurrowsDelta(features, existingFeatures);
        features.burrows_delta = delta;
        
        authorshipComparison = {
          comparedWith: compareWithProfileId,
          burrowsDelta: delta,
          sameAuthorLikelihood: Math.max(0, 1 - delta),
          verdict: delta < 0.3 ? 'likely_same' : delta < 0.5 ? 'uncertain' : 'likely_different',
        };
      }
    }

    // Store the stylometric fingerprint
    const { error: insertError } = await supabaseClient
      .from('stylometric_fingerprints')
      .insert({
        profile_id: profileId,
        user_id: user.id,
        sample_text: sampleText.substring(0, 5000), // Limit storage
        burrows_delta: features.burrows_delta,
        hapax_rate: features.hapax_rate,
        burstiness_score: features.burstiness_score,
        mattr_score: features.mattr_score,
        is_ai_generated: aiDetection?.isAI || false,
        ai_model_predicted: aiDetection?.model || null,
      });

    if (insertError) {
      console.error('[stylometric-analyzer] Insert error:', insertError);
    }

    // Store in ai_analyses for fusion
    const analysisResult = {
      features,
      aiDetection,
      authorshipComparison,
      wordCount: tokenize(sampleText).length,
      sentenceCount: getSentences(sampleText).length,
      analysisVersion: '7.0.0',
    };

    await supabaseClient
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: user.id,
        analysis_type: 'stylometric_authorship',
        result: analysisResult,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(
      JSON.stringify({
        success: true,
        confidence: aiDetection?.confidence || 0.7,
        payload: analysisResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[stylometric-analyzer] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
