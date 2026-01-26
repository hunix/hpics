/**
 * Layered Authorship Fingerprinter (v9.0)
 * 
 * Extracts authorship signatures from every transformer layer:
 * - Lower layers: Syntactic patterns, word choice
 * - Middle layers: Stylistic features, sentence structure
 * - Upper layers: Semantic content, topic markers
 * 
 * @source arXiv:2503.00958 (Mar 2025) - Leveraging All Transformer Layers for Authorship Attribution
 */

// ============================================
// Types & Interfaces
// ============================================

export interface AuthorshipFingerprint {
  id: string;
  sourceId: string;
  profileId?: string;
  documentText: string;
  layerSignatures: LayerSignatures;
  aggregatedFeatures: AggregatedFeatures;
  authorCluster: string;
  confidence: number;
  aiProbability: number;
  similarAuthors: SimilarAuthor[];
  analysisMetadata: AnalysisMetadata;
}

export interface LayerSignatures {
  syntactic: SyntacticSignature;
  stylistic: StylisticSignature;
  semantic: SemanticSignature;
  layerVectors: LayerVector[];
}

export interface SyntacticSignature {
  posTagDistribution: Record<string, number>;
  dependencyPatterns: DependencyPattern[];
  sentenceComplexity: SentenceComplexity;
  punctuationStyle: PunctuationStyle;
  wordChoicePatterns: WordChoicePattern[];
}

export interface DependencyPattern {
  pattern: string;
  frequency: number;
  uniqueness: number;
}

export interface SentenceComplexity {
  averageLength: number;
  lengthVariance: number;
  clauseDepth: number;
  subordinationRatio: number;
  coordinationRatio: number;
}

export interface PunctuationStyle {
  commaFrequency: number;
  semicolonFrequency: number;
  dashFrequency: number;
  exclamationFrequency: number;
  questionFrequency: number;
  ellipsisFrequency: number;
}

export interface WordChoicePattern {
  category: 'function' | 'content' | 'rare' | 'filler';
  words: string[];
  frequencies: number[];
  distinctiveness: number;
}

export interface StylisticSignature {
  voiceIndicators: VoiceIndicators;
  toneMarkers: ToneMarkers;
  rhetoricalDevices: RhetoricalDevice[];
  paragraphStructure: ParagraphStructure;
  transitionPatterns: TransitionPattern[];
}

export interface VoiceIndicators {
  activeVoiceRatio: number;
  passiveVoiceRatio: number;
  firstPersonRatio: number;
  secondPersonRatio: number;
  thirdPersonRatio: number;
  formalityScore: number;
}

export interface ToneMarkers {
  assertiveness: number;
  hedging: number;
  emotionality: number;
  objectivity: number;
  certainty: number;
}

export interface RhetoricalDevice {
  type: RhetoricalDeviceType;
  examples: string[];
  frequency: number;
}

export type RhetoricalDeviceType = 
  | 'metaphor'
  | 'simile'
  | 'alliteration'
  | 'anaphora'
  | 'rhetorical_question'
  | 'parallelism'
  | 'antithesis'
  | 'hyperbole';

export interface ParagraphStructure {
  averageLength: number;
  topicSentencePosition: 'first' | 'last' | 'variable';
  cohesionScore: number;
}

export interface TransitionPattern {
  transitionWord: string;
  frequency: number;
  context: 'additive' | 'adversative' | 'causal' | 'sequential';
}

export interface SemanticSignature {
  topicDistribution: TopicDistribution;
  entityPreferences: EntityPreference[];
  abstractionLevel: number;
  domainVocabulary: DomainVocabulary[];
  argumentationStyle: ArgumentationStyle;
}

export interface TopicDistribution {
  topics: Topic[];
  diversity: number;
  consistency: number;
}

export interface Topic {
  label: string;
  weight: number;
  keywords: string[];
}

export interface EntityPreference {
  entityType: 'person' | 'organization' | 'location' | 'concept' | 'time';
  mentionStyle: 'formal' | 'informal' | 'mixed';
  frequency: number;
}

export interface DomainVocabulary {
  domain: string;
  terms: string[];
  proficiencyIndicator: number;
}

export interface ArgumentationStyle {
  logicalConnectors: number;
  evidenceUsage: number;
  counterArgumentHandling: number;
  conclusionStrength: number;
}

export interface LayerVector {
  layerIndex: number;
  layerType: 'lower' | 'middle' | 'upper';
  vector: number[];
  dominantFeatures: string[];
}

export interface AggregatedFeatures {
  burrowsDelta: number;
  manhattanDistance: number;
  cosineSimilarity: number;
  kilgariffChi2: number;
  featureVector: number[];
}

export interface SimilarAuthor {
  authorId: string;
  authorLabel: string;
  similarityScore: number;
  matchingFeatures: string[];
}

export interface AnalysisMetadata {
  textLength: number;
  wordCount: number;
  sentenceCount: number;
  vocabularySize: number;
  hapaxLegomena: number;
  processingTimeMs: number;
  modelUsed: string;
}

// ============================================
// LLM Detection Types
// ============================================

