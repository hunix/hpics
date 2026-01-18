/**
 * Dark Psychology Engine
 * 
 * Advanced psychological manipulation detection, cognitive bias exploitation,
 * and influence technique analysis. Uses research-backed principles from
 * social psychology, behavioral economics, and influence science.
 */

// ============================================
// Core Types
// ============================================

// Enhanced to Dark Tetrad (includes Sadism)
export interface DarkTetradAssessment {
  narcissism: {
    score: number;
    grandiose: number;
    vulnerable: number;
    communal: number;  // Communal narcissism
    indicators: string[];
  };
  machiavellianism: {
    score: number;
    strategic: number;
    cynical: number;
    coalition: number; // Coalition manipulation
    indicators: string[];
  };
  psychopathy: {
    score: number;
    primary: number;    // Callousness
    secondary: number;  // Impulsivity
    fearless: number;   // Fearless dominance
    indicators: string[];
  };
  sadism: {
    score: number;
    vicarious: number;  // Enjoys watching suffering
    direct: number;     // Enjoys causing suffering
    verbal: number;     // Verbal cruelty
    indicators: string[];
  };
  overallDarkness: number;
  darkTetradScore: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'extreme' | 'critical';
  dominantTrait: 'narcissism' | 'machiavellianism' | 'psychopathy' | 'sadism' | 'balanced';
}

// Legacy alias for backward compatibility
export type DarkTriadAssessment = DarkTetradAssessment;

export interface CognitiveBias {
  id: string;
  name: string;
  category: 'decision' | 'social' | 'memory' | 'probability' | 'belief';
  susceptibility: number;  // 0-100
  exploitationMethod: string;
  example: string;
  defenseMethod: string;
}

export interface ManipulationTechnique {
  id: string;
  name: string;
  category: 'emotional' | 'social' | 'cognitive' | 'behavioral' | 'financial';
  description: string;
  indicators: string[];
  effectiveness: number;
  ethicsLevel: 'benign' | 'gray' | 'dark' | 'harmful';
  counterMeasures: string[];
}

export interface PsychologicalVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  triggers: string[];
  exploitationRisk: number;
  protectiveFactors: string[];
}

export interface InfluenceResistance {
  overall: number;
  byPrinciple: Record<string, number>;
  weakPoints: string[];
  strengthPoints: string[];
}

// ============================================
// Cialdini's Principles + Extended
// ============================================

export const INFLUENCE_PRINCIPLES = {
  reciprocity: {
    name: 'Reciprocity',
    description: 'People feel obligated to return favors',
    techniques: [
      'Give before asking',
      'Offer unsolicited gifts',
      'Provide valuable information first',
      'Make concessions to trigger reciprocal concessions'
    ],
    detection: [
      'Unexpected gifts before requests',
      'Free samples or trials',
      'Unsolicited favors',
      'Door-in-the-face technique'
    ]
  },
  commitment: {
    name: 'Commitment & Consistency',
    description: 'People want to be consistent with past behavior',
    techniques: [
      'Get small commitments first',
      'Public declarations',
      'Written commitments',
      'Foot-in-the-door technique',
      'Low-ball technique'
    ],
    detection: [
      'Requests for small initial agreements',
      'References to past statements',
      'Emphasis on being consistent',
      'Escalating requests'
    ]
  },
  socialProof: {
    name: 'Social Proof',
    description: 'People follow what others are doing',
    techniques: [
      'Show testimonials',
      'Reference what "most people" do',
      'Create artificial scarcity via demand',
      'Use peer pressure strategically'
    ],
    detection: [
      'Everyone is doing it',
      'Most popular option',
      'Bandwagon appeals',
      'Celebrity endorsements'
    ]
  },
  authority: {
    name: 'Authority',
    description: 'People defer to experts and authority figures',
    techniques: [
      'Display credentials',
      'Reference experts',
      'Use authoritative language',
      'Dress for authority'
    ],
    detection: [
      'Appeals to expertise',
      'Credential displays',
      'Use of jargon',
      'Reference to studies/research'
    ]
  },
  liking: {
    name: 'Liking',
    description: 'People say yes to those they like',
    techniques: [
      'Find common ground',
      'Give compliments',
      'Mirror behavior',
      'Build rapport before asking'
    ],
    detection: [
      'Excessive flattery',
      'Artificial similarity claims',
      'Rapid rapport building',
      'Charm offensive'
    ]
  },
  scarcity: {
    name: 'Scarcity',
    description: 'People want what is rare or dwindling',
    techniques: [
      'Limited time offers',
      'Exclusive access',
      'Last chance messaging',
      'Competition framing'
    ],
    detection: [
      'Time pressure',
      'Limited availability claims',
      'Exclusive offers',
      'Deadline urgency'
    ]
  },
  unity: {
    name: 'Unity',
    description: 'People are influenced by shared identity',
    techniques: [
      'Establish in-group connection',
      'Use inclusive language',
      'Reference shared experiences',
      'Create us vs. them framing'
    ],
    detection: [
      'We/us language',
      'Family/tribe references',
      'Shared enemy creation',
      'Identity appeals'
    ]
  }
};

