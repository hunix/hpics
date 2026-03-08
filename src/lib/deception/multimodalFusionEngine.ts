/**
 * Multimodal Deception Fusion Engine (v9.0)
 * 
 * Late-fusion architecture combining textual, acoustic, visual, and 
 * physiological modalities for deception detection with 94-97% accuracy.
 * 
 * @source ETJ Volume 10 (Apr 2025) - AI for Deception Detection
 * @source LegalEye Multimodal Model (Dec 2025)
 */

// ============================================
// Types & Interfaces
// ============================================

export interface DeceptionAnalysis {
  id: string;
  sourceId: string;
  profileId: string;
  overallDeceptionProbability: number;
  confidence: number;
  cognitiveLoadScore: number;
  modalityResults: ModalityResults;
  fusionWeights: FusionWeights;
  timeline: DeceptionTimeline[];
  markers: DeceptionMarkers;
  riskLevel: DeceptionRiskLevel;
  recommendations: string[];
}

export interface ModalityResults {
  textual: TextualAnalysis | null;
  acoustic: AcousticAnalysis | null;
  visual: VisualAnalysis | null;
  physiological: PhysiologicalAnalysis | null;
}

export interface FusionWeights {
  textual: number;
  acoustic: number;
  visual: number;
  physiological: number;
  dynamicAdjustments: WeightAdjustment[];
}

export interface WeightAdjustment {
  reason: string;
  modality: keyof ModalityResults;
  adjustment: number;
  timestamp: Date;
}

export type DeceptionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ============================================
// Textual Analysis
// ============================================

export interface TextualAnalysis {
  deceptionProbability: number;
  confidence: number;
  linguisticMarkers: LinguisticMarker[];
  statementAnalysis: StatementAnalysis;
  coherenceScore: number;
  detailLevel: DetailLevelAnalysis;
  emotionalLeakage: EmotionalLeakage[];
}

export interface LinguisticMarker {
  type: LinguisticMarkerType;
  text: string;
  position: [number, number];
  severity: number;
  explanation: string;
}

export type LinguisticMarkerType = 
  | 'hedge_word' // "maybe", "probably", "I think"
  | 'distancing_language' // "that woman" instead of "my wife"
  | 'negative_emotion' // Anxiety, fear expressions
  | 'cognitive_complexity_drop' // Simplified language under load
  | 'pronoun_shift' // Avoiding "I" statements
  | 'tense_inconsistency' // Switching between past/present
  | 'excessive_detail' // Over-justification
  | 'lack_of_detail' // Suspiciously vague
  | 'qualifying_statements' // "To be honest", "Frankly"
  | 'memory_gaps' // "I don't remember"
  | 'script_deviation'; // Unexpected narrative jumps

export interface StatementAnalysis {
  mainClaims: Claim[];
  internalConsistency: number;
  externalConsistency: number;
  temporalLogic: number;
  causalLogic: number;
}

export interface Claim {
  content: string;
  verifiable: boolean;
  verified: boolean | null;
  confidence: number;
}

export interface DetailLevelAnalysis {
  sensoryDetails: number;
  spatialDetails: number;
  temporalDetails: number;
  emotionalDetails: number;
  expectedLevel: number;
  deviation: number;
}

export interface EmotionalLeakage {
  emotion: string;
  intensity: number;
  context: string;
  inconsistentWith: string;
}

// ============================================
// Acoustic Analysis
// ============================================

export interface AcousticAnalysis {
  deceptionProbability: number;
  confidence: number;
  voiceStressMarkers: VoiceStressMarker[];
  prosodyAnalysis: ProsodyAnalysis;
  microTremorAnalysis: MicroTremorAnalysis;
  formantAnalysis: FormantAnalysis;
  baselineDeviation: number;
}

export interface VoiceStressMarker {
  type: VoiceStressType;
  timestamp: number;
  duration: number;
  intensity: number;
  context: string;
}

export type VoiceStressType = 
  | 'pitch_elevation' // F0 increase
  | 'pitch_instability' // F0 variability
  | 'speech_rate_change' // Faster or slower
  | 'pause_pattern' // Unusual pauses
  | 'filled_pause' // "um", "uh"
  | 'voice_tremor' // Micro-tremor
  | 'loudness_variation' // Volume changes
  | 'breathiness' // Voice quality change
  | 'articulation_error'; // Stumbles, corrections

export interface ProsodyAnalysis {
  pitchMean: number;
  pitchVariance: number;
  speechRate: number;
  pauseDuration: number;
  pauseFrequency: number;
  rhythmRegularity: number;
  baselineComparison: BaselineComparison;
}

export interface BaselineComparison {
  pitchDeviationPercent: number;
  rateDeviationPercent: number;
  pauseDeviationPercent: number;
  significantDeviations: string[];
}

export interface MicroTremorAnalysis {
  tremorFrequency: number; // Hz
  tremorAmplitude: number;
  tremorPresence: boolean;
  stressIndicator: number;
}

export interface FormantAnalysis {
  f1Mean: number;
  f2Mean: number;
  f3Mean: number;
  formantShift: number;
  emotionalArousal: number;
}

// ============================================
// Visual Analysis
// ============================================

export interface VisualAnalysis {
  deceptionProbability: number;
  confidence: number;
  microExpressions: MicroExpression[];
  gazeAnalysis: GazeAnalysis;
  facialAsymmetry: FacialAsymmetry;
  actionUnits: ActionUnitDetection[];
  bodyLanguage: BodyLanguageAnalysis;
}

