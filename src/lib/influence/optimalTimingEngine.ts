/**
 * Optimal Timing Engine
 * 
 * Predicts the best moments to deploy influence tactics based on
 * contact behavior patterns, emotional states, and contextual factors.
 */

import { OceanProfile } from '../personality/oceanExtractor';

export interface TimingWindow {
  id: string;
  type: 'golden_moment' | 'favorable' | 'neutral' | 'unfavorable' | 'avoid';
  startTime: Date;
  endTime: Date;
  score: number;           // 0-1 opportunity score
  reasons: string[];
  suggestedActions: string[];
}

export interface ContactTimingProfile {
  profileId: string;
  optimalDays: DayOfWeek[];
  optimalHours: number[];   // 0-23
  avoidDays: DayOfWeek[];
  avoidHours: number[];
  responsePeakDelay: number; // minutes after message when they typically respond
  averageResponseTime: number; // minutes
  engagementPatterns: EngagementPattern[];
  emotionalCycles: EmotionalCycle[];
  lifeEvents: LifeEvent[];
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface EngagementPattern {
  dayOfWeek: DayOfWeek;
  hourOfDay: number;
  engagementScore: number; // 0-1
  sampleSize: number;
}

export interface EmotionalCycle {
  name: string;
  periodDays: number;
  currentPhase: number;    // 0-1 where 0 is low, 1 is high
  nextPeakDate: Date;
  nextTroughDate: Date;
}

export interface LifeEvent {
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  date: Date;
  impactDuration: number;  // days
  currentImpact: number;   // 0-1 multiplier on timing
}

export interface InfluenceContext {
  objective: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  principle: string;
  askMagnitude: 'small' | 'medium' | 'large';
  relationship: 'new' | 'developing' | 'established' | 'strong';
}

// Day mapping
const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

/**
 * Calculate optimal timing windows for the next N days
 */
export function calculateTimingWindows(
  timingProfile: ContactTimingProfile,
  context: InfluenceContext,
  personality?: OceanProfile,
  daysAhead: number = 14
): TimingWindow[] {
  const windows: TimingWindow[] = [];
  const now = new Date();
  
  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    const dayOfWeek = DAY_MAP[date.getDay()];
    
    // Skip avoid days for non-critical requests
    if (timingProfile.avoidDays.includes(dayOfWeek) && context.urgency !== 'critical') {
      continue;
    }
    
    // Generate windows for optimal hours
    const hoursToAnalyze = timingProfile.optimalHours.length > 0 
      ? timingProfile.optimalHours 
      : [9, 10, 11, 14, 15, 16, 19, 20]; // Default work/evening hours
    
    for (const hour of hoursToAnalyze) {
      // Skip avoid hours
      if (timingProfile.avoidHours.includes(hour)) continue;
      
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(hour + 1);
      
      // Skip if in the past
      if (startTime < now) continue;
      
      const window = evaluateWindow(
        startTime,
        endTime,
        timingProfile,
        context,
        personality
      );
      
      windows.push(window);
    }
  }
  
  // Sort by score descending
  return windows.sort((a, b) => b.score - a.score);
}

/**
 * Evaluate a specific time window
 */
