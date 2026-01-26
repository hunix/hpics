/**
 * Dark Tetrad Profiler
 * 
 * Identifies Dark Tetrad personality traits (Machiavellianism, Narcissism, 
 * Psychopathy, Sadism) from behavioral and linguistic markers.
 * 
 * Based on: Dark Triad Detection Research (2025), SD4 Short Dark Tetrad scale
 */

// ============================================
// Core Types
// ============================================

export interface DarkTetradProfile {
  profileId: string;
  machiavellianism: TraitScore;
  narcissism: TraitScore;
  psychopathy: TraitScore;
  sadism: TraitScore;
  overallDarknessScore: number;
  riskLevel: RiskLevel;
  manipulationStyle: ManipulationStyle;
  vulnerabilities: TraitVulnerability[];
  exploitationVectors: ExploitationVector[];
  defensiveRecommendations: string[];
  analyzedAt: Date;
}

export interface TraitScore {
  score: number; // 0-100
  confidence: number;
  subtraits: SubtraitScore[];
  markers: BehavioralMarker[];
  linguisticIndicators: LinguisticIndicator[];
}

export interface SubtraitScore {
  name: string;
  score: number;
  evidence: string[];
}

export interface BehavioralMarker {
  type: MarkerType;
  description: string;
  frequency: number;
  severity: number;
  examples: string[];
}

export type MarkerType = 
  | 'manipulation_attempt'
  | 'grandiosity_display'
  | 'empathy_deficit'
  | 'cruelty_indicator'
  | 'exploitation_pattern'
  | 'deception_behavior'
  | 'dominance_seeking'
  | 'pleasure_from_harm';

export interface LinguisticIndicator {
  pattern: string;
  traitAssociation: DarkTrait;
  frequency: number;
  examples: string[];
}

export type DarkTrait = 'machiavellianism' | 'narcissism' | 'psychopathy' | 'sadism';

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'severe';

export interface ManipulationStyle {
  primary: ManipulationType;
  secondary: ManipulationType[];
  preferredTactics: ManipulationTactic[];
  targetPreferences: TargetProfile[];
  effectiveness: number;
}

export type ManipulationType = 
  | 'charm_offensive'
  | 'coercive_control'
  | 'gaslighting'
  | 'emotional_exploitation'
  | 'social_engineering'
  | 'intimidation'
  | 'victim_playing';

export interface ManipulationTactic {
  name: string;
  description: string;
  frequency: number;
  successRate: number;
  vulnerableToCounters: string[];
}

export interface TargetProfile {
  type: string;
  attractionFactors: string[];
  exploitationMethods: string[];
}

export interface TraitVulnerability {
  trait: DarkTrait;
  vulnerability: string;
  exploitability: number;
  approachStrategy: string;
}

export interface ExploitationVector {
  name: string;
  trait: DarkTrait;
  method: string;
  expectedResponse: string;
  riskLevel: number;
}

// ============================================
// Machiavellianism Analyzer
// ============================================

export interface MachiavellianismMarkers {
  strategicLanguageScore: number;
  longTermPlanningEvidence: number;
  manipulativeIntentPatterns: string[];
  coalitionBuildingBehavior: number;
  reputationManagement: number;
  moralFlexibility: number;
  cynicalWorldview: number;
}

export function analyzeMachiavellianism(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[]
): TraitScore {
  const markers = extractMachiavellianMarkers(communications, behaviors);
  
  const subtraits: SubtraitScore[] = [
    {
      name: 'Strategic Planning',
      score: calculateStrategicScore(markers),
      evidence: markers.manipulativeIntentPatterns
    },
    {
      name: 'Cynicism',
      score: markers.cynicalWorldview * 100,
      evidence: extractCynicismEvidence(communications)
    },
    {
      name: 'Moral Flexibility',
      score: markers.moralFlexibility * 100,
      evidence: extractMoralFlexibilityEvidence(behaviors)
    },
    {
      name: 'Coalition Manipulation',
      score: markers.coalitionBuildingBehavior * 100,
      evidence: extractCoalitionEvidence(behaviors)
    }
  ];
  
  const overallScore = subtraits.reduce((sum, s) => sum + s.score, 0) / subtraits.length;
  
  return {
    score: overallScore,
    confidence: calculateConfidence(communications.length, behaviors.length),
    subtraits,
    markers: extractBehavioralMarkers(behaviors, 'machiavellianism'),
    linguisticIndicators: extractLinguisticIndicators(communications, 'machiavellianism')
  };
}

