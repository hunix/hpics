import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OutlookEvent {
  id: string;
  subject?: string;
  body?: { content?: string };
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  attendees?: Array<{ emailAddress: { address: string; name?: string } }>;
  location?: { displayName?: string };
  isCancelled?: boolean;
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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Outlook config
    const { data: config, error: configError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'outlook')
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: "Outlook not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = config.access_token;
    
    // Fetch events
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const eventsUrl = `https://graph.microsoft.com/v1.0/me/calendarView?` +
      `startDateTime=${oneMonthAgo.toISOString()}` +
      `&endDateTime=${threeMonthsLater.toISOString()}` +
      `&$top=500`;

    const response = await fetch(eventsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch events');
    }

    const data = await response.json();
    const events: OutlookEvent[] = data.value || [];
    
    let synced = 0;
    let matched = 0;

    for (const event of events) {
      if (!event.subject || event.isCancelled) continue;

      const eventDate = event.start?.dateTime;
      if (!eventDate) continue;

      // Check if event already exists
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', user.id)
        .eq('external_id', event.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('events')
          .update({
            title: event.subject,
            description: event.body?.content || null,
            event_date: eventDate,
            location: event.location?.displayName || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        const { data: newEvent } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            title: event.subject,
            description: event.body?.content || null,
            event_date: eventDate,
            event_type: 'meeting',
            location: event.location?.displayName || null,
            external_id: event.id,
            source: 'outlook_calendar',
            is_active: true,
          })
          .select()
          .single();

        synced++;

        // Match attendees to contacts
        if (newEvent && event.attendees) {
          for (const attendee of event.attendees) {
            const { data: contact } = await supabase
              .from('contact_methods')
              .select('profile_id')
              .eq('user_id', user.id)
              .eq('type', 'email')
              .ilike('value', attendee.emailAddress.address)
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

    return new Response(JSON.stringify({
      success: true,
      total: events.length,
      synced,
      matched,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error('Sync Outlook Calendar error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
