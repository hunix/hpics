/**
 * Superiority Intelligence Engine
 * 
 * Advanced analytical capabilities for achieving strategic advantage
 * through deep psychological understanding, influence mapping, and
 * predictive behavioral modeling.
 */

export interface InfluenceLever {
  id: string;
  type: 'psychological' | 'social' | 'informational' | 'economic' | 'emotional';
  name: string;
  description: string;
  effectiveness: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  timing: 'immediate' | 'short-term' | 'long-term';
  prerequisites: string[];
  counterMeasures: string[];
}

export interface PowerDynamic {
  profileId: string;
  profileName: string;
  powerScore: number; // -100 to +100 (negative = they have power over you)
  dependencies: {
    type: string;
    description: string;
    strength: number;
    reversible: boolean;
  }[];
  leverage: {
    type: string;
    description: string;
    usability: number;
  }[];
  vulnerabilities: {
    type: string;
    description: string;
    exploitability: number;
    ethical: boolean;
  }[];
}

export interface PsychologicalProfile {
  profileId: string;
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  darkTriad: {
    narcissism: number;
    machiavellianism: number;
    psychopathy: number;
  };
  motivationalDrivers: {
    achievement: number;
    affiliation: number;
    power: number;
    security: number;
    autonomy: number;
  };
  decisionStyle: 'analytical' | 'intuitive' | 'dependent' | 'avoidant' | 'spontaneous';
  communicationStyle: 'assertive' | 'passive' | 'aggressive' | 'passive-aggressive';
  stressResponse: 'fight' | 'flight' | 'freeze' | 'fawn';
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  cognitiveVulnerabilities: {
    type: string;
    description: string;
    exploitability: number;
  }[];
}

export interface InfluenceStrategy {
  id: string;
  name: string;
  description: string;
  targetProfileId: string;
  objective: string;
  phase: 'rapport' | 'trust-building' | 'value-exchange' | 'commitment' | 'leverage';
  tactics: {
    name: string;
    description: string;
    psychologicalPrinciple: string;
    script: string;
    timing: string;
    successIndicators: string[];
  }[];
  contingencies: {
    trigger: string;
    response: string;
  }[];
  ethicalBoundaries: string[];
  expectedOutcome: string;
  successProbability: number;
}

export interface RelationshipChessboard {
  pieces: {
    profileId: string;
    role: 'ally' | 'adversary' | 'neutral' | 'asset' | 'liability' | 'unknown';
    value: number;
    mobility: number; // How easily their position can change
    influence: number; // Their influence on other pieces
  }[];
  positions: {
    current: string;
    desired: string;
    moves: number; // Estimated moves to reach desired position
  };
  threats: {
    source: string;
    target: string;
    severity: number;
    timeframe: string;
  }[];
  opportunities: {
    description: string;
    profileIds: string[];
    value: number;
    window: string;
  }[];
}

export interface SuperiorityMetrics {
  overallScore: number; // 0-100
  dimensions: {
    informationAdvantage: number;
    networkPosition: number;
    psychologicalInsight: number;
    predictiveAccuracy: number;
    influenceCapability: number;
    defensivePosture: number;
  };
  blindSpots: {
    area: string;
    severity: number;
    mitigation: string;
  }[];
  recommendations: {
    priority: number;
    action: string;
    expectedGain: number;
    effort: 'low' | 'medium' | 'high';
  }[];
}

