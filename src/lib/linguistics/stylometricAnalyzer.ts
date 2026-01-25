/**
 * Stylometric Authorship Attribution Engine (v7.0)
 * 
 * Based on ACL 2025 / AAAI 2025 research on authorship attribution
 * and AI-generated text detection. Implements 11-feature stylometric suite.
 * 
 * References:
 * - Burrows' Delta (2002) for authorship attribution
 * - MATTR (Moving-Average Type-Token Ratio) for vocabulary richness
 * - Hapax legomenon analysis for unique word patterns
 * - LLM detection via perplexity and burstiness metrics
 */

export interface StylometricFeatures {
  // Core lexical features
  avgWordLength: number;
  avgSentenceLength: number;
  vocabularyRichness: number; // Type-Token Ratio
  hapaxRate: number; // Words appearing only once / total words
  disLegomenaRate: number; // Words appearing exactly twice
  
  // Syntactic features
  punctuationPatterns: Record<string, number>;
  sentenceStartPatterns: Record<string, number>;
  
  // Stylometric metrics
  burrowsDelta: number;
  mattr: number; // Moving-Average Type-Token Ratio
  burstiessScore: number; // Vocabulary burstiness
  lexicalDensity: number; // Content words / total words
  
  // Function word frequencies
  functionWordFrequencies: Record<string, number>;
  
  // N-gram patterns
  bigramFrequencies: Record<string, number>;
  trigramFrequencies: Record<string, number>;
}

export interface AIDetectionResult {
  isAiGenerated: boolean;
  confidence: number;
  predictedModel: string | null;
  indicators: string[];
  perplexityScore: number;
  burstinessEvidence: string[];
}

export interface AuthorshipMatch {
  matchedProfileId: string;
  similarity: number;
  matchingFeatures: string[];
  divergentFeatures: string[];
  confidence: number;
}

export interface StylometricAnalysis {
  features: StylometricFeatures;
  aiDetection: AIDetectionResult;
  authorshipMatches: AuthorshipMatch[];
  featureVector: number[];
  sampleWordCount: number;
  analysisTimestamp: Date;
}

// Common English function words for analysis
const FUNCTION_WORDS = [
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'because', 'as',
  'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 
  'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'can', 'will', 'just', 'should', 'now', 'i', 'you', 'he',
  'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would',
  'could', 'might', 'must', 'shall', 'may',
];

// Content word POS patterns (nouns, verbs, adjectives, adverbs)
const CONTENT_WORD_SUFFIXES = [
  'tion', 'sion', 'ment', 'ness', 'ity', 'ance', 'ence', 'ly', 'ful', 'less',
  'able', 'ible', 'ous', 'ive', 'al', 'ical', 'ed', 'ing', 'er', 'est',
];

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Split text into sentences
 */
function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Calculate Type-Token Ratio (vocabulary richness)
 */
function calculateTTR(words: string[]): number {
  if (words.length === 0) return 0;
  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length;
}

/**
 * Calculate Moving-Average Type-Token Ratio (MATTR)
 * More reliable for varying text lengths
 */
function calculateMATTR(words: string[], windowSize: number = 50): number {
  if (words.length < windowSize) {
    return calculateTTR(words);
  }
  
  let totalTTR = 0;
  let windowCount = 0;
  
  for (let i = 0; i <= words.length - windowSize; i++) {
    const window = words.slice(i, i + windowSize);
    totalTTR += calculateTTR(window);
    windowCount++;
  }
  
  return windowCount > 0 ? totalTTR / windowCount : 0;
}

/**
 * Calculate hapax legomena rate (words appearing exactly once)
 */
function calculateHapaxRate(words: string[]): number {
  if (words.length === 0) return 0;
  
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }
  
  let hapaxCount = 0;
  for (const count of wordCounts.values()) {
    if (count === 1) hapaxCount++;
  }
  
  return hapaxCount / words.length;
}

/**
 * Calculate dis legomena rate (words appearing exactly twice)
 */
function calculateDisLegomenaRate(words: string[]): number {
  if (words.length === 0) return 0;
  
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }
  
  let disCount = 0;
  for (const count of wordCounts.values()) {
    if (count === 2) disCount++;
  }
  
  return disCount / words.length;
}

/**
 * Calculate Burrows' Delta distance
 * Used for authorship attribution
 */
export function calculateBurrowsDelta(
  features1: StylometricFeatures,
  features2: StylometricFeatures
): number {
  const vector1 = extractFeatureVector(features1);
  const vector2 = extractFeatureVector(features2);
  
  if (vector1.length !== vector2.length) return 1;
  
  let totalDelta = 0;
  for (let i = 0; i < vector1.length; i++) {
    totalDelta += Math.abs(vector1[i] - vector2[i]);
  }
  
  return totalDelta / vector1.length;
}

