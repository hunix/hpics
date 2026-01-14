/**
 * Micro-Expression Analysis Engine
 * 
 * Analyzes facial micro-expressions for emotion detection and deception indicators.
 * Based on Paul Ekman's FACS (Facial Action Coding System) research.
 */

// Action Unit definitions based on FACS
export interface ActionUnit {
  id: string;
  name: string;
  muscleGroup: string;
  intensity: number; // 0-5 (A-E in FACS)
  timestamp: number;
  duration: number;
}

export interface MicroExpressionEvent {
  id: string;
  timestamp: number;
  duration: number; // ms - micro expressions < 500ms
  emotion: EmotionType;
  confidence: number;
  actionUnits: ActionUnit[];
  isAuthentic: boolean;
  deceptionRisk: number;
  interpretation: string;
}

export type EmotionType = 
  | 'happiness' 
  | 'sadness' 
  | 'anger' 
  | 'fear' 
  | 'disgust' 
  | 'surprise' 
  | 'contempt'
  | 'neutral';

export interface EmotionBaseline {
  emotion: EmotionType;
  averageIntensity: number;
  frequency: number;
  typicalDuration: number;
  associatedActionUnits: string[];
}

export interface DeceptionIndicator {
  type: string;
  confidence: number;
  evidence: string;
  timestamp: number;
}

// FACS Action Units mapping
const ACTION_UNIT_DEFINITIONS: Record<string, { name: string; muscle: string; emotionLinks: EmotionType[] }> = {
  'AU1': { name: 'Inner Brow Raiser', muscle: 'Frontalis pars medialis', emotionLinks: ['sadness', 'fear', 'surprise'] },
  'AU2': { name: 'Outer Brow Raiser', muscle: 'Frontalis pars lateralis', emotionLinks: ['surprise', 'fear'] },
  'AU4': { name: 'Brow Lowerer', muscle: 'Corrugator supercilii', emotionLinks: ['anger', 'sadness', 'fear'] },
  'AU5': { name: 'Upper Lid Raiser', muscle: 'Levator palpebrae superioris', emotionLinks: ['fear', 'surprise', 'anger'] },
  'AU6': { name: 'Cheek Raiser', muscle: 'Orbicularis oculi pars orbitalis', emotionLinks: ['happiness'] }, // Duchenne marker
  'AU7': { name: 'Lid Tightener', muscle: 'Orbicularis oculi pars palpebralis', emotionLinks: ['anger', 'fear'] },
  'AU9': { name: 'Nose Wrinkler', muscle: 'Levator labii superioris alaeque nasi', emotionLinks: ['disgust'] },
  'AU10': { name: 'Upper Lip Raiser', muscle: 'Levator labii superioris', emotionLinks: ['disgust', 'sadness'] },
  'AU12': { name: 'Lip Corner Puller', muscle: 'Zygomaticus major', emotionLinks: ['happiness'] },
  'AU14': { name: 'Dimpler', muscle: 'Buccinator', emotionLinks: ['contempt'] },
  'AU15': { name: 'Lip Corner Depressor', muscle: 'Depressor anguli oris', emotionLinks: ['sadness', 'fear'] },
  'AU16': { name: 'Lower Lip Depressor', muscle: 'Depressor labii inferioris', emotionLinks: ['disgust', 'sadness'] },
  'AU17': { name: 'Chin Raiser', muscle: 'Mentalis', emotionLinks: ['sadness', 'fear'] },
  'AU20': { name: 'Lip Stretcher', muscle: 'Risorius', emotionLinks: ['fear'] },
  'AU23': { name: 'Lip Tightener', muscle: 'Orbicularis oris', emotionLinks: ['anger'] },
  'AU24': { name: 'Lip Pressor', muscle: 'Orbicularis oris', emotionLinks: ['anger'] }, // Information withholding
  'AU25': { name: 'Lips Part', muscle: 'Depressor labii inferioris', emotionLinks: ['surprise', 'fear'] },
  'AU26': { name: 'Jaw Drop', muscle: 'Masseter', emotionLinks: ['surprise', 'fear'] },
  'AU27': { name: 'Mouth Stretch', muscle: 'Pterygoids', emotionLinks: ['fear', 'surprise'] },
  'AU43': { name: 'Eyes Closed', muscle: 'Orbicularis oculi', emotionLinks: ['sadness'] },
};