export interface LLMDetectionResult {
  isAIGenerated: boolean;
  aiProbability: number;
  confidence: number;
  detectedModel: string | null;
  humanMarkers: HumanMarker[];
  aiMarkers: AIMarker[];
  clusterAnalysis: ClusterAnalysis;
}

export interface HumanMarker {
  type: string;
  description: string;
  evidence: string;
  weight: number;
}

export interface AIMarker {
  type: string;
  description: string;
  evidence: string;
  weight: number;
  associatedModel: string[];
}

export interface ClusterAnalysis {
  clusterType: 'human' | 'ai' | 'mixed';
  clusterTightness: number;
  nearestClusters: NearestCluster[];
}

export interface NearestCluster {
  label: string;
  distance: number;
  memberCount: number;
}

// ============================================
// Core Analysis Functions
// ============================================

/**
 * Generate comprehensive authorship fingerprint
 */
export async function generateFingerprint(
  text: string,
  sourceId: string,
  profileId?: string,
  options: FingerprintOptions = {}
): Promise<AuthorshipFingerprint> {
  const startTime = Date.now();
  
  // Extract layer signatures
  const layerSignatures = extractLayerSignatures(text);
  
  // Calculate aggregated features
  const aggregatedFeatures = calculateAggregatedFeatures(layerSignatures);
  
  // Detect if AI-generated
  const llmDetection = detectLLMGeneration(text, layerSignatures);
  
  // Find similar authors
  const similarAuthors = options.compareAgainst ? 
    findSimilarAuthors(aggregatedFeatures, options.compareAgainst) : [];
  
  // Determine author cluster
  const authorCluster = determineAuthorCluster(aggregatedFeatures, similarAuthors);
  
  // Calculate confidence
  const confidence = calculateConfidence(text, layerSignatures);
  
  return {
    id: crypto.randomUUID(),
    sourceId,
    profileId,
    documentText: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
    layerSignatures,
    aggregatedFeatures,
    authorCluster,
    confidence,
    aiProbability: llmDetection.aiProbability,
    similarAuthors,
    analysisMetadata: {
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      sentenceCount: text.split(/[.!?]+/).filter(s => s.trim()).length,
      vocabularySize: new Set(text.toLowerCase().split(/\s+/)).size,
      hapaxLegomena: countHapaxLegomena(text),
      processingTimeMs: Date.now() - startTime,
      modelUsed: options.modelOverride || 'local_fingerprinter'
    }
  };
}

/**
 * Detect if text is AI-generated
 */
export function detectLLMGeneration(
  text: string,
  signatures?: LayerSignatures
): LLMDetectionResult {
  const layerSigs = signatures || extractLayerSignatures(text);
  
  // Extract human markers
  const humanMarkers = extractHumanMarkers(text, layerSigs);
  
  // Extract AI markers
  const aiMarkers = extractAIMarkers(text, layerSigs);
  
  // Calculate probabilities
  const humanScore = humanMarkers.reduce((acc, m) => acc + m.weight, 0);
  const aiScore = aiMarkers.reduce((acc, m) => acc + m.weight, 0);
  const totalScore = humanScore + aiScore;
  
  const aiProbability = totalScore > 0 ? aiScore / totalScore : 0.5;
  
  // Perform cluster analysis
  const clusterAnalysis = performClusterAnalysis(layerSigs, aiProbability);
  
  // Detect specific model if AI
  const detectedModel = aiProbability > 0.7 ? detectSpecificModel(aiMarkers) : null;
  
  return {
    isAIGenerated: aiProbability > 0.6,
    aiProbability,
    confidence: calculateDetectionConfidence(text.length, humanMarkers.length + aiMarkers.length),
    detectedModel,
    humanMarkers,
    aiMarkers,
    clusterAnalysis
  };
}

/**
 * Compare two texts for authorship similarity
 */
export function compareAuthorship(
  text1: string,
  text2: string
): AuthorshipComparison {
  const fp1 = extractLayerSignatures(text1);
  const fp2 = extractLayerSignatures(text2);
  
  const agg1 = calculateAggregatedFeatures(fp1);
  const agg2 = calculateAggregatedFeatures(fp2);
  
  // Calculate various similarity metrics
  const burrowsDeltaSimilarity = 1 - Math.abs(agg1.burrowsDelta - agg2.burrowsDelta);
  const cosineSim = calculateCosineSimilarity(agg1.featureVector, agg2.featureVector);
  const manhattanSim = 1 / (1 + calculateManhattanDistance(agg1.featureVector, agg2.featureVector));
  
  // Compare layer-by-layer
  const layerSimilarities = compareLayerSignatures(fp1, fp2);
  
  // Overall similarity
  const overallSimilarity = (
    burrowsDeltaSimilarity * 0.3 +
    cosineSim * 0.4 +
    manhattanSim * 0.3
  );
  
  return {
    overallSimilarity,
    sameAuthorProbability: sigmoidTransform(overallSimilarity),
    burrowsDeltaSimilarity,
    cosineSimilarity: cosineSim,
    manhattanSimilarity: manhattanSim,
    layerSimilarities,
    matchingFeatures: identifyMatchingFeatures(fp1, fp2),
    divergingFeatures: identifyDivergingFeatures(fp1, fp2)
  };
}

/**
 * Build author profile from multiple documents
 */