/**
 * Extract numerical feature vector for comparison
 */
function extractFeatureVector(features: StylometricFeatures): number[] {
  const vector: number[] = [
    features.avgWordLength,
    features.avgSentenceLength,
    features.vocabularyRichness,
    features.hapaxRate,
    features.disLegomenaRate,
    features.mattr,
    features.burstiessScore,
    features.lexicalDensity,
  ];
  
  // Add function word frequencies (top 50)
  const topFunctionWords = FUNCTION_WORDS.slice(0, 50);
  for (const word of topFunctionWords) {
    vector.push(features.functionWordFrequencies[word] || 0);
  }
  
  return vector;
}

/**
 * Calculate punctuation patterns
 */
function analyzePunctuationPatterns(text: string): Record<string, number> {
  const totalChars = text.length;
  if (totalChars === 0) return {};
  
  const patterns: Record<string, number> = {};
  const punctuation = ['.', ',', '!', '?', ';', ':', '-', '\'', '"', '(', ')'];
  
  for (const p of punctuation) {
    const count = (text.match(new RegExp('\\' + p, 'g')) || []).length;
    patterns[p] = count / totalChars;
  }
  
  return patterns;
}

/**
 * Calculate function word frequencies
 */
function calculateFunctionWordFrequencies(words: string[]): Record<string, number> {
  const frequencies: Record<string, number> = {};
  const totalWords = words.length;
  
  if (totalWords === 0) return frequencies;
  
  for (const funcWord of FUNCTION_WORDS) {
    const count = words.filter(w => w === funcWord).length;
    frequencies[funcWord] = count / totalWords;
  }
  
  return frequencies;
}

/**
 * Calculate lexical density (content words / total words)
 */
function calculateLexicalDensity(words: string[]): number {
  if (words.length === 0) return 0;
  
  const contentWords = words.filter(word => {
    // Not a function word
    if (FUNCTION_WORDS.includes(word)) return false;
    
    // Has content word suffix
    for (const suffix of CONTENT_WORD_SUFFIXES) {
      if (word.endsWith(suffix)) return true;
    }
    
    // Word longer than 3 chars and not function word
    return word.length > 3;
  });
  
  return contentWords.length / words.length;
}

/**
 * Calculate vocabulary burstiness
 * AI text tends to have more uniform word distribution
 */
function calculateBurstiness(words: string[]): number {
  if (words.length < 10) return 0.5;
  
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }
  
  const counts = Array.from(wordCounts.values());
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
  const std = Math.sqrt(variance);
  
  // Burstiness = (std - mean) / (std + mean)
  // Higher values indicate more bursty (human-like) patterns
  if (std + mean === 0) return 0;
  return (std - mean) / (std + mean);
}

/**
 * Calculate sentence start patterns
 */
function analyzeSentenceStarts(sentences: string[]): Record<string, number> {
  const patterns: Record<string, number> = {};
  const total = sentences.length;
  
  if (total === 0) return patterns;
  
  for (const sentence of sentences) {
    const words = tokenize(sentence);
    if (words.length > 0) {
      const firstWord = words[0];
      patterns[firstWord] = (patterns[firstWord] || 0) + 1;
    }
  }
  
  // Normalize
  for (const key of Object.keys(patterns)) {
    patterns[key] = patterns[key] / total;
  }
  
  return patterns;
}

/**
 * Generate bigram frequencies
 */
function calculateBigramFrequencies(words: string[]): Record<string, number> {
  const bigrams: Record<string, number> = {};
  const total = Math.max(1, words.length - 1);
  
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    bigrams[bigram] = (bigrams[bigram] || 0) + 1;
  }
  
  // Normalize
  for (const key of Object.keys(bigrams)) {
    bigrams[key] = bigrams[key] / total;
  }
  
  return bigrams;
}

/**
 * Generate trigram frequencies
 */
function calculateTrigramFrequencies(words: string[]): Record<string, number> {
  const trigrams: Record<string, number> = {};
  const total = Math.max(1, words.length - 2);
  
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    trigrams[trigram] = (trigrams[trigram] || 0) + 1;
  }
  
  // Normalize
  for (const key of Object.keys(trigrams)) {
    trigrams[key] = trigrams[key] / total;
  }
  
  return trigrams;
}

/**
 * Detect if text is AI-generated
 * Based on perplexity and burstiness analysis
 */
