/**
 * Heart Rate Variability Inference System
 * Non-contact HRV estimation from video using rPPG
 */

export interface HRVMetrics {
  heart_rate_bpm: number;
  rr_intervals_ms: number[];
  sdnn: number; // Standard deviation of NN intervals
  rmssd: number; // Root mean square of successive differences
  pnn50: number; // Percentage of successive intervals differing by >50ms
  lf_power: number; // Low frequency power (0.04-0.15 Hz)
  hf_power: number; // High frequency power (0.15-0.4 Hz)
  lf_hf_ratio: number; // Sympathetic/Parasympathetic balance
  coherence_score: number; // Emotional regulation capacity
  stress_index: number;
  recovery_capacity: number;
  autonomic_balance: 'sympathetic_dominant' | 'balanced' | 'parasympathetic_dominant';
}

export interface RPPGSignal {
  timestamps: number[];
  green_channel: number[];
  red_channel: number[];
  blue_channel: number[];
}

/**
 * Extract pulse signal from facial video frames
 * Uses green channel as primary signal (hemoglobin absorption)
 */
export function extractPulseSignal(
  rgbValues: { r: number; g: number; b: number }[],
  timestamps: number[]
): RPPGSignal {
  return {
    timestamps,
    green_channel: rgbValues.map(v => v.g),
    red_channel: rgbValues.map(v => v.r),
    blue_channel: rgbValues.map(v => v.b),
  };
}

/**
 * Process rPPG signal to extract heart rate and HRV metrics
 */
export function processRPPGSignal(signal: RPPGSignal): HRVMetrics {
  const greenSignal = signal.green_channel;
  const timestamps = signal.timestamps;
  
  if (greenSignal.length < 30) {
    return getDefaultHRVMetrics();
  }
  
  // Bandpass filter simulation (0.7-4 Hz for heart rate)
  const filtered = bandpassFilter(greenSignal, timestamps);
  
  // Peak detection for R-R intervals
  const peaks = detectPeaks(filtered);
  const rrIntervals = calculateRRIntervals(peaks, timestamps);
  
  if (rrIntervals.length < 5) {
    return getDefaultHRVMetrics();
  }
  
  // Calculate time-domain metrics
  const sdnn = calculateSDNN(rrIntervals);
  const rmssd = calculateRMSSD(rrIntervals);
  const pnn50 = calculatePNN50(rrIntervals);
  
  // Calculate frequency-domain metrics (simplified)
  const { lfPower, hfPower } = calculateFrequencyMetrics(rrIntervals);
  
  // Heart rate from average RR interval
  const avgRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  const heartRate = 60000 / avgRR;
  
  // Derived metrics
  const lfHfRatio = hfPower > 0 ? lfPower / hfPower : 1;
  const coherenceScore = calculateCoherence(rrIntervals);
  const stressIndex = calculateStressIndex(sdnn, lfHfRatio);
  
  return {
    heart_rate_bpm: Math.round(heartRate),
    rr_intervals_ms: rrIntervals,
    sdnn,
    rmssd,
    pnn50,
    lf_power: lfPower,
    hf_power: hfPower,
    lf_hf_ratio: lfHfRatio,
    coherence_score: coherenceScore,
    stress_index: stressIndex,
    recovery_capacity: Math.max(0, 1 - stressIndex),
    autonomic_balance: getAutonomicBalance(lfHfRatio),
  };
}

function getDefaultHRVMetrics(): HRVMetrics {
  return {
    heart_rate_bpm: 72,
    rr_intervals_ms: [],
    sdnn: 0,
    rmssd: 0,
    pnn50: 0,
    lf_power: 0,
    hf_power: 0,
    lf_hf_ratio: 1,
    coherence_score: 0.5,
    stress_index: 0.5,
    recovery_capacity: 0.5,
    autonomic_balance: 'balanced',
  };
}