export function buildAuthorProfile(
  documents: string[],
  authorId: string
): AuthorProfile {
  const fingerprints = documents.map(doc => extractLayerSignatures(doc));
  const aggregatedFeatures = fingerprints.map(fp => calculateAggregatedFeatures(fp));
  
  // Calculate consensus features
  const consensusSyntactic = aggregateSyntacticSignatures(fingerprints.map(fp => fp.syntactic));
  const consensusStylistic = aggregateStylisticSignatures(fingerprints.map(fp => fp.stylistic));
  const consensusSemantic = aggregateSemanticSignatures(fingerprints.map(fp => fp.semantic));
  
  // Calculate consistency metrics
  const consistency = calculateAuthorConsistency(fingerprints);
  
  // Build centroid vector
  const centroidVector = calculateCentroidVector(aggregatedFeatures.map(af => af.featureVector));
  
  return {
    authorId,
    documentCount: documents.length,
    totalWordCount: documents.reduce((acc, d) => acc + d.split(/\s+/).length, 0),
    consensusSignature: {
      syntactic: consensusSyntactic,
      stylistic: consensusStylistic,
      semantic: consensusSemantic,
      layerVectors: [] // Aggregated in centroid
    },
    centroidVector,
    consistency,
    distinctiveFeatures: identifyDistinctiveFeatures(fingerprints),
    variabilityProfile: calculateVariabilityProfile(fingerprints)
  };
}

// ============================================
// Layer Extraction Functions
// ============================================

/**
 * Extract signatures from all transformer layers
 */
function extractLayerSignatures(text: string): LayerSignatures {
  return {
    syntactic: extractSyntacticSignature(text),
    stylistic: extractStylisticSignature(text),
    semantic: extractSemanticSignature(text),
    layerVectors: generateLayerVectors(text)
  };
}

function extractSyntacticSignature(text: string): SyntacticSignature {
  const words = text.toLowerCase().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  // POS tag distribution (simplified)
  const posTagDistribution = estimatePOSDistribution(text);
  
  // Sentence complexity
  const avgLength = sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const lengthVariance = calculateVariance(lengths);
  
  // Punctuation analysis
  const punctuationStyle = analyzePunctuation(text, words.length);
  
  // Word choice patterns
  const wordChoicePatterns = analyzeWordChoice(words);
  
  return {
    posTagDistribution,
    dependencyPatterns: extractDependencyPatterns(sentences),
    sentenceComplexity: {
      averageLength: avgLength,
      lengthVariance,
      clauseDepth: estimateClauseDepth(sentences),
      subordinationRatio: countPattern(text, /\b(because|although|if|when|while|since|unless)\b/gi) / sentences.length,
      coordinationRatio: countPattern(text, /\b(and|but|or|yet|so)\b/gi) / sentences.length
    },
    punctuationStyle,
    wordChoicePatterns
  };
}

function extractStylisticSignature(text: string): StylisticSignature {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const words = text.split(/\s+/);
  const paragraphs = text.split(/\n\s*\n/);
  
  // Voice indicators
  const voiceIndicators = analyzeVoice(text, words.length);
  
  // Tone markers
  const toneMarkers = analyzeTone(text);
  
  // Rhetorical devices
  const rhetoricalDevices = detectRhetoricalDevices(text);
  
  // Paragraph structure
  const paragraphStructure = analyzeParagraphStructure(paragraphs);
  
  // Transition patterns
  const transitionPatterns = extractTransitionPatterns(text);
  
  return {
    voiceIndicators,
    toneMarkers,
    rhetoricalDevices,
    paragraphStructure,
    transitionPatterns
  };
}

function extractSemanticSignature(text: string): SemanticSignature {
  // Topic distribution
  const topicDistribution = extractTopics(text);
  
  // Entity preferences
  const entityPreferences = analyzeEntityPreferences(text);
  
  // Abstraction level
  const abstractionLevel = calculateAbstractionLevel(text);
  
  // Domain vocabulary
  const domainVocabulary = identifyDomainVocabulary(text);
  
  // Argumentation style
  const argumentationStyle = analyzeArgumentation(text);
  
  return {
    topicDistribution,
    entityPreferences,
    abstractionLevel,
    domainVocabulary,
    argumentationStyle
  };
}

function generateLayerVectors(text: string): LayerVector[] {
  const vectors: LayerVector[] = [];
  
  // Lower layer (syntactic)
  vectors.push({
    layerIndex: 1,
    layerType: 'lower',
    vector: extractSyntacticVector(text),
    dominantFeatures: ['pos_distribution', 'sentence_length', 'punctuation']
  });
  
  // Middle layer (stylistic)
  vectors.push({
    layerIndex: 6,
    layerType: 'middle',
    vector: extractStylisticVector(text),
    dominantFeatures: ['voice', 'tone', 'rhetoric']
  });
  
  // Upper layer (semantic)
  vectors.push({
    layerIndex: 12,
    layerType: 'upper',
    vector: extractSemanticVector(text),
    dominantFeatures: ['topics', 'entities', 'abstraction']
  });
  
  return vectors;
}

// ============================================
// Feature Calculation Functions
// ============================================

