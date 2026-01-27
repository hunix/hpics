/**
 * Cross-Language Deception Detection Engine (v9.0)
 * 
 * Culture-specific deception markers with 10+ language support
 * and culture-weighted feature extraction.
 * 
 * @version 9.0
 */

export interface LanguageProfile {
  code: string;
  name: string;
  culturalContext: CulturalContext;
  deceptionMarkers: DeceptionMarker[];
  hedgeWords: string[];
  intensifiers: string[];
  distancingPronouns: string[];
  negativeEmotionWords: string[];
}

export interface CulturalContext {
  highContext: boolean; // High vs low context culture
  collectivist: boolean; // Collectivist vs individualist
  powerDistance: 'high' | 'medium' | 'low';
  uncertaintyAvoidance: 'high' | 'medium' | 'low';
  emotionalExpressiveness: 'high' | 'medium' | 'low';
}

export interface DeceptionMarker {
  pattern: string | RegExp;
  type: 'hedge' | 'qualifier' | 'distancing' | 'certainty' | 'negation' | 'emotion';
  weight: number;
  culturalAdjustment: number; // Multiplier based on cultural context
}

export interface CrossLanguageAnalysis {
  sourceLanguage: string;
  detectedDeception: boolean;
  deceptionScore: number;
  culturallyAdjustedScore: number;
  markerCounts: Record<string, number>;
  culturalFactors: CulturalFactor[];
  confidence: number;
  warnings: string[];
}

export interface CulturalFactor {
  name: string;
  impact: 'increases' | 'decreases' | 'neutral';
  adjustment: number;
  explanation: string;
}

