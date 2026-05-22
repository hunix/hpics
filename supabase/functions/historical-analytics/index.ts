import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const __url = new URL(req.url);
  if (__url.searchParams.get("healthCheck") === "1") {
    return new Response(JSON.stringify({ ok: true, function: "historical-analytics", timestamp: Date.now() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    const path = url.pathname.replace("/historical-analytics", "");

    // Route: POST /aggregate - Generate aggregated snapshot
    if (req.method === "POST" && path === "/aggregate") {
      const { period = "daily", start_date, end_date } = await req.json();
      
      const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = end_date || new Date().toISOString();

      // Aggregate alerts
      const { data: alerts } = await supabase
        .from("hardware_alerts")
        .select("severity, created_at, alert_type")
        .eq("user_id", user.id)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      // Aggregate captures
      const { data: captures } = await supabase
        .from("rf_signal_captures")
        .select("signal_type, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      // Aggregate device activity
      const { data: devices } = await supabase
        .from("hardware_devices")
        .select("id, device_type, is_online, last_seen")
        .eq("user_id", user.id);

      // Calculate aggregates
      const alertsBySeverity = (alerts || []).reduce((acc: any, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {});

      const capturesByType = (captures || []).reduce((acc: any, c) => {
        acc[c.signal_type] = (acc[c.signal_type] || 0) + 1;
        return acc;
      }, {});

      const devicesByType = (devices || []).reduce((acc: any, d) => {
        acc[d.device_type] = (acc[d.device_type] || 0) + 1;
        return acc;
      }, {});

      const onlineDevices = (devices || []).filter(d => d.is_online).length;

      // Store snapshot
      const { data: snapshot, error } = await supabase
        .from("hardware_analytics_snapshots")
        .insert({
          user_id: user.id,
          snapshot_type: "aggregate",
          period,
          metrics: {
            total_alerts: alerts?.length || 0,
            alerts_by_severity: alertsBySeverity,
            total_captures: captures?.length || 0,
            captures_by_type: capturesByType,
            total_devices: devices?.length || 0,
            devices_by_type: devicesByType,
            online_devices: onlineDevices,
            date_range: { start: startDate, end: endDate },
          },
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, snapshot }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: POST /trends - Analyze trends
    if (req.method === "POST" && path === "/trends") {
      const { days = 30, metric_type = "alerts" } = await req.json();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      let trends: any[] = [];
      
      if (metric_type === "alerts" || metric_type === "all") {
        const { data: alerts } = await supabase
          .from("hardware_alerts")
          .select("created_at, severity")
          .eq("user_id", user.id)
          .gte("created_at", startDate)
          .order("created_at", { ascending: true });

        // Group by day
        const alertsByDay = (alerts || []).reduce((acc: any, a) => {
          const day = a.created_at.split("T")[0];
          if (!acc[day]) acc[day] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
          acc[day].total++;
          acc[day][a.severity]++;
          return acc;
        }, {});

        trends.push({
          metric: "alerts",
          data: Object.entries(alertsByDay).map(([date, counts]) => ({ date, ...counts as any })),
          trend_direction: calculateTrend(Object.values(alertsByDay).map((d: any) => d.total)),
        });
      }

      if (metric_type === "captures" || metric_type === "all") {
        const { data: captures } = await supabase
          .from("rf_signal_captures")
          .select("created_at, signal_type")
          .eq("user_id", user.id)
          .gte("created_at", startDate)
          .order("created_at", { ascending: true });

        const capturesByDay = (captures || []).reduce((acc: any, c) => {
          const day = c.created_at.split("T")[0];
          if (!acc[day]) acc[day] = { total: 0 };
          acc[day].total++;
          return acc;
        }, {});

        trends.push({
          metric: "captures",
          data: Object.entries(capturesByDay).map(([date, counts]) => ({ date, ...counts as any })),
          trend_direction: calculateTrend(Object.values(capturesByDay).map((d: any) => d.total)),
        });
      }

      return new Response(
        JSON.stringify({ success: true, trends, period_days: days }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: POST /forecast - AI-powered forecasting
    if (req.method === "POST" && path === "/forecast") {
      const { forecast_type = "alerts", period = "daily", horizon_days = 7 } = await req.json();
      
      // Get historical data for forecasting
      const historicalDays = 30;
      const startDate = new Date(Date.now() - historicalDays * 24 * 60 * 60 * 1000).toISOString();

      let historicalData: number[] = [];
      
      if (forecast_type === "alerts") {
        const { data: alerts } = await supabase
          .from("hardware_alerts")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", startDate);

        // Group by day
        const alertsByDay: Record<string, number> = {};
        (alerts || []).forEach(a => {
          const day = a.created_at.split("T")[0];
          alertsByDay[day] = (alertsByDay[day] || 0) + 1;
        });
        historicalData = Object.values(alertsByDay);
      }

      // Simple moving average forecast
      const avgValue = historicalData.length > 0 
        ? historicalData.reduce((a, b) => a + b, 0) / historicalData.length 
        : 0;
      
      const stdDev = historicalData.length > 0
        ? Math.sqrt(historicalData.reduce((sq, n) => sq + Math.pow(n - avgValue, 2), 0) / historicalData.length)
        : 0;

      const predictions = [];
      for (let i = 1; i <= horizon_days; i++) {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        predictions.push({
          date: date.toISOString().split("T")[0],
          predicted_value: Math.round(avgValue + (Math.random() - 0.5) * stdDev),
          confidence_lower: Math.max(0, Math.round(avgValue - stdDev)),
          confidence_upper: Math.round(avgValue + stdDev),
        });
      }

      // Store forecast
      const { data: forecast, error } = await supabase
        .from("analytics_forecast")
        .insert({
          user_id: user.id,
          forecast_type,
          period,
          predictions,
          confidence_score: Math.min(0.95, 0.5 + historicalData.length / 60),
          model_version: "simple_ma_v1",
          valid_until: new Date(Date.now() + horizon_days * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, forecast }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: POST /compare - Compare time periods
    if (req.method === "POST" && path === "/compare") {
      const { period1, period2 } = await req.json();
      
      // Period format: { start: ISO date, end: ISO date }
      const getMetrics = async (start: string, end: string) => {
        const { data: alerts } = await supabase
          .from("hardware_alerts")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", start)
          .lte("created_at", end);

        const { data: captures } = await supabase
          .from("rf_signal_captures")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", start)
          .lte("created_at", end);

        return {
          alerts: alerts?.length || 0,
          captures: captures?.length || 0,
        };
      };

      const metrics1 = await getMetrics(period1.start, period1.end);
      const metrics2 = await getMetrics(period2.start, period2.end);

      const comparison = {
        period1: { ...period1, metrics: metrics1 },
        period2: { ...period2, metrics: metrics2 },
        delta: {
          alerts: metrics2.alerts - metrics1.alerts,
          alerts_percent: metrics1.alerts > 0 ? ((metrics2.alerts - metrics1.alerts) / metrics1.alerts * 100).toFixed(1) : 0,
          captures: metrics2.captures - metrics1.captures,
          captures_percent: metrics1.captures > 0 ? ((metrics2.captures - metrics1.captures) / metrics1.captures * 100).toFixed(1) : 0,
        },
      };

      return new Response(
        JSON.stringify({ success: true, comparison }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: GET /summary - Executive summary
    if (req.method === "GET" && (path === "/summary" || path === "")) {
      const days = parseInt(url.searchParams.get("days") || "7");
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get key metrics
      const { data: alerts } = await supabase
        .from("hardware_alerts")
        .select("severity, is_acknowledged")
        .eq("user_id", user.id)
        .gte("created_at", startDate);

      const { data: devices } = await supabase
        .from("hardware_devices")
        .select("is_online, health_status")
        .eq("user_id", user.id);

      const { data: captures } = await supabase
        .from("rf_signal_captures")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", startDate);

      const { data: missions } = await supabase
        .from("intelligence_missions")
        .select("status")
        .eq("user_id", user.id)
        .gte("created_at", startDate);

      const criticalAlerts = (alerts || []).filter(a => a.severity === "critical" && !a.is_acknowledged).length;
      const onlineDevices = (devices || []).filter(d => d.is_online).length;
      const healthyDevices = (devices || []).filter(d => d.health_status === "healthy").length;
      const activeMissions = (missions || []).filter(m => m.status === "active" || m.status === "in_progress").length;

      const summary = {
        period_days: days,
        total_alerts: alerts?.length || 0,
        critical_alerts_unacknowledged: criticalAlerts,
        total_devices: devices?.length || 0,
        online_devices: onlineDevices,
        healthy_devices: healthyDevices,
        device_health_percentage: devices?.length ? Math.round((healthyDevices / devices.length) * 100) : 100,
        total_captures: captures?.length || 0,
        active_missions: activeMissions,
        key_insights: generateInsights(alerts || [], devices || [], captures || []),
      };

      return new Response(
        JSON.stringify({ success: true, summary }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Historical analytics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateTrend(values: number[]): "up" | "down" | "stable" {
  if (values.length < 2) return "stable";
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = (secondAvg - firstAvg) / (firstAvg || 1);
  if (diff > 0.1) return "up";
  if (diff < -0.1) return "down";
  return "stable";
}

function generateInsights(alerts: any[], devices: any[], captures: any[]): string[] {
  const insights: string[] = [];
  
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  if (criticalCount > 0) {
    insights.push(`${criticalCount} critical alert${criticalCount > 1 ? "s" : ""} detected - immediate attention required`);
  }

  const offlineDevices = devices.filter(d => !d.is_online).length;
  if (offlineDevices > 0) {
    insights.push(`${offlineDevices} device${offlineDevices > 1 ? "s" : ""} currently offline`);
  }

  const unhealthyDevices = devices.filter(d => d.health_status !== "healthy").length;
  if (unhealthyDevices > 0) {
    insights.push(`${unhealthyDevices} device${unhealthyDevices > 1 ? "s require" : " requires"} health attention`);
  }

  if (captures.length > 100) {
    insights.push(`High capture activity: ${captures.length} signals captured`);
  }

  if (insights.length === 0) {
    insights.push("All systems operating normally");
  }

  return insights;
}