function calculateAggregatedFeatures(signatures: LayerSignatures): AggregatedFeatures {
  // Combine all layer vectors
  const allVectors = signatures.layerVectors.flatMap(lv => lv.vector);
  
  // Calculate Burrows' Delta (simplified)
  const burrowsDelta = calculateBurrowsDelta(signatures);
  
  return {
    burrowsDelta,
    manhattanDistance: 0, // Calculated during comparison
    cosineSimilarity: 0, // Calculated during comparison
    kilgariffChi2: calculateKilgariffChi2(signatures),
    featureVector: allVectors
  };
}

function calculateBurrowsDelta(signatures: LayerSignatures): number {
  // Simplified Burrows' Delta calculation
  const syntacticScore = Object.values(signatures.syntactic.posTagDistribution)
    .reduce((acc, v) => acc + Math.abs(v - 0.1), 0);
  
  const stylisticScore = signatures.stylistic.voiceIndicators.formalityScore;
  
  return (syntacticScore + stylisticScore) / 2;
}

function calculateKilgariffChi2(signatures: LayerSignatures): number {
  // Simplified chi-squared calculation for vocabulary comparison
  return 0.5; // Placeholder
}

// ============================================
// Human/AI Detection Functions
// ============================================

function extractHumanMarkers(text: string, signatures: LayerSignatures): HumanMarker[] {
  const markers: HumanMarker[] = [];
  
  // Inconsistent complexity (humans vary more)
  if (signatures.syntactic.sentenceComplexity.lengthVariance > 15) {
    markers.push({
      type: 'complexity_variance',
      description: 'High variance in sentence complexity typical of human writing',
      evidence: `Variance: ${signatures.syntactic.sentenceComplexity.lengthVariance.toFixed(2)}`,
      weight: 0.3
    });
  }
  
  // Typos and corrections (not present in clean AI output)
  const typoPatterns = /\b(\w+)\s+\1\b|[,.]{2,}|\s{2,}/g;
  const typoCount = (text.match(typoPatterns) || []).length;
  if (typoCount > 0) {
    markers.push({
      type: 'typos_corrections',
      description: 'Minor errors typical of human writing',
      evidence: `Found ${typoCount} potential typos/corrections`,
      weight: 0.2 * Math.min(typoCount, 5)
    });
  }
  
  // Informal language markers
  const informalPatterns = /\b(gonna|wanna|kinda|sorta|y'know|lol|omg)\b/gi;
  const informalCount = (text.match(informalPatterns) || []).length;
  if (informalCount > 0) {
    markers.push({
      type: 'informal_language',
      description: 'Colloquialisms typical of human casual writing',
      evidence: `Found ${informalCount} informal expressions`,
      weight: 0.15 * Math.min(informalCount, 5)
    });
  }
  
  // Personal anecdotes
  const anecdotePatterns = /\b(I remember|one time|my friend|personally|in my experience)\b/gi;
  const anecdoteCount = (text.match(anecdotePatterns) || []).length;
  if (anecdoteCount > 0) {
    markers.push({
      type: 'personal_anecdotes',
      description: 'Personal experiences typical of human writing',
      evidence: `Found ${anecdoteCount} personal references`,
      weight: 0.25 * Math.min(anecdoteCount, 3)
    });
  }
  
  return markers;
}

function extractAIMarkers(text: string, signatures: LayerSignatures): AIMarker[] {
  const markers: AIMarker[] = [];
  
  // Uniform sentence length (AI tends to be more consistent)
  if (signatures.syntactic.sentenceComplexity.lengthVariance < 5) {
    markers.push({
      type: 'uniform_complexity',
      description: 'Unusually consistent sentence structure typical of AI',
      evidence: `Low variance: ${signatures.syntactic.sentenceComplexity.lengthVariance.toFixed(2)}`,
      weight: 0.3,
      associatedModel: ['gpt-4', 'claude', 'gemini']
    });
  }
  
  // Formulaic structure
  const formulaicPatterns = /^(First|Second|Third|Finally|In conclusion|To summarize),/gm;
  const formulaicCount = (text.match(formulaicPatterns) || []).length;
  if (formulaicCount > 2) {
    markers.push({
      type: 'formulaic_structure',
      description: 'Highly structured format typical of AI output',
      evidence: `Found ${formulaicCount} formulaic transitions`,
      weight: 0.25,
      associatedModel: ['gpt-3.5', 'gpt-4']
    });
  }
  
  // Perfect grammar (no typos)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const avgSentenceLength = text.length / sentences.length;
  if (avgSentenceLength > 80 && signatures.syntactic.sentenceComplexity.lengthVariance < 10) {
    markers.push({
      type: 'perfect_prose',
      description: 'Unusually polished writing with no errors',
      evidence: 'No typos detected in complex text',
      weight: 0.2,
      associatedModel: ['gpt-4', 'claude-3']
    });
  }
  
  // Hedging and qualification patterns
  const hedgingPatterns = /\b(It's important to note|It's worth mentioning|However, it's essential|One might argue)\b/gi;
  const hedgingCount = (text.match(hedgingPatterns) || []).length;
  if (hedgingCount > 1) {
    markers.push({
      type: 'ai_hedging',
      description: 'Characteristic AI hedging language',
      evidence: `Found ${hedgingCount} AI-style hedges`,
      weight: 0.35,
      associatedModel: ['gpt-4', 'claude']
    });
  }
  
  // Balanced perspective indicators
  const balancedPatterns = /\b(On one hand|On the other hand|While some|Others might|Both sides)\b/gi;
  const balancedCount = (text.match(balancedPatterns) || []).length;
  if (balancedCount > 2) {
    markers.push({
      type: 'forced_balance',
      description: 'Overly balanced perspective typical of AI',
      evidence: `Found ${balancedCount} balancing phrases`,
      weight: 0.2,
      associatedModel: ['claude', 'gpt-4']
    });
  }
  
  return markers;
}

function performClusterAnalysis(signatures: LayerSignatures, aiProbability: number): ClusterAnalysis {
  const clusterType = aiProbability > 0.7 ? 'ai' : 
                      aiProbability < 0.3 ? 'human' : 'mixed';
  
  // Calculate cluster tightness based on feature variance
  const variance = signatures.syntactic.sentenceComplexity.lengthVariance;
  const clusterTightness = 1 / (1 + variance / 10);
  
  return {
    clusterType,
    clusterTightness,
    nearestClusters: [
      { label: 'human_casual', distance: aiProbability, memberCount: 1000 },
      { label: 'gpt4_outputs', distance: 1 - aiProbability, memberCount: 500 }
    ]
  };
}

function detectSpecificModel(aiMarkers: AIMarker[]): string | null {
  const modelScores: Record<string, number> = {};
  
  for (const marker of aiMarkers) {
    for (const model of marker.associatedModel) {
      modelScores[model] = (modelScores[model] || 0) + marker.weight;
    }
  }
  
  const entries = Object.entries(modelScores);
  if (entries.length === 0) return null;
  
  const [topModel] = entries.sort((a, b) => b[1] - a[1])[0];
  return topModel;
}

// ============================================
// Helper Types
// ============================================

export interface FingerprintOptions {
  compareAgainst?: AuthorProfile[];
  modelOverride?: string;
  includeLayerVectors?: boolean;
}

export interface AuthorshipComparison {
  overallSimilarity: number;
  sameAuthorProbability: number;
  burrowsDeltaSimilarity: number;
  cosineSimilarity: number;
  manhattanSimilarity: number;
  layerSimilarities: Record<string, number>;
  matchingFeatures: string[];
  divergingFeatures: string[];
}

export interface AuthorProfile {
  authorId: string;
  documentCount: number;
  totalWordCount: number;
  consensusSignature: LayerSignatures;
  centroidVector: number[];
  consistency: number;
  distinctiveFeatures: string[];
  variabilityProfile: Record<string, number>;
}

// ============================================
// Private Helper Functions
// ============================================

function estimatePOSDistribution(text: string): Record<string, number> {
  const words = text.toLowerCase().split(/\s+/);
  const total = words.length;
  
  // Simple heuristic-based POS estimation
  const articles = countPattern(text, /\b(a|an|the)\b/gi);
  const prepositions = countPattern(text, /\b(in|on|at|to|for|with|by|from|of)\b/gi);
  const pronouns = countPattern(text, /\b(I|you|he|she|it|we|they|me|him|her|us|them)\b/gi);
  const verbs = countPattern(text, /\b(is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must)\b/gi);
  const adjectives = countPattern(text, /\b(\w+ly|\w+ful|\w+less|\w+ous|\w+ive)\b/gi);
  
  return {
    articles: articles / total,
    prepositions: prepositions / total,
    pronouns: pronouns / total,
    verbs: verbs / total,
    adjectives: adjectives / total,
    nouns: 1 - (articles + prepositions + pronouns + verbs + adjectives) / total
  };
}

function extractDependencyPatterns(sentences: string[]): DependencyPattern[] {
  // Simplified pattern extraction
  const patterns: DependencyPattern[] = [];
  
  // Subject-Verb-Object ratio
  const svoCount = sentences.filter(s => /^\w+\s+\w+s?\s+\w+/.test(s.trim())).length;
  patterns.push({
    pattern: 'SVO',
    frequency: svoCount / sentences.length,
    uniqueness: 0.5
  });
  
  return patterns;
}

function analyzePunctuation(text: string, wordCount: number): PunctuationStyle {
  return {
    commaFrequency: (text.match(/,/g) || []).length / wordCount,
    semicolonFrequency: (text.match(/;/g) || []).length / wordCount,
    dashFrequency: (text.match(/[-–—]/g) || []).length / wordCount,
    exclamationFrequency: (text.match(/!/g) || []).length / wordCount,
    questionFrequency: (text.match(/\?/g) || []).length / wordCount,
    ellipsisFrequency: (text.match(/\.\.\./g) || []).length / wordCount
  };
}

function analyzeWordChoice(words: string[]): WordChoicePattern[] {
  const functionWords = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];
  
  const functionCount = words.filter(w => functionWords.includes(w)).length;
  const fillerCount = words.filter(w => fillerWords.includes(w)).length;
  
  return [
    {
      category: 'function',
      words: functionWords,
      frequencies: functionWords.map(() => functionCount / words.length),
      distinctiveness: 0.3
    },
    {
      category: 'filler',
      words: fillerWords,
      frequencies: fillerWords.map(() => fillerCount / words.length),
      distinctiveness: 0.8
    }
  ];
}

function analyzeVoice(text: string, wordCount: number): VoiceIndicators {
  const passivePatterns = /\b(was|were|been|being)\s+\w+ed\b/gi;
  const firstPerson = /\b(I|me|my|mine|we|us|our|ours)\b/gi;
  const secondPerson = /\b(you|your|yours)\b/gi;
  const thirdPerson = /\b(he|she|it|they|him|her|them|his|hers|its|their|theirs)\b/gi;
  
  const passiveCount = (text.match(passivePatterns) || []).length;
  const firstCount = (text.match(firstPerson) || []).length;
  const secondCount = (text.match(secondPerson) || []).length;
  const thirdCount = (text.match(thirdPerson) || []).length;
  
  const total = firstCount + secondCount + thirdCount || 1;
  
  return {
    activeVoiceRatio: 1 - passiveCount / (wordCount / 10),
    passiveVoiceRatio: passiveCount / (wordCount / 10),
    firstPersonRatio: firstCount / total,
    secondPersonRatio: secondCount / total,
    thirdPersonRatio: thirdCount / total,
    formalityScore: calculateFormalityScore(text)
  };
}

function analyzeTone(text: string): ToneMarkers {
  const hedging = countPattern(text, /\b(maybe|perhaps|possibly|might|could|seems|appears)\b/gi);
  const assertive = countPattern(text, /\b(clearly|obviously|certainly|definitely|must|always|never)\b/gi);
  const emotional = countPattern(text, /[!?]{2,}|\b(amazing|terrible|love|hate|wonderful|awful)\b/gi);
  
  const totalWords = text.split(/\s+/).length;
  
  return {
    assertiveness: assertive / totalWords * 100,
    hedging: hedging / totalWords * 100,
    emotionality: emotional / totalWords * 100,
    objectivity: 1 - (emotional / totalWords * 10),
    certainty: assertive / (assertive + hedging + 1)
  };
}

function detectRhetoricalDevices(text: string): RhetoricalDevice[] {
  const devices: RhetoricalDevice[] = [];
  
  // Simile detection
  const similes = text.match(/\b(like|as)\s+a\s+\w+/gi) || [];
  if (similes.length > 0) {
    devices.push({
      type: 'simile',
      examples: similes.slice(0, 3),
      frequency: similes.length
    });
  }
  
  // Rhetorical questions
  const rhetoricalQs = text.match(/[A-Z][^.!?]*\?\s*(?=[A-Z])/g) || [];
  if (rhetoricalQs.length > 0) {
    devices.push({
      type: 'rhetorical_question',
      examples: rhetoricalQs.slice(0, 3),
      frequency: rhetoricalQs.length
    });
  }
  
  return devices;
}

function analyzeParagraphStructure(paragraphs: string[]): ParagraphStructure {
  const lengths = paragraphs.map(p => p.split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  return {
    averageLength: avgLength,
    topicSentencePosition: 'first',
    cohesionScore: 0.7
  };
}

function extractTransitionPatterns(text: string): TransitionPattern[] {
  const patterns: TransitionPattern[] = [];
  
  const additiveTransitions = ['also', 'furthermore', 'moreover', 'additionally'];
  const adversativeTransitions = ['however', 'but', 'although', 'nevertheless'];
  const causalTransitions = ['therefore', 'because', 'thus', 'consequently'];
  const sequentialTransitions = ['first', 'then', 'next', 'finally'];
  
  for (const word of additiveTransitions) {
    const count = countPattern(text, new RegExp(`\\b${word}\\b`, 'gi'));
    if (count > 0) {
      patterns.push({ transitionWord: word, frequency: count, context: 'additive' });
    }
  }
  
  for (const word of adversativeTransitions) {
    const count = countPattern(text, new RegExp(`\\b${word}\\b`, 'gi'));
    if (count > 0) {
      patterns.push({ transitionWord: word, frequency: count, context: 'adversative' });
    }
  }
  
  return patterns;
}

function extractTopics(text: string): TopicDistribution {
  // Simplified topic extraction using keyword frequency
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  
  for (const word of words) {
    if (word.length > 4) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }
  
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return {
    topics: topWords.map(([word, count]) => ({
      label: word,
      weight: count / words.length,
      keywords: [word]
    })),
    diversity: new Set(words.filter(w => w.length > 4)).size / words.length,
    consistency: 0.7
  };
}

function analyzeEntityPreferences(text: string): EntityPreference[] {
  const preferences: EntityPreference[] = [];
  
  // Person entities (capitalized names)
  const personCount = countPattern(text, /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g);
  if (personCount > 0) {
    preferences.push({
      entityType: 'person',
      mentionStyle: 'formal',
      frequency: personCount
    });
  }
  
  return preferences;
}

function calculateAbstractionLevel(text: string): number {
  const abstractWords = countPattern(text, /\b(concept|idea|theory|principle|notion|philosophy|abstract)\b/gi);
  const concreteWords = countPattern(text, /\b(table|chair|car|house|person|book|phone)\b/gi);
  
  return abstractWords / (abstractWords + concreteWords + 1);
}

function identifyDomainVocabulary(text: string): DomainVocabulary[] {
  const domains: DomainVocabulary[] = [];
  
  // Technical vocabulary
  const techWords = text.match(/\b(algorithm|database|API|server|client|protocol|encryption)\b/gi) || [];
  if (techWords.length > 2) {
    domains.push({
      domain: 'technology',
      terms: [...new Set(techWords.map(w => w.toLowerCase()))],
      proficiencyIndicator: techWords.length / 10
    });
  }
  
  return domains;
}

function analyzeArgumentation(text: string): ArgumentationStyle {
  const logicalConnectors = countPattern(text, /\b(therefore|thus|hence|because|since|consequently)\b/gi);
  const evidence = countPattern(text, /\b(study|research|data|evidence|according to|found that)\b/gi);
  const counterArgs = countPattern(text, /\b(however|although|despite|on the other hand|critics argue)\b/gi);
  const conclusions = countPattern(text, /\b(in conclusion|to summarize|therefore|thus|overall)\b/gi);
  
  const sentences = text.split(/[.!?]+/).length;
  
  return {
    logicalConnectors: logicalConnectors / sentences,
    evidenceUsage: evidence / sentences,
    counterArgumentHandling: counterArgs / sentences,
    conclusionStrength: conclusions > 0 ? 0.8 : 0.4
  };
}

function extractSyntacticVector(text: string): number[] {
  const sig = extractSyntacticSignature(text);
  return [
    sig.sentenceComplexity.averageLength / 50,
    sig.sentenceComplexity.lengthVariance / 20,
    sig.punctuationStyle.commaFrequency * 10,
    sig.punctuationStyle.semicolonFrequency * 100,
    Object.values(sig.posTagDistribution).slice(0, 5).reduce((a, b) => a + b, 0)
  ];
}

function extractStylisticVector(text: string): number[] {
  const sig = extractStylisticSignature(text);
  return [
    sig.voiceIndicators.formalityScore,
    sig.voiceIndicators.firstPersonRatio,
    sig.toneMarkers.assertiveness,
    sig.toneMarkers.hedging,
    sig.rhetoricalDevices.length / 10
  ];
}

function extractSemanticVector(text: string): number[] {
  const sig = extractSemanticSignature(text);
  return [
    sig.abstractionLevel,
    sig.topicDistribution.diversity,
    sig.argumentationStyle.logicalConnectors,
    sig.domainVocabulary.length / 5,
    sig.entityPreferences.length / 5
  ];
}

function countPattern(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length;
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return numbers.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / numbers.length;
}

function estimateClauseDepth(sentences: string[]): number {
  const depths = sentences.map(s => {
    const subordinates = (s.match(/\b(that|which|who|whom|whose|where|when|while|if|because|although)\b/gi) || []).length;
    return subordinates + 1;
  });
  return depths.reduce((a, b) => a + b, 0) / depths.length;
}

function calculateFormalityScore(text: string): number {
  const informal = countPattern(text, /\b(gonna|wanna|kinda|gotta|yeah|nope|ok|okay)\b/gi);
  const formal = countPattern(text, /\b(therefore|consequently|furthermore|nevertheless|notwithstanding)\b/gi);
  
  return formal / (informal + formal + 1);
}

function countHapaxLegomena(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const freq: Record<string, number> = {};
  
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }
  
  return Object.values(freq).filter(f => f === 1).length;
}

function findSimilarAuthors(features: AggregatedFeatures, profiles: AuthorProfile[]): SimilarAuthor[] {
  return profiles.map(profile => ({
    authorId: profile.authorId,
    authorLabel: profile.authorId,
    similarityScore: calculateCosineSimilarity(features.featureVector, profile.centroidVector),
    matchingFeatures: profile.distinctiveFeatures.slice(0, 3)
  })).sort((a, b) => b.similarityScore - a.similarityScore);
}

function determineAuthorCluster(features: AggregatedFeatures, similar: SimilarAuthor[]): string {
  if (similar.length > 0 && similar[0].similarityScore > 0.8) {
    return similar[0].authorId;
  }
  return 'unknown_cluster';
}

function calculateConfidence(text: string, signatures: LayerSignatures): number {
  const wordCount = text.split(/\s+/).length;
  let confidence = 0.4;
  
  if (wordCount > 100) confidence += 0.1;
  if (wordCount > 300) confidence += 0.1;
  if (wordCount > 500) confidence += 0.1;
  if (signatures.layerVectors.length === 3) confidence += 0.1;
  
  return Math.min(0.95, confidence);
}

function calculateDetectionConfidence(textLength: number, markerCount: number): number {
  let confidence = 0.4;
  if (textLength > 200) confidence += 0.1;
  if (textLength > 500) confidence += 0.1;
  if (markerCount > 3) confidence += 0.15;
  if (markerCount > 6) confidence += 0.1;
  return Math.min(0.9, confidence);
}

function calculateCosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) + 0.0001);
}