// Cialdini's Principles of Influence
export const INFLUENCE_PRINCIPLES = {
  reciprocity: {
    name: 'Reciprocity',
    description: 'People feel obligated to return favors',
    tactics: ['Give before asking', 'Personalized gifts', 'Exclusive access', 'Unsolicited help'],
    detection: ['Unsolicited favors', 'Excessive generosity', 'Creating debt']
  },
  commitment: {
    name: 'Commitment & Consistency',
    description: 'People want to be consistent with past actions',
    tactics: ['Small commitments first', 'Public declarations', 'Written agreements', 'Foot-in-the-door'],
    detection: ['Incremental requests', 'Referencing past agreements', 'Consistency pressure']
  },
  socialProof: {
    name: 'Social Proof',
    description: 'People follow the crowd',
    tactics: ['Testimonials', 'Popularity signals', 'Peer pressure', 'Bandwagon effect'],
    detection: ['Everyone is doing it', 'Manufactured consensus', 'Fake reviews']
  },
  authority: {
    name: 'Authority',
    description: 'People defer to experts',
    tactics: ['Credentials display', 'Expert endorsements', 'Uniform/title usage', 'Confident demeanor'],
    detection: ['Excessive credential dropping', 'Appeal to unnamed experts', 'Intimidation']
  },
  liking: {
    name: 'Liking',
    description: 'People say yes to those they like',
    tactics: ['Find similarities', 'Give compliments', 'Increase familiarity', 'Physical attractiveness'],
    detection: ['Excessive flattery', 'Manufactured similarities', 'Love bombing']
  },
  scarcity: {
    name: 'Scarcity',
    description: 'People want what is rare',
    tactics: ['Limited time offers', 'Exclusive access', 'Competition for resources', 'Fear of missing out'],
    detection: ['Artificial deadlines', 'Manufactured scarcity', 'Urgency pressure']
  },
  unity: {
    name: 'Unity',
    description: 'People favor their in-group',
    tactics: ['Shared identity', 'Common enemy', 'We language', 'Tribal signals'],
    detection: ['Us vs them framing', 'Identity manipulation', 'Manufactured belonging']
  }
} as const;

// Manipulation Detection Framework
export const MANIPULATION_INDICATORS = {
  gaslighting: {
    name: 'Gaslighting',
    description: 'Making someone question their reality',
    indicators: [
      'Denying things that happened',
      'Trivializing feelings',
      'Shifting blame',
      'Contradicting with confidence',
      'Isolating from support'
    ],
    severity: 'high'
  },
  loveBombing: {
    name: 'Love Bombing',
    description: 'Overwhelming with excessive affection',
    indicators: [
      'Excessive compliments',
      'Rapid intimacy escalation',
      'Constant contact',
      'Expensive gifts early',
      'Idealization'
    ],
    severity: 'medium'
  },
  triangulation: {
    name: 'Triangulation',
    description: 'Using a third party to manipulate',
    indicators: [
      'Mentioning others attraction',
      'Creating jealousy',
      'Comparing unfavorably',
      'Using others as messengers',
      'Playing people against each other'
    ],
    severity: 'medium'
  },
  intermittentReinforcement: {
    name: 'Intermittent Reinforcement',
    description: 'Random rewards to create addiction',
    indicators: [
      'Unpredictable responses',
      'Hot and cold behavior',
      'Random affection',
      'Breadcrumbing',
      'Push-pull dynamics'
    ],
    severity: 'high'
  },
  silentTreatment: {
    name: 'Silent Treatment',
    description: 'Withholding communication as punishment',
    indicators: [
      'Ignoring after conflict',
      'Emotional withdrawal',
      'Refusing to communicate',
      'Stonewalling',
      'Creating anxiety through absence'
    ],
    severity: 'medium'
  },
  guilting: {
    name: 'Guilt Tripping',
    description: 'Using guilt to control behavior',
    indicators: [
      'Playing victim',
      'Bringing up past favors',
      'Emotional blackmail',
      'Martyrdom displays',
      'Obligation creation'
    ],
    severity: 'medium'
  }
} as const;

