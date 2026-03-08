/**
 * KUBARK Personality Classifier
 * 
 * Based on the declassified CIA KUBARK Counterintelligence Interrogation manual (1963)
 * and the DoD "Educing Information" report (Intelligence Science Board, Phase 1).
 * 
 * Classifies subjects into personality types and recommends approach strategies.
 * 
 * @module kubarkClassifier
 */

// ============================================
// Types
// ============================================

export type KUBARKPersonalityType =
  | 'orderly_obstinate'      // Rigid, rule-following, resistant to pressure
  | 'optimistic'             // Confident, cooperative initially, underestimates consequences
  | 'greedy_demanding'       // Transactional, seeks personal benefit
  | 'anxious_self_centered'  // Anxious, self-focused, easily rattled
  | 'guilt_ridden'           // Burdened by conscience, responds to moral appeals
  | 'schizoid_withdrawn'     // Detached, intellectualized, emotionally flat
  | 'exception'              // Believes rules don't apply to them, narcissistic
  | 'average_normal'         // No dominant personality feature
  | 'wolf_in_sheeps_clothing'; // Deliberately presenting false persona

export interface PersonalityClassification {
  primaryType: KUBARKPersonalityType;
  secondaryType: KUBARKPersonalityType | null;
  confidence: number;
  typeScores: Record<KUBARKPersonalityType, number>;
  behavioralEvidence: BehavioralEvidence[];
  approachRecommendations: ApproachRecommendation[];
  contraindicatedApproaches: string[];
  psychologicalProfile: PsychologicalProfile;
}

export interface BehavioralEvidence {
  type: KUBARKPersonalityType;
  indicator: string;
  strength: number; // 0-1
  source: string;
}

export interface ApproachRecommendation {
  approach: ApproachType;
  effectiveness: number; // 0-1
  description: string;
  techniques: string[];
  risks: string[];
  sequencePosition: 'primary' | 'secondary' | 'fallback';
}

export type ApproachType =
  | 'rapport_building'
  | 'futility'
  | 'incentive'
  | 'emotional_appeal'
  | 'cognitive_interview'
  | 'strategic_evidence'
  | 'ego_up'
  | 'ego_down'
  | 'establish_identity'
  | 'repetition'
  | 'silence';

export interface PsychologicalProfile {
  stressTolerance: number; // 0-1
  complianceLikelihood: number;
  deceptionCapability: number;
  emotionalStability: number;
  cognitiveFlexibility: number;
  authorityResponse: 'compliant' | 'resistant' | 'oppositional' | 'indifferent';
  motivationalDrivers: string[];
  vulnerabilities: string[];
}

export interface ClassificationInput {
  behavioralObservations: string[];
  communicationPatterns: string[];
  psychologicalAssessment?: Record<string, number>;
  interactionHistory?: string[];
  demographicContext?: {
    age?: number;
    education?: string;
    occupation?: string;
    culturalBackground?: string;
  };
}

// ============================================
// Core Classification
// ============================================

/**
 * Classify a subject into KUBARK personality types based on behavioral indicators.
 */
export function classifyKUBARK(input: ClassificationInput): PersonalityClassification {
  const scores = calculateTypeScores(input);
  const evidence = collectEvidence(input);

  // Find primary and secondary types
  const sortedTypes = (Object.entries(scores) as [KUBARKPersonalityType, number][])
    .sort(([, a], [, b]) => b - a);

  const primaryType = sortedTypes[0][0];
  const secondaryType = sortedTypes[1][1] > 0.3 ? sortedTypes[1][0] : null;
  const confidence = sortedTypes[0][1] - (sortedTypes[1]?.[1] || 0);

  // Generate approach recommendations
  const approaches = generateApproachRecommendations(primaryType, secondaryType);
  const contraindicated = getContraindicatedApproaches(primaryType);

  // Build psychological profile
  const profile = buildPsychologicalProfile(primaryType, scores, input);

  return {
    primaryType,
    secondaryType,
    confidence: Math.min(1, confidence + 0.3),
    typeScores: scores,
    behavioralEvidence: evidence,
    approachRecommendations: approaches,
    contraindicatedApproaches: contraindicated,
    psychologicalProfile: profile
  };
}

// ============================================
// Type Scoring
// ============================================