// Emotion detection patterns based on AU combinations
const EMOTION_AU_PATTERNS: Record<EmotionType, { required: string[]; supporting: string[] }> = {
  happiness: {
    required: ['AU12'],
    supporting: ['AU6', 'AU25'] // AU6 = genuine smile (Duchenne)
  },
  sadness: {
    required: ['AU1', 'AU15'],
    supporting: ['AU4', 'AU17', 'AU43']
  },
  anger: {
    required: ['AU4', 'AU7'],
    supporting: ['AU5', 'AU23', 'AU24']
  },
  fear: {
    required: ['AU1', 'AU2', 'AU5'],
    supporting: ['AU20', 'AU25', 'AU26']
  },
  disgust: {
    required: ['AU9'],
    supporting: ['AU10', 'AU16', 'AU25']
  },
  surprise: {
    required: ['AU1', 'AU2', 'AU5', 'AU26'],
    supporting: ['AU25', 'AU27']
  },
  contempt: {
    required: ['AU14'],
    supporting: ['AU12'] // Unilateral
  },
  neutral: {
    required: [],
    supporting: []
  }
};

// Deception-related AU patterns
const DECEPTION_PATTERNS = {
  suppressedEmotion: {
    pattern: ['partial_AU_activation', 'asymmetry', 'brief_duration'],
    weight: 0.8
  },
  forcedSmile: {
    pattern: ['AU12_without_AU6'], // Smile without Duchenne marker
    weight: 0.7
  },
  delayedExpression: {
    pattern: ['expression_onset_>500ms'],
    weight: 0.6
  },
  prolongedExpression: {
    pattern: ['expression_duration_>4s'],
    weight: 0.5
  },
  asymmetry: {
    pattern: ['unilateral_expression_non_contempt'],
    weight: 0.7
  },
  incongruence: {
    pattern: ['verbal_emotion_mismatch'],
    weight: 0.9
  }
};

/**
 * Detect emotion from action units
 */
export function detectEmotionFromAUs(
  actionUnits: ActionUnit[]
): { emotion: EmotionType; confidence: number; isAuthentic: boolean } {
  const auIds = new Set(actionUnits.map(au => au.id));
  let bestMatch: EmotionType = 'neutral';
  let bestScore = 0;
  let isAuthentic = true;
  
  for (const [emotion, pattern] of Object.entries(EMOTION_AU_PATTERNS) as [EmotionType, typeof EMOTION_AU_PATTERNS[EmotionType]][]) {
    const requiredCount = pattern.required.filter(au => auIds.has(au)).length;
    const supportingCount = pattern.supporting.filter(au => auIds.has(au)).length;
    
    if (requiredCount === pattern.required.length) {
      const score = requiredCount * 2 + supportingCount;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = emotion;
      }
    }
  }
  
  // Check for fake smile (happiness without AU6)
  if (bestMatch === 'happiness' && !auIds.has('AU6')) {
    isAuthentic = false;
  }
  
  // Check for asymmetry (except contempt which is naturally asymmetric)
  if (bestMatch !== 'contempt' && bestMatch !== 'neutral') {
    const intensities = actionUnits.map(au => au.intensity);
    const variance = calculateVariance(intensities);
    if (variance > 1.5) {
      isAuthentic = false;
    }
  }
  
  const confidence = bestScore > 0 ? Math.min(1, bestScore / 6) : 0.5;
  
  return { emotion: bestMatch, confidence, isAuthentic };
}

/**
 * Analyze expression timing for deception indicators
 */
export function analyzeExpressionTiming(
  expressions: MicroExpressionEvent[]
): DeceptionIndicator[] {
  const indicators: DeceptionIndicator[] = [];
  
  for (const expr of expressions) {
    // Micro-expression detection (< 500ms)
    if (expr.duration < 500 && expr.duration > 40) {
      indicators.push({
        type: 'Micro-expression detected',
        confidence: 0.8,
        evidence: `${expr.emotion} expression lasting ${expr.duration}ms - possible concealed emotion`,
        timestamp: expr.timestamp
      });
    }
    
    // Prolonged expression (> 4 seconds)
    if (expr.duration > 4000 && expr.emotion !== 'neutral') {
      indicators.push({
        type: 'Prolonged expression',
        confidence: 0.6,
        evidence: `${expr.emotion} held for ${Math.round(expr.duration / 1000)}s - possible performed emotion`,
        timestamp: expr.timestamp
      });
    }
    
    // Check for non-authentic expressions
    if (!expr.isAuthentic) {
      indicators.push({
        type: 'Inauthentic expression',
        confidence: 0.75,
        evidence: `Non-genuine ${expr.emotion} detected - missing authenticity markers`,
        timestamp: expr.timestamp
      });
    }
  }
  
  // Analyze expression sequences
  for (let i = 1; i < expressions.length; i++) {
    const prev = expressions[i - 1];
    const curr = expressions[i];
    
    // Rapid emotion switching
    if (curr.timestamp - (prev.timestamp + prev.duration) < 100) {
      if (prev.emotion !== curr.emotion) {
        indicators.push({
          type: 'Rapid emotion switch',
          confidence: 0.7,
          evidence: `Quick transition from ${prev.emotion} to ${curr.emotion}`,
          timestamp: curr.timestamp
        });
      }
    }
    
    // Incongruent emotions (happiness immediately after fear/anger)
    if (prev.emotion === 'fear' || prev.emotion === 'anger') {
      if (curr.emotion === 'happiness' && curr.timestamp - prev.timestamp < 2000) {
        indicators.push({
          type: 'Incongruent emotion sequence',
          confidence: 0.85,
          evidence: `${curr.emotion} immediately following ${prev.emotion} - possible masking`,
          timestamp: curr.timestamp
        });
      }
    }
  }
  
  return indicators;
}

