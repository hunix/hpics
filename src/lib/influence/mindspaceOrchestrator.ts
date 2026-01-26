/**
 * MINDSPACE Influence Orchestrator (v9.0)
 * 
 * Automated influence campaigns using the 9 MINDSPACE behavioral triggers
 * from the UK Behavioral Insights Team.
 * 
 * MINDSPACE: Messenger, Incentives, Norms, Defaults, Salience, 
 * Priming, Affect, Commitments, Ego
 * 
 * @source UK Cabinet Office Behavioral Insights Team (2025)
 * @source META Behavioral Insights Classification System
 */

// ============================================
// Types & Interfaces
// ============================================

export interface MindspaceCampaign {
  id: string;
  profileId: string;
  campaignName: string;
  objective: CampaignObjective;
  triggers: MindspaceTriggers;
  phases: CampaignPhase[];
  abTests: ABTest[];
  metrics: CampaignMetrics;
  status: CampaignStatus;
}

export interface CampaignObjective {
  desiredBehavior: string;
  targetAudience: string;
  timeframe: number; // Days
  successCriteria: string[];
  fallbackBehaviors: string[];
}

export interface MindspaceTriggers {
  messenger: MessengerConfig;
  incentives: IncentivesConfig;
  norms: NormsConfig;
  defaults: DefaultsConfig;
  salience: SalienceConfig;
  priming: PrimingConfig;
  affect: AffectConfig;
  commitments: CommitmentsConfig;
  ego: EgoConfig;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'aborted';

// ============================================
// Messenger Configuration
// ============================================

export interface MessengerConfig {
  enabled: boolean;
  strategy: MessengerStrategy;
  sources: MessengerSource[];
  rotationSchedule: RotationSchedule;
  effectivenessScore: number;
}

export type MessengerStrategy = 
  | 'authority' // Expert/official sources
  | 'similarity' // Peer/in-group
  | 'likeability' // Attractive/friendly
  | 'consensus' // Multiple sources agreeing
  | 'hybrid'; // Combination

export interface MessengerSource {
  id: string;
  type: 'authority' | 'peer' | 'celebrity' | 'trusted_institution' | 'ai_generated';
  credibilityScore: number;
  reachEstimate: number;
  fatigueLevel: number; // 0-1, increases with use
  content: MessengerContent[];
}

export interface MessengerContent {
  format: 'text' | 'audio' | 'video' | 'image';
  message: string;
  callToAction: string;
}

export interface RotationSchedule {
  type: 'fixed' | 'performance_based' | 'fatigue_based';
  intervalDays: number;
  threshold: number;
}

// ============================================
// Incentives Configuration
// ============================================

export interface IncentivesConfig {
  enabled: boolean;
  type: IncentiveType;
  framing: IncentiveFraming;
  schedule: IncentiveSchedule;
  magnitude: number;
  effectivenessScore: number;
}

export type IncentiveType = 
  | 'monetary'
  | 'social_recognition'
  | 'status'
  | 'access'
  | 'convenience'
  | 'information';

export type IncentiveFraming = 
  | 'gain' // You will receive X
  | 'loss' // You will lose X if you don't
  | 'reference_point' // Compared to others, you...
  | 'temporal' // Now vs later
  | 'certainty'; // Guaranteed vs probabilistic

export interface IncentiveSchedule {
  timing: 'immediate' | 'delayed' | 'variable';
  frequency: number;
  escalationEnabled: boolean;
}

// ============================================
// Norms Configuration
// ============================================

export interface NormsConfig {
  enabled: boolean;
  normType: NormType;
  referenceGroup: string;
  evidence: NormEvidence[];
  messaging: NormMessaging;
  effectivenessScore: number;
}

export type NormType = 
  | 'descriptive' // What others do
  | 'injunctive' // What others approve of
  | 'dynamic' // Trending behavior
  | 'personal'; // Self-consistency

export interface NormEvidence {
  type: 'statistic' | 'testimonial' | 'visual' | 'behavioral';
  content: string;
  credibility: number;
}

export interface NormMessaging {
  template: string;
  variables: Record<string, string>;
  channelOptimization: Record<string, string>;
}

// ============================================
// Defaults Configuration
// ============================================

export interface DefaultsConfig {
  enabled: boolean;
  defaultOption: string;
  optOutFriction: number; // 0-1, higher = harder to change
  justification: string;
  ethicalConsiderations: string[];
  effectivenessScore: number;
}

// ============================================
// Salience Configuration
// ============================================

export interface SalienceConfig {
  enabled: boolean;
  techniques: SalienceTechnique[];
  timingOptimization: TimingOptimization;
  attentionCapture: AttentionCapture;
  effectivenessScore: number;
}

export interface SalienceTechnique {
  type: 'novelty' | 'personalization' | 'simplification' | 'visualization' | 'contrast';
  implementation: string;
  expectedImpact: number;
}

export interface TimingOptimization {
  optimalTimes: string[];
  eventTriggers: string[];
  avoidTimes: string[];
}

export interface AttentionCapture {
  method: 'visual' | 'auditory' | 'haptic' | 'multimodal';
  intensity: number;
  duration: number;
}

// ============================================
// Priming Configuration
// ============================================

export interface PrimingConfig {
  enabled: boolean;
  primeType: PrimeType;
  primes: Prime[];
  timing: PrimeTiming;
  effectivenessScore: number;
}

export type PrimeType = 
  | 'conceptual' // Activate related concepts
  | 'affective' // Activate emotions
  | 'behavioral' // Activate action tendencies
  | 'goal' // Activate motivations
  | 'identity'; // Activate self-concepts

export interface Prime {
  id: string;
  content: string;
  modality: 'visual' | 'verbal' | 'environmental' | 'procedural';
  subtlety: number; // 0-1, lower = more subtle
  expectedEffect: string;
}

export interface PrimeTiming {
  leadTime: number; // Minutes before target behavior
  repetitions: number;
  spacing: number; // Minutes between repetitions
}

// ============================================
// Affect Configuration
// ============================================

export interface AffectConfig {
  enabled: boolean;
  targetEmotion: TargetEmotion;
  elicitationMethods: EmotionElicitation[];
  intensityTarget: number;
  ethicalGuardrails: string[];
  effectivenessScore: number;
}

export type TargetEmotion = 
  | 'fear'
  | 'hope'
  | 'pride'
  | 'guilt'
  | 'anger'
  | 'joy'
  | 'trust'
  | 'anticipation';

export interface EmotionElicitation {
  method: 'narrative' | 'imagery' | 'music' | 'social_comparison' | 'anticipation';
  content: string;
  intensity: number;
  duration: number;
}

// ============================================
// Commitments Configuration
// ============================================

export interface CommitmentsConfig {
  enabled: boolean;
  commitmentType: CommitmentType;
  stages: CommitmentStage[];
  publicness: number; // 0-1
  consistencyLeverage: ConsistencyLeverage;
  effectivenessScore: number;
}

export type CommitmentType = 
  | 'verbal'
  | 'written'
  | 'public'
  | 'implementation_intention'
  | 'pre_commitment';

export interface CommitmentStage {
  stage: number;
  commitmentAsk: string;
  difficulty: number;
  reinforcement: string;
}

export interface ConsistencyLeverage {
  enabled: boolean;
  reminderFrequency: number;
  escalationPath: string[];
}

// ============================================
// Ego Configuration
// ============================================

export interface EgoConfig {
  enabled: boolean;
  selfConceptTarget: SelfConceptTarget;
  identityAppeal: IdentityAppeal;
  consistencyPressure: number;
  effectivenessScore: number;
}

export type SelfConceptTarget = 
  | 'competence'
  | 'morality'
  | 'status'
  | 'belonging'
  | 'uniqueness'
  | 'growth';

export interface IdentityAppeal {
  currentIdentity: string;
  desiredIdentity: string;
  bridgingNarrative: string;
  socialValidation: string[];
}

// ============================================
// Campaign Management
// ============================================

export interface CampaignPhase {
  id: string;
  name: string;
  duration: number;
  activeTriggers: (keyof MindspaceTriggers)[];
  objectives: string[];
  successCriteria: PhaseSuccessCriteria;
  adaptationRules: AdaptationRule[];
}

export interface PhaseSuccessCriteria {
  metric: string;
  threshold: number;
  measurementMethod: string;
}

export interface AdaptationRule {
  condition: string;
  action: string;
  priority: number;
}

export interface ABTest {
  id: string;
  name: string;
  variable: keyof MindspaceTriggers;
  variants: ABVariant[];
  sampleSize: number;
  duration: number;
  currentWinner: string | null;
  statisticalSignificance: number;
}

export interface ABVariant {
  id: string;
  name: string;
  config: Partial<MindspaceTriggers[keyof MindspaceTriggers]>;
  conversionRate: number;
  sampleCount: number;
}

export interface CampaignMetrics {
  reach: number;
  engagement: number;
  conversionRate: number;
  costPerConversion: number;
  triggerEffectiveness: Record<string, number>;
  phaseProgress: number;
  abTestResults: Record<string, ABTestResult>;
}

export interface ABTestResult {
  winner: string;
  significance: number;
  improvement: number;
}

// ============================================
// Core Orchestration Functions
// ============================================

/**
 * Create a new MINDSPACE campaign
 */
export function createCampaign(
  profileId: string,
  objective: CampaignObjective,
  profileAnalysis: ProfileAnalysis
): MindspaceCampaign {
  const triggers = designTriggers(objective, profileAnalysis);
  const phases = planPhases(objective, triggers);
  const abTests = designABTests(triggers, profileAnalysis);
  
  return {
    id: crypto.randomUUID(),
    profileId,
    campaignName: `MINDSPACE_${objective.desiredBehavior.slice(0, 20)}`,
    objective,
    triggers,
    phases,
    abTests,
    metrics: initializeMetrics(),
    status: 'draft'
  };
}

/**
 * Design optimal trigger configuration based on profile
 */
export function designTriggers(
  objective: CampaignObjective,
  profileAnalysis: ProfileAnalysis
): MindspaceTriggers {
  return {
    messenger: designMessengerConfig(objective, profileAnalysis),
    incentives: designIncentivesConfig(objective, profileAnalysis),
    norms: designNormsConfig(objective, profileAnalysis),
    defaults: designDefaultsConfig(objective, profileAnalysis),
    salience: designSalienceConfig(objective, profileAnalysis),
    priming: designPrimingConfig(objective, profileAnalysis),
    affect: designAffectConfig(objective, profileAnalysis),
    commitments: designCommitmentsConfig(objective, profileAnalysis),
    ego: designEgoConfig(objective, profileAnalysis)
  };
}

/**
 * Evaluate and rank trigger effectiveness
 */
export function rankTriggerEffectiveness(
  campaign: MindspaceCampaign,
  behavioralData: BehavioralData[]
): TriggerRanking[] {
  const triggerNames = Object.keys(campaign.triggers) as (keyof MindspaceTriggers)[];
  
  return triggerNames.map(trigger => {
    const config = campaign.triggers[trigger];
    if (!config.enabled) {
      return { trigger, score: 0, enabled: false };
    }
    
    const effectivenessScore = calculateTriggerEffectiveness(
      trigger,
      config,
      behavioralData
    );
    
    return {
      trigger,
      score: effectivenessScore,
      enabled: true,
      recommendation: getRecommendation(trigger, effectivenessScore)
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Adapt campaign based on performance
 */
export function adaptCampaign(
  campaign: MindspaceCampaign,
  performance: CampaignMetrics
): MindspaceCampaign {
  const adaptations: Partial<MindspaceTriggers> = {};
  
  // Check each trigger and adapt if underperforming
  for (const [trigger, effectiveness] of Object.entries(performance.triggerEffectiveness)) {
    if (effectiveness < 0.3) {
      const config = campaign.triggers[trigger as keyof MindspaceTriggers];
      if (config) {
        (adaptations as Record<string, unknown>)[trigger] = boostTrigger(
          trigger as keyof MindspaceTriggers,
          config as unknown as MessengerConfig & IncentivesConfig & NormsConfig & DefaultsConfig & SalienceConfig & PrimingConfig & AffectConfig & CommitmentsConfig & EgoConfig
        );
      }
    }
  }
  
  // Apply AB test winners
  for (const [testName, result] of Object.entries(performance.abTestResults)) {
    if (result.significance > 0.95) {
      const test = campaign.abTests.find(t => t.name === testName);
      if (test) {
        const winningVariant = test.variants.find(v => v.id === result.winner);
        if (winningVariant) {
          Object.assign(campaign.triggers[test.variable], winningVariant.config);
        }
      }
    }
  }
  
  return {
    ...campaign,
    triggers: { ...campaign.triggers, ...adaptations }
  };
}

/**
 * Generate influence message using MINDSPACE principles
 */
export function generateInfluenceMessage(
  campaign: MindspaceCampaign,
  context: MessageContext
): InfluenceMessage {
  const activeTrigggers = getActiveTriggers(campaign);
  const messageComponents: MessageComponent[] = [];
  
  // Messenger framing
  if (activeTrigggers.includes('messenger')) {
    messageComponents.push(createMessengerComponent(campaign.triggers.messenger, context));
  }
  
  // Norm signals
  if (activeTrigggers.includes('norms')) {
    messageComponents.push(createNormComponent(campaign.triggers.norms, context));
  }
  
  // Salience elements
  if (activeTrigggers.includes('salience')) {
    messageComponents.push(createSalienceComponent(campaign.triggers.salience, context));
  }
  
  // Affect elements
  if (activeTrigggers.includes('affect')) {
    messageComponents.push(createAffectComponent(campaign.triggers.affect, context));
  }
  
  // Commitment ask
  if (activeTrigggers.includes('commitments')) {
    messageComponents.push(createCommitmentComponent(campaign.triggers.commitments, context));
  }
  
  // Ego appeal
  if (activeTrigggers.includes('ego')) {
    messageComponents.push(createEgoComponent(campaign.triggers.ego, context));
  }
  
  return assembleMessage(messageComponents, context);
}

// ============================================
// Helper Types
// ============================================

export interface ProfileAnalysis {
  susceptibilities: Record<string, number>;
  preferredChannels: string[];
  valueSystem: string[];
  socialGraph: SocialGraphSummary;
  behavioralHistory: BehaviorPattern[];
}

export interface SocialGraphSummary {
  influencers: string[];
  groupMemberships: string[];
  networkPosition: string;
}

export interface BehaviorPattern {
  behavior: string;
  frequency: number;
  triggers: string[];
}

export interface BehavioralData {
  timestamp: Date;
  behavior: string;
  context: Record<string, string>;
  outcome: string;
  triggerAttributions: string[];
}

export interface TriggerRanking {
  trigger: keyof MindspaceTriggers;
  score: number;
  enabled: boolean;
  recommendation?: string;
}

export interface MessageContext {
  channel: string;
  timing: string;
  previousInteractions: number;
  currentMood: string;
  recentEvents: string[];
}

export interface InfluenceMessage {
  content: string;
  format: string;
  messenger: string;
  callToAction: string;
  timing: string;
  followUp: FollowUpPlan;
}

export interface FollowUpPlan {
  delay: number;
  condition: string;
  message: string;
}

interface MessageComponent {
  type: string;
  content: string;
  priority: number;
}

// ============================================
// Private Helper Functions
// ============================================

function designMessengerConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): MessengerConfig {
  const preferredStrategy = inferMessengerStrategy(profile);
  
  return {
    enabled: true,
    strategy: preferredStrategy,
    sources: generateMessengerSources(preferredStrategy, profile),
    rotationSchedule: {
      type: 'fatigue_based',
      intervalDays: 7,
      threshold: 0.7
    },
    effectivenessScore: 0
  };
}

function designIncentivesConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): IncentivesConfig {
  const preferredType = inferIncentiveType(profile);
  const optimalFraming = inferIncentiveFraming(profile);
  
  return {
    enabled: true,
    type: preferredType,
    framing: optimalFraming,
    schedule: {
      timing: 'variable',
      frequency: 3,
      escalationEnabled: true
    },
    magnitude: 0.6,
    effectivenessScore: 0
  };
}

function designNormsConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): NormsConfig {
  const referenceGroup = identifyReferenceGroup(profile);
  
  return {
    enabled: true,
    normType: 'descriptive',
    referenceGroup,
    evidence: generateNormEvidence(referenceGroup, objective),
    messaging: {
      template: '${percentage}% of ${group} already ${behavior}',
      variables: {
        percentage: '73',
        group: referenceGroup,
        behavior: objective.desiredBehavior
      },
      channelOptimization: {}
    },
    effectivenessScore: 0
  };
}

function designDefaultsConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): DefaultsConfig {
  return {
    enabled: true,
    defaultOption: objective.desiredBehavior,
    optOutFriction: 0.4,
    justification: `Most ${profile.socialGraph.groupMemberships[0] || 'people'} prefer this option`,
    ethicalConsiderations: ['transparent_disclosure', 'easy_override'],
    effectivenessScore: 0
  };
}

function designSalienceConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): SalienceConfig {
  return {
    enabled: true,
    techniques: [
      {
        type: 'personalization',
        implementation: 'Use name and specific context',
        expectedImpact: 0.7
      },
      {
        type: 'simplification',
        implementation: 'Reduce to single clear action',
        expectedImpact: 0.6
      }
    ],
    timingOptimization: {
      optimalTimes: inferOptimalTimes(profile),
      eventTriggers: ['relevant_event', 'competitor_action'],
      avoidTimes: ['late_night', 'busy_periods']
    },
    attentionCapture: {
      method: 'multimodal',
      intensity: 0.6,
      duration: 5
    },
    effectivenessScore: 0
  };
}

function designPrimingConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): PrimingConfig {
  return {
    enabled: true,
    primeType: 'goal',
    primes: [
      {
        id: crypto.randomUUID(),
        content: objective.desiredBehavior.split(' ')[0],
        modality: 'visual',
        subtlety: 0.7,
        expectedEffect: 'Activate goal-related concepts'
      }
    ],
    timing: {
      leadTime: 15,
      repetitions: 2,
      spacing: 60
    },
    effectivenessScore: 0
  };
}

function designAffectConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): AffectConfig {
  const targetEmotion = selectTargetEmotion(objective, profile);
  
  return {
    enabled: true,
    targetEmotion,
    elicitationMethods: [
      {
        method: 'narrative',
        content: `Story emphasizing ${targetEmotion}`,
        intensity: 0.6,
        duration: 30
      }
    ],
    intensityTarget: 0.6,
    ethicalGuardrails: ['no_fear_mongering', 'balanced_messaging'],
    effectivenessScore: 0
  };
}

function designCommitmentsConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): CommitmentsConfig {
  return {
    enabled: true,
    commitmentType: 'implementation_intention',
    stages: [
      {
        stage: 1,
        commitmentAsk: 'Express interest',
        difficulty: 0.2,
        reinforcement: 'Thank you for your interest!'
      },
      {
        stage: 2,
        commitmentAsk: 'Set specific time',
        difficulty: 0.4,
        reinforcement: 'Great! You\'re on track.'
      },
      {
        stage: 3,
        commitmentAsk: 'Tell someone about it',
        difficulty: 0.6,
        reinforcement: 'Sharing makes it real!'
      }
    ],
    publicness: 0.5,
    consistencyLeverage: {
      enabled: true,
      reminderFrequency: 3,
      escalationPath: ['gentle_reminder', 'consistency_appeal', 'social_proof']
    },
    effectivenessScore: 0
  };
}

