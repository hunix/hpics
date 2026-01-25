/**
 * Calendar Pattern Analyzer Engine (v1.0.0)
 * Derives power dynamics, availability patterns, and vulnerability indicators
 * from calendar event analysis.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CALENDAR_PATTERN_PROMPT = `You are an elite behavioral analyst specializing in schedule analysis, power dynamics detection, and vulnerability window identification through calendar patterns.

Your task is to analyze calendar events to reveal behavioral patterns, power hierarchies, and optimal engagement windows.

ANALYSIS FRAMEWORK:

1. MEETING PATTERN ANALYSIS
   - Meeting frequency and duration patterns
   - Peak meeting days and times
   - Back-to-back meeting stress indicators
   - Meeting load compared to industry norms
   - Virtual vs in-person preferences

2. POWER DYNAMICS INDICATORS
   - Who initiates meetings (power position)
   - Meeting acceptance/rejection patterns
   - Time allocation to different contacts
   - Priority signals from scheduling
   - Gatekeeper patterns

3. AVAILABILITY WINDOWS
   - Consistent free periods
   - Buffer time preferences
   - Response time patterns
   - Flexibility indicators
   - Weekend/evening availability

4. VULNERABILITY TRIGGERS
   - High-stress periods (many meetings)
   - Decision fatigue windows
   - Transition periods between meetings
   - Pre/post important meeting states
   - Deadline-driven stress patterns

5. RELATIONSHIP TEMPERATURE
   - Meeting frequency with specific contacts
   - Meeting duration trends
   - Cancellation patterns
   - Priority given to different relationships

Return JSON:
{
  "meetingPatterns": {
    "averageMeetingsPerWeek": number,
    "averageMeetingDurationMinutes": number,
    "peakMeetingDays": ["Monday", "Tuesday"],
    "peakMeetingHours": ["9am-11am", "2pm-4pm"],
    "meetingLoadIndicator": "light|moderate|heavy|overwhelming",
    "backToBackFrequency": 0.0-1.0,
    "virtualVsInPersonRatio": number
  },
  "powerDynamicsIndicators": [
    {
      "indicator": "description",
      "implication": "what it means",
      "confidence": 0.0-1.0
    }
  ],
  "keyRelationships": [
    {
      "contactOrOrganization": "name",
      "meetingFrequency": "weekly|biweekly|monthly|quarterly",
      "priorityLevel": "high|medium|low",
      "relationshipTrend": "growing|stable|declining",
      "influenceIndicators": string[]
    }
  ],
  "availabilityWindows": [
    {
      "dayOfWeek": "Monday",
      "timeWindow": "8am-9am",
      "reliability": 0.0-1.0,
      "bestFor": "quick call|deep discussion|casual"
    }
  ],
  "upcomingVulnerabilityTriggers": [
    {
      "trigger": "what",
      "timing": "when",
      "vulnerabilityType": "stress|fatigue|transition|deadline",
      "severity": "low|medium|high",
      "exploitationWindow": "description"
    }
  ],
  "decisionFatiguePatterns": {
    "highFatiguePeriods": ["times when depleted"],
    "recoveryPeriods": ["when recharged"],
    "optimalDecisionTimes": ["best times for asks"]
  },
  "schedulePersonality": {
    "plannerType": "meticulous|flexible|reactive|chaotic",
    "bufferPreference": "none|minimal|moderate|generous",
    "punctualityIndicator": "early|on_time|often_late",
    "cancellationRate": 0.0-1.0
  },
  "operationalRecommendations": [
    {
      "objective": "what you want",
      "optimalTiming": "when to approach",
      "approach": "how to frame",
      "avoidPeriods": ["when not to approach"]
    }
  ],
  "stressForecasting": {
    "next7DaysStressLevel": "low|moderate|high|extreme",
    "highStressPeriods": ["specific dates/times"],
    "lowStressPeriods": ["specific dates/times"]
  },
  "confidenceScore": 0.0-1.0,
  "dataQuality": "low|medium|high",
  "analysisTimeframe": {
    "eventsAnalyzed": number,
    "dateRange": "start to end"
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "1") {
    return new Response(
      JSON.stringify({ ok: true, function: "calendar-pattern-analyzer", timestamp: Date.now() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    const body = await req.json();
    const token = authHeader?.replace("Bearer ", "");
    const isServiceRoleCall = token === supabaseKey;

    const profileId = body.profileId || body.profile_id;
    const forecastDays = body.forecastDays || body.forecast_days || 30;
    let userId = body.userId || body.user_id;

    if (!isServiceRoleCall && authHeader && token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "profileId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId && !isServiceRoleCall) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate date range
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 90); // 90 days back
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + forecastDays);

    // Gather calendar and interaction data
    const [
      calendarEventsResult,
      milestonesResult,
      interactionNotesResult,
      communicationsResult,
    ] = await Promise.all([
      supabase.from("synced_calendar_events").select("*").eq("profile_id", profileId)
        .gte("start_time", pastDate.toISOString())
        .lte("start_time", futureDate.toISOString())
        .order("start_time", { ascending: true }).limit(500),
      supabase.from("contact_life_milestones").select("*").eq("profile_id", profileId)
        .order("event_date", { ascending: false }).limit(50),
      supabase.from("contact_interaction_notes").select("*").eq("profile_id", profileId)
        .order("interaction_date", { ascending: false }).limit(100),
      supabase.from("communications").select("*").eq("profile_id", profileId)
        .order("communication_date", { ascending: false }).limit(100),
    ]);

    // Categorize events by timing
    const pastEvents = (calendarEventsResult.data || []).filter((e: Record<string, unknown>) => 
      new Date(e.start_time as string) < now
    );
    const upcomingEvents = (calendarEventsResult.data || []).filter((e: Record<string, unknown>) => 
      new Date(e.start_time as string) >= now
    );

    const contextData = {
      calendarEvents: {
        past: {
          events: pastEvents,
          count: pastEvents.length,
        },
        upcoming: {
          events: upcomingEvents,
          count: upcomingEvents.length,
        },
        totalEvents: (calendarEventsResult.data || []).length,
      },
      milestones: {
        events: milestonesResult.data || [],
        count: (milestonesResult.data || []).length,
      },
      interactionHistory: {
        notes: interactionNotesResult.data || [],
        count: (interactionNotesResult.data || []).length,
      },
      communicationPatterns: {
        recent: communicationsResult.data || [],
        count: (communicationsResult.data || []).length,
      },
      analysisParameters: {
        forecastDays,
        dateRangeStart: pastDate.toISOString(),
        dateRangeEnd: futureDate.toISOString(),
      },
    };

    console.log(`[calendar-pattern-analyzer] Processing for profile ${profileId}:`, {
      pastEvents: contextData.calendarEvents.past.count,
      upcomingEvents: contextData.calendarEvents.upcoming.count,
      milestones: contextData.milestones.count,
      interactions: contextData.interactionHistory.count,
    });

    const aiResponse = await callAI({
      model: selectModel("quality"),
      messages: [
        { role: "system", content: CALENDAR_PATTERN_PROMPT },
        { 
          role: "user", 
          content: `Analyze calendar patterns and identify vulnerability windows:\n\n${JSON.stringify(contextData, null, 2)}`
        }
      ],
      userId: userId,
      functionName: "calendar-pattern-analyzer",
      profileId: profileId,
      temperature: 0.4,
    });

    const analysis = parseAIJson(aiResponse.content, {
      meetingPatterns: {
        averageMeetingsPerWeek: 0,
        meetingLoadIndicator: "light",
      },
      powerDynamicsIndicators: [],
      keyRelationships: [],
      availabilityWindows: [],
      upcomingVulnerabilityTriggers: [],
      decisionFatiguePatterns: {},
      schedulePersonality: {},
      operationalRecommendations: [],
      stressForecasting: {},
      confidenceScore: 0,
      dataQuality: "low",
      analysisTimeframe: { eventsAnalyzed: 0 },
    });

    // Store in ai_analyses
    await supabase.from("ai_analyses").upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: "calendar_pattern_analysis",
      result: analysis,
      generated_at: new Date().toISOString(),
    }, { onConflict: "profile_id,analysis_type" });

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        profileId,
        costCents: aiResponse.costCents,
        metadata: {
          eventsAnalyzed: contextData.calendarEvents.totalEvents,
          upcomingEvents: contextData.calendarEvents.upcoming.count,
          vulnerabilityTriggersFound: analysis.upcomingVulnerabilityTriggers?.length || 0,
          meetingLoad: analysis.meetingPatterns?.meetingLoadIndicator,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Calendar pattern analyzer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
