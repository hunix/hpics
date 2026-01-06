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

    // This is called by pg_cron, no user auth required
    // But we'll also allow manual triggers with auth
    let targetUserId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        targetUserId = user.id;
      }
    }

    // Get all active scheduled reports
    let query = supabase
      .from('reports_schedule')
      .select('*')
      .eq('is_active', true);

    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: schedules, error: scheduleError } = await query;

    if (scheduleError) {
      throw scheduleError;
    }

    const now = new Date();
    const results: Array<{ scheduleId: string; success: boolean; error?: string }> = [];

    for (const schedule of schedules || []) {
      try {
        // Check if it's time to generate
        if (schedule.next_scheduled_at && new Date(schedule.next_scheduled_at) > now) {
          continue;
        }

        // Generate the report based on type
        let reportData: any = {};
        
        if (schedule.report_type === 'executive_summary') {
          // Generate executive summary
          const { data: contacts } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, relationship_score')
            .eq('user_id', schedule.user_id);

          const { data: communications } = await supabase
            .from('communications')
            .select('*')
            .eq('user_id', schedule.user_id)
            .gte('occurred_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

          reportData = {
            totalContacts: contacts?.length || 0,
            totalCommunications: communications?.length || 0,
            generatedAt: now.toISOString(),
          };
        } else if (schedule.report_type === 'relationship_health') {
          // Generate relationship health report
          const { data: contacts } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, relationship_score, last_contact_date')
            .eq('user_id', schedule.user_id);

          const atRisk = (contacts || []).filter(c => 
            !c.last_contact_date || 
            (now.getTime() - new Date(c.last_contact_date).getTime()) > 30 * 24 * 60 * 60 * 1000
          );

          reportData = {
            totalContacts: contacts?.length || 0,
            atRiskContacts: atRisk.length,
            averageScore: contacts?.length 
              ? Math.round(contacts.reduce((sum, c) => sum + (c.relationship_score || 50), 0) / contacts.length)
              : 50,
            generatedAt: now.toISOString(),
          };
        }

        // Save generated report
        await supabase.from('generated_reports').insert({
          user_id: schedule.user_id,
          schedule_id: schedule.id,
          report_type: schedule.report_type,
          title: `${schedule.name} - ${now.toLocaleDateString()}`,
          metadata: reportData,
        });

        // Calculate next scheduled time
        let nextScheduled: Date;
        switch (schedule.frequency) {
          case 'daily':
            nextScheduled = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            nextScheduled = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            nextScheduled = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            break;
          default:
            nextScheduled = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        // Update schedule
        await supabase
          .from('reports_schedule')
          .update({
            last_generated_at: now.toISOString(),
            next_scheduled_at: nextScheduled.toISOString(),
          })
          .eq('id', schedule.id);

        // Send email if recipients configured
        if (schedule.recipients && schedule.recipients.length > 0) {
          const resendKey = Deno.env.get("RESEND_API_KEY");
          if (resendKey) {
            for (const email of schedule.recipients) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: 'PICS <noreply@resend.dev>',
                  to: email,
                  subject: `${schedule.name} - Report Ready`,
                  html: `<h2>${schedule.name}</h2><p>Your scheduled report has been generated.</p><pre>${JSON.stringify(reportData, null, 2)}</pre>`,
                }),
              });
            }
          }
        }

        results.push({ scheduleId: schedule.id, success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ scheduleId: schedule.id, success: false, error: message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error('Generate scheduled reports error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
