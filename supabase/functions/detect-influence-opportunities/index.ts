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

    const opportunities: any[] = [];

    // 1. Find upcoming birthdays (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: birthdayContacts, error: birthdayError } = await supabase
      .from('contact_personal_info')
      .select(`
        id,
        date_of_birth,
        profile_id,
        profiles:profile_id (
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .not('date_of_birth', 'is', null);

    if (!birthdayError && birthdayContacts) {
      for (const contact of birthdayContacts) {
        const dob = new Date(contact.date_of_birth);
        const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        
        // Check if birthday is in the next 7 days
        if (thisYearBirthday >= today && thisYearBirthday <= nextWeek) {
          const profile = contact.profiles as any;
          opportunities.push({
            user_id: profile.user_id,
            profile_id: contact.profile_id,
            opportunity_type: 'birthday',
            trigger_event: `Birthday on ${thisYearBirthday.toLocaleDateString()}`,
            suggested_action: `Send birthday wishes to ${profile.first_name}`,
            optimal_timing: thisYearBirthday.toISOString(),
            expires_at: new Date(thisYearBirthday.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            contact_name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          });
        }
      }
    }

    // 2. Find contacts with no recent communication (re-engagement)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: silentContacts, error: silentError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, user_id, last_contact_date, is_favorite')
      .or(`last_contact_date.is.null,last_contact_date.lt.${thirtyDaysAgo.toISOString()}`)
      .eq('is_favorite', true);

    if (!silentError && silentContacts) {
      for (const contact of silentContacts) {
        opportunities.push({
          user_id: contact.user_id,
          profile_id: contact.id,
          opportunity_type: 're-engagement',
          trigger_event: contact.last_contact_date 
            ? `No contact since ${new Date(contact.last_contact_date).toLocaleDateString()}`
            : 'Never contacted',
          suggested_action: `Reconnect with ${contact.first_name}`,
          optimal_timing: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          contact_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
        });
      }
    }

    // 3. Find contacts with recent milestones/events
    const { data: recentEvents, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        event_type,
        event_date,
        profile_id,
        profiles:profile_id (
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('is_active', true)
      .gte('event_date', thirtyDaysAgo.toISOString())
      .lte('event_date', today.toISOString())
      .in('event_type', ['promotion', 'job_change', 'achievement', 'milestone']);

    if (!eventsError && recentEvents) {
      for (const event of recentEvents) {
        const profile = event.profiles as any;
        opportunities.push({
          user_id: profile.user_id,
          profile_id: event.profile_id,
          opportunity_type: 'milestone',
          trigger_event: event.title,
          suggested_action: `Congratulate ${profile.first_name} on their ${event.event_type}`,
          optimal_timing: new Date().toISOString(),
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          contact_name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        });
      }
    }

    // Create suggested actions for each opportunity
    let actionsCreated = 0;
    for (const opp of opportunities) {
      // Check if similar action already exists
      const { data: existingAction } = await supabase
        .from('influence_actions')
        .select('id')
        .eq('profile_id', opp.profile_id)
        .eq('user_id', opp.user_id)
        .in('status', ['pending', 'reminded'])
        .ilike('action_title', `%${opp.opportunity_type}%`)
        .maybeSingle();

      if (!existingAction) {
        await supabase.from('influence_actions').insert({
          user_id: opp.user_id,
          profile_id: opp.profile_id,
          action_type: opp.opportunity_type === 'birthday' ? 'gift' : 
                       opp.opportunity_type === 'milestone' ? 'appreciation' : 'check_in',
          action_title: opp.suggested_action,
          action_description: `Detected opportunity: ${opp.trigger_event}`,
          scheduled_for: opp.optimal_timing,
          priority: opp.opportunity_type === 'birthday' ? 'high' : 'medium',
          status: 'pending',
          source: 'ai_detected',
        });

        // Create activity feed entry
        await supabase.from('contact_activity_feed').insert({
          user_id: opp.user_id,
          profile_id: opp.profile_id,
          activity_type: 'opportunity',
          activity_subtype: opp.opportunity_type,
          title: `Opportunity: ${opp.opportunity_type}`,
          description: opp.trigger_event,
          importance_score: opp.opportunity_type === 'birthday' ? 85 : 70,
          metadata: { opportunity: opp },
        });

        actionsCreated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        opportunitiesDetected: opportunities.length,
        actionsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error detecting opportunities:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
