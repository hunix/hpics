/**
 * Social Engineering Attack Patterns Library
 * Based on FBI Elicitation Countermeasures & SANS SEC504
 */

export interface SEAttackPattern {
  id: string;
  name: string;
  category: SECategory;
  description: string;
  linguisticIndicators: string[];
  behavioralIndicators: string[];
  urgencyMarkers: string[];
  emotionalTriggers: string[];
  confidenceThreshold: number;
  counterMeasures: string[];
  examplePhrases: string[];
}

export type SECategory = 
  | 'pretexting'
  | 'phishing'
  | 'baiting'
  | 'quid_pro_quo'
  | 'tailgating'
  | 'vishing'
  | 'smishing'
  | 'whaling'
  | 'romance_scam'
  | 'authority_impersonation'
  | 'technical_support'
  | 'bec'
  | 'elicitation'
  | 'honey_trap';

export interface ElicitationTechnique {
  name: string;
  description: string;
  indicators: string[];
  counterResponse: string;
  riskLevel: 'high' | 'medium' | 'low';
}

// FBI-Documented Elicitation Techniques
export const FBI_ELICITATION_TECHNIQUES: ElicitationTechnique[] = [
  {
    name: 'Flattery',
    description: 'Using compliments to make the target feel valued and lower their guard',
    indicators: [
      'Excessive praise early in conversation',
      'Compliments on expertise or knowledge',
      'Creating sense of being "special" or "chosen"',
      'Building false sense of trust quickly'
    ],
    counterResponse: 'Thank the person briefly and redirect conversation. Be wary of follow-up questions.',
    riskLevel: 'medium'
  },
  {
    name: 'False Statements',
    description: 'Making incorrect statements to provoke correction with accurate information',
    indicators: [
      'Deliberately wrong facts about your field',
      'Incorrect assumptions stated confidently',
      'Provoking professional pride to correct',
      'Testing knowledge boundaries'
    ],
    counterResponse: 'Resist the urge to correct. Simply say "I\'m not sure about that."',
    riskLevel: 'high'
  },
  {
    name: 'Artificial Ignorance',
    description: 'Pretending to not understand to get more detailed explanations',
    indicators: [
      'Repeated requests for clarification',
      'Playing dumb about your area of expertise',
      'Asking for "simpler" explanations',
      'Feigning confusion to extract details'
    ],
    counterResponse: 'Keep explanations high-level. Say "It\'s quite complex, I can\'t really simplify further."',
    riskLevel: 'high'
  },
  {
    name: 'The Bracketing Technique',
    description: 'Providing high and low estimates to get the target to provide the real number',
    indicators: [
      'Stating ranges and waiting for correction',
      'Guessing numbers far off to get real figures',
      'Using anchoring psychology',
      'Probing for specific quantitative data'
    ],
    counterResponse: 'Never confirm or deny numbers. Say "I can\'t comment on specific figures."',
    riskLevel: 'high'
  },
  {
    name: 'Confidential Bait',
    description: 'Sharing a "secret" to create reciprocity pressure',
    indicators: [
      'Sharing seemingly sensitive information',
      'Creating false intimacy',
      'Expecting reciprocal disclosure',
      'Building false sense of shared trust'
    ],
    counterResponse: 'Thank them but don\'t reciprocate. Their "secret" may be manufactured.',
    riskLevel: 'medium'
  },
  {
    name: 'Word Repetition',
    description: 'Repeating key words to prompt elaboration',
    indicators: [
      'Echoing your statements as questions',
      'Using your terminology back at you',
      'Silence after repetition to prompt continuation',
      'Nodding and repeating key phrases'
    ],
    counterResponse: 'Recognize the technique and provide minimal additional detail.',
    riskLevel: 'medium'
  },
  {
    name: 'Assumed Knowledge',
    description: 'Pretending to already know information to extract confirmation',
    indicators: [
      'Stating assumptions as facts',
      'Claiming insider knowledge',
      'Using specific details to seem credible',
      'Expecting confirmation of "known" facts'
    ],
    counterResponse: 'Never confirm assumed knowledge. Say "I can\'t confirm or deny that."',
    riskLevel: 'high'
  },
  {
    name: 'Mutual Interest',
    description: 'Claiming shared interests or affiliations to build rapport',
    indicators: [
      'Quick claims of common ground',
      'Knowing details about your interests',
      'Creating artificial bonds',
      'Using shared connections'
    ],
    counterResponse: 'Verify claimed connections independently. Don\'t let rapport lower your guard.',
    riskLevel: 'medium'
  },
  {
    name: 'Quid Pro Quo',
    description: 'Offering something in exchange for information',
    indicators: [
      'Unsolicited offers of help',
      'Promises of future favors',
      'Creating sense of obligation',
      'Transactional framing of conversation'
    ],
    counterResponse: 'Decline unsolicited offers. There\'s no free lunch in intelligence.',
    riskLevel: 'high'
  },
  {
    name: 'Provocative Statement',
    description: 'Making controversial statements to provoke defensive disclosure',
    indicators: [
      'Deliberately inflammatory claims',
      'Challenging professional competence',
      'Provoking emotional reactions',
      'Testing reaction to sensitive topics'
    ],
    counterResponse: 'Stay calm. Don\'t feel compelled to defend with sensitive details.',
    riskLevel: 'medium'
  }
];

