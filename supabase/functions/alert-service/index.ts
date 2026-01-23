import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRule {
  id: string;
  user_id: string;
  rule_name: string;
  rule_type: string;
  conditions: {
    device_type?: string;
    metric?: string;
    operator?: string;
    threshold?: number;
    pattern?: string;
  };
  actions: {
    severity?: string;
    notification_channels?: string[];
    auto_resolve?: boolean;
    cooldown_minutes?: number;
  };
  is_active: boolean;
  priority: number;
  cooldown_minutes: number;
  last_triggered_at?: string;
  trigger_count: number;
}

interface TelemetryData {
  device_id: string;
  device_type: string;
  metrics: {
    battery_level?: number;
    signal_strength?: number;
    temperature?: number;
    error_rate?: number;
    uptime_seconds?: number;
  };
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/alert-service", "");

    // Route: POST / - Process telemetry and evaluate rules
    if (req.method === "POST" && (path === "" || path === "/")) {
      const telemetry: TelemetryData = await req.json();
      
      // Fetch active rules for user
      const { data: rules, error: rulesError } = await supabase
        .from("alert_rules")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("priority", { ascending: true });

      if (rulesError) throw rulesError;

      const triggeredAlerts: any[] = [];
      const now = new Date();

      for (const rule of (rules || []) as AlertRule[]) {
        // Check cooldown
        if (rule.last_triggered_at) {
          const lastTriggered = new Date(rule.last_triggered_at);
          const cooldownMs = (rule.cooldown_minutes || 15) * 60 * 1000;
          if (now.getTime() - lastTriggered.getTime() < cooldownMs) {
            continue;
          }
        }

        // Check device type filter
        if (rule.conditions.device_type && rule.conditions.device_type !== telemetry.device_type) {
          continue;
        }

        // Evaluate condition
        let triggered = false;
        const metric = rule.conditions.metric;
        const value = metric ? telemetry.metrics[metric as keyof typeof telemetry.metrics] : null;

        if (value !== null && value !== undefined && rule.conditions.threshold !== undefined) {
          switch (rule.conditions.operator) {
            case "lt":
              triggered = value < rule.conditions.threshold;
              break;
            case "lte":
              triggered = value <= rule.conditions.threshold;
              break;
            case "gt":
              triggered = value > rule.conditions.threshold;
              break;
            case "gte":
              triggered = value >= rule.conditions.threshold;
              break;
            case "eq":
              triggered = value === rule.conditions.threshold;
              break;
          }
        }

        if (triggered) {
          // Create hardware alert
          const alertData = {
            user_id: user.id,
            device_id: telemetry.device_id,
            alert_type: "rule_triggered",
            severity: rule.actions.severity || "medium",
            title: rule.rule_name,
            description: `Rule "${rule.rule_name}" triggered: ${metric} ${rule.conditions.operator} ${rule.conditions.threshold} (actual: ${value})`,
            metadata: {
              rule_id: rule.id,
              telemetry,
              conditions: rule.conditions,
            },
          };

          const { data: alert, error: alertError } = await supabase
            .from("hardware_alerts")
            .insert(alertData)
            .select()
            .single();

          if (alertError) {
            console.error("Error creating alert:", alertError);
            continue;
          }

          // Update rule trigger info
          await supabase
            .from("alert_rules")
            .update({
              last_triggered_at: now.toISOString(),
              trigger_count: rule.trigger_count + 1,
            })
            .eq("id", rule.id);

          // Queue notifications
          const channels = rule.actions.notification_channels || ["in_app"];
          for (const channel of channels) {
            await supabase.from("alert_notifications").insert({
              user_id: user.id,
              alert_id: alert.id,
              channel,
              status: "pending",
              metadata: { rule_id: rule.id },
            });
          }

          triggeredAlerts.push(alert);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          alerts_triggered: triggeredAlerts.length,
          alerts: triggeredAlerts,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: POST /evaluate-rules - Manual rule evaluation
    if (req.method === "POST" && path === "/evaluate-rules") {
      const { timeframe_minutes = 60 } = await req.json();
      const since = new Date(Date.now() - timeframe_minutes * 60 * 1000).toISOString();

      // Get recent telemetry from device commands/telemetry
      const { data: telemetry } = await supabase
        .from("hardware_device_telemetry")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      // Get active rules
      const { data: rules } = await supabase
        .from("alert_rules")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      return new Response(
        JSON.stringify({
          success: true,
          rules_evaluated: rules?.length || 0,
          telemetry_records: telemetry?.length || 0,
          message: "Rule evaluation completed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: POST /configure-rule - Create/update alert rule
    if (req.method === "POST" && path === "/configure-rule") {
      const ruleData = await req.json();
      
      if (ruleData.id) {
        // Update existing rule
        const { data: rule, error } = await supabase
          .from("alert_rules")
          .update({
            rule_name: ruleData.rule_name,
            rule_type: ruleData.rule_type,
            conditions: ruleData.conditions,
            actions: ruleData.actions,
            is_active: ruleData.is_active,
            priority: ruleData.priority,
            cooldown_minutes: ruleData.cooldown_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ruleData.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, rule }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Create new rule
        const { data: rule, error } = await supabase
          .from("alert_rules")
          .insert({
            user_id: user.id,
            rule_name: ruleData.rule_name,
            rule_type: ruleData.rule_type || "threshold",
            conditions: ruleData.conditions || {},
            actions: ruleData.actions || {},
            is_active: ruleData.is_active ?? true,
            priority: ruleData.priority || 5,
            cooldown_minutes: ruleData.cooldown_minutes || 15,
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, rule }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Route: GET /rules - List user's rules
    if (req.method === "GET" && path === "/rules") {
      const { data: rules, error } = await supabase
        .from("alert_rules")
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: true });

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, rules }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: DELETE /rules/:id - Delete a rule
    if (req.method === "DELETE" && path.startsWith("/rules/")) {
      const ruleId = path.replace("/rules/", "");
      
      const { error } = await supabase
        .from("alert_rules")
        .delete()
        .eq("id", ruleId)
        .eq("user_id", user.id);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Rule deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Alert service error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