function extractMachiavellianMarkers(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[]
): MachiavellianismMarkers {
  const strategicPatterns = [
    /if.*then.*we can/gi,
    /leverage.*position/gi,
    /strategically/gi,
    /long.?term.*benefit/gi,
    /play.*against/gi,
    /useful.*ally/gi
  ];
  
  let strategicLanguageScore = 0;
  const manipulativePatterns: string[] = [];
  
  communications.forEach(comm => {
    strategicPatterns.forEach(pattern => {
      const matches = comm.content.match(pattern);
      if (matches) {
        strategicLanguageScore += matches.length * 0.1;
        manipulativePatterns.push(...matches);
      }
    });
  });
  
  const behaviorScores = behaviors.reduce((acc, b) => {
    if (b.type === 'coalition_forming') acc.coalition += 0.2;
    if (b.type === 'reputation_managing') acc.reputation += 0.2;
    if (b.type === 'rule_bending') acc.moral += 0.15;
    if (b.type === 'long_term_planning') acc.planning += 0.2;
    return acc;
  }, { coalition: 0, reputation: 0, moral: 0, planning: 0 });
  
  return {
    strategicLanguageScore: Math.min(strategicLanguageScore, 1),
    longTermPlanningEvidence: Math.min(behaviorScores.planning, 1),
    manipulativeIntentPatterns: manipulativePatterns.slice(0, 10),
    coalitionBuildingBehavior: Math.min(behaviorScores.coalition, 1),
    reputationManagement: Math.min(behaviorScores.reputation, 1),
    moralFlexibility: Math.min(behaviorScores.moral, 1),
    cynicalWorldview: analyzeCynicismLevel(communications)
  };
}

// ============================================
// Narcissism Analyzer
// ============================================

export interface NarcissismMarkers {
  firstPersonPronounRatio: number;
  grandiosityClaims: string[];
  entitlementPatterns: number;
  admirationSeeking: number;
  criticismReaction: number;
  superiorityLanguage: number;
  empathyDeficit: number;
}

export function analyzeNarcissism(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[]
): TraitScore {
  const markers = extractNarcissismMarkers(communications, behaviors);
  
  const subtraits: SubtraitScore[] = [
    {
      name: 'Grandiosity',
      score: markers.superiorityLanguage * 100,
      evidence: markers.grandiosityClaims
    },
    {
      name: 'Entitlement',
      score: markers.entitlementPatterns * 100,
      evidence: extractEntitlementEvidence(communications)
    },
    {
      name: 'Admiration Seeking',
      score: markers.admirationSeeking * 100,
      evidence: extractAdmirationEvidence(communications)
    },
    {
      name: 'Empathy Deficit',
      score: markers.empathyDeficit * 100,
      evidence: extractEmpathyDeficitEvidence(behaviors)
    }
  ];
  
  const overallScore = subtraits.reduce((sum, s) => sum + s.score, 0) / subtraits.length;
  
  return {
    score: overallScore,
    confidence: calculateConfidence(communications.length, behaviors.length),
    subtraits,
    markers: extractBehavioralMarkers(behaviors, 'narcissism'),
    linguisticIndicators: extractLinguisticIndicators(communications, 'narcissism')
  };
}