// ============================================
// Cognitive Biases Database
// ============================================

export const COGNITIVE_BIASES: CognitiveBias[] = [
  // Decision Biases
  {
    id: 'anchoring',
    name: 'Anchoring Bias',
    category: 'decision',
    susceptibility: 75,
    exploitationMethod: 'Present a high initial number before negotiation',
    example: 'Starting price at $10,000 makes $5,000 seem reasonable',
    defenseMethod: 'Research fair market values independently before discussions'
  },
  {
    id: 'loss_aversion',
    name: 'Loss Aversion',
    category: 'decision',
    susceptibility: 80,
    exploitationMethod: 'Frame outcomes as potential losses rather than gains',
    example: '"You\'ll lose $100/month" vs "You\'ll save $100/month"',
    defenseMethod: 'Reframe losses as opportunity costs and vice versa'
  },
  {
    id: 'sunk_cost',
    name: 'Sunk Cost Fallacy',
    category: 'decision',
    susceptibility: 70,
    exploitationMethod: 'Reference past investments to encourage continued investment',
    example: '"You\'ve already invested so much, don\'t stop now"',
    defenseMethod: 'Evaluate decisions based only on future costs and benefits'
  },
  {
    id: 'framing',
    name: 'Framing Effect',
    category: 'decision',
    susceptibility: 85,
    exploitationMethod: 'Present same information with different framing',
    example: '"90% survival rate" vs "10% mortality rate"',
    defenseMethod: 'Ask for information in multiple framings'
  },
  {
    id: 'decoy',
    name: 'Decoy Effect',
    category: 'decision',
    susceptibility: 65,
    exploitationMethod: 'Add asymmetrically dominated option to push choice',
    example: 'Small $5, Medium $6.50, Large $7 (Medium is decoy)',
    defenseMethod: 'Ignore options that seem obviously inferior'
  },
  
  // Social Biases
  {
    id: 'halo',
    name: 'Halo Effect',
    category: 'social',
    susceptibility: 75,
    exploitationMethod: 'Lead with strongest positive attribute to bias overall perception',
    example: 'Attractive people perceived as more competent',
    defenseMethod: 'Evaluate each attribute independently'
  },
  {
    id: 'authority',
    name: 'Authority Bias',
    category: 'social',
    susceptibility: 80,
    exploitationMethod: 'Display credentials or expert status before making claims',
    example: 'Doctor-endorsed products',
    defenseMethod: 'Verify expertise is relevant to the specific claim'
  },
  {
    id: 'bandwagon',
    name: 'Bandwagon Effect',
    category: 'social',
    susceptibility: 70,
    exploitationMethod: 'Show what "everyone else" is doing',
    example: '"Join millions of satisfied customers"',
    defenseMethod: 'Evaluate based on personal needs, not popularity'
  },
  {
    id: 'ingroup',
    name: 'In-group Bias',
    category: 'social',
    susceptibility: 85,
    exploitationMethod: 'Establish shared group identity before request',
    example: '"As fellow parents..."',
    defenseMethod: 'Recognize tribal appeals and evaluate objectively'
  },
  
  // Memory Biases
  {
    id: 'recency',
    name: 'Recency Bias',
    category: 'memory',
    susceptibility: 75,
    exploitationMethod: 'Ensure your message is the last thing they hear',
    example: 'Make your pitch last in a series',
    defenseMethod: 'Take notes and review all information equally'
  },
  {
    id: 'primacy',
    name: 'Primacy Effect',
    category: 'memory',
    susceptibility: 70,
    exploitationMethod: 'Lead with your strongest points',
    example: 'First impressions stick',
    defenseMethod: 'Consciously reconsider early impressions'
  },
  {
    id: 'peak_end',
    name: 'Peak-End Rule',
    category: 'memory',
    susceptibility: 80,
    exploitationMethod: 'Create memorable peak and end experiences',
    example: 'Ending meeting on high note',
    defenseMethod: 'Evaluate entire experience, not just highlights'
  },
  
  // Probability Biases
  {
    id: 'availability',
    name: 'Availability Heuristic',
    category: 'probability',
    susceptibility: 85,
    exploitationMethod: 'Provide vivid, easily recalled examples',
    example: 'Fear marketing after news events',
    defenseMethod: 'Look up actual statistics, not just memorable examples'
  },
  {
    id: 'representativeness',
    name: 'Representativeness Heuristic',
    category: 'probability',
    susceptibility: 75,
    exploitationMethod: 'Use stereotypical examples to seem more probable',
    example: 'Making product seem "typical" of success',
    defenseMethod: 'Consider base rates and statistical likelihood'
  },
  {
    id: 'gambler',
    name: 'Gambler\'s Fallacy',
    category: 'probability',
    susceptibility: 65,
    exploitationMethod: 'Suggest "it\'s due" after a streak',
    example: '"After 5 losses, a win is coming"',
    defenseMethod: 'Understand that past random events don\'t affect future ones'
  },
  
  // Belief Biases
  {
    id: 'confirmation',
    name: 'Confirmation Bias',
    category: 'belief',
    susceptibility: 90,
    exploitationMethod: 'Present information that confirms existing beliefs',
    example: 'Showing only supporting evidence',
    defenseMethod: 'Actively seek disconfirming evidence'
  },
  {
    id: 'dunning_kruger',
    name: 'Dunning-Kruger Effect',
    category: 'belief',
    susceptibility: 70,
    exploitationMethod: 'Leverage overconfidence in unfamiliar domains',
    example: 'Complex products sold to novices',
    defenseMethod: 'Acknowledge limitations of own expertise'
  },
  {
    id: 'belief_perseverance',
    name: 'Belief Perseverance',
    category: 'belief',
    susceptibility: 85,
    exploitationMethod: 'Once convinced, they\'ll resist contrary evidence',
    example: 'Getting early buy-in',
    defenseMethod: 'Regularly update beliefs with new evidence'
  }
];