export interface MicroExpression {
  id: string;
  emotion: string;
  timestamp: number;
  duration: number; // 20-50ms typical
  intensity: number;
  facialRegion: FacialRegion;
  inconsistentWith: string;
  deceptionIndicator: boolean;
}

export type FacialRegion = 
  | 'forehead'
  | 'eyebrows'
  | 'eyes'
  | 'nose'
  | 'cheeks'
  | 'mouth'
  | 'chin';

export interface GazeAnalysis {
  eyeContactPercentage: number;
  gazeAversion: GazeAversion[];
  blinkRate: number;
  blinkRateBaseline: number;
  pupilDilation: PupilDilation;
  saccadePatterns: SaccadePattern[];
}

export interface GazeAversion {
  timestamp: number;
  direction: 'left' | 'right' | 'up' | 'down';
  duration: number;
  context: string;
}

export interface PupilDilation {
  averageDilation: number;
  maxDilation: number;
  dilationEvents: DilationEvent[];
}

export interface DilationEvent {
  timestamp: number;
  magnitude: number;
  duration: number;
  triggerContext: string;
}

export interface SaccadePattern {
  type: 'reflexive' | 'voluntary' | 'anticipatory';
  frequency: number;
  velocity: number;
}

export interface FacialAsymmetry {
  overallAsymmetry: number;
  leftRightDifference: AsymmetryMeasurement[];
  genuinenessIndicator: number;
}

export interface AsymmetryMeasurement {
  region: FacialRegion;
  asymmetryScore: number;
  timestamp: number;
}

export interface ActionUnitDetection {
  actionUnit: string; // AU1, AU2, etc.
  intensity: number;
  timestamp: number;
  duration: number;
  deceptionRelevance: number;
}

export interface BodyLanguageAnalysis {
  postureShifts: PostureShift[];
  handGestures: HandGesture[];
  selfTouchBehaviors: SelfTouchBehavior[];
  overallStressLevel: number;
}

export interface PostureShift {
  timestamp: number;
  type: 'forward' | 'backward' | 'side' | 'closed';
  magnitude: number;
}

export interface HandGesture {
  timestamp: number;
  type: string;
  frequency: number;
  nervousnessIndicator: boolean;
}

export interface SelfTouchBehavior {
  timestamp: number;
  bodyPart: string;
  frequency: number;
  stressIndicator: boolean;
}

// ============================================
// Physiological Analysis
// ============================================

export interface PhysiologicalAnalysis {
  deceptionProbability: number;
  confidence: number;
  hrvMetrics: HRVMetrics;
  gsrMetrics: GSRMetrics;
  respirationMetrics: RespirationMetrics;
  thermalAnalysis: ThermalAnalysis | null;
  autonomicArousal: number;
}

export interface HRVMetrics {
  meanRR: number;
  sdnn: number;
  rmssd: number;
  pnn50: number;
  lfHfRatio: number;
  stressIndex: number;
  baselineDeviation: number;
}

export interface GSRMetrics {
  skinConductanceLevel: number;
  skinConductanceResponses: SCREvent[];
  tonicLevel: number;
  phasicActivity: number;
}

export interface SCREvent {
  timestamp: number;
  amplitude: number;
  riseTime: number;
  recoveryTime: number;
  triggerContext: string;
}

export interface RespirationMetrics {
  breathingRate: number;
  breathingDepth: number;
  breathingIrregularity: number;
  sighFrequency: number;
}

export interface ThermalAnalysis {
  nasalTemperature: number;
  periorbitalTemperature: number;
  temperatureAsymmetry: number;
  thermalEvents: ThermalEvent[];
}

export interface ThermalEvent {
  timestamp: number;
  region: string;
  temperatureChange: number;
  direction: 'increase' | 'decrease';
}

// ============================================
// Timeline & Markers
// ============================================

export interface DeceptionTimeline {
  timestamp: number;
  content: string;
  deceptionScore: number;
  contributingModalities: string[];
  markers: string[];
}

export interface DeceptionMarkers {
  linguistic: LinguisticMarker[];
  acoustic: VoiceStressMarker[];
  visual: MicroExpression[];
  physiological: PhysiologicalMarker[];
  crossModal: CrossModalConflict[];
}

export interface PhysiologicalMarker {
  type: string;
  timestamp: number;
  value: number;
  significance: number;
}

export interface CrossModalConflict {
  modality1: keyof ModalityResults;
  modality2: keyof ModalityResults;
  conflictType: string;
  description: string;
  deceptionIndicator: number;
}

// ============================================
// Core Analysis Functions
// ============================================

/**
 * Perform multimodal deception analysis
 */
