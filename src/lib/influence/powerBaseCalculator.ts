/**
 * Power Base Calculator
 * Implements French-Raven Power Bases theory for influence analysis
 */

export interface PowerBaseScores {
  coercive: number;      // Ability to punish
  reward: number;        // Ability to reward
  legitimate: number;    // Formal authority
  expert: number;        // Knowledge/skill
  referent: number;      // Likeability/admiration
  informational: number; // Control of information
}

export interface PowerAssessment {
  scores: PowerBaseScores;
  totalPower: number;
  dominantBase: keyof PowerBaseScores;
  weakestBase: keyof PowerBaseScores;
  leveragePoints: LeveragePoint[];
  recommendations: string[];
  powerDynamic: 'advantage' | 'disadvantage' | 'balanced';
}

export interface LeveragePoint {
  type: keyof PowerBaseScores;
  description: string;
  exploitability: 'low' | 'medium' | 'high';
  approach: string;
}

export interface PowerIndicators {
  // Coercive indicators
  hasAuthorityToFire?: boolean;
  controlsResources?: boolean;
  canWithhold?: boolean;
  hasLegalPower?: boolean;
  
  // Reward indicators
  controlsBudget?: boolean;
  canPromote?: boolean;
  hasNetworkAccess?: boolean;
  canGiveOpportunities?: boolean;
  
  // Legitimate indicators
  formalTitle?: string;
  organizationalPosition?: 'senior' | 'peer' | 'junior';
  socialStatus?: 'high' | 'medium' | 'low';
  credentialsLevel?: 'high' | 'medium' | 'low';
  
  // Expert indicators
  uniqueSkills?: string[];
  educationLevel?: string;
  experienceYears?: number;
  industryReputation?: 'high' | 'medium' | 'low';
  
  // Referent indicators
  likeabilityScore?: number;
  charisma?: 'high' | 'medium' | 'low';
  socialConnections?: number;
  admirationLevel?: 'high' | 'medium' | 'low';
  
  // Informational indicators
  hasExclusiveInfo?: boolean;
  informationGatekeeping?: boolean;
  intelligenceNetwork?: boolean;
  dataAccessLevel?: 'full' | 'partial' | 'limited';
}

/**
 * Calculate power base scores from indicators
 */
export function calculatePowerBases(indicators: PowerIndicators): PowerBaseScores {
  const scores: PowerBaseScores = {
    coercive: 0,
    reward: 0,
    legitimate: 0,
    expert: 0,
    referent: 0,
    informational: 0
  };
  
  // Coercive power
  if (indicators.hasAuthorityToFire) scores.coercive += 0.3;
  if (indicators.controlsResources) scores.coercive += 0.25;
  if (indicators.canWithhold) scores.coercive += 0.25;
  if (indicators.hasLegalPower) scores.coercive += 0.2;
  
  // Reward power
  if (indicators.controlsBudget) scores.reward += 0.3;
  if (indicators.canPromote) scores.reward += 0.3;
  if (indicators.hasNetworkAccess) scores.reward += 0.2;
  if (indicators.canGiveOpportunities) scores.reward += 0.2;
  
  // Legitimate power
  if (indicators.organizationalPosition === 'senior') scores.legitimate += 0.35;
  else if (indicators.organizationalPosition === 'peer') scores.legitimate += 0.15;
  if (indicators.socialStatus === 'high') scores.legitimate += 0.25;
  else if (indicators.socialStatus === 'medium') scores.legitimate += 0.1;
  if (indicators.credentialsLevel === 'high') scores.legitimate += 0.25;
  else if (indicators.credentialsLevel === 'medium') scores.legitimate += 0.1;
  if (indicators.formalTitle) scores.legitimate += 0.15;
  
  // Expert power
  if (indicators.uniqueSkills && indicators.uniqueSkills.length > 0) {
    scores.expert += Math.min(0.3, indicators.uniqueSkills.length * 0.1);
  }
  if (indicators.experienceYears) {
    scores.expert += Math.min(0.25, indicators.experienceYears * 0.02);
  }
  if (indicators.industryReputation === 'high') scores.expert += 0.3;
  else if (indicators.industryReputation === 'medium') scores.expert += 0.15;
  if (indicators.educationLevel) scores.expert += 0.15;
  
  // Referent power
  if (indicators.likeabilityScore !== undefined) {
    scores.referent += indicators.likeabilityScore * 0.3;
  }
  if (indicators.charisma === 'high') scores.referent += 0.25;
  else if (indicators.charisma === 'medium') scores.referent += 0.1;
  if (indicators.socialConnections) {
    scores.referent += Math.min(0.25, indicators.socialConnections * 0.005);
  }
  if (indicators.admirationLevel === 'high') scores.referent += 0.2;
  else if (indicators.admirationLevel === 'medium') scores.referent += 0.1;
  
  // Informational power
  if (indicators.hasExclusiveInfo) scores.informational += 0.35;
  if (indicators.informationGatekeeping) scores.informational += 0.25;
  if (indicators.intelligenceNetwork) scores.informational += 0.2;
  if (indicators.dataAccessLevel === 'full') scores.informational += 0.2;
  else if (indicators.dataAccessLevel === 'partial') scores.informational += 0.1;
  
  // Normalize all scores to 0-1
  Object.keys(scores).forEach(key => {
    scores[key as keyof PowerBaseScores] = Math.min(1, Math.max(0, scores[key as keyof PowerBaseScores]));
  });
  
  return scores;
}

