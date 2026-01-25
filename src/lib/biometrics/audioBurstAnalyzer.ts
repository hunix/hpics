/**
 * Audio Burst Mental State Analyzer (v7.0)
 * 
 * Based on US20240071412A1 Patent (Eleos Mental Systems, 2024)
 * Predicts mental conditions through "audio burst" analysis using
 * Hilbert transforms and prosodic feature extraction.
 * 
 * Key innovations:
 * - Distinguishes rhythmic (depressive) vs irregular (anxious) speech patterns
 * - Uses instantaneous frequency and amplitude envelope analysis
 * - Calculates AUC (Area Under Curve) integrals for mental state classification
 */

export interface AudioBurstFeatures {
  // Hilbert Transform derived features
  instantaneousFrequency: number[];
  instantaneousAmplitude: number[];
  analyticSignal: { real: number; imag: number }[];
  
  // Prosodic features
  fundamentalFrequencyMean: number;
  fundamentalFrequencyStd: number;
  jitter: number;  // Frequency perturbation
  shimmer: number; // Amplitude perturbation
  harmonicToNoiseRatio: number;
  
  // Spectral features
  spectralCentroid: number;
  spectralFlatness: number;
  spectralRolloff: number;
  mfccCoefficients: number[];
  
  // Rhythm and tempo
  speechRate: number;
  pauseFrequency: number;
  pauseDuration: number;
  rhythmRegularity: number;
}

export interface MentalStateIndicators {
  rhythmicScore: number;      // 0-1, higher = more rhythmic (depressive patterns)
  irregularScore: number;     // 0-1, higher = more irregular (anxiety patterns)
  flatAffectScore: number;    // 0-1, higher = reduced emotional variation
  agitationScore: number;     // 0-1, higher = rapid/pressured speech
  fatigueScore: number;       // 0-1, higher = low energy/slow speech
}

export interface MentalStatePrediction {
  primaryState: 'neutral' | 'anxious' | 'depressed' | 'agitated' | 'fatigued' | 'stressed';
  secondaryStates: string[];
  confidence: number;
  indicators: MentalStateIndicators;
  evidencePoints: string[];
  recommendations: string[];
}

export interface AudioBurstAnalysis {
  features: AudioBurstFeatures;
  prediction: MentalStatePrediction;
  aucIntegral: number;
  analysisVersion: string;
  sampleDurationMs: number;
  timestamp: Date;
}

/**
 * Compute Hilbert Transform of a signal
 * Returns analytic signal with real and imaginary components
 */
function hilbertTransform(signal: number[]): { real: number; imag: number }[] {
  const n = signal.length;
  if (n === 0) return [];
  
  // Simple DFT-based Hilbert transform approximation
  // In production, use proper FFT libraries
  const analytic: { real: number; imag: number }[] = [];
  
  for (let k = 0; k < n; k++) {
    let realSum = 0;
    let imagSum = 0;
    
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * k * i) / n;
      realSum += signal[i] * Math.cos(angle);
      
      // Hilbert transform: -j * sign(frequency) in frequency domain
      // This creates a 90-degree phase shift
      if (i !== 0 && i !== n / 2) {
        const sign = i < n / 2 ? 1 : -1;
        imagSum += signal[i] * Math.sin(angle) * sign;
      }
    }
    
    analytic.push({
      real: realSum / n,
      imag: imagSum / n,
    });
  }
  
  return analytic;
}

/**
 * Calculate instantaneous frequency from analytic signal
 */
function calculateInstantaneousFrequency(
  analytic: { real: number; imag: number }[],
  sampleRate: number
): number[] {
  const frequencies: number[] = [];
  
  for (let i = 1; i < analytic.length; i++) {
    // Phase = atan2(imag, real)
    const phase1 = Math.atan2(analytic[i - 1].imag, analytic[i - 1].real);
    const phase2 = Math.atan2(analytic[i].imag, analytic[i].real);
    
    // Unwrap phase
    let phaseDiff = phase2 - phase1;
    while (phaseDiff > Math.PI) phaseDiff -= 2 * Math.PI;
    while (phaseDiff < -Math.PI) phaseDiff += 2 * Math.PI;
    
    // Instantaneous frequency = d(phase)/dt * sampleRate / (2*pi)
    const instantFreq = Math.abs(phaseDiff * sampleRate / (2 * Math.PI));
    frequencies.push(instantFreq);
  }
  
  return frequencies;
}

