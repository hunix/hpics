/**
 * Continuous Authentication Engine (v9.0)
 * 
 * Source: Scoping Review 2024 - Touch & Motion Biometrics
 * 
 * Silent identity verification through behavioral biometrics:
 * keystroke dynamics, touch patterns, mouse movements, gait analysis.
 */

export interface KeystrokeProfile {
  userId: string;
  dwellTimes: Map<string, number[]>; // key -> array of dwell times (ms)
  flightTimes: Map<string, number[]>; // key pair -> array of flight times (ms)
  pressurePatterns: number[];
  typingRhythm: number; // standard deviation of inter-key intervals
  errorRate: number;
  wordsPerMinute: number;
}

export interface TouchProfile {
  userId: string;
  averagePressure: number;
  touchSize: { width: number; height: number };
  swipeVelocity: number;
  tapDuration: number;
  holdDuration: number;
  multiTouchPatterns: string[];
}

export interface MouseProfile {
  userId: string;
  movementVelocity: number;
  accelerationPattern: number[];
  curveRadius: number; // average curvature of movements
  clickDuration: number;
  doubleClickInterval: number;
  scrollVelocity: number;
  scrollPatterns: 'smooth' | 'jerky' | 'stepped';
}

export interface GaitProfile {
  userId: string;
  stepFrequency: number;
  stepLength: number;
  verticalOscillation: number;
  lateralSway: number;
  groundContactTime: number;
  flightTime: number;
  cadenceVariability: number;
  accelerometerSignature: number[];
  gyroscopeSignature: number[];
}

export interface CognitiveStateEstimate {
  attentionLevel: number;
  stressLevel: number;
  fatigueLevel: number;
  cognitiveLoad: number;
  emotionalState: 'calm' | 'anxious' | 'frustrated' | 'focused' | 'distracted';
  confidence: number;
}

export interface AuthenticationResult {
  isAuthentic: boolean;
  confidence: number;
  matchedModalities: string[];
  anomalies: BiometricAnomaly[];
  cognitiveState: CognitiveStateEstimate;
  riskScore: number;
}

