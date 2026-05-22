/**
 * Keystroke Dynamics Analyzer
 * 
 * Analyzes typing patterns for biometric identification:
 * - Key hold times (dwell time)
 * - Inter-key intervals (flight time)
 * - Typing rhythm and patterns
 * - Error correction behavior
 * - Pressure patterns (if available)
 */

export interface KeyEvent {
  key: string;
  code: string;
  type: 'keydown' | 'keyup';
  timestamp: number;
  pressure?: number; // For touch keyboards
}

export interface KeyPress {
  key: string;
  code: string;
  downTime: number;
  upTime: number;
  dwellTime: number; // Hold duration
  flightTime?: number; // Time since previous key up
  pressure?: number;
}

export interface DigraphTiming {
  keys: string; // e.g., "th", "he", "in"
  timing: number; // ms between first key down and second key down
  count: number;
}

export interface TrigraphTiming {
  keys: string; // e.g., "the", "ing", "and"
  timing: number; // Total time for the sequence
  count: number;
}

export interface KeystrokeFeatures {
  // Timing features
  averageDwellTime: number;
  dwellTimeVariance: number;
  averageFlightTime: number;
  flightTimeVariance: number;
  
  // Rhythm features
  typingSpeed: number; // Characters per minute
  rhythmConsistency: number;
  burstTypingRatio: number; // Ratio of fast sequences
  pauseFrequency: number; // Long pauses per 100 chars
  
  // Error behavior
  backspaceRatio: number;
  correctionSpeed: number;
  
  // Pattern features
  shiftHoldStyle: 'hold' | 'tap' | 'mixed';
  capsLockUsage: number;
  
  // Key-specific
  commonDigraphTimings: DigraphTiming[];
  commonTrigraphTimings: TrigraphTiming[];
  
  // Pressure (if available)
  averagePressure?: number;
  pressureVariance?: number;
}

export interface KeystrokeProfile {
  features: KeystrokeFeatures;
  keyPresses: KeyPress[];
  featureVector: number[];
  sampleText: string;
  totalCharacters: number;
  totalDuration: number;
  qualityScore: number;
}

export interface KeystrokeComparison {
  similarity: number;
  isMatch: boolean;
  confidence: number;
  matchedPatterns: string[];
  mismatchedPatterns: string[];
}

// Common digraphs in English
const COMMON_DIGRAPHS = ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te', 'of'];
const COMMON_TRIGRAPHS = ['the', 'and', 'ing', 'ion', 'tio', 'ent', 'ati', 'for', 'her', 'ter'];

class KeystrokeDynamicsAnalyzer {
  private readonly MIN_KEYPRESSES = 50;
  private readonly PAUSE_THRESHOLD = 500; // ms
  private readonly BURST_THRESHOLD = 100; // ms
  private readonly MATCH_THRESHOLD = 0.70;

  private pendingDowns: Map<string, { timestamp: number; key: string }> = new Map();
  private keyPresses: KeyPress[] = [];
  private rawEvents: KeyEvent[] = [];

  /**
   * Process a key event
   */
  processKeyEvent(event: KeyEvent): void {
    this.rawEvents.push(event);

    if (event.type === 'keydown') {
      this.pendingDowns.set(event.code, {
        timestamp: event.timestamp,
        key: event.key,
      });
    } else if (event.type === 'keyup') {
      const downEvent = this.pendingDowns.get(event.code);
      if (downEvent) {
        const lastKeyPress = this.keyPresses[this.keyPresses.length - 1];
        const flightTime = lastKeyPress 
          ? event.timestamp - lastKeyPress.upTime
          : undefined;

        this.keyPresses.push({
          key: downEvent.key,
          code: event.code,
          downTime: downEvent.timestamp,
          upTime: event.timestamp,
          dwellTime: event.timestamp - downEvent.timestamp,
          flightTime,
          pressure: event.pressure,
        });

        this.pendingDowns.delete(event.code);
      }
    }
  }