/**
 * Calculate instantaneous amplitude (envelope) from analytic signal
 */
function calculateInstantaneousAmplitude(
  analytic: { real: number; imag: number }[]
): number[] {
  return analytic.map(a => Math.sqrt(a.real * a.real + a.imag * a.imag));
}

/**
 * Calculate rhythm regularity from amplitude envelope
 */
function calculateRhythmRegularity(amplitudes: number[]): number {
  if (amplitudes.length < 10) return 0.5;
  
  // Find peaks (local maxima)
  const peaks: number[] = [];
  for (let i = 1; i < amplitudes.length - 1; i++) {
    if (amplitudes[i] > amplitudes[i - 1] && amplitudes[i] > amplitudes[i + 1]) {
      peaks.push(i);
    }
  }
  
  if (peaks.length < 2) return 0.5;
  
  // Calculate inter-peak intervals
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }
  
  // Regularity = 1 - (std / mean) of intervals
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / intervals.length;
  const std = Math.sqrt(variance);
  
  if (mean === 0) return 0.5;
  
  const coefficientOfVariation = std / mean;
  return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
}

/**
 * Calculate jitter (frequency perturbation)
 */
function calculateJitter(frequencies: number[]): number {
  if (frequencies.length < 2) return 0;
  
  let totalDiff = 0;
  for (let i = 1; i < frequencies.length; i++) {
    totalDiff += Math.abs(frequencies[i] - frequencies[i - 1]);
  }
  
  const mean = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
  if (mean === 0) return 0;
  
  return (totalDiff / (frequencies.length - 1)) / mean;
}

/**
 * Calculate shimmer (amplitude perturbation)
 */
function calculateShimmer(amplitudes: number[]): number {
  if (amplitudes.length < 2) return 0;
  
  let totalDiff = 0;
  for (let i = 1; i < amplitudes.length; i++) {
    totalDiff += Math.abs(amplitudes[i] - amplitudes[i - 1]);
  }
  
  const mean = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
  if (mean === 0) return 0;
  
  return (totalDiff / (amplitudes.length - 1)) / mean;
}

/**
 * Estimate fundamental frequency (F0) from signal
 */
function estimateFundamentalFrequency(
  signal: number[],
  sampleRate: number
): { mean: number; std: number } {
  if (signal.length < 100) return { mean: 150, std: 30 };
  
  // Simple autocorrelation-based pitch estimation
  const minPeriod = Math.floor(sampleRate / 400); // Max F0 = 400 Hz
  const maxPeriod = Math.floor(sampleRate / 50);  // Min F0 = 50 Hz
  
  const pitches: number[] = [];
  const windowSize = Math.min(1024, signal.length);
  const hopSize = Math.floor(windowSize / 2);
  
  for (let start = 0; start + windowSize < signal.length; start += hopSize) {
    const window = signal.slice(start, start + windowSize);
    
    // Autocorrelation
    let maxCorr = -Infinity;
    let bestLag = minPeriod;
    
    for (let lag = minPeriod; lag < maxPeriod && lag < window.length / 2; lag++) {
      let corr = 0;
      for (let i = 0; i < window.length - lag; i++) {
        corr += window[i] * window[i + lag];
      }
      if (corr > maxCorr) {
        maxCorr = corr;
        bestLag = lag;
      }
    }
    
    const pitch = sampleRate / bestLag;
    if (pitch > 50 && pitch < 400) {
      pitches.push(pitch);
    }
  }
  
  if (pitches.length === 0) return { mean: 150, std: 30 };
  
  const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
  const variance = pitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pitches.length;
  
  return { mean, std: Math.sqrt(variance) };
}

/**
 * Calculate spectral centroid
 */
function calculateSpectralCentroid(magnitudes: number[], sampleRate: number): number {
  if (magnitudes.length === 0) return 0;
  
  let weightedSum = 0;
  let totalMagnitude = 0;
  
  for (let i = 0; i < magnitudes.length; i++) {
    const freq = (i * sampleRate) / (2 * magnitudes.length);
    weightedSum += freq * magnitudes[i];
    totalMagnitude += magnitudes[i];
  }
  
  return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
}

/**
 * Calculate spectral flatness (tonality measure)
 */
function calculateSpectralFlatness(magnitudes: number[]): number {
  if (magnitudes.length === 0) return 0;
  
  const positiveMags = magnitudes.filter(m => m > 0);
  if (positiveMags.length === 0) return 0;
  
  const geometricMean = Math.exp(
    positiveMags.reduce((sum, m) => sum + Math.log(m), 0) / positiveMags.length
  );
  const arithmeticMean = positiveMags.reduce((a, b) => a + b, 0) / positiveMags.length;
  
  return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}

