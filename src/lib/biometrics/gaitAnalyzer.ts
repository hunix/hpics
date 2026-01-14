/**
 * Gait Pattern Analyzer
 * 
 * Analyzes walking patterns from accelerometer and gyroscope data:
 * - Step detection and counting
 * - Cadence and stride analysis
 * - Gait symmetry assessment
 * - Walking style identification
 * - Anomaly detection for health monitoring
 */

export interface MotionSample {
  timestamp: number;
  accelerometer: { x: number; y: number; z: number };
  gyroscope?: { alpha: number; beta: number; gamma: number };
}

export interface StepEvent {
  timestamp: number;
  magnitude: number;
  duration: number; // Time since last step
  isLeft: boolean; // Estimated left/right foot
}

export interface GaitCycle {
  startTime: number;
  endTime: number;
  steps: StepEvent[];
  cadence: number; // Steps per minute
  strideTime: number; // Average time between steps
  strideVariability: number;
  symmetryIndex: number;
}

export interface GaitFeatures {
  // Temporal features
  averageCadence: number;
  cadenceVariability: number;
  averageStrideTime: number;
  strideTimeVariability: number;
  stancePhaseRatio: number;
  swingPhaseRatio: number;

  // Spatial features (estimated from accelerometer)
  verticalOscillation: number;
  lateralSway: number;
  forwardAccelerationPeak: number;

  // Symmetry
  leftRightAsymmetry: number;
  stepLengthAsymmetry: number;

  // Stability
  stepRegularity: number;
  strideRegularity: number;
  walkingStability: number;

  // Style indicators
  heelStrikeIntensity: number;
  pushOffIntensity: number;
  armSwingEstimate: number;
}

export interface GaitProfile {
  features: GaitFeatures;
  cycles: GaitCycle[];
  totalSteps: number;
  walkingDuration: number;
  featureVector: number[];
  qualityScore: number;
  anomalies: GaitAnomaly[];
}

export interface GaitAnomaly {
  type: 'irregular_cadence' | 'asymmetry' | 'instability' | 'sudden_change' | 'limping';
  severity: number;
  timestamp: number;
  description: string;
}

export interface GaitComparison {
  similarity: number;
  isMatch: boolean;
  confidence: number;
  differences: {
    feature: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
  }[];
}

class GaitAnalyzer {
  private readonly SAMPLE_RATE = 50; // Hz
  private readonly STEP_THRESHOLD = 1.2; // g
  private readonly MIN_STEP_INTERVAL = 200; // ms
  private readonly MAX_STEP_INTERVAL = 2000; // ms
  private readonly MATCH_THRESHOLD = 0.70;

  /**
   * Analyze gait from motion samples
   */
  analyzeGait(samples: MotionSample[]): GaitProfile | null {
    if (samples.length < this.SAMPLE_RATE * 5) { // Need at least 5 seconds
      console.warn('[GaitAnalyzer] Insufficient data for analysis');
      return null;
    }

    // Detect steps
    const steps = this.detectSteps(samples);
    
    if (steps.length < 10) {
      console.warn('[GaitAnalyzer] Not enough steps detected');
      return null;
    }

    // Segment into gait cycles
    const cycles = this.segmentGaitCycles(steps);

    // Extract features
    const features = this.extractFeatures(samples, steps, cycles);

    // Generate feature vector
    const featureVector = this.generateFeatureVector(features);

    // Detect anomalies
    const anomalies = this.detectAnomalies(samples, steps, features);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(samples, steps, features);

    const walkingDuration = samples[samples.length - 1].timestamp - samples[0].timestamp;

    return {
      features,
      cycles,
      totalSteps: steps.length,
      walkingDuration,
      featureVector,
      qualityScore,
      anomalies,
    };
  }

  /**
   * Detect individual steps from accelerometer data
   */
  private detectSteps(samples: MotionSample[]): StepEvent[] {
    const steps: StepEvent[] = [];
    const magnitudes = samples.map(s => 
      Math.sqrt(s.accelerometer.x ** 2 + s.accelerometer.y ** 2 + s.accelerometer.z ** 2)
    );

    // Apply low-pass filter
    const filtered = this.lowPassFilter(magnitudes, 5);

    // Find peaks
    let lastStepTime = 0;
    let isLeftFoot = true;

    for (let i = 2; i < filtered.length - 2; i++) {
      const isPeak = filtered[i] > filtered[i - 1] && 
                     filtered[i] > filtered[i - 2] &&
                     filtered[i] > filtered[i + 1] && 
                     filtered[i] > filtered[i + 2];

      if (isPeak && filtered[i] > this.STEP_THRESHOLD) {
        const timestamp = samples[i].timestamp;
        const timeSinceLastStep = timestamp - lastStepTime;

        if (timeSinceLastStep > this.MIN_STEP_INTERVAL && 
            timeSinceLastStep < this.MAX_STEP_INTERVAL) {
          steps.push({
            timestamp,
            magnitude: filtered[i],
            duration: timeSinceLastStep,
            isLeft: isLeftFoot,
          });
          
          lastStepTime = timestamp;
          isLeftFoot = !isLeftFoot;
        } else if (lastStepTime === 0) {
          lastStepTime = timestamp;
        }
      }
    }

    return steps;
  }