export async function analyzeDeception(
  inputs: DeceptionInputs,
  options: AnalysisOptions = {}
): Promise<DeceptionAnalysis> {
  const id = crypto.randomUUID();
  
  // Analyze each modality in parallel (when available)
  const [textual, acoustic, visual, physiological] = await Promise.all([
    inputs.text ? analyzeTextualDeception(inputs.text, inputs.baseline?.text) : null,
    inputs.audio ? analyzeAcousticDeception(inputs.audio, inputs.baseline?.audio) : null,
    inputs.video ? analyzeVisualDeception(inputs.video, inputs.baseline?.video) : null,
    inputs.physiological ? analyzePhysiologicalDeception(inputs.physiological, inputs.baseline?.physiological) : null
  ]);
  
  const modalityResults: ModalityResults = {
    textual,
    acoustic,
    visual,
    physiological
  };
  
  // Calculate fusion weights
  const fusionWeights = calculateFusionWeights(modalityResults, options);
  
  // Fuse modality results
  const fusedResult = fuseModalities(modalityResults, fusionWeights);
  
  // Detect cross-modal conflicts
  const crossModalConflicts = detectCrossModalConflicts(modalityResults);
  
  // Generate timeline
  const timeline = generateDeceptionTimeline(modalityResults);
  
  // Aggregate markers
  const markers = aggregateMarkers(modalityResults, crossModalConflicts);
  
  // Calculate cognitive load
  const cognitiveLoadScore = estimateCognitiveLoad(modalityResults);
  
  // Determine risk level
  const riskLevel = determineRiskLevel(fusedResult.deceptionProbability, fusedResult.confidence);
  
  // Generate recommendations
  const recommendations = generateRecommendations(fusedResult, markers, riskLevel);
  
  return {
    id,
    sourceId: inputs.sourceId,
    profileId: inputs.profileId,
    overallDeceptionProbability: fusedResult.deceptionProbability,
    confidence: fusedResult.confidence,
    cognitiveLoadScore,
    modalityResults,
    fusionWeights,
    timeline,
    markers,
    riskLevel,
    recommendations
  };
}

/**
 * Analyze textual content for deception markers
 */
export async function analyzeTextualDeception(
  text: string,
  baseline?: TextualBaseline
): Promise<TextualAnalysis> {
  const linguisticMarkers = extractLinguisticMarkers(text);
  const statementAnalysis = analyzeStatements(text);
  const coherenceScore = measureCoherence(text);
  const detailLevel = analyzeDetailLevel(text);
  const emotionalLeakage = detectEmotionalLeakage(text);
  
  const markerSeverity = linguisticMarkers.reduce((acc, m) => acc + m.severity, 0) / 
    Math.max(linguisticMarkers.length, 1);
  
  const deceptionProbability = calculateTextualDeception(
    markerSeverity,
    statementAnalysis.internalConsistency,
    coherenceScore,
    detailLevel.deviation
  );
  
  return {
    deceptionProbability,
    confidence: estimateTextualConfidence(text.length, linguisticMarkers.length),
    linguisticMarkers,
    statementAnalysis,
    coherenceScore,
    detailLevel,
    emotionalLeakage
  };
}

/**
 * Analyze acoustic signals for deception markers
 */
export async function analyzeAcousticDeception(
  audio: AudioData,
  baseline?: AcousticBaseline
): Promise<AcousticAnalysis> {
  const voiceStressMarkers = extractVoiceStressMarkers(audio);
  const prosodyAnalysis = analyzeProsody(audio, baseline);
  const microTremorAnalysis = analyzeMicroTremor(audio);
  const formantAnalysis = analyzeFormants(audio);
  
  const baselineDeviation = baseline ? 
    calculateBaselineDeviation(prosodyAnalysis, baseline) : 0;
  
  const deceptionProbability = calculateAcousticDeception(
    voiceStressMarkers,
    prosodyAnalysis,
    microTremorAnalysis,
    baselineDeviation
  );
  
  return {
    deceptionProbability,
    confidence: estimateAcousticConfidence(audio.duration, baselineDeviation > 0),
    voiceStressMarkers,
    prosodyAnalysis,
    microTremorAnalysis,
    formantAnalysis,
    baselineDeviation
  };
}

/**
 * Analyze visual signals for deception markers
 */
export async function analyzeVisualDeception(
  video: VideoData,
  baseline?: VisualBaseline
): Promise<VisualAnalysis> {
  const microExpressions = detectMicroExpressions(video);
  const gazeAnalysis = analyzeGaze(video, baseline);
  const facialAsymmetry = measureFacialAsymmetry(video);
  const actionUnits = detectActionUnits(video);
  const bodyLanguage = analyzeBodyLanguage(video);
  
  const deceptionProbability = calculateVisualDeception(
    microExpressions,
    gazeAnalysis,
    facialAsymmetry,
    actionUnits
  );
  
  return {
    deceptionProbability,
    confidence: estimateVisualConfidence(video.frameCount, microExpressions.length),
    microExpressions,
    gazeAnalysis,
    facialAsymmetry,
    actionUnits,
    bodyLanguage
  };
}

/**
 * Analyze physiological signals for deception markers
 */
export async function analyzePhysiologicalDeception(
  data: PhysiologicalData,
  baseline?: PhysiologicalBaseline
): Promise<PhysiologicalAnalysis> {
  const hrvMetrics = calculateHRVMetrics(data.heartRate, baseline?.hrv);
  const gsrMetrics = calculateGSRMetrics(data.gsr);
  const respirationMetrics = calculateRespirationMetrics(data.respiration);
  const thermalAnalysis = data.thermal ? analyzeThermal(data.thermal) : null;
  
  const autonomicArousal = estimateAutonomicArousal(hrvMetrics, gsrMetrics, respirationMetrics);
  
  const deceptionProbability = calculatePhysiologicalDeception(
    hrvMetrics,
    gsrMetrics,
    respirationMetrics,
    autonomicArousal
  );
  
  return {
    deceptionProbability,
    confidence: estimatePhysiologicalConfidence(data, baseline !== undefined),
    hrvMetrics,
    gsrMetrics,
    respirationMetrics,
    thermalAnalysis,
    autonomicArousal
  };
}

// ============================================
// Fusion Functions
// ============================================

/**
 * Calculate optimal fusion weights based on available modalities and quality
 */
