/**
 * Timing Optimizer
 * Strategic timing intelligence for optimal influence windows
 */

export interface TimingProfile {
  chronotype: 'morning_lark' | 'evening_owl' | 'intermediate';
  peak_hours: number[];
  low_hours: number[];
  best_days: string[];
  worst_days: string[];
  response_patterns: {
    by_hour: Record<number, { response_rate: number; quality: number }>;
    by_day: Record<string, { response_rate: number; quality: number }>;
  };
}

export interface OptimalWindow {
  for_task: string;
  best_time: string;
  best_day: string;
  rationale: string;
  success_probability: number;
}

export interface PersuasionTiming {
  major_decisions: OptimalWindow;
  quick_asks: OptimalWindow;
  emotional_appeals: OptimalWindow;
  logical_arguments: OptimalWindow;
  difficult_conversations: OptimalWindow;
  requests_for_help: OptimalWindow;
}

// Circadian influence patterns
const CIRCADIAN_PATTERNS = {
  morning_lark: {
    cognitive_peak: [8, 9, 10, 11],
    energy_dip: [13, 14, 15],
    social_peak: [11, 12, 17, 18],
    decision_fatigue_onset: 14,
    vulnerability_windows: [20, 21, 22]
  },
  evening_owl: {
    cognitive_peak: [15, 16, 17, 18, 19],
    energy_dip: [8, 9, 10],
    social_peak: [19, 20, 21],
    decision_fatigue_onset: 23,
    vulnerability_windows: [8, 9, 10]
  },
  intermediate: {
    cognitive_peak: [10, 11, 15, 16],
    energy_dip: [13, 14],
    social_peak: [12, 18, 19],
    decision_fatigue_onset: 17,
    vulnerability_windows: [21, 22, 8, 9]
  }
};

// Weekly patterns
const WEEKLY_PATTERNS = {
  monday: {
    mood: 'recovery',
    productivity: 0.7,
    receptivity: 0.6,
    best_for: ['routine tasks', 'information sharing'],
    avoid: ['major asks', 'negotiations', 'emotional conversations']
  },
  tuesday: {
    mood: 'productive',
    productivity: 0.95,
    receptivity: 0.8,
    best_for: ['complex decisions', 'negotiations', 'new proposals'],
    avoid: ['social events']
  },
  wednesday: {
    mood: 'stable',
    productivity: 0.9,
    receptivity: 0.85,
    best_for: ['difficult conversations', 'problem-solving', 'meetings'],
    avoid: ['introducing stress']
  },
  thursday: {
    mood: 'winding_down',
    productivity: 0.85,
    receptivity: 0.75,
    best_for: ['quick decisions', 'social bonding'],
    avoid: ['complex new topics']
  },
  friday: {
    mood: 'anticipatory',
    productivity: 0.7,
    receptivity: 0.7,
    best_for: ['positive news', 'casual asks', 'relationship building'],
    avoid: ['heavy topics', 'deadlines']
  },
  saturday: {
    mood: 'relaxed',
    productivity: 0.4,
    receptivity: 0.65,
    best_for: ['personal topics', 'emotional bonding', 'casual influence'],
    avoid: ['work topics']
  },
  sunday: {
    mood: 'reflective',
    productivity: 0.3,
    receptivity: 0.5,
    best_for: ['planting ideas', 'future planning discussions'],
    avoid: ['urgent requests', 'pressure']
  }
};

/**
 * Calculate optimal timing for different persuasion goals
 */
export function calculatePersuasionTiming(
  chronotype: 'morning_lark' | 'evening_owl' | 'intermediate'
): PersuasionTiming {
  const pattern = CIRCADIAN_PATTERNS[chronotype];
  
  return {
    major_decisions: {
      for_task: 'Major decisions requiring careful thought',
      best_time: `${pattern.cognitive_peak[0]}:00-${pattern.cognitive_peak[1]}:00`,
      best_day: 'Tuesday or Wednesday',
      rationale: 'Cognitive resources at peak, mid-week stability',
      success_probability: 0.75
    },
    quick_asks: {
      for_task: 'Quick favors or simple requests',
      best_time: `Just after ${pattern.decision_fatigue_onset}:00`,
      best_day: 'Thursday or Friday',
      rationale: 'Decision fatigue reduces resistance to simple asks',
      success_probability: 0.8
    },
    emotional_appeals: {
      for_task: 'Requests requiring emotional connection',
      best_time: `${pattern.social_peak[pattern.social_peak.length - 1]}:00`,
      best_day: 'Friday or Saturday',
      rationale: 'Social mood peaks, emotional openness higher',
      success_probability: 0.7
    },
    logical_arguments: {
      for_task: 'Persuasion through reason and facts',
      best_time: `${pattern.cognitive_peak[1]}:00-${pattern.cognitive_peak[2]}:00`,
      best_day: 'Tuesday',
      rationale: 'Maximum cognitive engagement, analytical thinking peak',
      success_probability: 0.72
    },
    difficult_conversations: {
      for_task: 'Conflict resolution or tough topics',
      best_time: `${pattern.cognitive_peak[0]}:00`,
      best_day: 'Wednesday',
      rationale: 'Mid-week calm, cognitive resources available for processing',
      success_probability: 0.65
    },
    requests_for_help: {
      for_task: 'Asking for significant assistance',
      best_time: `${pattern.vulnerability_windows[0]}:00`,
      best_day: 'Sunday evening',
      rationale: 'Reflective mood, future-oriented thinking, guard lower',
      success_probability: 0.68
    }
  };
}

