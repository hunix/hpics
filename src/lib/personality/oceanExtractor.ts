/**
 * OCEAN/Big Five Personality Extractor
 * 
 * Extracts Big Five personality traits from text using NLP analysis.
 * Based on LIWC (Linguistic Inquiry and Word Count) methodology and
 * modern transformer-based personality detection research.
 */

// OCEAN Trait Definitions
export interface OceanScore {
  score: number;        // 0-100 scale
  confidence: number;   // 0-1 confidence
  evidence: string[];   // Supporting evidence snippets
}

export interface OceanProfile {
  openness: OceanScore;
  conscientiousness: OceanScore;
  extraversion: OceanScore;
  agreeableness: OceanScore;
  neuroticism: OceanScore;
}

// Facet Scores (6 per dimension = 30 total)
export interface FacetScores {
  // Openness facets
  fantasy: number;
  aesthetics: number;
  feelings: number;
  actions: number;
  ideas: number;
  values: number;
  
  // Conscientiousness facets
  competence: number;
  order: number;
  dutifulness: number;
  achievementStriving: number;
  selfDiscipline: number;
  deliberation: number;
  
  // Extraversion facets
  warmth: number;
  gregariousness: number;
  assertiveness: number;
  activity: number;
  excitementSeeking: number;
  positiveEmotions: number;
  
  // Agreeableness facets
  trust: number;
  straightforwardness: number;
  altruism: number;
  compliance: number;
  modesty: number;
  tenderMindedness: number;
  
  // Neuroticism facets
  anxiety: number;
  angryHostility: number;
  depression: number;
  selfConsciousness: number;
  impulsiveness: number;
  vulnerability: number;
}

// Exploitation angles derived from personality
export interface ExploitationAngle {
  principle: string;        // Cialdini principle or persuasion technique
  approach: string;         // How to apply it
  effectiveness: number;    // 0-1 predicted effectiveness
  rationale: string;        // Why this works for this personality
}

// Influence vulnerabilities
export interface InfluenceVulnerability {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  triggers: string[];
  counterMeasures: string[];
}

// LIWC-based linguistic markers for each trait
const TRAIT_MARKERS = {
  openness: {
    positive: [
      'imagine', 'creative', 'curious', 'philosophical', 'artistic', 'innovative',
      'abstract', 'theoretical', 'unconventional', 'explore', 'wonder', 'insight',
      'perspective', 'metaphor', 'symbolic', 'aesthetic', 'novel', 'unique',
      'intellectual', 'concept', 'idea', 'think', 'perhaps', 'maybe', 'possibly'
    ],
    negative: [
      'practical', 'traditional', 'conventional', 'routine', 'familiar', 'concrete',
      'literal', 'straightforward', 'simple', 'basic', 'normal', 'regular',
      'standard', 'usual', 'typical', 'ordinary', 'common', 'plain'
    ]
  },
  conscientiousness: {
    positive: [
      'plan', 'organize', 'schedule', 'deadline', 'goal', 'achieve', 'complete',
      'thorough', 'careful', 'precise', 'detail', 'systematic', 'efficient',
      'responsible', 'reliable', 'punctual', 'prepared', 'disciplined', 'focused',
      'must', 'should', 'need to', 'have to', 'will', 'definitely', 'certainly'
    ],
    negative: [
      'spontaneous', 'flexible', 'casual', 'relaxed', 'easygoing', 'whatever',
      'maybe later', 'procrastinate', 'forget', 'mess', 'disorganized', 'chaos',
      'impulsive', 'random', 'whenever', 'if possible', 'might'
    ]
  },
  extraversion: {
    positive: [
      'party', 'friends', 'people', 'social', 'talk', 'fun', 'exciting', 'energy',
      'group', 'team', 'together', 'meet', 'hang out', 'celebration', 'crowd',
      'loud', 'active', 'outgoing', 'enthusiastic', 'we', 'us', 'everyone'
    ],
    negative: [
      'alone', 'quiet', 'solitude', 'private', 'peaceful', 'calm', 'introspect',
      'book', 'home', 'myself', 'I', 'prefer', 'rather', 'silent', 'reserved',
      'thoughtful', 'observe', 'listen', 'few', 'small group'
    ]
  },
  agreeableness: {
    positive: [
      'help', 'support', 'care', 'kind', 'generous', 'cooperate', 'trust', 'share',
      'understand', 'sympathize', 'empathize', 'compassion', 'forgive', 'patient',
      'gentle', 'warm', 'friendly', 'please', 'thank', 'appreciate', 'sorry'
    ],
    negative: [
      'compete', 'win', 'challenge', 'argue', 'disagree', 'skeptical', 'suspicious',
      'critical', 'tough', 'harsh', 'blunt', 'direct', 'honest', 'frank',
      'independent', 'self', 'my way', 'demand', 'insist', 'refuse'
    ]
  },
  neuroticism: {
    positive: [
      'worry', 'anxious', 'stressed', 'nervous', 'afraid', 'scared', 'panic',
      'overwhelmed', 'sad', 'depressed', 'angry', 'frustrated', 'upset', 'hurt',
      'sensitive', 'vulnerable', 'insecure', 'doubt', 'fear', 'terrible', 'awful',
      'hate', 'can\'t', 'never', 'always', 'everything', 'nothing'
    ],
    negative: [
      'calm', 'relaxed', 'confident', 'secure', 'stable', 'composed', 'peaceful',
      'content', 'satisfied', 'happy', 'optimistic', 'hopeful', 'resilient',
      'strong', 'capable', 'handle', 'manage', 'cope', 'fine', 'okay', 'good'
    ]
  }
};