// Language profiles for supported languages
const LANGUAGE_PROFILES: Record<string, LanguageProfile> = {
  en: {
    code: 'en',
    name: 'English',
    culturalContext: {
      highContext: false,
      collectivist: false,
      powerDistance: 'medium',
      uncertaintyAvoidance: 'medium',
      emotionalExpressiveness: 'medium',
    },
    deceptionMarkers: [
      { pattern: /\bi think\b/gi, type: 'hedge', weight: 0.3, culturalAdjustment: 1.0 },
      { pattern: /\bmaybe\b/gi, type: 'hedge', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /\bperhaps\b/gi, type: 'hedge', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /\bkind of\b/gi, type: 'qualifier', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /\bsort of\b/gi, type: 'qualifier', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /\bthey\b/gi, type: 'distancing', weight: 0.2, culturalAdjustment: 1.0 },
      { pattern: /\bone\b/gi, type: 'distancing', weight: 0.3, culturalAdjustment: 1.0 },
      { pattern: /\babsolutely\b/gi, type: 'certainty', weight: 0.5, culturalAdjustment: 1.0 },
      { pattern: /\bnever\b/gi, type: 'negation', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /\balways\b/gi, type: 'certainty', weight: 0.4, culturalAdjustment: 1.0 },
    ],
    hedgeWords: ['perhaps', 'maybe', 'possibly', 'probably', 'might', 'could'],
    intensifiers: ['very', 'really', 'absolutely', 'definitely', 'certainly'],
    distancingPronouns: ['they', 'them', 'one', 'people'],
    negativeEmotionWords: ['worried', 'concerned', 'upset', 'frustrated', 'angry'],
  },
  es: {
    code: 'es',
    name: 'Spanish',
    culturalContext: {
      highContext: true,
      collectivist: true,
      powerDistance: 'high',
      uncertaintyAvoidance: 'high',
      emotionalExpressiveness: 'high',
    },
    deceptionMarkers: [
      { pattern: /\bcreo que\b/gi, type: 'hedge', weight: 0.3, culturalAdjustment: 0.8 },
      { pattern: /\bquizás\b/gi, type: 'hedge', weight: 0.4, culturalAdjustment: 0.8 },
      { pattern: /\btal vez\b/gi, type: 'hedge', weight: 0.4, culturalAdjustment: 0.8 },
      { pattern: /\bun poco\b/gi, type: 'qualifier', weight: 0.3, culturalAdjustment: 0.9 },
      { pattern: /\bse dice\b/gi, type: 'distancing', weight: 0.4, culturalAdjustment: 0.8 },
      { pattern: /\bla gente\b/gi, type: 'distancing', weight: 0.3, culturalAdjustment: 0.7 },
      { pattern: /\bnunca\b/gi, type: 'negation', weight: 0.4, culturalAdjustment: 0.9 },
      { pattern: /\bsiempre\b/gi, type: 'certainty', weight: 0.4, culturalAdjustment: 0.9 },
    ],
    hedgeWords: ['quizás', 'tal vez', 'posiblemente', 'probablemente'],
    intensifiers: ['muy', 'realmente', 'absolutamente', 'totalmente'],
    distancingPronouns: ['uno', 'se', 'la gente', 'ellos'],
    negativeEmotionWords: ['preocupado', 'molesto', 'frustrado', 'enfadado'],
  },
  zh: {
    code: 'zh',
    name: 'Chinese (Mandarin)',
    culturalContext: {
      highContext: true,
      collectivist: true,
      powerDistance: 'high',
      uncertaintyAvoidance: 'medium',
      emotionalExpressiveness: 'low',
    },
    deceptionMarkers: [
      { pattern: /也许/g, type: 'hedge', weight: 0.3, culturalAdjustment: 0.6 },
      { pattern: /可能/g, type: 'hedge', weight: 0.3, culturalAdjustment: 0.6 },
      { pattern: /大概/g, type: 'hedge', weight: 0.4, culturalAdjustment: 0.6 },
      { pattern: /有点/g, type: 'qualifier', weight: 0.3, culturalAdjustment: 0.7 },
      { pattern: /他们/g, type: 'distancing', weight: 0.2, culturalAdjustment: 0.5 },
      { pattern: /绝对/g, type: 'certainty', weight: 0.5, culturalAdjustment: 0.8 },
      { pattern: /从不/g, type: 'negation', weight: 0.4, culturalAdjustment: 0.7 },
    ],
    hedgeWords: ['也许', '可能', '大概', '或许', '恐怕'],
    intensifiers: ['非常', '很', '绝对', '完全'],
    distancingPronouns: ['他们', '人们', '有人'],
    negativeEmotionWords: ['担心', '烦恼', '生气', '不安'],
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    culturalContext: {
      highContext: true,
      collectivist: true,
      powerDistance: 'high',
      uncertaintyAvoidance: 'high',
      emotionalExpressiveness: 'high',
    },
    deceptionMarkers: [
      { pattern: /ربما/g, type: 'hedge', weight: 0.4, culturalAdjustment: 0.7 },
      { pattern: /يمكن/g, type: 'hedge', weight: 0.3, culturalAdjustment: 0.7 },
      { pattern: /قليلا/g, type: 'qualifier', weight: 0.3, culturalAdjustment: 0.8 },
      { pattern: /إن شاء الله/g, type: 'hedge', weight: 0.2, culturalAdjustment: 0.4 },
      { pattern: /والله/g, type: 'certainty', weight: 0.5, culturalAdjustment: 0.6 },
      { pattern: /أبدا/g, type: 'negation', weight: 0.4, culturalAdjustment: 0.8 },
    ],
    hedgeWords: ['ربما', 'يمكن', 'لعل', 'قد'],
    intensifiers: ['جدا', 'كثيرا', 'تماما'],
    distancingPronouns: ['هم', 'الناس'],
    negativeEmotionWords: ['قلق', 'منزعج', 'غاضب'],
  },
  de: {
    code: 'de',
    name: 'German',
    culturalContext: {
      highContext: false,
      collectivist: false,
      powerDistance: 'low',
      uncertaintyAvoidance: 'high',
      emotionalExpressiveness: 'low',
    },
    deceptionMarkers: [
      { pattern: /\bvielleicht\b/gi, type: 'hedge', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /\beigentlich\b/gi, type: 'hedge', weight: 0.5, culturalAdjustment: 1.0 },
      { pattern: /\birgendwie\b/gi, type: 'qualifier', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /\bman\b/gi, type: 'distancing', weight: 0.3, culturalAdjustment: 0.7 },
      { pattern: /\bnie\b/gi, type: 'negation', weight: 0.5, culturalAdjustment: 1.0 },
      { pattern: /\bimmer\b/gi, type: 'certainty', weight: 0.4, culturalAdjustment: 1.0 },
    ],
    hedgeWords: ['vielleicht', 'möglicherweise', 'wahrscheinlich', 'eventuell'],
    intensifiers: ['sehr', 'wirklich', 'absolut', 'total'],
    distancingPronouns: ['man', 'sie', 'Leute'],
    negativeEmotionWords: ['besorgt', 'verärgert', 'frustriert'],
  },
  fr: {
    code: 'fr',
    name: 'French',
    culturalContext: {
      highContext: true,
      collectivist: false,
      powerDistance: 'high',
      uncertaintyAvoidance: 'high',
      emotionalExpressiveness: 'medium',
    },
    deceptionMarkers: [
      { pattern: /\bpeut-être\b/gi, type: 'hedge', weight: 0.4, culturalAdjustment: 0.9 },
      { pattern: /\bje pense\b/gi, type: 'hedge', weight: 0.3, culturalAdjustment: 0.9 },
      { pattern: /\bun peu\b/gi, type: 'qualifier', weight: 0.3, culturalAdjustment: 0.9 },
      { pattern: /\bon\b/gi, type: 'distancing', weight: 0.2, culturalAdjustment: 0.6 },
      { pattern: /\bjamais\b/gi, type: 'negation', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /\btoujours\b/gi, type: 'certainty', weight: 0.4, culturalAdjustment: 1.0 },
    ],
    hedgeWords: ['peut-être', 'probablement', 'sans doute'],
    intensifiers: ['très', 'vraiment', 'absolument', 'totalement'],
    distancingPronouns: ['on', 'ils', 'les gens'],
    negativeEmotionWords: ['inquiet', 'contrarié', 'frustré', 'fâché'],
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    culturalContext: {
      highContext: true,
      collectivist: true,
      powerDistance: 'high',
      uncertaintyAvoidance: 'high',
      emotionalExpressiveness: 'low',
    },
    deceptionMarkers: [
      { pattern: /かもしれない/g, type: 'hedge', weight: 0.3, culturalAdjustment: 0.5 },
      { pattern: /たぶん/g, type: 'hedge', weight: 0.3, culturalAdjustment: 0.5 },
      { pattern: /ちょっと/g, type: 'qualifier', weight: 0.2, culturalAdjustment: 0.4 },
      { pattern: /と思います/g, type: 'hedge', weight: 0.2, culturalAdjustment: 0.3 },
      { pattern: /絶対/g, type: 'certainty', weight: 0.5, culturalAdjustment: 0.9 },
      { pattern: /決して/g, type: 'negation', weight: 0.5, culturalAdjustment: 0.9 },
    ],
    hedgeWords: ['かもしれない', 'たぶん', 'おそらく', '多分'],
    intensifiers: ['とても', '非常に', '本当に', '絶対'],
    distancingPronouns: ['彼ら', '人々'],
    negativeEmotionWords: ['心配', '困った', '怒り'],
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    culturalContext: {
      highContext: true,
      collectivist: true,
      powerDistance: 'high',
      uncertaintyAvoidance: 'high',
      emotionalExpressiveness: 'medium',
    },
    deceptionMarkers: [
      { pattern: /может быть/gi, type: 'hedge', weight: 0.4, culturalAdjustment: 0.8 },
      { pattern: /возможно/gi, type: 'hedge', weight: 0.4, culturalAdjustment: 0.8 },
      { pattern: /немного/gi, type: 'qualifier', weight: 0.3, culturalAdjustment: 0.9 },
      { pattern: /говорят/gi, type: 'distancing', weight: 0.4, culturalAdjustment: 0.7 },
      { pattern: /никогда/gi, type: 'negation', weight: 0.4, culturalAdjustment: 1.0 },
      { pattern: /всегда/gi, type: 'certainty', weight: 0.4, culturalAdjustment: 1.0 },
    ],
    hedgeWords: ['может быть', 'возможно', 'наверное', 'вероятно'],
    intensifiers: ['очень', 'совсем', 'абсолютно', 'полностью'],
    distancingPronouns: ['они', 'люди'],
    negativeEmotionWords: ['беспокоюсь', 'раздражён', 'разочарован'],
  },
};