/**
 * Detect speech pauses
 */
function detectPauses(
  amplitudes: number[],
  sampleRate: number,
  silenceThreshold: number = 0.1
): { frequency: number; avgDuration: number } {
  if (amplitudes.length === 0) return { frequency: 0, avgDuration: 0 };
  
  const maxAmp = Math.max(...amplitudes);
  const threshold = maxAmp * silenceThreshold;
  
  const pauses: number[] = [];
  let pauseStart = -1;
  
  for (let i = 0; i < amplitudes.length; i++) {
    if (amplitudes[i] < threshold) {
      if (pauseStart === -1) pauseStart = i;
    } else {
      if (pauseStart !== -1) {
        const pauseLength = (i - pauseStart) / sampleRate;
        if (pauseLength > 0.1) { // Only count pauses > 100ms
          pauses.push(pauseLength);
        }
        pauseStart = -1;
      }
    }
  }
  
  const durationSec = amplitudes.length / sampleRate;
  const frequency = pauses.length / durationSec;
  const avgDuration = pauses.length > 0 
    ? pauses.reduce((a, b) => a + b, 0) / pauses.length 
    : 0;
  
  return { frequency, avgDuration };
}

/**
 * Calculate AUC (Area Under Curve) integral for mental state assessment
 * Based on patent methodology
 */
function calculateAUCIntegral(
  features: AudioBurstFeatures,
  indicators: MentalStateIndicators
): number {
  // Weighted combination of key indicators
  const weights = {
    rhythmic: 0.25,
    irregular: 0.25,
    flatAffect: 0.2,
    agitation: 0.15,
    fatigue: 0.15,
  };
  
  return (
    indicators.rhythmicScore * weights.rhythmic +
    indicators.irregularScore * weights.irregular +
    indicators.flatAffectScore * weights.flatAffect +
    indicators.agitationScore * weights.agitation +
    indicators.fatigueScore * weights.fatigue
  );
}

/**
 * Classify mental state based on extracted features
 */
