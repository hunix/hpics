import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DeviceType = 
  | 'galaxy_watch' | 'apple_watch' | 'galaxy_ring' | 'oura' 
  | 'galaxy_buds' | 'airpods' 
  | 's25_ultra' | 'iphone' | 'ipad'
  | 'nfc_tag' | 'wearable';

type SyncType = 'health' | 'location' | 'voice' | 'capture' | 'biometric' | 'notification';

interface DeviceSyncPayload {
  deviceId: string;
  deviceType: DeviceType;
  syncType: SyncType;
  data: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface HealthMetric {
  type: 'heart_rate' | 'hrv' | 'stress' | 'sleep' | 'steps' | 'blood_oxygen' | 'body_temp';
  value: number;
  unit: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: DeviceSyncPayload = await req.json();
    const { deviceId, deviceType, syncType, data, timestamp, metadata } = payload;

    let result: any = { synced: false };

    switch (syncType) {
      case 'health':
        // Process health data from wearables
        const healthMetrics: HealthMetric[] = Array.isArray(data) ? data : [data];
        
        const healthInserts = healthMetrics.map(metric => ({
          user_id: user.id,
          device_type: deviceType,
          device_id: deviceId,
          metric_type: metric.type,
          metric_value: metric.value,
          metric_unit: metric.unit,
          recorded_at: metric.timestamp || timestamp,
          metadata: {
            ...metadata,
            sync_timestamp: new Date().toISOString()
          }
        }));

        const { error: healthError } = await supabase
          .from('device_health_data')
          .insert(healthInserts);

        if (healthError) {
          console.error('Health sync error:', healthError);
          result = { synced: false, error: healthError.message };
        } else {
          result = { synced: true, metricsCount: healthInserts.length };

          // Check for anomalies (high stress during meeting, etc.)
          const stressMetric = healthMetrics.find(m => m.type === 'stress');
          if (stressMetric && stressMetric.value > 70 && metadata?.interactionProfileId) {
            // Flag high stress during interaction
            await supabase.from('intelligence_alerts').insert({
              user_id: user.id,
              alert_type: 'anomaly',
              priority: 'medium',
              title: 'Elevated stress detected during interaction',
              description: `Your stress level was ${stressMetric.value}% during this interaction`,
              profile_id: metadata.interactionProfileId,
              evidence: { metric: stressMetric, device: deviceType }
            });
          }
        }
        break;

      case 'voice':
        // Process voice data from buds/watch
        const { transcription, audioUrl, duration, speakersDetected, context } = data;
        
        // Store voice recording session
        const { data: session, error: voiceError } = await supabase
          .from('voice_recording_sessions')
          .insert({
            user_id: user.id,
            profile_id: metadata?.profileId,
            transcription,
            audio_url: audioUrl,
            duration_seconds: duration,
            context: context || 'ambient',
            metadata: {
              device_type: deviceType,
              device_id: deviceId,
              speakers_detected: speakersDetected,
              ...metadata
            }
          })
          .select()
          .single();

        if (voiceError) {
          result = { synced: false, error: voiceError.message };
        } else {
          result = { synced: true, sessionId: session?.id };

          // Trigger embedding generation for transcription
          if (transcription && transcription.length > 50) {
            // Queue for embedding (could call universal-embedding-processor)
            await supabase.from('enrichment_queue').insert({
              user_id: user.id,
              profile_id: metadata?.profileId,
              enrichment_type: 'embedding',
              source_type: 'voice_recording_sessions',
              source_id: session?.id,
              priority: 8
            });
          }
        }
        break;

      case 'capture':
        // Process screen capture / photo capture
        const { imageUrl, ocrText, captureContext, detectedProfiles } = data;
        
        const { data: capture, error: captureError } = await supabase
          .from('device_captures')
          .insert({
            user_id: user.id,
            profile_id: metadata?.profileId,
            capture_type: 'device_sync',
            platform: deviceType,
            file_url: imageUrl,
            extracted_data: {
              ocr_text: ocrText,
              context: captureContext,
              detected_profiles: detectedProfiles
            },
            device_source: deviceType,
            processing_status: 'completed'
          })
          .select()
          .single();

        if (captureError) {
          result = { synced: false, error: captureError.message };
        } else {
          result = { synced: true, captureId: capture?.id };
        }
        break;

      case 'biometric':
        // Process biometric data (face recognition, voice print)
        const { biometricType, embedding, confidence, sampleUrl } = data;
        
        if (biometricType === 'voice') {
          const { error: voiceBioError } = await supabase
            .from('voice_signatures')
            .upsert({
              user_id: user.id,
              profile_id: metadata?.profileId,
              embedding_vector: embedding,
              quality_score: confidence,
              sample_duration_seconds: data.duration,
              audio_characteristics: data.characteristics
            }, {
              onConflict: 'user_id,profile_id'
            });

          result = { synced: !voiceBioError };
        } else {
          // Handle other biometrics through contact_biometrics
          const { error: bioError } = await supabase
            .from('biometric_samples')
            .insert({
              user_id: user.id,
              profile_id: metadata?.profileId,
              biometric_type: biometricType,
              source_type: deviceType,
              source_url: sampleUrl,
              features: data.features,
              quality_score: confidence
            });

          result = { synced: !bioError };
        }
        break;

      case 'location':
        // Process location data for context
        const { latitude, longitude, placeName, placeType } = data;
        
        // Update user's last known location (could add to a locations table)
        // For now, store as app setting
        await supabase.from('app_settings').upsert({
          user_id: user.id,
          setting_key: 'last_location',
          setting_value: JSON.stringify({ latitude, longitude, placeName, placeType }),
          metadata: { device: deviceType, timestamp }
        }, {
          onConflict: 'user_id,setting_key'
        });

        result = { synced: true, location: placeName };
        break;

      case 'notification':
        // Process notification interception (e.g., message notifications)
        const { app, title, body, sender } = data;
        
        // Could match sender to contacts and log communication
        if (metadata?.matchedProfileId) {
          await supabase.from('communications').insert({
            user_id: user.id,
            profile_id: metadata.matchedProfileId,
            channel: 'notification',
            direction: 'incoming',
            subject: title,
            content: body,
            occurred_at: timestamp
          });
        }

        result = { synced: true, app };
        break;

      default:
        result = { synced: false, error: 'Unknown sync type' };
    }

    // Log the sync
    await supabase.from('device_captures').insert({
      user_id: user.id,
      capture_type: 'device_sync_log',
      platform: deviceType,
      device_source: deviceId,
      extracted_data: {
        sync_type: syncType,
        result,
        timestamp
      },
      processing_status: result.synced ? 'completed' : 'failed'
    });

    return new Response(JSON.stringify({
      success: result.synced,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Device sync orchestrator error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});