// Sentence-level patterns
const SENTENCE_PATTERNS = {
  openness: {
    high: [
      /what if/i, /i wonder/i, /imagine if/i, /it's interesting that/i,
      /from another perspective/i, /metaphorically/i, /in theory/i
    ],
    low: [
      /that's just how it is/i, /keep it simple/i, /if it ain't broke/i,
      /practically speaking/i, /the way we've always/i
    ]
  },
  conscientiousness: {
    high: [
      /i'll make sure/i, /on schedule/i, /as planned/i, /step by step/i,
      /i've prepared/i, /i'll follow up/i, /by the deadline/i
    ],
    low: [
      /we'll see/i, /whenever/i, /no rush/i, /go with the flow/i,
      /i forgot/i, /oops/i, /my bad/i
    ]
  },
  extraversion: {
    high: [
      /let's all/i, /everyone should/i, /it was so fun/i, /i love meeting/i,
      /we had a blast/i, /can't wait to see/i, /the more the merrier/i
    ],
    low: [
      /i prefer/i, /by myself/i, /need some time/i, /just me/i,
      /quiet evening/i, /rather stay/i, /small gathering/i
    ]
  },
  agreeableness: {
    high: [
      /how can i help/i, /i understand/i, /that's okay/i, /don't worry/i,
      /i'm here for you/i, /we can work it out/i, /i appreciate/i
    ],
    low: [
      /i disagree/i, /that's wrong/i, /you should/i, /my opinion/i,
      /frankly/i, /to be honest/i, /i don't care/i
    ]
  },
  neuroticism: {
    high: [
      /i'm so worried/i, /what if something/i, /i can't stop thinking/i,
      /it's overwhelming/i, /i'm afraid/i, /this is terrible/i, /i hate/i
    ],
    low: [
      /no problem/i, /i've got this/i, /it'll work out/i, /i'm confident/i,
      /i can handle/i, /everything's fine/i, /don't worry about it/i
    ]
  }
};

/**
 * Extract OCEAN personality traits from text
 */
export function extractOceanFromText(
  text: string,
  existingProfile?: Partial<OceanProfile>
): OceanProfile {
  const words = text.toLowerCase().split(/\s+/);
  const sentences = text.split(/[.!?]+/);
  
  const scores: OceanProfile = {
    openness: calculateTraitScore('openness', words, sentences, existingProfile?.openness),
    conscientiousness: calculateTraitScore('conscientiousness', words, sentences, existingProfile?.conscientiousness),
    extraversion: calculateTraitScore('extraversion', words, sentences, existingProfile?.extraversion),
    agreeableness: calculateTraitScore('agreeableness', words, sentences, existingProfile?.agreeableness),
    neuroticism: calculateTraitScore('neuroticism', words, sentences, existingProfile?.neuroticism)
  };
  
  return scores;
}

/**
 * Calculate score for a single trait
 */