export interface BiometricAnomaly {
  modality: 'keystroke' | 'touch' | 'mouse' | 'gait';
  type: 'velocity' | 'pattern' | 'timing' | 'pressure';
  deviation: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Analyze keystroke dynamics for authentication
 */
export function analyzeKeystrokeDynamics(
  events: Array<{ key: string; timestamp: number; pressure?: number; duration: number }>
): { profile: Partial<KeystrokeProfile>; anomalies: BiometricAnomaly[] } {
  const anomalies: BiometricAnomaly[] = [];
  const dwellTimes = new Map<string, number[]>();
  const flightTimes = new Map<string, number[]>();
  const pressures: number[] = [];
  const interKeyIntervals: number[] = [];
  
  let lastTimestamp = 0;
  let lastKey = '';
  
  for (const event of events) {
    // Dwell time (how long key is held)
    if (!dwellTimes.has(event.key)) {
      dwellTimes.set(event.key, []);
    }
    dwellTimes.get(event.key)!.push(event.duration);
    
    // Flight time (time between keys)
    if (lastTimestamp > 0) {
      const flightTime = event.timestamp - lastTimestamp;
      const keyPair = `${lastKey}->${event.key}`;
      if (!flightTimes.has(keyPair)) {
        flightTimes.set(keyPair, []);
      }
      flightTimes.get(keyPair)!.push(flightTime);
      interKeyIntervals.push(flightTime);
    }
    
    if (event.pressure !== undefined) {
      pressures.push(event.pressure);
    }
    
    lastTimestamp = event.timestamp + event.duration;
    lastKey = event.key;
  }
  
  // Calculate typing rhythm (std dev of intervals)
  const typingRhythm = calculateStdDev(interKeyIntervals);
  
  // Detect anomalies - unusually fast or slow typing
  const avgInterval = interKeyIntervals.reduce((a, b) => a + b, 0) / interKeyIntervals.length;
  if (avgInterval < 50) {
    anomalies.push({
      modality: 'keystroke',
      type: 'velocity',
      deviation: (50 - avgInterval) / 50,
      description: 'Typing speed exceeds human capability - possible bot',
      severity: 'critical',
    });
  }
  
  // Calculate WPM (assuming average word is 5 characters)
  const totalTime = events[events.length - 1]?.timestamp - events[0]?.timestamp || 1;
  const wordsPerMinute = (events.length / 5) / (totalTime / 60000);
  
  return {
    profile: {
      dwellTimes,
      flightTimes,
      pressurePatterns: pressures,
      typingRhythm,
      wordsPerMinute,
    },
    anomalies,
  };
}

/**
 * Analyze touch patterns for authentication
 */
export function analyzeTouchPatterns(
  events: Array<{
    type: 'tap' | 'swipe' | 'hold' | 'pinch';
    pressure: number;
    size: { width: number; height: number };
    velocity?: number;
    duration: number;
  }>
): { profile: Partial<TouchProfile>; anomalies: BiometricAnomaly[] } {
  const anomalies: BiometricAnomaly[] = [];
  
  const pressures = events.map(e => e.pressure);
  const sizes = events.map(e => e.size);
  const swipes = events.filter(e => e.type === 'swipe');
  const taps = events.filter(e => e.type === 'tap');
  const holds = events.filter(e => e.type === 'hold');
  
  const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
  const avgWidth = sizes.reduce((a, b) => a + b.width, 0) / sizes.length;
  const avgHeight = sizes.reduce((a, b) => a + b.height, 0) / sizes.length;
  const avgSwipeVelocity = swipes.length > 0 
    ? swipes.reduce((a, b) => a + (b.velocity || 0), 0) / swipes.length 
    : 0;
  const avgTapDuration = taps.length > 0 
    ? taps.reduce((a, b) => a + b.duration, 0) / taps.length 
    : 0;
  const avgHoldDuration = holds.length > 0 
    ? holds.reduce((a, b) => a + b.duration, 0) / holds.length 
    : 0;
  
  // Detect pressure anomalies
  const pressureStdDev = calculateStdDev(pressures);
  if (pressureStdDev < 0.01) {
    anomalies.push({
      modality: 'touch',
      type: 'pressure',
      deviation: 1 - pressureStdDev,
      description: 'Uniform pressure suggests simulated touch',
      severity: 'high',
    });
  }
  
  // Detect unrealistic touch sizes
  if (avgWidth < 5 || avgHeight < 5) {
    anomalies.push({
      modality: 'touch',
      type: 'pattern',
      deviation: 1,
      description: 'Touch size too small for human finger',
      severity: 'critical',
    });
  }
  
  return {
    profile: {
      averagePressure: avgPressure,
      touchSize: { width: avgWidth, height: avgHeight },
      swipeVelocity: avgSwipeVelocity,
      tapDuration: avgTapDuration,
      holdDuration: avgHoldDuration,
    },
    anomalies,
  };
}

/**
 * Analyze mouse movement patterns
 */
export function analyzeMouseMovements(
  events: Array<{
    x: number;
    y: number;
    timestamp: number;
    type: 'move' | 'click' | 'scroll';
    scrollDelta?: number;
  }>
): { profile: Partial<MouseProfile>; anomalies: BiometricAnomaly[] } {
  const anomalies: BiometricAnomaly[] = [];
  const velocities: number[] = [];
  const accelerations: number[] = [];
  const curvatures: number[] = [];
  
  let lastEvent: typeof events[0] | null = null;
  let lastVelocity = 0;
  
  for (const event of events.filter(e => e.type === 'move')) {
    if (lastEvent) {
      const dx = event.x - lastEvent.x;
      const dy = event.y - lastEvent.y;
      const dt = event.timestamp - lastEvent.timestamp;
      
      if (dt > 0) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = distance / dt;
        velocities.push(velocity);
        
        const acceleration = (velocity - lastVelocity) / dt;
        accelerations.push(acceleration);
        lastVelocity = velocity;
        
        // Estimate curvature from direction changes
        if (velocities.length >= 3) {
          const v1 = velocities[velocities.length - 3];
          const v2 = velocities[velocities.length - 2];
          const v3 = velocities[velocities.length - 1];
          const curvature = Math.abs((v3 - 2 * v2 + v1));
          curvatures.push(curvature);
        }
      }
    }
    lastEvent = event;
  }
  
  // Detect bot-like movements (perfectly straight lines)
  const avgCurvature = curvatures.reduce((a, b) => a + b, 0) / (curvatures.length || 1);
  if (avgCurvature < 0.001 && curvatures.length > 10) {
    anomalies.push({
      modality: 'mouse',
      type: 'pattern',
      deviation: 1 - avgCurvature,
      description: 'Movement too linear - possible automation',
      severity: 'high',
    });
  }
  
  // Detect inhuman speeds
  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / (velocities.length || 1);
  if (avgVelocity > 10) { // pixels per ms
    anomalies.push({
      modality: 'mouse',
      type: 'velocity',
      deviation: avgVelocity / 10,
      description: 'Mouse movement speed exceeds human capability',
      severity: 'critical',
    });
  }
  
