import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoricalPattern {
  dayOfWeek: number; // 0-6
  hour: number; // 0-23
  context: string;
  frequency: number;
  avgDuration: number; // minutes
}

interface Prediction {
  predictedContext: string;
  confidence: number;
  expectedDuration: number;
  nextTransition: {
    context: string;
    time: string;
  };
  optimalContactTimes: {
    profileId: string;
    suggestedTime: string;
    reason: string;
  }[];
}

function findMatchingPatterns(
  patterns: HistoricalPattern[],
  targetDay: number,
  targetHour: number
): HistoricalPattern[] {
  return patterns.filter(p => 
    p.dayOfWeek === targetDay && 
    Math.abs(p.hour - targetHour) <= 1
  );
}

function predictNextContext(
  patterns: HistoricalPattern[],
  currentDay: number,
  currentHour: number
): { context: string; time: string } {
  // Look for patterns in the next few hours
  for (let hourOffset = 1; hourOffset <= 4; hourOffset++) {
    const nextHour = (currentHour + hourOffset) % 24;
    const nextDay = nextHour < currentHour ? (currentDay + 1) % 7 : currentDay;
    
    const nextPatterns = findMatchingPatterns(patterns, nextDay, nextHour);
    if (nextPatterns.length > 0) {
      // Find most frequent pattern
      const sorted = nextPatterns.sort((a, b) => b.frequency - a.frequency);
      if (sorted[0].context !== patterns[0]?.context) {
        const estimatedTime = new Date();
        estimatedTime.setHours(estimatedTime.getHours() + hourOffset);
        return {
          context: sorted[0].context,
          time: estimatedTime.toISOString()
        };
      }
    }
  }

  return {
    context: 'unknown',
    time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  };
}

function calculateOptimalContactTimes(
  contactPatterns: { profileId: string; preferredHours: number[]; preferredDays: number[] }[],
  currentTime: Date
): { profileId: string; suggestedTime: string; reason: string }[] {
  const results: { profileId: string; suggestedTime: string; reason: string }[] = [];
  const currentDay = currentTime.getDay();
  const currentHour = currentTime.getHours();

  for (const contact of contactPatterns) {
    // Find the next optimal time within the next 7 days
    let bestTime: Date | null = null;
    let reason = '';

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      
      if (contact.preferredDays.includes(checkDay)) {
        for (const preferredHour of contact.preferredHours.sort((a, b) => a - b)) {
          if (dayOffset === 0 && preferredHour <= currentHour) continue;
          
          bestTime = new Date(currentTime);
          bestTime.setDate(bestTime.getDate() + dayOffset);
          bestTime.setHours(preferredHour, 0, 0, 0);
          
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          reason = `Best reach ${dayNames[checkDay]} around ${preferredHour}:00 based on history`;
          break;
        }
        if (bestTime) break;
      }
    }

    if (bestTime) {
      results.push({
        profileId: contact.profileId,
        suggestedTime: bestTime.toISOString(),
        reason
      });
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      historicalPatterns, 
      contactPatterns,
      targetTime 
    } = await req.json() as {
      historicalPatterns: HistoricalPattern[];
      contactPatterns?: { profileId: string; preferredHours: number[]; preferredDays: number[] }[];
      targetTime?: string;
    };

    const now = targetTime ? new Date(targetTime) : new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    // Find matching patterns for current time
    const matchingPatterns = findMatchingPatterns(historicalPatterns, currentDay, currentHour);

    let predictedContext = 'unknown';
    let confidence = 0.5;
    let expectedDuration = 60;

    if (matchingPatterns.length > 0) {
      // Sort by frequency and take the most common
      const sorted = matchingPatterns.sort((a, b) => b.frequency - a.frequency);
      const topPattern = sorted[0];
      
      predictedContext = topPattern.context;
      expectedDuration = topPattern.avgDuration;
      
      // Calculate confidence based on frequency relative to total
      const totalFreq = sorted.reduce((sum, p) => sum + p.frequency, 0);
      confidence = Math.min(0.95, topPattern.frequency / totalFreq + 0.2);
    }

    // Predict next context transition
    const nextTransition = predictNextContext(historicalPatterns, currentDay, currentHour);

    // Calculate optimal contact times
    const optimalContactTimes = contactPatterns 
      ? calculateOptimalContactTimes(contactPatterns, now)
      : [];

    const prediction: Prediction = {
      predictedContext,
      confidence: Math.round(confidence * 100) / 100,
      expectedDuration,
      nextTransition,
      optimalContactTimes
    };

    return new Response(
      JSON.stringify({
        success: true,
        prediction,
        analysisTime: now.toISOString(),
        patternsAnalyzed: historicalPatterns.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in predict-context:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