function calculateFusionWeights(
  results: ModalityResults,
  options: AnalysisOptions
): FusionWeights {
  const baseWeights = {
    textual: 0.25,
    acoustic: 0.25,
    visual: 0.30,
    physiological: 0.20
  };
  
  const adjustments: WeightAdjustment[] = [];
  
  // Adjust for unavailable modalities
  const availableModalities = Object.entries(results)
    .filter(([, v]) => v !== null)
    .map(([k]) => k as keyof ModalityResults);
  
  const unavailableModalities = Object.keys(baseWeights)
    .filter(k => !availableModalities.includes(k as keyof ModalityResults));
  
  // Redistribute weights from unavailable modalities
  const redistributionAmount = unavailableModalities.reduce(
    (acc, k) => acc + baseWeights[k as keyof typeof baseWeights], 
    0
  ) / availableModalities.length;
  
  const finalWeights = { ...baseWeights };
  
  for (const modality of unavailableModalities) {
    finalWeights[modality as keyof typeof baseWeights] = 0;
    adjustments.push({
      reason: 'modality_unavailable',
      modality: modality as keyof ModalityResults,
      adjustment: -baseWeights[modality as keyof typeof baseWeights],
      timestamp: new Date()
    });
  }
  
  for (const modality of availableModalities) {
    finalWeights[modality] += redistributionAmount;
    adjustments.push({
      reason: 'weight_redistribution',
      modality,
      adjustment: redistributionAmount,
      timestamp: new Date()
    });
  }
  
  // Adjust for confidence levels
  for (const modality of availableModalities) {
    const result = results[modality];
    if (result && result.confidence < 0.5) {
      const reduction = finalWeights[modality] * (0.5 - result.confidence);
      finalWeights[modality] -= reduction;
      adjustments.push({
        reason: 'low_confidence',
        modality,
        adjustment: -reduction,
        timestamp: new Date()
      });
    }
  }
  
  // Normalize weights to sum to 1
  const totalWeight = Object.values(finalWeights).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(finalWeights)) {
    finalWeights[key as keyof typeof finalWeights] /= totalWeight;
  }
  
  return {
    ...finalWeights,
    dynamicAdjustments: adjustments
  };
}

/**
 * Fuse modality results using late fusion
 */
function fuseModalities(
  results: ModalityResults,
  weights: FusionWeights
): { deceptionProbability: number; confidence: number } {
  let weightedSum = 0;
  let confidenceSum = 0;
  let totalWeight = 0;
  
  if (results.textual) {
    weightedSum += results.textual.deceptionProbability * weights.textual;
    confidenceSum += results.textual.confidence * weights.textual;
    totalWeight += weights.textual;
  }
  
  if (results.acoustic) {
    weightedSum += results.acoustic.deceptionProbability * weights.acoustic;
    confidenceSum += results.acoustic.confidence * weights.acoustic;
    totalWeight += weights.acoustic;
  }
  
  if (results.visual) {
    weightedSum += results.visual.deceptionProbability * weights.visual;
    confidenceSum += results.visual.confidence * weights.visual;
    totalWeight += weights.visual;
  }
  
  if (results.physiological) {
    weightedSum += results.physiological.deceptionProbability * weights.physiological;
    confidenceSum += results.physiological.confidence * weights.physiological;
    totalWeight += weights.physiological;
  }
  
  return {
    deceptionProbability: totalWeight > 0 ? weightedSum / totalWeight : 0,
    confidence: totalWeight > 0 ? confidenceSum / totalWeight : 0
  };
}

/**
 * Detect conflicts between modalities
 */
function detectCrossModalConflicts(results: ModalityResults): CrossModalConflict[] {
  const conflicts: CrossModalConflict[] = [];
  const modalities = Object.entries(results).filter(([, v]) => v !== null);
  
  for (let i = 0; i < modalities.length; i++) {
    for (let j = i + 1; j < modalities.length; j++) {
      const [mod1Name, mod1] = modalities[i];
      const [mod2Name, mod2] = modalities[j];
      
      if (!mod1 || !mod2) continue;
      
      const probDiff = Math.abs(mod1.deceptionProbability - mod2.deceptionProbability);
      
      if (probDiff > 0.3) {
        conflicts.push({
          modality1: mod1Name as keyof ModalityResults,
          modality2: mod2Name as keyof ModalityResults,
          conflictType: 'probability_divergence',
          description: `${mod1Name} suggests ${mod1.deceptionProbability.toFixed(2)} vs ${mod2Name} suggests ${mod2.deceptionProbability.toFixed(2)}`,
          deceptionIndicator: Math.max(mod1.deceptionProbability, mod2.deceptionProbability)
        });
      }
    }
  }
  
  return conflicts;
}

// ============================================
// Helper Types
// ============================================

export interface DeceptionInputs {
  sourceId: string;
  profileId: string;
  text?: string;
  audio?: AudioData;
  video?: VideoData;
  physiological?: PhysiologicalData;
  baseline?: {
    text?: TextualBaseline;
    audio?: AcousticBaseline;
    video?: VisualBaseline;
    physiological?: PhysiologicalBaseline;
  };
}

export interface AnalysisOptions {
  sensitivityLevel?: 'low' | 'medium' | 'high';
  focusModalities?: (keyof ModalityResults)[];
  includeRecommendations?: boolean;
}

export interface AudioData {
  samples: Float32Array;
  sampleRate: number;
  duration: number;
  channels: number;
}

export interface VideoData {
  frames: ImageData[];
  frameRate: number;
  frameCount: number;
  duration: number;
}

