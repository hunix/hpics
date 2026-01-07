import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  location?: string;
  status?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get Google Calendar config
    const { data: config, error: configError } = await supabase
      .from('google_calendar_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = config.access_token;
    const calendarIds = config.calendar_ids || ['primary'];
    
    // Fetch events from all calendars
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    let allEvents: GoogleEvent[] = [];
    let synced = 0;
    let matched = 0;

    for (const calendarId of calendarIds) {
      const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        `timeMin=${oneMonthAgo.toISOString()}` +
        `&timeMax=${threeMonthsLater.toISOString()}` +
        `&maxResults=500` +
        `&singleEvents=true`;

      const response = await fetch(eventsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        console.error(`Failed to fetch events from ${calendarId}`);
        continue;
      }

      const data = await response.json();
      allEvents = allEvents.concat(data.items || []);
    }

    // Process events
    for (const event of allEvents) {
      if (!event.summary || event.status === 'cancelled') continue;

      const eventDate = event.start?.dateTime || event.start?.date;
      if (!eventDate) continue;

      // Check if event already exists
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', userId)
        .eq('external_id', event.id)
        .maybeSingle();

      if (existing) {
        // Update existing event
        await supabase
          .from('events')
          .update({
            title: event.summary,
            description: event.description || null,
            event_date: eventDate,
            location: event.location || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Create new event
        const { data: newEvent } = await supabase
          .from('events')
          .insert({
            user_id: userId,
            title: event.summary,
            description: event.description || null,
            event_date: eventDate,
            event_type: 'meeting',
            location: event.location || null,
            external_id: event.id,
            source: 'google_calendar',
            is_active: true,
          })
          .select()
          .single();

        synced++;

        // Try to match attendees to contacts
        if (newEvent && event.attendees) {
          for (const attendee of event.attendees) {
            const { data: contact } = await supabase
              .from('contact_methods')
              .select('profile_id')
              .eq('user_id', userId)
              .eq('type', 'email')
              .ilike('value', attendee.email)
              .maybeSingle();

            if (contact) {
              await supabase
                .from('events')
                .update({ profile_id: contact.profile_id })
                .eq('id', newEvent.id);
              matched++;
              break;
            }
          }
        }
      }
    }

    // Update sync status
    await supabase
      .from('google_calendar_config')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'completed',
        events_synced: (config.events_synced || 0) + synced,
      })
      .eq('user_id', userId);

    return new Response(JSON.stringify({
      success: true,
      total: allEvents.length,
      synced,
      matched,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error('Sync Google Calendar error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