function designEgoConfig(
  objective: CampaignObjective,
  profile: ProfileAnalysis
): EgoConfig {
  const selfConceptTarget = inferSelfConceptTarget(profile);
  
  return {
    enabled: true,
    selfConceptTarget,
    identityAppeal: {
      currentIdentity: profile.valueSystem[0] || 'thoughtful person',
      desiredIdentity: `${profile.valueSystem[0] || 'thoughtful person'} who ${objective.desiredBehavior}`,
      bridgingNarrative: 'People like you naturally...',
      socialValidation: ['peer_testimonials', 'expert_endorsement']
    },
    consistencyPressure: 0.5,
    effectivenessScore: 0
  };
}

function planPhases(
  objective: CampaignObjective,
  triggers: MindspaceTriggers
): CampaignPhase[] {
  const phaseDuration = Math.ceil(objective.timeframe / 3);
  
  return [
    {
      id: crypto.randomUUID(),
      name: 'Awareness & Priming',
      duration: phaseDuration,
      activeTriggers: ['messenger', 'salience', 'priming'],
      objectives: ['Build awareness', 'Establish relevance'],
      successCriteria: {
        metric: 'awareness_rate',
        threshold: 0.6,
        measurementMethod: 'survey'
      },
      adaptationRules: [
        {
          condition: 'awareness < 0.4',
          action: 'increase_salience_intensity',
          priority: 1
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      name: 'Engagement & Commitment',
      duration: phaseDuration,
      activeTriggers: ['norms', 'affect', 'commitments'],
      objectives: ['Generate interest', 'Secure micro-commitments'],
      successCriteria: {
        metric: 'commitment_rate',
        threshold: 0.3,
        measurementMethod: 'action_tracking'
      },
      adaptationRules: [
        {
          condition: 'commitment < 0.2',
          action: 'activate_ego_appeal',
          priority: 1
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      name: 'Conversion & Reinforcement',
      duration: phaseDuration,
      activeTriggers: ['incentives', 'defaults', 'ego'],
      objectives: ['Drive behavior', 'Establish habit'],
      successCriteria: {
        metric: 'conversion_rate',
        threshold: 0.15,
        measurementMethod: 'behavior_tracking'
      },
      adaptationRules: [
        {
          condition: 'conversion < 0.1',
          action: 'increase_incentive_magnitude',
          priority: 1
        }
      ]
    }
  ];
}

function designABTests(
  triggers: MindspaceTriggers,
  profile: ProfileAnalysis
): ABTest[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Messenger Strategy Test',
      variable: 'messenger',
      variants: [
        {
          id: 'authority',
          name: 'Authority',
          config: { strategy: 'authority' as MessengerStrategy },
          conversionRate: 0,
          sampleCount: 0
        },
        {
          id: 'similarity',
          name: 'Similarity',
          config: { strategy: 'similarity' as MessengerStrategy },
          conversionRate: 0,
          sampleCount: 0
        }
      ],
      sampleSize: 100,
      duration: 14,
      currentWinner: null,
      statisticalSignificance: 0
    },
    {
      id: crypto.randomUUID(),
      name: 'Incentive Framing Test',
      variable: 'incentives',
      variants: [
        {
          id: 'gain',
          name: 'Gain Frame',
          config: { framing: 'gain' as IncentiveFraming },
          conversionRate: 0,
          sampleCount: 0
        },
        {
          id: 'loss',
          name: 'Loss Frame',
          config: { framing: 'loss' as IncentiveFraming },
          conversionRate: 0,
          sampleCount: 0
        }
      ],
      sampleSize: 100,
      duration: 14,
      currentWinner: null,
      statisticalSignificance: 0
    }
  ];
}

function initializeMetrics(): CampaignMetrics {
  return {
    reach: 0,
    engagement: 0,
    conversionRate: 0,
    costPerConversion: 0,
    triggerEffectiveness: {},
    phaseProgress: 0,
    abTestResults: {}
  };
}

function calculateTriggerEffectiveness(
  trigger: keyof MindspaceTriggers,
  config: MindspaceTriggers[keyof MindspaceTriggers],
  data: BehavioralData[]
): number {
  const attributedEvents = data.filter(d => d.triggerAttributions.includes(trigger));
  const successfulEvents = attributedEvents.filter(d => d.outcome === 'success');
  
  if (attributedEvents.length === 0) return 0;
  return successfulEvents.length / attributedEvents.length;
}

function getRecommendation(trigger: keyof MindspaceTriggers, score: number): string {
  if (score > 0.7) return 'maintain';
  if (score > 0.4) return 'optimize';
  if (score > 0.2) return 'restructure';
  return 'disable_or_replace';
}

function boostTrigger<T extends keyof MindspaceTriggers>(
  trigger: T,
  config: MindspaceTriggers[T]
): MindspaceTriggers[T] {
  // Return boosted version of the config
  return {
    ...config,
    effectivenessScore: (config.effectivenessScore || 0) + 0.1
  } as MindspaceTriggers[T];
}

function getActiveTriggers(campaign: MindspaceCampaign): (keyof MindspaceTriggers)[] {
  return (Object.keys(campaign.triggers) as (keyof MindspaceTriggers)[])
    .filter(key => campaign.triggers[key].enabled);
}

function createMessengerComponent(config: MessengerConfig, context: MessageContext): MessageComponent {
  const source = config.sources[0];
  return {
    type: 'messenger',
    content: source?.content[0]?.message || 'Message from trusted source',
    priority: 1
  };
}

function createNormComponent(config: NormsConfig, context: MessageContext): MessageComponent {
  const message = config.messaging.template
    .replace('${percentage}', config.messaging.variables.percentage)
    .replace('${group}', config.messaging.variables.group)
    .replace('${behavior}', config.messaging.variables.behavior);
    
  return {
    type: 'norm',
    content: message,
    priority: 2
  };
}

function createSalienceComponent(config: SalienceConfig, context: MessageContext): MessageComponent {
  return {
    type: 'salience',
    content: 'Personalized, attention-grabbing element',
    priority: 3
  };
}

function createAffectComponent(config: AffectConfig, context: MessageContext): MessageComponent {
  return {
    type: 'affect',
    content: config.elicitationMethods[0]?.content || 'Emotional appeal',
    priority: 4
  };
}

function createCommitmentComponent(config: CommitmentsConfig, context: MessageContext): MessageComponent {
  const nextStage = config.stages.find(s => s.difficulty <= 0.5);
  return {
    type: 'commitment',
    content: nextStage?.commitmentAsk || 'Will you commit?',
    priority: 5
  };
}

function createEgoComponent(config: EgoConfig, context: MessageContext): MessageComponent {
  return {
    type: 'ego',
    content: config.identityAppeal.bridgingNarrative,
    priority: 6
  };
}

function assembleMessage(components: MessageComponent[], context: MessageContext): InfluenceMessage {
  const sortedComponents = components.sort((a, b) => a.priority - b.priority);
  const content = sortedComponents.map(c => c.content).join(' ');
  
  return {
    content,
    format: 'text',
    messenger: 'system',
    callToAction: 'Take action now',
    timing: context.timing,
    followUp: {
      delay: 24,
      condition: 'no_response',
      message: 'Following up on our previous message...'
    }
  };
}

function inferMessengerStrategy(profile: ProfileAnalysis): MessengerStrategy {
  if (profile.susceptibilities.authority > 0.7) return 'authority';
  if (profile.susceptibilities.social > 0.7) return 'similarity';
  return 'hybrid';
}

function generateMessengerSources(strategy: MessengerStrategy, profile: ProfileAnalysis): MessengerSource[] {
  return [{
    id: crypto.randomUUID(),
    type: strategy === 'authority' ? 'authority' : 'peer',
    credibilityScore: 0.8,
    reachEstimate: 1000,
    fatigueLevel: 0,
    content: [{
      format: 'text',
      message: 'Default message content',
      callToAction: 'Learn more'
    }]
  }];
}

function inferIncentiveType(profile: ProfileAnalysis): IncentiveType {
  if (profile.valueSystem.includes('status')) return 'status';
  if (profile.valueSystem.includes('recognition')) return 'social_recognition';
  return 'convenience';
}

function inferIncentiveFraming(profile: ProfileAnalysis): IncentiveFraming {
  if (profile.susceptibilities.loss_aversion > 0.6) return 'loss';
  return 'gain';
}

function identifyReferenceGroup(profile: ProfileAnalysis): string {
  return profile.socialGraph.groupMemberships[0] || 'people like you';
}

function generateNormEvidence(group: string, objective: CampaignObjective): NormEvidence[] {
  return [{
    type: 'statistic',
    content: `73% of ${group} already ${objective.desiredBehavior}`,
    credibility: 0.8
  }];
}

function inferOptimalTimes(profile: ProfileAnalysis): string[] {
  return ['09:00-11:00', '14:00-16:00', '19:00-21:00'];
}

function selectTargetEmotion(objective: CampaignObjective, profile: ProfileAnalysis): TargetEmotion {
  if (objective.desiredBehavior.includes('protect')) return 'fear';
  if (objective.desiredBehavior.includes('achieve')) return 'pride';
  return 'hope';
}

function inferSelfConceptTarget(profile: ProfileAnalysis): SelfConceptTarget {
  if (profile.valueSystem.includes('achievement')) return 'competence';
  if (profile.valueSystem.includes('ethics')) return 'morality';
  return 'growth';
}
