/**
 * Advanced Micro-Expression Analysis System
 * Based on FACS (Facial Action Coding System) and Ekman's research
 */

export interface ActionUnit {
  id: number;
  name: string;
  muscle: string;
  intensity: number; // 0-5 (A-E scale)
  detected: boolean;
  asymmetry: number; // 0-1, higher = more asymmetrical
  duration_ms: number;
}

export interface MicroExpression {
  emotion: string;
  confidence: number;
  duration_ms: number;
  action_units: number[];
  is_genuine: boolean;
  is_concealed: boolean;
  leakage_indicators: string[];
}

export interface DeceptionSignal {
  signal_type: string;
  description: string;
  confidence: number;
  visual_evidence: string;
}

export interface ExpressionAnalysisResult {
  dominant_emotion: string;
  emotion_confidence: number;
  micro_expressions: MicroExpression[];
  deception_signals: DeceptionSignal[];
  authenticity_score: number;
  concealment_detected: boolean;
  reliable_muscle_analysis: ReliableMuscleIndicators;
  asymmetry_analysis: AsymmetryAnalysis;
}

export interface ReliableMuscleIndicators {
  orbicularis_oculi: number; // Duchenne marker - genuine smile
  corrugator_supercilii: number; // Frown/distress
  frontalis: number; // Surprise/fear
  zygomaticus_major: number; // Smile
  depressor_anguli_oris: number; // Sadness
  overall_reliability: number;
}

export interface AsymmetryAnalysis {
  left_right_difference: number;
  indicates_deception: boolean;
  affected_regions: string[];
  interpretation: string;
}

// FACS Action Unit definitions
const ACTION_UNITS: Record<number, { name: string; muscle: string; emotion_indicators: string[] }> = {
  1: { name: 'Inner Brow Raiser', muscle: 'Frontalis (medial)', emotion_indicators: ['sadness', 'fear', 'surprise'] },
  2: { name: 'Outer Brow Raiser', muscle: 'Frontalis (lateral)', emotion_indicators: ['surprise', 'fear'] },
  4: { name: 'Brow Lowerer', muscle: 'Corrugator supercilii', emotion_indicators: ['anger', 'sadness', 'confusion'] },
  5: { name: 'Upper Lid Raiser', muscle: 'Levator palpebrae', emotion_indicators: ['fear', 'surprise', 'anger'] },
  6: { name: 'Cheek Raiser', muscle: 'Orbicularis oculi', emotion_indicators: ['happiness', 'genuine_smile'] },
  7: { name: 'Lid Tightener', muscle: 'Orbicularis oculi', emotion_indicators: ['anger', 'concentration'] },
  9: { name: 'Nose Wrinkler', muscle: 'Levator labii superioris', emotion_indicators: ['disgust'] },
  10: { name: 'Upper Lip Raiser', muscle: 'Levator labii superioris', emotion_indicators: ['disgust', 'sadness'] },
  12: { name: 'Lip Corner Puller', muscle: 'Zygomaticus major', emotion_indicators: ['happiness', 'contempt'] },
  14: { name: 'Dimpler', muscle: 'Buccinator', emotion_indicators: ['contempt', 'doubt'] },
  15: { name: 'Lip Corner Depressor', muscle: 'Depressor anguli oris', emotion_indicators: ['sadness', 'fear'] },
  17: { name: 'Chin Raiser', muscle: 'Mentalis', emotion_indicators: ['doubt', 'sadness'] },
  20: { name: 'Lip Stretcher', muscle: 'Risorius', emotion_indicators: ['fear'] },
  23: { name: 'Lip Tightener', muscle: 'Orbicularis oris', emotion_indicators: ['anger'] },
  24: { name: 'Lip Pressor', muscle: 'Orbicularis oris', emotion_indicators: ['anger', 'determination'] },
  25: { name: 'Lips Part', muscle: 'Depressor labii', emotion_indicators: ['surprise', 'fear'] },
  26: { name: 'Jaw Drop', muscle: 'Masseter relaxed', emotion_indicators: ['surprise', 'fear'] },
  27: { name: 'Mouth Stretch', muscle: 'Pterygoids', emotion_indicators: ['fear', 'surprise'] }
};

// Emotion prototypes based on AU combinations
const EMOTION_PROTOTYPES: Record<string, number[][]> = {
  happiness: [[6, 12], [12]], // Genuine smile requires AU6
  sadness: [[1, 4, 15], [1, 15], [4, 15, 17]],
  surprise: [[1, 2, 5, 26], [1, 2, 26], [5, 26]],
  fear: [[1, 2, 4, 5, 20, 26], [1, 4, 5, 20], [5, 20, 26]],
  anger: [[4, 5, 7, 23], [4, 5, 7, 24], [4, 7, 23]],
  disgust: [[9, 10, 17], [9, 10], [10, 17]],
  contempt: [[12, 14]], // Unilateral
  neutral: [[]]
};

