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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Fetch pending actions due today or tomorrow
    const { data: dueActions, error: actionsError } = await supabase
      .from('influence_actions')
      .select(`
        *,
        profiles:profile_id (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        influence_profiles:profile_id (
          power_words,
          avoid_words,
          positive_triggers,
          timing_preferences
        )
      `)
      .in('status', ['pending', 'reminded'])
      .lte('scheduled_for', tomorrow.toISOString())
      .gte('scheduled_for', startOfDay.toISOString());

    if (actionsError) throw actionsError;

    const reminders = [];

    for (const action of dueActions || []) {
      const profile = action.profiles as any;
      const influenceProfile = action.influence_profiles as any;

      // Enrich reminder with context
      const enrichedReminder = {
        actionId: action.id,
        userId: action.user_id,
        profileId: action.profile_id,
        contactName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
        actionTitle: action.action_title,
        actionType: action.action_type,
        scheduledFor: action.scheduled_for,
        priority: action.priority,
        suggestedMessage: action.suggested_message,
        talkingPoints: action.talking_points,
        thingsToMention: action.things_to_mention,
        thingsToAvoid: action.things_to_avoid,
        // From influence profile
        powerWords: influenceProfile?.power_words || [],
        avoidWords: influenceProfile?.avoid_words || [],
        positiveTriggers: influenceProfile?.positive_triggers || [],
        timingPreferences: influenceProfile?.timing_preferences || {},
      };

      reminders.push(enrichedReminder);

      // Update status to 'reminded'
      if (action.status === 'pending') {
        await supabase
          .from('influence_actions')
          .update({ status: 'reminded' })
          .eq('id', action.id);
      }
    }

    // Group reminders by user for notification sending
    const remindersByUser = reminders.reduce((acc, reminder) => {
      if (!acc[reminder.userId]) acc[reminder.userId] = [];
      acc[reminder.userId].push(reminder);
      return acc;
    }, {} as Record<string, typeof reminders>);

    // For each user, create a notification or send email
    for (const [userId, userReminders] of Object.entries(remindersByUser)) {
      // Create activity feed entries
      for (const reminder of userReminders) {
        await supabase.from('contact_activity_feed').insert({
          user_id: userId,
          profile_id: reminder.profileId,
          activity_type: 'reminder',
          activity_subtype: reminder.actionType,
          title: `Reminder: ${reminder.actionTitle}`,
          description: `Action due for ${reminder.contactName}`,
          importance_score: reminder.priority === 'high' ? 90 : reminder.priority === 'medium' ? 70 : 50,
          metadata: {
            actionId: reminder.actionId,
            suggestedMessage: reminder.suggestedMessage,
            powerWords: reminder.powerWords,
          },
        });
      }

      // Try to send push notification
      try {
        await supabase.functions.invoke('trigger-push-notifications', {
          body: {
            userId,
            title: `${userReminders.length} influence action${userReminders.length > 1 ? 's' : ''} due`,
            body: userReminders.map(r => r.actionTitle).join(', '),
          },
        });
      } catch (e) {
        console.log('Push notification failed:', e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedReminders: reminders.length,
        usersNotified: Object.keys(remindersByUser).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
