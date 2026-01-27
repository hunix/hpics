/**
 * Cognitive Load Analyzer Engine (v9.0)
 * 
 * Measures mental effort during deception through response latency,
 * linguistic complexity under load, and concurrent task errors.
 * 
 * @version 9.0
 */

export interface CognitiveLoadMetrics {
  overallLoad: number; // 0-1
  loadLevel: 'low' | 'moderate' | 'high' | 'extreme';
  components: LoadComponents;
  temporalPattern: TemporalPattern;
  linguisticIndicators: LinguisticIndicator[];
  deceptionProbability: number;
  confidence: number;
}

export interface LoadComponents {
  responseLatency: LatencyMetrics;
  linguisticComplexity: ComplexityMetrics;
  errorPatterns: ErrorMetrics;
  pausePatterns: PauseMetrics;
}

export interface LatencyMetrics {
  averageResponseTime: number; // ms
  responseTimeVariance: number;
  initialPauseLength: number;
  normalizedLatency: number; // 0-1, compared to baseline
  isDelayed: boolean;
}

export interface ComplexityMetrics {
  sentenceComplexity: number; // Average subordinate clauses
  vocabularyLevel: number;
  grammarErrors: number;
  simplificationUnderLoad: boolean;
  complexityChange: number; // Change from baseline
}

export interface ErrorMetrics {
  speechErrors: number;
  corrections: number;
  falseStarts: number;
  fillerWords: number;
  errorRate: number; // Errors per 100 words
}

export interface PauseMetrics {
  totalPauseTime: number;
  pauseCount: number;
  averagePauseDuration: number;
  midSentencePauses: number;
  pauseDistribution: 'normal' | 'front-loaded' | 'scattered';
}

export interface TemporalPattern {
  segments: TemporalSegment[];
  loadProgression: 'stable' | 'increasing' | 'decreasing' | 'variable';
  peakLoadSegment: number;
  recoveryPattern: 'quick' | 'slow' | 'none';
}

export interface TemporalSegment {
  index: number;
  startRatio: number;
  endRatio: number;
  loadScore: number;
  dominantIndicators: string[];
}

export interface LinguisticIndicator {
  type: string;
  count: number;
  normalizedFrequency: number;
  deceptionWeight: number;
  examples: string[];
}

// Filler words and hesitation markers
const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically',
  'actually', 'honestly', 'literally', 'so', 'well', 'I mean',
];

// Speech error patterns
const ERROR_PATTERNS = {
  falseStarts: /\b(\w+)\s+(\1\s+)/gi,
  corrections: /\b(no|I mean|sorry|wait|actually)\s+/gi,
  repetitions: /\b(\w+)\s+\1\b/gi,
  truncations: /\b\w+-\s/g,
};

// Cognitive load indicators in text
const LOAD_INDICATORS = {
  hedges: ['maybe', 'perhaps', 'possibly', 'might', 'could', 'I think', 'I guess', 'probably'],
  certaintyMarkers: ['definitely', 'absolutely', 'certainly', 'never', 'always', 'totally'],
  negations: ['not', "n't", 'no', 'never', 'nothing', 'nobody', 'nowhere'],
  distancing: ['someone', 'something', 'they', 'them', 'one', 'people'],
};

/**
 * Analyze response latency metrics
 */
function analyzeLatency(
  responseTimeMs: number,
  baselineMs: number = 1500
): LatencyMetrics {
  const normalizedLatency = Math.min(1, responseTimeMs / (baselineMs * 3));
  
  return {
    averageResponseTime: responseTimeMs,
    responseTimeVariance: 0, // Would need multiple samples
    initialPauseLength: responseTimeMs * 0.3, // Estimate
    normalizedLatency,
    isDelayed: responseTimeMs > baselineMs * 1.5,
  };
}

/**
 * Analyze linguistic complexity
 */
function analyzeComplexity(text: string): ComplexityMetrics {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  // Count subordinate clauses (simplified: count conjunctions)
  const subordinatePatterns = /\b(that|which|who|whom|whose|when|where|while|although|because|since|if|unless)\b/gi;
  const subordinateClauses = (text.match(subordinatePatterns) || []).length;
  const sentenceComplexity = sentences.length > 0 ? subordinateClauses / sentences.length : 0;
  
  // Vocabulary level (average word length as proxy)
  const avgWordLength = words.length > 0 
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length 
    : 0;
  const vocabularyLevel = Math.min(1, avgWordLength / 8);
  
  // Count grammar errors (simplified: look for patterns)
  let grammarErrors = 0;
  grammarErrors += (text.match(/\s+\s+/g) || []).length; // Double spaces
  grammarErrors += (text.match(/[.!?][a-z]/g) || []).length; // Missing capital after period
  
  return {
    sentenceComplexity,
    vocabularyLevel,
    grammarErrors,
    simplificationUnderLoad: sentenceComplexity < 0.3 && avgWordLength < 4.5,
    complexityChange: 0, // Would need baseline
  };
}