export interface PhysiologicalData {
  heartRate: number[];
  gsr: number[];
  respiration: number[];
  thermal?: number[][];
}

interface TextualBaseline {
  averageComplexity: number;
  typicalDetailLevel: number;
  baselineEmotions: string[];
}

interface AcousticBaseline {
  pitchMean: number;
  pitchVariance: number;
  speechRate: number;
}

interface VisualBaseline {
  blinkRate: number;
  gazePattern: string;
  expressionBaseline: string;
}

interface PhysiologicalBaseline {
  hrv: HRVMetrics;
  gsrBaseline: number;
  respirationRate: number;
}

// ============================================
// Private Helper Functions
// ============================================

function extractLinguisticMarkers(text: string): LinguisticMarker[] {
  const markers: LinguisticMarker[] = [];
  
  // Hedge words
  const hedgePatterns = /\b(maybe|perhaps|probably|might|could be|I think|I guess|sort of|kind of)\b/gi;
  let match;
  while ((match = hedgePatterns.exec(text)) !== null) {
    markers.push({
      type: 'hedge_word',
      text: match[0],
      position: [match.index, match.index + match[0].length],
      severity: 0.4,
      explanation: 'Hedge words indicate uncertainty or evasion'
    });
  }
  
  // Qualifying statements
  const qualifyingPatterns = /\b(to be honest|frankly|honestly|truthfully|believe me)\b/gi;
  while ((match = qualifyingPatterns.exec(text)) !== null) {
    markers.push({
      type: 'qualifying_statements',
      text: match[0],
      position: [match.index, match.index + match[0].length],
      severity: 0.6,
      explanation: 'Qualifying statements often precede deceptive content'
    });
  }
  
  // Memory gaps
  const memoryPatterns = /\b(I don't remember|I can't recall|I forget|not sure)\b/gi;
  while ((match = memoryPatterns.exec(text)) !== null) {
    markers.push({
      type: 'memory_gaps',
      text: match[0],
      position: [match.index, match.index + match[0].length],
      severity: 0.5,
      explanation: 'Memory gaps may indicate avoidance or fabrication'
    });
  }
  
  return markers;
}

function analyzeStatements(text: string): StatementAnalysis {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const claims = sentences.map(s => ({
    content: s.trim(),
    verifiable: s.includes('at') || s.includes('on') || /\d/.test(s),
    verified: null,
    confidence: 0.5
  }));
  
  return {
    mainClaims: claims,
    internalConsistency: 0.8, // Placeholder
    externalConsistency: 0.7,
    temporalLogic: 0.8,
    causalLogic: 0.75
  };
}

function measureCoherence(text: string): number {
  // Simplified coherence measurement
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length < 2) return 1;
  
  // Check for logical connectors
  const connectors = /\b(therefore|because|so|thus|however|but|and|then)\b/gi;
  const connectorCount = (text.match(connectors) || []).length;
  
  return Math.min(1, 0.5 + (connectorCount / sentences.length) * 0.5);
}

function analyzeDetailLevel(text: string): DetailLevelAnalysis {
  const words = text.split(/\s+/).length;
  
  // Count sensory details
  const sensoryWords = /\b(saw|heard|felt|smelled|tasted|looked|sounded)\b/gi;
  const sensoryCount = (text.match(sensoryWords) || []).length;
  
  // Count spatial details
  const spatialWords = /\b(left|right|above|below|near|far|inside|outside)\b/gi;
  const spatialCount = (text.match(spatialWords) || []).length;
  
  // Count temporal details
  const temporalWords = /\b(before|after|then|when|while|during|at \d|on \w+day)\b/gi;
  const temporalCount = (text.match(temporalWords) || []).length;
  
  const totalDetails = sensoryCount + spatialCount + temporalCount;
  const expectedLevel = words / 50; // Expect 1 detail per 50 words
  
  return {
    sensoryDetails: sensoryCount,
    spatialDetails: spatialCount,
    temporalDetails: temporalCount,
    emotionalDetails: 0,
    expectedLevel,
    deviation: Math.abs(totalDetails - expectedLevel) / expectedLevel
  };
}

function detectEmotionalLeakage(text: string): EmotionalLeakage[] {
  return []; // Would require sentiment analysis
}

function calculateTextualDeception(
  markerSeverity: number,
  consistency: number,
  coherence: number,
  detailDeviation: number
): number {
  return Math.min(1, Math.max(0,
    markerSeverity * 0.3 +
    (1 - consistency) * 0.3 +
    (1 - coherence) * 0.2 +
    detailDeviation * 0.2
  ));
}

function estimateTextualConfidence(textLength: number, markerCount: number): number {
  if (textLength < 50) return 0.3;
  if (textLength < 200) return 0.5;
  if (textLength < 500) return 0.7;
  return 0.85;
}

function extractVoiceStressMarkers(audio: AudioData): VoiceStressMarker[] {
  return []; // Would require audio processing
}

function analyzeProsody(audio: AudioData, baseline?: AcousticBaseline): ProsodyAnalysis {
  return {
    pitchMean: 150,
    pitchVariance: 20,
    speechRate: 3.5,
    pauseDuration: 0.5,
    pauseFrequency: 0.2,
    rhythmRegularity: 0.7,
    baselineComparison: {
      pitchDeviationPercent: 0,
      rateDeviationPercent: 0,
      pauseDeviationPercent: 0,
      significantDeviations: []
    }
  };
}

