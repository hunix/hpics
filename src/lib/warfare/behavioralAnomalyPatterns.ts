/**
 * Behavioral Anomaly Detection Patterns
 * Based on behavioral biometrics and pattern analysis
 */

export interface BehavioralBaseline {
  id: string;
  userId: string;
  baselineType: BaselineType;
  metrics: Record<string, number>;
  sampleSize: number;
  confidence: number;
  createdAt: Date;
  lastUpdated: Date;
}

export type BaselineType = 
  | 'keystroke_dynamics'
  | 'mouse_movement'
  | 'session_patterns'
  | 'device_usage'
  | 'location_patterns'
  | 'communication_patterns'
  | 'financial_patterns'
  | 'social_patterns';

export interface AnomalyDetection {
  type: BaselineType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  deviation: number; // Standard deviations from baseline
  metric: string;
  expectedValue: number;
  actualValue: number;
  timestamp: Date;
  possibleCauses: string[];
  recommendedActions: string[];
}

export interface SessionAnomaly {
  sessionId: string;
  anomalies: AnomalyDetection[];
  riskScore: number;
  isLikelyFraudulent: boolean;
  confidence: number;
}

// Keystroke Dynamics Patterns
export const KEYSTROKE_DYNAMICS = {
  METRICS: {
    DWELL_TIME: {
      description: 'How long a key is held down',
      unit: 'milliseconds',
      normalRange: [50, 200],
      anomalyThreshold: 2.5 // standard deviations
    },
    FLIGHT_TIME: {
      description: 'Time between releasing one key and pressing the next',
      unit: 'milliseconds',
      normalRange: [50, 300],
      anomalyThreshold: 2.5
    },
    TYPING_SPEED: {
      description: 'Words per minute',
      unit: 'WPM',
      normalRange: [30, 100],
      anomalyThreshold: 2.0
    },
    ERROR_RATE: {
      description: 'Backspace/correction frequency',
      unit: 'percentage',
      normalRange: [1, 10],
      anomalyThreshold: 2.0
    },
    DIGRAPH_LATENCY: {
      description: 'Time between specific key pairs',
      unit: 'milliseconds',
      normalRange: [100, 400],
      anomalyThreshold: 2.5
    }
  },
  ANOMALY_INDICATORS: [
    'Significantly faster/slower typing than baseline',
    'Different error correction patterns',
    'Changed key hold times',
    'Different rhythm/cadence',
    'Unusual pause patterns'
  ],
  DETECTION_APPLICATIONS: [
    'Account takeover detection',
    'Insider threat detection',
    'Continuous authentication',
    'Fraud prevention',
    'Impersonation detection'
  ]
};

// Mouse Movement Patterns
export const MOUSE_MOVEMENT_PATTERNS = {
  METRICS: {
    VELOCITY: {
      description: 'Speed of mouse movement',
      unit: 'pixels/second',
      normalRange: [100, 1000],
      anomalyThreshold: 2.0
    },
    ACCELERATION: {
      description: 'Rate of velocity change',
      unit: 'pixels/second²',
      normalRange: [50, 500],
      anomalyThreshold: 2.5
    },
    CURVATURE: {
      description: 'Smoothness of movement path',
      unit: 'deviation from straight line',
      normalRange: [0.1, 0.5],
      anomalyThreshold: 2.0
    },
    CLICK_PATTERNS: {
      description: 'Time between clicks, click accuracy',
      unit: 'milliseconds/pixels',
      normalRange: [200, 1000],
      anomalyThreshold: 2.0
    },
    SCROLL_BEHAVIOR: {
      description: 'Scroll speed and patterns',
      unit: 'pixels/event',
      normalRange: [50, 300],
      anomalyThreshold: 2.5
    }
  },
  ANOMALY_INDICATORS: [
    'Perfectly straight lines (bot behavior)',
    'Inhuman precision or speed',
    'Erratic movement patterns',
    'Unusual click timing',
    'Different scroll behavior'
  ],
  BOT_DETECTION_SIGNALS: [
    'Linear movement paths',
    'Consistent timing intervals',
    'Pixel-perfect positioning',
    'No human-like hesitation',
    'Unnatural scroll patterns'
  ]
};

