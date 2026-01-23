import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Chronotype Analyzer
 * Analyzes circadian patterns for strategic timing intelligence:
 * - Morning/Evening type classification
 * - Cognitive peak detection
 * - Compliance window identification
 * - Decision fatigue mapping
 */

interface InteractionData {
  timestamp: string;
  type: 'message' | 'response' | 'call' | 'meeting' | 'email';
  response_quality?: number;
  engagement_level?: number;
}

interface ChronotypeAnalysis {
  chronotype: 'morning_lark' | 'evening_owl' | 'intermediate';
  morningness_score: number; // 0-100, higher = more morning oriented
  cognitive_peak_hours: number[];
  cognitive_low_hours: number[];
  response_pattern: {
    by_hour: Record<number, { count: number; avg_quality: number }>;
    by_day: Record<string, { count: number; avg_quality: number }>;
  };
  optimal_contact_windows: {
    best_hours: number[];
    best_days: string[];
    worst_hours: number[];
    reasoning: string;
  };
  compliance_windows: {
    high_compliance: { hours: number[]; days: string[] };
    low_resistance: { hours: number[]; days: string[] };
    decision_fatigue_onset: number; // Hour when decision fatigue typically starts
  };
  persuasion_timing: {
    for_major_decisions: string;
    for_quick_asks: string;
    for_emotional_appeals: string;
    for_logical_arguments: string;
  };
  weekly_pattern: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

function analyzeChronotype(interactions: InteractionData[]): ChronotypeAnalysis {
  // Initialize hourly and daily patterns
  const hourlyPattern: Record<number, { count: number; total_quality: number }> = {};
  const dailyPattern: Record<string, { count: number; total_quality: number }> = {};
  
  for (let i = 0; i < 24; i++) {
    hourlyPattern[i] = { count: 0, total_quality: 0 };
  }
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  days.forEach(day => {
    dailyPattern[day] = { count: 0, total_quality: 0 };
  });
  
  // Analyze interactions
  interactions.forEach(interaction => {
    const date = new Date(interaction.timestamp);
    const hour = date.getHours();
    const day = days[date.getDay()];
    const quality = interaction.engagement_level || interaction.response_quality || 0.5;
    
    hourlyPattern[hour].count++;
    hourlyPattern[hour].total_quality += quality;
    
    dailyPattern[day].count++;
    dailyPattern[day].total_quality += quality;
  });
  
  // Calculate averages
  const responseByHour: Record<number, { count: number; avg_quality: number }> = {};
  const responseByDay: Record<string, { count: number; avg_quality: number }> = {};
  
  Object.entries(hourlyPattern).forEach(([hour, data]) => {
    responseByHour[parseInt(hour)] = {
      count: data.count,
      avg_quality: data.count > 0 ? data.total_quality / data.count : 0
    };
  });
  
  Object.entries(dailyPattern).forEach(([day, data]) => {
    responseByDay[day] = {
      count: data.count,
      avg_quality: data.count > 0 ? data.total_quality / data.count : 0
    };
  });
  
  // Determine chronotype based on activity patterns
  const morningActivity = [6, 7, 8, 9, 10, 11].reduce((sum, h) => sum + hourlyPattern[h].count, 0);
  const eveningActivity = [18, 19, 20, 21, 22, 23].reduce((sum, h) => sum + hourlyPattern[h].count, 0);
  const totalActivity = Object.values(hourlyPattern).reduce((sum, h) => sum + h.count, 0);
  
  const morningRatio = totalActivity > 0 ? morningActivity / totalActivity : 0.5;
  const eveningRatio = totalActivity > 0 ? eveningActivity / totalActivity : 0.5;
  
  let chronotype: 'morning_lark' | 'evening_owl' | 'intermediate';
  let morningnessScore: number;
  
  if (morningRatio > eveningRatio * 1.5) {
    chronotype = 'morning_lark';
    morningnessScore = 70 + (morningRatio * 30);
  } else if (eveningRatio > morningRatio * 1.5) {
    chronotype = 'evening_owl';
    morningnessScore = 30 - (eveningRatio * 20);
  } else {
    chronotype = 'intermediate';
    morningnessScore = 50 + ((morningRatio - eveningRatio) * 20);
  }
  
  // Find cognitive peak hours (highest quality interactions)
  const hourlyQuality = Object.entries(responseByHour)
    .filter(([_, data]) => data.count >= 2)
    .map(([hour, data]) => ({ hour: parseInt(hour), quality: data.avg_quality }))
    .sort((a, b) => b.quality - a.quality);
  
  const peakHours = hourlyQuality.slice(0, 4).map(h => h.hour);
  const lowHours = hourlyQuality.slice(-4).map(h => h.hour);
  
  // Determine best days
  const dailyQuality = Object.entries(responseByDay)
    .filter(([_, data]) => data.count >= 2)
    .map(([day, data]) => ({ day, quality: data.avg_quality }))
    .sort((a, b) => b.quality - a.quality);
  
  const bestDays = dailyQuality.slice(0, 3).map(d => d.day);
  
  // Calculate compliance windows based on chronotype
  let highComplianceHours: number[];
  let decisionFatigueOnset: number;
  
  if (chronotype === 'morning_lark') {
    highComplianceHours = [9, 10, 11]; // Peak cognitive function
    decisionFatigueOnset = 15; // 3 PM
  } else if (chronotype === 'evening_owl') {
    highComplianceHours = [14, 15, 16, 17]; // Their cognitive peak
    decisionFatigueOnset = 22; // 10 PM
  } else {
    highComplianceHours = [10, 11, 14, 15]; // Mixed windows
    decisionFatigueOnset = 17; // 5 PM
  }
  
  // Low resistance hours (when guard is down)
  const lowResistanceHours = chronotype === 'morning_lark' 
    ? [20, 21, 22] // Evening when tired
    : chronotype === 'evening_owl'
    ? [8, 9, 10] // Morning when groggy
    : [12, 13, 21, 22]; // Lunch and late evening
  
  // Generate weekly pattern insights
  const weeklyPattern = {
    monday: 'High stress, recovery from weekend - avoid major asks',
    tuesday: 'Peak productivity - good for complex requests',
    wednesday: 'Mid-week stability - optimal for negotiations',
    thursday: 'Fatigue building - good for quick decisions',
    friday: 'Weekend anticipation - good for positive proposals',
    saturday: 'Relaxed mindset - personal requests work well',
    sunday: 'Reflective mood - plant ideas for the week'
  };
  
  return {
    chronotype,
    morningness_score: Math.max(0, Math.min(100, morningnessScore)),
    cognitive_peak_hours: peakHours.length > 0 ? peakHours : (chronotype === 'morning_lark' ? [9, 10, 11] : [15, 16, 17]),
    cognitive_low_hours: lowHours.length > 0 ? lowHours : (chronotype === 'morning_lark' ? [15, 16, 21] : [8, 9, 10]),
    response_pattern: {
      by_hour: responseByHour,
      by_day: responseByDay
    },
    optimal_contact_windows: {
      best_hours: peakHours.length > 0 ? peakHours.slice(0, 3) : [10, 11, 14],
      best_days: bestDays.length > 0 ? bestDays : ['Tuesday', 'Wednesday', 'Thursday'],
      worst_hours: lowHours.length > 0 ? lowHours.slice(0, 2) : [6, 7, 22, 23],
      reasoning: `${chronotype} chronotype with peak activity during ${peakHours.join(', ')} hours`
    },
    compliance_windows: {
      high_compliance: {
        hours: highComplianceHours,
        days: ['Tuesday', 'Wednesday']
      },
      low_resistance: {
        hours: lowResistanceHours,
        days: ['Friday', 'Saturday']
      },
      decision_fatigue_onset: decisionFatigueOnset
    },
    persuasion_timing: {
      for_major_decisions: `${highComplianceHours[0]}:00-${highComplianceHours[highComplianceHours.length - 1]}:00 on Tuesday/Wednesday`,
      for_quick_asks: `Just after ${decisionFatigueOnset}:00 when cognitive resources depleted`,
      for_emotional_appeals: chronotype === 'evening_owl' ? 'Late evening when emotional' : 'Early evening when tired',
      for_logical_arguments: `During cognitive peak: ${peakHours.slice(0, 2).join(':00-')}:00`
    },
    weekly_pattern: weeklyPattern
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'chronotype-analyzer', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { profile_id, interactions = [] } = await req.json();

    // If no interactions provided, fetch from database
    // NOTE: messages table has no profile_id/direction columns - must join via conversations
    // and use is_from_contact instead of direction
    let interactionData = interactions;
    if (interactionData.length === 0 && profile_id) {
      // Fetch messages via conversations join
      const { data: messages } = await supabaseClient
        .from('messages')
        .select('created_at, is_from_contact, conversations!inner(profile_id, user_id)')
        .eq('conversations.user_id', user.id)
        .eq('conversations.profile_id', profile_id)
        .order('created_at', { ascending: false })
        .limit(500);
      
      // Fetch interactions
      const { data: interactionRecords } = await supabaseClient
        .from('contact_interaction_notes')
        .select('created_at, interaction_type, note_text')
        .eq('user_id', user.id)
        .eq('profile_id', profile_id)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (messages) {
        interactionData = messages.map((m: any) => ({
          timestamp: m.created_at,
          type: 'message' as const,
          response_quality: m.is_from_contact ? 0.7 : 0.5
        }));
      }
      
      if (interactionRecords) {
        interactionData = [
          ...interactionData,
          ...interactionRecords.map(i => ({
            timestamp: i.created_at,
            type: i.interaction_type as any,
            response_quality: 0.6
          }))
        ];
      }
    }

    // Analyze chronotype
    const analysis = analyzeChronotype(interactionData);

    // Save to database
    if (profile_id) {
      await supabaseClient.from('chronotype_profiles').upsert({
        user_id: user.id,
        profile_id,
        chronotype: analysis.chronotype,
        morningness_eveningness_score: Math.round(analysis.morningness_score),
        cognitive_peak_hours: analysis.cognitive_peak_hours,
        cognitive_low_hours: analysis.cognitive_low_hours,
        compliance_windows: analysis.compliance_windows,
        weekly_routine: analysis.weekly_pattern,
        optimal_persuasion_times: analysis.persuasion_timing,
        decision_fatigue_patterns: {
          onset_hour: analysis.compliance_windows.decision_fatigue_onset,
          low_resistance_hours: analysis.compliance_windows.low_resistance.hours
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id'
      });
    }

    return new Response(JSON.stringify({
      profile_id,
      analysis,
      recommendations: {
        immediate_action: `Best time to reach out: ${analysis.optimal_contact_windows.best_hours[0]}:00 on ${analysis.optimal_contact_windows.best_days[0]}`,
        for_difficult_conversations: analysis.persuasion_timing.for_major_decisions,
        for_quick_favors: analysis.persuasion_timing.for_quick_asks,
        avoid_times: `${analysis.optimal_contact_windows.worst_hours.join(':00, ')}:00`
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chronotype analyzer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
