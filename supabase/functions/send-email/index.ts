import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  profileId?: string;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured. Please add your Resend API key in settings.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { to, cc, bcc, subject, body, profileId, userId } = 
      await req.json() as SendEmailRequest;

    console.log('Sending email to:', to);

    // Validate required fields
    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, and body are required');
    }

    // Get user's email for the "from" field
    let fromEmail = 'PICS <noreply@resend.dev>';
    
    if (userId) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user?.email) {
        // Note: In production, you'd use your verified domain
        fromEmail = `PICS <noreply@resend.dev>`;
      }
    }

    // Build email options
    const emailOptions: any = {
      from: fromEmail,
      to: [to],
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${body.split('\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.5;">${p}</p>`).join('')}
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #666; font-size: 12px;">Sent via PICS - Personal Information Connection System</p>
        </div>
      `,
      text: body,
    };

    if (cc) emailOptions.cc = [cc];
    if (bcc) emailOptions.bcc = [bcc];

    // Send the email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailOptions),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(errorData.message || 'Failed to send email');
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully:', emailData);

    // Log the communication if we have a profile
    if (profileId && userId) {
      await supabase.from('communications').insert({
        user_id: userId,
        profile_id: profileId,
        channel: 'email',
        direction: 'outgoing',
        subject,
        content: body,
        occurred_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailData?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Send email error:', error);
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
