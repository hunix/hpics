/**
 * Voice Stress Analysis Engine
 * 
 * Analyzes voice patterns for stress indicators, deception markers,
 * and emotional state assessment based on acoustic analysis.
 */

export interface VoiceAnalysisInput {
  pitchData: Array<{ value: number; timestamp: number }>;
  amplitudeData: Array<{ value: number; timestamp: number }>;
  speechRate: number; // words per minute
  pauseData: Array<{ duration: number; timestamp: number }>;
  fillerWords: Array<{ word: string; timestamp: number }>;
  transcription?: string;
}

export interface VoiceStressMarker {
  id: string;
  type: 'pitch' | 'tremor' | 'pace' | 'pause' | 'filler' | 'breathing';
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  timestamp: number;
  description: string;
  deceptionCorrelation: number; // 0-1
}

export interface VoiceBaseline {
  averagePitch: number;
  pitchVariance: number;
  averageAmplitude: number;
  speechRate: number;
  pauseFrequency: number;
  fillerFrequency: number;
  jitterNorm: number;
  shimmerNorm: number;
}

export interface VoiceEmotionalState {
  primaryEmotion: string;
  intensity: number;
  confidence: number;
  arousal: number;    // 0-1 (calm to excited)
  valence: number;    // -1 to 1 (negative to positive)
}

export interface VoiceDeceptionAnalysis {
  overallRisk: number;
  stressIndicators: VoiceStressMarker[];
  baselineDeviation: number;
  cognitiveLoadScore: number;
  emotionalLeakage: string[];
  recommendations: string[];
}

// Voice stress thresholds based on research
const STRESS_THRESHOLDS = {
  pitchIncrease: 1.15,     // 15% increase indicates stress
  pitchVarianceIncrease: 1.3,  // 30% increase in variance
  speechRateDecrease: 0.85,    // 15% slowdown
  pauseIncrease: 1.5,      // 50% more pauses
  fillerIncrease: 2.0,     // Double filler words
  tremorThreshold: 8       // Hz - micro-tremor frequency
};

// Filler word categories
const FILLER_CATEGORIES = {
  hesitation: ['um', 'uh', 'er', 'ah', 'hmm'],
  buying_time: ['well', 'so', 'you know', 'i mean', 'like'],
  qualification: ['basically', 'actually', 'honestly', 'frankly', 'truthfully'],
  distancing: ['kind of', 'sort of', 'maybe', 'perhaps', 'possibly']
};

/**
 * Analyze pitch patterns for stress indicators
 */
export function analyzePitchStress(
  pitchData: Array<{ value: number; timestamp: number }>,
  baseline: VoiceBaseline
): VoiceStressMarker[] {
  const markers: VoiceStressMarker[] = [];
  
  if (pitchData.length < 5) return markers;
  
  // Calculate current pitch statistics
  const pitchValues = pitchData.map(p => p.value);
  const avgPitch = pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length;
  const pitchVariance = calculateVariance(pitchValues);
  
  // Check for overall pitch elevation
  const pitchRatio = avgPitch / baseline.averagePitch;
  if (pitchRatio > STRESS_THRESHOLDS.pitchIncrease) {
    markers.push({
      id: `pitch_elevated_${Date.now()}`,
      type: 'pitch',
      severity: pitchRatio > 1.25 ? 'high' : 'medium',
      confidence: Math.min(1, (pitchRatio - 1) * 2),
      timestamp: pitchData[0].timestamp,
      description: `Pitch elevated ${Math.round((pitchRatio - 1) * 100)}% above baseline`,
      deceptionCorrelation: 0.6
    });
  }
  
  // Check for increased pitch variability
  const varianceRatio = pitchVariance / baseline.pitchVariance;
  if (varianceRatio > STRESS_THRESHOLDS.pitchVarianceIncrease) {
    markers.push({
      id: `pitch_variance_${Date.now()}`,
      type: 'pitch',
      severity: varianceRatio > 1.6 ? 'high' : 'medium',
      confidence: Math.min(1, (varianceRatio - 1) * 1.5),
      timestamp: pitchData[0].timestamp,
      description: `Pitch variability increased ${Math.round((varianceRatio - 1) * 100)}%`,
      deceptionCorrelation: 0.55
    });
  }
  
  // Detect pitch spikes (sudden changes)
  for (let i = 1; i < pitchData.length; i++) {
    const change = Math.abs(pitchData[i].value - pitchData[i-1].value) / baseline.averagePitch;
    if (change > 0.2) { // 20% sudden change
      markers.push({
        id: `pitch_spike_${i}`,
        type: 'pitch',
        severity: change > 0.35 ? 'high' : 'medium',
        confidence: Math.min(1, change * 2),
        timestamp: pitchData[i].timestamp,
        description: `Sudden pitch ${pitchData[i].value > pitchData[i-1].value ? 'rise' : 'drop'}`,
        deceptionCorrelation: 0.65
      });
    }
  }
  
  return markers;
}