  // Analyze scrolling
  const scrollEvents = events.filter(e => e.type === 'scroll');
  const scrollPattern = analyzeScrollPattern(scrollEvents);
  
  return {
    profile: {
      movementVelocity: avgVelocity,
      accelerationPattern: accelerations.slice(-20), // last 20 samples
      curveRadius: avgCurvature,
      scrollPatterns: scrollPattern,
    },
    anomalies,
  };
}

function analyzeScrollPattern(
  events: Array<{ scrollDelta?: number; timestamp: number }>
): 'smooth' | 'jerky' | 'stepped' {
  if (events.length < 3) return 'stepped';
  
  const deltas = events.map(e => e.scrollDelta || 0);
  const stdDev = calculateStdDev(deltas);
  
  // All deltas same = stepped (scroll wheel clicks)
  if (stdDev < 1) return 'stepped';
  
  // High variance = jerky
  if (stdDev > 50) return 'jerky';
  
  return 'smooth';
}

/**
 * Analyze gait patterns from accelerometer/gyroscope data
 */
export function analyzeGaitPatterns(
  accelerometer: Array<{ x: number; y: number; z: number; timestamp: number }>,
  gyroscope: Array<{ x: number; y: number; z: number; timestamp: number }>
): { profile: Partial<GaitProfile>; anomalies: BiometricAnomaly[] } {
  const anomalies: BiometricAnomaly[] = [];
  
  // Calculate vertical oscillation (y-axis variance)
  const yValues = accelerometer.map(a => a.y);
  const verticalOscillation = calculateStdDev(yValues);
  
  // Calculate lateral sway (x-axis variance)
  const xValues = accelerometer.map(a => a.x);
  const lateralSway = calculateStdDev(xValues);
  
  // Detect step frequency using zero-crossings
  const stepFrequency = detectStepFrequency(accelerometer);
  
  // Calculate cadence variability
  const stepIntervals = detectStepIntervals(accelerometer);
  const cadenceVariability = calculateStdDev(stepIntervals) / 
    (stepIntervals.reduce((a, b) => a + b, 0) / stepIntervals.length || 1);
  
  // Check for unrealistic patterns
  if (verticalOscillation < 0.1) {
    anomalies.push({
      modality: 'gait',
      type: 'pattern',
      deviation: 1 - verticalOscillation,
      description: 'No vertical movement - device may be stationary',
      severity: 'medium',
    });
  }
  
  if (stepFrequency > 4) { // More than 4 Hz = running very fast
    anomalies.push({
      modality: 'gait',
      type: 'velocity',
      deviation: stepFrequency / 4,
      description: 'Step frequency suggests sprinting or simulated data',
      severity: 'high',
    });
  }
  
  return {
    profile: {
      stepFrequency,
      verticalOscillation,
      lateralSway,
      cadenceVariability,
      accelerometerSignature: accelerometer.slice(-100).map(a => 
        Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
      ),
      gyroscopeSignature: gyroscope.slice(-100).map(g => 
        Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z)
      ),
    },
    anomalies,
  };
}

function detectStepFrequency(
  accelerometer: Array<{ y: number; timestamp: number }>
): number {
  if (accelerometer.length < 10) return 0;
  
  const yValues = accelerometer.map(a => a.y);
  const mean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  
  // Count zero crossings (transitions across mean)
  let crossings = 0;
  for (let i = 1; i < yValues.length; i++) {
    if ((yValues[i - 1] < mean && yValues[i] >= mean) ||
        (yValues[i - 1] >= mean && yValues[i] < mean)) {
      crossings++;
    }
  }
  
  const duration = (accelerometer[accelerometer.length - 1].timestamp - 
                    accelerometer[0].timestamp) / 1000; // seconds
  
  return crossings / 2 / duration; // Each step = 2 crossings
}

function detectStepIntervals(
  accelerometer: Array<{ y: number; timestamp: number }>
): number[] {
  const yValues = accelerometer.map(a => a.y);
  const mean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  
  const peakTimestamps: number[] = [];
  for (let i = 1; i < yValues.length - 1; i++) {
    if (yValues[i] > mean && 
        yValues[i] > yValues[i - 1] && 
        yValues[i] > yValues[i + 1]) {
      peakTimestamps.push(accelerometer[i].timestamp);
    }
  }
  
  const intervals: number[] = [];
  for (let i = 1; i < peakTimestamps.length; i++) {
    intervals.push(peakTimestamps[i] - peakTimestamps[i - 1]);
  }
  
  return intervals;
}