function evaluateWindow(
  startTime: Date,
  endTime: Date,
  profile: ContactTimingProfile,
  context: InfluenceContext,
  personality?: OceanProfile
): TimingWindow {
  let score = 0.5; // Base score
  const reasons: string[] = [];
  const suggestedActions: string[] = [];
  
  const dayOfWeek = DAY_MAP[startTime.getDay()];
  const hour = startTime.getHours();
  
  // Check optimal day
  if (profile.optimalDays.includes(dayOfWeek)) {
    score += 0.1;
    reasons.push(`${dayOfWeek} is an optimal day for engagement`);
  }
  
  // Check engagement patterns
  const engagementPattern = profile.engagementPatterns.find(
    p => p.dayOfWeek === dayOfWeek && p.hourOfDay === hour
  );
  
  if (engagementPattern) {
    score += engagementPattern.engagementScore * 0.2;
    if (engagementPattern.engagementScore > 0.7) {
      reasons.push(`High historical engagement at this time (${Math.round(engagementPattern.engagementScore * 100)}%)`);
    }
  }
  
  // Check emotional cycles
  for (const cycle of profile.emotionalCycles) {
    if (cycle.currentPhase > 0.7) {
      score += 0.1;
      reasons.push(`${cycle.name} is in a positive phase`);
    } else if (cycle.currentPhase < 0.3) {
      score -= 0.1;
      reasons.push(`${cycle.name} is in a low phase - may want to wait`);
    }
  }
  
  // Check life events impact
  for (const event of profile.lifeEvents) {
    const daysSinceEvent = Math.floor((startTime.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceEvent >= 0 && daysSinceEvent <= event.impactDuration) {
      if (event.type === 'positive') {
        score += event.currentImpact * 0.15;
        reasons.push(`Recent positive event: ${event.description}`);
        suggestedActions.push('Reference or congratulate on the positive event');
      } else if (event.type === 'negative') {
        score -= event.currentImpact * 0.2;
        reasons.push(`Recent negative event: ${event.description} - approach with sensitivity`);
        suggestedActions.push('Acknowledge difficulty before making requests');
      }
    }
  }
  
  // Adjust for ask magnitude
  if (context.askMagnitude === 'large') {
    // Large asks need ideal conditions
    if (score < 0.6) {
      score *= 0.8;
      reasons.push('Large asks require better timing conditions');
    }
    suggestedActions.push('Build up to the ask with rapport-building first');
  }
  
  // Adjust for relationship stage
  if (context.relationship === 'new') {
    // New relationships need more favorable conditions
    score *= 0.9;
    suggestedActions.push('Focus on relationship building, not asks');
  } else if (context.relationship === 'strong') {
    score *= 1.1;
    reasons.push('Strong relationship provides timing flexibility');
  }
  
  // Adjust for personality if available
  if (personality) {
    // High conscientiousness = respect their schedule
    if (personality.conscientiousness.score > 70) {
      const isBusinessHours = hour >= 9 && hour <= 17;
      if (isBusinessHours && ![0, 6].includes(startTime.getDay())) {
        score += 0.05;
        reasons.push('Business hours preferred for highly conscientious contacts');
      }
    }
    
    // High extraversion = social times better
    if (personality.extraversion.score > 70) {
      const isSocialTime = hour >= 17 && hour <= 21;
      if (isSocialTime) {
        score += 0.05;
        reasons.push('Evening social hours optimal for extraverted contacts');
      }
    }
    
    // High neuroticism = avoid stressful times
    if (personality.neuroticism.score > 70) {
      const isMonday = startTime.getDay() === 1;
      const isFridayAfternoon = startTime.getDay() === 5 && hour >= 14;
      if (isMonday && hour < 12) {
        score -= 0.1;
        reasons.push('Monday mornings stressful for neurotic contacts');
      }
      if (isFridayAfternoon) {
        score += 0.05;
        reasons.push('Friday afternoon relaxation favorable for neurotic contacts');
      }
    }
  }
  
  // Determine window type
  let type: TimingWindow['type'];
  if (score >= 0.8) {
    type = 'golden_moment';
    suggestedActions.unshift('PRIORITY: Execute key influence moves');
  } else if (score >= 0.6) {
    type = 'favorable';
    suggestedActions.unshift('Good opportunity for engagement');
  } else if (score >= 0.4) {
    type = 'neutral';
  } else if (score >= 0.2) {
    type = 'unfavorable';
    suggestedActions.push('Consider waiting for better timing');
  } else {
    type = 'avoid';
    suggestedActions.push('Avoid contact during this window');
  }
  
  return {
    id: `${startTime.getTime()}-${endTime.getTime()}`,
    type,
    startTime,
    endTime,
    score: Math.max(0, Math.min(1, score)),
    reasons,
    suggestedActions
  };
}

/**
 * Find the next golden moment for a specific action
 */
export function findNextGoldenMoment(
  profile: ContactTimingProfile,
  context: InfluenceContext,
  personality?: OceanProfile,
  maxDaysAhead: number = 30
): TimingWindow | null {
  const windows = calculateTimingWindows(profile, context, personality, maxDaysAhead);
  return windows.find(w => w.type === 'golden_moment') || windows[0] || null;
}

/**
 * Check if now is a good time to reach out
 */
export function isGoodTimeNow(
  profile: ContactTimingProfile,
  context: InfluenceContext,
  personality?: OceanProfile
): { isGood: boolean; score: number; reasons: string[] } {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  
  const window = evaluateWindow(now, inOneHour, profile, context, personality);
  
  return {
    isGood: window.score >= 0.5,
    score: window.score,
    reasons: window.reasons
  };
}

/**
 * Build timing profile from historical interaction data
 */
export function buildTimingProfile(
  profileId: string,
  interactions: Array<{
    timestamp: Date;
    type: 'sent' | 'received';
    responseTime?: number;
    engagement?: number;
  }>
): ContactTimingProfile {
  const engagementByDayHour: Map<string, { total: number; count: number }> = new Map();
  const responseTimes: number[] = [];
  const dayEngagement: Map<DayOfWeek, number[]> = new Map();
  
  for (const interaction of interactions) {
    const day = DAY_MAP[interaction.timestamp.getDay()];
    const hour = interaction.timestamp.getHours();
    const key = `${day}-${hour}`;
    
    // Track engagement by day/hour
    const existing = engagementByDayHour.get(key) || { total: 0, count: 0 };
    existing.total += interaction.engagement || 0.5;
    existing.count++;
    engagementByDayHour.set(key, existing);
    
    // Track day engagement
    const dayScores = dayEngagement.get(day) || [];
    dayScores.push(interaction.engagement || 0.5);
    dayEngagement.set(day, dayScores);
    
    // Track response times
    if (interaction.responseTime) {
      responseTimes.push(interaction.responseTime);
    }
  }
  
  // Calculate optimal days
  const dayAverages: [DayOfWeek, number][] = [];
  for (const [day, scores] of dayEngagement) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    dayAverages.push([day, avg]);
  }
  dayAverages.sort((a, b) => b[1] - a[1]);
  
  const optimalDays = dayAverages.slice(0, 3).map(d => d[0]);
  const avoidDays = dayAverages.slice(-2).map(d => d[0]);
  
  // Calculate optimal hours
  const hourEngagement: Map<number, number[]> = new Map();
  for (const [key, data] of engagementByDayHour) {
    const hour = parseInt(key.split('-')[1]);
    const scores = hourEngagement.get(hour) || [];
    scores.push(data.total / data.count);
    hourEngagement.set(hour, scores);
  }
  
  const hourAverages: [number, number][] = [];
  for (const [hour, scores] of hourEngagement) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    hourAverages.push([hour, avg]);
  }
  hourAverages.sort((a, b) => b[1] - a[1]);
  
  const optimalHours = hourAverages.slice(0, 4).map(h => h[0]);
  const avoidHours = hourAverages.slice(-2).map(h => h[0]);
  
  // Calculate average response time
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 60;
  
  // Build engagement patterns
  const engagementPatterns: EngagementPattern[] = [];
  for (const [key, data] of engagementByDayHour) {
    const [day, hourStr] = key.split('-');
    engagementPatterns.push({
      dayOfWeek: day as DayOfWeek,
      hourOfDay: parseInt(hourStr),
      engagementScore: data.total / data.count,
      sampleSize: data.count
    });
  }
  
  return {
    profileId,
    optimalDays,
    optimalHours,
    avoidDays,
    avoidHours,
    responsePeakDelay: 5,
    averageResponseTime: avgResponseTime,
    engagementPatterns,
    emotionalCycles: [],
    lifeEvents: []
  };
}