/**
 * Analyze voice tremor (micro-tremors indicate stress)
 */
export function analyzeTremor(
  amplitudeData: Array<{ value: number; timestamp: number }>
): VoiceStressMarker[] {
  const markers: VoiceStressMarker[] = [];
  
  if (amplitudeData.length < 10) return markers;
  
  // Simple FFT-like analysis for tremor frequency
  const amplitudes = amplitudeData.map(a => a.value);
  const firstDerivative = [];
  for (let i = 1; i < amplitudes.length; i++) {
    firstDerivative.push(amplitudes[i] - amplitudes[i-1]);
  }
  
  // Count zero crossings to estimate tremor frequency
  let zeroCrossings = 0;
  for (let i = 1; i < firstDerivative.length; i++) {
    if ((firstDerivative[i] >= 0) !== (firstDerivative[i-1] >= 0)) {
      zeroCrossings++;
    }
  }
  
  const duration = (amplitudeData[amplitudeData.length - 1].timestamp - amplitudeData[0].timestamp) / 1000;
  const estimatedFrequency = (zeroCrossings / 2) / duration;
  
  // Micro-tremor frequency around 8-12 Hz indicates stress
  if (estimatedFrequency >= 6 && estimatedFrequency <= 14) {
    const severity = estimatedFrequency >= STRESS_THRESHOLDS.tremorThreshold ? 'high' : 'medium';
    markers.push({
      id: `tremor_${Date.now()}`,
      type: 'tremor',
      severity,
      confidence: 0.7,
      timestamp: amplitudeData[0].timestamp,
      description: `Voice tremor detected at ~${Math.round(estimatedFrequency)}Hz`,
      deceptionCorrelation: 0.75
    });
  }
  
  return markers;
}

/**
 * Analyze speech pace and pauses
 */
export function analyzePaceAndPauses(
  speechRate: number,
  pauseData: Array<{ duration: number; timestamp: number }>,
  baseline: VoiceBaseline
): VoiceStressMarker[] {
  const markers: VoiceStressMarker[] = [];
  
  // Check speech rate
  const rateRatio = speechRate / baseline.speechRate;
  
  if (rateRatio < STRESS_THRESHOLDS.speechRateDecrease) {
    markers.push({
      id: `pace_slow_${Date.now()}`,
      type: 'pace',
      severity: rateRatio < 0.7 ? 'high' : 'medium',
      confidence: Math.min(1, (1 - rateRatio) * 2),
      timestamp: Date.now(),
      description: `Speaking ${Math.round((1 - rateRatio) * 100)}% slower than baseline`,
      deceptionCorrelation: 0.5
    });
  } else if (rateRatio > 1.3) {
    markers.push({
      id: `pace_fast_${Date.now()}`,
      type: 'pace',
      severity: rateRatio > 1.5 ? 'high' : 'medium',
      confidence: Math.min(1, (rateRatio - 1) * 1.5),
      timestamp: Date.now(),
      description: `Speaking ${Math.round((rateRatio - 1) * 100)}% faster than baseline`,
      deceptionCorrelation: 0.45
    });
  }
  
  // Analyze pauses
  if (pauseData.length > 0) {
    const avgPauseDuration = pauseData.reduce((sum, p) => sum + p.duration, 0) / pauseData.length;
    
    // Long pauses (cognitive load)
    const longPauses = pauseData.filter(p => p.duration > 2000);
    if (longPauses.length > 0) {
      markers.push({
        id: `pause_long_${Date.now()}`,
        type: 'pause',
        severity: longPauses.length > 3 ? 'high' : 'medium',
        confidence: Math.min(1, longPauses.length * 0.2),
        timestamp: longPauses[0].timestamp,
        description: `${longPauses.length} extended pause(s) detected (cognitive load indicator)`,
        deceptionCorrelation: 0.6
      });
    }
    
    // Unusual pause patterns
    const pauseFrequency = pauseData.length / (baseline.pauseFrequency || 1);
    if (pauseFrequency > STRESS_THRESHOLDS.pauseIncrease) {
      markers.push({
        id: `pause_freq_${Date.now()}`,
        type: 'pause',
        severity: pauseFrequency > 2 ? 'high' : 'medium',
        confidence: Math.min(1, (pauseFrequency - 1) * 0.5),
        timestamp: pauseData[0].timestamp,
        description: `Pause frequency ${Math.round(pauseFrequency * 100)}% higher than baseline`,
        deceptionCorrelation: 0.55
      });
    }
  }
  
  return markers;
}

