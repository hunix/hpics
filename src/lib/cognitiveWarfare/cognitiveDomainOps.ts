/**
 * Cognitive Domain Operations (CDO) Suite (v9.0)
 * 
 * Implements PLA "Brain Dominance" (制脑权) doctrine and NATO Cognitive Warfare studies.
 * Targets the human brain as a strategic domain alongside land, sea, air, and cyber.
 * 
 * @source PLA Strategic Support Force doctrine
 * @source NATO Allied Command Transformation - Cognitive Warfare studies
 */

// ============================================
// Types & Interfaces
// ============================================

export interface CognitiveOperationPlan {
  id: string;
  targetProfileId: string;
  operationType: CognitiveOperationType;
  objectives: CognitiveObjective[];
  phases: OperationPhase[];
  resourceRequirements: ResourceRequirement[];
  riskAssessment: RiskAssessment;
  expectedOutcomes: ExpectedOutcome[];
  metrics: OperationMetrics;
}

export type CognitiveOperationType = 
  | 'perception_shaping'
  | 'cognitive_friction'
  | 'belief_synthesis'
  | 'mental_model_mapping'
  | 'attention_manipulation'
  | 'decision_paralysis'
  | 'reality_distortion';

export interface CognitiveObjective {
  id: string;
  type: ObjectiveType;
  target: string;
  desiredState: string;
  priority: number;
  timeline: number; // Days
  dependencies: string[];
}

export type ObjectiveType = 
  | 'belief_modification'
  | 'perception_alteration'
  | 'decision_influence'
  | 'attention_capture'
  | 'trust_erosion'
  | 'cognitive_overload';

export interface OperationPhase {
  id: string;
  name: string;
  duration: number;
  activities: CognitiveActivity[];
  successCriteria: string[];
  fallbackPlan: string;
}

export interface CognitiveActivity {
  id: string;
  type: ActivityType;
  description: string;
  inputs: string[];
  outputs: string[];
  gpuRequirement?: GPURequirement;
}

export type ActivityType = 
  | 'information_injection'
  | 'attention_diversion'
  | 'cognitive_load_increase'
  | 'emotional_priming'
  | 'belief_anchoring'
  | 'reality_testing_disruption';

export interface GPURequirement {
  device: 'rtx_3090ti' | 'rtx_titan' | 'rtx_pro_6000';
  vramRequired: number; // GB
  estimatedDuration: number; // seconds
}

export interface ResourceRequirement {
  type: 'compute' | 'data' | 'human' | 'time';
  quantity: number;
  unit: string;
}

export interface RiskAssessment {
  detectionProbability: number;
  blowbackRisk: number;
  escalationRisk: number;
  mitigationStrategies: string[];
}

export interface ExpectedOutcome {
  scenario: 'best' | 'expected' | 'worst';
  description: string;
  probability: number;
  impact: number;
}

export interface OperationMetrics {
  perceptionShiftMeasured: number;
  cognitiveLoadInduced: number;
  decisionDelayAchieved: number;
  beliefConfidenceChange: number;
}

// ============================================
// Perception Shaper Engine
// ============================================

export interface PerceptionFrame {
  id: string;
  domain: string;
  currentFrame: FrameStructure;
  targetFrame: FrameStructure;
  transitionPath: FrameTransition[];
}

export interface FrameStructure {
  centralConcept: string;
  supportingBeliefs: string[];
  emotionalValence: number; // -1 to 1
  confidenceLevel: number;
  sourceAttribution: string[];
}

export interface FrameTransition {
  step: number;
  technique: FramingTechnique;
  content: string;
  deliveryChannel: string;
  timing: TransitionTiming;
}

export type FramingTechnique = 
  | 'metaphor_substitution'
  | 'anchor_shifting'
  | 'salience_manipulation'
  | 'emotional_reframing'
  | 'narrative_insertion'
  | 'contrast_creation';

export interface TransitionTiming {
  delayDays: number;
  optimalTimeOfDay: string;
  eventTrigger?: string;
}

