/**
 * Geospatial-Communication Fusion Engine (v1.0.0)
 * Correlates location history with communication timestamps to identify
 * where targets communicate from and detect location-based anomalies.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEOSPATIAL_FUSION_PROMPT = `You are an elite intelligence analyst specializing in geospatial-temporal pattern correlation.

Your task is to fuse location data with communication patterns to reveal WHERE the target conducts different types of communications and identify spatial-behavioral anomalies.

ANALYSIS FRAMEWORK:

1. COMMUNICATION HOTSPOT MAPPING
   - Identify locations where target frequently communicates
   - Categorize by communication type (calls, messages, emails)
   - Determine work vs personal communication zones
   - Identify neutral/secure communication locations

2. SPATIAL-TEMPORAL PATTERNS
   - Time of day patterns at each location
   - Day of week variations
   - Seasonal or monthly patterns
   - Correlation with external events

3. ANOMALY DETECTION
   - Communications from unusual locations
   - Pattern breaks in location-communication correlation
   - Covert communication indicators
   - Counter-surveillance behavior signs

4. VULNERABILITY WINDOWS
   - Predictable location patterns
   - Regular communication windows at specific locations
   - Geographic approach opportunities
   - Safe zones vs exposed zones

Return JSON:
{
  "communicationHotspots": [
    {
      "locationId": "unique_id",
      "locationType": "home|work|transit|public|unknown",
      "coordinates": {"lat": number, "lng": number},
      "locationName": "descriptive name or address area",
      "communicationFrequency": 0-100,
      "typicalMessageTypes": ["call", "text", "email"],
      "peakCommunicationTimes": ["9am-10am", "6pm-8pm"],
      "averageDurationMinutes": number,
      "securityLevel": "high|medium|low",
      "anomaliesDetected": string[]
    }
  ],
  "spatialCommunicationPatterns": [
    {
      "patternName": "description",
      "locations": ["location names"],
      "timePattern": "when this occurs",
      "communicationType": "type of comms during this pattern",
      "reliability": 0.0-1.0,
      "exploitability": 0.0-1.0
    }
  ],
  "movementCommunicationCorrelation": {
    "transitCommunicationRate": 0.0-1.0,
    "stationaryCommunicationRate": 0.0-1.0,
    "preferredCommunicationEnvironments": string[],
    "avoidedCommunicationEnvironments": string[]
  },
  "locationBasedVulnerabilities": [
    {
      "location": "where",
      "vulnerabilityType": "predictable_presence|isolated_communication|routine_pattern",
      "severity": "low|medium|high|critical",
      "windowDescription": "when vulnerable",
      "approachRecommendation": "how to leverage"
    }
  ],
  "anomalyAlerts": [
    {
      "alertType": "unusual_location|pattern_break|covert_indicator",
      "description": "what was detected",
      "timestamp": "when",
      "location": "where",
      "significance": 0.0-1.0
    }
  ],
  "counterSurveillanceIndicators": [
    {
      "indicator": "what behavior",
      "frequency": "how often",
      "implications": "what it suggests"
    }
  ],
  "operationalWindows": [
    {
      "windowType": "approach|surveillance|intercept",
      "location": "where",
      "timing": "when",
      "successProbability": 0.0-1.0,
      "riskLevel": "low|medium|high"
    }
  ],
  "confidenceScore": 0.0-1.0,
  "dataQuality": "low|medium|high",
  "coverageGaps": string[]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "1") {
    return new Response(
      JSON.stringify({ ok: true, function: "geospatial-communication-fusion", timestamp: Date.now() }),
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

    // Gather geospatial and communication data
    const [
      movementRoutesResult,
      locationHistoryResult,
      communicationsResult,
      messagesResult,
      observationsResult,
    ] = await Promise.all([
      supabase.from("movement_routes").select("*").eq("profile_id", profileId)
        .order("recorded_at", { ascending: false }).limit(200),
      supabase.from("location_history").select("*").eq("profile_id", profileId)
        .order("recorded_at", { ascending: false }).limit(500),
      supabase.from("communications").select("*").eq("profile_id", profileId)
        .order("communication_date", { ascending: false }).limit(300),
      supabase.from("messages").select("*, conversations!inner(profile_id)")
        .eq("conversations.profile_id", profileId)
        .order("created_at", { ascending: false }).limit(200),
      supabase.from("contact_observations").select("*").eq("profile_id", profileId)
        .eq("category", "location").limit(50),
    ]);

    const contextData = {
      movementRoutes: {
        routes: movementRoutesResult.data || [],
        count: (movementRoutesResult.data || []).length,
      },
      locationHistory: {
        points: locationHistoryResult.data || [],
        count: (locationHistoryResult.data || []).length,
        uniqueLocations: new Set((locationHistoryResult.data || []).map((l: Record<string, unknown>) => 
          `${Math.round((l.latitude as number || 0) * 100)},${Math.round((l.longitude as number || 0) * 100)}`
        )).size,
      },
      communications: {
        records: communicationsResult.data || [],
        count: (communicationsResult.data || []).length,
      },
      messages: {
        records: messagesResult.data || [],
        count: (messagesResult.data || []).length,
      },
      locationObservations: observationsResult.data || [],
    };

    console.log(`[geospatial-communication-fusion] Processing for profile ${profileId}:`, {
      movementRoutes: contextData.movementRoutes.count,
      locationPoints: contextData.locationHistory.count,
      uniqueLocations: contextData.locationHistory.uniqueLocations,
      communications: contextData.communications.count,
    });

    const aiResponse = await callAI({
      model: selectModel("quality"),
      messages: [
        { role: "system", content: GEOSPATIAL_FUSION_PROMPT },
        { 
          role: "user", 
          content: `Perform geospatial-communication fusion analysis:\n\n${JSON.stringify(contextData, null, 2)}`
        }
      ],
      userId: userId,
      functionName: "geospatial-communication-fusion",
      profileId: profileId,
      temperature: 0.4,
    });

    const analysis = parseAIJson(aiResponse.content, {
      communicationHotspots: [],
      spatialCommunicationPatterns: [],
      movementCommunicationCorrelation: {},
      locationBasedVulnerabilities: [],
      anomalyAlerts: [],
      counterSurveillanceIndicators: [],
      operationalWindows: [],
      confidenceScore: 0,
      dataQuality: "low",
      coverageGaps: [],
    });

    // Store in ai_analyses
    await supabase.from("ai_analyses").upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: "geospatial_communication_fusion",
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
          locationPoints: contextData.locationHistory.count,
          uniqueLocations: contextData.locationHistory.uniqueLocations,
          communicationsAnalyzed: contextData.communications.count,
          hotspotsIdentified: analysis.communicationHotspots?.length || 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Geospatial-communication fusion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