/**
 * Generate leverage points based on power gaps
 */
export function identifyLeveragePoints(
  yourScores: PowerBaseScores,
  theirScores: PowerBaseScores
): LeveragePoint[] {
  const leveragePoints: LeveragePoint[] = [];
  
  // Find areas where you have advantage
  Object.entries(yourScores).forEach(([base, score]) => {
    const theirScore = theirScores[base as keyof PowerBaseScores];
    const gap = score - theirScore;
    
    if (gap > 0.2) {
      leveragePoints.push({
        type: base as keyof PowerBaseScores,
        description: `You have ${(gap * 100).toFixed(0)}% advantage in ${base} power`,
        exploitability: gap > 0.4 ? 'high' : gap > 0.3 ? 'medium' : 'low',
        approach: getLeverageApproach(base as keyof PowerBaseScores, 'advantage')
      });
    }
  });
  
  // Find their vulnerabilities (their weak spots)
  Object.entries(theirScores).forEach(([base, score]) => {
    if (score < 0.3) {
      leveragePoints.push({
        type: base as keyof PowerBaseScores,
        description: `They are weak in ${base} power (${(score * 100).toFixed(0)}%)`,
        exploitability: score < 0.15 ? 'high' : 'medium',
        approach: getLeverageApproach(base as keyof PowerBaseScores, 'exploit')
      });
    }
  });
  
  return leveragePoints.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.exploitability] - order[b.exploitability];
  });
}

function getLeverageApproach(base: keyof PowerBaseScores, mode: 'advantage' | 'exploit'): string {
  const approaches: Record<keyof PowerBaseScores, { advantage: string; exploit: string }> = {
    coercive: {
      advantage: 'Use your punitive power sparingly but make it known - implied threat is often more effective than actual use',
      exploit: 'They cannot threaten you effectively - be bold in your asks and negotiations'
    },
    reward: {
      advantage: 'Dangle rewards to shape their behavior, use intermittent reinforcement for maximum effect',
      exploit: 'They cannot offer you much - look for alternative sources of rewards to reduce their leverage'
    },
    legitimate: {
      advantage: 'Invoke your position and authority when needed, use titles and formal channels',
      exploit: 'Challenge their authority subtly, question processes, suggest "better ways"'
    },
    expert: {
      advantage: 'Position yourself as the knowledge source, make them depend on your expertise',
      exploit: 'They need your knowledge or skills - make yourself indispensable'
    },
    referent: {
      advantage: 'Use your likability to persuade, people say yes to those they like',
      exploit: 'Build rapport to compensate for their lack - become someone they want to please'
    },
    informational: {
      advantage: 'Control information flow, share strategically, create information asymmetry',
      exploit: 'They don\'t know what you know - use information as currency'
    }
  };
  
  return approaches[base][mode];
}

