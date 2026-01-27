/**
 * LLM Detection Engine (v9.0)
 * 
 * Distinguishes human vs. LLM-generated text using
 * Burrows' Delta clustering, model fingerprinting, and perplexity analysis.
 * 
 * @version 9.0
 */

import { analyzeStylometry, calculateBurrowsDelta, type StylometricFeatures } from './stylometricAnalyzer';

export interface LLMDetectionResult {
  isLLMGenerated: boolean;
  confidence: number;
  predictedModel: LLMModel | null;
  modelConfidences: Record<LLMModel, number>;
  indicators: DetectionIndicator[];
  perplexityAnalysis: PerplexityAnalysis;
  burstinessAnalysis: BurstinessAnalysis;
  stylometricDeviation: number;
}

export interface DetectionIndicator {
  name: string;
  score: number;
  weight: number;
  humanTypical: string;
  llmTypical: string;
  observed: string;
}

export interface PerplexityAnalysis {
  estimatedPerplexity: number;
  uniformityScore: number;
  surprisalVariance: number;
  isLowPerplexity: boolean;
}

export interface BurstinessAnalysis {
  burstiessScore: number;
  varianceRatio: number;
  isUniformDistribution: boolean;
  clusteringCoefficient: number;
}

export type LLMModel = 
  | 'gpt-4'
  | 'gpt-3.5'
  | 'claude-3'
  | 'claude-2'
  | 'gemini-pro'
  | 'gemini-flash'
  | 'llama-3'
  | 'mistral'
  | 'unknown-llm';

// Model-specific stylometric signatures (approximate)
const MODEL_SIGNATURES: Record<LLMModel, Partial<StylometricFeatures>> = {
  'gpt-4': {
    avgSentenceLength: 18,
    vocabularyRichness: 0.65,
    hapaxRate: 0.35,
    lexicalDensity: 0.55,
  },
  'gpt-3.5': {
    avgSentenceLength: 15,
    vocabularyRichness: 0.60,
    hapaxRate: 0.32,
    lexicalDensity: 0.52,
  },
  'claude-3': {
    avgSentenceLength: 20,
    vocabularyRichness: 0.68,
    hapaxRate: 0.38,
    lexicalDensity: 0.58,
  },
  'claude-2': {
    avgSentenceLength: 19,
    vocabularyRichness: 0.64,
    hapaxRate: 0.36,
    lexicalDensity: 0.56,
  },
  'gemini-pro': {
    avgSentenceLength: 17,
    vocabularyRichness: 0.62,
    hapaxRate: 0.34,
    lexicalDensity: 0.54,
  },
  'gemini-flash': {
    avgSentenceLength: 14,
    vocabularyRichness: 0.58,
    hapaxRate: 0.30,
    lexicalDensity: 0.50,
  },
  'llama-3': {
    avgSentenceLength: 16,
    vocabularyRichness: 0.61,
    hapaxRate: 0.33,
    lexicalDensity: 0.53,
  },
  'mistral': {
    avgSentenceLength: 15,
    vocabularyRichness: 0.59,
    hapaxRate: 0.31,
    lexicalDensity: 0.51,
  },
  'unknown-llm': {
    avgSentenceLength: 16,
    vocabularyRichness: 0.60,
    hapaxRate: 0.32,
    lexicalDensity: 0.52,
  },
};

// Human writing signature ranges
const HUMAN_SIGNATURE = {
  avgSentenceLength: { min: 8, max: 25, variance: 8 },
  vocabularyRichness: { min: 0.45, max: 0.80, variance: 0.15 },
  hapaxRate: { min: 0.35, max: 0.55, variance: 0.10 },
  lexicalDensity: { min: 0.40, max: 0.65, variance: 0.12 },
  burstiessScore: { min: -0.1, max: 0.3, variance: 0.15 },
};

/**
 * Estimate text perplexity without an actual LLM
 * Uses vocabulary patterns as a proxy
 */
function estimatePerplexity(text: string, features: StylometricFeatures): PerplexityAnalysis {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  // Calculate word frequency distribution
  const wordFreqs = new Map<string, number>();
  for (const word of words) {
    wordFreqs.set(word, (wordFreqs.get(word) || 0) + 1);
  }
  
  // Calculate entropy as perplexity proxy
  let entropy = 0;
  for (const count of wordFreqs.values()) {
    const p = count / words.length;
    entropy -= p * Math.log2(p);
  }
  
  // Normalized perplexity estimate (2^entropy)
  const estimatedPerplexity = Math.pow(2, entropy);
  
  // Uniformity score (how uniform is word distribution)
  const freqs = Array.from(wordFreqs.values());
  const avgFreq = freqs.reduce((a, b) => a + b, 0) / freqs.length;
  const variance = freqs.reduce((sum, f) => sum + Math.pow(f - avgFreq, 2), 0) / freqs.length;
  const uniformityScore = 1 / (1 + variance);
  
  // Surprisal variance (how much does surprisal vary)
  const surprisals = freqs.map(f => -Math.log2(f / words.length));
  const avgSurprisal = surprisals.reduce((a, b) => a + b, 0) / surprisals.length;
  const surprisalVariance = surprisals.reduce((sum, s) => sum + Math.pow(s - avgSurprisal, 2), 0) / surprisals.length;
  
  return {
    estimatedPerplexity,
    uniformityScore,
    surprisalVariance,
    isLowPerplexity: estimatedPerplexity < 50 && uniformityScore > 0.3,
  };
}