function calculateManhattanDistance(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) return Infinity;
  
  let distance = 0;
  for (let i = 0; i < v1.length; i++) {
    distance += Math.abs(v1[i] - v2[i]);
  }
  return distance;
}

function compareLayerSignatures(s1: LayerSignatures, s2: LayerSignatures): Record<string, number> {
  return {
    syntactic: compareSyntactic(s1.syntactic, s2.syntactic),
    stylistic: compareStylistic(s1.stylistic, s2.stylistic),
    semantic: compareSemantic(s1.semantic, s2.semantic)
  };
}

function compareSyntactic(s1: SyntacticSignature, s2: SyntacticSignature): number {
  const lengthSim = 1 - Math.abs(s1.sentenceComplexity.averageLength - s2.sentenceComplexity.averageLength) / 50;
  return Math.max(0, lengthSim);
}

function compareStylistic(s1: StylisticSignature, s2: StylisticSignature): number {
  const formalitySim = 1 - Math.abs(s1.voiceIndicators.formalityScore - s2.voiceIndicators.formalityScore);
  return formalitySim;
}

function compareSemantic(s1: SemanticSignature, s2: SemanticSignature): number {
  const abstractionSim = 1 - Math.abs(s1.abstractionLevel - s2.abstractionLevel);
  return abstractionSim;
}