// Session Behavior Patterns
export const SESSION_PATTERNS = {
  METRICS: {
    SESSION_DURATION: {
      description: 'Length of typical sessions',
      unit: 'minutes',
      normalRange: [5, 60],
      anomalyThreshold: 2.0
    },
    ACTIONS_PER_SESSION: {
      description: 'Number of actions taken',
      unit: 'count',
      normalRange: [10, 200],
      anomalyThreshold: 2.5
    },
    TIME_BETWEEN_ACTIONS: {
      description: 'Average pause between actions',
      unit: 'seconds',
      normalRange: [2, 30],
      anomalyThreshold: 2.0
    },
    PAGE_VISIT_PATTERN: {
      description: 'Sequence of pages visited',
      unit: 'entropy score',
      normalRange: [0.3, 0.8],
      anomalyThreshold: 2.5
    },
    FEATURE_USAGE: {
      description: 'Which features are used',
      unit: 'feature set hash',
      normalRange: [0, 1],
      anomalyThreshold: 3.0
    }
  },
  ANOMALY_INDICATORS: [
    'Unusually long or short sessions',
    'Accessing unusual features',
    'Different navigation patterns',
    'Actions at unusual speed',
    'Different time-of-day patterns'
  ]
};

// Device Usage Patterns
export const DEVICE_USAGE_PATTERNS = {
  METRICS: {
    LOGIN_TIMES: {
      description: 'When user typically logs in',
      unit: 'hour of day',
      normalRange: [6, 23],
      anomalyThreshold: 2.0
    },
    DEVICE_TYPES: {
      description: 'Usual devices used',
      unit: 'device fingerprint',
      normalRange: [0, 1],
      anomalyThreshold: 3.0
    },
    BROWSER_FINGERPRINT: {
      description: 'Browser characteristics',
      unit: 'fingerprint hash',
      normalRange: [0, 1],
      anomalyThreshold: 3.0
    },
    NETWORK_PATTERNS: {
      description: 'Usual networks connected from',
      unit: 'IP/ASN',
      normalRange: [0, 1],
      anomalyThreshold: 3.0
    },
    GEOGRAPHIC_PATTERNS: {
      description: 'Usual login locations',
      unit: 'lat/long cluster',
      normalRange: [0, 50], // km radius
      anomalyThreshold: 2.0
    }
  },
  ANOMALY_INDICATORS: [
    'Login from new device',
    'Login from new location',
    'Login at unusual time',
    'Different browser fingerprint',
    'VPN/Tor usage when not typical'
  ]
};

// Communication Pattern Analysis
export const COMMUNICATION_PATTERNS = {
  METRICS: {
    MESSAGE_FREQUENCY: {
      description: 'Messages sent per day',
      unit: 'count',
      normalRange: [5, 50],
      anomalyThreshold: 2.0
    },
    RESPONSE_TIME: {
      description: 'Time to respond to messages',
      unit: 'minutes',
      normalRange: [5, 120],
      anomalyThreshold: 2.5
    },
    MESSAGE_LENGTH: {
      description: 'Average message length',
      unit: 'characters',
      normalRange: [20, 200],
      anomalyThreshold: 2.0
    },
    EMOJI_USAGE: {
      description: 'Frequency of emoji use',
      unit: 'per message',
      normalRange: [0, 3],
      anomalyThreshold: 2.5
    },
    VOCABULARY_COMPLEXITY: {
      description: 'Lexical diversity',
      unit: 'score',
      normalRange: [0.4, 0.8],
      anomalyThreshold: 2.0
    }
  },
  ANOMALY_INDICATORS: [
    'Sudden change in writing style',
    'Different vocabulary usage',
    'Changed emoji patterns',
    'Different response timing',
    'Unusual contact patterns'
  ]
};

