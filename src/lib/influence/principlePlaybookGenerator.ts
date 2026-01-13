/**
 * Cialdini Principle Playbook Generator
 * 
 * Generates automated influence playbooks based on Cialdini's 7 principles
 * of persuasion, tailored to individual contact profiles.
 */

import { OceanProfile } from '../personality/oceanExtractor';

// Cialdini's 7 Principles of Persuasion
export type CialdiniPrinciple = 
  | 'reciprocity'
  | 'commitment'
  | 'social_proof'
  | 'authority'
  | 'liking'
  | 'scarcity'
  | 'unity';

export interface PlaybookStep {
  stepNumber: number;
  action: string;
  script?: string;
  timing: string;
  channel: 'text' | 'call' | 'email' | 'in_person' | 'social_media';
  expectedOutcome: string;
  fallbackAction?: string;
  notes: string[];
}

export interface InfluencePlaybook {
  principle: CialdiniPrinciple;
  targetObjective: string;
  estimatedSuccessRate: number;
  totalDuration: string;
  steps: PlaybookStep[];
  warningSignals: string[];
  adaptationTriggers: string[];
  exitConditions: string[];
}

export interface ContactContext {
  name: string;
  personality?: OceanProfile;
  relationshipStrength: number;  // 0-1
  previousInteractions: number;
  knownInterests: string[];
  knownPainPoints: string[];
  communicationPreference: 'text' | 'call' | 'email' | 'in_person';
  timezone?: string;
  bestContactTimes?: string[];
}