function extractNarcissismMarkers(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[]
): NarcissismMarkers {
  let totalWords = 0;
  let firstPersonCount = 0;
  const grandiosityClaims: string[] = [];
  
  const grandiosePatterns = [
    /i('m| am) the (best|greatest|only one)/gi,
    /no one (else )?can/gi,
    /i('m| am) better than/gi,
    /they('re| are) all jealous/gi,
    /i deserve/gi,
    /special treatment/gi
  ];
  
  communications.forEach(comm => {
    const words = comm.content.split(/\s+/);
    totalWords += words.length;
    firstPersonCount += words.filter(w => /^(i|me|my|mine|myself)$/i.test(w)).length;
    
    grandiosePatterns.forEach(pattern => {
      const matches = comm.content.match(pattern);
      if (matches) grandiosityClaims.push(...matches);
    });
  });
  
  const behaviorScores = behaviors.reduce((acc, b) => {
    if (b.type === 'admiration_seeking') acc.admiration += 0.2;
    if (b.type === 'criticism_deflection') acc.criticism += 0.2;
    if (b.type === 'entitlement_display') acc.entitlement += 0.2;
    if (b.type === 'empathy_failure') acc.empathy += 0.15;
    return acc;
  }, { admiration: 0, criticism: 0, entitlement: 0, empathy: 0 });
  
  return {
    firstPersonPronounRatio: totalWords > 0 ? firstPersonCount / totalWords : 0,
    grandiosityClaims: grandiosityClaims.slice(0, 10),
    entitlementPatterns: Math.min(behaviorScores.entitlement, 1),
    admirationSeeking: Math.min(behaviorScores.admiration, 1),
    criticismReaction: Math.min(behaviorScores.criticism, 1),
    superiorityLanguage: grandiosityClaims.length > 0 ? Math.min(grandiosityClaims.length * 0.1, 1) : 0,
    empathyDeficit: Math.min(behaviorScores.empathy, 1)
  };
}

// ============================================
// Psychopathy Analyzer
// ============================================

export interface PsychopathyMarkers {
  impulsivityScore: number;
  callousLanguage: string[];
  fearlessness: number;
  manipulationFrequency: number;
  antisocialPatterns: number;
  shallowAffect: number;
  guiltAbsence: number;
}

export function analyzePsychopathy(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[]
): TraitScore {
  const markers = extractPsychopathyMarkers(communications, behaviors);
  
  const subtraits: SubtraitScore[] = [
    {
      name: 'Callousness',
      score: markers.callousLanguage.length > 0 ? Math.min(markers.callousLanguage.length * 10, 100) : 0,
      evidence: markers.callousLanguage
    },
    {
      name: 'Impulsivity',
      score: markers.impulsivityScore * 100,
      evidence: extractImpulsivityEvidence(behaviors)
    },
    {
      name: 'Fearlessness',
      score: markers.fearlessness * 100,
      evidence: extractFearlessnessEvidence(behaviors)
    },
    {
      name: 'Shallow Affect',
      score: markers.shallowAffect * 100,
      evidence: extractShallowAffectEvidence(communications)
    }
  ];
  
  const overallScore = subtraits.reduce((sum, s) => sum + s.score, 0) / subtraits.length;
  
  return {
    score: overallScore,
    confidence: calculateConfidence(communications.length, behaviors.length),
    subtraits,
    markers: extractBehavioralMarkers(behaviors, 'psychopathy'),
    linguisticIndicators: extractLinguisticIndicators(communications, 'psychopathy')
  };
}

function extractPsychopathyMarkers(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[]
): PsychopathyMarkers {
  const callousPatterns = [
    /who cares/gi,
    /their (problem|fault)/gi,
    /not my (concern|problem)/gi,
    /weak(ling)?s?/gi,
    /deserve(d|s)? (it|what)/gi,
    /pathetic/gi
  ];
  
  const callousLanguage: string[] = [];
  
  communications.forEach(comm => {
    callousPatterns.forEach(pattern => {
      const matches = comm.content.match(pattern);
      if (matches) callousLanguage.push(...matches);
    });
  });
  
  const behaviorScores = behaviors.reduce((acc, b) => {
    if (b.type === 'impulsive_action') acc.impulsivity += 0.2;
    if (b.type === 'risk_taking') acc.fearlessness += 0.15;
    if (b.type === 'antisocial_behavior') acc.antisocial += 0.2;
    if (b.type === 'guilt_absence') acc.guilt += 0.2;
    if (b.type === 'shallow_response') acc.affect += 0.15;
    return acc;
  }, { impulsivity: 0, fearlessness: 0, antisocial: 0, guilt: 0, affect: 0 });
  
  return {
    impulsivityScore: Math.min(behaviorScores.impulsivity, 1),
    callousLanguage: callousLanguage.slice(0, 10),
    fearlessness: Math.min(behaviorScores.fearlessness, 1),
    manipulationFrequency: analyzeManipulationFrequency(behaviors),
    antisocialPatterns: Math.min(behaviorScores.antisocial, 1),
    shallowAffect: Math.min(behaviorScores.affect, 1),
    guiltAbsence: Math.min(behaviorScores.guilt, 1)
  };
}

// ============================================
// Sadism Analyzer
// ============================================

export interface SadismMarkers {
  pleasureFromHarmIndicators: string[];
  crueltyPatterns: number;
  dominanceAggression: number;
  humiliationTendency: number;
  schadenfreudeLevel: number;
  trollingBehavior: number;
}

export function analyzeSadism(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[]
): TraitScore {
  const markers = extractSadismMarkers(communications, behaviors);
  
  const subtraits: SubtraitScore[] = [
    {
      name: 'Pleasure from Harm',
      score: markers.pleasureFromHarmIndicators.length > 0 
        ? Math.min(markers.pleasureFromHarmIndicators.length * 15, 100) : 0,
      evidence: markers.pleasureFromHarmIndicators
    },
    {
      name: 'Cruelty',
      score: markers.crueltyPatterns * 100,
      evidence: extractCrueltyEvidence(behaviors)
    },
    {
      name: 'Humiliation Tendency',
      score: markers.humiliationTendency * 100,
      evidence: extractHumiliationEvidence(communications)
    },
    {
      name: 'Schadenfreude',
      score: markers.schadenfreudeLevel * 100,
      evidence: extractSchadenfreudeEvidence(communications)
    }
  ];
  
  const overallScore = subtraits.reduce((sum, s) => sum + s.score, 0) / subtraits.length;
  
  return {
    score: overallScore,
    confidence: calculateConfidence(communications.length, behaviors.length),
    subtraits,
    markers: extractBehavioralMarkers(behaviors, 'sadism'),
    linguisticIndicators: extractLinguisticIndicators(communications, 'sadism')
  };
}

function extractSadismMarkers(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[]
): SadismMarkers {
  const harmPleasurePatterns = [
    /love(d)? (seeing|watching) (them|him|her) (suffer|cry|fail)/gi,
    /serve(s|d)? (them|him|her) right/gi,
    /got what (they|he|she) deserve/gi,
    /enjoyed (their|his|her) (pain|suffering|misery)/gi,
    /made (them|him|her) (cry|beg|suffer)/gi
  ];
  
  const pleasureIndicators: string[] = [];
  
  communications.forEach(comm => {
    harmPleasurePatterns.forEach(pattern => {
      const matches = comm.content.match(pattern);
      if (matches) pleasureIndicators.push(...matches);
    });
  });
  
  const behaviorScores = behaviors.reduce((acc, b) => {
    if (b.type === 'cruelty') acc.cruelty += 0.25;
    if (b.type === 'humiliation') acc.humiliation += 0.2;
    if (b.type === 'domination') acc.domination += 0.15;
    if (b.type === 'trolling') acc.trolling += 0.1;
    return acc;
  }, { cruelty: 0, humiliation: 0, domination: 0, trolling: 0 });
  
  return {
    pleasureFromHarmIndicators: pleasureIndicators.slice(0, 10),
    crueltyPatterns: Math.min(behaviorScores.cruelty, 1),
    dominanceAggression: Math.min(behaviorScores.domination, 1),
    humiliationTendency: Math.min(behaviorScores.humiliation, 1),
    schadenfreudeLevel: analyzeSchadenfreude(communications),
    trollingBehavior: Math.min(behaviorScores.trolling, 1)
  };
}

// ============================================
// Coercive Control Detector
// ============================================

export interface CoerciveControlAnalysis {
  profileId: string;
  isDetected: boolean;
  overallRisk: number;
  controlTactics: ControlTactic[];
  abusePhase: AbusePhase;
  escalationRisk: number;
  victimVulnerabilities: string[];
  interventionUrgency: 'low' | 'moderate' | 'high' | 'immediate';
  safetyRecommendations: string[];
}

export interface ControlTactic {
  type: ControlType;
  frequency: number;
  severity: number;
  examples: string[];
  escalationTrend: 'stable' | 'increasing' | 'decreasing';
}

export type ControlType = 
  | 'isolation'
  | 'economic_control'
  | 'emotional_manipulation'
  | 'threats'
  | 'monitoring'
  | 'gaslighting'
  | 'degradation'
  | 'micro_regulation';

export type AbusePhase = 
  | 'tension_building'
  | 'acute_incident'
  | 'reconciliation'
  | 'calm';

export function detectCoerciveControl(
  communications: CommunicationSample[],
  relationships: RelationshipData[]
): CoerciveControlAnalysis {
  const tactics = identifyControlTactics(communications);
  const phase = determineAbusePhase(communications, tactics);
  const overallRisk = calculateCoerciveRisk(tactics);
  
  return {
    profileId: communications[0]?.senderId || '',
    isDetected: overallRisk > 0.4,
    overallRisk,
    controlTactics: tactics,
    abusePhase: phase,
    escalationRisk: calculateEscalationRisk(tactics, phase),
    victimVulnerabilities: identifyVictimVulnerabilities(relationships),
    interventionUrgency: determineInterventionUrgency(overallRisk, phase),
    safetyRecommendations: generateSafetyRecommendations(tactics, phase)
  };
}

function identifyControlTactics(communications: CommunicationSample[]): ControlTactic[] {
  const tacticPatterns: Record<ControlType, RegExp[]> = {
    isolation: [
      /don't (talk|speak|see) (to|with)/gi,
      /they('re| are) (bad|toxic|dangerous) for you/gi,
      /you don't need (them|anyone else)/gi,
      /only i (understand|care|love)/gi
    ],
    economic_control: [
      /give me (access|control|password)/gi,
      /you can't (afford|buy|spend)/gi,
      /i('ll| will) handle (the )?money/gi,
      /you('re| are) terrible with finances/gi
    ],
    emotional_manipulation: [
      /if you (loved|cared)/gi,
      /after all i('ve| have) done/gi,
      /you('re| are) making me/gi,
      /you never appreciate/gi,
      /you('re| are) so (selfish|ungrateful)/gi
    ],
    threats: [
      /i('ll| will) (leave|hurt|tell)/gi,
      /you('ll| will) regret/gi,
      /don't make me/gi,
      /or else/gi
    ],
    monitoring: [
      /where (are|were) you/gi,
      /who (are|were) you with/gi,
      /let me see your (phone|messages)/gi,
      /i('m| am) tracking/gi
    ],
    gaslighting: [
      /that never happened/gi,
      /you('re| are) (imagining|crazy|paranoid)/gi,
      /i never said that/gi,
      /you('re| are) overreacting/gi,
      /no one will believe/gi
    ],
    degradation: [
      /you('re| are) (stupid|worthless|nothing)/gi,
      /no one (else )?(would|will) (want|love)/gi,
      /lucky i (put up|stay)/gi,
      /you('re| are) pathetic/gi
    ],
    micro_regulation: [
      /you (should|need to|must) (wear|eat|do)/gi,
      /i (don't )?approve/gi,
      /not without my permission/gi,
      /ask me first/gi
    ]
  };
  
  const tactics: ControlTactic[] = [];
  
  Object.entries(tacticPatterns).forEach(([type, patterns]) => {
    const examples: string[] = [];
    let frequency = 0;
    
    communications.forEach(comm => {
      patterns.forEach(pattern => {
        const matches = comm.content.match(pattern);
        if (matches) {
          frequency += matches.length;
          examples.push(...matches);
        }
      });
    });
    
    if (frequency > 0) {
      tactics.push({
        type: type as ControlType,
        frequency: Math.min(frequency / communications.length, 1),
        severity: calculateTacticSeverity(type as ControlType, frequency),
        examples: examples.slice(0, 5),
        escalationTrend: analyzeEscalationTrend(communications, patterns)
      });
    }
  });
  
  return tactics.sort((a, b) => b.severity - a.severity);
}

// ============================================
// Full Dark Tetrad Profile Generator
// ============================================

export function generateDarkTetradProfile(
  communications: CommunicationSample[],
  behaviors: BehaviorRecord[],
  relationships: RelationshipData[]
): DarkTetradProfile {
  const machiavellianism = analyzeMachiavellianism(communications, behaviors);
  const narcissism = analyzeNarcissism(communications, behaviors);
  const psychopathy = analyzePsychopathy(communications, behaviors);
  const sadism = analyzeSadism(communications, behaviors);
  
  const overallDarknessScore = (
    machiavellianism.score * 0.25 +
    narcissism.score * 0.25 +
    psychopathy.score * 0.30 +
    sadism.score * 0.20
  );
  
  const riskLevel = determineRiskLevel(overallDarknessScore);
  const manipulationStyle = analyzeManipulationStyle(
    machiavellianism, narcissism, psychopathy, sadism
  );
  
  return {
    profileId: communications[0]?.senderId || '',
    machiavellianism,
    narcissism,
    psychopathy,
    sadism,
    overallDarknessScore,
    riskLevel,
    manipulationStyle,
    vulnerabilities: identifyTraitVulnerabilities(
      machiavellianism, narcissism, psychopathy, sadism
    ),
    exploitationVectors: generateExploitationVectors(
      machiavellianism, narcissism, psychopathy, sadism
    ),
    defensiveRecommendations: generateDefensiveRecommendations(riskLevel, manipulationStyle),
    analyzedAt: new Date()
  };
}

// ============================================
// Helper Functions
// ============================================

function calculateConfidence(commCount: number, behaviorCount: number): number {
  const dataPoints = commCount + behaviorCount;
  if (dataPoints < 5) return 0.3;
  if (dataPoints < 20) return 0.5;
  if (dataPoints < 50) return 0.7;
  return 0.85;
}

function calculateStrategicScore(markers: MachiavellianismMarkers): number {
  return Math.min(
    (markers.strategicLanguageScore * 30 +
     markers.longTermPlanningEvidence * 25 +
     markers.coalitionBuildingBehavior * 25 +
     markers.reputationManagement * 20),
    100
  );
}

function analyzeCynicismLevel(communications: CommunicationSample[]): number {
  const cynicalPatterns = [
    /everyone (is|are) (out for|looking)/gi,
    /trust no one/gi,
    /people (always|only) (want|care)/gi,
    /no good deed/gi
  ];
  
  let score = 0;
  communications.forEach(comm => {
    cynicalPatterns.forEach(pattern => {
      if (pattern.test(comm.content)) score += 0.1;
    });
  });
  
  return Math.min(score, 1);
}

function analyzeManipulationFrequency(behaviors: BehaviorRecord[]): number {
  const manipBehaviors = behaviors.filter(b => 
    ['manipulation', 'deception', 'exploitation'].includes(b.type)
  );
  return Math.min(manipBehaviors.length / Math.max(behaviors.length, 1), 1);
}

function analyzeSchadenfreude(communications: CommunicationSample[]): number {
  const patterns = [
    /karma/gi,
    /got what (they|he|she) deserve/gi,
    /serves? (them|him|her) right/gi,
    /finally (caught|failed)/gi
  ];
  
  let score = 0;
  communications.forEach(comm => {
    patterns.forEach(pattern => {
      if (pattern.test(comm.content)) score += 0.15;
    });
  });
  
  return Math.min(score, 1);
}

function determineRiskLevel(score: number): RiskLevel {
  if (score < 20) return 'low';
  if (score < 40) return 'moderate';
  if (score < 60) return 'elevated';
  if (score < 80) return 'high';
  return 'severe';
}

function analyzeManipulationStyle(
  mach: TraitScore,
  narc: TraitScore,
  psych: TraitScore,
  sad: TraitScore
): ManipulationStyle {
  const styles: { type: ManipulationType; score: number }[] = [
    { type: 'charm_offensive', score: narc.score * 0.7 + mach.score * 0.3 },
    { type: 'coercive_control', score: psych.score * 0.6 + sad.score * 0.4 },
    { type: 'gaslighting', score: mach.score * 0.5 + narc.score * 0.5 },
    { type: 'emotional_exploitation', score: narc.score * 0.6 + mach.score * 0.4 },
    { type: 'intimidation', score: psych.score * 0.5 + sad.score * 0.5 }
  ];
  
  styles.sort((a, b) => b.score - a.score);
  
  return {
    primary: styles[0].type,
    secondary: styles.slice(1, 3).map(s => s.type),
    preferredTactics: generatePreferredTactics(styles[0].type),
    targetPreferences: generateTargetPreferences(mach, narc, psych, sad),
    effectiveness: styles[0].score / 100
  };
}

function identifyTraitVulnerabilities(
  mach: TraitScore,
  narc: TraitScore,
  psych: TraitScore,
  sad: TraitScore
): TraitVulnerability[] {
  const vulnerabilities: TraitVulnerability[] = [];
  
  if (narc.score > 50) {
    vulnerabilities.push({
      trait: 'narcissism',
      vulnerability: 'Validation dependency',
      exploitability: 0.8,
      approachStrategy: 'Offer genuine-seeming admiration to gain trust'
    });
  }
  
  if (mach.score > 50) {
    vulnerabilities.push({
      trait: 'machiavellianism',
      vulnerability: 'Transactional worldview',
      exploitability: 0.7,
      approachStrategy: 'Present clear mutual benefit scenarios'
    });
  }
  
  if (psych.score > 50) {
    vulnerabilities.push({
      trait: 'psychopathy',
      vulnerability: 'Boredom susceptibility',
      exploitability: 0.6,
      approachStrategy: 'Offer novel, stimulating opportunities'
    });
  }
  
  if (sad.score > 50) {
    vulnerabilities.push({
      trait: 'sadism',
      vulnerability: 'Power validation need',
      exploitability: 0.5,
      approachStrategy: 'Create controlled dominance opportunities'
    });
  }
  
  return vulnerabilities;
}

function generateExploitationVectors(
  mach: TraitScore,
  narc: TraitScore,
  psych: TraitScore,
  sad: TraitScore
): ExploitationVector[] {
  const vectors: ExploitationVector[] = [];
  
  if (narc.score > 40) {
    vectors.push({
      name: 'Narcissistic Supply',
      trait: 'narcissism',
      method: 'Provide excessive admiration then withdraw',
      expectedResponse: 'Will seek to restore supply, becoming compliant',
      riskLevel: 0.3
    });
  }
  
  if (mach.score > 40) {
    vectors.push({
      name: 'False Alliance',
      trait: 'machiavellianism',
      method: 'Propose strategic partnership with hidden agenda',
      expectedResponse: 'Will engage if perceived benefit is clear',
      riskLevel: 0.5
    });
  }
  
  return vectors;
}

function generateDefensiveRecommendations(
  riskLevel: RiskLevel,
  style: ManipulationStyle
): string[] {
  const recommendations: string[] = [
    'Maintain strong boundaries and document all interactions',
    'Avoid sharing personal vulnerabilities',
    'Verify all claims independently'
  ];
  
  if (style.primary === 'gaslighting') {
    recommendations.push('Keep written records of all agreements and statements');
    recommendations.push('Seek third-party witnesses for important conversations');
  }
  
  if (style.primary === 'coercive_control') {
    recommendations.push('Maintain independent support network');
    recommendations.push('Ensure financial independence');
  }
  
  if (riskLevel === 'high' || riskLevel === 'severe') {
    recommendations.push('Consider limiting or ending contact');
    recommendations.push('Consult with security professional');
  }
  
  return recommendations;
}

// Stub functions for evidence extraction
function extractCynicismEvidence(comms: CommunicationSample[]): string[] { return []; }
function extractMoralFlexibilityEvidence(behaviors: BehaviorRecord[]): string[] { return []; }
function extractCoalitionEvidence(behaviors: BehaviorRecord[]): string[] { return []; }
function extractEntitlementEvidence(comms: CommunicationSample[]): string[] { return []; }
function extractAdmirationEvidence(comms: CommunicationSample[]): string[] { return []; }
function extractEmpathyDeficitEvidence(behaviors: BehaviorRecord[]): string[] { return []; }
function extractImpulsivityEvidence(behaviors: BehaviorRecord[]): string[] { return []; }
function extractFearlessnessEvidence(behaviors: BehaviorRecord[]): string[] { return []; }
function extractShallowAffectEvidence(comms: CommunicationSample[]): string[] { return []; }
function extractCrueltyEvidence(behaviors: BehaviorRecord[]): string[] { return []; }
function extractHumiliationEvidence(comms: CommunicationSample[]): string[] { return []; }
function extractSchadenfreudeEvidence(comms: CommunicationSample[]): string[] { return []; }
function extractBehavioralMarkers(behaviors: BehaviorRecord[], trait: DarkTrait): BehavioralMarker[] { return []; }
function extractLinguisticIndicators(comms: CommunicationSample[], trait: DarkTrait): LinguisticIndicator[] { return []; }
function calculateTacticSeverity(type: ControlType, frequency: number): number { return Math.min(frequency * 0.2, 1); }
function analyzeEscalationTrend(comms: CommunicationSample[], patterns: RegExp[]): 'stable' | 'increasing' | 'decreasing' { return 'stable'; }
function determineAbusePhase(comms: CommunicationSample[], tactics: ControlTactic[]): AbusePhase { return 'calm'; }
function calculateCoerciveRisk(tactics: ControlTactic[]): number { return tactics.reduce((sum, t) => sum + t.severity, 0) / Math.max(tactics.length, 1); }
function calculateEscalationRisk(tactics: ControlTactic[], phase: AbusePhase): number { return phase === 'tension_building' ? 0.8 : 0.3; }
function identifyVictimVulnerabilities(relationships: RelationshipData[]): string[] { return []; }
function determineInterventionUrgency(risk: number, phase: AbusePhase): 'low' | 'moderate' | 'high' | 'immediate' {
  if (risk > 0.8 || phase === 'acute_incident') return 'immediate';
  if (risk > 0.6) return 'high';
  if (risk > 0.4) return 'moderate';
  return 'low';
}
function generateSafetyRecommendations(tactics: ControlTactic[], phase: AbusePhase): string[] { return []; }
function generatePreferredTactics(type: ManipulationType): ManipulationTactic[] { return []; }
function generateTargetPreferences(m: TraitScore, n: TraitScore, p: TraitScore, s: TraitScore): TargetProfile[] { return []; }

// Input types
interface CommunicationSample {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  channel: string;
}

interface BehaviorRecord {
  id: string;
  profileId: string;
  type: string;
  description: string;
  timestamp: Date;
  witnesses: string[];
  severity: number;
}

interface RelationshipData {
  profileId: string;
  relationType: string;
  duration: number;
  powerDynamic: number;
  dependencyLevel: number;
}
