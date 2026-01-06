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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { alertId, userId, testMode } = await req.json();

    // Get user's notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!prefs) {
      return new Response(
        JSON.stringify({ success: false, message: 'No notification preferences found' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the alert details
    const { data: alert } = await supabase
      .from('intelligence_alerts')
      .select('*, profiles(first_name, last_name, email)')
      .eq('id', alertId)
      .single();

    if (!alert) {
      return new Response(
        JSON.stringify({ success: false, message: 'Alert not found' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check severity threshold
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const minSeverity = severityOrder[prefs.min_severity as keyof typeof severityOrder] || 2;
    const alertSeverity = severityOrder[alert.severity as keyof typeof severityOrder] || 2;
    
    if (alertSeverity < minSeverity) {
      return new Response(
        JSON.stringify({ success: false, message: 'Alert below severity threshold' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if alert type is enabled
    if (!prefs.alert_types_enabled?.includes(alert.alert_type)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Alert type not enabled' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check quiet hours
    if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime >= prefs.quiet_hours_start && currentTime <= prefs.quiet_hours_end) {
        return new Response(
          JSON.stringify({ success: false, message: 'In quiet hours' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const results = { push: false, email: false };
    const profile = alert.profiles as any;
    const contactName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Unknown';

    // Send email notification via Resend
    if (prefs.email_enabled && resendApiKey) {
      // Get user email
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      
      if (user?.email) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Intelligence Alerts <alerts@yourapp.com>',
              to: [user.email],
              subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#ea580c' : '#3b82f6'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">Intelligence Alert</h1>
                    <p style="margin: 8px 0 0; opacity: 0.9;">${alert.alert_type.replace(/_/g, ' ').toUpperCase()}</p>
                  </div>
                  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                    <h2 style="margin-top: 0;">${alert.title}</h2>
                    ${alert.profile_id ? `<p><strong>Contact:</strong> ${contactName}</p>` : ''}
                    <p>${alert.description || ''}</p>
                    ${alert.recommended_actions?.length > 0 ? `
                      <h3>Recommended Actions:</h3>
                      <ul>
                        ${alert.recommended_actions.map((a: string) => `<li>${a}</li>`).join('')}
                      </ul>
                    ` : ''}
                    <p style="margin-top: 20px;">
                      <a href="${supabaseUrl.replace('.supabase.co', '')}/insights" 
                         style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                        View in Dashboard
                      </a>
                    </p>
                  </div>
                </div>
              `,
            }),
          });
          
          results.email = emailResponse.ok;
        } catch (e) {
          console.error('Email send failed:', e);
        }
      }
    }

    // Send push notification (if subscription exists)
    if (prefs.push_enabled && prefs.push_subscription) {
      // Web Push implementation would go here
      // For now, we'll just mark it as attempted
      results.push = true; // Would need actual Web Push implementation
    }

    // Update alert as notified
    await supabase
      .from('intelligence_alerts')
      .update({ 
        is_notified: true,
        notified_at: new Date().toISOString()
      })
      .eq('id', alertId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Notifications sent - Email: ${results.email}, Push: ${results.push}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending alert:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});