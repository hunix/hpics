// Elicitation Techniques Library - 24 FBI conversational extraction methods

export interface ElicitationTechnique {
  id: string;
  name: string;
  category: 'assumption' | 'ego' | 'reciprocity' | 'social' | 'cognitive';
  description: string;
  example: string;
  effectiveness: number; // 0-1
  detectability: number; // 0-1 (how easily noticed)
  bestUseCases: string[];
  counterIndicators: string[]; // Signs target is onto you
}

export interface ElicitationSession {
  id: string;
  targetProfileId: string;
  objective: string;
  techniquesUsed: string[];
  informationExtracted: ExtractedInfo[];
  status: 'planning' | 'active' | 'completed' | 'burned';
  notes: string[];
}

export interface ExtractedInfo {
  content: string;
  confidence: number;
  technique: string;
  timestamp: string;
  verified: boolean;
}

// FBI's 24 Elicitation Techniques (adapted from NCSC training)
export const FBI_ELICITATION_TECHNIQUES: ElicitationTechnique[] = [
  // Assumption-Based
  {
    id: 'assumed-knowledge',
    name: 'Assumed Knowledge',
    category: 'assumption',
    description: 'Pretend you already know something to get confirmation or details',
    example: '"I heard your company is expanding to Asia..." (when you don\'t know)',
    effectiveness: 0.75,
    detectability: 0.3,
    bestUseCases: ['Confirming rumors', 'Getting details on known topics'],
    counterIndicators: ['Direct questions back', 'Asking for your source'],
  },
  {
    id: 'deliberate-false',
    name: 'Deliberate False Statement',
    category: 'assumption',
    description: 'Make an intentionally wrong statement to provoke correction',
    example: '"So your CEO resigned last month?" (when they didn\'t)',
    effectiveness: 0.85,
    detectability: 0.25,
    bestUseCases: ['Getting accurate information', 'Revealing hidden knowledge'],
    counterIndicators: ['No correction offered', 'Subject changes topic'],
  },
  {
    id: 'bracketing',
    name: 'Bracketing',
    category: 'assumption',
    description: 'State a range to narrow down the actual value',
    example: '"I imagine the project cost between 5 and 10 million?"',
    effectiveness: 0.7,
    detectability: 0.35,
    bestUseCases: ['Getting numerical data', 'Budget/timeline info'],
    counterIndicators: ['Refuses to confirm range', 'Says "I can\'t discuss that"'],
  },

  // Ego-Based
  {
    id: 'flattery',
    name: 'Flattery',
    category: 'ego',
    description: 'Appeal to vanity to encourage information sharing',
    example: '"With your expertise, you must have insights on..."',
    effectiveness: 0.8,
    detectability: 0.4,
    bestUseCases: ['Technical experts', 'Senior executives', 'Narcissistic personalities'],
    counterIndicators: ['Dismissive response', 'Suspicious look'],
  },
  {
    id: 'criticism',
    name: 'Criticism',
    category: 'ego',
    description: 'Critique something to provoke defensive revelation',
    example: '"I don\'t think your approach will work because..."',
    effectiveness: 0.75,
    detectability: 0.5,
    bestUseCases: ['Proud individuals', 'Competitive personalities'],
    counterIndicators: ['Agrees with criticism', 'Becomes hostile'],
  },
  {
    id: 'appeal-ego',
    name: 'Appeal to Ego',
    category: 'ego',
    description: 'Make them feel important for knowing something',
    example: '"Not everyone would understand this, but you...',
    effectiveness: 0.82,
    detectability: 0.35,
    bestUseCases: ['Insecure individuals', 'Those seeking validation'],
    counterIndicators: ['Humble deflection', 'Suspicious of motive'],
  },

  // Reciprocity-Based
  {
    id: 'quid-pro-quo',
    name: 'Quid Pro Quo',
    category: 'reciprocity',
    description: 'Offer information first to encourage reciprocal sharing',
    example: 'Share your own (carefully chosen) information first',
    effectiveness: 0.85,
    detectability: 0.3,
    bestUseCases: ['Building trust', 'Long-term relationships'],
    counterIndicators: ['Accepts info but doesn\'t reciprocate'],
  },
  {
    id: 'mutual-interest',
    name: 'Mutual Interest',
    category: 'reciprocity',
    description: 'Find common ground to lower defenses',
    example: '"We both care about X, so you\'ll appreciate..."',
    effectiveness: 0.7,
    detectability: 0.25,
    bestUseCases: ['Initial relationship building', 'Cold contacts'],
    counterIndicators: ['Keeps conversation shallow'],
  },

  // Social Pressure
  {
    id: 'conformity',
    name: 'Conformity Pressure',
    category: 'social',
    description: 'Suggest everyone else shares this information',
    example: '"Most people in your position tell me..."',
    effectiveness: 0.65,
    detectability: 0.45,
    bestUseCases: ['Group-oriented individuals', 'Those seeking belonging'],
    counterIndicators: ['Asserts independence', '"I\'m not like others"'],
  },
  {
    id: 'word-repetition',
    name: 'Word Repetition',
    category: 'cognitive',
    description: 'Repeat their last few words as a question',
    example: 'Them: "We\'re restructuring." You: "Restructuring?"',
    effectiveness: 0.75,
    detectability: 0.2,
    bestUseCases: ['Getting elaboration', 'Passive elicitation'],
    counterIndicators: ['Notices pattern', 'Asks why you keep repeating'],
  },
  {
    id: 'naivete',
    name: 'Feigned Naivete',
    category: 'cognitive',
    description: 'Pretend ignorance to get explanations',
    example: '"I don\'t really understand how that works..."',
    effectiveness: 0.78,
    detectability: 0.3,
    bestUseCases: ['Technical topics', 'Complex processes'],
    counterIndicators: ['Simplifies too much', 'Becomes condescending'],
  },
  {
    id: 'disbelief',
    name: 'Expression of Disbelief',
    category: 'cognitive',
    description: 'Express skepticism to provoke proof',
    example: '"There\'s no way that could have happened..."',
    effectiveness: 0.72,
    detectability: 0.4,
    bestUseCases: ['Getting evidence', 'Challenging claims'],
    counterIndicators: ['Shrugs off skepticism', 'Says "believe what you want"'],
  },
];

// Calculate optimal technique for target profile
export function selectOptimalTechnique(
  targetProfile: {
    egoLevel: number;
    reciprocityTendency: number;
    conformityLevel: number;
    suspicionLevel: number;
  },
  objective: 'confirm' | 'extract' | 'elaborate'
): ElicitationTechnique {
  const techniques = FBI_ELICITATION_TECHNIQUES;
  
  // Score each technique for this target
  const scores = techniques.map(technique => {
    let score = technique.effectiveness;
    
    // Adjust for target profile
    if (technique.category === 'ego') {
      score *= (0.5 + targetProfile.egoLevel * 0.5);
    }
    if (technique.category === 'reciprocity') {
      score *= (0.5 + targetProfile.reciprocityTendency * 0.5);
    }
    if (technique.category === 'social') {
      score *= (0.5 + targetProfile.conformityLevel * 0.5);
    }
    
    // Penalize for detectability based on suspicion level
    score *= (1 - technique.detectability * targetProfile.suspicionLevel);
    
    return { technique, score };
  });
  
  // Return highest scoring technique
  scores.sort((a, b) => b.score - a.score);
  return scores[0].technique;
}

// Generate elicitation conversation starter
export function generateConversationStarter(
  technique: ElicitationTechnique,
  topic: string,
  context: string
): string {
  // In production, this would call the AI edge function
  return `[Using ${technique.name}]: ${technique.example}`;
}