// Principle templates
const PRINCIPLE_TEMPLATES: Record<CialdiniPrinciple, {
  description: string;
  keyMechanism: string;
  idealPersonality: Partial<Record<keyof OceanProfile, 'high' | 'low'>>;
  baseSteps: Omit<PlaybookStep, 'stepNumber'>[];
}> = {
  reciprocity: {
    description: 'Give something of value first to create obligation',
    keyMechanism: 'People feel obligated to return favors',
    idealPersonality: { agreeableness: 'high', conscientiousness: 'high' },
    baseSteps: [
      {
        action: 'Identify valuable gift/favor',
        script: undefined,
        timing: 'Day 1',
        channel: 'in_person',
        expectedOutcome: 'Establish what you can give that has perceived value',
        notes: ['Should be unexpected', 'Personalized > generic', 'Not too large to seem manipulative']
      },
      {
        action: 'Deliver gift/favor without any ask',
        script: 'Hey [NAME], I came across this [ITEM/OPPORTUNITY] and immediately thought of you. No strings attached, just wanted to share.',
        timing: 'Day 2-3',
        channel: 'text',
        expectedOutcome: 'Recipient feels valued and subtly indebted',
        notes: ['Emphasize it was natural', 'Do NOT mention any future ask', 'Let them express gratitude']
      },
      {
        action: 'Allow incubation period',
        script: undefined,
        timing: 'Day 4-10',
        channel: 'text',
        expectedOutcome: 'Obligation crystallizes, relationship strengthens',
        notes: ['Light casual contact okay', 'No requests', 'Let them initiate if possible']
      },
      {
        action: 'Make your request (reciprocity-framed)',
        script: 'Hey [NAME], hope you\'re doing well! Quick question - I\'m working on [OBJECTIVE] and thought you might be able to help. Would you be open to [SPECIFIC ASK]?',
        timing: 'Day 11-14',
        channel: 'text',
        expectedOutcome: 'Higher compliance rate due to reciprocity obligation',
        fallbackAction: 'If declined, reduce ask size and try again',
        notes: ['Keep ask proportional to gift', 'Don\'t explicitly reference the gift', 'Make it easy to say yes']
      }
    ]
  },
  
  commitment: {
    description: 'Get small commitments that escalate to larger ones',
    keyMechanism: 'People strive for consistency with past behavior',
    idealPersonality: { conscientiousness: 'high', neuroticism: 'low' },
    baseSteps: [
      {
        action: 'Secure micro-commitment',
        script: 'Do you think [BROAD PRINCIPLE] is important?',
        timing: 'Day 1',
        channel: 'text',
        expectedOutcome: 'Easy "yes" that establishes position',
        notes: ['Ask something they can\'t disagree with', 'Get verbal/written commitment', 'Reference their values']
      },
      {
        action: 'Reference commitment, introduce next level',
        script: 'You mentioned you believe in [PRINCIPLE]. I\'m curious - would you be willing to [SMALL ACTION] that aligns with that?',
        timing: 'Day 3-5',
        channel: 'text',
        expectedOutcome: 'Slightly larger commitment accepted',
        notes: ['Explicitly connect to previous statement', 'Keep new ask small', 'Frame as consistency']
      },
      {
        action: 'Make commitment public',
        script: 'That\'s great that you [PREVIOUS ACTION]. Would you mind if I shared that with [GROUP/PLATFORM]?',
        timing: 'Day 7-10',
        channel: 'in_person',
        expectedOutcome: 'Public commitment strengthens binding',
        notes: ['Public commitments are stronger', 'Social identity becomes tied to position', 'Harder to back out']
      },
      {
        action: 'Deploy target ask (consistency-framed)',
        script: 'Given your commitment to [PRINCIPLE] and the fact that you\'ve already [PREVIOUS ACTIONS], I think you\'d be perfect for [MAIN OBJECTIVE]. What do you think?',
        timing: 'Day 14-21',
        channel: 'call',
        expectedOutcome: 'Target accepts to maintain consistency',
        fallbackAction: 'Highlight cognitive dissonance if they decline',
        notes: ['Create clear logical chain', 'Declining = inconsistency', 'Give them a way to say yes gracefully']
      }
    ]
  },
  
  social_proof: {
    description: 'Show that others are doing/supporting the same thing',
    keyMechanism: 'People follow the actions of similar others',
    idealPersonality: { extraversion: 'high', agreeableness: 'high' },
    baseSteps: [
      {
        action: 'Gather social proof evidence',
        script: undefined,
        timing: 'Day 1-3',
        channel: 'text',
        expectedOutcome: 'Compile testimonials, numbers, endorsements',
        notes: ['Similar people > different people', 'Recent > old', 'Specific numbers > vague claims']
      },
      {
        action: 'Casually introduce social proof',
        script: 'By the way, [MUTUAL CONNECTION] just [RELEVANT ACTION]. They said it was really [POSITIVE OUTCOME].',
        timing: 'Day 4-5',
        channel: 'text',
        expectedOutcome: 'Plant seed of social validation',
        notes: ['Name-drop strategically', 'Use people they respect', 'Keep it natural']
      },
      {
        action: 'Amplify social proof',
        script: 'Interesting - I\'ve been hearing from a lot of people that [TREND]. [SPECIFIC NAMES] just joined. It seems like everyone is [DOING THE THING].',
        timing: 'Day 7-10',
        channel: 'in_person',
        expectedOutcome: 'Create bandwagon perception',
        notes: ['Momentum framing', 'Fear of missing out', 'Trend language']
      },
      {
        action: 'Make request with social framing',
        script: 'So given that [MULTIPLE PEOPLE] have already [JOINED/DONE], I wanted to personally invite you to [OBJECTIVE]. I think you\'d be a great fit alongside them.',
        timing: 'Day 12-14',
        channel: 'call',
        expectedOutcome: 'Target joins to be part of the group',
        fallbackAction: 'Add more social proof, emphasize who else is joining',
        notes: ['Position as exclusive invitation', 'They\'re joining people, not just activity', 'Group identity appeal']
      }
    ]
  },
  
  authority: {
    description: 'Leverage perceived expertise or status',
    keyMechanism: 'People defer to experts and authority figures',
    idealPersonality: { openness: 'low', conscientiousness: 'high' },
    baseSteps: [
      {
        action: 'Establish authority credentials',
        script: undefined,
        timing: 'Day 1-3',
        channel: 'in_person',
        expectedOutcome: 'Target perceives you/source as credible expert',
        notes: ['Credentials before content', 'Third-party introductions ideal', 'Symbols of authority help (titles, institutions)']
      },
      {
        action: 'Demonstrate expertise casually',
        script: 'In my experience with [FIELD], I\'ve found that [INSIGHT]. Actually, I recently [ACCOMPLISHMENT] which showed [EXPERTISE].',
        timing: 'Day 4-7',
        channel: 'text',
        expectedOutcome: 'Authority perception reinforced',
        notes: ['Show, don\'t tell', 'Specific examples', 'Let them discover credentials']
      },
      {
        action: 'Provide expert recommendation',
        script: 'Based on everything I\'ve seen in [FIELD], I would strongly recommend [ACTION]. The data supports this, and I\'ve seen it work for [EXAMPLES].',
        timing: 'Day 10-14',
        channel: 'call',
        expectedOutcome: 'Target values recommendation highly',
        fallbackAction: 'Bring in additional authority figures',
        notes: ['Expert opinion format', 'Reference data/evidence', 'Professional certainty']
      }
    ]
  },
  
  liking: {
    description: 'Build rapport and personal connection first',
    keyMechanism: 'People say yes to those they like',
    idealPersonality: { agreeableness: 'high', extraversion: 'high' },
    baseSteps: [
      {
        action: 'Find genuine common ground',
        script: undefined,
        timing: 'Day 1-3',
        channel: 'in_person',
        expectedOutcome: 'Identify shared interests, values, or experiences',
        notes: ['Research their interests', 'Look for authentic connections', 'Similarity breeds liking']
      },
      {
        action: 'Build rapport through mirroring',
        script: 'I noticed you\'re into [INTEREST]. That\'s interesting - I\'ve been getting into that myself. What got you started?',
        timing: 'Day 4-7',
        channel: 'in_person',
        expectedOutcome: 'Sense of connection and understanding',
        notes: ['Mirror body language', 'Match energy level', 'Use their vocabulary']
      },
      {
        action: 'Offer genuine compliments',
        script: 'I have to say, I really admire how you [SPECIFIC QUALITY/ACHIEVEMENT]. Not many people [DO THAT THING].',
        timing: 'Day 8-10',
        channel: 'text',
        expectedOutcome: 'Positive associations with you',
        notes: ['Specific > vague', 'About effort/skill > appearance', 'Must be genuine']
      },
      {
        action: 'Make request as a friend',
        script: 'Hey, I value your perspective on things. I\'m working on [OBJECTIVE] and honestly, you\'re one of the first people I thought of. Would you be interested in [ASK]?',
        timing: 'Day 14-21',
        channel: 'in_person',
        expectedOutcome: 'Personal loyalty drives compliance',
        fallbackAction: 'Emphasize personal relationship, not transaction',
        notes: ['Friend-to-friend framing', 'They\'re helping you personally', 'Reciprocal relationship implied']
      }
    ]
  },
  
  scarcity: {
    description: 'Create urgency through limited availability',
    keyMechanism: 'People want what they can\'t easily have',
    idealPersonality: { neuroticism: 'high', conscientiousness: 'low' },
    baseSteps: [
      {
        action: 'Establish exclusive/limited nature',
        script: 'I wanted to reach out because [OPPORTUNITY] just came up. It\'s not widely known yet, and there are only [LIMITED SPOTS/TIME].',
        timing: 'Day 1',
        channel: 'text',
        expectedOutcome: 'Create perception of rare opportunity',
        notes: ['Exclusive information framing', 'You\'re giving them inside access', 'Genuine limitation if possible']
      },
      {
        action: 'Add time pressure',
        script: 'Just a heads up - the deadline for this is [DATE]. After that, [CONSEQUENCE]. I wanted to make sure you had a chance before it closes.',
        timing: 'Day 2-3',
        channel: 'call',
        expectedOutcome: 'Urgency drives faster decision',
        notes: ['Specific deadline', 'Clear consequence of missing', 'Helpful framing, not pushy']
      },
      {
        action: 'Highlight loss aversion',
        script: 'I\'d hate for you to miss this because [WHAT THEY\'LL LOSE]. [COMPETITOR/OTHERS] are already moving on it.',
        timing: 'Day 4-5',
        channel: 'text',
        expectedOutcome: 'Fear of loss outweighs status quo',
        fallbackAction: 'Extend deadline slightly as "special exception"',
        notes: ['Loss > gain framing', 'Competition triggers action', 'FOMO activation']
      }
    ]
  },
  
  unity: {
    description: 'Appeal to shared identity and group membership',
    keyMechanism: 'People favor those in their "in-group"',
    idealPersonality: { agreeableness: 'high', extraversion: 'high' },
    baseSteps: [
      {
        action: 'Identify shared group identity',
        script: undefined,
        timing: 'Day 1-2',
        channel: 'in_person',
        expectedOutcome: 'Find meaningful group membership overlap',
        notes: ['Family, religion, profession, alma mater, hometown, values', 'More exclusive = stronger', '"We" language']
      },
      {
        action: 'Activate shared identity',
        script: 'You know, as fellow [SHARED IDENTITY], I feel like we see things differently than most people. There\'s a certain [SHARED VALUE/PERSPECTIVE].',
        timing: 'Day 3-5',
        channel: 'in_person',
        expectedOutcome: '"We" bond established',
        notes: ['Us vs. them framing', 'Shared struggles/victories', 'Tribal activation']
      },
      {
        action: 'Request as in-group member',
        script: 'I\'m reaching out to you specifically because we\'re both [IDENTITY]. I\'m working on something that I think would really benefit our community, and I need people who get it.',
        timing: 'Day 7-10',
        channel: 'call',
        expectedOutcome: 'In-group loyalty drives compliance',
        fallbackAction: 'Emphasize shared identity more strongly',
        notes: ['They\'re not helping you, they\'re helping "us"', 'Group success framing', 'Loyalty appeal']
      }
    ]
  }
};