// Financial Behavior Patterns
export const FINANCIAL_PATTERNS = {
  METRICS: {
    TRANSACTION_FREQUENCY: {
      description: 'Transactions per week',
      unit: 'count',
      normalRange: [5, 50],
      anomalyThreshold: 2.5
    },
    AVERAGE_AMOUNT: {
      description: 'Typical transaction size',
      unit: 'currency',
      normalRange: [10, 500],
      anomalyThreshold: 2.0
    },
    MERCHANT_CATEGORIES: {
      description: 'Types of merchants used',
      unit: 'category distribution',
      normalRange: [0, 1],
      anomalyThreshold: 2.5
    },
    GEOGRAPHIC_SPREAD: {
      description: 'Where transactions occur',
      unit: 'location entropy',
      normalRange: [0.2, 0.6],
      anomalyThreshold: 2.0
    },
    TIME_PATTERNS: {
      description: 'When transactions occur',
      unit: 'hour distribution',
      normalRange: [8, 22],
      anomalyThreshold: 2.0
    }
  },
  ANOMALY_INDICATORS: [
    'Transaction at unusual time',
    'Unusual merchant category',
    'Different geographic location',
    'Larger than typical amount',
    'Rapid succession of transactions'
  ]
};

// Anomaly Scoring Functions
export interface AnomalyScoreInput {
  metricName: string;
  expectedMean: number;
  expectedStdDev: number;
  observedValue: number;
}

export function calculateZScore(input: AnomalyScoreInput): number {
  if (input.expectedStdDev === 0) return 0;
  return (input.observedValue - input.expectedMean) / input.expectedStdDev;
}

export function isAnomaly(zScore: number, threshold: number = 2.5): boolean {
  return Math.abs(zScore) > threshold;
}

export function calculateAnomalyRiskScore(anomalies: AnomalyDetection[]): number {
  const severityWeights = {
    critical: 40,
    high: 25,
    medium: 15,
    low: 5
  };

  let score = 0;
  for (const anomaly of anomalies) {
    const weight = severityWeights[anomaly.severity];
    const deviationFactor = Math.min(anomaly.deviation / 2, 2); // Cap at 2x
    score += weight * deviationFactor;
  }

  return Math.min(100, score);
}

export function determineAnomalySeverity(zScore: number): 'critical' | 'high' | 'medium' | 'low' {
  const absZ = Math.abs(zScore);
  if (absZ >= 4) return 'critical';
  if (absZ >= 3) return 'high';
  if (absZ >= 2.5) return 'medium';
  return 'low';
}

// Behavioral Baseline Builder
export interface BaselineBuilderConfig {
  minSamples: number;
  outlierRemovalPercentile: number;
  decayFactor: number; // How much to weight recent vs historical
  updateFrequency: 'realtime' | 'hourly' | 'daily';
}

export const DEFAULT_BASELINE_CONFIG: BaselineBuilderConfig = {
  minSamples: 30,
  outlierRemovalPercentile: 0.05,
  decayFactor: 0.9,
  updateFrequency: 'daily'
};

export function buildBaseline(
  samples: number[],
  config: BaselineBuilderConfig = DEFAULT_BASELINE_CONFIG
): { mean: number; stdDev: number; confidence: number } {
  if (samples.length < config.minSamples) {
    return { mean: 0, stdDev: 0, confidence: 0 };
  }

  // Remove outliers
  const sorted = [...samples].sort((a, b) => a - b);
  const cutoff = Math.floor(samples.length * config.outlierRemovalPercentile);
  const trimmed = sorted.slice(cutoff, sorted.length - cutoff);

  // Calculate statistics
  const mean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const variance = trimmed.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / trimmed.length;
  const stdDev = Math.sqrt(variance);

  // Confidence based on sample size
  const confidence = Math.min(100, (samples.length / config.minSamples) * 50 + 50);

  return { mean, stdDev, confidence };
}

export default {
  KEYSTROKE_DYNAMICS,
  MOUSE_MOVEMENT_PATTERNS,
  SESSION_PATTERNS,
  DEVICE_USAGE_PATTERNS,
  COMMUNICATION_PATTERNS,
  FINANCIAL_PATTERNS,
  calculateZScore,
  isAnomaly,
  calculateAnomalyRiskScore,
  determineAnomalySeverity,
  buildBaseline,
  DEFAULT_BASELINE_CONFIG
};