function calculateTraitScore(
  trait: keyof typeof TRAIT_MARKERS,
  words: string[],
  sentences: string[],
  existing?: OceanScore
): OceanScore {
  const markers = TRAIT_MARKERS[trait];
  const patterns = SENTENCE_PATTERNS[trait];
  
  let positiveCount = 0;
  let negativeCount = 0;
  const evidence: string[] = [];
  
  // Count word markers
  for (const word of words) {
    if (markers.positive.includes(word)) {
      positiveCount++;
      if (evidence.length < 5) {
        evidence.push(`Word: "${word}" (+)`);
      }
    }
    if (markers.negative.includes(word)) {
      negativeCount++;
      if (evidence.length < 5) {
        evidence.push(`Word: "${word}" (-)`);
      }
    }
  }
  
  // Check sentence patterns
  for (const sentence of sentences) {
    for (const pattern of patterns.high) {
      if (pattern.test(sentence)) {
        positiveCount += 2;
        if (evidence.length < 5) {
          evidence.push(`Pattern: "${sentence.trim().substring(0, 50)}..." (+)`);
        }
      }
    }
    for (const pattern of patterns.low) {
      if (pattern.test(sentence)) {
        negativeCount += 2;
        if (evidence.length < 5) {
          evidence.push(`Pattern: "${sentence.trim().substring(0, 50)}..." (-)`);
        }
      }
    }
  }
  
  // Calculate raw score (50 is neutral)
  const total = positiveCount + negativeCount;
  let score = 50;
  
  if (total > 0) {
    const ratio = positiveCount / total;
    score = Math.round(ratio * 100);
  }
  
  // Calculate confidence based on evidence amount
  const confidence = Math.min(total / 20, 1);
  
  // Blend with existing profile if provided
  if (existing && existing.confidence > 0) {
    const blendWeight = existing.confidence / (existing.confidence + confidence);
    score = Math.round(existing.score * blendWeight + score * (1 - blendWeight));
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    confidence: Math.min((existing?.confidence || 0) + confidence * 0.3, 1),
    evidence: [...(existing?.evidence || []).slice(0, 3), ...evidence].slice(0, 10)
  };
}

/**
 * Extract facet scores (30 subfacets of Big Five)
 */
export function extractFacetScores(text: string, oceanProfile: OceanProfile): Partial<FacetScores> {
  // Simplified facet extraction - in production would use more sophisticated NLP
  const facets: Partial<FacetScores> = {};
  
  const o = oceanProfile.openness.score;
  const c = oceanProfile.conscientiousness.score;
  const e = oceanProfile.extraversion.score;
  const a = oceanProfile.agreeableness.score;
  const n = oceanProfile.neuroticism.score;
  
  // Openness facets (with slight variation)
  facets.fantasy = o + (Math.random() - 0.5) * 10;
  facets.aesthetics = o + (Math.random() - 0.5) * 10;
  facets.feelings = o + (Math.random() - 0.5) * 10;
  facets.actions = o + (Math.random() - 0.5) * 10;
  facets.ideas = o + (Math.random() - 0.5) * 10;
  facets.values = o + (Math.random() - 0.5) * 10;
  
  // Conscientiousness facets
  facets.competence = c + (Math.random() - 0.5) * 10;
  facets.order = c + (Math.random() - 0.5) * 10;
  facets.dutifulness = c + (Math.random() - 0.5) * 10;
  facets.achievementStriving = c + (Math.random() - 0.5) * 10;
  facets.selfDiscipline = c + (Math.random() - 0.5) * 10;
  facets.deliberation = c + (Math.random() - 0.5) * 10;
  
  // Extraversion facets
  facets.warmth = e + (Math.random() - 0.5) * 10;
  facets.gregariousness = e + (Math.random() - 0.5) * 10;
  facets.assertiveness = e + (Math.random() - 0.5) * 10;
  facets.activity = e + (Math.random() - 0.5) * 10;
  facets.excitementSeeking = e + (Math.random() - 0.5) * 10;
  facets.positiveEmotions = e + (Math.random() - 0.5) * 10;
  
  // Agreeableness facets
  facets.trust = a + (Math.random() - 0.5) * 10;
  facets.straightforwardness = a + (Math.random() - 0.5) * 10;
  facets.altruism = a + (Math.random() - 0.5) * 10;
  facets.compliance = a + (Math.random() - 0.5) * 10;
  facets.modesty = a + (Math.random() - 0.5) * 10;
  facets.tenderMindedness = a + (Math.random() - 0.5) * 10;
  
  // Neuroticism facets
  facets.anxiety = n + (Math.random() - 0.5) * 10;
  facets.angryHostility = n + (Math.random() - 0.5) * 10;
  facets.depression = n + (Math.random() - 0.5) * 10;
  facets.selfConsciousness = n + (Math.random() - 0.5) * 10;
  facets.impulsiveness = n + (Math.random() - 0.5) * 10;
  facets.vulnerability = n + (Math.random() - 0.5) * 10;
  
  // Clamp all values
  for (const key of Object.keys(facets) as (keyof FacetScores)[]) {
    facets[key] = Math.max(0, Math.min(100, Math.round(facets[key]!)));
  }
  
  return facets;
}