  /**
   * Analyze collected keystroke data
   */
  analyze(): KeystrokeProfile | null {
    if (this.keyPresses.length < this.MIN_KEYPRESSES) {
      console.warn('[KeystrokeDynamics] Insufficient data for analysis');
      return null;
    }

    const features = this.extractFeatures();
    const featureVector = this.generateFeatureVector(features);
    const sampleText = this.reconstructText();
    const qualityScore = this.calculateQuality(features);

    const profile: KeystrokeProfile = {
      features,
      keyPresses: [...this.keyPresses],
      featureVector,
      sampleText,
      totalCharacters: this.keyPresses.length,
      totalDuration: this.keyPresses[this.keyPresses.length - 1].upTime - this.keyPresses[0].downTime,
      qualityScore,
    };

    return profile;
  }

  /**
   * Clear collected data
   */
  clear(): void {
    this.pendingDowns.clear();
    this.keyPresses = [];
    this.rawEvents = [];
  }

  /**
   * Extract keystroke features
   */
  private extractFeatures(): KeystrokeFeatures {
    // Timing features
    const dwellTimes = this.keyPresses.map(kp => kp.dwellTime);
    const flightTimes = this.keyPresses
      .map(kp => kp.flightTime)
      .filter((ft): ft is number => ft !== undefined && ft >= 0);

    const averageDwellTime = this.mean(dwellTimes);
    const dwellTimeVariance = this.variance(dwellTimes);
    const averageFlightTime = flightTimes.length > 0 ? this.mean(flightTimes) : 0;
    const flightTimeVariance = flightTimes.length > 0 ? this.variance(flightTimes) : 0;

    // Typing speed
    const totalDuration = this.keyPresses[this.keyPresses.length - 1].upTime - this.keyPresses[0].downTime;
    const typingSpeed = (this.keyPresses.length / totalDuration) * 60000;

    // Rhythm consistency
    const rhythmConsistency = 1 / (1 + this.coefficientOfVariation(flightTimes));

    // Burst typing
    const bursts = flightTimes.filter(ft => ft < this.BURST_THRESHOLD);
    const burstTypingRatio = bursts.length / flightTimes.length;

    // Pause frequency
    const pauses = flightTimes.filter(ft => ft > this.PAUSE_THRESHOLD);
    const pauseFrequency = (pauses.length / this.keyPresses.length) * 100;

    // Error behavior
    const backspaces = this.keyPresses.filter(kp => 
      kp.key === 'Backspace' || kp.code === 'Backspace'
    );
    const backspaceRatio = backspaces.length / this.keyPresses.length;

    // Correction speed (time after backspace)
    const correctionTimes: number[] = [];
    for (let i = 0; i < this.keyPresses.length - 1; i++) {
      if (this.keyPresses[i].key === 'Backspace' && this.keyPresses[i + 1].flightTime) {
        correctionTimes.push(this.keyPresses[i + 1].flightTime);
      }
    }
    const correctionSpeed = correctionTimes.length > 0 ? this.mean(correctionTimes) : 0;

    // Shift key behavior
    const shiftHoldStyle = this.analyzeShiftStyle();

    // Caps lock usage
    const capsLockPresses = this.keyPresses.filter(kp => kp.code === 'CapsLock');
    const capsLockUsage = capsLockPresses.length / this.keyPresses.length;

    // Digraph and trigraph timings
    const commonDigraphTimings = this.extractDigraphTimings();
    const commonTrigraphTimings = this.extractTrigraphTimings();

    // Pressure features
    const pressures = this.keyPresses
      .map(kp => kp.pressure)
      .filter((p): p is number => p !== undefined);
    
    const averagePressure = pressures.length > 0 ? this.mean(pressures) : undefined;
    const pressureVariance = pressures.length > 0 ? this.variance(pressures) : undefined;

    return {
      averageDwellTime,
      dwellTimeVariance,
      averageFlightTime,
      flightTimeVariance,
      typingSpeed,
      rhythmConsistency,
      burstTypingRatio,
      pauseFrequency,
      backspaceRatio,
      correctionSpeed,
      shiftHoldStyle,
      capsLockUsage,
      commonDigraphTimings,
      commonTrigraphTimings,
      averagePressure,
      pressureVariance,
    };
  }

