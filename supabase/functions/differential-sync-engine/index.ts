import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  platform: string;
  identifier: string;
  profileId?: string;
  cursor?: {
    lastItemTimestamp?: string;
    lastItemId?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
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
    const { platform, identifier, profileId, cursor } = body;

    console.log(`Starting differential sync for ${platform}:${identifier}`);

    // Get or create sync cursor
    let syncCursor;
    const { data: existingCursor } = await supabaseClient
      .from('sync_cursors')
      .select('*')
      .eq('user_id', user.id)
      .eq('source_type', platform)
      .eq('source_identifier', identifier)
      .maybeSingle();

    if (existingCursor) {
      syncCursor = existingCursor;
    } else {
      const { data: newCursor } = await supabaseClient
        .from('sync_cursors')
        .insert({
          user_id: user.id,
          source_type: platform,
          source_identifier: identifier,
          profile_id: profileId,
          sync_status: 'syncing',
        })
        .select()
        .single();
      syncCursor = newCursor;
    }

    // Update status to syncing
    await supabaseClient
      .from('sync_cursors')
      .update({ sync_status: 'syncing' })
      .eq('id', syncCursor.id);

    let itemsSynced = 0;
    let itemsSkipped = 0;
    let newCursor = {
      lastItemTimestamp: cursor?.lastItemTimestamp,
      lastItemId: cursor?.lastItemId,
    };

    // Platform-specific sync logic
    switch (platform) {
      case 'instagram':
      case 'threads':
      case 'linkedin':
      case 'twitter': {
        // For social platforms, we'll trigger the chrome extension or scraper
        // This is a placeholder for the actual sync implementation
        // In practice, this would call the appropriate scraping function
        
        // Check for new device captures since last sync
        const query = supabaseClient
          .from('device_captures')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', platform)
          .order('captured_at', { ascending: true });

        if (cursor?.lastItemTimestamp) {
          query.gt('captured_at', cursor.lastItemTimestamp);
        }

        const { data: captures, error: captureError } = await query.limit(100);

        if (captureError) {
          throw captureError;
        }

        if (captures && captures.length > 0) {
          // Process new captures
          for (const capture of captures) {
            // Create fingerprint for deduplication
            const fingerprint = `${platform}|${capture.id}|${capture.captured_at}`;
            
            // Check if already processed
            const { data: existing } = await supabaseClient
              .from('message_fingerprints')
              .select('id')
              .eq('user_id', user.id)
              .eq('fingerprint', fingerprint)
              .maybeSingle();

            if (existing) {
              itemsSkipped++;
              continue;
            }

            // Store fingerprint
            await supabaseClient
              .from('message_fingerprints')
              .insert({
                user_id: user.id,
                fingerprint,
                source_type: platform,
              });

            itemsSynced++;
            newCursor.lastItemTimestamp = capture.captured_at;
            newCursor.lastItemId = capture.id;
          }
        }
        break;
      }

      case 'whatsapp': {
        // WhatsApp sync via message fingerprints
        // This integrates with the import system
        const { data: conversations } = await supabaseClient
          .from('conversations')
          .select('id, last_message_at')
          .eq('user_id', user.id)
          .eq('platform', 'whatsapp');

        if (conversations) {
          for (const conv of conversations) {
            // Check for messages not yet fingerprinted
            const { data: messages } = await supabaseClient
              .from('messages')
              .select('id, sent_at, content, is_from_contact')
              .eq('conversation_id', conv.id)
              .order('sent_at', { ascending: true })
              .limit(500);

            if (messages) {
              for (const msg of messages) {
                const fingerprint = `whatsapp|${msg.sent_at}|${msg.content?.substring(0, 100)}|${msg.is_from_contact}`;
                
                const { error: insertError } = await supabaseClient
                  .from('message_fingerprints')
                  .upsert({
                    user_id: user.id,
                    conversation_id: conv.id,
                    message_id: msg.id,
                    fingerprint,
                    source_type: 'whatsapp',
                  }, {
                    onConflict: 'user_id,fingerprint',
                    ignoreDuplicates: true,
                  });

                if (!insertError) {
                  itemsSynced++;
                }
              }
            }
          }
        }
        break;
      }

      case 'location': {
        // Location sync - aggregate and deduplicate
        const since = cursor?.lastItemTimestamp 
          ? new Date(cursor.lastItemTimestamp)
          : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

        const { data: locations } = await supabaseClient
          .from('location_history')
          .select('*')
          .eq('user_id', user.id)
          .gt('recorded_at', since.toISOString())
          .order('recorded_at', { ascending: true });

        if (locations && locations.length > 0) {
          // Detect routes from location points
          let routeStart = locations[0];
          let routePoints = [locations[0]];
          
          for (let i = 1; i < locations.length; i++) {
            const current = locations[i];
            const prev = locations[i - 1];
            
            // Check if this is part of the same route (within 30 min gap)
            const timeDiff = new Date(current.recorded_at).getTime() - 
                            new Date(prev.recorded_at).getTime();
            
            if (timeDiff > 30 * 60 * 1000) {
              // New route - save the previous one if significant
              if (routePoints.length >= 5) {
                await supabaseClient
                  .from('movement_routes')
                  .insert({
                    user_id: user.id,
                    profile_id: profileId,
                    start_location_id: routeStart.id,
                    end_location_id: routePoints[routePoints.length - 1].id,
                    start_time: routeStart.recorded_at,
                    end_time: routePoints[routePoints.length - 1].recorded_at,
                    waypoints: routePoints.map(p => ({
                      lat: p.latitude,
                      lon: p.longitude,
                      time: p.recorded_at,
                    })),
                  });
                itemsSynced++;
              }
              
              routeStart = current;
              routePoints = [current];
            } else {
              routePoints.push(current);
            }
          }

          newCursor.lastItemTimestamp = locations[locations.length - 1].recorded_at;
          newCursor.lastItemId = locations[locations.length - 1].id;
        }
        break;
      }
    }

    // Update sync cursor with results
    await supabaseClient
      .from('sync_cursors')
      .update({
        last_sync_at: new Date().toISOString(),
        last_item_timestamp: newCursor.lastItemTimestamp,
        last_item_id: newCursor.lastItemId,
        items_synced_total: (syncCursor.items_synced_total || 0) + itemsSynced,
        sync_status: 'completed',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', syncCursor.id);

    console.log(`Sync completed: ${itemsSynced} synced, ${itemsSkipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        itemsSynced,
        itemsSkipped,
        newCursor,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Differential sync error:', error);
    
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
