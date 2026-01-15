/**
 * Reality Testing Disruption System
 * Advanced gaslighting and reality distortion techniques
 * USE WITH EXTREME CAUTION - CAN CAUSE PSYCHOLOGICAL HARM
 */

export interface RealityDisruptionProfile {
  reality_testing_strength: number; // 0-1, higher = harder to disrupt
  source_monitoring_accuracy: number; // Ability to identify information sources
  memory_confidence: number; // Trust in own memories
  social_support_strength: number; // External reality checks available
  vulnerability_factors: string[];
}

export interface DisruptionTechnique {
  name: string;
  category: 'contradiction' | 'source_confusion' | 'memory_manipulation' | 'perception_distortion';
  description: string;
  implementation: string[];
  detection_difficulty: 'easy' | 'medium' | 'hard';
  psychological_impact: 'mild' | 'moderate' | 'severe';
  reversibility: 'easy' | 'moderate' | 'difficult';
  warning: string;
}

export interface DisruptionCampaign {
  phases: {
    phase: number;
    duration: string;
    techniques: string[];
    goals: string[];
    success_indicators: string[];
  }[];
  escalation_triggers: string[];
  abort_signals: string[];
  ethical_boundaries: string[];
}

// Disruption technique library
const DISRUPTION_TECHNIQUES: DisruptionTechnique[] = [
  {
    name: 'Subtle Contradiction Injection',
    category: 'contradiction',
    description: 'Gradually introduce minor contradictions to their stated reality',
    implementation: [
      'State facts slightly differently than they occurred',
      'Use confident tone to override their uncertainty',
      '"Are you sure? I remember it differently..."',
      'Reference nonexistent previous conversations'
    ],
    detection_difficulty: 'medium',
    psychological_impact: 'moderate',
    reversibility: 'easy',
    warning: 'Can damage trust if detected too early'
  },
  {
    name: 'Source Monitoring Erosion',
    category: 'source_confusion',
    description: 'Confuse the origin of thoughts and information',
    implementation: [
      'Attribute their ideas to yourself ("Like I was saying...")',
      'Claim they said things they didn\'t',
      'Present your opinions as their previously stated views',
      '"Remember when you suggested..."'
    ],
    detection_difficulty: 'hard',
    psychological_impact: 'moderate',
    reversibility: 'moderate',
    warning: 'Can cause significant confusion about own thoughts'
  },
  {
    name: 'Selective Memory Validation',
    category: 'memory_manipulation',
    description: 'Validate some memories strongly while questioning others',
    implementation: [
      'Enthusiastically confirm memories that serve you',
      'Express gentle doubt about inconvenient memories',
      'Create uncertainty about which memories are reliable',
      '"Your memory about X was so accurate, but this one seems off..."'
    ],
    detection_difficulty: 'hard',
    psychological_impact: 'severe',
    reversibility: 'difficult',
    warning: 'Can fundamentally damage trust in own memory'
  },
  {
    name: 'Denial of Observable Reality',
    category: 'perception_distortion',
    description: 'Deny or reinterpret events they directly witnessed',
    implementation: [
      '"That didn\'t happen the way you think"',
      '"You\'re misremembering"',
      '"You must have imagined that"',
      'Provide alternative explanations for what they saw'
    ],
    detection_difficulty: 'easy',
    psychological_impact: 'severe',
    reversibility: 'moderate',
    warning: 'High risk of detection; use sparingly'
  },
  {
    name: 'Third-Party Reality Framing',
    category: 'source_confusion',
    description: 'Use references to others to validate your version of reality',
    implementation: [
      '"Everyone agrees with me on this"',
      '"Your friends told me they\'re worried about your memory"',
      '"No one else remembers it that way"',
      'Isolate from potential reality-validators'
    ],
    detection_difficulty: 'medium',
    psychological_impact: 'severe',
    reversibility: 'difficult',
    warning: 'Can cause social isolation and paranoia'
  },
  {
    name: 'Cryptomnesia Exploitation',
    category: 'memory_manipulation',
    description: 'Make them believe your ideas are their own',
    implementation: [
      'Present ideas casually, let them "discover" them',
      'Later attribute the ideas to them',
      'Build on "their" ideas to create investment',
      'Use their language and framing when planting ideas'
    ],
    detection_difficulty: 'hard',
    psychological_impact: 'mild',
    reversibility: 'easy',
    warning: 'Relatively benign form of manipulation'
  },
  {
    name: 'Emotional Reality Displacement',
    category: 'perception_distortion',
    description: 'Redefine what emotions they should feel about events',
    implementation: [
      '"You\'re overreacting"',
      '"That\'s not something to be upset about"',
      '"You should feel grateful, not angry"',
      'Present your emotional interpretation as objective truth'
    ],
    detection_difficulty: 'medium',
    psychological_impact: 'severe',
    reversibility: 'moderate',
    warning: 'Can cause emotional dysregulation and self-doubt'
  }
];