  /**
   * Analyze shift key usage style
   */
  private analyzeShiftStyle(): 'hold' | 'tap' | 'mixed' {
    const shiftPresses = this.keyPresses.filter(kp => 
      kp.code === 'ShiftLeft' || kp.code === 'ShiftRight'
    );

    if (shiftPresses.length === 0) return 'tap';

    const avgShiftDwell = this.mean(shiftPresses.map(sp => sp.dwellTime));
    
    // If shift is held for multiple characters, it's a hold style
    if (avgShiftDwell > 200) return 'hold';
    if (avgShiftDwell < 100) return 'tap';
    return 'mixed';
  }

  /**
   * Extract digraph timings
   */
  private extractDigraphTimings(): DigraphTiming[] {
    const timings: Map<string, number[]> = new Map();
    const text = this.reconstructText().toLowerCase();

    for (let i = 0; i < this.keyPresses.length - 1; i++) {
      const k1 = this.keyPresses[i].key.toLowerCase();
      const k2 = this.keyPresses[i + 1].key.toLowerCase();
      
      if (k1.length === 1 && k2.length === 1) {
        const digraph = k1 + k2;
        
        if (COMMON_DIGRAPHS.includes(digraph)) {
          const timing = this.keyPresses[i + 1].downTime - this.keyPresses[i].downTime;
          
          if (!timings.has(digraph)) {
            timings.set(digraph, []);
          }
          timings.get(digraph)!.push(timing);
        }
      }
    }

    return Array.from(timings.entries()).map(([keys, times]) => ({
      keys,
      timing: this.mean(times),
      count: times.length,
    }));
  }

  /**
   * Extract trigraph timings
   */
  private extractTrigraphTimings(): TrigraphTiming[] {
    const timings: Map<string, number[]> = new Map();

    for (let i = 0; i < this.keyPresses.length - 2; i++) {
      const k1 = this.keyPresses[i].key.toLowerCase();
      const k2 = this.keyPresses[i + 1].key.toLowerCase();
      const k3 = this.keyPresses[i + 2].key.toLowerCase();
      
      if (k1.length === 1 && k2.length === 1 && k3.length === 1) {
        const trigraph = k1 + k2 + k3;
        
        if (COMMON_TRIGRAPHS.includes(trigraph)) {
          const timing = this.keyPresses[i + 2].upTime - this.keyPresses[i].downTime;
          
          if (!timings.has(trigraph)) {
            timings.set(trigraph, []);
          }
          timings.get(trigraph)!.push(timing);
        }
      }
    }

    return Array.from(timings.entries()).map(([keys, times]) => ({
      keys,
      timing: this.mean(times),
      count: times.length,
    }));
  }

  /**
   * Reconstruct typed text
   */
  private reconstructText(): string {
    let text = '';
    
    for (const kp of this.keyPresses) {
      if (kp.key === 'Backspace') {
        text = text.slice(0, -1);
      } else if (kp.key.length === 1) {
        text += kp.key;
      } else if (kp.key === 'Space' || kp.key === ' ') {
        text += ' ';
      } else if (kp.key === 'Enter') {
        text += '\n';
      }
    }
    
    return text;
  }