/**
 * Analyze current perception and design reframing strategy
 */
export function designPerceptionShift(
  currentPerception: FrameStructure,
  targetPerception: FrameStructure,
  targetProfile: TargetProfile,
  constraints: ShiftConstraints
): PerceptionFrame {
  const gap = analyzeFrameGap(currentPerception, targetPerception);
  const vulnerabilities = identifyFrameVulnerabilities(currentPerception, targetProfile);
  const techniques = selectFramingTechniques(gap, vulnerabilities, constraints);
  
  const transitionPath = buildTransitionPath(
    currentPerception,
    targetPerception,
    techniques,
    constraints.maxDuration
  );
  
  return {
    id: crypto.randomUUID(),
    domain: identifyFrameDomain(currentPerception),
    currentFrame: currentPerception,
    targetFrame: targetPerception,
    transitionPath
  };
}

// ============================================
// Cognitive Friction Inducer
// ============================================

export interface CognitiveFrictionPlan {
  targetProfileId: string;
  frictionType: FrictionType;
  inducers: FrictionInducer[];
  expectedLoadIncrease: number; // 0-1 scale
  sustainabilityDuration: number; // Hours
  recoveryPrevention: RecoveryPrevention;
}

export type FrictionType = 
  | 'information_overload'
  | 'contradictory_signals'
  | 'decision_complexity'
  | 'uncertainty_amplification'
  | 'attention_fragmentation'
  | 'temporal_pressure';

export interface FrictionInducer {
  id: string;
  type: FrictionType;
  mechanism: string;
  intensity: number; // 0-1
  deliveryMethod: string;
  timing: InducerTiming;
}

export interface InducerTiming {
  startCondition: string;
  duration: number;
  pulsePattern?: number[]; // Minutes between pulses
}

export interface RecoveryPrevention {
  strategies: string[];
  monitoringIndicators: string[];
  escalationTriggers: string[];
}

/**
 * Design cognitive friction campaign
 */
export function designCognitiveFriction(
  targetProfile: TargetProfile,
  objectives: string[],
  maxIntensity: number
): CognitiveFrictionPlan {
  const baselineCapacity = estimateCognitiveCapacity(targetProfile);
  const vulnerabilities = identifyCognitiveVulnerabilities(targetProfile);
  
  const frictionType = selectOptimalFrictionType(vulnerabilities, objectives);
  const inducers = designFrictionInducers(
    frictionType,
    vulnerabilities,
    maxIntensity,
    baselineCapacity
  );
  
  return {
    targetProfileId: targetProfile.id,
    frictionType,
    inducers,
    expectedLoadIncrease: calculateExpectedLoad(inducers, baselineCapacity),
    sustainabilityDuration: estimateSustainability(inducers, targetProfile),
    recoveryPrevention: designRecoveryPrevention(frictionType, targetProfile)
  };
}

// ============================================
// Belief Synthesis Generator
// ============================================

export interface SyntheticBelief {
  id: string;
  content: string;
  supportingNarrative: string;
  evidencePackage: EvidencePackage;
  implantationStrategy: ImplantationStrategy;
  reinforcementPlan: ReinforcementPlan;
}

export interface EvidencePackage {
  factualAnchors: string[]; // True facts that support the belief
  ambiguousElements: string[]; // Elements that can be interpreted either way
  fabricatedDetails: string[]; // Created "evidence"
  credibilityScore: number;
}

export interface ImplantationStrategy {
  technique: ImplantationTechnique;
  phases: ImplantationPhase[];
  resistanceCountermeasures: string[];
}

export type ImplantationTechnique = 
  | 'gradual_exposure'
  | 'authority_endorsement'
  | 'social_proof'
  | 'emotional_anchoring'
  | 'repeated_assertion'
  | 'presupposition_embedding';

export interface ImplantationPhase {
  phase: number;
  technique: string;
  content: string;
  deliveryChannel: string;
  successIndicator: string;
}

export interface ReinforcementPlan {
  schedule: ReinforcementSchedule;
  methods: ReinforcementMethod[];
  adaptationTriggers: string[];
}

