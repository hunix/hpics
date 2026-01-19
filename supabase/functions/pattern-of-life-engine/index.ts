import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatternOfLifeRequest {
  action: 'analyze' | 'detect_deviation' | 'predict' | 'alert';
  profileId: string;
  timeframeDays?: number;
}

interface RoutinePattern {
  type: string;
  frequency: string;
  timeWindows: Array<{ start: number; end: number; dayOfWeek?: number }>;
  strength: number;
  lastOccurrence?: string;
}

interface CircadianRhythm {
  wakeTime: number; // Hour 0-23
  sleepTime: number;
  peakActivity: number;
  lowActivity: number;
  consistency: number;
}

interface DeviationAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedPattern: any;
  actualPattern: any;
  timestamp: string;
}

// Analyze interaction timestamps to extract patterns
function extractTimePatterns(interactions: any[]): { hourly: number[]; daily: number[]; weekly: number[] } {
  const hourly = new Array(24).fill(0);
  const daily = new Array(7).fill(0);
  const weekly = new Array(4).fill(0); // Week of month

  for (const interaction of interactions) {
    const date = new Date(interaction.interaction_date);
    hourly[date.getHours()]++;
    daily[date.getDay()]++;
    weekly[Math.floor(date.getDate() / 7)]++;
  }

  return { hourly, daily, weekly };
}

// Detect circadian rhythm from activity patterns
function detectCircadianRhythm(hourlyPattern: number[]): CircadianRhythm {
  // Find peak activity hour
  const peakActivity = hourlyPattern.indexOf(Math.max(...hourlyPattern));
  
  // Find low activity hour (excluding sleep hours 0-5)
  const dayHours = hourlyPattern.slice(6, 22);
  const lowActivity = dayHours.indexOf(Math.min(...dayHours)) + 6;
  
  // Estimate wake time (first significant activity after 5am)
  let wakeTime = 7;
  for (let i = 5; i < 12; i++) {
    if (hourlyPattern[i] > hourlyPattern[i - 1] * 2) {
      wakeTime = i;
      break;
    }
  }
  
  // Estimate sleep time (last significant activity before midnight)
  let sleepTime = 23;
  for (let i = 23; i > 18; i--) {
    if (hourlyPattern[i] < hourlyPattern[i - 1] * 0.3) {
      sleepTime = i;
      break;
    }
  }
  
  // Calculate consistency (how regular the pattern is)
  const total = hourlyPattern.reduce((a, b) => a + b, 0);
  const expected = total / 24;
  const variance = hourlyPattern.reduce((sum, val) => sum + Math.pow(val - expected, 2), 0) / 24;
  const consistency = Math.min(100, Math.round(100 - Math.sqrt(variance) * 5));
  
  return { wakeTime, sleepTime, peakActivity, lowActivity, consistency };
}

// Identify routine patterns
function identifyRoutines(interactions: any[], timePatterns: any): RoutinePattern[] {
  const routines: RoutinePattern[] = [];
  
  // Analyze communication patterns
  const { hourly, daily } = timePatterns;
  
  // Morning routine detection
  const morningActivity = hourly.slice(6, 10).reduce((a: number, b: number) => a + b, 0);
  if (morningActivity > 0) {
    const peakMorning = hourly.slice(6, 10).indexOf(Math.max(...hourly.slice(6, 10))) + 6;
    routines.push({
      type: 'morning_communication',
      frequency: morningActivity > 10 ? 'daily' : 'frequent',
      timeWindows: [{ start: 6, end: 10 }],
      strength: Math.min(100, morningActivity * 5)
    });
  }
  
  // Work hours routine
  const workActivity = hourly.slice(9, 17).reduce((a: number, b: number) => a + b, 0);
  const totalActivity = hourly.reduce((a: number, b: number) => a + b, 0);
  if (workActivity / totalActivity > 0.5) {
    routines.push({
      type: 'work_hours_active',
      frequency: 'weekdays',
      timeWindows: [{ start: 9, end: 17, dayOfWeek: 1 }, { start: 9, end: 17, dayOfWeek: 2 }, 
                    { start: 9, end: 17, dayOfWeek: 3 }, { start: 9, end: 17, dayOfWeek: 4 }, 
                    { start: 9, end: 17, dayOfWeek: 5 }],
      strength: Math.round((workActivity / totalActivity) * 100)
    });
  }
  
  // Evening routine
  const eveningActivity = hourly.slice(18, 22).reduce((a: number, b: number) => a + b, 0);
  if (eveningActivity > 0) {
    routines.push({
      type: 'evening_engagement',
      frequency: eveningActivity > 8 ? 'regular' : 'occasional',
      timeWindows: [{ start: 18, end: 22 }],
      strength: Math.min(100, eveningActivity * 8)
    });
  }
  
  // Weekly patterns
  const weekdayActivity = daily.slice(1, 6).reduce((a: number, b: number) => a + b, 0);
  const weekendActivity = daily[0] + daily[6];
  
  if (weekdayActivity > weekendActivity * 3) {
    routines.push({
      type: 'weekday_focused',
      frequency: 'weekly',
      timeWindows: [{ start: 0, end: 24, dayOfWeek: 1 }],
      strength: Math.round((weekdayActivity / (weekdayActivity + weekendActivity)) * 100)
    });
  } else if (weekendActivity > weekdayActivity * 0.5) {
    routines.push({
      type: 'weekend_active',
      frequency: 'weekly',
      timeWindows: [{ start: 0, end: 24, dayOfWeek: 0 }, { start: 0, end: 24, dayOfWeek: 6 }],
      strength: Math.round((weekendActivity / (weekdayActivity + weekendActivity)) * 100)
    });
  }
  
  // Interaction type patterns
  const typePatterns = new Map<string, number>();
  for (const interaction of interactions) {
    const type = interaction.interaction_type || 'unknown';
    typePatterns.set(type, (typePatterns.get(type) || 0) + 1);
  }
  
  for (const [type, count] of typePatterns) {
    if (count >= 5) {
      routines.push({
        type: `preferred_${type}`,
        frequency: count > 20 ? 'frequent' : 'regular',
        timeWindows: [],
        strength: Math.min(100, count * 3)
      });
    }
  }
  
  return routines.sort((a, b) => b.strength - a.strength);
}