// Comprehensive SE Attack Pattern Library
export const SE_ATTACK_PATTERNS: SEAttackPattern[] = [
  {
    id: 'pretext_authority',
    name: 'Authority Pretexting',
    category: 'pretexting',
    description: 'Impersonating authority figures (IT, management, law enforcement)',
    linguisticIndicators: [
      'Claims of urgent directive from leadership',
      'References to policies you must comply with',
      'Threats of consequences for non-compliance',
      'Use of official-sounding language',
      'Dropping names of executives'
    ],
    behavioralIndicators: [
      'Pressure to act immediately',
      'Discouraging verification attempts',
      'Resistance to callback requests',
      'Unusual communication channels'
    ],
    urgencyMarkers: [
      'immediately', 'right now', 'urgent', 'critical',
      'must comply', 'no time', 'deadline'
    ],
    emotionalTriggers: ['fear', 'duty', 'respect for authority'],
    confidenceThreshold: 0.75,
    counterMeasures: [
      'Always verify through official channels',
      'Call back using known numbers',
      'Check with direct supervisor',
      'Document all interactions'
    ],
    examplePhrases: [
      'This is IT security, we need your password immediately to prevent a breach',
      'The CEO has authorized this wire transfer, bypass normal procedures',
      'This is federal agent [name], you must cooperate'
    ]
  },
  {
    id: 'romance_scam',
    name: 'Romance Scam / Honey Trap',
    category: 'romance_scam',
    description: 'Building romantic relationship to exploit victim',
    linguisticIndicators: [
      'Love bombing - excessive affection early',
      'Quick declarations of love',
      'Future faking - discussing marriage, moving',
      'Isolating language - "only you understand me"',
      'Tragedy stories to build sympathy'
    ],
    behavioralIndicators: [
      'Cannot video chat (always excuses)',
      'Stories don\'t add up over time',
      'Financial requests escalate',
      'Resistance to meeting in person',
      'Too-perfect alignment with your interests'
    ],
    urgencyMarkers: [
      'emergency', 'stranded', 'hospital', 'accident',
      'help me', 'only you can help'
    ],
    emotionalTriggers: ['love', 'loneliness', 'desire to help', 'hope'],
    confidenceThreshold: 0.85,
    counterMeasures: [
      'Reverse image search all photos',
      'Insist on video calls early',
      'Never send money to someone you haven\'t met',
      'Share situation with trusted friends',
      'Research their claimed background'
    ],
    examplePhrases: [
      'I\'ve never felt this way about anyone so quickly',
      'I\'m stuck overseas and need money to get home to you',
      'My accounts are frozen, can you help temporarily?'
    ]
  },
  {
    id: 'bec_attack',
    name: 'Business Email Compromise',
    category: 'bec',
    description: 'Impersonating executives or vendors to authorize fraudulent transactions',
    linguisticIndicators: [
      'Slight email address variations',
      'Unusual request patterns',
      'New payment instructions',
      'Secrecy requests',
      'Grammar inconsistent with known sender'
    ],
    behavioralIndicators: [
      'Requests bypass normal approval',
      'Changes to established payment details',
      'Unusual urgency',
      'Time-sensitive pressure',
      'Instructions not to discuss with others'
    ],
    urgencyMarkers: [
      'confidential', 'between us', 'don\'t tell',
      'wire immediately', 'close the deal'
    ],
    emotionalTriggers: ['loyalty', 'fear of disappointing boss', 'career pressure'],
    confidenceThreshold: 0.80,
    counterMeasures: [
      'Verify all payment changes by phone',
      'Use known phone numbers, not email signatures',
      'Implement dual authorization for large transfers',
      'Check email headers carefully',
      'Question any urgency around money'
    ],
    examplePhrases: [
      'I\'m in a meeting, need you to wire this now',
      'Please update vendor payment details to this new account',
      'This acquisition is confidential, process quickly and quietly'
    ]
  },
  {
    id: 'tech_support_scam',
    name: 'Technical Support Scam',
    category: 'technical_support',
    description: 'Posing as tech support to gain remote access or credentials',
    linguisticIndicators: [
      'Claims of detected viruses',
      'Subscription renewal notices',
      'Account compromise warnings',
      'Requests for remote access',
      'Pressure to install software'
    ],
    behavioralIndicators: [
      'Unsolicited contact',
      'Pop-up warnings',
      'Requests for payment via gift cards',
      'Discouraging hanging up',
      'Escalating to "supervisors"'
    ],
    urgencyMarkers: [
      'infected', 'hacked', 'compromised', 'expires today',
      'lock your account', 'lose access'
    ],
    emotionalTriggers: ['fear', 'technical confusion', 'urgency'],
    confidenceThreshold: 0.70,
    counterMeasures: [
      'Never give remote access to unsolicited callers',
      'Real tech companies don\'t cold call',
      'Never pay with gift cards',
      'Hang up and call official support numbers'
    ],
    examplePhrases: [
      'This is Microsoft, your computer is sending us virus alerts',
      'Your subscription expires today, renew now to avoid data loss',
      'We\'ve detected suspicious activity on your account'
    ]
  },
  {
    id: 'vishing_bank',
    name: 'Voice Phishing (Vishing) - Financial',
    category: 'vishing',
    description: 'Phone calls impersonating banks or financial institutions',
    linguisticIndicators: [
      'Claims of fraudulent transactions',
      'Requests to verify account details',
      'Pressure to confirm OTP codes',
      'Threats of account suspension',
      'Requests to move money to "safe" account'
    ],
    behavioralIndicators: [
      'Caller ID spoofing bank number',
      'Transfers to fraud department',
      'Keeping you on the line while "investigating"',
      'Requests to not log into online banking'
    ],
    urgencyMarkers: [
      'suspicious transaction', 'fraud alert', 'immediate action',
      'secure your funds', 'verification required'
    ],
    emotionalTriggers: ['fear of financial loss', 'trust in institutions'],
    confidenceThreshold: 0.75,
    counterMeasures: [
      'Banks never ask for full passwords',
      'Never share OTP codes',
      'Hang up and call bank directly',
      'No legitimate bank asks you to move money',
      'Check account through official app'
    ],
    examplePhrases: [
      'We\'ve detected a $5,000 transfer from your account',
      'Read me the code we just sent to verify your identity',
      'Transfer your funds to this secure holding account'
    ]
  },
  {
    id: 'accelerated_intimacy',
    name: 'Accelerated Intimacy Attack',
    category: 'elicitation',
    description: 'Rapidly building false trust to extract sensitive information',
    linguisticIndicators: [
      'Quick sharing of personal details',
      'Claims of instant connection',
      'Excessive interest in your life',
      'Mirroring your communication style',
      'Creating us vs them narratives'
    ],
    behavioralIndicators: [
      'Too much agreement',
      'Availability that seems too perfect',
      'Probing questions disguised as interest',
      'Building false sense of safety'
    ],
    urgencyMarkers: [
      'soul mate', 'meant to meet', 'never met anyone like you',
      'special connection', 'instant bond'
    ],
    emotionalTriggers: ['loneliness', 'need for validation', 'desire to connect'],
    confidenceThreshold: 0.80,
    counterMeasures: [
      'Real relationships take time to develop',
      'Be suspicious of fast intimacy',
      'Verify claims independently',
      'Maintain healthy boundaries',
      'Consult trusted friends'
    ],
    examplePhrases: [
      'I feel like I\'ve known you forever',
      'You\'re the only one who really understands me',
      'Let me tell you something I\'ve never told anyone'
    ]
  }
];