export interface ReinforcementSchedule {
  type: 'fixed_interval' | 'variable_interval' | 'fixed_ratio' | 'variable_ratio';
  parameters: Record<string, number>;
}

export interface ReinforcementMethod {
  type: string;
  content: string;
  channel: string;
  timing: string;
}

/**
 * Generate synthetic belief with implantation strategy
 */
export function generateSyntheticBelief(
  targetProfile: TargetProfile,
  desiredBelief: string,
  existingBeliefs: string[],
  constraints: BeliefConstraints
): SyntheticBelief {
  // Find compatible anchor beliefs
  const anchorBeliefs = findCompatibleAnchors(existingBeliefs, desiredBelief);
  
  // Design supporting narrative
  const narrative = constructNarrative(desiredBelief, anchorBeliefs, targetProfile);
  
  // Create evidence package
  const evidence = assembleEvidencePackage(
    narrative,
    constraints.factualityRequirement
  );
  
  // Design implantation strategy
  const implantation = designImplantation(
    targetProfile,
    desiredBelief,
    anchorBeliefs,
    constraints
  );
  
  // Plan reinforcement
  const reinforcement = planReinforcement(
    targetProfile,
    implantation,
    constraints.duration
  );
  
  return {
    id: crypto.randomUUID(),
    content: desiredBelief,
    supportingNarrative: narrative,
    evidencePackage: evidence,
    implantationStrategy: implantation,
    reinforcementPlan: reinforcement
  };
}

// ============================================
// Mental Model Mapper
// ============================================

export interface MentalModel {
  id: string;
  profileId: string;
  domain: string;
  concepts: ConceptNode[];
  relationships: ConceptRelationship[];
  inferenceRules: InferenceRule[];
  blindSpots: BlindSpot[];
  exploitablePatterns: ExploitablePattern[];
}

export interface ConceptNode {
  id: string;
  label: string;
  type: 'core' | 'supporting' | 'peripheral';
  confidence: number;
  volatility: number; // How easily changed
  connections: string[];
}

export interface ConceptRelationship {
  sourceId: string;
  targetId: string;
  type: 'causal' | 'associative' | 'hierarchical' | 'temporal';
  strength: number;
  bidirectional: boolean;
}

export interface InferenceRule {
  id: string;
  antecedent: string[];
  consequent: string;
  confidence: number;
  exploitability: number;
}

export interface BlindSpot {
  domain: string;
  nature: 'missing_concept' | 'wrong_relationship' | 'flawed_inference';
  description: string;
  exploitability: number;
  correctionRisk: number;
}

export interface ExploitablePattern {
  pattern: string;
  mechanism: string;
  leveragePoint: string;
  riskLevel: number;
}

/**
 * Map target's mental model from observed data
 */
export function mapMentalModel(
  profileId: string,
  domain: string,
  communications: string[],
  behaviors: BehaviorObservation[],
  decisions: DecisionRecord[]
): MentalModel {
  // Extract concepts from communications
  const concepts = extractConcepts(communications, domain);
  
  // Infer relationships from usage patterns
  const relationships = inferRelationships(concepts, communications);
  
  // Derive inference rules from decisions
  const inferenceRules = deriveInferenceRules(decisions, concepts);
  
  // Identify blind spots
  const blindSpots = identifyBlindSpots(concepts, relationships, domain);
  
  // Find exploitable patterns
  const exploitablePatterns = findExploitablePatterns(
    concepts,
    relationships,
    inferenceRules,
    blindSpots
  );
  
  return {
    id: crypto.randomUUID(),
    profileId,
    domain,
    concepts,
    relationships,
    inferenceRules,
    blindSpots,
    exploitablePatterns
  };
}

// ============================================
// Attention Manipulation Engine
// ============================================

export interface AttentionManipulationPlan {
  targetProfileId: string;
  objective: AttentionObjective;
  techniques: AttentionTechnique[];
  distractors: Distractor[];
  sustainmentMethods: SustainmentMethod[];
  metrics: AttentionMetrics;
}