// ============================================
// Dark Psychology Techniques
// ============================================

export const MANIPULATION_TECHNIQUES: ManipulationTechnique[] = [
  // Emotional Manipulation
  {
    id: 'gaslighting',
    name: 'Gaslighting',
    category: 'emotional',
    description: 'Making someone question their reality and perceptions',
    indicators: [
      'Denying events that occurred',
      '"You\'re too sensitive"',
      'Contradicting memories',
      'Trivializing feelings'
    ],
    effectiveness: 85,
    ethicsLevel: 'harmful',
    counterMeasures: [
      'Keep records of events',
      'Seek external validation',
      'Trust your perceptions'
    ]
  },
  {
    id: 'love_bombing',
    name: 'Love Bombing',
    category: 'emotional',
    description: 'Overwhelming with affection to create obligation',
    indicators: [
      'Excessive early praise',
      'Rapid intimacy escalation',
      'Grand gestures',
      'Constant communication'
    ],
    effectiveness: 80,
    ethicsLevel: 'dark',
    counterMeasures: [
      'Maintain healthy boundaries',
      'Be suspicious of rushed relationships',
      'Don\'t feel obligated by gifts'
    ]
  },
  {
    id: 'guilt_tripping',
    name: 'Guilt Tripping',
    category: 'emotional',
    description: 'Using guilt to control behavior',
    indicators: [
      '"After all I\'ve done for you"',
      'Martyrdom displays',
      'Silent treatment',
      'Emotional blackmail'
    ],
    effectiveness: 75,
    ethicsLevel: 'dark',
    counterMeasures: [
      'Recognize legitimate vs. manufactured guilt',
      'Set clear boundaries',
      'Don\'t accept responsibility for others\' emotions'
    ]
  },
  {
    id: 'fear_mongering',
    name: 'Fear Mongering',
    category: 'emotional',
    description: 'Creating fear to drive behavior',
    indicators: [
      'Worst-case scenarios',
      'Exaggerated threats',
      'Urgency without justification',
      'Protection offers'
    ],
    effectiveness: 85,
    ethicsLevel: 'gray',
    counterMeasures: [
      'Verify threats independently',
      'Assess actual probability',
      'Avoid decisions under fear'
    ]
  },
  
  // Social Manipulation
  {
    id: 'triangulation',
    name: 'Triangulation',
    category: 'social',
    description: 'Using third parties to manipulate relationships',
    indicators: [
      'Comparing to others',
      'Sharing confidences',
      'Creating jealousy',
      'Divide and conquer tactics'
    ],
    effectiveness: 70,
    ethicsLevel: 'dark',
    counterMeasures: [
      'Communicate directly',
      'Be wary of gossip',
      'Verify information at source'
    ]
  },
  {
    id: 'isolation',
    name: 'Isolation',
    category: 'social',
    description: 'Cutting target off from support systems',
    indicators: [
      'Criticizing friends/family',
      'Creating dependency',
      'Monopolizing time',
      'Moving away from support'
    ],
    effectiveness: 90,
    ethicsLevel: 'harmful',
    counterMeasures: [
      'Maintain outside relationships',
      'Be alert to isolation attempts',
      'Keep independent social life'
    ]
  },
  
  // Cognitive Manipulation
  {
    id: 'moving_goalposts',
    name: 'Moving the Goalposts',
    category: 'cognitive',
    description: 'Changing standards after they\'re met',
    indicators: [
      'New requirements after completion',
      'Shifting criteria',
      'Never satisfied',
      'Infinite deferral'
    ],
    effectiveness: 75,
    ethicsLevel: 'dark',
    counterMeasures: [
      'Get agreements in writing',
      'Define success criteria upfront',
      'Call out changes explicitly'
    ]
  },
  {
    id: 'false_dilemma',
    name: 'False Dilemma',
    category: 'cognitive',
    description: 'Presenting only two options when more exist',
    indicators: [
      '"Either... or..."',
      'Binary choices',
      'No middle ground offered',
      'Artificial constraints'
    ],
    effectiveness: 70,
    ethicsLevel: 'gray',
    counterMeasures: [
      'Always ask "what are ALL options?"',
      'Propose alternatives',
      'Challenge constraints'
    ]
  },
  
  // Behavioral Manipulation
  {
    id: 'intermittent_reinforcement',
    name: 'Intermittent Reinforcement',
    category: 'behavioral',
    description: 'Unpredictable rewards creating addiction-like behavior',
    indicators: [
      'Inconsistent treatment',
      'Random rewards/punishments',
      'Hot/cold behavior',
      'Unpredictable responses'
    ],
    effectiveness: 95,
    ethicsLevel: 'harmful',
    counterMeasures: [
      'Recognize the pattern',
      'Don\'t chase approval',
      'Maintain consistent expectations'
    ]
  },
  {
    id: 'learned_helplessness',
    name: 'Learned Helplessness',
    category: 'behavioral',
    description: 'Creating belief that escape is impossible',
    indicators: [
      'Constant criticism',
      'Blocking initiatives',
      'Unpredictable rules',
      'No-win situations'
    ],
    effectiveness: 85,
    ethicsLevel: 'harmful',
    counterMeasures: [
      'Take small actions',
      'Celebrate small wins',
      'Seek external support'
    ]
  }
];

