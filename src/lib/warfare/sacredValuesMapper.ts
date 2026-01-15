// Sacred Values Mapper - Identify non-negotiable beliefs for tribal activation
// Based on research by Scott Atran and moral psychology

export interface SacredValue {
  id: string;
  domain: ValueDomain;
  value: string;
  protectionLevel: number; // 0-1, how fiercely protected
  tribalAssociations: string[];
  triggerPhrases: string[];
  violationResponse: ViolationResponse;
  exploitationRisk: 'low' | 'medium' | 'high';
}

export type ValueDomain = 
  | 'family'
  | 'religion'
  | 'nation'
  | 'identity'
  | 'honor'
  | 'justice'
  | 'liberty'
  | 'purity'
  | 'loyalty'
  | 'authority';

export interface ViolationResponse {
  emotionalIntensity: number;
  typicalReactions: string[];
  recoveryTime: string;
  permanentDamageRisk: number;
}

export interface SacredValuesProfile {
  profileId: string;
  sacredValues: SacredValue[];
  moralFoundations: MoralFoundationScores;
  tribalIdentities: TribalIdentity[];
  manipulationVectors: ManipulationVector[];
}

export interface MoralFoundationScores {
  care: number;
  fairness: number;
  loyalty: number;
  authority: number;
  sanctity: number;
  liberty: number;
}

export interface TribalIdentity {
  tribe: string;
  strength: number;
  inGroupMarkers: string[];
  outGroupMarkers: string[];
  activationTriggers: string[];
}

export interface ManipulationVector {
  vector: string;
  targetValue: string;
  approach: 'activate' | 'threaten' | 'align' | 'reframe';
  expectedResponse: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// Haidt's Moral Foundations
export const MORAL_FOUNDATIONS = {
  CARE: {
    name: 'Care/Harm',
    description: 'Protecting others from harm',
    triggers: ['suffering', 'cruelty', 'kindness', 'nurturing'],
    violations: ['Causing unnecessary suffering', 'Abandoning the vulnerable'],
  },
  FAIRNESS: {
    name: 'Fairness/Cheating',
    description: 'Justice and reciprocity',
    triggers: ['inequality', 'exploitation', 'justice', 'rights'],
    violations: ['Cheating', 'Free-riding', 'Unfair advantages'],
  },
  LOYALTY: {
    name: 'Loyalty/Betrayal',
    description: 'Group cohesion and sacrifice',
    triggers: ['patriotism', 'teamwork', 'self-sacrifice', 'belonging'],
    violations: ['Treason', 'Disloyalty', 'Abandoning group'],
  },
  AUTHORITY: {
    name: 'Authority/Subversion',
    description: 'Respect for traditions and hierarchy',
    triggers: ['tradition', 'respect', 'order', 'hierarchy'],
    violations: ['Disobedience', 'Disrespect', 'Rebellion'],
  },
  SANCTITY: {
    name: 'Sanctity/Degradation',
    description: 'Purity and contamination avoidance',
    triggers: ['purity', 'sacred', 'contamination', 'disgust'],
    violations: ['Desecration', 'Impurity', 'Degradation'],
  },
  LIBERTY: {
    name: 'Liberty/Oppression',
    description: 'Freedom from domination',
    triggers: ['freedom', 'autonomy', 'tyranny', 'bullying'],
    violations: ['Oppression', 'Control', 'Domination'],
  },
} as const;

// Sacred value characteristics
export const SACRED_VALUE_CHARACTERISTICS = {
  TABOO_TRADEOFFS: {
    description: 'Cannot be traded for material goods',
    examples: ['Selling organs of loved ones', 'Trading safety for money'],
  },
  MORAL_OUTRAGE: {
    description: 'Mere contemplation of violation causes anger',
    examples: ['Being asked "What would it take for you to..."'],
  },
  MORAL_CLEANSING: {
    description: 'Need to reaffirm value after violation contemplation',
    examples: ['Expressing disgust', 'Distancing from proposition'],
  },
  PROTECTED_VALUES: {
    description: 'Quantity insensitivity - saving 1 or 1000 same importance',
    examples: ['Lives of children', 'National symbols'],
  },
} as const;

// Identify sacred values from behavioral signals
export function identifySacredValues(
  reactions: Array<{
    topic: string;
    domain: ValueDomain;
    emotionalIntensity: number;
    defensiveness: number;
    tradeoffRejection: boolean;
  }>
): SacredValue[] {
  return reactions
    .filter(r => r.emotionalIntensity > 0.7 || r.tradeoffRejection)
    .map(r => ({
      id: crypto.randomUUID(),
      domain: r.domain,
      value: r.topic,
      protectionLevel: Math.max(r.emotionalIntensity, r.defensiveness),
      tribalAssociations: [],
      triggerPhrases: [],
      violationResponse: {
        emotionalIntensity: r.emotionalIntensity,
        typicalReactions: ['Moral outrage', 'Relationship reevaluation'],
        recoveryTime: r.emotionalIntensity > 0.8 ? 'Weeks to months' : 'Days to weeks',
        permanentDamageRisk: r.emotionalIntensity * 0.8,
      },
      exploitationRisk: r.emotionalIntensity > 0.8 ? 'high' : 'medium',
    }));
}

// Generate manipulation vectors
export function generateManipulationVectors(
  sacredValues: SacredValue[],
  objective: string
): ManipulationVector[] {
  const vectors: ManipulationVector[] = [];
  
  for (const value of sacredValues) {
    // Activation approach - align with their values
    vectors.push({
      vector: `Align ${objective} with their ${value.domain} values`,
      targetValue: value.value,
      approach: 'align',
      expectedResponse: 'Increased openness to proposal',
      riskLevel: 'low',
    });
    
    // Threat approach - frame opposition as threatening values
    if (value.protectionLevel > 0.7) {
      vectors.push({
        vector: `Frame opposition as threat to ${value.value}`,
        targetValue: value.value,
        approach: 'threaten',
        expectedResponse: 'Defensive action in your favor',
        riskLevel: 'medium',
      });
    }
    
    // Tribal activation
    if (value.tribalAssociations.length > 0) {
      vectors.push({
        vector: `Activate tribal identity around ${value.domain}`,
        targetValue: value.value,
        approach: 'activate',
        expectedResponse: 'In-group favoritism, out-group antagonism',
        riskLevel: 'medium',
      });
    }
  }
  
  return vectors;
}

// Calculate moral foundation profile
export function calculateMoralFoundations(
  responses: Array<{
    foundation: keyof typeof MORAL_FOUNDATIONS;
    agreement: number; // -1 to 1
    importance: number; // 0 to 1
  }>
): MoralFoundationScores {
  const scores: MoralFoundationScores = {
    care: 0,
    fairness: 0,
    loyalty: 0,
    authority: 0,
    sanctity: 0,
    liberty: 0,
  };
  
  const foundationToKey: Record<string, keyof MoralFoundationScores> = {
    CARE: 'care',
    FAIRNESS: 'fairness',
    LOYALTY: 'loyalty',
    AUTHORITY: 'authority',
    SANCTITY: 'sanctity',
    LIBERTY: 'liberty',
  };
  
  for (const response of responses) {
    const key = foundationToKey[response.foundation];
    if (key) {
      scores[key] = (response.agreement + 1) / 2 * response.importance;
    }
  }
  
  return scores;
}