/**
 * Analyze vocabulary burstiness
 */
function analyzeBurstiness(text: string, features: StylometricFeatures): BurstinessAnalysis {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  // Calculate word frequency variance across sentences
  const sentenceVocabs = sentences.map(s => 
    new Set(s.toLowerCase().split(/\s+/).filter(w => w.length > 0))
  );
  
  // Calculate overlap coefficients between consecutive sentences
  let overlapSum = 0;
  for (let i = 1; i < sentenceVocabs.length; i++) {
    const prev = sentenceVocabs[i - 1];
    const curr = sentenceVocabs[i];
    const intersection = new Set([...prev].filter(w => curr.has(w)));
    const union = new Set([...prev, ...curr]);
    overlapSum += intersection.size / union.size;
  }
  const clusteringCoefficient = sentenceVocabs.length > 1 
    ? overlapSum / (sentenceVocabs.length - 1) 
    : 0;
  
  // Calculate variance ratio (inter-sentence vs intra-sentence)
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }
  
  const counts = Array.from(wordCounts.values());
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
  const std = Math.sqrt(variance);
  
  const burstiessScore = mean + std > 0 ? (std - mean) / (std + mean) : 0;
  const varianceRatio = mean > 0 ? variance / mean : 0;
  
  return {
    burstiessScore,
    varianceRatio,
    isUniformDistribution: burstiessScore < -0.2,
    clusteringCoefficient,
  };
}

/**
 * Calculate stylometric deviation from model signature
 */
function calculateModelDeviation(
  features: StylometricFeatures,
  modelSignature: Partial<StylometricFeatures>
): number {
  let totalDeviation = 0;
  let count = 0;
  
  if (modelSignature.avgSentenceLength !== undefined) {
    totalDeviation += Math.abs(features.avgSentenceLength - modelSignature.avgSentenceLength) / 20;
    count++;
  }
  if (modelSignature.vocabularyRichness !== undefined) {
    totalDeviation += Math.abs(features.vocabularyRichness - modelSignature.vocabularyRichness);
    count++;
  }
  if (modelSignature.hapaxRate !== undefined) {
    totalDeviation += Math.abs(features.hapaxRate - modelSignature.hapaxRate);
    count++;
  }
  if (modelSignature.lexicalDensity !== undefined) {
    totalDeviation += Math.abs(features.lexicalDensity - modelSignature.lexicalDensity);
    count++;
  }
  
  return count > 0 ? totalDeviation / count : 0.5;
}

/**
 * Generate detection indicators
 */
function generateIndicators(
  features: StylometricFeatures,
  perplexity: PerplexityAnalysis,
  burstiness: BurstinessAnalysis
): DetectionIndicator[] {
  const indicators: DetectionIndicator[] = [];
  
  // Vocabulary richness indicator
  const vocabScore = features.vocabularyRichness < 0.5 || features.vocabularyRichness > 0.75 ? 0.3 : 0.7;
  indicators.push({
    name: 'Vocabulary Richness',
    score: vocabScore,
    weight: 0.15,
    humanTypical: '0.45-0.80 with high variance',
    llmTypical: '0.55-0.70 with low variance',
    observed: features.vocabularyRichness.toFixed(3),
  });
  
  // Sentence length uniformity
  const sentenceScore = features.avgSentenceLength > 12 && features.avgSentenceLength < 22 ? 0.6 : 0.4;
  indicators.push({
    name: 'Sentence Length',
    score: sentenceScore,
    weight: 0.10,
    humanTypical: '8-25 words with high variance',
    llmTypical: '14-20 words with low variance',
    observed: features.avgSentenceLength.toFixed(1),
  });
  
  // Burstiness indicator
  const burstScore = burstiness.isUniformDistribution ? 0.8 : 0.3;
  indicators.push({
    name: 'Vocabulary Burstiness',
    score: burstScore,
    weight: 0.20,
    humanTypical: 'Bursty distribution (score > -0.1)',
    llmTypical: 'Uniform distribution (score < -0.2)',
    observed: burstiness.burstiessScore.toFixed(3),
  });
  
  // Perplexity indicator
  const perplexityScore = perplexity.isLowPerplexity ? 0.7 : 0.3;
  indicators.push({
    name: 'Perplexity Proxy',
    score: perplexityScore,
    weight: 0.20,
    humanTypical: 'Higher perplexity, varied surprisal',
    llmTypical: 'Lower perplexity, uniform surprisal',
    observed: `${perplexity.estimatedPerplexity.toFixed(1)} (${perplexity.isLowPerplexity ? 'low' : 'normal'})`,
  });
  
  // Hapax rate indicator
  const hapaxScore = features.hapaxRate < HUMAN_SIGNATURE.hapaxRate.min ? 0.7 : 0.3;
  indicators.push({
    name: 'Hapax Legomena Rate',
    score: hapaxScore,
    weight: 0.15,
    humanTypical: '0.35-0.55 (many unique words)',
    llmTypical: '0.30-0.38 (word reuse)',
    observed: features.hapaxRate.toFixed(3),
  });
  
  // Lexical density indicator
  const densityScore = features.lexicalDensity > 0.55 ? 0.6 : 0.4;
  indicators.push({
    name: 'Lexical Density',
    score: densityScore,
    weight: 0.10,
    humanTypical: '0.40-0.55 (more function words)',
    llmTypical: '0.50-0.60 (more content words)',
    observed: features.lexicalDensity.toFixed(3),
  });
  
  // Clustering coefficient
  const clusterScore = burstiness.clusteringCoefficient > 0.3 ? 0.4 : 0.6;
  indicators.push({
    name: 'Sentence Clustering',
    score: clusterScore,
    weight: 0.10,
    humanTypical: 'Higher clustering (topic consistency)',
    llmTypical: 'Lower clustering (more varied)',
    observed: burstiness.clusteringCoefficient.toFixed(3),
  });
  
  return indicators;
}

