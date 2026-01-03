import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email reminders");
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get events happening in the next 7 days with reminders enabled
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(`
        *,
        profiles(first_name, last_name)
      `)
      .eq("is_active", true)
      .gte("event_date", now.toISOString())
      .lte("event_date", inSevenDays.toISOString());

    if (eventsError) {
      throw eventsError;
    }

    console.log(`Found ${events?.length || 0} upcoming events`);

    // Get user preferences for email reminders
    const userIds = [...new Set(events?.map(e => e.user_id) || [])];
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("user_id, email_reminders, reminder_email")
      .in("user_id", userIds)
      .eq("email_reminders", true);

    // Get user emails from auth
    const emailsSent: string[] = [];

    for (const event of events || []) {
      const userPref = preferences?.find(p => p.user_id === event.user_id);
      if (!userPref) continue;

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(event.user_id);
      const email = userPref.reminder_email || userData?.user?.email;
      
      if (!email) continue;

      const daysUntil = Math.ceil((new Date(event.event_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only send if days match reminder_days_before
      if (daysUntil !== event.reminder_days_before) continue;

      const contactName = event.profiles 
        ? `${event.profiles.first_name} ${event.profiles.last_name || ''}`.trim()
        : 'a contact';

      try {
        await resend.emails.send({
          from: "PICS <onboarding@resend.dev>",
          to: [email],
          subject: `Reminder: ${event.title} ${daysUntil === 0 ? 'is today!' : `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Upcoming Event Reminder</h2>
              <p>Hi there!</p>
              <p>This is a reminder about an upcoming event in your PICS calendar:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #333;">${event.title}</h3>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Type:</strong> ${event.event_type.replace('_', ' ')}
                </p>
                ${event.profiles ? `<p style="margin: 5px 0; color: #666;"><strong>Related to:</strong> ${contactName}</p>` : ''}
                ${event.description ? `<p style="margin: 10px 0 0 0; color: #666;">${event.description}</p>` : ''}
              </div>
              <p style="color: #666; font-size: 14px;">
                Stay connected with PICS - Your Personal Intelligence CRM
              </p>
            </div>
          `,
        });
        emailsSent.push(email);
        console.log(`Reminder email sent to ${email} for event: ${event.title}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        eventsChecked: events?.length || 0 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