function detectAIGenerated(
  features: StylometricFeatures,
  text: string
): AIDetectionResult {
  const indicators: string[] = [];
  const burstinessEvidence: string[] = [];
  let aiScore = 0;
  
  // 1. Low burstiness (AI text is more uniform)
  if (features.burstiessScore < -0.2) {
    aiScore += 0.2;
    burstinessEvidence.push('Vocabulary distribution is unusually uniform');
    indicators.push('Low vocabulary burstiness');
  }
  
  // 2. Unnaturally consistent sentence lengths
  const sentences = splitSentences(text);
  const sentenceLengths = sentences.map(s => tokenize(s).length);
  const lengthStd = calculateStd(sentenceLengths);
  if (lengthStd < 5 && sentenceLengths.length > 5) {
    aiScore += 0.15;
    indicators.push('Sentence lengths suspiciously consistent');
  }
  
  // 3. Overuse of certain transition phrases
  const transitionPhrases = ['however', 'furthermore', 'moreover', 'additionally', 'consequently'];
  let transitionCount = 0;
  const lowerText = text.toLowerCase();
  for (const phrase of transitionPhrases) {
    if (lowerText.includes(phrase)) transitionCount++;
  }
  if (transitionCount >= 3) {
    aiScore += 0.1;
    indicators.push('High frequency of formal transition phrases');
  }
  
  // 4. Perfect grammatical structure (rare in human writing)
  if (features.punctuationPatterns['.'] > 0.03 && features.punctuationPatterns['!'] < 0.001) {
    aiScore += 0.1;
    indicators.push('Absence of emphatic punctuation');
  }
  
  // 5. Low hapax rate (AI reuses vocabulary more)
  if (features.hapaxRate < 0.3) {
    aiScore += 0.15;
    indicators.push('Low unique word rate');
    burstinessEvidence.push('Repeated vocabulary patterns typical of LLMs');
  }
  
  // 6. High lexical density (AI tends to use more content words)
  if (features.lexicalDensity > 0.6) {
    aiScore += 0.1;
    indicators.push('Unusually high lexical density');
  }
  
  // 7. Lack of first-person informal markers
  const informalMarkers = ['kinda', 'gonna', 'wanna', 'yeah', 'nah', 'lol', 'haha'];
  let hasInformal = false;
  for (const marker of informalMarkers) {
    if (lowerText.includes(marker)) {
      hasInformal = true;
      break;
    }
  }
  if (!hasInformal && text.length > 500) {
    aiScore += 0.05;
    indicators.push('No informal language markers');
  }
  
  // Calculate perplexity proxy (based on vocabulary patterns)
  const perplexityScore = 1 - features.vocabularyRichness * features.hapaxRate;
  
  // Determine predicted model based on patterns
  let predictedModel: string | null = null;
  if (aiScore > 0.4) {
    if (features.avgSentenceLength > 20) {
      predictedModel = 'GPT-4 or Claude';
    } else if (features.avgSentenceLength < 12) {
      predictedModel = 'GPT-3.5 or Gemini';
    } else {
      predictedModel = 'Unknown LLM';
    }
  }
  
  return {
    isAiGenerated: aiScore > 0.35,
    confidence: Math.min(1, aiScore * 1.5),
    predictedModel,
    indicators,
    perplexityScore,
    burstinessEvidence,
  };
}

/**
 * Calculate standard deviation
 */