/**
 * Detect LLM-generated text
 */
export function detectLLMGenerated(text: string): LLMDetectionResult {
  const analysis = analyzeStylometry(text);
  const features = analysis.features;
  
  const perplexity = estimatePerplexity(text, features);
  const burstiness = analyzeBurstiness(text, features);
  const indicators = generateIndicators(features, perplexity, burstiness);
  
  // Calculate weighted score
  let totalScore = 0;
  let totalWeight = 0;
  for (const indicator of indicators) {
    totalScore += indicator.score * indicator.weight;
    totalWeight += indicator.weight;
  }
  const llmProbability = totalWeight > 0 ? totalScore / totalWeight : 0.5;
  
  // Match against model signatures
  const modelConfidences: Record<LLMModel, number> = {} as Record<LLMModel, number>;
  let bestModel: LLMModel = 'unknown-llm';
  let bestModelScore = 0;
  
  for (const [model, signature] of Object.entries(MODEL_SIGNATURES)) {
    const deviation = calculateModelDeviation(features, signature);
    const confidence = Math.max(0, 1 - deviation);
    modelConfidences[model as LLMModel] = confidence;
    
    if (confidence > bestModelScore) {
      bestModelScore = confidence;
      bestModel = model as LLMModel;
    }
  }
  
  // Calculate overall confidence
  const isLLMGenerated = llmProbability > 0.5;
  const confidence = Math.abs(llmProbability - 0.5) * 2;
  
  return {
    isLLMGenerated,
    confidence,
    predictedModel: isLLMGenerated ? bestModel : null,
    modelConfidences,
    indicators,
    perplexityAnalysis: perplexity,
    burstinessAnalysis: burstiness,
    stylometricDeviation: calculateModelDeviation(features, MODEL_SIGNATURES['unknown-llm']),
  };
}

/**
 * Compare text to reference human/LLM samples
 */
export function compareToReferences(
  text: string,
  humanReferences: string[],
  llmReferences: string[]
): { humanSimilarity: number; llmSimilarity: number; verdict: 'human' | 'llm' | 'uncertain' } {
  const targetAnalysis = analyzeStylometry(text);
  
  let humanDistance = 0;
  for (const ref of humanReferences) {
    const refAnalysis = analyzeStylometry(ref);
    humanDistance += calculateBurrowsDelta(targetAnalysis.features, refAnalysis.features);
  }
  humanDistance /= Math.max(1, humanReferences.length);
  
  let llmDistance = 0;
  for (const ref of llmReferences) {
    const refAnalysis = analyzeStylometry(ref);
    llmDistance += calculateBurrowsDelta(targetAnalysis.features, refAnalysis.features);
  }
  llmDistance /= Math.max(1, llmReferences.length);
  
  const humanSimilarity = 1 / (1 + humanDistance);
  const llmSimilarity = 1 / (1 + llmDistance);
  
  let verdict: 'human' | 'llm' | 'uncertain' = 'uncertain';
  if (humanSimilarity > llmSimilarity * 1.2) {
    verdict = 'human';
  } else if (llmSimilarity > humanSimilarity * 1.2) {
    verdict = 'llm';
  }
  
  return { humanSimilarity, llmSimilarity, verdict };
}
