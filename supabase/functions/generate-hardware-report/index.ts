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

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'generate-hardware-report', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
    const path = url.pathname.replace("/generate-hardware-report", "");

    // Route: POST / - Generate report
    if (req.method === "POST" && (path === "" || path === "/")) {
      const { 
        report_type = "daily_summary", 
        format = "json",
        report_name,
        parameters = {} 
      } = await req.json();

      const startDate = parameters.start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = parameters.end_date || new Date().toISOString();
      const deviceIds = parameters.device_ids || [];

      // Create report record
      const { data: report, error: createError } = await supabase
        .from("generated_reports")
        .insert({
          user_id: user.id,
          report_type,
          report_name: report_name || `${report_type}_${new Date().toISOString().split("T")[0]}`,
          format,
          parameters: { start_date: startDate, end_date: endDate, device_ids: deviceIds },
          status: "generating",
        })
        .select()
        .single();

      if (createError) throw createError;

      // Generate report content based on type
      let reportContent: any;

      switch (report_type) {
        case "daily_summary":
          reportContent = await generateDailySummary(supabase, user.id, startDate, endDate);
          break;
        case "device_inventory":
          reportContent = await generateDeviceInventory(supabase, user.id, deviceIds);
          break;
        case "threat_analysis":
          reportContent = await generateThreatAnalysis(supabase, user.id, startDate, endDate);
          break;
        case "mission_report":
          reportContent = await generateMissionReport(supabase, user.id, startDate, endDate, parameters.mission_id);
          break;
        case "full_export":
          reportContent = await generateFullExport(supabase, user.id, startDate, endDate);
          break;
        default:
          reportContent = { error: "Unknown report type" };
      }

      // Format content
      let formattedContent: string;
      if (format === "csv") {
        formattedContent = convertToCSV(reportContent);
      } else if (format === "json") {
        formattedContent = JSON.stringify(reportContent, null, 2);
      } else {
        // For PDF, we'll return structured data that the client can render
        formattedContent = JSON.stringify(reportContent, null, 2);
      }

      // Store report content (in a real scenario, this would upload to storage)
      const { error: updateError } = await supabase
        .from("generated_reports")
        .update({
          status: "completed",
          file_size_bytes: new TextEncoder().encode(formattedContent).length,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", report.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          report_id: report.id,
          content: reportContent,
          formatted_content: formattedContent,
          format,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: GET /status/:reportId - Check report status
    if (req.method === "GET" && path.startsWith("/status/")) {
      const reportId = path.replace("/status/", "");
      
      const { data: report, error } = await supabase
        .from("generated_reports")
        .select("*")
        .eq("id", reportId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, report }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: GET /history - Get report history
    if (req.method === "GET" && path === "/history") {
      const limit = parseInt(url.searchParams.get("limit") || "20");
      
      const { data: reports, error } = await supabase
        .from("generated_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, reports }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Report generation error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateDailySummary(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: alerts } = await supabase
    .from("hardware_alerts")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const { data: devices } = await supabase
    .from("hardware_devices")
    .select("*")
    .eq("user_id", userId);

  const { data: captures } = await supabase
    .from("rf_signal_captures")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  return {
    report_type: "daily_summary",
    generated_at: new Date().toISOString(),
    period: { start: startDate, end: endDate },
    summary: {
      total_alerts: alerts?.length || 0,
      critical_alerts: alerts?.filter((a: any) => a.severity === "critical").length || 0,
      high_alerts: alerts?.filter((a: any) => a.severity === "high").length || 0,
      acknowledged_alerts: alerts?.filter((a: any) => a.is_acknowledged).length || 0,
      total_devices: devices?.length || 0,
      online_devices: devices?.filter((d: any) => d.is_online).length || 0,
      total_captures: captures?.length || 0,
    },
    alerts: alerts || [],
    devices: devices || [],
  };
}

async function generateDeviceInventory(supabase: any, userId: string, deviceIds: string[]) {
  let query = supabase
    .from("hardware_devices")
    .select("*")
    .eq("user_id", userId);

  if (deviceIds.length > 0) {
    query = query.in("id", deviceIds);
  }

  const { data: devices } = await query;

  const { data: healthChecks } = await supabase
    .from("device_health_checks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const devicesWithHealth = (devices || []).map((device: any) => {
    const latestHealth = healthChecks?.find((h: any) => h.device_id === device.id);
    return {
      ...device,
      latest_health_check: latestHealth || null,
    };
  });

  return {
    report_type: "device_inventory",
    generated_at: new Date().toISOString(),
    total_devices: devices?.length || 0,
    devices: devicesWithHealth,
    by_type: (devices || []).reduce((acc: any, d: any) => {
      acc[d.device_type] = (acc[d.device_type] || 0) + 1;
      return acc;
    }, {}),
    by_status: {
      online: devices?.filter((d: any) => d.is_online).length || 0,
      offline: devices?.filter((d: any) => !d.is_online).length || 0,
    },
  };
}

async function generateThreatAnalysis(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: alerts } = await supabase
    .from("hardware_alerts")
    .select("*")
    .eq("user_id", userId)
    .in("severity", ["critical", "high"])
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const { data: fusionEvents } = await supabase
    .from("intelligence_fusion_events")
    .select("*")
    .eq("user_id", userId)
    .in("threat_level", ["critical", "high"])
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const { data: correlations } = await supabase
    .from("cross_device_correlations")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  return {
    report_type: "threat_analysis",
    generated_at: new Date().toISOString(),
    period: { start: startDate, end: endDate },
    threat_summary: {
      critical_alerts: alerts?.filter((a: any) => a.severity === "critical").length || 0,
      high_alerts: alerts?.filter((a: any) => a.severity === "high").length || 0,
      fusion_events: fusionEvents?.length || 0,
      correlations_detected: correlations?.length || 0,
    },
    critical_alerts: alerts?.filter((a: any) => a.severity === "critical") || [],
    high_alerts: alerts?.filter((a: any) => a.severity === "high") || [],
    fusion_events: fusionEvents || [],
    correlations: correlations || [],
  };
}

async function generateMissionReport(supabase: any, userId: string, startDate: string, endDate: string, missionId?: string) {
  let missionQuery = supabase
    .from("intelligence_missions")
    .select("*")
    .eq("user_id", userId);

  if (missionId) {
    missionQuery = missionQuery.eq("id", missionId);
  } else {
    missionQuery = missionQuery
      .gte("created_at", startDate)
      .lte("created_at", endDate);
  }

  const { data: missions } = await missionQuery;

  return {
    report_type: "mission_report",
    generated_at: new Date().toISOString(),
    period: { start: startDate, end: endDate },
    total_missions: missions?.length || 0,
    missions: missions || [],
    by_status: (missions || []).reduce((acc: any, m: any) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {}),
  };
}

async function generateFullExport(supabase: any, userId: string, startDate: string, endDate: string) {
  const [alerts, devices, captures, missions, fusionEvents, correlations, healthChecks] = await Promise.all([
    supabase.from("hardware_alerts").select("*").eq("user_id", userId).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("hardware_devices").select("*").eq("user_id", userId),
    supabase.from("rf_signal_captures").select("*").eq("user_id", userId).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("intelligence_missions").select("*").eq("user_id", userId).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("intelligence_fusion_events").select("*").eq("user_id", userId).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("cross_device_correlations").select("*").eq("user_id", userId).gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("device_health_checks").select("*").eq("user_id", userId).gte("created_at", startDate).lte("created_at", endDate),
  ]);

  return {
    report_type: "full_export",
    generated_at: new Date().toISOString(),
    period: { start: startDate, end: endDate },
    data: {
      alerts: alerts.data || [],
      devices: devices.data || [],
      captures: captures.data || [],
      missions: missions.data || [],
      fusion_events: fusionEvents.data || [],
      correlations: correlations.data || [],
      health_checks: healthChecks.data || [],
    },
    counts: {
      alerts: alerts.data?.length || 0,
      devices: devices.data?.length || 0,
      captures: captures.data?.length || 0,
      missions: missions.data?.length || 0,
      fusion_events: fusionEvents.data?.length || 0,
      correlations: correlations.data?.length || 0,
      health_checks: healthChecks.data?.length || 0,
    },
  };
}

function convertToCSV(data: any): string {
  if (!data || typeof data !== "object") return "";
  
  // For arrays, convert to CSV
  const items = data.alerts || data.devices || data.missions || [];
  if (!Array.isArray(items) || items.length === 0) {
    return JSON.stringify(data);
  }

  const headers = Object.keys(items[0]);
  const csvRows = [headers.join(",")];
  
  for (const item of items) {
    const values = headers.map(h => {
      const val = item[h];
      if (typeof val === "object") return JSON.stringify(val);
      if (typeof val === "string" && val.includes(",")) return `"${val}"`;
      return val ?? "";
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}