/**
 * Analyze error patterns in text
 */
function analyzeErrors(text: string): ErrorMetrics {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length || 1;
  
  const falseStarts = (text.match(ERROR_PATTERNS.falseStarts) || []).length;
  const corrections = (text.match(ERROR_PATTERNS.corrections) || []).length;
  const repetitions = (text.match(ERROR_PATTERNS.repetitions) || []).length;
  
  // Count filler words
  let fillerWords = 0;
  const lowerText = text.toLowerCase();
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    fillerWords += (lowerText.match(regex) || []).length;
  }
  
  const speechErrors = falseStarts + corrections + repetitions;
  
  return {
    speechErrors,
    corrections,
    falseStarts,
    fillerWords,
    errorRate: (speechErrors / wordCount) * 100,
  };
}

/**
 * Analyze pause patterns from text markers
 */
function analyzePauses(text: string): PauseMetrics {
  // Detect pause indicators in text
  const ellipses = (text.match(/\.\.\./g) || []).length;
  const dashes = (text.match(/\s+-\s+/g) || []).length;
  const commaHeavy = (text.match(/,/g) || []).length;
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Mid-sentence pauses (indicated by ellipses/dashes within sentences)
  let midSentencePauses = 0;
  for (const sentence of sentences) {
    if (sentence.includes('...') || sentence.includes(' - ')) {
      midSentencePauses++;
    }
  }
  
  const pauseCount = ellipses + dashes;
  const totalPauseTime = pauseCount * 500; // Estimate 500ms per pause marker
  
  // Determine distribution
  let pauseDistribution: 'normal' | 'front-loaded' | 'scattered' = 'normal';
  if (pauseCount > 0) {
    const firstHalf = text.slice(0, text.length / 2);
    const firstHalfPauses = (firstHalf.match(/\.\.\./g) || []).length + (firstHalf.match(/\s+-\s+/g) || []).length;
    const ratio = firstHalfPauses / pauseCount;
    
    if (ratio > 0.7) pauseDistribution = 'front-loaded';
    else if (ratio < 0.3) pauseDistribution = 'scattered';
  }
  
  return {
    totalPauseTime,
    pauseCount,
    averagePauseDuration: pauseCount > 0 ? totalPauseTime / pauseCount : 0,
    midSentencePauses,
    pauseDistribution,
  };
}

/**
 * Extract linguistic indicators
 */
function extractLinguisticIndicators(text: string): LinguisticIndicator[] {
  const indicators: LinguisticIndicator[] = [];
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length || 1;
  
  // Hedges
  let hedgeCount = 0;
  const hedgeExamples: string[] = [];
  for (const hedge of LOAD_INDICATORS.hedges) {
    const regex = new RegExp(`\\b${hedge}\\b`, 'gi');
    const matches = lowerText.match(regex) || [];
    hedgeCount += matches.length;
    if (matches.length > 0) hedgeExamples.push(hedge);
  }
  indicators.push({
    type: 'Hedge Words',
    count: hedgeCount,
    normalizedFrequency: hedgeCount / wordCount,
    deceptionWeight: 0.3,
    examples: hedgeExamples.slice(0, 3),
  });
  
  // Certainty markers
  let certaintyCount = 0;
  const certaintyExamples: string[] = [];
  for (const marker of LOAD_INDICATORS.certaintyMarkers) {
    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
    const matches = lowerText.match(regex) || [];
    certaintyCount += matches.length;
    if (matches.length > 0) certaintyExamples.push(marker);
  }
  indicators.push({
    type: 'Certainty Markers',
    count: certaintyCount,
    normalizedFrequency: certaintyCount / wordCount,
    deceptionWeight: 0.4,
    examples: certaintyExamples.slice(0, 3),
  });
  
  // Negations
  let negationCount = 0;
  for (const neg of LOAD_INDICATORS.negations) {
    const regex = new RegExp(`\\b${neg}\\b`, 'gi');
    negationCount += (lowerText.match(regex) || []).length;
  }
  indicators.push({
    type: 'Negations',
    count: negationCount,
    normalizedFrequency: negationCount / wordCount,
    deceptionWeight: 0.25,
    examples: LOAD_INDICATORS.negations.slice(0, 3),
  });
  
  // Distancing language
  let distancingCount = 0;
  const distancingExamples: string[] = [];
  for (const dist of LOAD_INDICATORS.distancing) {
    const regex = new RegExp(`\\b${dist}\\b`, 'gi');
    const matches = lowerText.match(regex) || [];
    distancingCount += matches.length;
    if (matches.length > 0) distancingExamples.push(dist);
  }
  indicators.push({
    type: 'Distancing Language',
    count: distancingCount,
    normalizedFrequency: distancingCount / wordCount,
    deceptionWeight: 0.35,
    examples: distancingExamples.slice(0, 3),
  });
  
  return indicators;
}