export type AttentionObjective = 
  | 'capture' // Draw attention to specific topic
  | 'divert' // Move attention away from topic
  | 'fragment' // Split attention across multiple topics
  | 'sustain' // Keep attention fixed
  | 'exhaust'; // Deplete attentional resources

export interface AttentionTechnique {
  name: string;
  mechanism: string;
  stimulusType: string;
  expectedDuration: number;
  fatigueFactor: number;
}

export interface Distractor {
  id: string;
  type: 'emotional' | 'urgent' | 'novel' | 'social' | 'threat';
  content: string;
  deliveryTiming: string;
  expectedCapture: number;
}

export interface SustainmentMethod {
  technique: string;
  frequency: number;
  variability: number;
}

export interface AttentionMetrics {
  captureRate: number;
  sustainDuration: number;
  competitorDeflection: number;
  resourceDepletion: number;
}

/**
 * Design attention manipulation campaign
 */
export function designAttentionManipulation(
  targetProfile: TargetProfile,
  objective: AttentionObjective,
  focusTopic: string,
  duration: number
): AttentionManipulationPlan {
  const attentionProfile = assessAttentionProfile(targetProfile);
  const techniques = selectAttentionTechniques(objective, attentionProfile);
  const distractors = designDistractors(objective, focusTopic, targetProfile);
  const sustainment = planSustainment(techniques, duration, attentionProfile);
  
  return {
    targetProfileId: targetProfile.id,
    objective,
    techniques,
    distractors,
    sustainmentMethods: sustainment,
    metrics: predictAttentionMetrics(techniques, distractors, sustainment)
  };
}

// ============================================
// Decision Paralysis Inducer
// ============================================

export interface DecisionParalysisPlan {
  targetProfileId: string;
  targetDecision: string;
  paralysisType: ParalysisType;
  inducers: ParalysisInducer[];
  duration: number;
  exitCondition: string;
}

export type ParalysisType = 
  | 'analysis_paralysis' // Too much information
  | 'choice_overload' // Too many options
  | 'fear_of_regret' // Anticipated regret
  | 'conflicting_priorities' // Competing values
  | 'uncertainty_freeze'; // Unknown outcomes

export interface ParalysisInducer {
  type: ParalysisType;
  mechanism: string;
  content: string;
  timing: string;
  intensity: number;
}

/**
 * Design decision paralysis induction
 */
export function induceDecisionParalysis(
  targetProfile: TargetProfile,
  targetDecision: string,
  preferredDelay: number
): DecisionParalysisPlan {
  const decisionStyle = assessDecisionStyle(targetProfile);
  const paralysisType = selectOptimalParalysisType(decisionStyle, targetDecision);
  const inducers = designParalysisInducers(paralysisType, targetProfile, targetDecision);
  
  return {
    targetProfileId: targetProfile.id,
    targetDecision,
    paralysisType,
    inducers,
    duration: preferredDelay,
    exitCondition: defineExitCondition(paralysisType, preferredDelay)
  };
}

// ============================================
// Reality Distortion Field Generator
// ============================================

export interface RealityDistortionField {
  id: string;
  targetProfileId: string;
  distortionType: DistortionType;
  alterations: RealityAlteration[];
  consistency Manager: ConsistencyManager;
  detectionCountermeasures: string[];
}

export type DistortionType = 
  | 'selective_reality' // Show only certain aspects
  | 'inverted_reality' // Reverse causality/blame
  | 'parallel_reality' // Create alternative narrative
  | 'compressed_reality' // Time/importance distortion
  | 'amplified_reality'; // Exaggerate certain elements

export interface RealityAlteration {
  domain: string;
  originalReality: string;
  alteredReality: string;
  technique: string;
  reinforcementFrequency: number;
}

export interface ConsistencyManager {
  checkpoints: string[];
  contradictionResolution: string[];
  adaptationTriggers: string[];
}

/**
 * Generate reality distortion field
 */