/**
 * Full power assessment with recommendations
 */
export function assessPowerDynamic(
  yourIndicators: PowerIndicators,
  theirIndicators: PowerIndicators
): PowerAssessment {
  const yourScores = calculatePowerBases(yourIndicators);
  const theirScores = calculatePowerBases(theirIndicators);
  
  const yourTotal = Object.values(yourScores).reduce((a, b) => a + b, 0) / 6;
  const theirTotal = Object.values(theirScores).reduce((a, b) => a + b, 0) / 6;
  
  // Find dominant and weakest bases
  const entries = Object.entries(yourScores) as [keyof PowerBaseScores, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominantBase = entries[0][0];
  const weakestBase = entries[entries.length - 1][0];
  
  const leveragePoints = identifyLeveragePoints(yourScores, theirScores);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (yourTotal > theirTotal + 0.15) {
    recommendations.push('You hold overall power advantage - press for favorable terms');
    recommendations.push(`Lead with your ${dominantBase} power to maximize impact`);
  } else if (theirTotal > yourTotal + 0.15) {
    recommendations.push('They hold power advantage - use guerrilla tactics and build coalitions');
    recommendations.push(`Build up your ${weakestBase} power to close the gap`);
  } else {
    recommendations.push('Power is balanced - focus on negotiation and mutual benefit framing');
    recommendations.push('Small advantages will be decisive - exploit any leverage points');
  }
  
  if (leveragePoints.length > 0) {
    recommendations.push(`Primary leverage: ${leveragePoints[0].approach}`);
  }
  
  return {
    scores: yourScores,
    totalPower: yourTotal,
    dominantBase,
    weakestBase,
    leveragePoints,
    recommendations,
    powerDynamic: yourTotal > theirTotal + 0.15 ? 'advantage' : 
                  theirTotal > yourTotal + 0.15 ? 'disadvantage' : 'balanced'
  };
}

/**
 * Calculate relative power score between you and target
 */
export function calculateRelativePower(
  yourScores: PowerBaseScores,
  theirScores: PowerBaseScores
): number {
  const yourTotal = Object.values(yourScores).reduce((a, b) => a + b, 0);
  const theirTotal = Object.values(theirScores).reduce((a, b) => a + b, 0);
  
  if (theirTotal === 0) return 1;
  
  // Returns 0-1 where 0.5 is balanced, >0.5 is advantage, <0.5 is disadvantage
  return yourTotal / (yourTotal + theirTotal);
}

/**
 * Generate power building strategy
 */
export function generatePowerBuildingStrategy(
  currentScores: PowerBaseScores,
  targetBase: keyof PowerBaseScores
): string[] {
  const strategies: Record<keyof PowerBaseScores, string[]> = {
    coercive: [
      'Acquire control over resources others need',
      'Build relationships with those who have punitive power',
      'Document everything for potential leverage',
      'Position yourself as gatekeeper to opportunities'
    ],
    reward: [
      'Control access to desirable resources or opportunities',
      'Build a network of people who owe you favors',
      'Become the go-to person for introductions',
      'Accumulate resources you can distribute'
    ],
    legitimate: [
      'Seek formal titles and positions',
      'Get credentials and certifications',
      'Align yourself with authority figures',
      'Create or join committees with decision power'
    ],
    expert: [
      'Develop rare and valuable skills',
      'Become known as the expert in a niche area',
      'Publish or speak to establish thought leadership',
      'Solve visible problems that others cannot'
    ],
    referent: [
      'Genuinely help others without expectation',
      'Be consistent and reliable',
      'Show vulnerability appropriately',
      'Find common ground and shared values'
    ],
    informational: [
      'Build an intelligence network',
      'Position yourself at information crossroads',
      'Be the first to know important news',
      'Trade information strategically'
    ]
  };
  
  return strategies[targetBase];
}