  /**
   * Generate feature vector
   */
  private generateFeatureVector(features: KeystrokeFeatures): number[] {
    const digraphVector = COMMON_DIGRAPHS.map(dg => {
      const found = features.commonDigraphTimings.find(t => t.keys === dg);
      return found ? found.timing / 500 : 0; // Normalize
    });

    return [
      features.averageDwellTime / 200,
      features.dwellTimeVariance / 1000,
      features.averageFlightTime / 300,
      features.flightTimeVariance / 1000,
      features.typingSpeed / 400,
      features.rhythmConsistency,
      features.burstTypingRatio,
      features.pauseFrequency / 10,
      features.backspaceRatio,
      features.correctionSpeed / 500,
      features.shiftHoldStyle === 'hold' ? 1 : features.shiftHoldStyle === 'tap' ? 0 : 0.5,
      features.capsLockUsage,
      features.averagePressure || 0.5,
      features.pressureVariance || 0,
      ...digraphVector,
    ];
  }

  /**
   * Calculate profile quality
   */
  private calculateQuality(features: KeystrokeFeatures): number {
    // More characters = better quality
    const charScore = Math.min(1, this.keyPresses.length / 200);
    
    // Consistent rhythm = better quality
    const rhythmScore = features.rhythmConsistency;
    
    // Good variety of digraphs
    const digraphScore = Math.min(1, features.commonDigraphTimings.length / 10);

    return (charScore * 0.4 + rhythmScore * 0.4 + digraphScore * 0.2);
  }

  /**
   * Compare two keystroke profiles
   */
  compareProfiles(profile1: KeystrokeProfile, profile2: KeystrokeProfile): KeystrokeComparison {
    const matchedPatterns: string[] = [];
    const mismatchedPatterns: string[] = [];

    // Compare feature vectors
    const similarity = this.cosineSimilarity(profile1.featureVector, profile2.featureVector);

    // Compare digraph timings
    for (const dt1 of profile1.features.commonDigraphTimings) {
      const dt2 = profile2.features.commonDigraphTimings.find(d => d.keys === dt1.keys);
      if (dt2) {
        const timingRatio = Math.min(dt1.timing, dt2.timing) / Math.max(dt1.timing, dt2.timing);
        if (timingRatio > 0.7) {
          matchedPatterns.push(`Digraph "${dt1.keys}"`);
        } else {
          mismatchedPatterns.push(`Digraph "${dt1.keys}" timing difference`);
        }
      }
    }

    // Compare key characteristics
    const dwellRatio = Math.min(
      profile1.features.averageDwellTime,
      profile2.features.averageDwellTime
    ) / Math.max(
      profile1.features.averageDwellTime,
      profile2.features.averageDwellTime
    );

    if (dwellRatio > 0.7) {
      matchedPatterns.push('Similar key hold time');
    } else {
      mismatchedPatterns.push('Different key hold time');
    }

    const speedRatio = Math.min(
      profile1.features.typingSpeed,
      profile2.features.typingSpeed
    ) / Math.max(
      profile1.features.typingSpeed,
      profile2.features.typingSpeed
    );

    if (speedRatio > 0.7) {
      matchedPatterns.push('Similar typing speed');
    } else {
      mismatchedPatterns.push('Different typing speed');
    }

    const isMatch = similarity >= this.MATCH_THRESHOLD;
    const confidence = similarity * Math.min(profile1.qualityScore, profile2.qualityScore);

    return {
      similarity,
      isMatch,
      confidence,
      matchedPatterns,
      mismatchedPatterns,
    };
  }

  // Utility functions
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const m = this.mean(values);
    return values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
  }

  private coefficientOfVariation(values: number[]): number {
    const m = this.mean(values);
    if (m === 0) return 0;
    return Math.sqrt(this.variance(values)) / m;
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0;
    
    let dot = 0, norm1 = 0, norm2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

export const keystrokeDynamicsAnalyzer = new KeystrokeDynamicsAnalyzer();

/**
 * Factory function to create a new analyzer instance
 */
export function createKeystrokeAnalyzer(): KeystrokeDynamicsAnalyzer {
  return new KeystrokeDynamicsAnalyzer();
}