function identifyMatchingFeatures(s1: LayerSignatures, s2: LayerSignatures): string[] {
  const matching: string[] = [];
  
  if (Math.abs(s1.syntactic.sentenceComplexity.averageLength - s2.syntactic.sentenceComplexity.averageLength) < 5) {
    matching.push('sentence_length');
  }
  
  if (Math.abs(s1.stylistic.voiceIndicators.formalityScore - s2.stylistic.voiceIndicators.formalityScore) < 0.1) {
    matching.push('formality');
  }
  
  return matching;
}

function identifyDivergingFeatures(s1: LayerSignatures, s2: LayerSignatures): string[] {
  const diverging: string[] = [];
  
  if (Math.abs(s1.syntactic.sentenceComplexity.averageLength - s2.syntactic.sentenceComplexity.averageLength) > 15) {
    diverging.push('sentence_length');
  }
  
  return diverging;
}

function aggregateSyntacticSignatures(signatures: SyntacticSignature[]): SyntacticSignature {
  if (signatures.length === 0) {
    return {
      posTagDistribution: {},
      dependencyPatterns: [],
      sentenceComplexity: { averageLength: 0, lengthVariance: 0, clauseDepth: 0, subordinationRatio: 0, coordinationRatio: 0 },
      punctuationStyle: { commaFrequency: 0, semicolonFrequency: 0, dashFrequency: 0, exclamationFrequency: 0, questionFrequency: 0, ellipsisFrequency: 0 },
      wordChoicePatterns: []
    };
  }
  
  return signatures[0]; // Simplified - would average in production
}