function classifyMentalState(
  features: AudioBurstFeatures,
  indicators: MentalStateIndicators
): MentalStatePrediction {
  const evidencePoints: string[] = [];
  const secondaryStates: string[] = [];
  
  // Determine primary state
  const scores = {
    neutral: 0,
    anxious: indicators.irregularScore * 0.7 + indicators.agitationScore * 0.3,
    depressed: indicators.rhythmicScore * 0.6 + indicators.flatAffectScore * 0.4,
    agitated: indicators.agitationScore * 0.8 + indicators.irregularScore * 0.2,
    fatigued: indicators.fatigueScore * 0.7 + indicators.flatAffectScore * 0.3,
    stressed: indicators.irregularScore * 0.4 + indicators.agitationScore * 0.4 + (1 - indicators.flatAffectScore) * 0.2,
  };
  
  // Add evidence
  if (indicators.rhythmicScore > 0.6) {
    evidencePoints.push('Speech patterns show high rhythmicity associated with depressive states');
  }
  if (indicators.irregularScore > 0.6) {
    evidencePoints.push('Irregular speech patterns detected, often associated with anxiety');
  }
  if (indicators.flatAffectScore > 0.6) {
    evidencePoints.push('Reduced prosodic variation suggests flat affect');
  }
  if (indicators.agitationScore > 0.6) {
    evidencePoints.push('Rapid speech rate and frequency variations indicate agitation');
  }
  if (indicators.fatigueScore > 0.6) {
    evidencePoints.push('Slow speech rate and low energy patterns suggest fatigue');
  }
  
  // If jitter/shimmer high
  if (features.jitter > 0.02) {
    evidencePoints.push('Elevated voice tremor detected');
  }
  if (features.shimmer > 0.05) {
    evidencePoints.push('Amplitude instability in voice');
  }
  
  // Find primary and secondary states
  let primaryState: MentalStatePrediction['primaryState'] = 'neutral';
  let maxScore = 0.3; // Threshold for non-neutral
  
  for (const [state, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryState = state as MentalStatePrediction['primaryState'];
    } else if (score > 0.4 && state !== 'neutral') {
      secondaryStates.push(state);
    }
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (primaryState === 'anxious' || secondaryStates.includes('anxious')) {
    recommendations.push('Consider breathing exercises or grounding techniques before important conversations');
  }
  if (primaryState === 'depressed' || secondaryStates.includes('depressed')) {
    recommendations.push('Note potential low mood - may require more supportive communication approach');
  }
  if (primaryState === 'agitated' || secondaryStates.includes('agitated')) {
    recommendations.push('Allow time for de-escalation before substantive discussions');
  }
  if (primaryState === 'fatigued' || secondaryStates.includes('fatigued')) {
    recommendations.push('Consider timing of interactions - subject may be more receptive at different times');
  }
  if (primaryState === 'neutral') {
    recommendations.push('Baseline mental state detected - suitable for standard engagement');
  }
  
  return {
    primaryState,
    secondaryStates,
    confidence: Math.min(1, maxScore * 1.2),
    indicators,
    evidencePoints,
    recommendations,
  };
}

/**
 * Main analysis function - analyze audio signal for mental state indicators
 */
export function analyzeAudioBurst(
  signal: number[],
  sampleRate: number = 16000
): AudioBurstAnalysis {
  // Compute Hilbert Transform
  const analytic = hilbertTransform(signal);
  const instantaneousFreq = calculateInstantaneousFrequency(analytic, sampleRate);
  const instantaneousAmp = calculateInstantaneousAmplitude(analytic);
  
  // Calculate F0 features
  const f0 = estimateFundamentalFrequency(signal, sampleRate);
  
  // Calculate perturbation measures
  const jitter = calculateJitter(instantaneousFreq);
  const shimmer = calculateShimmer(instantaneousAmp);
  
  // Calculate rhythm regularity
  const rhythmRegularity = calculateRhythmRegularity(instantaneousAmp);
  
  // Detect pauses
  const pauses = detectPauses(instantaneousAmp, sampleRate);
  
  // Simple spectral analysis (magnitude spectrum)
  const magnitudes = instantaneousAmp; // Simplified - use FFT in production
  const spectralCentroid = calculateSpectralCentroid(magnitudes, sampleRate);
  const spectralFlatness = calculateSpectralFlatness(magnitudes);
  
  // Calculate speech rate (syllables per second approximation)
  const peaks = instantaneousAmp.filter((a, i) => 
    i > 0 && i < instantaneousAmp.length - 1 &&
    a > instantaneousAmp[i - 1] && a > instantaneousAmp[i + 1]
  ).length;
  const durationSec = signal.length / sampleRate;
  const speechRate = peaks / durationSec;
  
  const features: AudioBurstFeatures = {
    instantaneousFrequency: instantaneousFreq,
    instantaneousAmplitude: instantaneousAmp,
    analyticSignal: analytic,
    fundamentalFrequencyMean: f0.mean,
    fundamentalFrequencyStd: f0.std,
    jitter,
    shimmer,
    harmonicToNoiseRatio: 1 - spectralFlatness, // Approximation
    spectralCentroid,
    spectralFlatness,
    spectralRolloff: 0.85 * sampleRate / 2, // Default
    mfccCoefficients: [], // Requires full MFCC implementation
    speechRate,
    pauseFrequency: pauses.frequency,
    pauseDuration: pauses.avgDuration,
    rhythmRegularity,
  };
  
  // Calculate mental state indicators
  const indicators: MentalStateIndicators = {
    // High rhythm regularity + slow speech = depressive
    rhythmicScore: rhythmRegularity * 0.6 + (speechRate < 3 ? 0.4 : 0),
    
    // Low rhythm regularity + high jitter = anxious
    irregularScore: (1 - rhythmRegularity) * 0.5 + (jitter > 0.02 ? 0.3 : 0) + (shimmer > 0.05 ? 0.2 : 0),
    
    // Low F0 std + low speech rate = flat affect
    flatAffectScore: (f0.std < 20 ? 0.6 : 0) + (speechRate < 2.5 ? 0.4 : 0),
    
    // High speech rate + high F0 std = agitation
    agitationScore: (speechRate > 5 ? 0.5 : 0) + (f0.std > 50 ? 0.3 : 0) + (jitter > 0.03 ? 0.2 : 0),
    
    // Low speech rate + long pauses + low spectral centroid = fatigue
    fatigueScore: (speechRate < 2 ? 0.4 : 0) + (pauses.avgDuration > 0.5 ? 0.3 : 0) + (spectralCentroid < 1000 ? 0.3 : 0),
  };
  
  // Normalize indicators to 0-1
  for (const key of Object.keys(indicators) as (keyof MentalStateIndicators)[]) {
    indicators[key] = Math.min(1, Math.max(0, indicators[key]));
  }
  
  const prediction = classifyMentalState(features, indicators);
  const aucIntegral = calculateAUCIntegral(features, indicators);
  
  return {
    features,
    prediction,
    aucIntegral,
    analysisVersion: '1.0.0',
    sampleDurationMs: (signal.length / sampleRate) * 1000,
    timestamp: new Date(),
  };
}

/**
 * Compare two audio samples for mental state change detection
 */
export function detectMentalStateChange(
  analysis1: AudioBurstAnalysis,
  analysis2: AudioBurstAnalysis
): {
  stateChanged: boolean;
  changeDirection: 'improved' | 'deteriorated' | 'stable';
  changeMagnitude: number;
  changedIndicators: string[];
} {
  const changedIndicators: string[] = [];
  let totalChange = 0;
  let changeSign = 0;
  
  const indicatorKeys: (keyof MentalStateIndicators)[] = [
    'rhythmicScore', 'irregularScore', 'flatAffectScore', 'agitationScore', 'fatigueScore'
  ];
  
  for (const key of indicatorKeys) {
    const diff = analysis2.prediction.indicators[key] - analysis1.prediction.indicators[key];
    if (Math.abs(diff) > 0.15) {
      changedIndicators.push(`${key}: ${diff > 0 ? 'increased' : 'decreased'}`);
      totalChange += Math.abs(diff);
      // Negative changes in these scores are generally improvements (less anxiety, etc.)
      changeSign += diff > 0 ? 1 : -1;
    }
  }
  
  const stateChanged = analysis1.prediction.primaryState !== analysis2.prediction.primaryState;
  const changeMagnitude = totalChange / indicatorKeys.length;
  
  let changeDirection: 'improved' | 'deteriorated' | 'stable' = 'stable';
  if (changeMagnitude > 0.1) {
    changeDirection = changeSign < 0 ? 'improved' : 'deteriorated';
  }
  
  return {
    stateChanged,
    changeDirection,
    changeMagnitude,
    changedIndicators,
  };
}

/**
 * Generate summary report for audio burst analysis
 */
export function generateAudioBurstReport(analysis: AudioBurstAnalysis): string {
  const { prediction, features, aucIntegral } = analysis;
  
  let report = `## Audio Burst Mental State Analysis\n\n`;
  report += `**Primary State:** ${prediction.primaryState.toUpperCase()}\n`;
  report += `**Confidence:** ${(prediction.confidence * 100).toFixed(1)}%\n`;
  report += `**AUC Integral:** ${aucIntegral.toFixed(3)}\n\n`;
  
  if (prediction.secondaryStates.length > 0) {
    report += `**Secondary States:** ${prediction.secondaryStates.join(', ')}\n\n`;
  }
  
  report += `### Key Indicators\n`;
  report += `- Rhythmic Score: ${(prediction.indicators.rhythmicScore * 100).toFixed(0)}%\n`;
  report += `- Irregular Score: ${(prediction.indicators.irregularScore * 100).toFixed(0)}%\n`;
  report += `- Flat Affect Score: ${(prediction.indicators.flatAffectScore * 100).toFixed(0)}%\n`;
  report += `- Agitation Score: ${(prediction.indicators.agitationScore * 100).toFixed(0)}%\n`;
  report += `- Fatigue Score: ${(prediction.indicators.fatigueScore * 100).toFixed(0)}%\n\n`;
  
  report += `### Prosodic Features\n`;
  report += `- F0 Mean: ${features.fundamentalFrequencyMean.toFixed(1)} Hz\n`;
  report += `- F0 Std: ${features.fundamentalFrequencyStd.toFixed(1)} Hz\n`;
  report += `- Jitter: ${(features.jitter * 100).toFixed(2)}%\n`;
  report += `- Shimmer: ${(features.shimmer * 100).toFixed(2)}%\n`;
  report += `- Speech Rate: ${features.speechRate.toFixed(1)} syllables/sec\n\n`;
  
  if (prediction.evidencePoints.length > 0) {
    report += `### Evidence\n`;
    for (const point of prediction.evidencePoints) {
      report += `- ${point}\n`;
    }
    report += '\n';
  }
  
  report += `### Recommendations\n`;
  for (const rec of prediction.recommendations) {
    report += `- ${rec}\n`;
  }
  
  return report;
}