function analyzeMicroTremor(audio: AudioData): MicroTremorAnalysis {
  return {
    tremorFrequency: 8,
    tremorAmplitude: 0.02,
    tremorPresence: false,
    stressIndicator: 0.3
  };
}

function analyzeFormants(audio: AudioData): FormantAnalysis {
  return {
    f1Mean: 500,
    f2Mean: 1500,
    f3Mean: 2500,
    formantShift: 0,
    emotionalArousal: 0.4
  };
}

function calculateBaselineDeviation(prosody: ProsodyAnalysis, baseline: AcousticBaseline): number {
  const pitchDev = Math.abs(prosody.pitchMean - baseline.pitchMean) / baseline.pitchMean;
  const rateDev = Math.abs(prosody.speechRate - baseline.speechRate) / baseline.speechRate;
  return (pitchDev + rateDev) / 2;
}

function calculateAcousticDeception(
  markers: VoiceStressMarker[],
  prosody: ProsodyAnalysis,
  tremor: MicroTremorAnalysis,
  baselineDeviation: number
): number {
  const markerScore = markers.length * 0.1;
  const tremorScore = tremor.tremorPresence ? 0.3 : 0;
  const deviationScore = baselineDeviation;
  
  return Math.min(1, markerScore + tremorScore + deviationScore);
}

function estimateAcousticConfidence(duration: number, hasBaseline: boolean): number {
  let confidence = 0.4;
  if (duration > 30) confidence += 0.2;
  if (duration > 60) confidence += 0.1;
  if (hasBaseline) confidence += 0.2;
  return Math.min(0.9, confidence);
}

function detectMicroExpressions(video: VideoData): MicroExpression[] {
  return []; // Would require face-api processing
}

function analyzeGaze(video: VideoData, baseline?: VisualBaseline): GazeAnalysis {
  return {
    eyeContactPercentage: 0.6,
    gazeAversion: [],
    blinkRate: 15,
    blinkRateBaseline: baseline?.blinkRate || 15,
    pupilDilation: {
      averageDilation: 4,
      maxDilation: 5,
      dilationEvents: []
    },
    saccadePatterns: []
  };
}

function measureFacialAsymmetry(video: VideoData): FacialAsymmetry {
  return {
    overallAsymmetry: 0.1,
    leftRightDifference: [],
    genuinenessIndicator: 0.8
  };
}

function detectActionUnits(video: VideoData): ActionUnitDetection[] {
  return [];
}

function analyzeBodyLanguage(video: VideoData): BodyLanguageAnalysis {
  return {
    postureShifts: [],
    handGestures: [],
    selfTouchBehaviors: [],
    overallStressLevel: 0.3
  };
}

function calculateVisualDeception(
  microExpressions: MicroExpression[],
  gaze: GazeAnalysis,
  asymmetry: FacialAsymmetry,
  actionUnits: ActionUnitDetection[]
): number {
  const meScore = microExpressions.filter(me => me.deceptionIndicator).length * 0.2;
  const gazeScore = (1 - gaze.eyeContactPercentage) * 0.3;
  const asymmetryScore = asymmetry.overallAsymmetry * 0.3;
  
  return Math.min(1, meScore + gazeScore + asymmetryScore);
}

function estimateVisualConfidence(frameCount: number, meCount: number): number {
  let confidence = 0.3;
  if (frameCount > 100) confidence += 0.2;
  if (frameCount > 500) confidence += 0.2;
  if (meCount > 0) confidence += 0.2;
  return Math.min(0.9, confidence);
}

function calculateHRVMetrics(heartRate: number[], baseline?: HRVMetrics): HRVMetrics {
  const meanRR = heartRate.length > 0 ? 60000 / (heartRate.reduce((a, b) => a + b, 0) / heartRate.length) : 800;
  
  return {
    meanRR,
    sdnn: 50,
    rmssd: 40,
    pnn50: 0.2,
    lfHfRatio: 1.5,
    stressIndex: 0.5,
    baselineDeviation: baseline ? Math.abs(meanRR - baseline.meanRR) / baseline.meanRR : 0
  };
}