export function analyzeActionUnits(facialData: any): ActionUnit[] {
  // In production, this would use ML model output
  // For now, simulating detection based on facial landmark positions
  const detectedAUs: ActionUnit[] = [];
  
  Object.entries(ACTION_UNITS).forEach(([id, info]) => {
    // Simulate AU detection with probabilistic output
    const detected = Math.random() > 0.7; // Would be replaced by actual detection
    const intensity = detected ? Math.floor(Math.random() * 5) + 1 : 0;
    const asymmetry = Math.random() * 0.3; // Most AUs should be symmetrical
    
    detectedAUs.push({
      id: parseInt(id),
      name: info.name,
      muscle: info.muscle,
      intensity,
      detected,
      asymmetry,
      duration_ms: detected ? Math.floor(Math.random() * 500) + 100 : 0
    });
  });
  
  return detectedAUs;
}

export function detectMicroExpressions(
  actionUnits: ActionUnit[],
  frameDuration: number = 33 // ~30fps
): MicroExpression[] {
  const microExpressions: MicroExpression[] = [];
  
  // Find AU combinations that match emotion prototypes
  const activeAUs = actionUnits.filter(au => au.detected).map(au => au.id);
  
  Object.entries(EMOTION_PROTOTYPES).forEach(([emotion, patterns]) => {
    patterns.forEach(pattern => {
      const matchCount = pattern.filter(au => activeAUs.includes(au)).length;
      const matchRatio = pattern.length > 0 ? matchCount / pattern.length : 0;
      
      if (matchRatio >= 0.7) {
        const relevantAUs = actionUnits.filter(au => pattern.includes(au.id) && au.detected);
        const avgDuration = relevantAUs.length > 0
          ? relevantAUs.reduce((sum, au) => sum + au.duration_ms, 0) / relevantAUs.length
          : 0;
        
        // Micro-expression if duration < 500ms
        const isMicro = avgDuration > 0 && avgDuration < 500;
        
        if (isMicro) {
          // Check for genuineness
          const isGenuine = checkExpressionGenuineness(emotion, relevantAUs);
          const leakage = detectLeakageIndicators(relevantAUs);
          
          microExpressions.push({
            emotion,
            confidence: matchRatio,
            duration_ms: avgDuration,
            action_units: pattern,
            is_genuine: isGenuine,
            is_concealed: avgDuration < 200, // Very short = concealment attempt
            leakage_indicators: leakage
          });
        }
      }
    });
  });
  
  return microExpressions;
}

function checkExpressionGenuineness(emotion: string, actionUnits: ActionUnit[]): boolean {
  if (emotion === 'happiness') {
    // Duchenne smile requires AU6 (orbicularis oculi activation)
    const hasAU6 = actionUnits.some(au => au.id === 6 && au.intensity >= 2);
    return hasAU6;
  }
  
  // Check for asymmetry (genuine expressions are typically symmetrical)
  const avgAsymmetry = actionUnits.reduce((sum, au) => sum + au.asymmetry, 0) / actionUnits.length;
  return avgAsymmetry < 0.25;
}

