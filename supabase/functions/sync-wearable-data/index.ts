import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthDataPoint {
  timestamp: string;
  heartRate?: number;
  heartRateVariability?: number;
  stressLevel?: number;
  steps?: number;
  calories?: number;
  sleepStage?: string;
  bloodOxygen?: number;
  skinTemperature?: number;
}

interface LocationDataPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  placeName?: string;
}

interface WearableSyncPayload {
  deviceType: string;
  deviceId: string;
  healthData?: HealthDataPoint[];
  locationData?: LocationDataPoint[];
  interactionProfileId?: string;
  interactionDuration?: number;
  syncType: 'health' | 'location' | 'interaction' | 'all';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: WearableSyncPayload = await req.json();
    const { deviceType, deviceId, healthData, locationData, interactionProfileId, interactionDuration, syncType } = payload;

    console.log(`[sync-wearable-data] Syncing ${syncType} from ${deviceType} for user ${user.id}`);

    const results = {
      healthPointsSynced: 0,
      locationPointsSynced: 0,
      interactionCreated: false,
    };

    // Process health data
    if ((syncType === 'health' || syncType === 'all') && healthData && healthData.length > 0) {
      // Store raw health data for analysis
      const healthInserts = healthData.map(point => ({
        user_id: user.id,
        device_source: deviceType,
        interaction_date: point.timestamp,
        avg_heart_rate: point.heartRate,
        heart_rate_variability: point.heartRateVariability,
        stress_level: point.stressLevel,
        steps_during: point.steps,
        calories_burned: point.calories,
        raw_data: point,
      }));

      // Batch insert health data
      for (let i = 0; i < healthInserts.length; i += 100) {
        const batch = healthInserts.slice(i, i + 100);
        const { error } = await supabase.from('interaction_biometrics').insert(batch);
        if (!error) {
          results.healthPointsSynced += batch.length;
        }
      }
    }

    // Process location data
    if ((syncType === 'location' || syncType === 'all') && locationData && locationData.length > 0) {
      // For location, we typically update existing biometrics or create new ones
      for (const point of locationData) {
        // Find any biometric entries within 5 minutes of this location
        const timeWindow = new Date(point.timestamp);
        const windowStart = new Date(timeWindow.getTime() - 5 * 60 * 1000).toISOString();
        const windowEnd = new Date(timeWindow.getTime() + 5 * 60 * 1000).toISOString();

        const { data: existing } = await supabase
          .from('interaction_biometrics')
          .select('id')
          .eq('user_id', user.id)
          .gte('interaction_date', windowStart)
          .lte('interaction_date', windowEnd)
          .is('location_lat', null)
          .limit(1)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('interaction_biometrics')
            .update({
              location_lat: point.latitude,
              location_lng: point.longitude,
              location_name: point.placeName,
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('interaction_biometrics').insert({
            user_id: user.id,
            device_source: deviceType,
            interaction_date: point.timestamp,
            location_lat: point.latitude,
            location_lng: point.longitude,
            location_name: point.placeName,
            raw_data: point,
          });
        }
        results.locationPointsSynced++;
      }
    }

    // Process interaction with specific contact
    if ((syncType === 'interaction' || syncType === 'all') && interactionProfileId) {
      // Calculate aggregate biometrics for the interaction
      const latestHealth = healthData?.[healthData.length - 1];
      const latestLocation = locationData?.[locationData.length - 1];
      
      let avgHeartRate: number | undefined;
      let maxHeartRate: number | undefined;
      let minHeartRate: number | undefined;
      let avgStress: number | undefined;
      
      if (healthData && healthData.length > 0) {
        const heartRates = healthData.filter(h => h.heartRate).map(h => h.heartRate!);
        if (heartRates.length > 0) {
          avgHeartRate = Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length);
          maxHeartRate = Math.max(...heartRates);
          minHeartRate = Math.min(...heartRates);
        }
        
        const stressLevels = healthData.filter(h => h.stressLevel).map(h => h.stressLevel!);
        if (stressLevels.length > 0) {
          avgStress = stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length;
        }
      }

      const totalSteps = healthData?.reduce((sum, h) => sum + (h.steps || 0), 0);
      const totalCalories = healthData?.reduce((sum, h) => sum + (h.calories || 0), 0);

      // Create interaction biometric record
      const { error } = await supabase.from('interaction_biometrics').insert({
        user_id: user.id,
        profile_id: interactionProfileId,
        device_source: deviceType,
        interaction_date: new Date().toISOString(),
        duration_minutes: interactionDuration,
        avg_heart_rate: avgHeartRate,
        max_heart_rate: maxHeartRate,
        min_heart_rate: minHeartRate,
        heart_rate_variability: latestHealth?.heartRateVariability,
        stress_level: avgStress,
        steps_during: totalSteps,
        calories_burned: totalCalories,
        location_lat: latestLocation?.latitude,
        location_lng: latestLocation?.longitude,
        location_name: latestLocation?.placeName,
        raw_data: {
          healthDataPoints: healthData?.length || 0,
          locationDataPoints: locationData?.length || 0,
          deviceId,
        },
      });

      results.interactionCreated = !error;
    }

    // Log the sync
    await supabase.from('device_sync_log').insert({
      user_id: user.id,
      device_id: deviceId,
      device_type: deviceType,
      sync_type: syncType,
      data_count: (healthData?.length || 0) + (locationData?.length || 0),
      metadata: {
        healthPointsSynced: results.healthPointsSynced,
        locationPointsSynced: results.locationPointsSynced,
        interactionCreated: results.interactionCreated,
        interactionProfileId,
      },
    });

    console.log(`[sync-wearable-data] Sync complete:`, results);

    return new Response(JSON.stringify({
      success: true,
      ...results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sync-wearable-data] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to sync wearable data' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