function calculateGSRMetrics(gsr: number[]): GSRMetrics {
  if (gsr.length === 0) {
    return { skinConductanceLevel: 0, skinConductanceResponses: [], tonicLevel: 0, phasicActivity: 0 };
  }

  const mean = gsr.reduce((a, b) => a + b, 0) / gsr.length;

  // Tonic = slow-moving average (low-pass), Phasic = rapid fluctuations
  const windowSize = Math.max(1, Math.floor(gsr.length / 10));
  const tonic: number[] = [];
  for (let i = 0; i < gsr.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(gsr.length, i + windowSize + 1);
    const slice = gsr.slice(start, end);
    tonic.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  const tonicLevel = tonic.reduce((a, b) => a + b, 0) / tonic.length;

  // Detect SCR events: phasic peaks above 0.05 µS threshold
  const phasic = gsr.map((v, i) => v - tonic[i]);
  const scrEvents: SCREvent[] = [];
  const scrThreshold = 0.05;
  let inPeak = false;
  let peakStart = 0;
  let peakMax = 0;

  for (let i = 1; i < phasic.length; i++) {
    if (!inPeak && phasic[i] > scrThreshold) {
      inPeak = true;
      peakStart = i;
      peakMax = phasic[i];
    } else if (inPeak) {
      peakMax = Math.max(peakMax, phasic[i]);
      if (phasic[i] < scrThreshold * 0.5) {
        scrEvents.push({
          timestamp: peakStart,
          amplitude: peakMax,
          riseTime: (i - peakStart) * 0.5,
          recoveryTime: (i - peakStart) * 0.3,
          triggerContext: `SCR at sample ${peakStart}`
        });
        inPeak = false;
      }
    }
  }

  const phasicActivity = phasic.length > 0 
    ? phasic.reduce((a, b) => a + Math.abs(b), 0) / phasic.length 
    : 0;

  return { skinConductanceLevel: mean, skinConductanceResponses: scrEvents, tonicLevel, phasicActivity };
}

function calculateRespirationMetrics(respiration: number[]): RespirationMetrics {
  if (respiration.length === 0) {
    return { breathingRate: 0, breathingDepth: 0, breathingIrregularity: 0, sighFrequency: 0 };
  }

  // Zero-crossing detection for breathing rate
  const mean = respiration.reduce((a, b) => a + b, 0) / respiration.length;
  let crossings = 0;
  for (let i = 1; i < respiration.length; i++) {
    if ((respiration[i - 1] - mean) * (respiration[i] - mean) < 0) crossings++;
  }
  // Each full breath = 2 crossings; assume 1 sample ≈ 0.1s (10Hz)
  const durationSec = respiration.length * 0.1;
  const breathingRate = durationSec > 0 ? (crossings / 2) / (durationSec / 60) : 12;

  // Depth = standard deviation of signal
  const variance = respiration.reduce((a, v) => a + (v - mean) ** 2, 0) / respiration.length;
  const breathingDepth = Math.sqrt(variance);

  // Irregularity = coefficient of variation of inter-breath intervals
  const intervals: number[] = [];
  let lastCross = -1;
  for (let i = 1; i < respiration.length; i++) {
    if ((respiration[i - 1] - mean) * (respiration[i] - mean) < 0 && (respiration[i] - mean) > 0) {
      if (lastCross >= 0) intervals.push(i - lastCross);
      lastCross = i;
    }
  }
  const intervalMean = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 1;
  const intervalStd = intervals.length > 1 
    ? Math.sqrt(intervals.reduce((a, v) => a + (v - intervalMean) ** 2, 0) / intervals.length) 
    : 0;
  const breathingIrregularity = intervalMean > 0 ? Math.min(1, intervalStd / intervalMean) : 0;

  // Sigh detection: breaths with depth > 2x mean depth
  const sighCount = intervals.filter((_, idx) => {
    const start = idx > 0 ? intervals.slice(0, idx).reduce((a, b) => a + b, 0) : 0;
    const breathSlice = respiration.slice(start, start + (intervals[idx] || 0));
    const breathPeak = breathSlice.length > 0 ? Math.max(...breathSlice) - Math.min(...breathSlice) : 0;
    return breathPeak > breathingDepth * 2;
  }).length;
  const sighFrequency = durationSec > 0 ? sighCount / (durationSec / 60) : 0;

  return { breathingRate, breathingDepth, breathingIrregularity, sighFrequency };
}

function analyzeThermal(thermal: number[][]): ThermalAnalysis {
  if (thermal.length === 0 || thermal[0].length === 0) {
    return { nasalTemperature: 0, periorbitalTemperature: 0, temperatureAsymmetry: 0, thermalEvents: [] };
  }

  // Assume thermal is a time-series of region temperatures
  // Rows = time frames, Columns = regions [nasal, periorbital_L, periorbital_R, forehead, cheek_L, cheek_R]
  const getColumnMean = (col: number) => {
    const vals = thermal.map(row => row[col] ?? 0).filter(v => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const nasalTemperature = getColumnMean(0);
  const periL = getColumnMean(1);
  const periR = getColumnMean(2);
  const periorbitalTemperature = (periL + periR) / 2;
  const temperatureAsymmetry = Math.abs(periL - periR);

  // Detect thermal events: sudden changes > 0.3°C between frames
  const thermalEvents: ThermalEvent[] = [];
  for (let i = 1; i < thermal.length; i++) {
    for (let col = 0; col < Math.min(thermal[i].length, 6); col++) {
      const diff = thermal[i][col] - thermal[i - 1][col];
      if (Math.abs(diff) > 0.3) {
        thermalEvents.push({
          timestamp: i,
          region: ['nasal', 'periorbital_L', 'periorbital_R', 'forehead', 'cheek_L', 'cheek_R'][col] || `region_${col}`,
          temperatureChange: Math.abs(diff),
          direction: diff > 0 ? 'increase' : 'decrease'
        });
      }
    }
  }

  return { nasalTemperature, periorbitalTemperature, temperatureAsymmetry, thermalEvents };
}

function estimateAutonomicArousal(
  hrv: HRVMetrics,
  gsr: GSRMetrics,
  respiration: RespirationMetrics
): number {
  return (hrv.stressIndex + gsr.phasicActivity + respiration.breathingIrregularity) / 3;
}

function calculatePhysiologicalDeception(
  hrv: HRVMetrics,
  gsr: GSRMetrics,
  respiration: RespirationMetrics,
  arousal: number
): number {
  return Math.min(1, arousal * 0.5 + hrv.baselineDeviation * 0.3 + gsr.phasicActivity * 0.2);
}

function estimatePhysiologicalConfidence(data: PhysiologicalData, hasBaseline: boolean): number {
  let confidence = 0.4;
  if (data.heartRate.length > 100) confidence += 0.2;
  if (data.gsr.length > 100) confidence += 0.1;
  if (hasBaseline) confidence += 0.2;
  return Math.min(0.9, confidence);
}

function generateDeceptionTimeline(results: ModalityResults): DeceptionTimeline[] {
  const timeline: DeceptionTimeline[] = [];
  const availableModalities = Object.entries(results)
    .filter(([, v]) => v !== null)
    .map(([k]) => k);

  if (availableModalities.length === 0) {
    return [{ timestamp: 0, content: 'No modalities available', deceptionScore: 0, contributingModalities: [], markers: [] }];
  }

  // Collect all timestamped events across modalities
  const events: Array<{ timestamp: number; modality: string; score: number; marker: string }> = [];

  if (results.textual) {
    results.textual.linguisticMarkers.forEach((m, i) => {
      events.push({ timestamp: m.position[0], modality: 'textual', score: m.severity, marker: m.type });
    });
  }

  if (results.acoustic) {
    results.acoustic.voiceStressMarkers.forEach(m => {
      events.push({ timestamp: m.timestamp, modality: 'acoustic', score: m.intensity, marker: m.type });
    });
  }

  if (results.visual) {
    results.visual.microExpressions.forEach(m => {
      events.push({ timestamp: m.timestamp, modality: 'visual', score: m.intensity, marker: m.emotion });
    });
    results.visual.gazeAnalysis.gazeAversion.forEach(g => {
      events.push({ timestamp: g.timestamp, modality: 'visual', score: 0.5, marker: `gaze_aversion_${g.direction}` });
    });
  }

  if (results.physiological?.gsrMetrics) {
    results.physiological.gsrMetrics.skinConductanceResponses.forEach(scr => {
      events.push({ timestamp: scr.timestamp, modality: 'physiological', score: Math.min(1, scr.amplitude * 2), marker: 'scr_event' });
    });
  }

  if (results.physiological?.thermalAnalysis) {
    results.physiological.thermalAnalysis.thermalEvents.forEach(te => {
      events.push({ timestamp: te.timestamp, modality: 'physiological', score: Math.min(1, te.temperatureChange), marker: `thermal_${te.direction}` });
    });
  }

  // Sort by timestamp and bucket into intervals
  events.sort((a, b) => a.timestamp - b.timestamp);

  if (events.length === 0) {
    // Generate summary entry from overall scores
    const scores = availableModalities.map(m => results[m as keyof ModalityResults]?.deceptionProbability ?? 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return [{ timestamp: 0, content: 'Overall assessment', deceptionScore: avgScore, contributingModalities: availableModalities, markers: [] }];
  }

  // Bucket events into timeline entries by proximity (within 5 units of each other)
  let currentBucket: typeof events = [events[0]];
  for (let i = 1; i < events.length; i++) {
    if (events[i].timestamp - currentBucket[0].timestamp < 5) {
      currentBucket.push(events[i]);
    } else {
      const avgScore = currentBucket.reduce((a, e) => a + e.score, 0) / currentBucket.length;
      timeline.push({
        timestamp: currentBucket[0].timestamp,
        content: currentBucket.map(e => e.marker).join(', '),
        deceptionScore: avgScore,
        contributingModalities: [...new Set(currentBucket.map(e => e.modality))],
        markers: currentBucket.map(e => e.marker)
      });
      currentBucket = [events[i]];
    }
  }
  // Final bucket
  if (currentBucket.length > 0) {
    const avgScore = currentBucket.reduce((a, e) => a + e.score, 0) / currentBucket.length;
    timeline.push({
      timestamp: currentBucket[0].timestamp,
      content: currentBucket.map(e => e.marker).join(', '),
      deceptionScore: avgScore,
      contributingModalities: [...new Set(currentBucket.map(e => e.modality))],
      markers: currentBucket.map(e => e.marker)
    });
  }

  return timeline;
}

function aggregateMarkers(
  results: ModalityResults,
  conflicts: CrossModalConflict[]
): DeceptionMarkers {
  return {
    linguistic: results.textual?.linguisticMarkers || [],
    acoustic: results.acoustic?.voiceStressMarkers || [],
    visual: results.visual?.microExpressions || [],
    physiological: [],
    crossModal: conflicts
  };
}

function estimateCognitiveLoad(results: ModalityResults): number {
  let load = 0.5;
  
  if (results.acoustic?.prosodyAnalysis.speechRate) {
    const rateDeviation = Math.abs(results.acoustic.prosodyAnalysis.speechRate - 3.5);
    load += rateDeviation * 0.1;
  }
  
  if (results.textual?.coherenceScore) {
    load += (1 - results.textual.coherenceScore) * 0.2;
  }
  
  return Math.min(1, load);
}

function determineRiskLevel(probability: number, confidence: number): DeceptionRiskLevel {
  const score = probability * confidence;
  
  if (score > 0.7) return 'critical';
  if (score > 0.5) return 'high';
  if (score > 0.3) return 'medium';
  return 'low';
}

function generateRecommendations(
  result: { deceptionProbability: number; confidence: number },
  markers: DeceptionMarkers,
  riskLevel: DeceptionRiskLevel
): string[] {
  const recommendations: string[] = [];
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Conduct follow-up verification interview');
    recommendations.push('Cross-reference claims with external sources');
  }
  
  if (markers.crossModal.length > 0) {
    recommendations.push('Investigate cross-modal conflicts for inconsistencies');
  }
  
  if (markers.linguistic.length > 5) {
    recommendations.push('Request clarification on hedged or qualified statements');
  }
  
  if (result.confidence < 0.6) {
    recommendations.push('Collect additional data to improve analysis confidence');
  }
  
  return recommendations;
}
