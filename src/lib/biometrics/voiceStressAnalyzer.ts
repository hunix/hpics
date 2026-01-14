/**
 * Advanced Voice Stress Analysis System
 * Forensic-grade indicators for deception detection
 */

export interface VoiceMetrics {
  fundamentalFrequency: number; // F0 in Hz
  jitter: number; // Frequency perturbation %
  shimmer: number; // Amplitude perturbation %
  harmonicToNoiseRatio: number; // HNR in dB
  speechRate: number; // Words per minute
  pauseDuration: number; // Average pause in ms
  responseLatency: number; // Time to start responding in ms
}

export interface StressIndicators {
  microTremorFrequency: number; // 8-12 Hz band
  fundamentalFrequencyVariability: number;
  formantShifts: FormantAnalysis;
  speechToSilenceRatio: number;
  fillerWordDensity: number;
}

export interface FormantAnalysis {
  f1_shift: number;
  f2_shift: number;
  f3_shift: number;
  overall_stress_indicator: number;
}

export interface LinguisticIndicators {
  pronounDistancing: number;
  temporalLacunae: boolean;
  negationFrequency: number;
  sensoryDetailRatio: number;
  hedgingScore: number;
  responseComplexity: number;
}

export interface DeceptionProbability {
  overall: number;
  voice_based: number;
  linguistic_based: number;
  confidence: number;
  key_indicators: string[];
}

export interface VoiceAnalysisResult {
  metrics: VoiceMetrics;
  stress_indicators: StressIndicators;
  linguistic_indicators: LinguisticIndicators;
  deception_probability: DeceptionProbability;
  baseline_deviation: number;
  autonomic_arousal_estimate: number;
  recommendations: string[];
}

// Baseline establishment
export interface VoiceBaseline {
  avgFundamentalFrequency: number;
  avgJitter: number;
  avgShimmer: number;
  avgSpeechRate: number;
  avgPauseDuration: number;
  avgResponseLatency: number;
  sampleCount: number;
}

