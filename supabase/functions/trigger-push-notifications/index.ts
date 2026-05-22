import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Checking for pending notifications to send...');

    const now = new Date();
    const results = {
      followUpReminders: 0,
      eventReminders: 0,
      decayAlerts: 0,
      errors: 0,
    };

    // 1. Check for follow-up reminders (events due today)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { data: todayEvents } = await supabase
      .from('events')
      .select('*, profiles(first_name, last_name)')
      .gte('event_date', todayStart.toISOString())
      .lte('event_date', todayEnd.toISOString())
      .eq('reminder_sent', false);

    if (todayEvents) {
      for (const event of todayEvents) {
        try {
          const contactName = event.profiles 
            ? `${event.profiles.first_name} ${event.profiles.last_name || ''}`.trim()
            : 'a contact';

          // Send push notification
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: event.user_id,
              title: `📅 ${event.title}`,
              body: `Today: ${event.event_type} with ${contactName}`,
              url: `/contacts/${event.profile_id}`,
              tag: `event-${event.id}`,
            },
          });

          // Mark reminder as sent
          await supabase
            .from('events')
            .update({ reminder_sent: true })
            .eq('id', event.id);

          results.eventReminders++;
        } catch (error) {
          console.error('Failed to send event reminder:', event.id, error);
          results.errors++;
        }
      }
    }

    // 2. Check for relationship decay alerts
    const { data: decayingRelationships } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, last_contact_date')
      .not('last_contact_date', 'is', null)
      .lt('last_contact_date', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 days

    if (decayingRelationships) {
      // Group by user to avoid spamming
      const userDecays = new Map<string, typeof decayingRelationships>();
      for (const profile of decayingRelationships) {
        const existing = userDecays.get(profile.user_id) || [];
        existing.push(profile);
        userDecays.set(profile.user_id, existing);
      }

      for (const [userId, profiles] of userDecays) {
        // Check if we already sent a decay alert today
        const { data: existingAlert } = await supabase
          .from('intelligence_alerts')
          .select('id')
          .eq('user_id', userId)
          .eq('alert_type', 'relationship_decay')
          .gte('created_at', todayStart.toISOString())
          .limit(1)
          .single();

        if (!existingAlert && profiles.length > 0) {
          try {
            const topProfiles = profiles.slice(0, 3);
            const names = topProfiles
              .map(p => `${p.first_name} ${p.last_name || ''}`.trim())
              .join(', ');

            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId,
                title: '⚠️ Relationship Decay Alert',
                body: `${profiles.length} contacts need attention: ${names}${profiles.length > 3 ? '...' : ''}`,
                url: '/insights',
                tag: 'decay-alert',
              },
            });

            results.decayAlerts++;
          } catch (error) {
            console.error('Failed to send decay alert:', userId, error);
            results.errors++;
          }
        }
      }
    }

    // 3. Check for follow-up suggestions
    const { data: pendingFollowups } = await supabase
      .from('contact_interaction_notes')
      .select('*, profiles(first_name, last_name)')
      .eq('follow_up_needed', true)
      .lte('follow_up_date', todayEnd.toISOString())
      .gte('follow_up_date', todayStart.toISOString());

    if (pendingFollowups) {
      for (const followup of pendingFollowups) {
        try {
          const contactName = followup.profiles 
            ? `${followup.profiles.first_name} ${followup.profiles.last_name || ''}`.trim()
            : 'a contact';

          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: followup.user_id,
              title: '📝 Follow-up Reminder',
              body: `Follow up with ${contactName}: ${followup.follow_up_reason || 'Scheduled follow-up'}`,
              url: `/contacts/${followup.profile_id}`,
              tag: `followup-${followup.id}`,
            },
          });

          results.followUpReminders++;
        } catch (error) {
          console.error('Failed to send follow-up reminder:', followup.id, error);
          results.errors++;
        }
      }
    }

    console.log('Push notification trigger complete:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Trigger push notifications error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