function calculateStd(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Main analysis function - extract all stylometric features from text
 */
export function analyzeStylometry(text: string): StylometricAnalysis {
  const words = tokenize(text);
  const sentences = splitSentences(text);
  
  // Calculate basic features
  const avgWordLength = words.length > 0 
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length 
    : 0;
  
  const avgSentenceLength = sentences.length > 0
    ? sentences.map(s => tokenize(s).length).reduce((a, b) => a + b, 0) / sentences.length
    : 0;
  
  const features: StylometricFeatures = {
    avgWordLength,
    avgSentenceLength,
    vocabularyRichness: calculateTTR(words),
    hapaxRate: calculateHapaxRate(words),
    disLegomenaRate: calculateDisLegomenaRate(words),
    punctuationPatterns: analyzePunctuationPatterns(text),
    sentenceStartPatterns: analyzeSentenceStarts(sentences),
    burrowsDelta: 0, // Set when comparing to reference
    mattr: calculateMATTR(words),
    burstiessScore: calculateBurstiness(words),
    lexicalDensity: calculateLexicalDensity(words),
    functionWordFrequencies: calculateFunctionWordFrequencies(words),
    bigramFrequencies: calculateBigramFrequencies(words),
    trigramFrequencies: calculateTrigramFrequencies(words),
  };
  
  const aiDetection = detectAIGenerated(features, text);
  const featureVector = extractFeatureVector(features);
  
  return {
    features,
    aiDetection,
    authorshipMatches: [], // Populated when comparing against known authors
    featureVector,
    sampleWordCount: words.length,
    analysisTimestamp: new Date(),
  };
}

/**
 * Compare two texts for authorship attribution
 */
export function compareAuthorship(
  text1: string,
  text2: string,
  profile1Id: string,
  profile2Id: string
): AuthorshipMatch {
  const analysis1 = analyzeStylometry(text1);
  const analysis2 = analyzeStylometry(text2);
  
  const delta = calculateBurrowsDelta(analysis1.features, analysis2.features);
  
  // Convert delta to similarity (lower delta = higher similarity)
  const similarity = Math.max(0, 1 - delta);
  
  const matchingFeatures: string[] = [];
  const divergentFeatures: string[] = [];
  
  // Compare key features
  if (Math.abs(analysis1.features.avgWordLength - analysis2.features.avgWordLength) < 0.5) {
    matchingFeatures.push('Average word length');
  } else {
    divergentFeatures.push('Average word length');
  }
  
  if (Math.abs(analysis1.features.avgSentenceLength - analysis2.features.avgSentenceLength) < 3) {
    matchingFeatures.push('Sentence structure');
  } else {
    divergentFeatures.push('Sentence structure');
  }
  
  if (Math.abs(analysis1.features.hapaxRate - analysis2.features.hapaxRate) < 0.1) {
    matchingFeatures.push('Vocabulary uniqueness');
  } else {
    divergentFeatures.push('Vocabulary uniqueness');
  }
  
  if (Math.abs(analysis1.features.lexicalDensity - analysis2.features.lexicalDensity) < 0.1) {
    matchingFeatures.push('Lexical density');
  } else {
    divergentFeatures.push('Lexical density');
  }
  
  // Calculate confidence based on sample sizes and feature agreement
  const sampleConfidence = Math.min(1, Math.min(analysis1.sampleWordCount, analysis2.sampleWordCount) / 500);
  const featureConfidence = matchingFeatures.length / (matchingFeatures.length + divergentFeatures.length);
  const confidence = (sampleConfidence + featureConfidence) / 2;
  
  return {
    matchedProfileId: similarity > 0.7 ? profile2Id : '',
    similarity,
    matchingFeatures,
    divergentFeatures,
    confidence,
  };
}

/**
 * Batch analyze multiple text samples for a profile
 */
export function analyzeProfileWritingStyle(
  samples: string[],
  profileId: string
): {
  aggregatedFeatures: StylometricFeatures;
  consistency: number;
  aiGeneratedSamples: number[];
  totalSamples: number;
} {
  if (samples.length === 0) {
    throw new Error('No samples provided for analysis');
  }
  
  const analyses = samples.map(s => analyzeStylometry(s));
  const aiGeneratedSamples = analyses
    .map((a, i) => a.aiDetection.isAiGenerated ? i : -1)
    .filter(i => i >= 0);
  
  // Aggregate features by averaging
  const aggregatedFeatures: StylometricFeatures = {
    avgWordLength: average(analyses.map(a => a.features.avgWordLength)),
    avgSentenceLength: average(analyses.map(a => a.features.avgSentenceLength)),
    vocabularyRichness: average(analyses.map(a => a.features.vocabularyRichness)),
    hapaxRate: average(analyses.map(a => a.features.hapaxRate)),
    disLegomenaRate: average(analyses.map(a => a.features.disLegomenaRate)),
    punctuationPatterns: mergePatterns(analyses.map(a => a.features.punctuationPatterns)),
    sentenceStartPatterns: mergePatterns(analyses.map(a => a.features.sentenceStartPatterns)),
    burrowsDelta: 0,
    mattr: average(analyses.map(a => a.features.mattr)),
    burstiessScore: average(analyses.map(a => a.features.burstiessScore)),
    lexicalDensity: average(analyses.map(a => a.features.lexicalDensity)),
    functionWordFrequencies: mergePatterns(analyses.map(a => a.features.functionWordFrequencies)),
    bigramFrequencies: mergePatterns(analyses.map(a => a.features.bigramFrequencies)),
    trigramFrequencies: mergePatterns(analyses.map(a => a.features.trigramFrequencies)),
  };
  
  // Calculate consistency (how similar are the samples to each other)
  let totalDelta = 0;
  let comparisons = 0;
  for (let i = 0; i < analyses.length; i++) {
    for (let j = i + 1; j < analyses.length; j++) {
      totalDelta += calculateBurrowsDelta(analyses[i].features, analyses[j].features);
      comparisons++;
    }
  }
  const consistency = comparisons > 0 ? 1 - (totalDelta / comparisons) : 1;
  
  return {
    aggregatedFeatures,
    consistency,
    aiGeneratedSamples,
    totalSamples: samples.length,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function mergePatterns(patterns: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {};
  const counts: Record<string, number> = {};
  
  for (const pattern of patterns) {
    for (const [key, value] of Object.entries(pattern)) {
      merged[key] = (merged[key] || 0) + value;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  
  // Average
  for (const key of Object.keys(merged)) {
    merged[key] = merged[key] / counts[key];
  }
  
  return merged;
}