/**
 * Generate a complete influence playbook for a specific contact and objective
 */
export function generatePlaybook(
  objective: string,
  contact: ContactContext,
  preferredPrinciple?: CialdiniPrinciple
): InfluencePlaybook {
  // Select best principle based on personality if not specified
  const principle = preferredPrinciple || selectBestPrinciple(contact);
  const template = PRINCIPLE_TEMPLATES[principle];
  
  // Customize steps for this contact
  const customizedSteps = customizeStepsForContact(template.baseSteps, contact, objective);
  
  // Calculate success probability
  const successRate = calculateSuccessRate(principle, contact);
  
  return {
    principle,
    targetObjective: objective,
    estimatedSuccessRate: successRate,
    totalDuration: calculateDuration(customizedSteps),
    steps: customizedSteps,
    warningSignals: generateWarningSignals(principle, contact),
    adaptationTriggers: generateAdaptationTriggers(principle),
    exitConditions: generateExitConditions(objective)
  };
}

/**
 * Select the best principle based on contact personality
 */
function selectBestPrinciple(contact: ContactContext): CialdiniPrinciple {
  if (!contact.personality) {
    // Default fallback order based on general effectiveness
    return 'reciprocity';
  }
  
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = contact.personality;
  
  // Score each principle for this personality
  const scores: Record<CialdiniPrinciple, number> = {
    reciprocity: agreeableness.score * 0.4 + conscientiousness.score * 0.3,
    commitment: conscientiousness.score * 0.5 + (100 - neuroticism.score) * 0.3,
    social_proof: extraversion.score * 0.5 + agreeableness.score * 0.3,
    authority: (100 - openness.score) * 0.4 + conscientiousness.score * 0.3,
    liking: agreeableness.score * 0.4 + extraversion.score * 0.3,
    scarcity: neuroticism.score * 0.4 + (100 - conscientiousness.score) * 0.3,
    unity: agreeableness.score * 0.4 + extraversion.score * 0.3
  };
  
  // Adjust for relationship strength
  if (contact.relationshipStrength > 0.7) {
    scores.liking *= 1.3;
    scores.unity *= 1.2;
  }
  
  // Find highest scoring principle
  let best: CialdiniPrinciple = 'reciprocity';
  let bestScore = 0;
  
  for (const [principle, score] of Object.entries(scores) as [CialdiniPrinciple, number][]) {
    if (score > bestScore) {
      bestScore = score;
      best = principle;
    }
  }
  
  return best;
}

