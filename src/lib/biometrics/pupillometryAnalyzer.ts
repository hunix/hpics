/**
 * Pupillometry Analysis System
 * Real-time pupil analysis for cognitive and emotional state inference
 */

export interface PupillometricData {
  baseline_diameter: number;
  current_diameter: number;
  dilation_percentage: number;
  cognitive_load_indicator: number;
  emotional_response: {
    interest: number;
    arousal: number;
    attraction: number;
    deception_indicator: number;
    fear_response: number;
    cognitive_effort: number;
  };
  light_reflex_normalcy: boolean;
  hippus_detected: boolean;
  constriction_velocity: number;
  dilation_velocity: number;
  pupil_unrest_index: number;
  asymmetry_score: number;
}

export interface PupilAnalysisConfig {
  baseline_samples: number;
  sampling_rate_hz: number;
  light_compensation: boolean;
  emotion_inference: boolean;
  deception_mode: boolean;
}

// Pupil size norms (mm) for baseline comparison
const PUPIL_NORMS = {
  min_normal: 2.0,
  max_normal: 8.0,
  average_rest: 3.5,
  cognitive_load_threshold: 0.5, // mm increase indicates load
  emotional_arousal_threshold: 0.3,
  deception_dilation_range: [0.2, 0.8],
};

/**
 * Analyze pupil metrics from video frame data
 */
export function analyzePupillometry(
  leftPupilDiameter: number,
  rightPupilDiameter: number,
  baselineDiameter: number,
  lightLevel: number = 0.5
): PupillometricData {
  const avgDiameter = (leftPupilDiameter + rightPupilDiameter) / 2;
  const asymmetry = Math.abs(leftPupilDiameter - rightPupilDiameter);
  
  // Light-compensated dilation
  const expectedForLight = baselineDiameter * (1 - lightLevel * 0.3);
  const compensatedDilation = avgDiameter - expectedForLight;
  const dilationPercentage = ((avgDiameter - baselineDiameter) / baselineDiameter) * 100;
  
  // Cognitive load estimation (Task-Evoked Pupillary Response)
  const cognitiveLoad = Math.min(1, Math.max(0, compensatedDilation / PUPIL_NORMS.cognitive_load_threshold));
  
  // Emotional response inference
  const emotionalResponse = inferEmotionalState(
    compensatedDilation,
    asymmetry,
    baselineDiameter
  );
  
  // Pupillary unrest index (fluctuation indicator)
  const puiScore = calculatePupilUnrestIndex(avgDiameter, baselineDiameter);
  
  return {
    baseline_diameter: baselineDiameter,
    current_diameter: avgDiameter,
    dilation_percentage: dilationPercentage,
    cognitive_load_indicator: cognitiveLoad,
    emotional_response: emotionalResponse,
    light_reflex_normalcy: isLightReflexNormal(avgDiameter, lightLevel),
    hippus_detected: puiScore > 0.3,
    constriction_velocity: estimateConstrictionVelocity(avgDiameter, baselineDiameter),
    dilation_velocity: estimateDilationVelocity(avgDiameter, baselineDiameter),
    pupil_unrest_index: puiScore,
    asymmetry_score: asymmetry / baselineDiameter,
  };
}

function inferEmotionalState(
  dilation: number,
  asymmetry: number,
  baseline: number
): PupillometricData['emotional_response'] {
  const dilationRatio = dilation / baseline;
  
  return {
    interest: Math.min(1, Math.max(0, dilationRatio * 2)),
    arousal: Math.min(1, Math.max(0, dilation / PUPIL_NORMS.emotional_arousal_threshold)),
    attraction: dilationRatio > 0.1 ? Math.min(1, dilationRatio * 1.5) : 0,
    deception_indicator: calculateDeceptionIndicator(dilation, asymmetry),
    fear_response: asymmetry > 0.5 ? Math.min(1, asymmetry) : 0,
    cognitive_effort: Math.min(1, dilation / PUPIL_NORMS.cognitive_load_threshold),
  };
}

function calculateDeceptionIndicator(dilation: number, asymmetry: number): number {
  const [minDeception, maxDeception] = PUPIL_NORMS.deception_dilation_range;
  
  if (dilation < minDeception || dilation > maxDeception) {
    return 0;
  }
  
  // Deception often shows moderate dilation with slight asymmetry
  const dilationScore = 1 - Math.abs(dilation - 0.5) * 2;
  const asymmetryScore = asymmetry > 0.1 && asymmetry < 0.4 ? 0.3 : 0;
  
  return Math.min(1, dilationScore + asymmetryScore);
}

function isLightReflexNormal(diameter: number, lightLevel: number): boolean {
  const expectedChange = lightLevel * 2; // Expected mm change
  return diameter >= PUPIL_NORMS.min_normal && diameter <= PUPIL_NORMS.max_normal;
}

function calculatePupilUnrestIndex(current: number, baseline: number): number {
  const fluctuation = Math.abs(current - baseline) / baseline;
  return Math.min(1, fluctuation * 3);
}

function estimateConstrictionVelocity(current: number, baseline: number): number {
  if (current >= baseline) return 0;
  return (baseline - current) / baseline;
}

function estimateDilationVelocity(current: number, baseline: number): number {
  if (current <= baseline) return 0;
  return (current - baseline) / baseline;
}

/**
 * Baseline calibration for accurate measurements
 */
export function calibrateBaseline(samples: number[]): number {
  if (samples.length === 0) return PUPIL_NORMS.average_rest;
  
  // Remove outliers and calculate median
  const sorted = [...samples].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const filtered = sorted.filter(s => s >= q1 - 1.5 * iqr && s <= q3 + 1.5 * iqr);
  
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

/**
 * Temporal pattern analysis for pupil oscillations
 */
export function analyzeTemporalPatterns(
  measurements: number[],
  samplingRateHz: number
): {
  oscillation_frequency: number;
  stability_score: number;
  fatigue_indicator: number;
} {
  if (measurements.length < 10) {
    return { oscillation_frequency: 0, stability_score: 1, fatigue_indicator: 0 };
  }
  
  // Calculate variance for stability
  const mean = measurements.reduce((a, b) => a + b, 0) / measurements.length;
  const variance = measurements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / measurements.length;
  const stability = Math.max(0, 1 - variance * 10);
  
  // Estimate dominant frequency (simplified)
  let zeroCrossings = 0;
  for (let i = 1; i < measurements.length; i++) {
    if ((measurements[i] - mean) * (measurements[i - 1] - mean) < 0) {
      zeroCrossings++;
    }
  }
  const oscillationFreq = (zeroCrossings / 2) / (measurements.length / samplingRateHz);
  
  // Fatigue shows as increased low-frequency oscillations
  const fatigueIndicator = oscillationFreq < 0.5 && variance > 0.1 ? 
    Math.min(1, variance * 5) : 0;
  
  return {
    oscillation_frequency: oscillationFreq,
    stability_score: stability,
    fatigue_indicator: fatigueIndicator,
  };
}