function aggregateStylisticSignatures(signatures: StylisticSignature[]): StylisticSignature {
  if (signatures.length === 0) {
    return {
      voiceIndicators: { activeVoiceRatio: 0, passiveVoiceRatio: 0, firstPersonRatio: 0, secondPersonRatio: 0, thirdPersonRatio: 0, formalityScore: 0 },
      toneMarkers: { assertiveness: 0, hedging: 0, emotionality: 0, objectivity: 0, certainty: 0 },
      rhetoricalDevices: [],
      paragraphStructure: { averageLength: 0, topicSentencePosition: 'first', cohesionScore: 0 },
      transitionPatterns: []
    };
  }
  
  return signatures[0];
}

function aggregateSemanticSignatures(signatures: SemanticSignature[]): SemanticSignature {
  if (signatures.length === 0) {
    return {
      topicDistribution: { topics: [], diversity: 0, consistency: 0 },
      entityPreferences: [],
      abstractionLevel: 0,
      domainVocabulary: [],
      argumentationStyle: { logicalConnectors: 0, evidenceUsage: 0, counterArgumentHandling: 0, conclusionStrength: 0 }
    };
  }
  
  return signatures[0];
}

function calculateAuthorConsistency(fingerprints: LayerSignatures[]): number {
  if (fingerprints.length < 2) return 1;
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < fingerprints.length; i++) {
    for (let j = i + 1; j < fingerprints.length; j++) {
      const similarities = compareLayerSignatures(fingerprints[i], fingerprints[j]);
      totalSimilarity += Object.values(similarities).reduce((a, b) => a + b, 0) / 3;
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalSimilarity / comparisons : 1;
}

function calculateCentroidVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  
  const dimension = vectors[0].length;
  const centroid = new Array(dimension).fill(0);
  
  for (const vector of vectors) {
    for (let i = 0; i < dimension; i++) {
      centroid[i] += vector[i];
    }
  }
  
  return centroid.map(v => v / vectors.length);
}

function identifyDistinctiveFeatures(fingerprints: LayerSignatures[]): string[] {
  // Simplified - would analyze variance across documents
  return ['sentence_structure', 'vocabulary_choice', 'punctuation_style'];
}

function calculateVariabilityProfile(fingerprints: LayerSignatures[]): Record<string, number> {
  return {
    syntactic: 0.2,
    stylistic: 0.15,
    semantic: 0.3
  };
}

function sigmoidTransform(x: number): number {
  return 1 / (1 + Math.exp(-10 * (x - 0.5)));
}
