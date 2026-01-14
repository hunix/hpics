import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-device-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface DeviceRegistration {
  device_id: string;
  device_type: string;
  device_name?: string;
  device_model?: string;
  firmware_version?: string;
  capabilities?: Record<string, unknown>;
  location?: { lat: number; lng: number; accuracy?: number };
}

interface TelemetryData {
  device_id: string;
  telemetry_type: string;
  data: Record<string, unknown>;
  location?: { lat: number; lng: number };
  priority?: string;
}

interface CommandResponse {
  command_id: string;
  status: 'acknowledged' | 'completed' | 'failed';
  response?: Record<string, unknown>;
  error_message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    // API key authentication for hardware devices
    const deviceId = req.headers.get('x-device-id');
    const deviceType = req.headers.get('x-device-type');

    switch (path) {
      case 'register': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: DeviceRegistration = await req.json();
        
        const { data, error } = await supabase
          .from('hardware_devices')
          .upsert({
            user_id: userId,
            device_id: body.device_id,
            device_type: body.device_type,
            device_name: body.device_name,
            device_model: body.device_model,
            firmware_version: body.firmware_version,
            capabilities: body.capabilities || {},
            location: body.location,
            is_online: true,
            last_seen_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,device_id',
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, device: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'telemetry': {
        const body: TelemetryData = await req.json();
        
        // Find the device
        const { data: device } = await supabase
          .from('hardware_devices')
          .select('id, user_id')
          .eq('device_id', body.device_id)
          .single();

        if (!device) {
          return new Response(
            JSON.stringify({ error: 'Device not registered' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Insert telemetry
        const { error: telemetryError } = await supabase
          .from('hardware_telemetry')
          .insert({
            device_id: device.id,
            user_id: device.user_id,
            telemetry_type: body.telemetry_type,
            data: body.data,
            location: body.location,
            priority: body.priority || 'normal',
          });

        if (telemetryError) throw telemetryError;

        // Update device last_seen
        await supabase
          .from('hardware_devices')
          .update({ 
            last_seen_at: new Date().toISOString(),
            is_online: true,
            location: body.location,
          })
          .eq('id', device.id);

        // Check for pending commands
        const { data: commands } = await supabase
          .from('hardware_commands')
          .select('*')
          .eq('device_id', device.id)
          .eq('status', 'pending')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(5);

        // Mark commands as sent
        if (commands && commands.length > 0) {
          await supabase
            .from('hardware_commands')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .in('id', commands.map(c => c.id));
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            commands: commands || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'command-response': {
        const body: CommandResponse = await req.json();
        
        const updateData: Record<string, unknown> = {
          status: body.status,
          response: body.response,
        };

        if (body.status === 'acknowledged') {
          updateData.acknowledged_at = new Date().toISOString();
        } else if (body.status === 'completed' || body.status === 'failed') {
          updateData.completed_at = new Date().toISOString();
          if (body.error_message) {
            updateData.error_message = body.error_message;
          }
        }

        const { error } = await supabase
          .from('hardware_commands')
          .update(updateData)
          .eq('id', body.command_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'heartbeat': {
        const body = await req.json();
        
        const { data: device } = await supabase
          .from('hardware_devices')
          .select('id')
          .eq('device_id', body.device_id)
          .single();

        if (device) {
          await supabase
            .from('hardware_devices')
            .update({
              is_online: true,
              last_seen_at: new Date().toISOString(),
              battery_level: body.battery_level,
              signal_strength: body.signal_strength,
            })
            .eq('id', device.id);
        }

        return new Response(
          JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'status': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: devices } = await supabase
          .from('hardware_devices')
          .select('*')
          .eq('user_id', userId)
          .order('last_seen_at', { ascending: false });

        const { data: activeMissions } = await supabase
          .from('intelligence_missions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active');

        const { data: pendingCommands } = await supabase
          .from('hardware_commands')
          .select('*, hardware_devices(device_name, device_type)')
          .eq('user_id', userId)
          .in('status', ['pending', 'sent'])
          .order('created_at', { ascending: false })
          .limit(20);

        return new Response(
          JSON.stringify({
            devices: devices || [],
            active_missions: activeMissions || [],
            pending_commands: pendingCommands || [],
            timestamp: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send-command': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await req.json();
        
        const { data, error } = await supabase
          .from('hardware_commands')
          .insert({
            device_id: body.device_id,
            user_id: userId,
            mission_id: body.mission_id,
            command_type: body.command_type,
            command_data: body.command_data,
            priority: body.priority || 5,
            expires_at: body.expires_at,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, command: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown endpoint' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Hardware gateway error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