/**
 * Customize playbook steps for a specific contact
 */
function customizeStepsForContact(
  baseSteps: Omit<PlaybookStep, 'stepNumber'>[],
  contact: ContactContext,
  objective: string
): PlaybookStep[] {
  return baseSteps.map((step, index) => {
    let customizedScript = step.script;
    
    if (customizedScript) {
      // Replace placeholders
      customizedScript = customizedScript
        .replace(/\[NAME\]/g, contact.name)
        .replace(/\[OBJECTIVE\]/g, objective)
        .replace(/\[INTEREST\]/g, contact.knownInterests[0] || 'that')
        .replace(/\[SPECIFIC ASK\]/g, objective);
    }
    
    // Adjust channel based on preference
    let adjustedChannel = step.channel;
    if (contact.communicationPreference && step.channel !== 'in_person') {
      adjustedChannel = contact.communicationPreference;
    }
    
    return {
      ...step,
      stepNumber: index + 1,
      script: customizedScript,
      channel: adjustedChannel
    };
  });
}

/**
 * Calculate estimated success rate
 */
function calculateSuccessRate(principle: CialdiniPrinciple, contact: ContactContext): number {
  let baseRate = 0.5;
  
  // Adjust based on relationship strength
  baseRate += contact.relationshipStrength * 0.2;
  
  // Adjust based on personality fit
  if (contact.personality) {
    const template = PRINCIPLE_TEMPLATES[principle];
    let fitScore = 0;
    let fitCount = 0;
    
    for (const [trait, direction] of Object.entries(template.idealPersonality) as [keyof OceanProfile, 'high' | 'low'][]) {
      if (contact.personality[trait]) {
        const score = contact.personality[trait].score;
        if (direction === 'high' && score > 60) {
          fitScore += (score - 50) / 50;
        } else if (direction === 'low' && score < 40) {
          fitScore += (50 - score) / 50;
        }
        fitCount++;
      }
    }
    
    if (fitCount > 0) {
      baseRate += (fitScore / fitCount) * 0.2;
    }
  }
  
  // Adjust based on previous interactions
  if (contact.previousInteractions > 10) {
    baseRate += 0.1;
  }
  
  return Math.min(0.95, Math.max(0.1, baseRate));
}