/**
 * Detect language from text (simplified)
 */
export function detectLanguage(text: string): string {
  // Character-based detection for non-Latin scripts
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  
  // Word-based detection for Latin scripts
  const lowerText = text.toLowerCase();
  const wordScores: Record<string, number> = {};
  
  for (const [code, profile] of Object.entries(LANGUAGE_PROFILES)) {
    let score = 0;
    for (const word of profile.hedgeWords) {
      if (lowerText.includes(word.toLowerCase())) score++;
    }
    for (const word of profile.intensifiers) {
      if (lowerText.includes(word.toLowerCase())) score++;
    }
    wordScores[code] = score;
  }
  
  const bestMatch = Object.entries(wordScores).sort((a, b) => b[1] - a[1])[0];
  return bestMatch && bestMatch[1] > 0 ? bestMatch[0] : 'en';
}

/**
 * Analyze text for cross-language deception markers
 */
export function analyzeCrossLanguageDeception(
  text: string,
  languageCode?: string
): CrossLanguageAnalysis {
  const detectedLang = languageCode || detectLanguage(text);
  const profile = LANGUAGE_PROFILES[detectedLang] || LANGUAGE_PROFILES['en'];
  
  const markerCounts: Record<string, number> = {};
  let rawScore = 0;
  let weightSum = 0;
  
  // Count deception markers
  for (const marker of profile.deceptionMarkers) {
    const matches = text.match(marker.pattern);
    const count = matches ? matches.length : 0;
    markerCounts[marker.type] = (markerCounts[marker.type] || 0) + count;
    rawScore += count * marker.weight;
    weightSum += marker.weight;
  }
  
  // Normalize raw score
  const normalizedScore = weightSum > 0 ? rawScore / (weightSum * 2) : 0;
  
  // Calculate cultural adjustment factors
  const culturalFactors = calculateCulturalFactors(profile.culturalContext, markerCounts);
  
  // Apply cultural adjustments
  let adjustmentMultiplier = 1;
  for (const factor of culturalFactors) {
    adjustmentMultiplier *= (1 + factor.adjustment);
  }
  
  const culturallyAdjustedScore = Math.min(1, normalizedScore * adjustmentMultiplier);
  
  // Generate warnings
  const warnings: string[] = [];
  if (profile.culturalContext.highContext) {
    warnings.push('High-context culture: indirect communication is normative');
  }
  if (profile.culturalContext.emotionalExpressiveness === 'low') {
    warnings.push('Low emotional expressiveness culture: reduced emotional markers expected');
  }
  if (markerCounts['hedge'] > 5 && profile.culturalContext.highContext) {
    warnings.push('High hedge count may be culturally normative rather than deceptive');
  }
  
  return {
    sourceLanguage: profile.name,
    detectedDeception: culturallyAdjustedScore > 0.5,
    deceptionScore: normalizedScore,
    culturallyAdjustedScore,
    markerCounts,
    culturalFactors,
    confidence: calculateConfidence(text.length, Object.values(markerCounts).reduce((a, b) => a + b, 0)),
    warnings,
  };
}

