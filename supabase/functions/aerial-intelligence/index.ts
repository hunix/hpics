import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WaypointAction {
  type: 'photo' | 'video_start' | 'video_stop' | 'hover' | 'rotate' | 'gimbal';
  params?: Record<string, unknown>;
}

interface Waypoint {
  latitude: number;
  longitude: number;
  altitude_meters: number;
  speed_mps?: number;
  heading_degrees?: number;
  gimbal_pitch_degrees?: number;
  actions?: WaypointAction[];
  hover_time_seconds?: number;
}

interface MissionPlan {
  name: string;
  waypoints: Waypoint[];
  settings: {
    max_altitude_meters: number;
    max_speed_mps: number;
    return_to_home: boolean;
    obstacle_avoidance: boolean;
    camera_mode: 'photo' | 'video' | 'timelapse';
    photo_interval_seconds?: number;
    video_resolution?: '4k' | '2.7k' | '1080p';
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'create_mission': {
        const { drone_device_id, mission_id, plan } = params as {
          drone_device_id: string;
          mission_id?: string;
          plan: MissionPlan;
        };

        // Validate waypoints
        if (!plan.waypoints || plan.waypoints.length === 0) {
          throw new Error('Mission must have at least one waypoint');
        }

        // Calculate flight path geometry
        const flightPath = plan.waypoints.map(wp => ({
          lat: wp.latitude,
          lng: wp.longitude
        }));

        // Estimate mission duration
        let totalDistance = 0;
        for (let i = 1; i < plan.waypoints.length; i++) {
          const prev = plan.waypoints[i - 1];
          const curr = plan.waypoints[i];
          totalDistance += calculateDistance(
            prev.latitude, prev.longitude,
            curr.latitude, curr.longitude
          );
        }

        const avgSpeed = plan.settings.max_speed_mps * 0.7; // Assume 70% of max
        const estimatedDuration = Math.ceil(totalDistance / avgSpeed);

        const { data: mission, error: missionError } = await supabase
          .from('aerial_missions')
          .insert({
            user_id: user.id,
            drone_device_id,
            mission_id,
            waypoints: plan.waypoints,
            flight_path: flightPath,
            altitude_meters: plan.settings.max_altitude_meters,
            speed_mps: plan.settings.max_speed_mps,
            flight_mode: plan.settings.camera_mode,
            camera_settings: {
              mode: plan.settings.camera_mode,
              resolution: plan.settings.video_resolution,
              photo_interval: plan.settings.photo_interval_seconds
            },
            total_distance_meters: totalDistance,
            status: 'planned'
          })
          .select()
          .single();

        if (missionError) throw missionError;

        return new Response(JSON.stringify({
          success: true,
          mission,
          estimated_duration_seconds: estimatedDuration,
          total_distance_meters: totalDistance
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'start_mission': {
        const { aerial_mission_id } = params;

        const { data: mission, error: updateError } = await supabase
          .from('aerial_missions')
          .update({
            status: 'in_flight',
            started_at: new Date().toISOString()
          })
          .eq('id', aerial_mission_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Log mission event
        await supabase.from('mission_events').insert({
          mission_id: mission.mission_id,
          event_type: 'aerial_mission_started',
          event_data: { aerial_mission_id }
        });

        return new Response(JSON.stringify({
          success: true,
          mission
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'complete_mission': {
        const { aerial_mission_id, telemetry_log } = params;

        const { data: mission, error: updateError } = await supabase
          .from('aerial_missions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            telemetry_log,
            flight_duration_seconds: telemetry_log?.duration_seconds
          })
          .eq('id', aerial_mission_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          success: true,
          mission
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'upload_capture': {
        const { aerial_mission_id, capture } = params as {
          aerial_mission_id: string;
          capture: {
            capture_type: 'photo' | 'video' | 'thermal';
            media_url: string;
            thumbnail_url?: string;
            location: { lat: number; lng: number };
            altitude_meters: number;
            heading_degrees: number;
            gimbal_pitch_degrees: number;
            captured_at: string;
          };
        };

        // Store the capture
        const { data: captureData, error: captureError } = await supabase
          .from('aerial_captures')
          .insert({
            aerial_mission_id,
            user_id: user.id,
            capture_type: capture.capture_type,
            media_url: capture.media_url,
            thumbnail_url: capture.thumbnail_url,
            location: capture.location,
            altitude_meters: capture.altitude_meters,
            heading_degrees: capture.heading_degrees,
            gimbal_pitch_degrees: capture.gimbal_pitch_degrees,
            captured_at: capture.captured_at
          })
          .select()
          .single();

        if (captureError) throw captureError;

        return new Response(JSON.stringify({
          success: true,
          capture: captureData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'analyze_capture': {
        const { capture_id, analysis_types } = params as {
          capture_id: string;
          analysis_types: ('crowd' | 'vehicle' | 'structure' | 'perimeter')[];
        };

        // Get the capture
        const { data: capture, error: fetchError } = await supabase
          .from('aerial_captures')
          .select('*')
          .eq('id', capture_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !capture) throw new Error('Capture not found');

        // Build analysis prompt
        const analysisPrompts: Record<string, string> = {
          crowd: 'Analyze this aerial image for crowd density and movement patterns. Estimate total count, identify gathering points, and note any unusual clustering.',
          vehicle: 'Identify all vehicles in this aerial image. Note vehicle types, colors, positions, and any movement patterns. Flag any suspicious or out-of-place vehicles.',
          structure: 'Analyze structures and buildings in this aerial image. Identify entry/exit points, security features, potential blind spots, and tactical considerations.',
          perimeter: 'Analyze the perimeter and boundaries visible in this image. Identify fence lines, barriers, patrol routes, and potential breach points.'
        };

        const prompt = analysis_types
          .map(type => analysisPrompts[type])
          .join('\n\n');

        // Use Lovable AI for analysis
        const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro',
            messages: [
              {
                role: 'system',
                content: 'You are an advanced aerial reconnaissance analyst. Provide detailed, actionable intelligence from aerial imagery.'
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: capture.media_url } }
                ]
              }
            ],
            max_tokens: 2000
          })
        });

        const aiResult = await aiResponse.json();
        const analysis = aiResult.choices?.[0]?.message?.content;

        // Parse analysis into structured format
        const detectedObjects = {
          analysis_types,
          raw_analysis: analysis,
          timestamp: new Date().toISOString()
        };

        // Update capture with analysis
        const { data: updatedCapture, error: updateError } = await supabase
          .from('aerial_captures')
          .update({
            detected_objects: detectedObjects,
            analysis: { raw: analysis, types: analysis_types }
          })
          .eq('id', capture_id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          success: true,
          capture: updatedCapture,
          analysis
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_missions': {
        const { status, limit = 20 } = params;

        let query = supabase
          .from('aerial_missions')
          .select(`
            *,
            drone:hardware_devices(device_name, device_type),
            captures:aerial_captures(count)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (status) {
          query = query.eq('status', status);
        }

        const { data: missions, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          missions
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_captures': {
        const { aerial_mission_id, capture_type, limit = 50 } = params;

        let query = supabase
          .from('aerial_captures')
          .select('*')
          .eq('user_id', user.id)
          .order('captured_at', { ascending: false })
          .limit(limit);

        if (aerial_mission_id) {
          query = query.eq('aerial_mission_id', aerial_mission_id);
        }
        if (capture_type) {
          query = query.eq('capture_type', capture_type);
        }

        const { data: captures, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          captures
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    console.error('Aerial intelligence error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
