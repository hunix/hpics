import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommunicationEvent {
  type: 'call' | 'message' | 'email' | 'meeting';
  timestamp: string;
  duration?: number;
  direction: 'inbound' | 'outbound';
  profileId: string;
}

interface PatternAnalysis {
  profileId: string;
  totalInteractions: number;
  averageFrequency: number; // interactions per week
  preferredDays: string[];
  preferredHours: number[];
  communicationTrend: 'increasing' | 'stable' | 'decreasing';
  optimalContactTime: string;
  daysSinceLastContact: number;
  riskLevel: 'low' | 'medium' | 'high';
}

function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function analyzePatterns(events: CommunicationEvent[], profileId: string): PatternAnalysis {
  const profileEvents = events.filter(e => e.profileId === profileId);
  
  if (profileEvents.length === 0) {
    return {
      profileId,
      totalInteractions: 0,
      averageFrequency: 0,
      preferredDays: [],
      preferredHours: [],
      communicationTrend: 'stable',
      optimalContactTime: 'Unknown',
      daysSinceLastContact: 999,
      riskLevel: 'high'
    };
  }

  // Sort by timestamp
  profileEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate day and hour frequencies
  const dayFrequency: Record<string, number> = {};
  const hourFrequency: Record<number, number> = {};

  profileEvents.forEach(event => {
    const date = new Date(event.timestamp);
    const day = getDayName(date);
    const hour = date.getHours();

    dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
  });

  // Get top preferred days
  const preferredDays = Object.entries(dayFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([day]) => day);

  // Get top preferred hours
  const preferredHours = Object.entries(hourFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Calculate trend (compare first half vs second half)
  const midpoint = Math.floor(profileEvents.length / 2);
  const firstHalf = profileEvents.slice(0, midpoint);
  const secondHalf = profileEvents.slice(midpoint);

  let communicationTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (secondHalf.length > firstHalf.length * 1.2) {
    communicationTrend = 'increasing';
  } else if (secondHalf.length < firstHalf.length * 0.8) {
    communicationTrend = 'decreasing';
  }

  // Calculate days since last contact
  const lastEvent = profileEvents[profileEvents.length - 1];
  const daysSinceLastContact = Math.floor(
    (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate average frequency (per week)
  const firstEventDate = new Date(profileEvents[0].timestamp);
  const lastEventDate = new Date(lastEvent.timestamp);
  const weeksBetween = Math.max(1, (lastEventDate.getTime() - firstEventDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const averageFrequency = profileEvents.length / weeksBetween;

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (daysSinceLastContact > 30 || communicationTrend === 'decreasing') {
    riskLevel = 'high';
  } else if (daysSinceLastContact > 14) {
    riskLevel = 'medium';
  }

  // Format optimal contact time
  const optimalDay = preferredDays[0] || 'Any day';
  const optimalHour = preferredHours[0] !== undefined ? `${preferredHours[0]}:00` : 'Any time';
  const optimalContactTime = `${optimalDay} around ${optimalHour}`;

  return {
    profileId,
    totalInteractions: profileEvents.length,
    averageFrequency: Math.round(averageFrequency * 10) / 10,
    preferredDays,
    preferredHours,
    communicationTrend,
    optimalContactTime,
    daysSinceLastContact,
    riskLevel
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { communicationEvents, profileIds } = await req.json() as {
      communicationEvents: CommunicationEvent[];
      profileIds: string[];
    };

    if (!communicationEvents || !Array.isArray(communicationEvents)) {
      return new Response(
        JSON.stringify({ error: 'Invalid communication events data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analyses: PatternAnalysis[] = [];
    const recommendations: { profileId: string; action: string; priority: string }[] = [];

    for (const profileId of profileIds) {
      const analysis = analyzePatterns(communicationEvents, profileId);
      analyses.push(analysis);

      // Generate recommendations
      if (analysis.riskLevel === 'high') {
        recommendations.push({
          profileId,
          action: `Reach out soon - no contact in ${analysis.daysSinceLastContact} days`,
          priority: 'high'
        });
      } else if (analysis.communicationTrend === 'decreasing') {
        recommendations.push({
          profileId,
          action: 'Communication declining - consider scheduling a catch-up',
          priority: 'medium'
        });
      }
    }

    // Overall insights
    const overallInsights = {
      totalContacts: analyses.length,
      highRiskCount: analyses.filter(a => a.riskLevel === 'high').length,
      mediumRiskCount: analyses.filter(a => a.riskLevel === 'medium').length,
      decreasingTrendCount: analyses.filter(a => a.communicationTrend === 'decreasing').length,
      averageInteractionsPerContact: analyses.reduce((sum, a) => sum + a.totalInteractions, 0) / analyses.length
    };

    return new Response(
      JSON.stringify({
        success: true,
        analyses,
        recommendations,
        overallInsights
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-communication-patterns:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