  /**
   * Low-pass filter for smoothing
   */
  private lowPassFilter(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = -halfWindow; j <= halfWindow; j++) {
        if (i + j >= 0 && i + j < data.length) {
          sum += data[i + j];
          count++;
        }
      }
      
      result.push(sum / count);
    }

    return result;
  }

  /**
   * Segment steps into gait cycles
   */
  private segmentGaitCycles(steps: StepEvent[]): GaitCycle[] {
    const cycles: GaitCycle[] = [];
    const CYCLE_SIZE = 10; // Steps per cycle for analysis

    for (let i = 0; i < steps.length - CYCLE_SIZE; i += CYCLE_SIZE / 2) {
      const cycleSteps = steps.slice(i, i + CYCLE_SIZE);
      
      const strideTimes = cycleSteps.map(s => s.duration).filter(d => d > 0);
      const avgStrideTime = strideTimes.reduce((a, b) => a + b, 0) / strideTimes.length;
      const strideVariability = this.calculateCV(strideTimes);

      // Calculate symmetry (left vs right step times)
      const leftSteps = cycleSteps.filter(s => s.isLeft);
      const rightSteps = cycleSteps.filter(s => !s.isLeft);
      const leftAvg = leftSteps.length > 0 
        ? leftSteps.reduce((sum, s) => sum + s.duration, 0) / leftSteps.length 
        : avgStrideTime;
      const rightAvg = rightSteps.length > 0
        ? rightSteps.reduce((sum, s) => sum + s.duration, 0) / rightSteps.length
        : avgStrideTime;
      const symmetryIndex = 1 - Math.abs(leftAvg - rightAvg) / Math.max(leftAvg, rightAvg);

      cycles.push({
        startTime: cycleSteps[0].timestamp,
        endTime: cycleSteps[cycleSteps.length - 1].timestamp,
        steps: cycleSteps,
        cadence: 60000 / avgStrideTime,
        strideTime: avgStrideTime,
        strideVariability,
        symmetryIndex,
      });
    }

    return cycles;
  }

  /**
   * Extract comprehensive gait features
   */
  private extractFeatures(
    samples: MotionSample[],
    steps: StepEvent[],
    cycles: GaitCycle[]
  ): GaitFeatures {
    // Temporal features
    const strideTimes = steps.map(s => s.duration).filter(d => d > 0);
    const averageStrideTime = strideTimes.reduce((a, b) => a + b, 0) / strideTimes.length || 500;
    const averageCadence = 60000 / averageStrideTime;
    const cadenceVariability = this.calculateCV(strideTimes);
    const strideTimeVariability = this.calculateSD(strideTimes);

    // Stance/swing phase estimation (simplified)
    const stancePhaseRatio = 0.6; // Typical value
    const swingPhaseRatio = 0.4;

    // Spatial features from accelerometer
    const verticalAccel = samples.map(s => s.accelerometer.z);
    const lateralAccel = samples.map(s => s.accelerometer.x);
    const forwardAccel = samples.map(s => s.accelerometer.y);

    const verticalOscillation = this.calculateRange(verticalAccel);
    const lateralSway = this.calculateRange(lateralAccel);
    const forwardAccelerationPeak = Math.max(...forwardAccel.map(Math.abs));

    // Symmetry analysis
    const leftSteps = steps.filter(s => s.isLeft);
    const rightSteps = steps.filter(s => !s.isLeft);
    const leftAvgDuration = leftSteps.reduce((sum, s) => sum + s.duration, 0) / leftSteps.length || averageStrideTime;
    const rightAvgDuration = rightSteps.reduce((sum, s) => sum + s.duration, 0) / rightSteps.length || averageStrideTime;
    const leftRightAsymmetry = Math.abs(leftAvgDuration - rightAvgDuration) / Math.max(leftAvgDuration, rightAvgDuration);

    const leftMag = leftSteps.reduce((sum, s) => sum + s.magnitude, 0) / leftSteps.length || 1;
    const rightMag = rightSteps.reduce((sum, s) => sum + s.magnitude, 0) / rightSteps.length || 1;
    const stepLengthAsymmetry = Math.abs(leftMag - rightMag) / Math.max(leftMag, rightMag);

    // Regularity (autocorrelation-based)
    const stepRegularity = this.calculateRegularity(strideTimes, 1);
    const strideRegularity = this.calculateRegularity(strideTimes, 2);
    const walkingStability = (stepRegularity + strideRegularity) / 2;

    // Style indicators
    const heelStrikeIntensity = this.estimateHeelStrike(samples, steps);
    const pushOffIntensity = this.estimatePushOff(samples, steps);
    const armSwingEstimate = this.estimateArmSwing(samples);

    return {
      averageCadence,
      cadenceVariability,
      averageStrideTime,
      strideTimeVariability,
      stancePhaseRatio,
      swingPhaseRatio,
      verticalOscillation,
      lateralSway,
      forwardAccelerationPeak,
      leftRightAsymmetry,
      stepLengthAsymmetry,
      stepRegularity,
      strideRegularity,
      walkingStability,
      heelStrikeIntensity,
      pushOffIntensity,
      armSwingEstimate,
    };
  }

  /**
   * Calculate coefficient of variation
   */
  private calculateCV(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;
    const sd = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    return sd / mean;
  }

  /**
   * Calculate standard deviation
   */
  private calculateSD(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
  }

  /**
   * Calculate range of values
   */
  private calculateRange(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values) - Math.min(...values);
  }

  /**
   * Calculate regularity using autocorrelation
   */
  private calculateRegularity(values: number[], lag: number): number {
    if (values.length <= lag) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < values.length - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    if (denominator === 0) return 0;
    return Math.max(0, numerator / denominator);
  }

  /**
   * Estimate heel strike intensity
   */
  private estimateHeelStrike(samples: MotionSample[], steps: StepEvent[]): number {
    // Analyze deceleration peaks around step events
    let totalIntensity = 0;
    
    for (const step of steps) {
      const nearbyIdx = samples.findIndex(s => s.timestamp >= step.timestamp) - 5;
      if (nearbyIdx >= 0 && nearbyIdx < samples.length - 10) {
        const segment = samples.slice(nearbyIdx, nearbyIdx + 10);
        const decelerations = segment.map(s => -s.accelerometer.y);
        totalIntensity += Math.max(...decelerations);
      }
    }

    return steps.length > 0 ? totalIntensity / steps.length : 0;
  }

  /**
   * Estimate push-off intensity
   */
  private estimatePushOff(samples: MotionSample[], steps: StepEvent[]): number {
    // Analyze forward acceleration after step
    let totalIntensity = 0;

    for (const step of steps) {
      const nearbyIdx = samples.findIndex(s => s.timestamp >= step.timestamp);
      if (nearbyIdx >= 0 && nearbyIdx < samples.length - 10) {
        const segment = samples.slice(nearbyIdx, nearbyIdx + 10);
        const accelerations = segment.map(s => s.accelerometer.y);
        totalIntensity += Math.max(...accelerations);
      }
    }

    return steps.length > 0 ? totalIntensity / steps.length : 0;
  }

  /**
   * Estimate arm swing from lateral acceleration
   */
  private estimateArmSwing(samples: MotionSample[]): number {
    const lateralAccel = samples.map(s => s.accelerometer.x);
    
    // Calculate oscillation frequency in the lateral axis
    let zeroCrossings = 0;
    for (let i = 1; i < lateralAccel.length; i++) {
      if ((lateralAccel[i] >= 0 && lateralAccel[i - 1] < 0) ||
          (lateralAccel[i] < 0 && lateralAccel[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }

    // Normalize to expected arm swing frequency
    const duration = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000;
    const frequency = zeroCrossings / (2 * duration);
    
    // Expected arm swing ~ 0.5-1.5 Hz while walking
    return Math.min(1, frequency / 1.5);
  }

  /**
   * Generate fixed-length feature vector
   */
  private generateFeatureVector(features: GaitFeatures): number[] {
    return [
      features.averageCadence / 120, // Normalize to typical range
      features.cadenceVariability,
      features.averageStrideTime / 1000,
      features.strideTimeVariability / 200,
      features.verticalOscillation,
      features.lateralSway,
      features.forwardAccelerationPeak,
      features.leftRightAsymmetry,
      features.stepLengthAsymmetry,
      features.stepRegularity,
      features.strideRegularity,
      features.walkingStability,
      features.heelStrikeIntensity,
      features.pushOffIntensity,
      features.armSwingEstimate,
    ];
  }

  /**
   * Detect gait anomalies
   */
  private detectAnomalies(
    samples: MotionSample[],
    steps: StepEvent[],
    features: GaitFeatures
  ): GaitAnomaly[] {
    const anomalies: GaitAnomaly[] = [];

    // Check for irregular cadence
    if (features.cadenceVariability > 0.2) {
      anomalies.push({
        type: 'irregular_cadence',
        severity: features.cadenceVariability,
        timestamp: samples[0].timestamp,
        description: 'Walking pace is inconsistent',
      });
    }

    // Check for asymmetry (potential limp)
    if (features.leftRightAsymmetry > 0.15) {
      anomalies.push({
        type: 'asymmetry',
        severity: features.leftRightAsymmetry,
        timestamp: samples[0].timestamp,
        description: 'Left-right step timing asymmetry detected',
      });
    }

    if (features.stepLengthAsymmetry > 0.2) {
      anomalies.push({
        type: 'limping',
        severity: features.stepLengthAsymmetry,
        timestamp: samples[0].timestamp,
        description: 'Possible limping pattern detected',
      });
    }

    // Check for instability
    if (features.walkingStability < 0.5) {
      anomalies.push({
        type: 'instability',
        severity: 1 - features.walkingStability,
        timestamp: samples[0].timestamp,
        description: 'Walking pattern shows signs of instability',
      });
    }

    // Detect sudden changes in step pattern
    const strideTimes = steps.map(s => s.duration);
    for (let i = 3; i < strideTimes.length; i++) {
      const recentAvg = (strideTimes[i - 1] + strideTimes[i - 2] + strideTimes[i - 3]) / 3;
      const deviation = Math.abs(strideTimes[i] - recentAvg) / recentAvg;
      
      if (deviation > 0.4) {
        anomalies.push({
          type: 'sudden_change',
          severity: deviation,
          timestamp: steps[i].timestamp,
          description: 'Sudden change in step timing',
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate quality score of gait recording
   */
  private calculateQualityScore(
    samples: MotionSample[],
    steps: StepEvent[],
    features: GaitFeatures
  ): number {
    // Duration score
    const duration = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000;
    const durationScore = Math.min(1, duration / 30); // Ideal: 30+ seconds

    // Step count score
    const stepScore = Math.min(1, steps.length / 50); // Ideal: 50+ steps

    // Regularity score
    const regularityScore = features.walkingStability;

    // Signal quality (consistent sampling)
    const intervals = [];
    for (let i = 1; i < samples.length; i++) {
      intervals.push(samples[i].timestamp - samples[i - 1].timestamp);
    }
    const intervalCV = this.calculateCV(intervals);
    const signalQuality = Math.max(0, 1 - intervalCV * 2);

    return (
      durationScore * 0.25 +
      stepScore * 0.25 +
      regularityScore * 0.25 +
      signalQuality * 0.25
    );
  }

  /**
   * Compare two gait profiles
   */
  compareGaitProfiles(profile1: GaitProfile, profile2: GaitProfile): GaitComparison {
    const differences: { feature: string; expectedValue: number; actualValue: number; deviation: number }[] = [];

    // Compare feature vectors
    const v1 = profile1.featureVector;
    const v2 = profile2.featureVector;

    const featureNames = [
      'cadence', 'cadenceVariability', 'strideTime', 'strideVariability',
      'verticalOscillation', 'lateralSway', 'forwardPeak',
      'leftRightAsymmetry', 'stepLengthAsymmetry',
      'stepRegularity', 'strideRegularity', 'stability',
      'heelStrike', 'pushOff', 'armSwing',
    ];

    let totalDeviation = 0;

    for (let i = 0; i < v1.length; i++) {
      const deviation = Math.abs(v1[i] - v2[i]) / Math.max(v1[i], v2[i], 0.01);
      totalDeviation += deviation;

      if (deviation > 0.2) {
        differences.push({
          feature: featureNames[i] || `feature_${i}`,
          expectedValue: v1[i],
          actualValue: v2[i],
          deviation,
        });
      }
    }

    const avgDeviation = totalDeviation / v1.length;
    const similarity = Math.max(0, 1 - avgDeviation);
    const isMatch = similarity >= this.MATCH_THRESHOLD;
    const confidence = similarity * profile1.qualityScore * profile2.qualityScore;

    return {
      similarity,
      isMatch,
      confidence,
      differences,
    };
  }
}

export const gaitAnalyzer = new GaitAnalyzer();