/**
 * Add a life event that affects timing
 */
export function addLifeEvent(
  profile: ContactTimingProfile,
  event: Omit<LifeEvent, 'currentImpact'>
): ContactTimingProfile {
  const daysSinceEvent = Math.floor((Date.now() - event.date.getTime()) / (1000 * 60 * 60 * 24));
  const currentImpact = Math.max(0, 1 - (daysSinceEvent / event.impactDuration));
  
  return {
    ...profile,
    lifeEvents: [
      ...profile.lifeEvents,
      { ...event, currentImpact }
    ]
  };
}

/**
 * Predict optimal timing for a specific ask
 */
export function predictOptimalAskTiming(
  profile: ContactTimingProfile,
  askType: 'favor' | 'meeting' | 'commitment' | 'introduction' | 'financial',
  personality?: OceanProfile
): { window: TimingWindow; preparation: string[] } {
  const contextMap: Record<string, InfluenceContext> = {
    favor: { objective: 'favor', urgency: 'medium', principle: 'reciprocity', askMagnitude: 'small', relationship: 'developing' },
    meeting: { objective: 'meeting', urgency: 'medium', principle: 'liking', askMagnitude: 'small', relationship: 'developing' },
    commitment: { objective: 'commitment', urgency: 'low', principle: 'commitment', askMagnitude: 'medium', relationship: 'established' },
    introduction: { objective: 'introduction', urgency: 'low', principle: 'authority', askMagnitude: 'small', relationship: 'established' },
    financial: { objective: 'financial', urgency: 'low', principle: 'scarcity', askMagnitude: 'large', relationship: 'strong' }
  };
  
  const context = contextMap[askType];
  const goldenMoment = findNextGoldenMoment(profile, context, personality);
  
  const preparation: string[] = [];
  
  if (goldenMoment) {
    const daysUntil = Math.ceil((goldenMoment.startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil > 3) {
      preparation.push('Build rapport in the days leading up to the ask');
      preparation.push('Look for opportunities to provide value first');
    }
    
    if (askType === 'financial') {
      preparation.push('Ensure recent positive interaction before the ask');
      preparation.push('Have clear value proposition prepared');
    }
    
    if (personality && personality.conscientiousness.score > 70) {
      preparation.push('Prepare detailed, organized presentation of your request');
    }
    
    if (personality && personality.neuroticism.score > 70) {
      preparation.push('Frame in terms of safety and certainty');
      preparation.push('Avoid creating additional pressure');
    }
  }
  
  return {
    window: goldenMoment || {
      id: 'default',
      type: 'neutral',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      score: 0.5,
      reasons: ['Insufficient data for optimal timing'],
      suggestedActions: ['Gather more interaction data', 'Proceed with caution']
    },
    preparation
  };
}