function bandpassFilter(signal: number[], timestamps: number[]): number[] {
  // Simple moving average for smoothing (simulates bandpass)
  const windowSize = 5;
  const smoothed: number[] = [];
  
  for (let i = 0; i < signal.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(signal.length, i + Math.ceil(windowSize / 2));
    const window = signal.slice(start, end);
    smoothed.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  
  // Remove DC component (detrend)
  const mean = smoothed.reduce((a, b) => a + b, 0) / smoothed.length;
  return smoothed.map(v => v - mean);
}

function detectPeaks(signal: number[]): number[] {
  const peaks: number[] = [];
  const threshold = Math.max(...signal.map(Math.abs)) * 0.5;
  
  for (let i = 2; i < signal.length - 2; i++) {
    if (
      signal[i] > signal[i - 1] &&
      signal[i] > signal[i - 2] &&
      signal[i] > signal[i + 1] &&
      signal[i] > signal[i + 2] &&
      signal[i] > threshold
    ) {
      peaks.push(i);
    }
  }
  
  return peaks;
}

function calculateRRIntervals(peaks: number[], timestamps: number[]): number[] {
  const intervals: number[] = [];
  
  for (let i = 1; i < peaks.length; i++) {
    const interval = timestamps[peaks[i]] - timestamps[peaks[i - 1]];
    // Filter physiologically plausible intervals (300-2000ms = 30-200 BPM)
    if (interval >= 300 && interval <= 2000) {
      intervals.push(interval);
    }
  }
  
  return intervals;
}

function calculateSDNN(rrIntervals: number[]): number {
  const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  const squaredDiffs = rrIntervals.map(rr => Math.pow(rr - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / rrIntervals.length);
}

function calculateRMSSD(rrIntervals: number[]): number {
  if (rrIntervals.length < 2) return 0;
  
  let sumSquaredDiffs = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    sumSquaredDiffs += Math.pow(rrIntervals[i] - rrIntervals[i - 1], 2);
  }
  
  return Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));
}

function calculatePNN50(rrIntervals: number[]): number {
  if (rrIntervals.length < 2) return 0;
  
  let count = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    if (Math.abs(rrIntervals[i] - rrIntervals[i - 1]) > 50) {
      count++;
    }
  }
  
  return (count / (rrIntervals.length - 1)) * 100;
}

function calculateFrequencyMetrics(rrIntervals: number[]): { lfPower: number; hfPower: number } {
  // Simplified frequency analysis using variance in different "bands"
  if (rrIntervals.length < 10) {
    return { lfPower: 0, hfPower: 0 };
  }
  
  // Low-frequency variations (slower changes)
  let lfVariance = 0;
  const windowLF = 5;
  for (let i = windowLF; i < rrIntervals.length; i++) {
    const localMean = rrIntervals.slice(i - windowLF, i).reduce((a, b) => a + b, 0) / windowLF;
    lfVariance += Math.pow(rrIntervals[i] - localMean, 2);
  }
  
  // High-frequency variations (beat-to-beat)
  let hfVariance = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    hfVariance += Math.pow(rrIntervals[i] - rrIntervals[i - 1], 2);
  }
  
  return {
    lfPower: Math.sqrt(lfVariance / rrIntervals.length),
    hfPower: Math.sqrt(hfVariance / rrIntervals.length),
  };
}

function calculateCoherence(rrIntervals: number[]): number {
  // Coherence = regularity of HRV pattern
  if (rrIntervals.length < 10) return 0.5;
  
  const rmssd = calculateRMSSD(rrIntervals);
  const sdnn = calculateSDNN(rrIntervals);
  
  // Higher coherence when variations are regular (low rmssd relative to sdnn)
  if (sdnn === 0) return 0.5;
  const ratio = rmssd / sdnn;
  
  return Math.max(0, Math.min(1, 1 - ratio + 0.5));
}

function calculateStressIndex(sdnn: number, lfHfRatio: number): number {
  // Low HRV (low SDNN) and high LF/HF ratio indicate stress
  const hrvComponent = Math.max(0, 1 - sdnn / 100); // Normalize SDNN
  const ratioComponent = Math.min(1, lfHfRatio / 4); // Normalize LF/HF
  
  return (hrvComponent * 0.6 + ratioComponent * 0.4);
}

function getAutonomicBalance(lfHfRatio: number): HRVMetrics['autonomic_balance'] {
  if (lfHfRatio > 2) return 'sympathetic_dominant';
  if (lfHfRatio < 0.5) return 'parasympathetic_dominant';
  return 'balanced';
}

/**
 * Detect emotional state from HRV patterns
 */
export function inferEmotionalStateFromHRV(metrics: HRVMetrics): {
  stress: number;
  relaxation: number;
  emotional_arousal: number;
  cognitive_load: number;
  anxiety_indicator: number;
} {
  return {
    stress: metrics.stress_index,
    relaxation: metrics.recovery_capacity,
    emotional_arousal: Math.min(1, metrics.lf_hf_ratio / 3),
    cognitive_load: Math.max(0, 1 - metrics.rmssd / 50),
    anxiety_indicator: metrics.autonomic_balance === 'sympathetic_dominant' ? 
      Math.min(1, metrics.lf_hf_ratio / 4) : 0,
  };
}