/**
 * Estimate cognitive state from biometric patterns
 */
export function estimateCognitiveState(
  keystroke: Partial<KeystrokeProfile>,
  touch: Partial<TouchProfile>,
  mouse: Partial<MouseProfile>
): CognitiveStateEstimate {
  // High typing rhythm variance = distracted/stressed
  const typingStress = keystroke.typingRhythm 
    ? Math.min(1, keystroke.typingRhythm / 200) 
    : 0.5;
  
  // High error rate = fatigue or stress
  const errorFatigue = keystroke.errorRate 
    ? Math.min(1, keystroke.errorRate * 5) 
    : 0.3;
  
  // Touch pressure increases with stress
  const pressureStress = touch.averagePressure 
    ? Math.min(1, (touch.averagePressure - 0.5) * 2) 
    : 0.5;
  
  // Mouse velocity variance indicates attention state
  const velocityAttention = mouse.movementVelocity !== undefined
    ? 1 - Math.min(1, mouse.movementVelocity / 5)
    : 0.5;
  
  const stressLevel = (typingStress * 0.4 + pressureStress * 0.4 + errorFatigue * 0.2);
  const fatigueLevel = errorFatigue * 0.7 + typingStress * 0.3;
  const attentionLevel = velocityAttention;
  const cognitiveLoad = (stressLevel + fatigueLevel) / 2;
  
  let emotionalState: CognitiveStateEstimate['emotionalState'];
  if (stressLevel > 0.7) {
    emotionalState = 'anxious';
  } else if (fatigueLevel > 0.7) {
    emotionalState = 'distracted';
  } else if (attentionLevel > 0.7 && stressLevel < 0.4) {
    emotionalState = 'focused';
  } else if (stressLevel > 0.5 && attentionLevel < 0.5) {
    emotionalState = 'frustrated';
  } else {
    emotionalState = 'calm';
  }
  
  return {
    attentionLevel,
    stressLevel,
    fatigueLevel,
    cognitiveLoad,
    emotionalState,
    confidence: 0.75, // Base confidence, would be higher with more data
  };
}

/**
 * Compare profiles for authentication
 */
export function authenticateUser(
  storedProfiles: {
    keystroke?: KeystrokeProfile;
    touch?: TouchProfile;
    mouse?: MouseProfile;
    gait?: GaitProfile;
  },
  currentSamples: {
    keystroke?: Parameters<typeof analyzeKeystrokeDynamics>[0];
    touch?: Parameters<typeof analyzeTouchPatterns>[0];
    mouse?: Parameters<typeof analyzeMouseMovements>[0];
    gait?: { accelerometer: Parameters<typeof analyzeGaitPatterns>[0]; gyroscope: Parameters<typeof analyzeGaitPatterns>[1] };
  }
): AuthenticationResult {
  const allAnomalies: BiometricAnomaly[] = [];
  const matchedModalities: string[] = [];
  let totalScore = 0;
  let modalityCount = 0;
  
  // Analyze each modality
  if (currentSamples.keystroke && storedProfiles.keystroke) {
    const { profile, anomalies } = analyzeKeystrokeDynamics(currentSamples.keystroke);
    allAnomalies.push(...anomalies);
    const score = compareKeystrokeProfiles(storedProfiles.keystroke, profile);
    if (score > 0.7) matchedModalities.push('keystroke');
    totalScore += score;
    modalityCount++;
  }
  
  if (currentSamples.touch && storedProfiles.touch) {
    const { profile, anomalies } = analyzeTouchPatterns(currentSamples.touch);
    allAnomalies.push(...anomalies);
    const score = compareTouchProfiles(storedProfiles.touch, profile);
    if (score > 0.7) matchedModalities.push('touch');
    totalScore += score;
    modalityCount++;
  }
  
  if (currentSamples.mouse && storedProfiles.mouse) {
    const { profile, anomalies } = analyzeMouseMovements(currentSamples.mouse);
    allAnomalies.push(...anomalies);
    const score = compareMouseProfiles(storedProfiles.mouse, profile);
    if (score > 0.7) matchedModalities.push('mouse');
    totalScore += score;
    modalityCount++;
  }
  
  if (currentSamples.gait && storedProfiles.gait) {
    const { profile, anomalies } = analyzeGaitPatterns(
      currentSamples.gait.accelerometer,
      currentSamples.gait.gyroscope
    );
    allAnomalies.push(...anomalies);
    const score = compareGaitProfiles(storedProfiles.gait, profile);
    if (score > 0.7) matchedModalities.push('gait');
    totalScore += score;
    modalityCount++;
  }
  
  const avgScore = modalityCount > 0 ? totalScore / modalityCount : 0;
  const criticalAnomalies = allAnomalies.filter(a => a.severity === 'critical');
  
  // Calculate cognitive state
  const keystrokeAnalysis = currentSamples.keystroke 
    ? analyzeKeystrokeDynamics(currentSamples.keystroke) 
    : { profile: {} };
  const touchAnalysis = currentSamples.touch 
    ? analyzeTouchPatterns(currentSamples.touch) 
    : { profile: {} };
  const mouseAnalysis = currentSamples.mouse 
    ? analyzeMouseMovements(currentSamples.mouse) 
    : { profile: {} };
  
  const cognitiveState = estimateCognitiveState(
    keystrokeAnalysis.profile,
    touchAnalysis.profile,
    mouseAnalysis.profile
  );
  
  return {
    isAuthentic: avgScore > 0.75 && criticalAnomalies.length === 0,
    confidence: avgScore,
    matchedModalities,
    anomalies: allAnomalies,
    cognitiveState,
    riskScore: calculateRiskScore(allAnomalies, avgScore),
  };
}

