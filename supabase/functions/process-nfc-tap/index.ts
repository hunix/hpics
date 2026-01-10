import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NfcTapPayload {
  tagId: string;
  deviceSource?: string;
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
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

    const payload: NfcTapPayload = await req.json();
    const { tagId, deviceSource, location } = payload;

    console.log(`[process-nfc-tap] Processing NFC tap: ${tagId} for user ${user.id}`);

    // Look up the NFC tag
    const { data: tag, error: tagError } = await supabase
      .from('nfc_tags')
      .select('*, profiles!nfc_tags_profile_id_fkey(id, first_name, last_name)')
      .eq('tag_id', tagId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (tagError) {
      console.error('[process-nfc-tap] Tag lookup error:', tagError);
    }

    // If no tag found, return info for registration
    if (!tag) {
      return new Response(JSON.stringify({
        success: true,
        action: 'register_new',
        tagId,
        message: 'Unknown NFC tag. Ready for registration.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const actionConfig = tag.action_config || {};
    const tagType = tag.tag_type || 'interaction';

    // Update tap count
    await supabase
      .from('nfc_tags')
      .update({
        tap_count: (tag.tap_count || 0) + 1,
        last_tapped_at: now,
      })
      .eq('id', tag.id);

    let result: any = {
      success: true,
      tagId,
      tagLabel: tag.tag_label,
      tagType,
      action: 'logged',
    };

    // Execute action based on tag type
    switch (tagType) {
      case 'interaction':
        // Log interaction with the contact
        if (tag.profile_id) {
          const { error: interactionError } = await supabase.from('interaction_biometrics').insert({
            user_id: user.id,
            profile_id: tag.profile_id,
            device_source: deviceSource || 'nfc_tag',
            interaction_date: now,
            location_lat: location?.latitude,
            location_lng: location?.longitude,
            location_name: location?.placeName,
            notes: `NFC tap: ${tag.tag_label || tagId}`,
            raw_data: { tagId, deviceSource },
          });

          if (!interactionError) {
            result.action = 'interaction_logged';
            result.profileId = tag.profile_id;
            result.profileName = tag.profiles 
              ? `${tag.profiles.first_name || ''} ${tag.profiles.last_name || ''}`.trim()
              : null;
          }
        }
        break;

      case 'voice_record':
        // Signal to start voice recording
        result.action = 'start_voice_recording';
        result.profileId = tag.profile_id;
        result.recordingConfig = actionConfig.recordingConfig || {
          type: 'meeting',
          autoTranscribe: true,
        };
        break;

      case 'checkin':
        // Log a simple check-in
        await supabase.from('device_captures').insert({
          user_id: user.id,
          profile_id: tag.profile_id,
          capture_type: 'nfc',
          source_app: 'nfc_tag',
          device_source: deviceSource,
          location_lat: location?.latitude,
          location_lng: location?.longitude,
          location_name: location?.placeName,
          metadata: {
            tagId,
            tagLabel: tag.tag_label,
            checkInTime: now,
          },
          status: 'applied',
          applied_at: now,
        });
        result.action = 'checkin_logged';
        break;

      case 'custom':
        // Return custom action config for client to handle
        result.action = 'custom';
        result.customAction = actionConfig;
        result.profileId = tag.profile_id;
        break;
    }

    // Log device sync
    await supabase.from('device_sync_log').insert({
      user_id: user.id,
      device_id: tagId,
      device_type: 'nfc_tag',
      device_name: tag.tag_label,
      sync_type: 'nfc',
      metadata: {
        tagType,
        profileId: tag.profile_id,
        action: result.action,
        location,
      },
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[process-nfc-tap] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process NFC tap' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