/**
 * Generate exploitation angles based on personality profile
 */
export function generateExploitationAngles(profile: OceanProfile): ExploitationAngle[] {
  const angles: ExploitationAngle[] = [];
  
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = profile;
  
  // High Openness exploitation
  if (openness.score > 60) {
    angles.push({
      principle: 'Novelty Appeal',
      approach: 'Present ideas as innovative, unique, or groundbreaking. Emphasize new perspectives and unexplored possibilities.',
      effectiveness: openness.score / 100 * 0.9,
      rationale: 'High openness individuals are attracted to novelty and new experiences.'
    });
  }
  
  // Low Openness exploitation
  if (openness.score < 40) {
    angles.push({
      principle: 'Tradition & Stability',
      approach: 'Frame requests as maintaining tradition, proven methods, or established practices.',
      effectiveness: (100 - openness.score) / 100 * 0.85,
      rationale: 'Low openness individuals prefer familiar, conventional approaches.'
    });
  }
  
  // High Conscientiousness exploitation
  if (conscientiousness.score > 60) {
    angles.push({
      principle: 'Commitment & Consistency',
      approach: 'Get small commitments first, then escalate. Emphasize their previous statements or actions.',
      effectiveness: conscientiousness.score / 100 * 0.95,
      rationale: 'Conscientious individuals feel strong need to honor commitments.'
    });
    angles.push({
      principle: 'Structured Proposals',
      approach: 'Present well-organized, detailed plans with clear timelines and milestones.',
      effectiveness: conscientiousness.score / 100 * 0.88,
      rationale: 'They respond to organized, systematic approaches.'
    });
  }
  
  // High Extraversion exploitation
  if (extraversion.score > 60) {
    angles.push({
      principle: 'Social Proof',
      approach: 'Emphasize what others are doing, group consensus, and social validation.',
      effectiveness: extraversion.score / 100 * 0.9,
      rationale: 'Extraverts are highly influenced by social dynamics.'
    });
    angles.push({
      principle: 'Public Commitment',
      approach: 'Get them to commit in front of others for stronger binding effect.',
      effectiveness: extraversion.score / 100 * 0.85,
      rationale: 'They care about their social image and public consistency.'
    });
  }
  
  // Low Extraversion exploitation
  if (extraversion.score < 40) {
    angles.push({
      principle: 'Private Approach',
      approach: 'Communicate one-on-one, give them time to think, avoid group pressure.',
      effectiveness: (100 - extraversion.score) / 100 * 0.8,
      rationale: 'Introverts prefer private, reflective decision-making.'
    });
  }
  
  // High Agreeableness exploitation
  if (agreeableness.score > 60) {
    angles.push({
      principle: 'Reciprocity',
      approach: 'Give first, then ask. They will feel obligated to return favors.',
      effectiveness: agreeableness.score / 100 * 0.95,
      rationale: 'Agreeable individuals have strong reciprocity instincts.'
    });
    angles.push({
      principle: 'Liking/Rapport',
      approach: 'Build personal connection before making requests. Find common ground.',
      effectiveness: agreeableness.score / 100 * 0.9,
      rationale: 'They are more influenced by people they like and trust.'
    });
    angles.push({
      principle: 'Guilt Induction',
      approach: 'Subtle expressions of disappointment or highlighting their failure to help.',
      effectiveness: agreeableness.score / 100 * 0.75,
      rationale: 'High agreeableness correlates with guilt susceptibility.'
    });
  }
  
  // High Neuroticism exploitation
  if (neuroticism.score > 60) {
    angles.push({
      principle: 'Fear/Loss Aversion',
      approach: 'Frame in terms of what they might lose rather than gain. Highlight risks of inaction.',
      effectiveness: neuroticism.score / 100 * 0.9,
      rationale: 'Neurotic individuals are more sensitive to potential losses and threats.'
    });
    angles.push({
      principle: 'Security Appeal',
      approach: 'Offer certainty, protection, and risk mitigation in your proposals.',
      effectiveness: neuroticism.score / 100 * 0.85,
      rationale: 'They seek safety and security above other values.'
    });
    angles.push({
      principle: 'Urgency/Scarcity',
      approach: 'Create time pressure to trigger anxiety-driven decision making.',
      effectiveness: neuroticism.score / 100 * 0.8,
      rationale: 'Anxiety makes them more susceptible to urgency manipulation.'
    });
  }
  
  // Low Neuroticism exploitation
  if (neuroticism.score < 40) {
    angles.push({
      principle: 'Rational Appeal',
      approach: 'Focus on logic, evidence, and rational arguments. They are resistant to emotional manipulation.',
      effectiveness: (100 - neuroticism.score) / 100 * 0.85,
      rationale: 'Emotionally stable individuals respond better to reason than emotion.'
    });
  }
  
  return angles.sort((a, b) => b.effectiveness - a.effectiveness);
}