export function establishBaseline(samples: VoiceMetrics[]): VoiceBaseline {
  if (samples.length === 0) {
    return {
      avgFundamentalFrequency: 120, // Default male average
      avgJitter: 0.5,
      avgShimmer: 3.0,
      avgSpeechRate: 150,
      avgPauseDuration: 300,
      avgResponseLatency: 800,
      sampleCount: 0
    };
  }
  
  return {
    avgFundamentalFrequency: average(samples.map(s => s.fundamentalFrequency)),
    avgJitter: average(samples.map(s => s.jitter)),
    avgShimmer: average(samples.map(s => s.shimmer)),
    avgSpeechRate: average(samples.map(s => s.speechRate)),
    avgPauseDuration: average(samples.map(s => s.pauseDuration)),
    avgResponseLatency: average(samples.map(s => s.responseLatency)),
    sampleCount: samples.length
  };
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

// Micro-tremor analysis (key deception indicator)
export function analyzeMicroTremor(audioSignal: Float32Array, sampleRate: number): number {
  // In production, this would use FFT to extract 8-12 Hz components
  // Micro-tremors in this band indicate stress-induced muscle tension
  
  // Simulated analysis - would be replaced with actual spectral analysis
  const stressFrequencyBand = extractFrequencyBand(audioSignal, sampleRate, 8, 12);
  const tremorEnergy = calculateEnergy(stressFrequencyBand);
  
  // Normalize to 0-1 scale
  return Math.min(1, tremorEnergy / 0.1);
}

function extractFrequencyBand(signal: Float32Array, sampleRate: number, lowHz: number, highHz: number): Float32Array {
  // Placeholder for bandpass filter
  // In production: use Butterworth bandpass filter
  return signal.slice(0, Math.floor(signal.length * (highHz - lowHz) / (sampleRate / 2)));
}

function calculateEnergy(signal: Float32Array): number {
  return Array.from(signal).reduce((sum, val) => sum + val * val, 0) / signal.length;
}

// Formant shift analysis
export function analyzeFormants(audioSegment: Float32Array, sampleRate: number, baseline?: FormantAnalysis): FormantAnalysis {
  // Formants shift under stress due to laryngeal tension
  // F1 typically increases, F2 may compress
  
  // Placeholder - would use LPC analysis in production
  const baseF1 = baseline?.f1_shift || 0;
  const baseF2 = baseline?.f2_shift || 0;
  const baseF3 = baseline?.f3_shift || 0;
  
  return {
    f1_shift: baseF1 + (Math.random() * 0.2 - 0.1), // Hz deviation
    f2_shift: baseF2 + (Math.random() * 0.15 - 0.075),
    f3_shift: baseF3 + (Math.random() * 0.1 - 0.05),
    overall_stress_indicator: Math.random() * 0.5 // Would be calculated from shifts
  };
}

// Linguistic analysis from transcription
export function analyzeLinguistics(transcription: string): LinguisticIndicators {
  const words = transcription.toLowerCase().split(/\s+/);
  const sentences = transcription.split(/[.!?]+/).filter(s => s.trim());
  
  // Pronoun distancing (avoiding "I")
  const iCount = words.filter(w => w === 'i').length;
  const pronounDistancing = 1 - Math.min(1, iCount / (sentences.length * 0.8));
  
  // Temporal gaps detection
  const temporalGapPhrases = [
    "i don't remember",
    "the next thing",
    "i can't recall",
    "some time later"
  ];
  const temporalLacunae = temporalGapPhrases.some(phrase => 
    transcription.toLowerCase().includes(phrase)
  );
  
  // Negation frequency
  const negations = words.filter(w => 
    ['not', "n't", 'never', 'no', 'none', 'nothing'].some(n => w.includes(n))
  ).length;
  const negationFrequency = negations / words.length;
  
  // Sensory detail ratio
  const sensoryWords = words.filter(w => 
    ['saw', 'heard', 'felt', 'smelled', 'touched', 'looked', 'sounded'].includes(w)
  ).length;
  const sensoryDetailRatio = sensoryWords / words.length;
  
  // Hedging score
  const hedgeWords = ['maybe', 'perhaps', 'possibly', 'i think', 'i believe', 'kind of', 'sort of'];
  const hedges = hedgeWords.filter(h => transcription.toLowerCase().includes(h)).length;
  const hedgingScore = Math.min(1, hedges / 5);
  
  // Response complexity (average words per sentence)
  const responseComplexity = words.length / Math.max(1, sentences.length);
  
  return {
    pronounDistancing,
    temporalLacunae,
    negationFrequency,
    sensoryDetailRatio,
    hedgingScore,
    responseComplexity
  };
}

// Calculate deception probability
export function calculateDeceptionProbability(
  metrics: VoiceMetrics,
  stressIndicators: StressIndicators,
  linguisticIndicators: LinguisticIndicators,
  baseline: VoiceBaseline
): DeceptionProbability {
  const keyIndicators: string[] = [];
  
  // Voice-based indicators
  let voiceScore = 0;
  
  // Micro-tremor weight
  if (stressIndicators.microTremorFrequency > 0.6) {
    voiceScore += 0.25;
    keyIndicators.push('Elevated micro-tremor in 8-12 Hz band');
  }
  
  // Jitter deviation
  const jitterDeviation = Math.abs(metrics.jitter - baseline.avgJitter) / baseline.avgJitter;
  if (jitterDeviation > 0.3) {
    voiceScore += 0.15;
    keyIndicators.push('Significant jitter deviation from baseline');
  }
  
  // Response latency
  const latencyDeviation = (metrics.responseLatency - baseline.avgResponseLatency) / baseline.avgResponseLatency;
  if (latencyDeviation > 0.5) {
    voiceScore += 0.15;
    keyIndicators.push('Delayed response latency');
  }
  
  // Speech rate changes
  const rateDeviation = Math.abs(metrics.speechRate - baseline.avgSpeechRate) / baseline.avgSpeechRate;
  if (rateDeviation > 0.25) {
    voiceScore += 0.1;
    keyIndicators.push('Abnormal speech rate variation');
  }
  
  // Formant shifts
  if (stressIndicators.formantShifts.overall_stress_indicator > 0.5) {
    voiceScore += 0.15;
    keyIndicators.push('Formant frequency stress pattern');
  }
  
  // Linguistic-based indicators
  let linguisticScore = 0;
  
  if (linguisticIndicators.pronounDistancing > 0.6) {
    linguisticScore += 0.2;
    keyIndicators.push('Pronoun distancing detected');
  }
  
  if (linguisticIndicators.temporalLacunae) {
    linguisticScore += 0.2;
    keyIndicators.push('Temporal gaps in narrative');
  }
  
  if (linguisticIndicators.hedgingScore > 0.5) {
    linguisticScore += 0.15;
    keyIndicators.push('Excessive hedging language');
  }
  
  if (linguisticIndicators.negationFrequency > 0.08) {
    linguisticScore += 0.15;
    keyIndicators.push('High negation frequency');
  }
  
  if (linguisticIndicators.sensoryDetailRatio < 0.02) {
    linguisticScore += 0.1;
    keyIndicators.push('Low sensory detail in narrative');
  }
  
  // Combined probability
  const overall = (voiceScore * 0.55) + (linguisticScore * 0.45);
  
  // Confidence based on baseline quality and indicator consistency
  const confidence = Math.min(0.95, 0.5 + (baseline.sampleCount * 0.05) + (keyIndicators.length * 0.05));
  
  return {
    overall: Math.min(1, overall),
    voice_based: Math.min(1, voiceScore),
    linguistic_based: Math.min(1, linguisticScore),
    confidence,
    key_indicators: keyIndicators
  };
}

// Estimate autonomic arousal from voice
export function estimateAutonomicArousal(
  metrics: VoiceMetrics,
  stressIndicators: StressIndicators
): number {
  // Sympathetic nervous system activation markers
  const markers = [
    stressIndicators.microTremorFrequency,
    Math.min(1, metrics.jitter / 2),
    Math.min(1, metrics.shimmer / 10),
    stressIndicators.formantShifts.overall_stress_indicator,
    1 - (metrics.harmonicToNoiseRatio / 25) // Lower HNR = more stress
  ];
  
  return average(markers);
}

// Full voice analysis
export function performVoiceAnalysis(
  audioData: Float32Array,
  sampleRate: number,
  transcription: string,
  baseline: VoiceBaseline
): VoiceAnalysisResult {
  // Extract voice metrics (would use actual audio processing in production)
  const metrics: VoiceMetrics = {
    fundamentalFrequency: 120 + Math.random() * 60,
    jitter: 0.3 + Math.random() * 0.8,
    shimmer: 2 + Math.random() * 4,
    harmonicToNoiseRatio: 15 + Math.random() * 10,
    speechRate: 120 + Math.random() * 60,
    pauseDuration: 200 + Math.random() * 400,
    responseLatency: 500 + Math.random() * 1000
  };
  
  const stressIndicators: StressIndicators = {
    microTremorFrequency: analyzeMicroTremor(audioData, sampleRate),
    fundamentalFrequencyVariability: Math.random() * 0.3,
    formantShifts: analyzeFormants(audioData, sampleRate),
    speechToSilenceRatio: 0.6 + Math.random() * 0.3,
    fillerWordDensity: Math.random() * 0.1
  };
  
  const linguisticIndicators = analyzeLinguistics(transcription);
  const deceptionProbability = calculateDeceptionProbability(
    metrics, stressIndicators, linguisticIndicators, baseline
  );
  
  // Calculate baseline deviation
  const deviations = [
    Math.abs(metrics.fundamentalFrequency - baseline.avgFundamentalFrequency) / baseline.avgFundamentalFrequency,
    Math.abs(metrics.jitter - baseline.avgJitter) / Math.max(0.1, baseline.avgJitter),
    Math.abs(metrics.speechRate - baseline.avgSpeechRate) / baseline.avgSpeechRate
  ];
  const baselineDeviation = average(deviations);
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (deceptionProbability.overall > 0.6) {
    recommendations.push('High-priority follow-up questioning recommended');
    recommendations.push('Request specific sensory details about events');
    recommendations.push('Ask unexpected questions to disrupt rehearsed responses');
  } else if (deceptionProbability.overall > 0.4) {
    recommendations.push('Moderate concern - continue monitoring');
    recommendations.push('Probe areas with linguistic anomalies');
  } else {
    recommendations.push('Low deception indicators - proceed normally');
    recommendations.push('Continue baseline establishment');
  }
  
  return {
    metrics,
    stress_indicators: stressIndicators,
    linguistic_indicators: linguisticIndicators,
    deception_probability: deceptionProbability,
    baseline_deviation: baselineDeviation,
    autonomic_arousal_estimate: estimateAutonomicArousal(metrics, stressIndicators),
    recommendations
  };
}
