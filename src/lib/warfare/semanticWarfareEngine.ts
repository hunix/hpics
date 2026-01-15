// Semantic Warfare Engine - Term warfare and definition control
// Manipulate how targets interpret information without changing facts

export interface TermDefinition {
  term: string;
  currentDefinition: string;
  targetDefinition: string;
  overtonPosition: number; // -5 (unthinkable) to +5 (popular)
  shiftProgress: number; // 0-100
}

export interface FramingStrategy {
  strategy: 'euphemism' | 'dysphemism' | 'metaphor' | 'technical' | 'emotional';
  originalTerm: string;
  framedTerm: string;
  emotionalValence: number; // -1 to +1
  persuasiveness: number; // 0-1
}

export interface SemanticOperation {
  id: string;
  targetTerm: string;
  objective: 'redefine' | 'delegitimize' | 'normalize' | 'weaponize';
  status: 'planning' | 'active' | 'completed';
  strategies: FramingStrategy[];
  progress: number;
}

// Overton Window positions
export const OVERTON_POSITIONS = {
  UNTHINKABLE: -5,
  RADICAL: -3,
  ACCEPTABLE: -1,
  SENSIBLE: 0,
  POPULAR: 2,
  POLICY: 5,
} as const;

// Semantic manipulation techniques from propaganda research
export const SEMANTIC_TECHNIQUES = {
  EUPHEMISM: {
    name: 'Euphemism',
    description: 'Replace negative terms with neutral/positive alternatives',
    example: '"downsizing" instead of "firing employees"',
    effectiveness: 0.7,
  },
  DYSPHEMISM: {
    name: 'Dysphemism',
    description: 'Replace neutral terms with negative alternatives',
    example: '"regime" instead of "government"',
    effectiveness: 0.75,
  },
  CONCEPTUAL_METAPHOR: {
    name: 'Conceptual Metaphor',
    description: 'Frame abstract concepts using concrete domains',
    example: 'Economy as "health" (sick economy, recovery)',
    effectiveness: 0.85,
  },
  NOMINALIZATION: {
    name: 'Nominalization',
    description: 'Convert actions to nouns to obscure agency',
    example: '"The destruction occurred" vs "They destroyed it"',
    effectiveness: 0.65,
  },
  PRESUPPOSITION: {
    name: 'Presupposition',
    description: 'Embed assumptions in questions/statements',
    example: '"When did you stop...?" presumes you did',
    effectiveness: 0.8,
  },
  LOADED_LANGUAGE: {
    name: 'Loaded Language',
    description: 'Use emotionally charged words',
    example: '"Freedom fighter" vs "terrorist"',
    effectiveness: 0.9,
  },
} as const;

// Calculate semantic distance between definitions
export function calculateSemanticShift(
  original: string,
  target: string
): number {
  // Simplified semantic distance (in production, use embeddings)
  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const targetWords = new Set(target.toLowerCase().split(/\s+/));
  
  const intersection = [...originalWords].filter(w => targetWords.has(w));
  const union = new Set([...originalWords, ...targetWords]);
  
  // Jaccard distance
  return 1 - (intersection.length / union.size);
}

// Generate framing alternatives
export function generateFramingAlternatives(
  term: string,
  objective: 'positive' | 'negative' | 'neutral'
): FramingStrategy[] {
  // In production, this would call the AI edge function
  return [];
}

// Evaluate Overton Window position for a concept
export function evaluateOvertonPosition(
  concept: string,
  contextSignals: {
    mediaFrequency: number;
    sentimentScore: number;
    influencerEndorsements: number;
    institutionalSupport: number;
  }
): number {
  const { mediaFrequency, sentimentScore, influencerEndorsements, institutionalSupport } = contextSignals;
  
  // Weighted calculation
  const position = (
    (mediaFrequency * 0.2) +
    (sentimentScore * 0.3) +
    (influencerEndorsements * 0.2) +
    (institutionalSupport * 0.3)
  ) * 5; // Scale to -5 to +5
  
  return Math.max(-5, Math.min(5, position));
}

// Plan Overton window shift
export function planOvertonShift(
  currentPosition: number,
  targetPosition: number
): string[] {
  const steps: string[] = [];
  const distance = targetPosition - currentPosition;
  
  if (distance > 0) {
    // Moving toward acceptance
    steps.push('1. Identify fringe advocates to propose extreme version');
    steps.push('2. Create "moderate" position at target level');
    steps.push('3. Generate controlled controversy for media coverage');
    steps.push('4. Introduce academic/expert legitimization');
    steps.push('5. Convert to institutional policy proposal');
  } else {
    // Moving toward rejection
    steps.push('1. Associate concept with unpopular figures/movements');
    steps.push('2. Highlight negative consequences with case studies');
    steps.push('3. Amplify opposition voices in discourse');
    steps.push('4. Generate moral outrage narratives');
    steps.push('5. Establish new terminology for rejection');
  }
  
  return steps;
}