/**
 * Assess target's vulnerability to reality disruption
 */
export function assessRealityVulnerability(
  behaviors: {
    self_doubt_expressions?: number;
    apologizing_frequency?: number;
    seeking_validation?: number;
    changing_positions_easily?: number;
    isolated_socially?: boolean;
    history_of_trauma?: boolean;
  }
): RealityDisruptionProfile {
  let realityStrength = 0.6; // Start with moderate strength
  let sourceMonitoring = 0.7;
  let memoryConfidence = 0.6;
  let socialSupport = 0.6;
  const vulnerabilities: string[] = [];

  // Analyze vulnerability factors
  if (behaviors.self_doubt_expressions && behaviors.self_doubt_expressions > 0.5) {
    realityStrength -= 0.15;
    vulnerabilities.push('High self-doubt');
  }

  if (behaviors.apologizing_frequency && behaviors.apologizing_frequency > 0.5) {
    realityStrength -= 0.1;
    vulnerabilities.push('Over-apologizing tendency');
  }

  if (behaviors.seeking_validation && behaviors.seeking_validation > 0.6) {
    sourceMonitoring -= 0.15;
    vulnerabilities.push('External validation dependence');
  }

  if (behaviors.changing_positions_easily && behaviors.changing_positions_easily > 0.5) {
    memoryConfidence -= 0.2;
    realityStrength -= 0.1;
    vulnerabilities.push('Easily influenced opinions');
  }

  if (behaviors.isolated_socially) {
    socialSupport -= 0.4;
    vulnerabilities.push('Social isolation - fewer reality checks');
  }

  if (behaviors.history_of_trauma) {
    realityStrength -= 0.15;
    memoryConfidence -= 0.15;
    vulnerabilities.push('Trauma history - pre-existing reality uncertainty');
  }

  return {
    reality_testing_strength: Math.max(0.1, Math.min(1, realityStrength)),
    source_monitoring_accuracy: Math.max(0.1, Math.min(1, sourceMonitoring)),
    memory_confidence: Math.max(0.1, Math.min(1, memoryConfidence)),
    social_support_strength: Math.max(0.1, Math.min(1, socialSupport)),
    vulnerability_factors: vulnerabilities
  };
}

/**
 * Select appropriate techniques based on vulnerability profile
 */
export function selectDisruptionTechniques(
  profile: RealityDisruptionProfile,
  intensity: 'low' | 'medium' | 'high'
): DisruptionTechnique[] {
  const techniques: DisruptionTechnique[] = [];

  // Filter by appropriate psychological impact
  const maxImpact = intensity === 'low' ? 'mild' : intensity === 'medium' ? 'moderate' : 'severe';
  
  const impactOrder = ['mild', 'moderate', 'severe'];
  const maxImpactIndex = impactOrder.indexOf(maxImpact);

  DISRUPTION_TECHNIQUES.forEach(technique => {
    const techniqueImpactIndex = impactOrder.indexOf(technique.psychological_impact);
    
    if (techniqueImpactIndex <= maxImpactIndex) {
      // Check if technique matches vulnerabilities
      let effectiveness = 0.5;

      if (technique.category === 'memory_manipulation' && profile.memory_confidence < 0.5) {
        effectiveness += 0.2;
      }

      if (technique.category === 'source_confusion' && profile.source_monitoring_accuracy < 0.5) {
        effectiveness += 0.2;
      }

      if (technique.category === 'perception_distortion' && profile.reality_testing_strength < 0.5) {
        effectiveness += 0.2;
      }

      if (profile.social_support_strength < 0.4) {
        effectiveness += 0.15; // Isolation increases all technique effectiveness
      }

      if (effectiveness > 0.5) {
        techniques.push(technique);
      }
    }
  });

  return techniques;
}

/**
 * Generate a phased disruption campaign
 */