/**
 * Analyze temporal pattern of cognitive load
 */
function analyzeTemporalPattern(text: string): TemporalPattern {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const segmentCount = Math.min(5, Math.max(1, Math.floor(sentences.length / 3)));
  const sentencesPerSegment = Math.ceil(sentences.length / segmentCount);
  
  const segments: TemporalSegment[] = [];
  let maxLoad = 0;
  let peakSegment = 0;
  
  for (let i = 0; i < segmentCount; i++) {
    const startIdx = i * sentencesPerSegment;
    const endIdx = Math.min((i + 1) * sentencesPerSegment, sentences.length);
    const segmentText = sentences.slice(startIdx, endIdx).join('. ');
    
    // Calculate segment load
    const errors = analyzeErrors(segmentText);
    const pauses = analyzePauses(segmentText);
    const indicators = extractLinguisticIndicators(segmentText);
    
    const indicatorScore = indicators.reduce((sum, ind) => 
      sum + ind.normalizedFrequency * ind.deceptionWeight, 0
    );
    
    const loadScore = Math.min(1, 
      errors.errorRate * 0.1 + 
      pauses.midSentencePauses * 0.1 + 
      indicatorScore
    );
    
    if (loadScore > maxLoad) {
      maxLoad = loadScore;
      peakSegment = i;
    }
    
    segments.push({
      index: i,
      startRatio: startIdx / sentences.length,
      endRatio: endIdx / sentences.length,
      loadScore,
      dominantIndicators: indicators
        .filter(ind => ind.count > 0)
        .sort((a, b) => b.normalizedFrequency - a.normalizedFrequency)
        .slice(0, 2)
        .map(ind => ind.type),
    });
  }
  
  // Determine load progression
  let loadProgression: 'stable' | 'increasing' | 'decreasing' | 'variable' = 'stable';
  if (segments.length >= 2) {
    const firstHalf = segments.slice(0, Math.floor(segments.length / 2));
    const secondHalf = segments.slice(Math.floor(segments.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.loadScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.loadScore, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.3) loadProgression = 'increasing';
    else if (firstAvg > secondAvg * 1.3) loadProgression = 'decreasing';
    else {
      const variance = segments.reduce((sum, s) => 
        sum + Math.pow(s.loadScore - (firstAvg + secondAvg) / 2, 2), 0
      ) / segments.length;
      if (variance > 0.1) loadProgression = 'variable';
    }
  }
  
  // Determine recovery pattern
  let recoveryPattern: 'quick' | 'slow' | 'none' = 'none';
  if (peakSegment < segments.length - 1) {
    const postPeakAvg = segments
      .slice(peakSegment + 1)
      .reduce((sum, s) => sum + s.loadScore, 0) / (segments.length - peakSegment - 1);
    
    if (postPeakAvg < maxLoad * 0.5) recoveryPattern = 'quick';
    else if (postPeakAvg < maxLoad * 0.8) recoveryPattern = 'slow';
  }
  
  return {
    segments,
    loadProgression,
    peakLoadSegment: peakSegment,
    recoveryPattern,
  };
}

/**
 * Calculate overall cognitive load and deception probability
 */
export function analyzeCognitiveLoad(
  text: string,
  responseTimeMs?: number
): CognitiveLoadMetrics {
  const latency = analyzeLatency(responseTimeMs || 1500);
  const complexity = analyzeComplexity(text);
  const errors = analyzeErrors(text);
  const pauses = analyzePauses(text);
  const temporalPattern = analyzeTemporalPattern(text);
  const indicators = extractLinguisticIndicators(text);
  
  // Calculate component scores
  const latencyScore = latency.normalizedLatency;
  const errorScore = Math.min(1, errors.errorRate / 10);
  const pauseScore = Math.min(1, pauses.pauseCount / 5);
  const indicatorScore = Math.min(1, indicators.reduce((sum, ind) => 
    sum + ind.normalizedFrequency * ind.deceptionWeight, 0
  ));
  
  // Weighted overall load
  const overallLoad = 
    latencyScore * 0.25 +
    errorScore * 0.25 +
    pauseScore * 0.15 +
    indicatorScore * 0.35;
  
  // Determine load level
  let loadLevel: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
  if (overallLoad > 0.7) loadLevel = 'extreme';
  else if (overallLoad > 0.5) loadLevel = 'high';
  else if (overallLoad > 0.3) loadLevel = 'moderate';
  
  // Calculate deception probability
  const deceptionProbability = calculateDeceptionProbability(
    overallLoad,
    temporalPattern,
    indicators,
    complexity
  );
  
  // Calculate confidence
  const wordCount = text.split(/\s+/).length;
  const confidence = Math.min(1, wordCount / 100) * 0.6 + 
    (indicators.filter(i => i.count > 0).length / indicators.length) * 0.4;
  
  return {
    overallLoad,
    loadLevel,
    components: {
      responseLatency: latency,
      linguisticComplexity: complexity,
      errorPatterns: errors,
      pausePatterns: pauses,
    },
    temporalPattern,
    linguisticIndicators: indicators,
    deceptionProbability,
    confidence,
  };
}

/**
 * Calculate deception probability from cognitive load metrics
 */
function calculateDeceptionProbability(
  overallLoad: number,
  temporal: TemporalPattern,
  indicators: LinguisticIndicator[],
  complexity: ComplexityMetrics
): number {
  let probability = overallLoad * 0.4;
  
  // Temporal patterns
  if (temporal.loadProgression === 'increasing') probability += 0.15;
  if (temporal.peakLoadSegment === 0) probability += 0.1; // Front-loaded anxiety
  if (temporal.recoveryPattern === 'none') probability += 0.05;
  
  // Indicator patterns
  const certaintyIndicator = indicators.find(i => i.type === 'Certainty Markers');
  const hedgeIndicator = indicators.find(i => i.type === 'Hedge Words');
  
  if (certaintyIndicator && certaintyIndicator.normalizedFrequency > 0.05) {
    probability += 0.1; // Overuse of certainty markers
  }
  if (hedgeIndicator && hedgeIndicator.normalizedFrequency > 0.1) {
    probability += 0.05;
  }
  
  // Complexity patterns
  if (complexity.simplificationUnderLoad) probability += 0.1;
  
  return Math.min(1, Math.max(0, probability));
}

/**
 * Compare cognitive load between baseline and test samples
 */
export function compareCognitiveLoad(
  baselineText: string,
  testText: string
): {
  loadChange: number;
  direction: 'increased' | 'decreased' | 'stable';
  significantIndicators: string[];
  assessment: string;
} {
  const baseline = analyzeCognitiveLoad(baselineText);
  const test = analyzeCognitiveLoad(testText);
  
  const loadChange = test.overallLoad - baseline.overallLoad;
  
  let direction: 'increased' | 'decreased' | 'stable' = 'stable';
  if (loadChange > 0.15) direction = 'increased';
  else if (loadChange < -0.15) direction = 'decreased';
  
  // Find significant indicator changes
  const significantIndicators: string[] = [];
  for (const testInd of test.linguisticIndicators) {
    const baseInd = baseline.linguisticIndicators.find(i => i.type === testInd.type);
    if (baseInd && Math.abs(testInd.normalizedFrequency - baseInd.normalizedFrequency) > 0.02) {
      significantIndicators.push(testInd.type);
    }
  }
  
  // Generate assessment
  let assessment = '';
  if (direction === 'increased' && test.deceptionProbability > 0.5) {
    assessment = 'Elevated cognitive load suggests potential deception or stress';
  } else if (direction === 'stable') {
    assessment = 'Consistent cognitive load patterns; no significant deviation detected';
  } else {
    assessment = 'Reduced cognitive load may indicate rehearsed responses';
  }
  
  return {
    loadChange,
    direction,
    significantIndicators,
    assessment,
  };
}