/**
 * Analyze response patterns to optimize future timing
 */
export function analyzeResponsePatterns(
  interactions: Array<{
    timestamp: string;
    responseTime: number; // minutes
    responseQuality: number; // 0-1
    requestType: string;
    outcome: 'positive' | 'neutral' | 'negative';
  }>
): TimingProfile {
  const byHour: Record<number, { total: number; quality: number; count: number }> = {};
  const byDay: Record<string, { total: number; quality: number; count: number }> = {};
  
  // Initialize
  for (let h = 0; h < 24; h++) {
    byHour[h] = { total: 0, quality: 0, count: 0 };
  }
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(d => {
    byDay[d] = { total: 0, quality: 0, count: 0 };
  });
  
  // Analyze interactions
  interactions.forEach(interaction => {
    const date = new Date(interaction.timestamp);
    const hour = date.getHours();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[date.getDay()];
    
    const quality = interaction.outcome === 'positive' ? 1 : interaction.outcome === 'neutral' ? 0.5 : 0;
    
    byHour[hour].total += interaction.responseTime;
    byHour[hour].quality += quality;
    byHour[hour].count++;
    
    byDay[day].total += interaction.responseTime;
    byDay[day].quality += quality;
    byDay[day].count++;
  });
  
  // Calculate averages
  const hourlyPatterns: TimingProfile['response_patterns']['by_hour'] = {};
  const dailyPatterns: TimingProfile['response_patterns']['by_day'] = {};
  
  Object.entries(byHour).forEach(([hour, data]) => {
    hourlyPatterns[parseInt(hour)] = {
      response_rate: data.count > 0 ? 1 / (data.total / data.count / 60) : 0, // responses per hour
      quality: data.count > 0 ? data.quality / data.count : 0
    };
  });
  
  Object.entries(byDay).forEach(([day, data]) => {
    dailyPatterns[day] = {
      response_rate: data.count > 0 ? 1 / (data.total / data.count / 60) : 0,
      quality: data.count > 0 ? data.quality / data.count : 0
    };
  });
  
  // Determine chronotype from patterns
  const morningQuality = [6, 7, 8, 9, 10, 11].reduce((sum, h) => sum + (hourlyPatterns[h]?.quality || 0), 0);
  const eveningQuality = [18, 19, 20, 21, 22, 23].reduce((sum, h) => sum + (hourlyPatterns[h]?.quality || 0), 0);
  
  let chronotype: TimingProfile['chronotype'];
  if (morningQuality > eveningQuality * 1.3) {
    chronotype = 'morning_lark';
  } else if (eveningQuality > morningQuality * 1.3) {
    chronotype = 'evening_owl';
  } else {
    chronotype = 'intermediate';
  }
  
  // Find peak and low hours
  const sortedHours = Object.entries(hourlyPatterns)
    .filter(([_, data]) => data.quality > 0)
    .sort((a, b) => b[1].quality - a[1].quality);
  
  const peakHours = sortedHours.slice(0, 4).map(([h]) => parseInt(h));
  const lowHours = sortedHours.slice(-4).map(([h]) => parseInt(h));
  
  // Find best and worst days
  const sortedDays = Object.entries(dailyPatterns)
    .filter(([_, data]) => data.quality > 0)
    .sort((a, b) => b[1].quality - a[1].quality);
  
  const bestDays = sortedDays.slice(0, 3).map(([d]) => d);
  const worstDays = sortedDays.slice(-2).map(([d]) => d);
  
  return {
    chronotype,
    peak_hours: peakHours.length > 0 ? peakHours : [10, 11, 14, 15],
    low_hours: lowHours.length > 0 ? lowHours : [7, 8, 22, 23],
    best_days: bestDays.length > 0 ? bestDays : ['Tuesday', 'Wednesday', 'Thursday'],
    worst_days: worstDays.length > 0 ? worstDays : ['Sunday', 'Monday'],
    response_patterns: {
      by_hour: hourlyPatterns,
      by_day: dailyPatterns
    }
  };
}