export function generateRealityDistortion(
  targetProfile: TargetProfile,
  distortionType: DistortionType,
  targetDomains: string[]
): RealityDistortionField {
  const currentReality = mapCurrentReality(targetProfile, targetDomains);
  const alterations = designAlterations(distortionType, currentReality, targetProfile);
  const consistencyManager = createConsistencyManager(alterations);
  
  return {
    id: crypto.randomUUID(),
    targetProfileId: targetProfile.id,
    distortionType,
    alterations,
    consistencyManager,
    detectionCountermeasures: designCountermeasures(distortionType, targetProfile)
  };
}

// ============================================
// Helper Types
// ============================================

interface TargetProfile {
  id: string;
  cognitiveStyle: string;
  biases: string[];
  attentionPatterns: Record<string, number>;
  decisionHistory: string[];
  communicationPatterns: string[];
}

interface ShiftConstraints {
  maxDuration: number;
  detectabilityLimit: number;
  reversibilityRequired: boolean;
}

interface BeliefConstraints {
  factualityRequirement: number;
  duration: number;
  detectabilityLimit: number;
}

interface BehaviorObservation {
  action: string;
  context: string;
  timestamp: Date;
  outcome: string;
}

interface DecisionRecord {
  decision: string;
  context: string;
  outcome: string;
  satisfaction: number;
}

// ============================================
// Private Helper Functions
// ============================================

function analyzeFrameGap(current: FrameStructure, target: FrameStructure): number {
  let gap = 0;
  gap += current.centralConcept !== target.centralConcept ? 0.4 : 0;
  gap += Math.abs(current.emotionalValence - target.emotionalValence) * 0.3;
  gap += Math.abs(current.confidenceLevel - target.confidenceLevel) * 0.3;
  return Math.min(1, gap);
}

function identifyFrameVulnerabilities(frame: FrameStructure, profile: TargetProfile): string[] {
  const vulnerabilities: string[] = [];
  
  if (frame.confidenceLevel < 0.6) {
    vulnerabilities.push('low_confidence');
  }
  if (frame.sourceAttribution.length < 2) {
    vulnerabilities.push('weak_sourcing');
  }
  if (profile.biases.includes('confirmation_bias')) {
    vulnerabilities.push('confirmation_seeking');
  }
  
  return vulnerabilities;
}

function selectFramingTechniques(
  gap: number,
  vulnerabilities: string[],
  constraints: ShiftConstraints
): FramingTechnique[] {
  const techniques: FramingTechnique[] = [];
  
  if (gap > 0.5) {
    techniques.push('metaphor_substitution');
    techniques.push('narrative_insertion');
  }
  
  if (vulnerabilities.includes('low_confidence')) {
    techniques.push('anchor_shifting');
  }
  
  if (!constraints.reversibilityRequired) {
    techniques.push('emotional_reframing');
  }
  
  return techniques;
}

function buildTransitionPath(
  current: FrameStructure,
  target: FrameStructure,
  techniques: FramingTechnique[],
  maxDuration: number
): FrameTransition[] {
  const path: FrameTransition[] = [];
  const stepsNeeded = Math.max(2, Math.ceil(maxDuration / 7)); // At least weekly steps
  
  for (let i = 0; i < stepsNeeded; i++) {
    const technique = techniques[i % techniques.length];
    path.push({
      step: i + 1,
      technique,
      content: `Transition content for step ${i + 1} using ${technique}`,
      deliveryChannel: 'multi_channel',
      timing: {
        delayDays: i * Math.floor(maxDuration / stepsNeeded),
        optimalTimeOfDay: '10:00-14:00'
      }
    });
  }
  
  return path;
}

function identifyFrameDomain(frame: FrameStructure): string {
  return frame.centralConcept.split(' ')[0].toLowerCase();
}

function estimateCognitiveCapacity(profile: TargetProfile): number {
  return 0.7; // Baseline estimate
}

function identifyCognitiveVulnerabilities(profile: TargetProfile): string[] {
  return profile.biases;
}