function calculateTypeScores(input: ClassificationInput): Record<KUBARKPersonalityType, number> {
  const text = [...input.behavioralObservations, ...input.communicationPatterns].join(' ').toLowerCase();
  const psych = input.psychologicalAssessment || {};

  const scores: Record<KUBARKPersonalityType, number> = {
    orderly_obstinate: 0,
    optimistic: 0,
    greedy_demanding: 0,
    anxious_self_centered: 0,
    guilt_ridden: 0,
    schizoid_withdrawn: 0,
    exception: 0,
    average_normal: 0.2, // Default baseline
    wolf_in_sheeps_clothing: 0
  };

  // Orderly-Obstinate indicators
  if (/\b(rigid|rule.?follow|meticulous|orderly|by the book|stubborn|inflexible|procedure)\b/i.test(text)) scores.orderly_obstinate += 0.3;
  if (psych.conscientiousness && psych.conscientiousness > 0.8) scores.orderly_obstinate += 0.2;
  if (psych.openness && psych.openness < 0.3) scores.orderly_obstinate += 0.15;

  // Optimistic indicators
  if (/\b(confident|upbeat|charming|cooperative|underestimate|casual|relaxed|nonchalant)\b/i.test(text)) scores.optimistic += 0.3;
  if (psych.extraversion && psych.extraversion > 0.7) scores.optimistic += 0.15;

  // Greedy-Demanding indicators
  if (/\b(transactional|what's in it for|bargain|deal|reward|compensation|benefit|negotiat)\b/i.test(text)) scores.greedy_demanding += 0.35;

  // Anxious-Self-Centered indicators
  if (/\b(anxious|nervous|self.?focused|worried|restless|fidget|agitated|paranoid|suspicious)\b/i.test(text)) scores.anxious_self_centered += 0.3;
  if (psych.neuroticism && psych.neuroticism > 0.7) scores.anxious_self_centered += 0.2;

  // Guilt-Ridden indicators
  if (/\b(guilt|remorse|sorry|conscience|regret|ashamed|moral|confess|burden)\b/i.test(text)) scores.guilt_ridden += 0.35;

  // Schizoid-Withdrawn indicators
  if (/\b(detached|withdrawn|emotionless|flat affect|intellectualized|distant|isolated|aloof)\b/i.test(text)) scores.schizoid_withdrawn += 0.3;
  if (psych.extraversion && psych.extraversion < 0.2) scores.schizoid_withdrawn += 0.15;

  // Exception indicators
  if (/\b(entitled|special|above the law|rules don't apply|important|superior|untouchable|narcissi)\b/i.test(text)) scores.exception += 0.35;
  if (psych.narcissism && psych.narcissism > 0.7) scores.exception += 0.2;

  // Wolf in Sheep's Clothing indicators
  if (/\b(inconsisten|facade|persona|mask|too (cooperative|helpful|friendly)|rehearsed|calculated)\b/i.test(text)) scores.wolf_in_sheeps_clothing += 0.3;

  // Normalize scores to 0-1
  const maxScore = Math.max(...Object.values(scores), 0.01);
  for (const key of Object.keys(scores) as KUBARKPersonalityType[]) {
    scores[key] = Math.min(1, scores[key] / maxScore);
  }

  return scores;
}

function collectEvidence(input: ClassificationInput): BehavioralEvidence[] {
  const evidence: BehavioralEvidence[] = [];
  const observations = input.behavioralObservations;

  const typePatterns: Record<string, { type: KUBARKPersonalityType; pattern: RegExp }[]> = {
    observations: [
      { type: 'orderly_obstinate', pattern: /\b(rigid|stubborn|meticulous|rule|procedure|inflexible)\b/i },
      { type: 'optimistic', pattern: /\b(confident|charming|cooperative|relaxed|upbeat)\b/i },
      { type: 'greedy_demanding', pattern: /\b(bargain|deal|reward|transactional|benefit)\b/i },
      { type: 'anxious_self_centered', pattern: /\b(anxious|nervous|fidget|agitated|worried)\b/i },
      { type: 'guilt_ridden', pattern: /\b(guilt|remorse|sorry|ashamed|conscience)\b/i },
      { type: 'schizoid_withdrawn', pattern: /\b(detached|withdrawn|flat|distant|aloof)\b/i },
      { type: 'exception', pattern: /\b(entitled|special|superior|above|narcissi)\b/i },
      { type: 'wolf_in_sheeps_clothing', pattern: /\b(inconsisten|facade|rehearsed|calculated|mask)\b/i },
    ]
  };

  for (const obs of observations) {
    for (const { type, pattern } of typePatterns.observations) {
      if (pattern.test(obs)) {
        evidence.push({
          type,
          indicator: obs.slice(0, 100),
          strength: 0.6,
          source: 'behavioral_observation'
        });
      }
    }
  }

  return evidence;
}

// ============================================
// Approach Recommendations (per KUBARK manual)
// ============================================

function generateApproachRecommendations(
  primary: KUBARKPersonalityType,
  secondary: KUBARKPersonalityType | null
): ApproachRecommendation[] {
  const approachMap: Record<KUBARKPersonalityType, ApproachRecommendation[]> = {
    orderly_obstinate: [
      {
        approach: 'rapport_building',
        effectiveness: 0.7,
        description: 'Establish structured, professional rapport. Respect their need for order.',
        techniques: ['Mirror their formality', 'Present organized questions', 'Acknowledge their diligence', 'Use procedural framing'],
        risks: ['May become more rigid under pressure'],
        sequencePosition: 'primary'
      },
      {
        approach: 'futility',
        effectiveness: 0.6,
        description: 'Demonstrate that continued resistance is futile given evidence.',
        techniques: ['Present evidence methodically', 'Show logical inevitability', 'Appeal to their rational nature'],
        risks: ['May entrench further if done too aggressively'],
        sequencePosition: 'secondary'
      }
    ],
    optimistic: [
      {
        approach: 'ego_up',
        effectiveness: 0.8,
        description: 'Leverage their confidence and desire to be seen positively.',
        techniques: ['Compliment their intelligence', 'Frame cooperation as smart choice', 'Make them feel in control'],
        risks: ['May underestimate severity and become flippant'],
        sequencePosition: 'primary'
      },
      {
        approach: 'strategic_evidence',
        effectiveness: 0.7,
        description: 'Gradually reveal evidence to puncture overconfidence.',
        techniques: ['SUE technique', 'Start with peripheral evidence', 'Build to strongest evidence'],
        risks: ['May shut down if confronted too directly'],
        sequencePosition: 'secondary'
      }
    ],
    greedy_demanding: [
      {
        approach: 'incentive',
        effectiveness: 0.85,
        description: 'Frame cooperation in terms of personal benefit.',
        techniques: ['Outline concrete benefits of cooperation', 'Present cost-benefit analysis', 'Use reciprocity principle'],
        risks: ['May try to bargain beyond reasonable limits'],
        sequencePosition: 'primary'
      }
    ],
    anxious_self_centered: [
      {
        approach: 'emotional_appeal',
        effectiveness: 0.8,
        description: 'Address their anxiety directly. Provide reassurance while maintaining pressure.',
        techniques: ['Reduce environmental stressors', 'Offer comfort measures', 'Channel anxiety toward cooperation', 'Use empathetic listening'],
        risks: ['May become overwhelmed and shut down'],
        sequencePosition: 'primary'
      },
      {
        approach: 'rapport_building',
        effectiveness: 0.7,
        description: 'Build trust to reduce anxiety.',
        techniques: ['Active listening', 'Validate feelings', 'Provide structure and predictability'],
        risks: ['May become dependent and uncooperative without emotional support'],
        sequencePosition: 'secondary'
      }
    ],
    guilt_ridden: [
      {
        approach: 'emotional_appeal',
        effectiveness: 0.9,
        description: 'Appeal to conscience and desire for moral resolution.',
        techniques: ['Acknowledge the burden of guilt', 'Frame confession as relief', 'Reference moral values', 'Use third-person moral scenarios'],
        risks: ['May be emotionally fragile — handle with care'],
        sequencePosition: 'primary'
      }
    ],
    schizoid_withdrawn: [
      {
        approach: 'cognitive_interview',
        effectiveness: 0.6,
        description: 'Use intellectual engagement rather than emotional appeals.',
        techniques: ['Engage analytically', 'Ask about observations rather than feelings', 'Provide intellectual puzzles', 'Use silence strategically'],
        risks: ['May remain detached regardless of approach'],
        sequencePosition: 'primary'
      },
      {
        approach: 'silence',
        effectiveness: 0.5,
        description: 'Extended silence creates discomfort that intellectual types find difficult.',
        techniques: ['Measured pauses after questions', 'Comfortable silence after key topics', 'Allow them to fill the void'],
        risks: ['May simply outlast the silence'],
        sequencePosition: 'secondary'
      }
    ],
    exception: [
      {
        approach: 'ego_down',
        effectiveness: 0.65,
        description: 'Deflate narcissistic defenses by demonstrating they are not above consequences.',
        techniques: ['Present evidence of their fallibility', 'Show others have cooperated successfully', 'Normalize the situation'],
        risks: ['May trigger narcissistic rage and complete shutdown'],
        sequencePosition: 'secondary'
      },
      {
        approach: 'ego_up',
        effectiveness: 0.7,
        description: 'Initially feed their ego to gain cooperation.',
        techniques: ['Acknowledge their importance', 'Frame cooperation as legacy-building', 'Appeal to their desire for recognition'],
        risks: ['May reinforce unhelpful grandiosity'],
        sequencePosition: 'primary'
      }
    ],
    average_normal: [
      {
        approach: 'rapport_building',
        effectiveness: 0.7,
        description: 'Standard rapport-based approach with progressive disclosure.',
        techniques: ['Build genuine connection', 'Use open questions', 'Apply PEACE model'],
        risks: ['Limited — standard approach has broad applicability'],
        sequencePosition: 'primary'
      },
      {
        approach: 'cognitive_interview',
        effectiveness: 0.7,
        description: 'Standard CI techniques for memory enhancement.',
        techniques: ['Context reinstatement', 'Report everything', 'Reverse order', 'Change perspective'],
        risks: ['Minimal risk with standard approach'],
        sequencePosition: 'secondary'
      }
    ],
    wolf_in_sheeps_clothing: [
      {
        approach: 'strategic_evidence',
        effectiveness: 0.8,
        description: 'Use evidence strategically to expose the false persona.',
        techniques: ['Present contradictory evidence', 'Ask detail-heavy questions to expose rehearsed narrative', 'Use unexpected question order', 'Employ reverse chronology'],
        risks: ['Subject is skilled at adaptation — may construct new persona'],
        sequencePosition: 'primary'
      },
      {
        approach: 'repetition',
        effectiveness: 0.7,
        description: 'Ask the same questions in different ways to expose inconsistencies.',
        techniques: ['Vary question phrasing', 'Return to key topics from different angles', 'Use timeline reconstruction'],
        risks: ['Subject may recognize the technique'],
        sequencePosition: 'secondary'
      }
    ]
  };

  return approachMap[primary] || approachMap.average_normal;
}

function getContraindicatedApproaches(type: KUBARKPersonalityType): string[] {
  const contraMap: Record<KUBARKPersonalityType, string[]> = {
    orderly_obstinate: ['Confrontational tactics', 'Disorganized questioning', 'Emotional manipulation'],
    optimistic: ['Heavy-handed pressure early on', 'Lengthy silences (they fill them easily)'],
    greedy_demanding: ['Pure moral appeals', 'Threatening consequences without offering alternatives'],
    anxious_self_centered: ['Aggressive confrontation', 'Environmental stress amplification', 'Isolation without support'],
    guilt_ridden: ['Minimization of their actions', 'Dismissing their moral concerns'],
    schizoid_withdrawn: ['Emotional appeals', 'Rapport-heavy approaches', 'Physical proximity pressure'],
    exception: ['Overt ego deflation early on', 'Treating them as ordinary', 'Challenges to their status'],
    average_normal: [],
    wolf_in_sheeps_clothing: ['Accepting statements at face value', 'Single-question single-answer format']
  };

  return contraMap[type] || [];
}

function buildPsychologicalProfile(
  type: KUBARKPersonalityType,
  scores: Record<KUBARKPersonalityType, number>,
  input: ClassificationInput
): PsychologicalProfile {
  const profileMap: Record<KUBARKPersonalityType, Partial<PsychologicalProfile>> = {
    orderly_obstinate: { stressTolerance: 0.7, complianceLikelihood: 0.3, deceptionCapability: 0.5, emotionalStability: 0.7, cognitiveFlexibility: 0.3, authorityResponse: 'resistant' },
    optimistic: { stressTolerance: 0.6, complianceLikelihood: 0.6, deceptionCapability: 0.6, emotionalStability: 0.7, cognitiveFlexibility: 0.7, authorityResponse: 'compliant' },
    greedy_demanding: { stressTolerance: 0.5, complianceLikelihood: 0.5, deceptionCapability: 0.7, emotionalStability: 0.5, cognitiveFlexibility: 0.6, authorityResponse: 'indifferent' },
    anxious_self_centered: { stressTolerance: 0.2, complianceLikelihood: 0.7, deceptionCapability: 0.3, emotionalStability: 0.2, cognitiveFlexibility: 0.4, authorityResponse: 'compliant' },
    guilt_ridden: { stressTolerance: 0.3, complianceLikelihood: 0.8, deceptionCapability: 0.2, emotionalStability: 0.3, cognitiveFlexibility: 0.5, authorityResponse: 'compliant' },
    schizoid_withdrawn: { stressTolerance: 0.8, complianceLikelihood: 0.2, deceptionCapability: 0.6, emotionalStability: 0.8, cognitiveFlexibility: 0.4, authorityResponse: 'indifferent' },
    exception: { stressTolerance: 0.5, complianceLikelihood: 0.2, deceptionCapability: 0.8, emotionalStability: 0.4, cognitiveFlexibility: 0.6, authorityResponse: 'oppositional' },
    average_normal: { stressTolerance: 0.5, complianceLikelihood: 0.5, deceptionCapability: 0.5, emotionalStability: 0.5, cognitiveFlexibility: 0.5, authorityResponse: 'compliant' },
    wolf_in_sheeps_clothing: { stressTolerance: 0.7, complianceLikelihood: 0.3, deceptionCapability: 0.9, emotionalStability: 0.6, cognitiveFlexibility: 0.8, authorityResponse: 'compliant' },
  };

  const base = profileMap[type] || profileMap.average_normal;

  return {
    stressTolerance: base.stressTolerance || 0.5,
    complianceLikelihood: base.complianceLikelihood || 0.5,
    deceptionCapability: base.deceptionCapability || 0.5,
    emotionalStability: base.emotionalStability || 0.5,
    cognitiveFlexibility: base.cognitiveFlexibility || 0.5,
    authorityResponse: base.authorityResponse || 'compliant',
    motivationalDrivers: getMotivationalDrivers(type),
    vulnerabilities: getVulnerabilities(type)
  };
}

function getMotivationalDrivers(type: KUBARKPersonalityType): string[] {
  const drivers: Record<KUBARKPersonalityType, string[]> = {
    orderly_obstinate: ['Order', 'Rules', 'Consistency', 'Predictability'],
    optimistic: ['Recognition', 'Social approval', 'Comfort', 'Positive outcomes'],
    greedy_demanding: ['Material benefit', 'Status', 'Power', 'Personal advantage'],
    anxious_self_centered: ['Safety', 'Certainty', 'Self-preservation', 'Anxiety reduction'],
    guilt_ridden: ['Moral resolution', 'Forgiveness', 'Relieving burden', 'Redemption'],
    schizoid_withdrawn: ['Intellectual stimulation', 'Autonomy', 'Minimal social contact'],
    exception: ['Status confirmation', 'Special treatment', 'Recognition of uniqueness'],
    average_normal: ['Social connection', 'Fairness', 'Resolution', 'Moving forward'],
    wolf_in_sheeps_clothing: ['Self-preservation', 'Maintaining control', 'Information advantage'],
  };
  return drivers[type] || drivers.average_normal;
}

function getVulnerabilities(type: KUBARKPersonalityType): string[] {
  const vulns: Record<KUBARKPersonalityType, string[]> = {
    orderly_obstinate: ['Disruption of routine', 'Contradictions in their own logic', 'Evidence of rule-breaking by trusted figures'],
    optimistic: ['Unexpected severity of consequences', 'Evidence they underestimated', 'Social disapproval'],
    greedy_demanding: ['Loss of benefits', 'Better offers elsewhere', 'Demonstration that cooperation is more profitable'],
    anxious_self_centered: ['Uncertainty amplification', 'Isolation', 'Time pressure'],
    guilt_ridden: ['Moral confrontation', 'Impact on loved ones', 'Opportunity for atonement'],
    schizoid_withdrawn: ['Extended social interaction', 'Emotional confrontation', 'Disruption of intellectual defenses'],
    exception: ['Public exposure', 'Status loss', 'Being treated as ordinary'],
    average_normal: ['Standard rapport and evidence-based approaches'],
    wolf_in_sheeps_clothing: ['Unexpected evidence presentation', 'Rapid topic switching', 'Detail-heavy questioning'],
  };
  return vulns[type] || vulns.average_normal;
}
