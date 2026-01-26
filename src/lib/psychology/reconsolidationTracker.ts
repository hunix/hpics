/**
 * Reconsolidation Window Tracker (v9.0)
 * 
 * Source: BMC Psychiatry (June 2025) - Memory Blockade Research
 * 
 * The 6-hour reconsolidation window after memory retrieval is when
 * memories are most malleable for intervention.
 */

export interface MemoryEvent {
  id: string;
  profileId: string;
  memoryType: 'episodic' | 'semantic' | 'procedural' | 'emotional';
  memoryContent: string;
  emotionalValence: number; // -1 to 1
  retrievalTimestamp: Date;
  reconsolidationWindowEnd: Date;
  interventionApplied: boolean;
  malleabilityScore: number;
}

export interface ReconsolidationWindow {
  isOpen: boolean;
  timeRemaining: number; // milliseconds
  peakMalleabilityAt: Date;
  currentMalleability: number;
  optimalInterventionWindow: { start: Date; end: Date };
}

export interface InterventionStrategy {
  type: 'reframe' | 'extinction' | 'interference' | 'propranolol_simulation';
  timing: 'immediate' | 'peak' | 'late_window';
  content: string;
  expectedEffectiveness: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SuggestibilityProfile {
  overallScore: number;
  guidedImagerySusceptibility: number;
  pressureCompliance: number;
  socialConformity: number;
  confidenceCalibration: number;
  sourceMonitoringAccuracy: number;
  factors: SuggestibilityFactor[];
}

export interface SuggestibilityFactor {
  name: string;
  score: number;
  indicators: string[];
  exploitabilityLevel: 'low' | 'medium' | 'high';
}

const RECONSOLIDATION_WINDOW_HOURS = 6;
const PEAK_MALLEABILITY_HOURS = 2;

/**
 * Track memory retrieval and calculate reconsolidation windows
 */
export function trackMemoryRetrieval(
  profileId: string,
  memoryContent: string,
  memoryType: MemoryEvent['memoryType'],
  emotionalValence: number
): MemoryEvent {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + RECONSOLIDATION_WINDOW_HOURS * 60 * 60 * 1000);
  
  // Emotional memories have higher malleability
  const baseMalleability = 0.5;
  const emotionalBoost = Math.abs(emotionalValence) * 0.3;
  const typeMultiplier = getTypeMultiplier(memoryType);
  
  return {
    id: crypto.randomUUID(),
    profileId,
    memoryType,
    memoryContent,
    emotionalValence,
    retrievalTimestamp: now,
    reconsolidationWindowEnd: windowEnd,
    interventionApplied: false,
    malleabilityScore: Math.min(1, (baseMalleability + emotionalBoost) * typeMultiplier),
  };
}

function getTypeMultiplier(type: MemoryEvent['memoryType']): number {
  const multipliers: Record<MemoryEvent['memoryType'], number> = {
    emotional: 1.4,
    episodic: 1.2,
    semantic: 0.8,
    procedural: 0.6,
  };
  return multipliers[type];
}

/**
 * Get current reconsolidation window status
 */
export function getReconsolidationWindow(event: MemoryEvent): ReconsolidationWindow {
  const now = new Date();
  const retrievalTime = new Date(event.retrievalTimestamp).getTime();
  const windowEndTime = new Date(event.reconsolidationWindowEnd).getTime();
  const nowTime = now.getTime();
  
  const isOpen = nowTime < windowEndTime;
  const timeRemaining = Math.max(0, windowEndTime - nowTime);
  
  // Peak malleability occurs 1-2 hours after retrieval
  const peakStart = retrievalTime + (1 * 60 * 60 * 1000);
  const peakEnd = retrievalTime + (PEAK_MALLEABILITY_HOURS * 60 * 60 * 1000);
  
  // Calculate current malleability based on time curve
  const hoursElapsed = (nowTime - retrievalTime) / (60 * 60 * 1000);
  let currentMalleability = 0;
  
  if (isOpen) {
    if (hoursElapsed < 1) {
      // Rising phase
      currentMalleability = event.malleabilityScore * (0.5 + hoursElapsed * 0.5);
    } else if (hoursElapsed < 2) {
      // Peak phase
      currentMalleability = event.malleabilityScore;
    } else {
      // Decay phase
      const decayFactor = Math.exp(-(hoursElapsed - 2) / 2);
      currentMalleability = event.malleabilityScore * decayFactor;
    }
  }
  
  return {
    isOpen,
    timeRemaining,
    peakMalleabilityAt: new Date(peakStart + (peakEnd - peakStart) / 2),
    currentMalleability,
    optimalInterventionWindow: {
      start: new Date(peakStart),
      end: new Date(peakEnd),
    },
  };
}

/**
 * Generate intervention strategies for reconsolidation window
 */