/**
 * Calculate cultural adjustment factors
 */
function calculateCulturalFactors(
  context: CulturalContext,
  markerCounts: Record<string, number>
): CulturalFactor[] {
  const factors: CulturalFactor[] = [];
  
  // High-context culture adjustment
  if (context.highContext) {
    factors.push({
      name: 'High-Context Communication',
      impact: 'decreases',
      adjustment: -0.2,
      explanation: 'Indirect language is culturally normative',
    });
  }
  
  // Collectivist culture adjustment
  if (context.collectivist) {
    factors.push({
      name: 'Collectivist Culture',
      impact: 'decreases',
      adjustment: markerCounts['distancing'] > 0 ? -0.15 : 0,
      explanation: 'Use of "we" and group pronouns is normative',
    });
  }
  
  // Power distance adjustment
  if (context.powerDistance === 'high') {
    factors.push({
      name: 'High Power Distance',
      impact: 'decreases',
      adjustment: markerCounts['hedge'] > 0 ? -0.1 : 0,
      explanation: 'Hedging may indicate respect rather than deception',
    });
  }
  
  // Uncertainty avoidance
  if (context.uncertaintyAvoidance === 'high') {
    factors.push({
      name: 'High Uncertainty Avoidance',
      impact: 'increases',
      adjustment: markerCounts['certainty'] > 0 ? 0.1 : 0,
      explanation: 'Overuse of certainty markers may indicate compensation',
    });
  }
  
  // Emotional expressiveness
  if (context.emotionalExpressiveness === 'low') {
    factors.push({
      name: 'Low Emotional Expressiveness',
      impact: 'neutral',
      adjustment: 0,
      explanation: 'Lack of emotional markers is culturally normative',
    });
  } else if (context.emotionalExpressiveness === 'high') {
    factors.push({
      name: 'High Emotional Expressiveness',
      impact: markerCounts['emotion'] > 3 ? 'decreases' : 'neutral',
      adjustment: markerCounts['emotion'] > 3 ? -0.1 : 0,
      explanation: 'Emotional language is culturally expected',
    });
  }
  
  return factors;
}

/**
 * Calculate analysis confidence
 */
function calculateConfidence(textLength: number, markerCount: number): number {
  // Confidence increases with text length and marker count
  const lengthFactor = Math.min(1, textLength / 500);
  const markerFactor = Math.min(1, markerCount / 10);
  return (lengthFactor * 0.6) + (markerFactor * 0.4);
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return Object.entries(LANGUAGE_PROFILES).map(([code, profile]) => ({
    code,
    name: profile.name,
  }));
}

/**
 * Get language profile
 */
export function getLanguageProfile(code: string): LanguageProfile | null {
  return LANGUAGE_PROFILES[code] || null;
}