function selectOptimalFrictionType(vulnerabilities: string[], objectives: string[]): FrictionType {
  if (vulnerabilities.includes('information_overload_susceptible')) {
    return 'information_overload';
  }
  if (objectives.includes('decision_delay')) {
    return 'decision_complexity';
  }
  return 'uncertainty_amplification';
}

function designFrictionInducers(
  type: FrictionType,
  vulnerabilities: string[],
  maxIntensity: number,
  baseline: number
): FrictionInducer[] {
  return [{
    id: crypto.randomUUID(),
    type,
    mechanism: `${type} via targeted stimuli`,
    intensity: Math.min(maxIntensity, 1 - baseline),
    deliveryMethod: 'multi_channel',
    timing: {
      startCondition: 'immediate',
      duration: 3600,
      pulsePattern: [15, 30, 45]
    }
  }];
}

function calculateExpectedLoad(inducers: FrictionInducer[], baseline: number): number {
  return inducers.reduce((acc, i) => acc + i.intensity * 0.3, baseline);
}

function estimateSustainability(inducers: FrictionInducer[], profile: TargetProfile): number {
  return 24; // Hours
}

function designRecoveryPrevention(type: FrictionType, profile: TargetProfile): RecoveryPrevention {
  return {
    strategies: ['maintain_pressure', 'prevent_rest'],
    monitoringIndicators: ['response_time', 'error_rate'],
    escalationTriggers: ['adaptation_detected', 'capacity_recovery']
  };
}

function findCompatibleAnchors(existing: string[], desired: string): string[] {
  return existing.filter(b => b.toLowerCase().includes(desired.split(' ')[0].toLowerCase()));
}

function constructNarrative(belief: string, anchors: string[], profile: TargetProfile): string {
  return `Narrative supporting: ${belief}. Built on: ${anchors.join(', ')}`;
}

function assembleEvidencePackage(narrative: string, factuality: number): EvidencePackage {
  return {
    factualAnchors: ['anchor_1', 'anchor_2'],
    ambiguousElements: ['ambiguous_1'],
    fabricatedDetails: factuality < 0.5 ? ['fabricated_1'] : [],
    credibilityScore: factuality
  };
}

function designImplantation(
  profile: TargetProfile,
  belief: string,
  anchors: string[],
  constraints: BeliefConstraints
): ImplantationStrategy {
  return {
    technique: 'gradual_exposure',
    phases: [{
      phase: 1,
      technique: 'priming',
      content: 'Initial exposure content',
      deliveryChannel: 'social',
      successIndicator: 'recognition'
    }],
    resistanceCountermeasures: ['social_proof', 'authority_endorsement']
  };
}

function planReinforcement(
  profile: TargetProfile,
  implantation: ImplantationStrategy,
  duration: number
): ReinforcementPlan {
  return {
    schedule: {
      type: 'variable_ratio',
      parameters: { minRatio: 2, maxRatio: 5 }
    },
    methods: [{
      type: 'reminder',
      content: 'Reinforcement content',
      channel: 'multi',
      timing: 'variable'
    }],
    adaptationTriggers: ['resistance_detected', 'forgetting_curve']
  };
}

function extractConcepts(communications: string[], domain: string): ConceptNode[] {
  return [{
    id: crypto.randomUUID(),
    label: 'core_concept',
    type: 'core',
    confidence: 0.8,
    volatility: 0.3,
    connections: []
  }];
}

function inferRelationships(concepts: ConceptNode[], communications: string[]): ConceptRelationship[] {
  if (concepts.length < 2) return [];
  return [{
    sourceId: concepts[0].id,
    targetId: concepts.length > 1 ? concepts[1].id : concepts[0].id,
    type: 'associative',
    strength: 0.7,
    bidirectional: true
  }];
}

function deriveInferenceRules(decisions: DecisionRecord[], concepts: ConceptNode[]): InferenceRule[] {
  return [{
    id: crypto.randomUUID(),
    antecedent: ['condition_1'],
    consequent: 'conclusion_1',
    confidence: 0.7,
    exploitability: 0.5
  }];
}