/**
 * Analyze filler words and verbal tics
 */
export function analyzeFillers(
  fillerWords: Array<{ word: string; timestamp: number }>,
  transcriptionLength: number,
  baseline: VoiceBaseline
): VoiceStressMarker[] {
  const markers: VoiceStressMarker[] = [];
  
  if (fillerWords.length === 0) return markers;
  
  // Calculate filler frequency
  const fillerRate = fillerWords.length / Math.max(1, transcriptionLength / 100); // per 100 words
  const fillerRatio = fillerRate / (baseline.fillerFrequency || 1);
  
  if (fillerRatio > STRESS_THRESHOLDS.fillerIncrease) {
    markers.push({
      id: `filler_increase_${Date.now()}`,
      type: 'filler',
      severity: fillerRatio > 3 ? 'high' : 'medium',
      confidence: Math.min(1, (fillerRatio - 1) * 0.4),
      timestamp: fillerWords[0].timestamp,
      description: `Filler word usage ${Math.round((fillerRatio - 1) * 100)}% above baseline`,
      deceptionCorrelation: 0.5
    });
  }
  
  // Categorize fillers
  const categoryCounts: Record<string, number> = {
    hesitation: 0,
    buying_time: 0,
    qualification: 0,
    distancing: 0
  };
  
  for (const filler of fillerWords) {
    const word = filler.word.toLowerCase();
    for (const [category, words] of Object.entries(FILLER_CATEGORIES)) {
      if (words.some(w => word.includes(w))) {
        categoryCounts[category]++;
      }
    }
  }
  
  // High qualification words (honestly, frankly, truthfully)
  if (categoryCounts.qualification > 2) {
    markers.push({
      id: `filler_qualification_${Date.now()}`,
      type: 'filler',
      severity: categoryCounts.qualification > 4 ? 'high' : 'medium',
      confidence: 0.7,
      timestamp: fillerWords[0].timestamp,
      description: `Excessive truth-assertion phrases (${categoryCounts.qualification}x) - potential overcompensation`,
      deceptionCorrelation: 0.75
    });
  }
  
  // High distancing language
  if (categoryCounts.distancing > 3) {
    markers.push({
      id: `filler_distancing_${Date.now()}`,
      type: 'filler',
      severity: 'medium',
      confidence: 0.65,
      timestamp: fillerWords[0].timestamp,
      description: `Distancing language pattern detected (${categoryCounts.distancing} instances)`,
      deceptionCorrelation: 0.6
    });
  }
  
  return markers;
}

/**
 * Estimate emotional state from voice features
 */
export function estimateEmotionalState(
  pitchData: Array<{ value: number; timestamp: number }>,
  speechRate: number,
  baseline: VoiceBaseline
): VoiceEmotionalState {
  const pitchValues = pitchData.map(p => p.value);
  const avgPitch = pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length;
  const pitchVariance = calculateVariance(pitchValues);
  
  // Calculate arousal (based on pitch and rate)
  const pitchArousal = (avgPitch / baseline.averagePitch - 0.8) / 0.4; // Normalize around baseline
  const rateArousal = (speechRate / baseline.speechRate - 0.8) / 0.4;
  const arousal = Math.max(0, Math.min(1, (pitchArousal + rateArousal) / 2));
  
  // Estimate valence (harder without more features)
  // High pitch variance often indicates negative emotions
  const varianceRatio = pitchVariance / baseline.pitchVariance;
  const valence = varianceRatio > 1.3 ? -0.3 : varianceRatio < 0.8 ? 0.3 : 0;
  
  // Determine primary emotion
  let primaryEmotion = 'neutral';
  if (arousal > 0.7 && valence > 0) primaryEmotion = 'excitement';
  else if (arousal > 0.7 && valence < 0) primaryEmotion = 'anger';
  else if (arousal < 0.3 && valence < 0) primaryEmotion = 'sadness';
  else if (arousal > 0.5 && valence < -0.2) primaryEmotion = 'anxiety';
  else if (arousal < 0.4 && valence > 0) primaryEmotion = 'calm';
  
  return {
    primaryEmotion,
    intensity: arousal,
    confidence: 0.6, // Voice-only emotion detection has moderate confidence
    arousal,
    valence
  };
}

/**
 * Perform comprehensive voice deception analysis
 */
