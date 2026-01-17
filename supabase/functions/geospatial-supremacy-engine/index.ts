import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, analysisType = 'comprehensive', targetProfileIds, coordinates } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch all geospatial data
    const [
      locationsRes,
      residencesRes,
      propertiesRes,
      interactionsRes,
      missionRes
    ] = await Promise.all([
      supabase.from('contact_locations').select('*').eq('user_id', userId),
      supabase.from('contact_residences').select('*').eq('user_id', userId),
      supabase.from('contact_properties').select('*').eq('user_id', userId),
      supabase.from('interactions').select('id, profile_id, interaction_date, location_context').eq('user_id', userId).not('location_context', 'is', null).limit(200),
      supabase.from('aerial_missions').select('*, aerial_captures(*)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    ]);

    // Calculate geographic clusters and movement patterns
    const allLocations = [
      ...(locationsRes.data || []).map(l => ({ ...l, source: 'contact_location' })),
      ...(residencesRes.data || []).map(r => ({ ...r, source: 'residence' })),
      ...(propertiesRes.data || []).map(p => ({ ...p, source: 'property' })),
    ].filter(l => l.latitude && l.longitude);

    const GEOSPATIAL_PROMPT = `You are a Geospatial Intelligence Supremacy analyst combining satellite imagery analysis, terrain intelligence, and location behavior patterns.

GEOSPATIAL INTELLIGENCE FRAMEWORK:
1. GEOINT: Geographic Intelligence from imagery and mapping
2. MASINT: Measurement and Signature Intelligence
3. TERRAIN ANALYSIS: Strategic assessment of physical geography
4. PATTERN-OF-LIFE: Movement and location behavior analysis
5. NETWORK GEOGRAPHY: Spatial relationships between contacts
6. PREDICTIVE GEOLOCATION: Future position prediction

ANALYSIS TYPE: ${analysisType}
${coordinates ? `TARGET COORDINATES: ${JSON.stringify(coordinates)}` : ''}

LOCATION DATA:
All Known Locations: ${JSON.stringify(allLocations.slice(0, 50), null, 2)}

RESIDENCE HISTORY:
${JSON.stringify(residencesRes.data?.slice(0, 20), null, 2)}

PROPERTY INTELLIGENCE:
${JSON.stringify(propertiesRes.data?.slice(0, 20), null, 2)}

LOCATION-TAGGED INTERACTIONS:
${JSON.stringify(interactionsRes.data?.slice(0, 50), null, 2)}

AERIAL RECONNAISSANCE:
${JSON.stringify(missionRes.data?.slice(0, 10), null, 2)}

Perform comprehensive geospatial analysis. Return JSON:
{
  "geographicClusters": [
    {
      "clusterName": "descriptive name (home zone, work zone, etc)",
      "centerLatitude": number,
      "centerLongitude": number,
      "radiusMeters": number,
      "memberProfiles": ["profile IDs with presence here"],
      "activityType": "residential|commercial|recreational|transit|covert",
      "timePatterns": {
        "peakHours": ["hour ranges"],
        "peakDays": ["day patterns"]
      },
      "strategicValue": 0.0-1.0
    }
  ],
  "movementPatterns": [
    {
      "profileId": "profile ID",
      "patternName": "commute|routine|irregular|evasive",
      "corridors": [
        {
          "from": {"lat": number, "lng": number, "name": "place"},
          "to": {"lat": number, "lng": number, "name": "place"},
          "frequency": "daily|weekly|occasional",
          "typicalDuration": "minutes"
        }
      ],
      "predictability": 0.0-1.0,
      "anomalyIndicators": ["unusual patterns detected"]
    }
  ],
  "coLocationAnalysis": [
    {
      "profiles": ["profile IDs found together"],
      "location": {"lat": number, "lng": number, "name": "place"},
      "frequency": "how often",
      "relationshipImplication": "what this suggests",
      "surveillanceOpportunity": 0.0-1.0
    }
  ],
  "terrainIntelligence": [
    {
      "location": {"lat": number, "lng": number},
      "terrainType": "urban|suburban|rural|industrial|maritime",
      "coverAndConcealment": 0.0-1.0,
      "accessRoutes": ["approach methods"],
      "surveillancePositions": ["optimal observation points"],
      "exitRoutes": ["escape paths"],
      "communicationsCoverage": 0.0-1.0
    }
  ],
  "predictiveGeolocation": [
    {
      "profileId": "profile ID",
      "predictedLocation": {"lat": number, "lng": number},
      "predictionTime": "ISO datetime",
      "confidence": 0.0-1.0,
      "basisForPrediction": "why we expect them here"
    }
  ],
  "googleEarthIntegration": {
    "kmlExportReady": true,
    "layerRecommendations": ["suggested overlay layers"],
    "imageryGaps": ["areas needing updated imagery"],
    "3dTerrainInsights": ["what 3D view reveals"]
  },
  "interceptOpportunities": [
    {
      "location": {"lat": number, "lng": number, "name": "place"},
      "targetProfiles": ["who will be there"],
      "windowStart": "ISO datetime",
      "windowEnd": "ISO datetime",
      "approachMethod": "how to intercept",
      "successProbability": 0.0-1.0
    }
  ],
  "counterSurveillanceAssessment": {
    "vulnerableLocations": ["places where target could spot surveillance"],
    "blindSpots": ["areas with limited visibility"],
    "optimalObservationPoints": ["best places to watch from"],
    "technicalCollection": ["SIGINT/ELINT opportunities"]
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: GEOSPATIAL_PROMPT },
          { role: "user", content: `Perform ${analysisType} geospatial intelligence analysis` }
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      analysis = { raw: content };
    }

    // Generate KML for Google Earth export
    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>Intelligence Network Geospatial Data</name>
  <description>Exported from Geospatial Supremacy Engine</description>`;

    // Add clusters as polygons/circles
    if (analysis.geographicClusters) {
      kmlContent += `\n  <Folder><name>Geographic Clusters</name>`;
      for (const cluster of analysis.geographicClusters) {
        kmlContent += `
    <Placemark>
      <name>${cluster.clusterName}</name>
      <description>Activity: ${cluster.activityType}, Strategic Value: ${cluster.strategicValue}</description>
      <Point><coordinates>${cluster.centerLongitude},${cluster.centerLatitude},0</coordinates></Point>
    </Placemark>`;
      }
      kmlContent += `\n  </Folder>`;
    }

    // Add movement corridors as lines
    if (analysis.movementPatterns) {
      kmlContent += `\n  <Folder><name>Movement Corridors</name>`;
      for (const pattern of analysis.movementPatterns) {
        for (const corridor of pattern.corridors || []) {
          kmlContent += `
    <Placemark>
      <name>${pattern.profileId} - ${corridor.from?.name} to ${corridor.to?.name}</name>
      <LineString>
        <coordinates>
          ${corridor.from?.lng},${corridor.from?.lat},0
          ${corridor.to?.lng},${corridor.to?.lat},0
        </coordinates>
      </LineString>
    </Placemark>`;
        }
      }
      kmlContent += `\n  </Folder>`;
    }

    kmlContent += `\n</Document></kml>`;

    // Store analysis results
    await supabase.from('ai_analyses').insert({
      user_id: userId,
      profile_id: targetProfileIds?.[0] || null,
      analysis_type: 'geospatial_supremacy',
      result: {
        analysis,
        kmlExport: kmlContent,
        locationCount: allLocations.length,
        clustersDetected: analysis.geographicClusters?.length || 0,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      analysisType,
      geospatialAnalysis: analysis,
      kmlExport: kmlContent,
      clustersDetected: analysis.geographicClusters?.length || 0,
      movementPatternsFound: analysis.movementPatterns?.length || 0,
      interceptOpportunities: analysis.interceptOpportunities?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Geospatial supremacy engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
