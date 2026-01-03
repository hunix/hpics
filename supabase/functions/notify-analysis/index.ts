import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  sessionId: string;
  status: 'completed' | 'failed';
  profileName: string;
  analysisTypes: string[];
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId, sessionId, status, profileName, analysisTypes, error }: NotificationRequest = await req.json();

    // Get user email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user?.email) {
      console.log("Could not get user email:", userError);
      return new Response(
        JSON.stringify({ success: false, message: "Could not get user email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = userData.user.email;
    const userName = userData.user.user_metadata?.full_name || userEmail.split('@')[0];

    // Prepare email content
    const subject = status === 'completed' 
      ? `✅ Analysis Complete: ${profileName}`
      : `❌ Analysis Failed: ${profileName}`;

    const analysisTypesList = analysisTypes.join(', ');
    
    const htmlContent = status === 'completed' 
      ? `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Analysis Complete!</h2>
          <p>Hi ${userName},</p>
          <p>Your analysis for <strong>${profileName}</strong> has been completed successfully.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Analysis Types:</strong> ${analysisTypesList}</p>
            <p style="margin: 8px 0 0 0;"><strong>Session ID:</strong> ${sessionId}</p>
          </div>
          <p>You can now view the results in your dashboard.</p>
          <p style="color: #6b7280; font-size: 14px;">— Your Personal CRM</p>
        </div>
      `
      : `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Analysis Failed</h2>
          <p>Hi ${userName},</p>
          <p>Unfortunately, the analysis for <strong>${profileName}</strong> encountered an error.</p>
          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #fecaca;">
            <p style="margin: 0;"><strong>Error:</strong> ${error || 'Unknown error occurred'}</p>
            <p style="margin: 8px 0 0 0;"><strong>Analysis Types:</strong> ${analysisTypesList}</p>
          </div>
          <p>Please try again or contact support if the issue persists.</p>
          <p style="color: #6b7280; font-size: 14px;">— Your Personal CRM</p>
        </div>
      `;

    // For now, we'll log the notification since email sending requires additional setup
    // In production, you would integrate with Resend, SendGrid, or similar
    console.log("Email notification would be sent to:", userEmail);
    console.log("Subject:", subject);
    console.log("Content prepared for:", profileName);

    // Store notification in database for in-app display
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'analysis-notification',
      provider: 'system',
      model_name: 'notification',
      estimated_cost_cents: 0,
      status: 'completed',
      prompt_summary: `Analysis ${status} notification for ${profileName}`,
      request_metadata: { sessionId, status, analysisTypes },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification logged",
        email: userEmail,
        status 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in notify-analysis:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