function detectLeakageIndicators(actionUnits: ActionUnit[]): string[] {
  const indicators: string[] = [];
  
  // Timing inconsistencies
  const durations = actionUnits.map(au => au.duration_ms).filter(d => d > 0);
  if (durations.length > 1) {
    const variance = calculateVariance(durations);
    if (variance > 10000) { // High variance = uncoordinated muscles
      indicators.push('Temporal desynchronization between muscle groups');
    }
  }
  
  // Asymmetry detection
  const highAsymmetry = actionUnits.filter(au => au.asymmetry > 0.3);
  if (highAsymmetry.length > 0) {
    indicators.push(`Asymmetrical activation: ${highAsymmetry.map(au => au.name).join(', ')}`);
  }
  
  // Partial expression (squelched)
  const lowIntensity = actionUnits.filter(au => au.intensity > 0 && au.intensity < 3);
  if (lowIntensity.length === actionUnits.length) {
    indicators.push('Expression appears suppressed (low intensity across all AUs)');
  }
  
  return indicators;
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

export function analyzeReliableMuscles(actionUnits: ActionUnit[]): ReliableMuscleIndicators {
  const getAUIntensity = (id: number) => {
    const au = actionUnits.find(a => a.id === id);
    return au?.detected ? au.intensity / 5 : 0;
  };
  
  return {
    orbicularis_oculi: getAUIntensity(6), // AU6 - genuine happiness indicator
    corrugator_supercilii: getAUIntensity(4), // AU4 - distress
    frontalis: Math.max(getAUIntensity(1), getAUIntensity(2)), // AU1/2 - surprise
    zygomaticus_major: getAUIntensity(12), // AU12 - smile
    depressor_anguli_oris: getAUIntensity(15), // AU15 - sadness
    overall_reliability: 0.75 // Would be calculated from detection confidence
  };
}

export function analyzeAsymmetry(actionUnits: ActionUnit[]): AsymmetryAnalysis {
  const activeAUs = actionUnits.filter(au => au.detected);
  const asymmetricAUs = activeAUs.filter(au => au.asymmetry > 0.25);
  
  const avgAsymmetry = activeAUs.length > 0
    ? activeAUs.reduce((sum, au) => sum + au.asymmetry, 0) / activeAUs.length
    : 0;
  
  return {
    left_right_difference: avgAsymmetry,
    indicates_deception: avgAsymmetry > 0.3,
    affected_regions: asymmetricAUs.map(au => au.name),
    interpretation: avgAsymmetry > 0.3
      ? 'Significant asymmetry suggests posed rather than genuine expression'
      : avgAsymmetry > 0.15
        ? 'Mild asymmetry detected - monitor for consistency'
        : 'Symmetrical expression consistent with genuine emotion'
  };
}

export function detectDeceptionSignals(
  microExpressions: MicroExpression[],
  actionUnits: ActionUnit[]
): DeceptionSignal[] {
  const signals: DeceptionSignal[] = [];
  
  // Duper's delight - micro-smile during serious statement
  const microSmiles = microExpressions.filter(me => 
    me.emotion === 'happiness' && me.duration_ms < 200
  );
  if (microSmiles.length > 0) {
    signals.push({
      signal_type: 'Dupers Delight',
      description: 'Brief micro-smile detected during non-positive content',
      confidence: 0.75,
      visual_evidence: 'Fleeting AU12 activation with rapid suppression'
    });
  }
  
  // Concealed contempt
  const contemptIndicators = microExpressions.filter(me => 
    me.emotion === 'contempt' && me.is_concealed
  );
  if (contemptIndicators.length > 0) {
    signals.push({
      signal_type: 'Concealed Contempt',
      description: 'Suppressed unilateral lip corner raise detected',
      confidence: 0.8,
      visual_evidence: 'Brief AU14 with asymmetrical presentation'
    });
  }
  
  // Fear leakage during confident statement
  const fearLeakage = microExpressions.filter(me => 
    me.emotion === 'fear' && me.duration_ms < 300
  );
  if (fearLeakage.length > 0) {
    signals.push({
      signal_type: 'Fear Leakage',
      description: 'Micro-fear expression inconsistent with verbal confidence',
      confidence: 0.7,
      visual_evidence: 'Brief AU1+2+5 combination with rapid neutralization'
    });
  }
  
  // Squelched expression
  const squelched = microExpressions.filter(me => 
    me.leakage_indicators.some(li => li.includes('suppressed'))
  );
  if (squelched.length > 0) {
    signals.push({
      signal_type: 'Squelched Expression',
      description: 'Expression appears deliberately interrupted',
      confidence: 0.65,
      visual_evidence: 'Partial AU activation with abrupt termination'
    });
  }
  
  return signals;
}

export function performFullAnalysis(facialData: any): ExpressionAnalysisResult {
  const actionUnits = analyzeActionUnits(facialData);
  const microExpressions = detectMicroExpressions(actionUnits);
  const deceptionSignals = detectDeceptionSignals(microExpressions, actionUnits);
  const reliableMuscles = analyzeReliableMuscles(actionUnits);
  const asymmetry = analyzeAsymmetry(actionUnits);
  
  // Determine dominant emotion
  const emotionCounts: Record<string, number> = {};
  microExpressions.forEach(me => {
    emotionCounts[me.emotion] = (emotionCounts[me.emotion] || 0) + me.confidence;
  });
  
  const dominantEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  
  // Calculate authenticity score
  const genuineExpressions = microExpressions.filter(me => me.is_genuine).length;
  const authenticity = microExpressions.length > 0
    ? genuineExpressions / microExpressions.length
    : 0.5;
  
  return {
    dominant_emotion: dominantEmotion,
    emotion_confidence: emotionCounts[dominantEmotion] || 0,
    micro_expressions: microExpressions,
    deception_signals: deceptionSignals,
    authenticity_score: authenticity * (1 - asymmetry.left_right_difference),
    concealment_detected: microExpressions.some(me => me.is_concealed),
    reliable_muscle_analysis: reliableMuscles,
    asymmetry_analysis: asymmetry
  };
}