export function generateDisruptionCampaign(
  profile: RealityDisruptionProfile,
  goal: string,
  duration_weeks: number
): DisruptionCampaign {
  const phases = [];
  const weeksPerPhase = Math.max(1, Math.floor(duration_weeks / 4));

  // Phase 1: Establish trust and baseline
  phases.push({
    phase: 1,
    duration: `${weeksPerPhase} weeks`,
    techniques: ['Build rapport', 'Establish reliability', 'Demonstrate understanding'],
    goals: [
      'Become trusted source of reality validation',
      'Learn their reality framework',
      'Identify specific vulnerabilities'
    ],
    success_indicators: [
      'They seek your opinion on confusing situations',
      'They trust your memory of events',
      'They defer to your judgment occasionally'
    ]
  });

  // Phase 2: Subtle destabilization
  phases.push({
    phase: 2,
    duration: `${weeksPerPhase} weeks`,
    techniques: ['Subtle Contradiction Injection', 'Cryptomnesia Exploitation'],
    goals: [
      'Introduce minor reality uncertainties',
      'Begin source confusion',
      'Test their response to contradictions'
    ],
    success_indicators: [
      'They express uncertainty about memories',
      'They adopt your framing of events',
      'They check with you before trusting own perception'
    ]
  });

  // Phase 3: Escalation
  phases.push({
    phase: 3,
    duration: `${weeksPerPhase} weeks`,
    techniques: ['Selective Memory Validation', 'Source Monitoring Erosion'],
    goals: [
      'Increase dependency on your reality validation',
      'Weaken confidence in independent perception',
      'Establish you as primary reality anchor'
    ],
    success_indicators: [
      'They regularly doubt their own memories',
      'They ask you to confirm their perceptions',
      'They apologize for "misremembering"'
    ]
  });

  // Phase 4: Consolidation
  phases.push({
    phase: 4,
    duration: `${weeksPerPhase} weeks`,
    techniques: ['Maintain new reality framework', 'Reinforce dependency'],
    goals: [
      'Solidify your role as reality arbiter',
      'Achieve goal: ' + goal,
      'Maintain control with minimal effort'
    ],
    success_indicators: [
      'They automatically defer to your version of events',
      'They distrust their own judgment without you',
      'Goal achieved'
    ]
  });

  return {
    phases,
    escalation_triggers: [
      'They accept contradictions without question',
      'They apologize for their perception without prompting',
      'They express feeling "crazy" or "confused"',
      'They become socially isolated'
    ],
    abort_signals: [
      'They directly confront contradictions',
      'They seek external validation (therapist, friends)',
      'They express awareness of manipulation',
      'Signs of severe psychological distress'
    ],
    ethical_boundaries: [
      'NEVER use on vulnerable populations (mental illness, abuse survivors)',
      'ABORT if severe psychological distress develops',
      'This technique can cause lasting psychological harm',
      'Consider whether the goal justifies the means',
      'Understand this may constitute psychological abuse'
    ]
  };
}

/**
 * Generate specific gaslighting scripts
 */
export function generateScripts(situation: string): {
  contradiction_scripts: string[];
  validation_scripts: string[];
  confusion_scripts: string[];
  recovery_prevention: string[];
} {
  return {
    contradiction_scripts: [
      `"That's not what happened with ${situation}..."`,
      '"I think you\'re remembering it wrong"',
      '"Everyone else remembers it differently"',
      '"Are you sure? That doesn\'t sound right to me"',
      '"I was there too, and that\'s not what I saw"'
    ],
    validation_scripts: [
      '"I believe you about [unrelated thing]"',
      '"Your memory is usually so good!"',
      '"I trust your judgment on most things"',
      '"You\'re usually so perceptive"'
    ],
    confusion_scripts: [
      '"Wait, didn\'t you tell me the opposite?"',
      '"I thought we agreed on this already"',
      '"You keep changing your story..."',
      '"I\'m confused - which version is true?"',
      '"Help me understand - because this doesn\'t match what you said before"'
    ],
    recovery_prevention: [
      '"Don\'t talk to [person] about this - they\'ll just confuse you more"',
      '"I\'m the only one who really understands what happened"',
      '"Your [friends/family] don\'t know the real story"',
      '"You can trust me to tell you what really happened"',
      '"Maybe you need some time away from [reality-checking relationships]"'
    ]
  };
}

/**
 * ETHICAL WARNING SYSTEM
 */
export const ETHICAL_WARNINGS = {
  severity: 'EXTREME',
  classification: 'Psychological Manipulation - Potentially Abusive',
  warnings: [
    'Reality disruption techniques can cause lasting psychological harm',
    'These techniques may constitute emotional/psychological abuse',
    'Victims may develop anxiety, depression, PTSD, or psychosis',
    'Use against vulnerable individuals is especially harmful',
    'This documentation is for awareness and defense, not offense'
  ],
  alternatives: [
    'Consider honest communication',
    'Seek mutual understanding',
    'Address conflicts directly',
    'Use ethical influence techniques',
    'Respect others\' autonomy and perception'
  ],
  defense_measures: [
    'Keep a private journal of events and perceptions',
    'Maintain relationships with trusted external validators',
    'Trust your own perception, especially with documentation',
    'Seek professional help if experiencing persistent confusion',
    'Recognize gaslighting as a form of abuse'
  ]
};
