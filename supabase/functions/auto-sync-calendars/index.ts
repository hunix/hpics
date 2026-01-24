import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting auto calendar sync...");

    // Fetch Google Calendar configs with auto-sync enabled
    const { data: googleConfigs, error: googleError } = await supabase
      .from("google_calendar_config")
      .select("user_id, last_sync_at, sync_interval_minutes, auto_sync_enabled")
      .eq("auto_sync_enabled", true);

    if (googleError) {
      console.error("Error fetching Google configs:", googleError);
    }

    // Fetch Outlook configs with auto-sync enabled
    const { data: outlookConfigs, error: outlookError } = await supabase
      .from("oauth_tokens")
      .select("user_id, updated_at, sync_interval_minutes, auto_sync_enabled")
      .eq("provider", "outlook")
      .eq("auto_sync_enabled", true);

    if (outlookError) {
      console.error("Error fetching Outlook configs:", outlookError);
    }

    const now = new Date();
    const results = {
      googleSynced: 0,
      outlookSynced: 0,
      errors: [] as string[],
    };

    // Process Google Calendar syncs
    for (const config of googleConfigs || []) {
      const lastSync = config.last_sync_at ? new Date(config.last_sync_at) : new Date(0);
      const intervalMs = (config.sync_interval_minutes || 60) * 60 * 1000;
      
      if (now.getTime() - lastSync.getTime() >= intervalMs) {
        try {
          console.log(`Syncing Google Calendar for user ${config.user_id}`);
          
          const response = await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ userId: config.user_id }),
          });

          if (response.ok) {
            results.googleSynced++;
          } else {
            const errorText = await response.text();
            results.errors.push(`Google sync failed for ${config.user_id}: ${errorText}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Google sync error for ${config.user_id}: ${message}`);
        }
      }
    }

    // Process Outlook Calendar syncs
    for (const config of outlookConfigs || []) {
      const lastSync = config.updated_at ? new Date(config.updated_at) : new Date(0);
      const intervalMs = (config.sync_interval_minutes || 60) * 60 * 1000;
      
      if (now.getTime() - lastSync.getTime() >= intervalMs) {
        try {
          console.log(`Syncing Outlook Calendar for user ${config.user_id}`);
          
          const response = await fetch(`${supabaseUrl}/functions/v1/sync-outlook-calendar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ userId: config.user_id }),
          });

          if (response.ok) {
            results.outlookSynced++;
          } else {
            const errorText = await response.text();
            results.errors.push(`Outlook sync failed for ${config.user_id}: ${errorText}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Outlook sync error for ${config.user_id}: ${message}`);
        }
      }
    }

    console.log("Auto sync completed:", results);

    return new Response(JSON.stringify({
      success: true,
      ...results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in auto-sync-calendars:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