function compareKeystrokeProfiles(
  stored: KeystrokeProfile,
  current: Partial<KeystrokeProfile>
): number {
  let score = 0;
  let factors = 0;
  
  if (stored.typingRhythm && current.typingRhythm) {
    const diff = Math.abs(stored.typingRhythm - current.typingRhythm) / stored.typingRhythm;
    score += 1 - Math.min(1, diff);
    factors++;
  }
  
  if (stored.wordsPerMinute && current.wordsPerMinute) {
    const diff = Math.abs(stored.wordsPerMinute - current.wordsPerMinute) / stored.wordsPerMinute;
    score += 1 - Math.min(1, diff);
    factors++;
  }
  
  return factors > 0 ? score / factors : 0.5;
}

function compareTouchProfiles(
  stored: TouchProfile,
  current: Partial<TouchProfile>
): number {
  let score = 0;
  let factors = 0;
  
  if (stored.averagePressure && current.averagePressure) {
    const diff = Math.abs(stored.averagePressure - current.averagePressure);
    score += 1 - Math.min(1, diff * 2);
    factors++;
  }
  
  if (stored.tapDuration && current.tapDuration) {
    const diff = Math.abs(stored.tapDuration - current.tapDuration) / stored.tapDuration;
    score += 1 - Math.min(1, diff);
    factors++;
  }
  
  return factors > 0 ? score / factors : 0.5;
}

function compareMouseProfiles(
  stored: MouseProfile,
  current: Partial<MouseProfile>
): number {
  let score = 0;
  let factors = 0;
  
  if (stored.movementVelocity && current.movementVelocity) {
    const diff = Math.abs(stored.movementVelocity - current.movementVelocity) / stored.movementVelocity;
    score += 1 - Math.min(1, diff);
    factors++;
  }
  
  if (stored.curveRadius && current.curveRadius) {
    const diff = Math.abs(stored.curveRadius - current.curveRadius) / (stored.curveRadius || 1);
    score += 1 - Math.min(1, diff);
    factors++;
  }
  
  return factors > 0 ? score / factors : 0.5;
}

function compareGaitProfiles(
  stored: GaitProfile,
  current: Partial<GaitProfile>
): number {
  let score = 0;
  let factors = 0;
  
  if (stored.stepFrequency && current.stepFrequency) {
    const diff = Math.abs(stored.stepFrequency - current.stepFrequency) / stored.stepFrequency;
    score += 1 - Math.min(1, diff);
    factors++;
  }
  
  if (stored.cadenceVariability && current.cadenceVariability) {
    const diff = Math.abs(stored.cadenceVariability - current.cadenceVariability);
    score += 1 - Math.min(1, diff * 2);
    factors++;
  }
  
  return factors > 0 ? score / factors : 0.5;
}

function calculateRiskScore(anomalies: BiometricAnomaly[], matchScore: number): number {
  const severityWeights = { critical: 1, high: 0.6, medium: 0.3, low: 0.1 };
  
  const anomalyScore = anomalies.reduce((sum, a) => 
    sum + severityWeights[a.severity], 0
  ) / Math.max(anomalies.length, 1);
  
  return Math.min(1, anomalyScore + (1 - matchScore) * 0.5);
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}