function identifyBlindSpots(
  concepts: ConceptNode[],
  relationships: ConceptRelationship[],
  domain: string
): BlindSpot[] {
  return [{
    domain,
    nature: 'missing_concept',
    description: 'Missing awareness of key factor',
    exploitability: 0.7,
    correctionRisk: 0.2
  }];
}

function findExploitablePatterns(
  concepts: ConceptNode[],
  relationships: ConceptRelationship[],
  rules: InferenceRule[],
  blindSpots: BlindSpot[]
): ExploitablePattern[] {
  return blindSpots.map(bs => ({
    pattern: bs.description,
    mechanism: 'blind_spot_exploitation',
    leveragePoint: bs.domain,
    riskLevel: bs.correctionRisk
  }));
}

function assessAttentionProfile(profile: TargetProfile): Record<string, number> {
  return profile.attentionPatterns;
}

function selectAttentionTechniques(
  objective: AttentionObjective,
  attentionProfile: Record<string, number>
): AttentionTechnique[] {
  return [{
    name: 'novelty_injection',
    mechanism: 'Present unexpected stimuli',
    stimulusType: 'visual',
    expectedDuration: 300,
    fatigueFactor: 0.2
  }];
}

function designDistractors(
  objective: AttentionObjective,
  topic: string,
  profile: TargetProfile
): Distractor[] {
  if (objective === 'divert') {
    return [{
      id: crypto.randomUUID(),
      type: 'urgent',
      content: 'Competing priority stimulus',
      deliveryTiming: 'immediate',
      expectedCapture: 0.7
    }];
  }
  return [];
}

function planSustainment(
  techniques: AttentionTechnique[],
  duration: number,
  profile: Record<string, number>
): SustainmentMethod[] {
  return [{
    technique: 'variable_novelty',
    frequency: Math.floor(duration / 6),
    variability: 0.3
  }];
}

function predictAttentionMetrics(
  techniques: AttentionTechnique[],
  distractors: Distractor[],
  sustainment: SustainmentMethod[]
): AttentionMetrics {
  return {
    captureRate: 0.75,
    sustainDuration: 1800,
    competitorDeflection: 0.6,
    resourceDepletion: 0.4
  };
}

function assessDecisionStyle(profile: TargetProfile): string {
  return 'analytical';
}

function selectOptimalParalysisType(style: string, decision: string): ParalysisType {
  if (style === 'analytical') return 'analysis_paralysis';
  return 'uncertainty_freeze';
}

function designParalysisInducers(
  type: ParalysisType,
  profile: TargetProfile,
  decision: string
): ParalysisInducer[] {
  return [{
    type,
    mechanism: 'Information complexity increase',
    content: 'Complex decision factors',
    timing: 'immediate',
    intensity: 0.6
  }];
}

function defineExitCondition(type: ParalysisType, delay: number): string {
  return `Paralysis sustains for ${delay} hours or until external resolution`;
}

function mapCurrentReality(profile: TargetProfile, domains: string[]): Record<string, string> {
  const reality: Record<string, string> = {};
  for (const domain of domains) {
    reality[domain] = 'current_state';
  }
  return reality;
}

function designAlterations(
  type: DistortionType,
  reality: Record<string, string>,
  profile: TargetProfile
): RealityAlteration[] {
  return Object.entries(reality).map(([domain, original]) => ({
    domain,
    originalReality: original,
    alteredReality: `${type}_altered_${domain}`,
    technique: type,
    reinforcementFrequency: 24
  }));
}

function createConsistencyManager(alterations: RealityAlteration[]): ConsistencyManager {
  return {
    checkpoints: alterations.map(a => a.domain),
    contradictionResolution: ['deflection', 'reframing'],
    adaptationTriggers: ['inconsistency_detection', 'external_correction']
  };
}

function designCountermeasures(type: DistortionType, profile: TargetProfile): string[] {
  return [
    'information_control',
    'source_discrediting',
    'attention_diversion',
    'social_validation_fabrication'
  ];
}