// Cognitive Biases for Strategic Advantage
export const COGNITIVE_BIASES = {
  anchoringBias: {
    name: 'Anchoring Bias',
    description: 'Over-reliance on first piece of information',
    exploitation: 'Set initial anchors in negotiations',
    defense: 'Recognize arbitrary starting points'
  },
  confirmationBias: {
    name: 'Confirmation Bias',
    description: 'Seeking information that confirms beliefs',
    exploitation: 'Frame information to match their beliefs',
    defense: 'Actively seek contradicting information'
  },
  sunkenCostFallacy: {
    name: 'Sunk Cost Fallacy',
    description: 'Continuing due to past investment',
    exploitation: 'Reference their past investments',
    defense: 'Focus on future value, not past costs'
  },
  haloEffect: {
    name: 'Halo Effect',
    description: 'One positive trait influences perception of others',
    exploitation: 'Lead with strongest attribute',
    defense: 'Evaluate traits independently'
  },
  lossAversion: {
    name: 'Loss Aversion',
    description: 'Losses feel worse than equivalent gains',
    exploitation: 'Frame as preventing loss vs gaining',
    defense: 'Reframe potential losses as investments'
  },
  bandwagonEffect: {
    name: 'Bandwagon Effect',
    description: 'Following what others do',
    exploitation: 'Show popularity and adoption',
    defense: 'Make independent assessments'
  },
  authorityBias: {
    name: 'Authority Bias',
    description: 'Trusting authority figures',
    exploitation: 'Leverage credentials and titles',
    defense: 'Question expertise relevance'
  },
  reciprocityBias: {
    name: 'Reciprocity Bias',
    description: 'Feeling obligated to return favors',
    exploitation: 'Give strategic gifts',
    defense: 'Recognize obligation attempts'
  }
} as const;

/**
 * Calculate superiority score for a contact network
 */
export function calculateSuperiorityScore(
  contactCount: number,
  analysisDepth: number,
  predictionAccuracy: number,
  networkReach: number
): SuperiorityMetrics {
  const informationAdvantage = Math.min(100, (analysisDepth / 10) * 100);
  const networkPosition = Math.min(100, (networkReach / contactCount) * 100);
  const psychologicalInsight = Math.min(100, analysisDepth * 15);
  const predictiveAccuracy = Math.min(100, predictionAccuracy * 100);
  const influenceCapability = (networkPosition + psychologicalInsight) / 2;
  const defensivePosture = Math.min(100, (predictionAccuracy + 0.2) * 80);
  
  const overallScore = (
    informationAdvantage * 0.2 +
    networkPosition * 0.15 +
    psychologicalInsight * 0.25 +
    predictiveAccuracy * 0.2 +
    influenceCapability * 0.1 +
    defensivePosture * 0.1
  );
  
  return {
    overallScore,
    dimensions: {
      informationAdvantage,
      networkPosition,
      psychologicalInsight,
      predictiveAccuracy,
      influenceCapability,
      defensivePosture
    },
    blindSpots: [],
    recommendations: []
  };
}

/**
 * Analyze power dynamics between user and contact
 */
export function analyzePowerDynamics(
  profileData: any,
  interactionHistory: any[]
): PowerDynamic {
  // This would be enhanced with AI analysis
  return {
    profileId: profileData.id,
    profileName: profileData.name || 'Unknown',
    powerScore: 0,
    dependencies: [],
    leverage: [],
    vulnerabilities: []
  };
}

/**
 * Generate influence strategy based on psychological profile
 */
export function generateInfluenceStrategy(
  profile: PsychologicalProfile,
  objective: string
): InfluenceStrategy {
  const tactics = [];
  
  // Tailor tactics based on personality
  if (profile.bigFive.agreeableness > 70) {
    tactics.push({
      name: 'Harmony Appeal',
      description: 'Frame requests as benefiting group harmony',
      psychologicalPrinciple: 'High agreeableness responds to social harmony',
      script: 'This would really help bring the team together...',
      timing: 'During collaborative moments',
      successIndicators: ['Verbal agreement', 'Collaborative language']
    });
  }
  
  if (profile.motivationalDrivers.achievement > 70) {
    tactics.push({
      name: 'Achievement Framing',
      description: 'Position opportunity as achievement pathway',
      psychologicalPrinciple: 'Achievement-motivated individuals seek success',
      script: 'This is a rare opportunity to distinguish yourself...',
      timing: 'When discussing goals or progress',
      successIndicators: ['Increased engagement', 'Goal-oriented questions']
    });
  }
  
  return {
    id: crypto.randomUUID(),
    name: `Strategy for ${objective}`,
    description: `Tailored approach based on psychological analysis`,
    targetProfileId: profile.profileId,
    objective,
    phase: 'rapport',
    tactics,
    contingencies: [],
    ethicalBoundaries: ['No deception', 'Mutual benefit required'],
    expectedOutcome: objective,
    successProbability: 0.6
  };
}