/**
 * Get the next optimal window for a specific goal
 */
export function getNextOptimalWindow(
  profile: TimingProfile,
  goal: 'major_decision' | 'quick_ask' | 'emotional_appeal' | 'difficult_conversation'
): {
  next_window: Date;
  window_quality: number;
  preparation_notes: string[];
} {
  const now = new Date();
  const persuasionTiming = calculatePersuasionTiming(profile.chronotype);
  
  let targetHour: number;
  let targetDays: string[];
  let quality: number;
  let notes: string[];
  
  switch (goal) {
    case 'major_decision':
      targetHour = profile.peak_hours[0];
      targetDays = ['Tuesday', 'Wednesday'];
      quality = persuasionTiming.major_decisions.success_probability;
      notes = [
        'Prepare logical arguments in advance',
        'Have supporting data ready',
        'Allow time for them to process'
      ];
      break;
    case 'quick_ask':
      targetHour = CIRCADIAN_PATTERNS[profile.chronotype].decision_fatigue_onset + 1;
      targetDays = ['Thursday', 'Friday'];
      quality = persuasionTiming.quick_asks.success_probability;
      notes = [
        'Keep request simple and clear',
        'Make compliance easy',
        'Frame as low-effort for them'
      ];
      break;
    case 'emotional_appeal':
      targetHour = CIRCADIAN_PATTERNS[profile.chronotype].social_peak[0];
      targetDays = ['Friday', 'Saturday'];
      quality = persuasionTiming.emotional_appeals.success_probability;
      notes = [
        'Connect to shared experiences',
        'Use emotional language',
        'Be vulnerable yourself first'
      ];
      break;
    case 'difficult_conversation':
      targetHour = profile.peak_hours[0];
      targetDays = ['Wednesday'];
      quality = persuasionTiming.difficult_conversations.success_probability;
      notes = [
        'Choose private setting',
        'Start with connection before content',
        'Have solutions ready, not just problems'
      ];
      break;
  }
  
  // Find next occurrence
  const nextWindow = new Date(now);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Look for next matching day within a week
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const checkDay = days[checkDate.getDay()];
    
    if (targetDays.includes(checkDay)) {
      nextWindow.setTime(checkDate.getTime());
      nextWindow.setHours(targetHour, 0, 0, 0);
      
      // If today but hour passed, check next occurrence
      if (nextWindow > now) {
        break;
      }
    }
  }
  
  return {
    next_window: nextWindow,
    window_quality: quality,
    preparation_notes: notes
  };
}

/**
 * Calculate synchrony effect - when your rhythms align
 */
export function calculateSynchronyEffect(
  yourChronotype: 'morning_lark' | 'evening_owl' | 'intermediate',
  theirChronotype: 'morning_lark' | 'evening_owl' | 'intermediate'
): {
  synchrony_score: number;
  overlapping_peaks: number[];
  optimal_shared_times: string[];
  adaptation_required: string;
} {
  const yourPattern = CIRCADIAN_PATTERNS[yourChronotype];
  const theirPattern = CIRCADIAN_PATTERNS[theirChronotype];
  
  // Find overlapping peak hours
  const overlapping = yourPattern.cognitive_peak.filter(h => 
    theirPattern.cognitive_peak.includes(h)
  );
  
  // Calculate synchrony score
  const synchrony = overlapping.length / Math.max(yourPattern.cognitive_peak.length, theirPattern.cognitive_peak.length);
  
  // Determine adaptation needed
  let adaptation: string;
  if (yourChronotype === theirChronotype) {
    adaptation = 'No adaptation needed - natural rhythm alignment';
  } else if (
    (yourChronotype === 'morning_lark' && theirChronotype === 'evening_owl') ||
    (yourChronotype === 'evening_owl' && theirChronotype === 'morning_lark')
  ) {
    adaptation = 'Significant adaptation needed - focus on midday overlap windows';
  } else {
    adaptation = 'Minor adaptation needed - extend into their peak hours occasionally';
  }
  
  return {
    synchrony_score: synchrony,
    overlapping_peaks: overlapping.length > 0 ? overlapping : [12, 13, 14],
    optimal_shared_times: overlapping.length > 0 
      ? overlapping.map(h => `${h}:00-${h + 1}:00`)
      : ['12:00-14:00'],
    adaptation_required: adaptation
  };
}
