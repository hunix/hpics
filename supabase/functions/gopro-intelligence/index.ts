import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoProCommand {
  command: string;
  params?: Record<string, unknown>;
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
      case 'register_gopro': {
        const { device_name, gopro_model, serial_number, firmware_version } = params;

        const { data: device, error } = await supabase
          .from('hardware_devices')
          .insert({
            user_id: user.id,
            device_type: 'gopro',
            device_id: serial_number || `gopro_${Date.now()}`,
            device_name: device_name || `GoPro ${gopro_model}`,
            firmware_version,
            capabilities: {
              model: gopro_model,
              supports_live_stream: true,
              supports_remote_control: true,
              max_resolution: '5.3k',
              has_gps: true,
              has_stabilization: true
            },
            is_online: true,
            last_seen_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          device
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'queue_command': {
        const { device_id, command } = params as {
          device_id: string;
          command: GoProCommand;
        };

        // Queue command for the GoPro
        const { data: cmd, error } = await supabase
          .from('hardware_commands')
          .insert({
            user_id: user.id,
            device_id,
            command_type: command.command,
            payload: command.params || {},
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          command: cmd
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'start_recording': {
        const { device_id, mode, settings } = params as {
          device_id: string;
          mode: 'video' | 'photo' | 'timelapse' | 'burst';
          settings?: {
            resolution?: string;
            fps?: number;
            fov?: string;
            stabilization?: boolean;
          };
        };

        const { data: cmd, error } = await supabase
          .from('hardware_commands')
          .insert({
            user_id: user.id,
            device_id,
            command_type: 'start_recording',
            payload: { mode, settings },
            status: 'pending',
            priority: 10 // High priority
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          command: cmd,
          message: `Recording started in ${mode} mode`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'stop_recording': {
        const { device_id } = params;

        const { data: cmd, error } = await supabase
          .from('hardware_commands')
          .insert({
            user_id: user.id,
            device_id,
            command_type: 'stop_recording',
            payload: {},
            status: 'pending',
            priority: 10
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          command: cmd,
          message: 'Recording stopped'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'capture_photo': {
        const { device_id, settings } = params;

        const { data: cmd, error } = await supabase
          .from('hardware_commands')
          .insert({
            user_id: user.id,
            device_id,
            command_type: 'capture_photo',
            payload: { settings },
            status: 'pending',
            priority: 10
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          command: cmd,
          message: 'Photo captured'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'start_livestream': {
        const { device_id, stream_settings } = params as {
          device_id: string;
          stream_settings?: {
            resolution?: '720p' | '1080p';
            bitrate?: number;
          };
        };

        const { data: cmd, error } = await supabase
          .from('hardware_commands')
          .insert({
            user_id: user.id,
            device_id,
            command_type: 'start_livestream',
            payload: { stream_settings },
            status: 'pending',
            priority: 10
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          command: cmd,
          message: 'Livestream starting...'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_media': {
        const { device_id, media_list } = params as {
          device_id: string;
          media_list: Array<{
            filename: string;
            type: 'video' | 'photo';
            size_bytes: number;
            created_at: string;
            thumbnail_url?: string;
            download_url: string;
            gps_location?: { lat: number; lng: number };
            duration_seconds?: number;
          }>;
        };

        // Store media references in the media table
        const mediaInserts = media_list.map(item => ({
          user_id: user.id,
          mime_type: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
          storage_path: item.download_url,
          thumbnail_url: item.thumbnail_url,
          file_size: item.size_bytes,
          ai_metadata: {
            source: 'gopro',
            device_id,
            filename: item.filename,
            duration_seconds: item.duration_seconds,
            gps_location: item.gps_location
          },
          created_at: item.created_at
        }));

        const { data: media, error } = await supabase
          .from('media')
          .insert(mediaInserts)
          .select();

        if (error) throw error;

        // Update device telemetry with sync info
        await supabase.from('hardware_telemetry').insert({
          device_id,
          telemetry_type: 'media_sync',
          data: {
            synced_count: media_list.length,
            total_size_bytes: media_list.reduce((acc, m) => acc + m.size_bytes, 0)
          }
        });

        return new Response(JSON.stringify({
          success: true,
          synced_count: media?.length || 0,
          media
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_status': {
        const { device_id } = params;

        // Get latest telemetry for the device
        const { data: telemetry, error } = await supabase
          .from('hardware_telemetry')
          .select('*')
          .eq('device_id', device_id)
          .order('recorded_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Get pending commands
        const { data: pendingCommands } = await supabase
          .from('hardware_commands')
          .select('*')
          .eq('device_id', device_id)
          .eq('status', 'pending')
          .order('priority', { ascending: false });

        return new Response(JSON.stringify({
          success: true,
          telemetry,
          pending_commands: pendingCommands
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'analyze_footage': {
        const { media_id, analysis_type } = params as {
          media_id: string;
          analysis_type: 'scene' | 'faces' | 'objects' | 'activity' | 'comprehensive';
        };

        // Get the media item
        const { data: media, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .eq('id', media_id)
          .eq('user_id', user.id)
          .single();

        if (mediaError || !media) throw new Error('Media not found');

        const prompts: Record<string, string> = {
          scene: 'Analyze this scene in detail. Describe the environment, lighting conditions, weather if visible, and any notable features.',
          faces: 'Identify and describe all visible faces. Note approximate age, gender, expression, and any distinguishing features.',
          objects: 'Identify all significant objects in this image. Note their positions, conditions, and any potential intelligence value.',
          activity: 'Analyze the activity taking place. Describe what is happening, who is involved, and any suspicious or notable behaviors.',
          comprehensive: 'Perform a comprehensive intelligence analysis. Cover: environment, people present, activities, objects of interest, potential security concerns, and any actionable intelligence.'
        };

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
                content: 'You are an expert intelligence analyst specializing in visual intelligence (IMINT). Provide detailed, actionable analysis.'
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompts[analysis_type] },
                  { type: 'image_url', image_url: { url: media.storage_path } }
                ]
              }
            ],
            max_tokens: 2000
          })
        });

        const aiResult = await aiResponse.json();
        const analysis = aiResult.choices?.[0]?.message?.content;

        // Store analysis result
        const { data: analysisRecord, error: analysisError } = await supabase
          .from('ai_analyses')
          .insert({
            user_id: user.id,
            profile_id: media.profile_id,
            analysis_type: `gopro_${analysis_type}`,
            result: {
              analysis,
              media_id,
              analysis_type,
              generated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (analysisError) throw analysisError;

        return new Response(JSON.stringify({
          success: true,
          analysis,
          analysis_record: analysisRecord
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    console.error('GoPro intelligence error:', error);
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
