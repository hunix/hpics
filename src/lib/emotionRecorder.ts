/**
 * Emotion Recorder
 * 
 * Tracks emotional state over time during video/meeting recordings.
 * Detects micro-expression changes and flags significant emotional shifts.
 */

export interface EmotionSample {
  timestamp: number;
  expression: string;
  confidence: number;
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
}

export interface EmotionShift {
  timestamp: number;
  fromExpression: string;
  toExpression: string;
  significance: number; // 0-1, how significant the shift was
  duration: number; // ms
}

export interface EmotionTimeline {
  startTime: number;
  endTime: number;
  samples: EmotionSample[];
  shifts: EmotionShift[];
  dominantEmotion: string;
  averageValence: number;
  averageArousal: number;
  emotionDistribution: Record<string, number>;
}

// Valence and arousal mappings for each expression
const EMOTION_PROPERTIES: Record<string, { valence: number; arousal: number }> = {
  happy: { valence: 0.8, arousal: 0.6 },
  sad: { valence: -0.7, arousal: 0.2 },
  angry: { valence: -0.8, arousal: 0.9 },
  fearful: { valence: -0.6, arousal: 0.8 },
  disgusted: { valence: -0.5, arousal: 0.5 },
  surprised: { valence: 0.2, arousal: 0.9 },
  neutral: { valence: 0, arousal: 0.3 },
};

// Threshold for detecting significant emotion shifts
const SHIFT_SIGNIFICANCE_THRESHOLD = 0.5;
const MIN_SHIFT_DURATION_MS = 500;

export class EmotionRecorder {
  private samples: EmotionSample[] = [];
  private shifts: EmotionShift[] = [];
  private startTime: number = 0;
  private lastExpression: string = 'neutral';
  private expressionStartTime: number = 0;
  private isRecording: boolean = false;

  /**
   * Start recording emotions
   */
  start(): void {
    this.samples = [];
    this.shifts = [];
    this.startTime = Date.now();
    this.lastExpression = 'neutral';
    this.expressionStartTime = this.startTime;
    this.isRecording = true;
  }

  /**
   * Stop recording and return the timeline
   */
  stop(): EmotionTimeline {
    this.isRecording = false;
    const endTime = Date.now();
    
    return this.generateTimeline(endTime);
  }

  /**
   * Record an emotion sample
   */
  recordSample(expression: string, confidence: number): void {
    if (!this.isRecording) return;
    
    const timestamp = Date.now();
    const props = EMOTION_PROPERTIES[expression] || EMOTION_PROPERTIES.neutral;
    
    const sample: EmotionSample = {
      timestamp,
      expression,
      confidence,
      valence: props.valence,
      arousal: props.arousal,
    };
    
    this.samples.push(sample);
    
    // Detect shifts
    if (expression !== this.lastExpression) {
      const shiftDuration = timestamp - this.expressionStartTime;
      
      if (shiftDuration >= MIN_SHIFT_DURATION_MS) {
        const significance = this.calculateShiftSignificance(
          this.lastExpression,
          expression
        );
        
        if (significance >= SHIFT_SIGNIFICANCE_THRESHOLD) {
          this.shifts.push({
            timestamp,
            fromExpression: this.lastExpression,
            toExpression: expression,
            significance,
            duration: shiftDuration,
          });
        }
      }
      
      this.lastExpression = expression;
      this.expressionStartTime = timestamp;
    }
  }

  /**
   * Calculate how significant an emotion shift is
   */
  private calculateShiftSignificance(from: string, to: string): number {
    const fromProps = EMOTION_PROPERTIES[from] || EMOTION_PROPERTIES.neutral;
    const toProps = EMOTION_PROPERTIES[to] || EMOTION_PROPERTIES.neutral;
    
    // Calculate euclidean distance in valence-arousal space
    const valenceDiff = Math.abs(fromProps.valence - toProps.valence);
    const arousalDiff = Math.abs(fromProps.arousal - toProps.arousal);
    
    const distance = Math.sqrt(valenceDiff ** 2 + arousalDiff ** 2);
    
    // Normalize to 0-1 (max distance is about 2.4)
    return Math.min(1, distance / 2.4);
  }

  /**
   * Generate the emotion timeline summary
   */
  private generateTimeline(endTime: number): EmotionTimeline {
    const emotionCounts: Record<string, number> = {};
    let totalValence = 0;
    let totalArousal = 0;
    
    for (const sample of this.samples) {
      emotionCounts[sample.expression] = (emotionCounts[sample.expression] || 0) + 1;
      totalValence += sample.valence;
      totalArousal += sample.arousal;
    }
    
    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion;
      }
    }
    
    // Calculate distribution percentages
    const emotionDistribution: Record<string, number> = {};
    const total = this.samples.length || 1;
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      emotionDistribution[emotion] = count / total;
    }
    
    return {
      startTime: this.startTime,
      endTime,
      samples: this.samples,
      shifts: this.shifts,
      dominantEmotion,
      averageValence: this.samples.length > 0 ? totalValence / this.samples.length : 0,
      averageArousal: this.samples.length > 0 ? totalArousal / this.samples.length : 0,
      emotionDistribution,
    };
  }

  /**
   * Get current recording status
   */
  getStatus(): { 
    isRecording: boolean; 
    sampleCount: number; 
    shiftCount: number;
    duration: number;
  } {
    return {
      isRecording: this.isRecording,
      sampleCount: this.samples.length,
      shiftCount: this.shifts.length,
      duration: this.isRecording ? Date.now() - this.startTime : 0,
    };
  }

  /**
   * Get the most recent samples for display
   */
  getRecentSamples(count: number = 10): EmotionSample[] {
    return this.samples.slice(-count);
  }

  /**
   * Detect micro-expressions (brief flashes of emotion)
   */
  detectMicroExpressions(): EmotionSample[] {
    const microExpressions: EmotionSample[] = [];
    
    for (let i = 1; i < this.samples.length - 1; i++) {
      const prev = this.samples[i - 1];
      const curr = this.samples[i];
      const next = this.samples[i + 1];
      
      // Check if current differs from both neighbors (brief flash)
      if (
        curr.expression !== prev.expression &&
        curr.expression !== next.expression &&
        curr.expression !== 'neutral' &&
        curr.confidence > 0.7
      ) {
        const duration = next.timestamp - prev.timestamp;
        // Micro-expressions typically last 40-500ms
        if (duration < 1000) {
          microExpressions.push(curr);
        }
      }
    }
    
    return microExpressions;
  }
}

// Singleton instance for global recording
export const emotionRecorder = new EmotionRecorder();

/**
 * Analyze emotional engagement from a timeline
 */
export function analyzeEngagement(timeline: EmotionTimeline): {
  engagementScore: number;
  positivityScore: number;
  variabilityScore: number;
  keyMoments: EmotionShift[];
} {
  // Engagement = high arousal, more shifts
  const engagementScore = Math.min(1, 
    timeline.averageArousal * 0.6 + 
    (timeline.shifts.length / Math.max(1, timeline.samples.length / 30)) * 0.4
  );
  
  // Positivity = high valence
  const positivityScore = (timeline.averageValence + 1) / 2;
  
  // Variability = diversity of emotions
  const emotionCount = Object.keys(timeline.emotionDistribution).length;
  const variabilityScore = Math.min(1, emotionCount / 5);
  
  // Key moments = most significant shifts
  const keyMoments = [...timeline.shifts]
    .sort((a, b) => b.significance - a.significance)
    .slice(0, 5);
  
  return {
    engagementScore,
    positivityScore,
    variabilityScore,
    keyMoments,
  };
}
