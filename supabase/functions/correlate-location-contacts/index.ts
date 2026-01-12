import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

interface ContactGeofence {
  profileId: string;
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
}

interface ProximityResult {
  profileId: string;
  name: string;
  distance: number;
  isWithinGeofence: boolean;
  lastSeen?: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userLocation, contactGeofences, maxDistance = 5000 } = await req.json() as {
      userLocation: LocationData;
      contactGeofences: ContactGeofence[];
      maxDistance?: number;
    };

    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return new Response(
        JSON.stringify({ error: 'Invalid user location data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contactGeofences || !Array.isArray(contactGeofences)) {
      return new Response(
        JSON.stringify({ error: 'Invalid contact geofences data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const proximityResults: ProximityResult[] = [];
    const alerts: { type: string; message: string; profileId: string }[] = [];

    for (const geofence of contactGeofences) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        geofence.latitude,
        geofence.longitude
      );

      const isWithinGeofence = distance <= geofence.radius;
      
      if (distance <= maxDistance) {
        proximityResults.push({
          profileId: geofence.profileId,
          name: geofence.name,
          distance: Math.round(distance),
          isWithinGeofence,
          lastSeen: new Date().toISOString()
        });

        if (isWithinGeofence) {
          alerts.push({
            type: 'geofence_entered',
            message: `You are within ${geofence.name}'s location (${Math.round(distance)}m away)`,
            profileId: geofence.profileId
          });
        }
      }
    }

    // Sort by distance
    proximityResults.sort((a, b) => a.distance - b.distance);

    const insights = {
      nearbyCount: proximityResults.length,
      withinGeofenceCount: proximityResults.filter(r => r.isWithinGeofence).length,
      closestContact: proximityResults[0] || null,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({
        success: true,
        proximityResults,
        alerts,
        insights
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in correlate-location-contacts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