/**
 * Calculate total campaign duration
 */
function calculateDuration(steps: PlaybookStep[]): string {
  if (steps.length === 0) return '1 week';
  
  const lastStep = steps[steps.length - 1];
  const timing = lastStep.timing;
  
  // Parse timing like "Day 14-21"
  const match = timing.match(/Day\s+(\d+)(?:-(\d+))?/);
  if (match) {
    const maxDay = parseInt(match[2] || match[1]);
    if (maxDay <= 7) return '1 week';
    if (maxDay <= 14) return '2 weeks';
    if (maxDay <= 21) return '3 weeks';
    if (maxDay <= 30) return '1 month';
    return `${Math.ceil(maxDay / 30)} months`;
  }
  
  return '2-3 weeks';
}

/**
 * Generate warning signals to watch for
 */
function generateWarningSignals(principle: CialdiniPrinciple, contact: ContactContext): string[] {
  const signals: string[] = [
    'Delayed responses increasing over time',
    'Shorter, less engaged replies',
    'Excuses without offering alternatives',
    'Direct pushback or expressed discomfort'
  ];
  
  if (principle === 'scarcity') {
    signals.push('Skepticism about urgency or deadlines');
    signals.push('Requests for more information before deciding');
  }
  
  if (principle === 'reciprocity') {
    signals.push('Explicitly mentioning they don\'t feel obligated');
    signals.push('Declining while expressing gratitude');
  }
  
  if (contact.personality && contact.personality.neuroticism.score > 70) {
    signals.push('Signs of anxiety or overwhelm');
    signals.push('Requests to slow down or take a break');
  }
  
  return signals;
}

/**
 * Generate triggers for strategy adaptation
 */
function generateAdaptationTriggers(principle: CialdiniPrinciple): string[] {
  return [
    'Two consecutive unsuccessful touch attempts',
    'Explicit rejection of current approach',
    'Significant change in target circumstances',
    'Discovery of new personality/preference information',
    `${principle === 'scarcity' ? 'Deadline passed without action' : 'Primary principle not resonating'}`
  ];
}

/**
 * Generate exit conditions
 */
function generateExitConditions(objective: string): string[] {
  return [
    `Objective achieved: ${objective}`,
    'Explicit, final refusal from target',
    'Relationship damage outweighs objective value',
    'Better opportunity identified elsewhere',
    'Campaign exceeds 2x planned duration without progress'
  ];
}

/**
 * Generate multi-touch campaign plan
 */
export function generateMultiTouchCampaign(
  objectives: string[],
  contact: ContactContext,
  maxDurationDays: number = 30
): InfluencePlaybook[] {
  const playbooks: InfluencePlaybook[] = [];
  
  // Prioritize objectives
  const prioritizedObjectives = objectives.slice(0, 3);
  
  // Use different principles for variety
  const usedPrinciples: Set<CialdiniPrinciple> = new Set();
  
  for (const objective of prioritizedObjectives) {
    let principle = selectBestPrinciple(contact);
    
    // Avoid repeating principles
    while (usedPrinciples.has(principle) && usedPrinciples.size < 7) {
      const principles: CialdiniPrinciple[] = ['reciprocity', 'commitment', 'social_proof', 'authority', 'liking', 'scarcity', 'unity'];
      principle = principles[Math.floor(Math.random() * principles.length)];
    }
    
    usedPrinciples.add(principle);
    
    const playbook = generatePlaybook(objective, contact, principle);
    playbooks.push(playbook);
  }
  
  return playbooks;
}
