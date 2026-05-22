import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  activityType?: string;
  stepsSinceLast?: number;
  placeName?: string;
  placeType?: string;
}

interface SyncRequest {
  locations: LocationPoint[];
  profileId?: string;
  source?: string;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Infer activity type from speed
function inferActivityType(speed: number | undefined): string {
  if (speed === undefined || speed === null) return 'unknown';
  if (speed < 0.5) return 'stationary';
  if (speed < 2) return 'walking';
  if (speed < 8) return 'running';
  if (speed < 30) return 'cycling';
  return 'driving';
}

// Create location fingerprint for deduplication
function createLocationFingerprint(
  latitude: number,
  longitude: number,
  timestamp: string,
  precisionMeters: number = 50
): string {
  const latPrecision = precisionMeters / 111000;
  const lonPrecision = precisionMeters / (111000 * Math.cos(latitude * Math.PI / 180));
  
  const roundedLat = Math.round(latitude / latPrecision) * latPrecision;
  const roundedLon = Math.round(longitude / lonPrecision) * lonPrecision;
  
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  const timeKey = date.toISOString();
  
  return `${roundedLat.toFixed(6)}|${roundedLon.toFixed(6)}|${timeKey}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: SyncRequest = await req.json();
    const { locations, profileId, source = 'mobile' } = body;

    if (!locations || locations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, synced: 0, skipped: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${locations.length} location points`);

    // Get existing fingerprints to check for duplicates
    const fingerprints = locations.map(loc => 
      createLocationFingerprint(loc.latitude, loc.longitude, loc.timestamp)
    );

    // Check recent location history for duplicates
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentLocations } = await supabaseClient
      .from('location_history')
      .select('latitude, longitude, recorded_at')
      .eq('user_id', user.id)
      .gte('recorded_at', oneHourAgo);

    const existingFingerprints = new Set(
      (recentLocations || []).map(loc => 
        createLocationFingerprint(loc.latitude, loc.longitude, loc.recorded_at)
      )
    );

    // Filter out duplicates and prepare for insertion
    const newLocations: LocationPoint[] = [];
    let lastLocation: LocationPoint | null = null;

    for (const loc of locations) {
      const fp = createLocationFingerprint(loc.latitude, loc.longitude, loc.timestamp);
      
      // Skip if duplicate
      if (existingFingerprints.has(fp)) {
        continue;
      }

      // Skip if too close to last location (within 10 meters)
      if (lastLocation) {
        const distance = calculateDistance(
          lastLocation.latitude, lastLocation.longitude,
          loc.latitude, loc.longitude
        );
        if (distance < 10) {
          continue;
        }
      }

      newLocations.push(loc);
      lastLocation = loc;
      existingFingerprints.add(fp); // Prevent duplicates within batch
    }

    if (newLocations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: 0, 
          skipped: locations.length,
          message: 'All locations were duplicates' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new locations
    const insertData = newLocations.map(loc => ({
      user_id: user.id,
      profile_id: profileId || null,
      latitude: loc.latitude,
      longitude: loc.longitude,
      altitude: loc.altitude || null,
      accuracy: loc.accuracy || null,
      speed: loc.speed || null,
      heading: loc.heading || null,
      recorded_at: loc.timestamp,
      activity_type: loc.activityType || inferActivityType(loc.speed),
      steps_since_last: loc.stepsSinceLast || null,
      place_name: loc.placeName || null,
      place_type: loc.placeType || null,
      source,
    }));

    const { data: inserted, error: insertError } = await supabaseClient
      .from('location_history')
      .insert(insertData)
      .select('id, recorded_at');

    if (insertError) {
      throw insertError;
    }

    // Update sync cursor
    const lastInserted = inserted?.[inserted.length - 1];
    if (lastInserted) {
      await supabaseClient
        .from('sync_cursors')
        .upsert({
          user_id: user.id,
          source_type: 'location',
          source_identifier: source,
          profile_id: profileId || null,
          last_sync_at: new Date().toISOString(),
          last_item_timestamp: lastInserted.recorded_at,
          last_item_id: lastInserted.id,
          items_synced_total: newLocations.length,
          sync_status: 'completed',
        }, {
          onConflict: 'user_id,source_type,source_identifier',
        });
    }

    // Try to detect routes from the new locations
    if (newLocations.length >= 5) {
      // Group locations into potential routes
      let routeStartIdx = 0;
      
      for (let i = 1; i < newLocations.length; i++) {
        const timeDiff = new Date(newLocations[i].timestamp).getTime() - 
                        new Date(newLocations[i-1].timestamp).getTime();
        
        // If gap > 30 min, consider it a new route
        if (timeDiff > 30 * 60 * 1000 || i === newLocations.length - 1) {
          const routePoints = newLocations.slice(routeStartIdx, i + 1);
          
          if (routePoints.length >= 5) {
            // Calculate route distance
            let totalDistance = 0;
            for (let j = 1; j < routePoints.length; j++) {
              totalDistance += calculateDistance(
                routePoints[j-1].latitude, routePoints[j-1].longitude,
                routePoints[j].latitude, routePoints[j].longitude
              );
            }

            // Calculate duration
            const startTime = new Date(routePoints[0].timestamp);
            const endTime = new Date(routePoints[routePoints.length - 1].timestamp);
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (60 * 1000);

            // Determine transport mode from average speed
            const avgSpeed = totalDistance / (durationMinutes * 60); // m/s
            let transportMode = 'unknown';
            if (avgSpeed < 2) transportMode = 'walking';
            else if (avgSpeed < 8) transportMode = 'running';
            else if (avgSpeed < 15) transportMode = 'cycling';
            else transportMode = 'driving';

            // Get start and end location IDs
            const startLocId = inserted?.[routeStartIdx]?.id;
            const endLocId = inserted?.[Math.min(i, inserted.length - 1)]?.id;

            if (startLocId && endLocId) {
              await supabaseClient
                .from('movement_routes')
                .insert({
                  user_id: user.id,
                  profile_id: profileId || null,
                  start_location_id: startLocId,
                  end_location_id: endLocId,
                  distance_meters: totalDistance,
                  duration_minutes: durationMinutes,
                  transport_mode: transportMode,
                  start_time: routePoints[0].timestamp,
                  end_time: routePoints[routePoints.length - 1].timestamp,
                  waypoints: routePoints.map(p => ({
                    lat: p.latitude,
                    lon: p.longitude,
                    time: p.timestamp,
                    activity: p.activityType,
                  })),
                });
            }
          }

          routeStartIdx = i;
        }
      }
    }

    console.log(`Synced ${newLocations.length} locations, skipped ${locations.length - newLocations.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: newLocations.length,
        skipped: locations.length - newLocations.length,
        routesDetected: 0, // Would be updated with actual count
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Location sync error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
