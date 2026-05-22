import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscalationRequest {
  ruleId?: string;
  ruleKey?: string;
  violationReason: string;
  severity: 'warning' | 'critical' | 'emergency';
  context?: Record<string, unknown>;
  profileId?: string;
  functionName?: string;
}

interface EscalationResponse {
  escalationId: string;
  status: 'queued' | 'notified' | 'acknowledged';
  notificationsSent: string[];
  containmentActions: string[];
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({
      ok: true,
      function: 'trigger-escalation',
      timestamp: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const body: EscalationRequest = await req.json();
    const { ruleId, ruleKey, violationReason, severity, context, profileId, functionName } = body;

    if (!violationReason || !severity) {
      return new Response(JSON.stringify({ error: 'violationReason and severity required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate escalation ID
    const escalationId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Determine containment actions based on severity
    const containmentActions: string[] = [];
    let status: 'queued' | 'notified' | 'acknowledged' = 'queued';

    switch (severity) {
      case 'emergency':
        // Immediate containment
        containmentActions.push('pause_all_agents');
        containmentActions.push('enable_kill_switch');
        containmentActions.push('snapshot_system_state');
        containmentActions.push('notify_admin_immediately');
        status = 'notified';
        break;
      
      case 'critical':
        // Elevated containment
        containmentActions.push('pause_affected_function');
        containmentActions.push('increase_monitoring');
        containmentActions.push('queue_admin_notification');
        status = 'notified';
        break;
      
      case 'warning':
        // Standard logging
        containmentActions.push('log_for_review');
        containmentActions.push('add_to_daily_digest');
        status = 'queued';
        break;
    }

    // Execute containment actions
    for (const action of containmentActions) {
      switch (action) {
        case 'pause_all_agents':
        case 'pause_affected_function':
          // Activate kill switch if exists
          await supabase
            .from('agent_kill_switches')
            .update({
              is_enabled: true,
              disabled_at: timestamp,
              disabled_by: 'escalation_workflow',
              reason: violationReason,
              last_activation_at: timestamp,
              activation_count: supabase.sql`activation_count + 1`,
            })
            .eq('user_id', userId)
            .eq('function_name', functionName || 'all');
          break;

        case 'snapshot_system_state':
          // Create a system snapshot for forensics
          await supabase
            .from('system_snapshots')
            .insert({
              user_id: userId,
              snapshot_type: 'escalation',
              trigger_reason: violationReason,
              context_data: context || {},
              created_at: timestamp,
            });
          break;
      }
    }

    // Log the escalation
    await supabase
      .from('escalation_events')
      .insert({
        id: escalationId,
        user_id: userId,
        rule_id: ruleId,
        rule_key: ruleKey,
        violation_reason: violationReason,
        severity,
        profile_id: profileId,
        function_name: functionName,
        context_data: context || {},
        containment_actions: containmentActions,
        status,
        created_at: timestamp,
      });

    // Get notification preferences
    const { data: notifPrefs } = await supabase
      .from('user_preferences')
      .select('notification_email, push_notifications_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    const notificationsSent: string[] = [];

    // Queue notifications based on severity
    if (severity !== 'warning' && notifPrefs) {
      // In-app notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'escalation',
          title: `${severity.toUpperCase()}: Security Escalation`,
          message: violationReason,
          priority: severity === 'emergency' ? 'critical' : 'high',
          data: { escalationId, containmentActions },
          created_at: timestamp,
        });
      notificationsSent.push('in_app');

      // Email notification would be sent via a separate service
      if (notifPrefs.notification_email) {
        notificationsSent.push('email_queued');
      }

      // Push notification would be sent via native push
      if (notifPrefs.push_notifications_enabled) {
        notificationsSent.push('push_queued');
      }
    }

    // Update escalation with notifications
    await supabase
      .from('escalation_events')
      .update({
        notifications_sent: notificationsSent,
        status: notificationsSent.length > 0 ? 'notified' : status,
      })
      .eq('id', escalationId);

    const response: EscalationResponse = {
      escalationId,
      status: notificationsSent.length > 0 ? 'notified' : status,
      notificationsSent,
      containmentActions,
    };

    console.log(`[Escalation] ${severity.toUpperCase()} escalation triggered:`, {
      escalationId,
      ruleKey,
      violationReason: violationReason.substring(0, 100),
      containmentActions,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in trigger-escalation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      escalationId: null,
      status: 'failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