/**
 * Analyze contempt expressions (asymmetric lip corner raise)
 */
export function analyzeContemptPatterns(
  expressions: MicroExpressionEvent[]
): {
  contemptFrequency: number;
  contemptTargets: string[];
  riskLevel: 'low' | 'moderate' | 'high';
} {
  const contemptExpressions = expressions.filter(e => e.emotion === 'contempt');
  const contemptFrequency = contemptExpressions.length / Math.max(1, expressions.length);
  
  let riskLevel: 'low' | 'moderate' | 'high' = 'low';
  if (contemptFrequency > 0.15) riskLevel = 'high';
  else if (contemptFrequency > 0.05) riskLevel = 'moderate';
  
  // Analyze timing to identify potential contempt triggers
  const contemptTargets: string[] = [];
  if (contemptFrequency > 0.1) {
    contemptTargets.push('Possible superiority complex');
  }
  if (contemptExpressions.some(e => e.duration > 1000)) {
    contemptTargets.push('Sustained contempt indicates deep disdain');
  }
  
  return {
    contemptFrequency,
    contemptTargets,
    riskLevel
  };
}

/**
 * Build emotion baseline from historical data
 */
export function buildEmotionBaseline(
  historicalExpressions: MicroExpressionEvent[]
): Map<EmotionType, EmotionBaseline> {
  const baselines = new Map<EmotionType, EmotionBaseline>();
  const emotionGroups: Record<EmotionType, MicroExpressionEvent[]> = {
    happiness: [],
    sadness: [],
    anger: [],
    fear: [],
    disgust: [],
    surprise: [],
    contempt: [],
    neutral: []
  };
  
  // Group by emotion
  for (const expr of historicalExpressions) {
    emotionGroups[expr.emotion].push(expr);
  }
  
  // Calculate baselines
  for (const [emotion, expressions] of Object.entries(emotionGroups) as [EmotionType, MicroExpressionEvent[]][]) {
    if (expressions.length === 0) continue;
    
    const avgIntensity = expressions.reduce((sum, e) => sum + e.confidence, 0) / expressions.length;
    const avgDuration = expressions.reduce((sum, e) => sum + e.duration, 0) / expressions.length;
    const totalDuration = historicalExpressions.length > 0 
      ? historicalExpressions[historicalExpressions.length - 1].timestamp - historicalExpressions[0].timestamp 
      : 1;
    const frequency = expressions.length / (totalDuration / 60000); // per minute
    
    const allAUs = expressions.flatMap(e => e.actionUnits.map(au => au.id));
    const auCounts = new Map<string, number>();
    for (const au of allAUs) {
      auCounts.set(au, (auCounts.get(au) || 0) + 1);
    }
    const associatedAUs = Array.from(auCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([au]) => au);
    
    baselines.set(emotion, {
      emotion,
      averageIntensity: avgIntensity,
      frequency,
      typicalDuration: avgDuration,
      associatedActionUnits: associatedAUs
    });
  }
  
  return baselines;
}

/**
 * Detect deviations from baseline (potential deception)
 */
export function detectBaselineDeviations(
  currentExpressions: MicroExpressionEvent[],
  baseline: Map<EmotionType, EmotionBaseline>
): DeceptionIndicator[] {
  const indicators: DeceptionIndicator[] = [];
  
  for (const expr of currentExpressions) {
    const emotionBaseline = baseline.get(expr.emotion);
    if (!emotionBaseline) continue;
    
    // Intensity deviation
    const intensityDeviation = Math.abs(expr.confidence - emotionBaseline.averageIntensity);
    if (intensityDeviation > 0.3) {
      indicators.push({
        type: 'Intensity deviation',
        confidence: intensityDeviation,
        evidence: `${expr.emotion} intensity ${expr.confidence > emotionBaseline.averageIntensity ? 'higher' : 'lower'} than baseline`,
        timestamp: expr.timestamp
      });
    }
    
    // Duration deviation
    const durationDeviation = Math.abs(expr.duration - emotionBaseline.typicalDuration) / emotionBaseline.typicalDuration;
    if (durationDeviation > 0.5) {
      indicators.push({
        type: 'Duration deviation',
        confidence: Math.min(1, durationDeviation),
        evidence: `${expr.emotion} duration ${expr.duration > emotionBaseline.typicalDuration ? 'longer' : 'shorter'} than typical`,
        timestamp: expr.timestamp
      });
    }
  }
  
  return indicators;
}

