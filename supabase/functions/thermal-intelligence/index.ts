import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-device-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ThermalSignature {
  type: 'person' | 'vehicle' | 'electronic_device' | 'animal' | 'heat_source' | 'unknown';
  temp_celsius: number;
  bounding_box: { x: number; y: number; width: number; height: number };
  confidence: number;
}

interface ThermalCapture {
  device_id?: string;
  mission_id?: string;
  raw_thermal_base64?: string;
  detected_signatures: ThermalSignature[];
  ambient_temperature_celsius?: number;
  min_temperature_celsius?: number;
  max_temperature_celsius?: number;
  location?: { lat: number; lng: number };
  location_name?: string;
}

interface ThermalAnalysis {
  occupancy_count: number;
  heat_anomalies: Array<{
    type: string;
    location: { x: number; y: number };
    temperature_celsius: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  analysis: {
    room_assessment: string;
    potential_threats: string[];
    electronic_devices_detected: number;
    hidden_spaces_indicated: boolean;
    recent_activity_indicators: string[];
    recommendations: string[];
  };
  confidence: number;
}

// Temperature thresholds for detection
const TEMP_THRESHOLDS = {
  human_body_min: 35.5,
  human_body_max: 38.0,
  vehicle_engine_min: 40.0,
  vehicle_engine_max: 120.0,
  electronic_standby_min: 25.0,
  electronic_active_min: 35.0,
  electronic_max: 80.0,
  anomaly_threshold: 5.0, // Degrees above ambient
};

function classifyThermalSignature(temp: number, size: { width: number; height: number }, ambient: number): string {
  const tempAboveAmbient = temp - ambient;
  const area = size.width * size.height;

  // Human detection
  if (temp >= TEMP_THRESHOLDS.human_body_min && temp <= TEMP_THRESHOLDS.human_body_max) {
    if (area > 5000) return 'person';
  }

  // Vehicle engine
  if (temp >= TEMP_THRESHOLDS.vehicle_engine_min && temp <= TEMP_THRESHOLDS.vehicle_engine_max) {
    if (area > 10000) return 'vehicle';
  }

  // Electronic device
  if (temp >= TEMP_THRESHOLDS.electronic_standby_min && temp <= TEMP_THRESHOLDS.electronic_max) {
    if (area < 2000 && tempAboveAmbient > 5) return 'electronic_device';
  }

  // General heat source
  if (tempAboveAmbient > TEMP_THRESHOLDS.anomaly_threshold) {
    return 'heat_source';
  }

  return 'unknown';
}

function analyzeForHiddenDevices(signatures: ThermalSignature[], ambient: number): Array<{
  type: string;
  location: { x: number; y: number };
  temperature_celsius: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}> {
  const anomalies: Array<{
    type: string;
    location: { x: number; y: number };
    temperature_celsius: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }> = [];

  for (const sig of signatures) {
    const tempDiff = sig.temp_celsius - ambient;

    // Small, warm spots could be hidden electronics
    if (sig.type === 'electronic_device' || (sig.type === 'heat_source' && sig.bounding_box.width * sig.bounding_box.height < 1000)) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      let description = '';

      if (tempDiff > 15) {
        severity = 'high';
        description = 'Significant heat source - possible active electronic device or surveillance equipment';
      } else if (tempDiff > 8) {
        severity = 'medium';
        description = 'Moderate heat source - could be hidden electronic device';
      } else {
        description = 'Minor heat anomaly - monitor for changes';
      }

      anomalies.push({
        type: 'hidden_device',
        location: { x: sig.bounding_box.x, y: sig.bounding_box.y },
        temperature_celsius: sig.temp_celsius,
        severity,
        description,
      });
    }

    // Wall anomalies could indicate hidden spaces
    if (sig.type === 'heat_source' && tempDiff < 0) {
      anomalies.push({
        type: 'cold_spot',
        location: { x: sig.bounding_box.x, y: sig.bounding_box.y },
        temperature_celsius: sig.temp_celsius,
        severity: 'medium',
        description: 'Cold spot detected - could indicate hidden void, ductwork, or concealed space',
      });
    }
  }

  return anomalies;
}