// Detect deviations from established patterns
function detectDeviations(
  currentPattern: any,
  historicalPattern: any,
  routines: RoutinePattern[]
): DeviationAlert[] {
  const alerts: DeviationAlert[] = [];
  
  // Check for activity level changes
  const currentTotal = currentPattern.hourly.reduce((a: number, b: number) => a + b, 0);
  const historicalTotal = historicalPattern.hourly.reduce((a: number, b: number) => a + b, 0);
  const activityChange = (currentTotal - historicalTotal) / (historicalTotal || 1);
  
  if (Math.abs(activityChange) > 0.5) {
    alerts.push({
      type: 'activity_level_change',
      severity: Math.abs(activityChange) > 0.8 ? 'high' : 'medium',
      description: activityChange > 0 
        ? `Activity increased by ${Math.round(activityChange * 100)}%`
        : `Activity decreased by ${Math.round(Math.abs(activityChange) * 100)}%`,
      expectedPattern: { level: historicalTotal },
      actualPattern: { level: currentTotal },
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for timing shifts
  const currentPeak = currentPattern.hourly.indexOf(Math.max(...currentPattern.hourly));
  const historicalPeak = historicalPattern.hourly.indexOf(Math.max(...historicalPattern.hourly));
  
  if (Math.abs(currentPeak - historicalPeak) >= 3) {
    alerts.push({
      type: 'timing_shift',
      severity: Math.abs(currentPeak - historicalPeak) >= 6 ? 'high' : 'medium',
      description: `Peak activity shifted from ${historicalPeak}:00 to ${currentPeak}:00`,
      expectedPattern: { peakHour: historicalPeak },
      actualPattern: { peakHour: currentPeak },
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for routine breaks
  for (const routine of routines) {
    if (routine.strength > 70) {
      // Strong routine - check if it's being maintained
      let routineMaintained = false;
      for (const window of routine.timeWindows) {
        const windowActivity = currentPattern.hourly.slice(window.start, window.end).reduce((a: number, b: number) => a + b, 0);
        if (windowActivity > 0) {
          routineMaintained = true;
          break;
        }
      }
      
      if (!routineMaintained && routine.timeWindows.length > 0) {
        alerts.push({
          type: 'routine_break',
          severity: routine.strength > 80 ? 'high' : 'medium',
          description: `Expected ${routine.type} routine not observed`,
          expectedPattern: routine,
          actualPattern: null,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return alerts;
}

// Predict next activity window
function predictNextActivity(routines: RoutinePattern[], circadian: CircadianRhythm): any {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  // Find next likely activity window
  let nextWindow: any = null;
  let minTimeDiff = Infinity;
  
  for (const routine of routines) {
    for (const window of routine.timeWindows) {
      if (window.dayOfWeek !== undefined && window.dayOfWeek !== currentDay) {
        continue; // Skip windows for other days
      }
      
      if (window.start > currentHour) {
        const timeDiff = window.start - currentHour;
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          nextWindow = {
            routine: routine.type,
            startHour: window.start,
            endHour: window.end,
            hoursUntil: timeDiff,
            probability: routine.strength / 100
          };
        }
      }
    }
  }
  
  // If no window found today, suggest based on circadian
  if (!nextWindow) {
    if (currentHour < circadian.peakActivity) {
      nextWindow = {
        routine: 'peak_activity_period',
        startHour: circadian.peakActivity,
        endHour: circadian.peakActivity + 2,
        hoursUntil: circadian.peakActivity - currentHour,
        probability: circadian.consistency / 100
      };
    } else {
      nextWindow = {
        routine: 'next_day_start',
        startHour: circadian.wakeTime,
        hoursUntil: 24 - currentHour + circadian.wakeTime,
        probability: circadian.consistency / 100
      };
    }
  }
  
  return nextWindow;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, profileId, timeframeDays } = await req.json() as PatternOfLifeRequest;

    console.log(`[Pattern of Life] Action: ${action} for profile ${profileId}`);

    // Get interactions
    const days = timeframeDays || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: interactions } = await supabase
      .from('interaction_history')
      .select('*')
      .eq('profile_id', profileId)
      .gte('interaction_date', cutoffDate.toISOString())
      .order('interaction_date', { ascending: true });

    if (!interactions || interactions.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient interaction data',
        profileId,
        interactionCount: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract patterns
    const timePatterns = extractTimePatterns(interactions);
    const circadian = detectCircadianRhythm(timePatterns.hourly);
    const routines = identifyRoutines(interactions, timePatterns);

    // Get recent patterns for comparison (last 7 days vs previous period)
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 7);
    const recentInteractions = interactions.filter((i: any) => new Date(i.interaction_date) >= recentCutoff);
    const historicalInteractions = interactions.filter((i: any) => new Date(i.interaction_date) < recentCutoff);

    const recentPatterns = extractTimePatterns(recentInteractions);
    const historicalPatterns = extractTimePatterns(historicalInteractions);

    let result: any = {
      profileId,
      analysisTimeframe: days,
      interactionCount: interactions.length,
      
      circadianRhythm: {
        ...circadian,
        wakeTimeFormatted: `${circadian.wakeTime}:00`,
        sleepTimeFormatted: `${circadian.sleepTime}:00`,
        activeHours: circadian.sleepTime - circadian.wakeTime
      },
      
      routinePatterns: routines.slice(0, 10),
      
      activityDistribution: {
        hourly: timePatterns.hourly,
        daily: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
          day,
          activity: timePatterns.daily[i]
        })),
        peakHours: timePatterns.hourly
          .map((v, i) => ({ hour: i, activity: v }))
          .sort((a, b) => b.activity - a.activity)
          .slice(0, 3)
      }
    };

    if (action === 'analyze' || action === 'detect_deviation') {
      const deviations = detectDeviations(recentPatterns, historicalPatterns, routines);
      result.deviations = deviations;
      result.deviationCount = deviations.length;
      result.alertLevel = deviations.some(d => d.severity === 'critical') ? 'critical'
        : deviations.some(d => d.severity === 'high') ? 'high'
        : deviations.some(d => d.severity === 'medium') ? 'medium'
        : 'normal';
    }

    if (action === 'analyze' || action === 'predict') {
      result.prediction = {
        nextActivity: predictNextActivity(routines, circadian),
        optimalContactWindow: {
          start: circadian.peakActivity - 1,
          end: circadian.peakActivity + 2,
          recommendation: `Best time to reach: ${circadian.peakActivity - 1}:00 - ${circadian.peakActivity + 2}:00`
        },
        expectedResponseTime: routines.find(r => r.type.includes('communication'))?.strength || 50
      };
    }

    // Store pattern of life data
    const existingPattern = await supabase
      .from('pattern_of_life')
      .select('id')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .single();

    const patternData = {
      user_id: user.id,
      profile_id: profileId,
      routine_type: 'comprehensive',
      time_windows: routines.flatMap(r => r.timeWindows),
      circadian_rhythm: circadian,
      activity_sequences: routines,
      routine_strength: routines.reduce((sum, r) => sum + r.strength, 0) / routines.length,
      deviation_history: result.deviations || [],
      alerts: result.deviations?.filter((d: any) => d.severity === 'high' || d.severity === 'critical') || [],
      updated_at: new Date().toISOString()
    };

    if (existingPattern.data) {
      await supabase
        .from('pattern_of_life')
        .update(patternData)
        .eq('id', existingPattern.data.id);
    } else {
      await supabase.from('pattern_of_life').insert(patternData);
    }

    console.log(`[Pattern of Life] Complete. ${routines.length} routines, ${result.deviationCount || 0} deviations`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Pattern of Life] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