/**
 * Generate comprehensive micro-expression report
 */
export function generateMicroExpressionReport(
  expressions: MicroExpressionEvent[],
  baseline?: Map<EmotionType, EmotionBaseline>
): {
  summary: {
    totalExpressions: number;
    dominantEmotion: EmotionType;
    authenticityRate: number;
    deceptionRisk: number;
  };
  emotionBreakdown: Record<EmotionType, { count: number; avgConfidence: number; avgDuration: number }>;
  deceptionIndicators: DeceptionIndicator[];
  recommendations: string[];
} {
  if (expressions.length === 0) {
    return {
      summary: {
        totalExpressions: 0,
        dominantEmotion: 'neutral',
        authenticityRate: 1,
        deceptionRisk: 0
      },
      emotionBreakdown: {} as any,
      deceptionIndicators: [],
      recommendations: ['Insufficient expression data for analysis']
    };
  }
  
  // Emotion breakdown
  const emotionBreakdown: Record<EmotionType, { count: number; avgConfidence: number; avgDuration: number }> = {
    happiness: { count: 0, avgConfidence: 0, avgDuration: 0 },
    sadness: { count: 0, avgConfidence: 0, avgDuration: 0 },
    anger: { count: 0, avgConfidence: 0, avgDuration: 0 },
    fear: { count: 0, avgConfidence: 0, avgDuration: 0 },
    disgust: { count: 0, avgConfidence: 0, avgDuration: 0 },
    surprise: { count: 0, avgConfidence: 0, avgDuration: 0 },
    contempt: { count: 0, avgConfidence: 0, avgDuration: 0 },
    neutral: { count: 0, avgConfidence: 0, avgDuration: 0 }
  };
  
  for (const expr of expressions) {
    const breakdown = emotionBreakdown[expr.emotion];
    breakdown.count++;
    breakdown.avgConfidence = (breakdown.avgConfidence * (breakdown.count - 1) + expr.confidence) / breakdown.count;
    breakdown.avgDuration = (breakdown.avgDuration * (breakdown.count - 1) + expr.duration) / breakdown.count;
  }
  
  // Find dominant emotion
  let dominantEmotion: EmotionType = 'neutral';
  let maxCount = 0;
  for (const [emotion, data] of Object.entries(emotionBreakdown) as [EmotionType, typeof emotionBreakdown[EmotionType]][]) {
    if (data.count > maxCount && emotion !== 'neutral') {
      maxCount = data.count;
      dominantEmotion = emotion;
    }
  }
  
  // Calculate authenticity rate
  const authenticCount = expressions.filter(e => e.isAuthentic).length;
  const authenticityRate = authenticCount / expressions.length;
  
  // Gather deception indicators
  const timingIndicators = analyzeExpressionTiming(expressions);
  const baselineIndicators = baseline ? detectBaselineDeviations(expressions, baseline) : [];
  const allIndicators = [...timingIndicators, ...baselineIndicators];
  
  // Calculate deception risk
  const avgDeceptionConfidence = allIndicators.length > 0 
    ? allIndicators.reduce((sum, i) => sum + i.confidence, 0) / allIndicators.length 
    : 0;
  const deceptionRisk = Math.min(1, avgDeceptionConfidence * (1 - authenticityRate) * 1.5);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (deceptionRisk > 0.7) {
    recommendations.push('High deception risk detected - verify claims independently');
  }
  if (authenticityRate < 0.5) {
    recommendations.push('Many expressions appear performed - probe for genuine reactions');
  }
  if (emotionBreakdown.contempt.count > expressions.length * 0.1) {
    recommendations.push('Significant contempt detected - relationship may be at risk');
  }
  if (emotionBreakdown.fear.count > expressions.length * 0.15) {
    recommendations.push('Elevated fear responses - investigate potential stressors');
  }
  
  return {
    summary: {
      totalExpressions: expressions.length,
      dominantEmotion,
      authenticityRate,
      deceptionRisk
    },
    emotionBreakdown,
    deceptionIndicators: allIndicators,
    recommendations
  };
}

// Utility function
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

export default {
  ACTION_UNIT_DEFINITIONS,
  EMOTION_AU_PATTERNS,
  detectEmotionFromAUs,
  analyzeExpressionTiming,
  analyzeContemptPatterns,
  buildEmotionBaseline,
  detectBaselineDeviations,
  generateMicroExpressionReport
};