export function generateInterventionStrategies(
  event: MemoryEvent,
  window: ReconsolidationWindow
): InterventionStrategy[] {
  const strategies: InterventionStrategy[] = [];
  
  if (!window.isOpen) {
    return strategies;
  }
  
  // Reframing strategy - works best for emotional memories
  if (event.memoryType === 'emotional' || Math.abs(event.emotionalValence) > 0.5) {
    strategies.push({
      type: 'reframe',
      timing: 'peak',
      content: 'Present alternative interpretation of the memory event',
      expectedEffectiveness: 0.75 * window.currentMalleability,
      riskLevel: 'low',
    });
  }
  
  // Extinction strategy - gradually reduce emotional response
  strategies.push({
    type: 'extinction',
    timing: 'immediate',
    content: 'Repeated exposure without reinforcement',
    expectedEffectiveness: 0.65 * window.currentMalleability,
    riskLevel: 'medium',
  });
  
  // Interference strategy - introduce competing memories
  strategies.push({
    type: 'interference',
    timing: 'late_window',
    content: 'Present contradictory information during consolidation',
    expectedEffectiveness: 0.55 * window.currentMalleability,
    riskLevel: 'medium',
  });
  
  // Propranolol simulation - reduce emotional tagging
  if (event.emotionalValence < -0.3) {
    strategies.push({
      type: 'propranolol_simulation',
      timing: 'immediate',
      content: 'Simulate beta-blocker effect on emotional memory',
      expectedEffectiveness: 0.85 * window.currentMalleability,
      riskLevel: 'high',
    });
  }
  
  return strategies.sort((a, b) => b.expectedEffectiveness - a.expectedEffectiveness);
}

/**
 * Profile suggestibility based on behavioral indicators
 */
export function profileSuggestibility(
  behaviors: {
    complianceEvents: number;
    resistanceEvents: number;
    conformityInstances: number;
    independentDecisions: number;
    confidenceAccuracy: number; // correlation between stated confidence and correctness
    sourceAttributionErrors: number;
    totalAttributions: number;
  }
): SuggestibilityProfile {
  const factors: SuggestibilityFactor[] = [];
  
  // Pressure compliance
  const totalPressure = behaviors.complianceEvents + behaviors.resistanceEvents;
  const pressureCompliance = totalPressure > 0 
    ? behaviors.complianceEvents / totalPressure 
    : 0.5;
  
  factors.push({
    name: 'Authority Compliance',
    score: pressureCompliance,
    indicators: pressureCompliance > 0.7 
      ? ['High deference to authority', 'Easily influenced by experts'] 
      : ['Shows independent thinking', 'Questions authority'],
    exploitabilityLevel: pressureCompliance > 0.7 ? 'high' : pressureCompliance > 0.4 ? 'medium' : 'low',
  });
  
  // Social conformity
  const totalSocial = behaviors.conformityInstances + behaviors.independentDecisions;
  const socialConformity = totalSocial > 0 
    ? behaviors.conformityInstances / totalSocial 
    : 0.5;
  
  factors.push({
    name: 'Social Conformity',
    score: socialConformity,
    indicators: socialConformity > 0.6 
      ? ['Follows group consensus', 'Seeks social validation'] 
      : ['Independent thinker', 'Comfortable with minority views'],
    exploitabilityLevel: socialConformity > 0.7 ? 'high' : socialConformity > 0.4 ? 'medium' : 'low',
  });
  
  // Confidence calibration (poor calibration = more suggestible)
  const calibrationError = 1 - behaviors.confidenceAccuracy;
  
  factors.push({
    name: 'Metacognitive Accuracy',
    score: 1 - calibrationError,
    indicators: calibrationError > 0.3 
      ? ['Overconfident in incorrect beliefs', 'Poor self-awareness'] 
      : ['Accurate self-assessment', 'Appropriate uncertainty'],
    exploitabilityLevel: calibrationError > 0.4 ? 'high' : calibrationError > 0.2 ? 'medium' : 'low',
  });
  
  // Source monitoring
  const sourceAccuracy = behaviors.totalAttributions > 0 
    ? 1 - (behaviors.sourceAttributionErrors / behaviors.totalAttributions) 
    : 0.5;
  
  factors.push({
    name: 'Source Monitoring',
    score: sourceAccuracy,
    indicators: sourceAccuracy < 0.7 
      ? ['Confuses information sources', 'Vulnerable to misinformation'] 
      : ['Accurate source tracking', 'Skeptical of unverified claims'],
    exploitabilityLevel: sourceAccuracy < 0.6 ? 'high' : sourceAccuracy < 0.8 ? 'medium' : 'low',
  });
  
  // Calculate overall suggestibility
  const overallScore = (pressureCompliance * 0.3 + socialConformity * 0.25 + 
                        calibrationError * 0.25 + (1 - sourceAccuracy) * 0.2);
  
  return {
    overallScore,
    guidedImagerySusceptibility: (pressureCompliance + socialConformity) / 2,
    pressureCompliance,
    socialConformity,
    confidenceCalibration: behaviors.confidenceAccuracy,
    sourceMonitoringAccuracy: sourceAccuracy,
    factors,
  };
}

/**
 * Detect optimal intervention timing across multiple memory events
 */
export function findOptimalInterventionWindows(
  events: MemoryEvent[]
): Array<{ event: MemoryEvent; window: ReconsolidationWindow; urgency: 'critical' | 'high' | 'medium' | 'low' }> {
  const now = new Date();
  
  return events
    .map(event => ({
      event,
      window: getReconsolidationWindow(event),
    }))
    .filter(({ window }) => window.isOpen)
    .map(({ event, window }) => {
      const hoursRemaining = window.timeRemaining / (60 * 60 * 1000);
      const inPeakWindow = now >= window.optimalInterventionWindow.start && 
                           now <= window.optimalInterventionWindow.end;
      
      let urgency: 'critical' | 'high' | 'medium' | 'low';
      if (inPeakWindow && window.currentMalleability > 0.7) {
        urgency = 'critical';
      } else if (inPeakWindow || hoursRemaining < 1) {
        urgency = 'high';
      } else if (hoursRemaining < 3) {
        urgency = 'medium';
      } else {
        urgency = 'low';
      }
      
      return { event, window, urgency };
    })
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
}