export function analyzeVoiceDeception(
  input: VoiceAnalysisInput,
  baseline: VoiceBaseline
): VoiceDeceptionAnalysis {
  const allMarkers: VoiceStressMarker[] = [];
  
  // Gather all stress markers
  allMarkers.push(...analyzePitchStress(input.pitchData, baseline));
  allMarkers.push(...analyzeTremor(input.amplitudeData));
  allMarkers.push(...analyzePaceAndPauses(input.speechRate, input.pauseData, baseline));
  allMarkers.push(
    ...analyzeFillers(
      input.fillerWords, 
      input.transcription?.split(/\s+/).length || 100,
      baseline
    )
  );
  
  // Calculate overall risk
  const avgDeceptionCorrelation = allMarkers.length > 0
    ? allMarkers.reduce((sum, m) => sum + m.deceptionCorrelation * m.confidence, 0) / allMarkers.length
    : 0;
  
  // Cognitive load score (based on pauses and fillers)
  const pauseMarkers = allMarkers.filter(m => m.type === 'pause');
  const fillerMarkers = allMarkers.filter(m => m.type === 'filler');
  const cognitiveLoadScore = Math.min(1, 
    (pauseMarkers.length * 0.3 + fillerMarkers.length * 0.2)
  );
  
  // Baseline deviation
  const pitchValues = input.pitchData.map(p => p.value);
  const avgPitch = pitchValues.length > 0 
    ? pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length 
    : baseline.averagePitch;
  const pitchDeviation = Math.abs(avgPitch - baseline.averagePitch) / baseline.averagePitch;
  const rateDeviation = Math.abs(input.speechRate - baseline.speechRate) / baseline.speechRate;
  const baselineDeviation = (pitchDeviation + rateDeviation) / 2;
  
  // Emotional leakage detection
  const emotionalLeakage: string[] = [];
  const highSeverityMarkers = allMarkers.filter(m => m.severity === 'high');
  if (highSeverityMarkers.length > 2) {
    emotionalLeakage.push('Multiple high-stress indicators suggest emotional distress');
  }
  if (allMarkers.some(m => m.type === 'tremor')) {
    emotionalLeakage.push('Voice tremor indicates autonomic nervous system activation');
  }
  if (allMarkers.some(m => m.description.includes('truth-assertion'))) {
    emotionalLeakage.push('Overuse of truth-asserting phrases may indicate compensatory behavior');
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (avgDeceptionCorrelation > 0.6) {
    recommendations.push('High deception risk - verify statements through other channels');
  }
  if (cognitiveLoadScore > 0.6) {
    recommendations.push('High cognitive load detected - may indicate fabrication or stress');
  }
  if (baselineDeviation > 0.3) {
    recommendations.push('Significant deviation from normal speaking patterns');
  }
  if (allMarkers.length === 0) {
    recommendations.push('No significant stress markers - appears consistent with normal speech');
  }
  
  return {
    overallRisk: avgDeceptionCorrelation,
    stressIndicators: allMarkers,
    baselineDeviation,
    cognitiveLoadScore,
    emotionalLeakage,
    recommendations
  };
}

/**
 * Build voice baseline from historical samples
 */
export function buildVoiceBaseline(
  samples: VoiceAnalysisInput[]
): VoiceBaseline {
  if (samples.length === 0) {
    return {
      averagePitch: 150, // Default values
      pitchVariance: 20,
      averageAmplitude: 0.5,
      speechRate: 130,
      pauseFrequency: 3,
      fillerFrequency: 2,
      jitterNorm: 0.01,
      shimmerNorm: 0.03
    };
  }
  
  const allPitches: number[] = [];
  const allAmplitudes: number[] = [];
  const allSpeechRates: number[] = [];
  let totalPauses = 0;
  let totalFillers = 0;
  
  for (const sample of samples) {
    allPitches.push(...sample.pitchData.map(p => p.value));
    allAmplitudes.push(...sample.amplitudeData.map(a => a.value));
    allSpeechRates.push(sample.speechRate);
    totalPauses += sample.pauseData.length;
    totalFillers += sample.fillerWords.length;
  }
  
  return {
    averagePitch: allPitches.reduce((a, b) => a + b, 0) / allPitches.length,
    pitchVariance: calculateVariance(allPitches),
    averageAmplitude: allAmplitudes.reduce((a, b) => a + b, 0) / allAmplitudes.length,
    speechRate: allSpeechRates.reduce((a, b) => a + b, 0) / allSpeechRates.length,
    pauseFrequency: totalPauses / samples.length,
    fillerFrequency: totalFillers / samples.length,
    jitterNorm: 0.01, // Would need actual jitter calculation
    shimmerNorm: 0.03 // Would need actual shimmer calculation
  };
}

// Utility function
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

export default {
  analyzePitchStress,
  analyzeTremor,
  analyzePaceAndPauses,
  analyzeFillers,
  estimateEmotionalState,
  analyzeVoiceDeception,
  buildVoiceBaseline
};