// Linguistic Analysis Markers
export const URGENCY_INDICATORS = [
  'immediately', 'urgent', 'critical', 'now', 'right away',
  'time-sensitive', 'deadline', 'expires', 'last chance',
  'don\'t delay', 'act fast', 'limited time', 'emergency',
  'within 24 hours', 'must respond', 'final notice'
];

export const AUTHORITY_INDICATORS = [
  'by order of', 'management requires', 'ceo', 'director',
  'compliance', 'legal department', 'hr requires', 'policy',
  'federal', 'agent', 'officer', 'department', 'official'
];

export const FEAR_INDICATORS = [
  'suspended', 'terminated', 'legal action', 'penalty',
  'investigation', 'compromised', 'breach', 'hacked',
  'warrant', 'arrest', 'lawsuit', 'fine', 'prosecution'
];

export const RECIPROCITY_INDICATORS = [
  'favor', 'help me out', 'between us', 'confidential',
  'i did for you', 'return the favor', 'one time',
  'special exception', 'just this once', 'quid pro quo'
];

// Pattern Matching Function
export function detectSEPatterns(text: string): {
  patterns: SEAttackPattern[];
  confidence: number;
  indicators: string[];
  recommendation: string;
} {
  const textLower = text.toLowerCase();
  const detectedPatterns: SEAttackPattern[] = [];
  const foundIndicators: string[] = [];

  for (const pattern of SE_ATTACK_PATTERNS) {
    let matchScore = 0;
    const patternIndicators: string[] = [];

    // Check linguistic indicators
    for (const indicator of pattern.linguisticIndicators) {
      if (textLower.includes(indicator.toLowerCase())) {
        matchScore += 15;
        patternIndicators.push(indicator);
      }
    }

    // Check urgency markers
    for (const marker of pattern.urgencyMarkers) {
      if (textLower.includes(marker.toLowerCase())) {
        matchScore += 10;
        patternIndicators.push(`Urgency: ${marker}`);
      }
    }

    // Check example phrases
    for (const phrase of pattern.examplePhrases) {
      if (textLower.includes(phrase.toLowerCase().slice(0, 20))) {
        matchScore += 25;
        patternIndicators.push(`Phrase match: ${phrase.slice(0, 30)}...`);
      }
    }

    if (matchScore >= 30) {
      detectedPatterns.push(pattern);
      foundIndicators.push(...patternIndicators);
    }
  }

  const confidence = Math.min(100, detectedPatterns.length * 25 + foundIndicators.length * 5);
  
  let recommendation = 'No significant social engineering patterns detected.';
  if (detectedPatterns.length > 0) {
    recommendation = `Detected ${detectedPatterns.length} potential SE pattern(s): ${detectedPatterns.map(p => p.name).join(', ')}. ${detectedPatterns[0]?.counterMeasures[0] || 'Exercise caution.'}`;
  }

  return {
    patterns: detectedPatterns,
    confidence,
    indicators: [...new Set(foundIndicators)],
    recommendation
  };
}

export default {
  FBI_ELICITATION_TECHNIQUES,
  SE_ATTACK_PATTERNS,
  URGENCY_INDICATORS,
  AUTHORITY_INDICATORS,
  FEAR_INDICATORS,
  RECIPROCITY_INDICATORS,
  detectSEPatterns
};