// ============================================
// Analysis Functions
// ============================================

/**
 * Assess Dark Triad traits from behavioral data
 */
export function assessDarkTriad(
  behavioralData: {
    messages: Array<{ content: string; direction: 'sent' | 'received' }>;
    observations: Array<{ type: string; content: string }>;
    interactions: Array<{ outcome: string; pattern: string }>;
  }
): DarkTriadAssessment {
  let narcissismScore = 0;
  let machiavellianismScore = 0;
  let psychopathyScore = 0;
  const narcissismIndicators: string[] = [];
  const machiavellianismIndicators: string[] = [];
  const psychopathyIndicators: string[] = [];
  
  // Narcissism indicators
  const narcissismPatterns = [
    { pattern: /\bi['']?m (the best|amazing|incredible|exceptional)/gi, weight: 3, indicator: 'Grandiose self-statements' },
    { pattern: /\byou (should be|should feel) (grateful|lucky|honored)/gi, weight: 2, indicator: 'Expectation of special treatment' },
    { pattern: /\bno one (understands|appreciates|recognizes)/gi, weight: 2, indicator: 'Sense of being misunderstood' },
    { pattern: /\b(jealous|envious) of me/gi, weight: 2, indicator: 'Believes others envy them' },
    { pattern: /\bi deserve/gi, weight: 1, indicator: 'Entitlement patterns' }
  ];
  
  // Machiavellianism indicators
  const machiavellianismPatterns = [
    { pattern: /\b(strategic|strategically|calculated|calculating)/gi, weight: 2, indicator: 'Strategic language' },
    { pattern: /\bpeople are (easily|so) (manipulated|fooled|deceived)/gi, weight: 3, indicator: 'Cynical view of others' },
    { pattern: /\b(leverage|exploit|advantage|use (them|him|her))/gi, weight: 2, indicator: 'Exploitation language' },
    { pattern: /\bend justifies/gi, weight: 3, indicator: 'Ends-justify-means thinking' },
    { pattern: /\btrust (no one|nobody)/gi, weight: 2, indicator: 'Distrust patterns' }
  ];
  
  // Psychopathy indicators
  const psychopathyPatterns = [
    { pattern: /\bi don['']?t (care|feel bad|regret)/gi, weight: 2, indicator: 'Lack of remorse' },
    { pattern: /\b(their|his|her) (fault|problem|issue)/gi, weight: 1, indicator: 'Blame externalization' },
    { pattern: /\bbored|boring/gi, weight: 1, indicator: 'Stimulation seeking' },
    { pattern: /\b(rules|laws) (don['']?t|are not) (apply|meant) for/gi, weight: 3, indicator: 'Above-the-rules thinking' },
    { pattern: /\bweak|weakness/gi, weight: 1, indicator: 'Contempt for weakness' }
  ];
  
  // Analyze messages
  const allText = behavioralData.messages
    .filter(m => m.direction === 'received')
    .map(m => m.content)
    .join(' ');
  
  for (const { pattern, weight, indicator } of narcissismPatterns) {
    const matches = allText.match(pattern);
    if (matches) {
      narcissismScore += weight * matches.length;
      if (!narcissismIndicators.includes(indicator)) {
        narcissismIndicators.push(indicator);
      }
    }
  }
  
  for (const { pattern, weight, indicator } of machiavellianismPatterns) {
    const matches = allText.match(pattern);
    if (matches) {
      machiavellianismScore += weight * matches.length;
      if (!machiavellianismIndicators.includes(indicator)) {
        machiavellianismIndicators.push(indicator);
      }
    }
  }
  
  for (const { pattern, weight, indicator } of psychopathyPatterns) {
    const matches = allText.match(pattern);
    if (matches) {
      psychopathyScore += weight * matches.length;
      if (!psychopathyIndicators.includes(indicator)) {
        psychopathyIndicators.push(indicator);
      }
    }
  }
  
  // Sadism indicators (NEW for Dark Tetrad)
  let sadismScore = 0;
  const sadismIndicators: string[] = [];
  
  const sadismPatterns = [
    { pattern: /\b(enjoy|love|like) (watching|seeing) (them|him|her|people) (suffer|struggle|fail|hurt)/gi, weight: 4, indicator: 'Vicarious sadism' },
    { pattern: /\b(deserve|got what|should) (suffer|hurt|pain)/gi, weight: 3, indicator: 'Punitive satisfaction' },
    { pattern: /\b(crush|destroy|humiliate|devastate)/gi, weight: 2, indicator: 'Destructive language' },
    { pattern: /\b(make (them|him|her) pay|teach.*lesson)/gi, weight: 3, indicator: 'Revenge gratification' },
    { pattern: /\b(pathetic|worthless|disgusting)/gi, weight: 2, indicator: 'Degrading language' },
    { pattern: /\b(squirm|beg|grovel|crawl)/gi, weight: 3, indicator: 'Power-over-suffering imagery' },
  ];
  
  for (const { pattern, weight, indicator } of sadismPatterns) {
    const matches = allText.match(pattern);
    if (matches) {
      sadismScore += weight * matches.length;
      if (!sadismIndicators.includes(indicator)) {
        sadismIndicators.push(indicator);
      }
    }
  }
  
  // Normalize scores (0-100)
  const maxPossible = 30;
  narcissismScore = Math.min(100, (narcissismScore / maxPossible) * 100);
  machiavellianismScore = Math.min(100, (machiavellianismScore / maxPossible) * 100);
  psychopathyScore = Math.min(100, (psychopathyScore / maxPossible) * 100);
  sadismScore = Math.min(100, (sadismScore / maxPossible) * 100);
  
  // Calculate Dark Tetrad composite score
  const darkTetradScore = (narcissismScore + machiavellianismScore + psychopathyScore + sadismScore) / 4;
  const overallDarkness = darkTetradScore;
  
  // Determine dominant trait
  const traitScores = { narcissism: narcissismScore, machiavellianism: machiavellianismScore, psychopathy: psychopathyScore, sadism: sadismScore };
  const maxScore = Math.max(...Object.values(traitScores));
  const dominantTrait = maxScore < 20 ? 'balanced' : 
    (Object.entries(traitScores).find(([, score]) => score === maxScore)?.[0] as 'narcissism' | 'machiavellianism' | 'psychopathy' | 'sadism') || 'balanced';
  
  let riskLevel: DarkTetradAssessment['riskLevel'];
  if (overallDarkness < 15) riskLevel = 'low';
  else if (overallDarkness < 30) riskLevel = 'moderate';
  else if (overallDarkness < 50) riskLevel = 'elevated';
  else if (overallDarkness < 70) riskLevel = 'high';
  else if (overallDarkness < 85) riskLevel = 'extreme';
  else riskLevel = 'critical';
  
  return {
    narcissism: {
      score: narcissismScore,
      grandiose: narcissismScore * 0.5,
      vulnerable: narcissismScore * 0.3,
      communal: narcissismScore * 0.2,
      indicators: narcissismIndicators
    },
    machiavellianism: {
      score: machiavellianismScore,
      strategic: machiavellianismScore * 0.4,
      cynical: machiavellianismScore * 0.4,
      coalition: machiavellianismScore * 0.2,
      indicators: machiavellianismIndicators
    },
    psychopathy: {
      score: psychopathyScore,
      primary: psychopathyScore * 0.4,
      secondary: psychopathyScore * 0.3,
      fearless: psychopathyScore * 0.3,
      indicators: psychopathyIndicators
    },
    sadism: {
      score: sadismScore,
      vicarious: sadismScore * 0.4,
      direct: sadismScore * 0.35,
      verbal: sadismScore * 0.25,
      indicators: sadismIndicators
    },
    overallDarkness,
    darkTetradScore,
    riskLevel,
    dominantTrait
  };
}

