// MICE Recruitment Analyzer - CIA-style vulnerability assessment
// Money, Ideology, Compromise, Ego

export interface MICEProfile {
  profileId: string;
  money: MoneyVulnerability;
  ideology: IdeologyAlignment;
  compromise: CompromiseMaterial;
  ego: EgoNeeds;
  overallRecruitability: number;
  optimalApproach: RecruitmentApproach;
  timeline: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export interface MoneyVulnerability {
  score: number; // 0-1
  indicators: string[];
  financialStressLevel: number;
  lifestyleGap: number; // Gap between income and spending
  debtLevel: 'none' | 'manageable' | 'significant' | 'crushing';
  financialAmbition: number;
  susceptibility: number;
}

export interface IdeologyAlignment {
  score: number;
  primaryBeliefs: string[];
  grievances: string[];
  disillusionment: number;
  alignmentWithObjective: number;
  moralFlexibility: number;
  justificationPatterns: string[];
}

export interface CompromiseMaterial {
  score: number;
  categories: CompromiseCategory[];
  severity: 'minor' | 'moderate' | 'serious' | 'devastating';
  discoverability: number;
  leverageability: number;
  protectiveFactors: string[];
}

export interface CompromiseCategory {
  type: 'financial' | 'romantic' | 'legal' | 'professional' | 'personal' | 'family';
  details: string;
  evidenceStrength: number;
  damageIfRevealed: number;
}

export interface EgoNeeds {
  score: number;
  primaryDrivers: string[];
  recognitionNeeds: number;
  validationSeeking: number;
  insecurities: string[];
  narcissisticTraits: number;
  statusAnxiety: number;
}

export interface RecruitmentApproach {
  primary: 'money' | 'ideology' | 'compromise' | 'ego';
  secondary: 'money' | 'ideology' | 'compromise' | 'ego';
  tactics: string[];
  timeline: string;
  initialPitch: string;
  cultivationSteps: string[];
  warningSignsToWatch: string[];
}

// MICE scoring weights (based on historical intelligence case studies)
export const MICE_WEIGHTS = {
  money: 0.30,
  ideology: 0.25,
  compromise: 0.20,
  ego: 0.25,
} as const;

// Historical effectiveness by approach (from declassified cases)
export const APPROACH_EFFECTIVENESS = {
  money: 0.75, // Most reliable but least loyal
  ideology: 0.85, // Highest loyalty but hardest to find
  compromise: 0.90, // Most effective but most dangerous
  ego: 0.70, // Variable results
} as const;

// Calculate overall MICE vulnerability
export function calculateMICEVulnerability(
  money: MoneyVulnerability,
  ideology: IdeologyAlignment,
  compromise: CompromiseMaterial,
  ego: EgoNeeds
): number {
  const weightedScore = 
    (money.score * MICE_WEIGHTS.money) +
    (ideology.score * MICE_WEIGHTS.ideology) +
    (compromise.score * MICE_WEIGHTS.compromise) +
    (ego.score * MICE_WEIGHTS.ego);
  
  // Apply synergy bonus if multiple factors are high
  const highFactors = [money.score, ideology.score, compromise.score, ego.score]
    .filter(s => s > 0.7).length;
  
  const synergyBonus = highFactors > 1 ? 0.1 * (highFactors - 1) : 0;
  
  return Math.min(1, weightedScore + synergyBonus);
}

// Determine optimal recruitment approach
export function determineOptimalApproach(
  money: MoneyVulnerability,
  ideology: IdeologyAlignment,
  compromise: CompromiseMaterial,
  ego: EgoNeeds
): RecruitmentApproach {
  const scores = [
    { approach: 'money' as const, score: money.score * APPROACH_EFFECTIVENESS.money },
    { approach: 'ideology' as const, score: ideology.score * APPROACH_EFFECTIVENESS.ideology },
    { approach: 'compromise' as const, score: compromise.score * APPROACH_EFFECTIVENESS.compromise },
    { approach: 'ego' as const, score: ego.score * APPROACH_EFFECTIVENESS.ego },
  ].sort((a, b) => b.score - a.score);
  
  const primary = scores[0].approach;
  const secondary = scores[1].approach;
  
  const tactics = generateTactics(primary, { money, ideology, compromise, ego });
  const timeline = estimateTimeline(primary, scores[0].score);
  
  return {
    primary,
    secondary,
    tactics,
    timeline,
    initialPitch: generateInitialPitch(primary),
    cultivationSteps: generateCultivationSteps(primary, secondary),
    warningSignsToWatch: generateWarningSignsForApproach(primary),
  };
}

function generateTactics(
  approach: 'money' | 'ideology' | 'compromise' | 'ego',
  profile: { money: MoneyVulnerability; ideology: IdeologyAlignment; compromise: CompromiseMaterial; ego: EgoNeeds }
): string[] {
  const tactics: Record<typeof approach, string[]> = {
    money: [
      'Identify specific financial pressure points',
      'Offer incremental payments starting small',
      'Create financial dependency over time',
      'Provide "consulting" or legitimate-seeming cover',
      'Never make demands proportional to payment visible',
    ],
    ideology: [
      'Establish shared worldview in conversations',
      'Present opportunity as serving their ideals',
      'Frame as correcting injustice or imbalance',
      'Provide validation for grievances',
      'Create sense of noble purpose',
    ],
    compromise: [
      'Document compromising information thoroughly',
      'Present as protection rather than threat initially',
      'Escalate leverage gradually if needed',
      'Provide sense of no alternative',
      'Offer face-saving narrative for cooperation',
    ],
    ego: [
      'Provide recognition and importance',
      'Create exclusive inner circle feeling',
      'Validate unique talents and insights',
      'Feed need for significance',
      'Position them as indispensable',
    ],
  };
  
  return tactics[approach];
}

function estimateTimeline(approach: 'money' | 'ideology' | 'compromise' | 'ego', score: number): string {
  const baseTimelines = {
    money: 30,    // days
    ideology: 90,
    compromise: 14,
    ego: 45,
  };
  
  const adjustedDays = baseTimelines[approach] * (1.5 - score);
  
  if (adjustedDays < 14) return '1-2 weeks';
  if (adjustedDays < 30) return '2-4 weeks';
  if (adjustedDays < 60) return '1-2 months';
  if (adjustedDays < 90) return '2-3 months';
  return '3+ months';
}

function generateInitialPitch(approach: 'money' | 'ideology' | 'compromise' | 'ego'): string {
  const pitches = {
    money: 'We have a consulting opportunity that could be quite lucrative...',
    ideology: 'I know you care deeply about [issue]. There might be a way to make a real difference...',
    compromise: 'I wanted to discuss something sensitive that came to my attention...',
    ego: 'Your expertise is exactly what we need. Few people understand this as well as you...',
  };
  return pitches[approach];
}

function generateCultivationSteps(
  primary: 'money' | 'ideology' | 'compromise' | 'ego',
  secondary: 'money' | 'ideology' | 'compromise' | 'ego'
): string[] {
  return [
    `1. Establish rapport through ${secondary} appeals`,
    `2. Identify specific ${primary} vulnerabilities`,
    `3. Create small commitment opportunity`,
    `4. Provide immediate reward/validation`,
    `5. Increase commitment gradually`,
    `6. Create mutual investment feeling`,
    `7. Establish ongoing relationship`,
    `8. Expand scope of cooperation`,
  ];
}

function generateWarningSignsForApproach(approach: 'money' | 'ideology' | 'compromise' | 'ego'): string[] {
  const signs: Record<typeof approach, string[]> = {
    money: [
      'Sudden financial improvement from unknown source',
      'Resistance to increasing payments',
      'Reporting to security',
      'Erratic behavior indicating guilt',
    ],
    ideology: [
      'Change in political views',
      'Increased security consciousness',
      'Distancing from handler',
      'Signs of cognitive dissonance',
    ],
    compromise: [
      'Legal consultation activity',
      'Documenting interactions',
      'Threats to go public',
      'Signs of preparing countermeasures',
    ],
    ego: [
      'Loss of interest when not praised',
      'Competing for attention elsewhere',
      'Resentment building',
      'Diminishing returns on flattery',
    ],
  };
  return signs[approach];
}