function analyzeThermalCapture(capture: ThermalCapture): ThermalAnalysis {
  const ambient = capture.ambient_temperature_celsius || 22;
  const signatures = capture.detected_signatures || [];

  // Count occupants
  const personCount = signatures.filter(s => s.type === 'person').length;
  const vehicleCount = signatures.filter(s => s.type === 'vehicle').length;
  const electronicCount = signatures.filter(s => s.type === 'electronic_device').length;

  // Analyze for anomalies
  const anomalies = analyzeForHiddenDevices(signatures, ambient);

  // Generate room assessment
  let roomAssessment = '';
  if (personCount === 0) {
    roomAssessment = 'No human occupancy detected';
  } else if (personCount === 1) {
    roomAssessment = 'Single occupant detected';
  } else {
    roomAssessment = `${personCount} occupants detected`;
  }

  // Identify potential threats
  const threats: string[] = [];
  if (anomalies.filter(a => a.severity === 'high').length > 0) {
    threats.push('High-risk heat anomalies detected - possible surveillance devices');
  }
  if (electronicCount > 3) {
    threats.push('Unusually high number of electronic heat sources');
  }
  if (anomalies.filter(a => a.type === 'cold_spot').length > 0) {
    threats.push('Cold spots detected - possible hidden spaces or voids');
  }

  // Recent activity indicators
  const activityIndicators: string[] = [];
  if (vehicleCount > 0) {
    const hotVehicles = signatures.filter(s => s.type === 'vehicle' && s.temp_celsius > 60);
    if (hotVehicles.length > 0) {
      activityIndicators.push('Recently operated vehicle(s) detected');
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (threats.length > 0) {
    recommendations.push('Physical inspection of flagged areas recommended');
    recommendations.push('Cross-reference with RF sweep for electronic devices');
  }
  if (personCount > 0) {
    recommendations.push('Continue thermal monitoring for movement patterns');
  }
  if (anomalies.length > 0) {
    recommendations.push('Document anomaly locations for follow-up inspection');
  }

  return {
    occupancy_count: personCount,
    heat_anomalies: anomalies,
    analysis: {
      room_assessment: roomAssessment,
      potential_threats: threats,
      electronic_devices_detected: electronicCount,
      hidden_spaces_indicated: anomalies.some(a => a.type === 'cold_spot'),
      recent_activity_indicators: activityIndicators,
      recommendations: recommendations.length > 0 ? recommendations : ['No immediate action required'],
    },
    confidence: signatures.length > 0 ? 0.85 : 0.4,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...data } = await req.json();

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'capture_thermal': {
        const capture = data.capture as ThermalCapture;
        const analysis = analyzeThermalCapture(capture);

        // Store the capture with analysis
        const { data: stored, error: storeError } = await supabase
          .from('thermal_captures')
          .insert({
            user_id: user.id,
            device_id: capture.device_id || null,
            mission_id: capture.mission_id || null,
            detected_signatures: capture.detected_signatures,
            ambient_temperature_celsius: capture.ambient_temperature_celsius || null,
            min_temperature_celsius: capture.min_temperature_celsius || null,
            max_temperature_celsius: capture.max_temperature_celsius || null,
            occupancy_count: analysis.occupancy_count,
            heat_anomalies: analysis.heat_anomalies,
            analysis: analysis.analysis,
            location: capture.location || null,
            location_name: capture.location_name || null,
            captured_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (storeError) {
          throw storeError;
        }

        // If anomalies detected, create mission event
        if (analysis.heat_anomalies.length > 0 && capture.mission_id) {
          const severity = analysis.heat_anomalies.some(a => a.severity === 'high') ? 'critical' : 'warning';
          
          await supabase.from('mission_events').insert({
            user_id: user.id,
            mission_id: capture.mission_id,
            device_id: capture.device_id || null,
            event_type: 'detection',
            event_data: {
              capture_id: stored.id,
              type: 'thermal_anomaly',
              anomaly_count: analysis.heat_anomalies.length,
              occupancy_count: analysis.occupancy_count,
            },
            severity,
            location: capture.location || null,
          });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            capture_id: stored.id,
            analysis,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'analyze_thermal': {
        const capture = data.capture as ThermalCapture;
        const analysis = analyzeThermalCapture(capture);

        return new Response(
          JSON.stringify({ analysis }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_captures': {
        const { mission_id, anomalies_only, limit = 50 } = data;

        let query = supabase
          .from('thermal_captures')
          .select('*')
          .eq('user_id', user.id)
          .order('captured_at', { ascending: false })
          .limit(limit);

        if (mission_id) {
          query = query.eq('mission_id', mission_id);
        }

        const { data: captures, error } = await query;

        if (error) throw error;

        let filteredCaptures = captures;
        if (anomalies_only) {
          filteredCaptures = captures?.filter((c: Record<string, unknown>) => {
            const anomalies = c.heat_anomalies as Array<unknown>;
            return anomalies && anomalies.length > 0;
          });
        }

        return new Response(
          JSON.stringify({ captures: filteredCaptures }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_occupancy_timeline': {
        const { location_name, hours = 24 } = data;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        let query = supabase
          .from('thermal_captures')
          .select('captured_at, occupancy_count, location_name')
          .eq('user_id', user.id)
          .gte('captured_at', since)
          .order('captured_at', { ascending: true });

        if (location_name) {
          query = query.eq('location_name', location_name);
        }

        const { data: captures, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            timeline: captures?.map(c => ({
              timestamp: c.captured_at,
              occupancy: c.occupancy_count,
              location: c.location_name,
            })) || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Thermal Intelligence error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