/**
 * Identify influence vulnerabilities based on personality
 */
export function identifyVulnerabilities(profile: OceanProfile): InfluenceVulnerability[] {
  const vulnerabilities: InfluenceVulnerability[] = [];
  
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = profile;
  
  // High Agreeableness = Difficulty saying no
  if (agreeableness.score > 70) {
    vulnerabilities.push({
      type: 'People-Pleasing',
      description: 'Difficulty refusing requests, especially from liked individuals',
      severity: agreeableness.score > 85 ? 'high' : 'medium',
      triggers: ['Personal requests', 'Guilt appeals', 'Reciprocity situations'],
      counterMeasures: ['Give them time to respond', 'Avoid immediate pressure', 'Accept initial "yes" carefully']
    });
  }
  
  // High Neuroticism = Anxiety exploitation
  if (neuroticism.score > 70) {
    vulnerabilities.push({
      type: 'Anxiety Susceptibility',
      description: 'Prone to fear-based decision making and urgency manipulation',
      severity: neuroticism.score > 85 ? 'high' : 'medium',
      triggers: ['Uncertainty', 'Time pressure', 'Loss framing', 'Worst-case scenarios'],
      counterMeasures: ['Provide reassurance', 'Allow processing time', 'Avoid fear tactics if relationship is priority']
    });
  }
  
  // Low Conscientiousness = Impulsive decisions
  if (conscientiousness.score < 30) {
    vulnerabilities.push({
      type: 'Impulsivity',
      description: 'Makes quick decisions without thorough analysis',
      severity: conscientiousness.score < 20 ? 'high' : 'medium',
      triggers: ['Immediate gratification offers', 'Excitement framing', 'Low-effort requests'],
      counterMeasures: ['Strike while iron is hot', 'Reduce friction', 'Avoid delayed gratification framing']
    });
  }
  
  // High Conscientiousness = Commitment trap
  if (conscientiousness.score > 75) {
    vulnerabilities.push({
      type: 'Commitment Entrapment',
      description: 'Once committed, extremely reluctant to back out even against self-interest',
      severity: 'high',
      triggers: ['Small initial commitments', 'Public statements', 'Written agreements'],
      counterMeasures: ['Use foot-in-the-door technique', 'Get incremental commitments', 'Reference past commitments']
    });
  }
  
  // High Extraversion = Social proof susceptibility
  if (extraversion.score > 70) {
    vulnerabilities.push({
      type: 'Social Proof Dependency',
      description: 'Heavily influenced by what others are doing or thinking',
      severity: extraversion.score > 85 ? 'high' : 'medium',
      triggers: ['Group consensus', 'Popular trends', 'Celebrity endorsements', 'Peer behavior'],
      counterMeasures: ['Highlight group adoption', 'Show testimonials', 'Create bandwagon effect']
    });
  }
  
  // High Openness = Novelty addiction
  if (openness.score > 75) {
    vulnerabilities.push({
      type: 'Novelty Seeking',
      description: 'Easily distracted by new ideas, may abandon projects for newer opportunities',
      severity: openness.score > 85 ? 'medium' : 'low',
      triggers: ['New opportunities', 'Innovative pitches', 'Unique experiences'],
      counterMeasures: ['Present as innovative/unique', 'Regular novelty refreshes', 'Avoid routine framing']
    });
  }
  
  return vulnerabilities;
}

/**
 * Calculate personality stability coefficient
 */
export function calculateStabilityCoefficient(
  historicalProfiles: OceanProfile[],
  currentProfile: OceanProfile
): number {
  if (historicalProfiles.length === 0) return 0;
  
  let totalVariance = 0;
  const traits: (keyof OceanProfile)[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  
  for (const profile of historicalProfiles) {
    for (const trait of traits) {
      const diff = Math.abs(profile[trait].score - currentProfile[trait].score);
      totalVariance += diff;
    }
  }
  
  const avgVariance = totalVariance / (historicalProfiles.length * traits.length);
  const stability = 1 - (avgVariance / 100);
  
  return Math.max(0, Math.min(1, stability));
}