/**
 * Identify manipulation techniques being used
 */
export function detectManipulation(
  text: string,
  context?: { relationship: string; recentEvents: string[] }
): { technique: ManipulationTechnique; confidence: number; evidence: string }[] {
  const detected: { technique: ManipulationTechnique; confidence: number; evidence: string }[] = [];
  
  for (const technique of MANIPULATION_TECHNIQUES) {
    for (const indicator of technique.indicators) {
      const pattern = new RegExp(indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const match = text.match(pattern);
      
      if (match) {
        const existing = detected.find(d => d.technique.id === technique.id);
        if (existing) {
          existing.confidence = Math.min(100, existing.confidence + 15);
        } else {
          detected.push({
            technique,
            confidence: 40,
            evidence: match[0]
          });
        }
      }
    }
  }
  
  return detected.filter(d => d.confidence >= 30).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Assess cognitive bias susceptibility
 */
export function assessBiasSusceptibility(
  personality: { openness: number; conscientiousness: number; neuroticism: number; agreeableness: number; extraversion: number },
  behavioralHistory: Array<{ decision: string; factors: string[] }>
): Map<string, CognitiveBias & { adjustedSusceptibility: number }> {
  const assessments = new Map<string, CognitiveBias & { adjustedSusceptibility: number }>();
  
  for (const bias of COGNITIVE_BIASES) {
    let adjustedSusceptibility = bias.susceptibility;
    
    // Adjust based on personality
    switch (bias.id) {
      case 'confirmation':
        // Low openness = higher confirmation bias
        adjustedSusceptibility += (50 - personality.openness) * 0.3;
        break;
      case 'authority':
        // Low openness + low conscientiousness = higher authority bias
        adjustedSusceptibility += (50 - personality.openness) * 0.2;
        adjustedSusceptibility += (50 - personality.conscientiousness) * 0.1;
        break;
      case 'bandwagon':
        // High extraversion + high agreeableness = higher bandwagon
        adjustedSusceptibility += (personality.extraversion - 50) * 0.3;
        adjustedSusceptibility += (personality.agreeableness - 50) * 0.2;
        break;
      case 'loss_aversion':
        // High neuroticism = higher loss aversion
        adjustedSusceptibility += (personality.neuroticism - 50) * 0.4;
        break;
      case 'availability':
        // High neuroticism = higher availability bias (fear-based recall)
        adjustedSusceptibility += (personality.neuroticism - 50) * 0.3;
        break;
    }
    
    adjustedSusceptibility = Math.max(0, Math.min(100, adjustedSusceptibility));
    
    assessments.set(bias.id, {
      ...bias,
      adjustedSusceptibility
    });
  }
  
  return assessments;
}

/**
 * Generate personalized exploitation playbook
 */
export function generateExploitationPlaybook(
  personality: { openness: number; conscientiousness: number; neuroticism: number; agreeableness: number; extraversion: number },
  darkTriad: DarkTriadAssessment,
  biases: Map<string, CognitiveBias & { adjustedSusceptibility: number }>
): {
  primaryStrategies: Array<{ name: string; description: string; effectiveness: number }>;
  openingMoves: string[];
  psychologicalLeveragePoints: string[];
  warningForUser: string;
} {
  const primaryStrategies: Array<{ name: string; description: string; effectiveness: number }> = [];
  const openingMoves: string[] = [];
  const leveragePoints: string[] = [];
  
  // High agreeableness exploitation
  if (personality.agreeableness > 60) {
    primaryStrategies.push({
      name: 'Reciprocity Trap',
      description: 'Give small favors first to create obligation. They will feel compelled to reciprocate.',
      effectiveness: 0.85 + (personality.agreeableness - 60) * 0.003
    });
    openingMoves.push('Start with a genuine compliment or small gift');
    leveragePoints.push('Strong need to maintain harmony');
    leveragePoints.push('Guilt susceptibility');
  }
  
  // High neuroticism exploitation
  if (personality.neuroticism > 60) {
    primaryStrategies.push({
      name: 'Fear-Based Motivation',
      description: 'Frame proposals in terms of avoiding losses and preventing negative outcomes.',
      effectiveness: 0.80 + (personality.neuroticism - 60) * 0.004
    });
    openingMoves.push('Express concern about a potential problem they face');
    leveragePoints.push('Anxiety triggers');
    leveragePoints.push('Need for certainty and security');
  }
  
  // Low conscientiousness exploitation
  if (personality.conscientiousness < 40) {
    primaryStrategies.push({
      name: 'Impulse Capture',
      description: 'Create urgency and make decisions easy. Remove friction from saying yes.',
      effectiveness: 0.75 + (40 - personality.conscientiousness) * 0.004
    });
    openingMoves.push('Present as simple, easy decision with immediate benefits');
    leveragePoints.push('Impulsive decision-making');
    leveragePoints.push('Preference for immediate gratification');
  }
  
  // High extraversion exploitation
  if (personality.extraversion > 60) {
    primaryStrategies.push({
      name: 'Social Validation',
      description: 'Use social proof heavily. Emphasize group consensus and popularity.',
      effectiveness: 0.80 + (personality.extraversion - 60) * 0.003
    });
    openingMoves.push('Mention mutual connections or group success stories');
    leveragePoints.push('Need for social approval');
    leveragePoints.push('FOMO susceptibility');
  }
  
  // Use top biases
  const topBiases = Array.from(biases.values())
    .sort((a, b) => b.adjustedSusceptibility - a.adjustedSusceptibility)
    .slice(0, 3);
  
  for (const bias of topBiases) {
    if (bias.adjustedSusceptibility > 70) {
      primaryStrategies.push({
        name: `Exploit ${bias.name}`,
        description: bias.exploitationMethod,
        effectiveness: bias.adjustedSusceptibility / 100
      });
      leveragePoints.push(`High susceptibility to ${bias.name}`);
    }
  }
  
  // Sort by effectiveness
  primaryStrategies.sort((a, b) => b.effectiveness - a.effectiveness);
  
  return {
    primaryStrategies: primaryStrategies.slice(0, 5),
    openingMoves: openingMoves.slice(0, 3),
    psychologicalLeveragePoints: leveragePoints.slice(0, 5),
    warningForUser: 'This analysis is for defensive awareness. Using these techniques unethically causes harm.'
  };
}

/**
 * Calculate influence resistance score
 */
export function calculateInfluenceResistance(
  personality: { openness: number; conscientiousness: number; neuroticism: number; agreeableness: number; extraversion: number },
  education: string,
  criticalThinkingScore: number
): InfluenceResistance {
  const byPrinciple: Record<string, number> = {};
  const weakPoints: string[] = [];
  const strengthPoints: string[] = [];
  
  // Calculate resistance to each principle
  
  // Reciprocity resistance
  byPrinciple.reciprocity = 50 + (100 - personality.agreeableness) * 0.3 + criticalThinkingScore * 0.2;
  if (byPrinciple.reciprocity < 40) weakPoints.push('Highly susceptible to reciprocity pressure');
  if (byPrinciple.reciprocity > 70) strengthPoints.push('Strong resistance to reciprocity manipulation');
  
  // Commitment/Consistency resistance
  byPrinciple.commitment = 50 + (100 - personality.conscientiousness) * 0.2 + personality.openness * 0.2;
  if (byPrinciple.commitment < 40) weakPoints.push('Overly bound by past commitments');
  if (byPrinciple.commitment > 70) strengthPoints.push('Flexible decision making');
  
  // Social Proof resistance
  byPrinciple.socialProof = 50 + (100 - personality.extraversion) * 0.3 + criticalThinkingScore * 0.2;
  if (byPrinciple.socialProof < 40) weakPoints.push('Easily swayed by crowd behavior');
  if (byPrinciple.socialProof > 70) strengthPoints.push('Independent thinker');
  
  // Authority resistance
  byPrinciple.authority = 50 + personality.openness * 0.3 + criticalThinkingScore * 0.2;
  if (byPrinciple.authority < 40) weakPoints.push('Too deferential to authority');
  if (byPrinciple.authority > 70) strengthPoints.push('Healthy skepticism of authority');
  
  // Liking resistance
  byPrinciple.liking = 50 + (100 - personality.agreeableness) * 0.3 + (100 - personality.extraversion) * 0.2;
  if (byPrinciple.liking < 40) weakPoints.push('Easily influenced by likeable people');
  if (byPrinciple.liking > 70) strengthPoints.push('Separates likeability from judgment');
  
  // Scarcity resistance
  byPrinciple.scarcity = 50 + (100 - personality.neuroticism) * 0.4 + criticalThinkingScore * 0.1;
  if (byPrinciple.scarcity < 40) weakPoints.push('Susceptible to urgency and scarcity tactics');
  if (byPrinciple.scarcity > 70) strengthPoints.push('Resistant to artificial urgency');
  
  // Unity resistance
  byPrinciple.unity = 50 + personality.openness * 0.2 + (100 - personality.agreeableness) * 0.2;
  if (byPrinciple.unity < 40) weakPoints.push('Strongly influenced by group identity');
  if (byPrinciple.unity > 70) strengthPoints.push('Maintains objectivity despite group identity');
  
  // Clamp all values
  for (const key of Object.keys(byPrinciple)) {
    byPrinciple[key] = Math.max(0, Math.min(100, byPrinciple[key]));
  }
  
  const overall = Object.values(byPrinciple).reduce((a, b) => a + b, 0) / Object.values(byPrinciple).length;
  
  return {
    overall,
    byPrinciple,
    weakPoints,
    strengthPoints
  };
}

export default {
  INFLUENCE_PRINCIPLES,
  COGNITIVE_BIASES,
  MANIPULATION_TECHNIQUES,
  assessDarkTriad,
  detectManipulation,
  assessBiasSusceptibility,
  generateExploitationPlaybook,
  calculateInfluenceResistance
};
