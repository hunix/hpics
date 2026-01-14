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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "verify_audit_chain":
        return await verifyAuditChain(supabase, user.id, params);
      case "get_security_dashboard":
        return await getSecurityDashboard(supabase, user.id);
      case "log_security_event":
        return await logSecurityEvent(supabase, user.id, params);
      case "get_tamper_alerts":
        return await getTamperAlerts(supabase, user.id);
      case "rotate_encryption_key":
        return await rotateEncryptionKey(supabase, user.id, params);
      case "classify_data":
        return await classifyData(supabase, user.id, params);
      case "get_field_access_controls":
        return await getFieldAccessControls(supabase, user.id);
      case "set_field_access_control":
        return await setFieldAccessControl(supabase, user.id, params);
      case "check_data_residency":
        return await checkDataResidency(supabase, user.id, params.profileId);
      case "run_security_scan":
        return await runSecurityScan(supabase, user.id);
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Security monitor error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyAuditChain(supabase: any, userId: string, params: any) {
  const { startDate, endDate } = params;

  // Get audit logs in order
  const { data: logs, error } = await supabase
    .from("immutable_audit_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate || "1970-01-01")
    .lte("created_at", endDate || new Date().toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  let isValid = true;
  let brokenAt = null;
  let brokenId = null;
  let prevHash: string | null = null;

  for (const log of logs || []) {
    if (prevHash !== null && log.previous_hash !== prevHash) {
      isValid = false;
      brokenAt = log.created_at;
      brokenId = log.id;
      break;
    }
    prevHash = log.current_hash;
  }

  // Record verification
  await supabase.from("audit_chain_verifications").insert({
    user_id: userId,
    verification_type: "manual",
    start_date: startDate,
    end_date: endDate,
    total_entries_checked: logs?.length || 0,
    valid_entries: isValid ? logs?.length || 0 : 0,
    invalid_entries: isValid ? 0 : 1,
    first_broken_at: brokenAt,
    broken_entry_id: brokenId,
    status: isValid ? "valid" : "broken",
    completed_at: new Date().toISOString(),
  });

  // Log security event
  await supabase.from("security_events").insert({
    user_id: userId,
    event_type: "audit_verification",
    severity: isValid ? "info" : "critical",
    action_taken: "verify_chain",
    action_successful: true,
    metadata: { totalChecked: logs?.length, isValid, brokenAt },
  });

  return new Response(JSON.stringify({
    success: true,
    isValid,
    totalChecked: logs?.length || 0,
    brokenAt,
    brokenId,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getSecurityDashboard(supabase: any, userId: string) {
  // Get recent security events
  const { data: recentEvents } = await supabase
    .from("security_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get unresolved tamper alerts
  const { data: tamperAlerts } = await supabase
    .from("tamper_detection_alerts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_resolved", false);

  // Get last audit verification
  const { data: lastVerification } = await supabase
    .from("audit_chain_verifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get encryption key status
  const { data: keyStatus } = await supabase
    .from("encryption_key_rotations")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get data classification stats
  const { data: classifications } = await supabase
    .from("data_classification_tags")
    .select("classification")
    .eq("user_id", userId);

  const classificationCounts: Record<string, number> = {};
  for (const c of classifications || []) {
    classificationCounts[c.classification] = (classificationCounts[c.classification] || 0) + 1;
  }

  // Calculate security score
  let securityScore = 100;
  if ((tamperAlerts?.length || 0) > 0) securityScore -= 30;
  if (lastVerification?.status === "broken") securityScore -= 25;
  if (!keyStatus) securityScore -= 15;
  const criticalEvents = (recentEvents || []).filter((e: any) => e.severity === "critical").length;
  securityScore -= criticalEvents * 5;
  securityScore = Math.max(0, securityScore);

  return new Response(JSON.stringify({
    success: true,
    securityScore,
    recentEvents: recentEvents || [],
    tamperAlerts: tamperAlerts || [],
    lastVerification,
    keyStatus,
    classificationCounts,
    stats: {
      totalEvents: recentEvents?.length || 0,
      criticalEvents,
      unresolvedAlerts: tamperAlerts?.length || 0,
      lastVerificationStatus: lastVerification?.status || "never",
      encryptionKeyVersion: keyStatus?.key_version || 0,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logSecurityEvent(supabase: any, userId: string, params: any) {
  const { eventType, severity, resourceType, resourceId, actionTaken, metadata } = params;

  const { data, error } = await supabase
    .from("security_events")
    .insert({
      user_id: userId,
      event_type: eventType,
      severity: severity || "info",
      resource_type: resourceType,
      resource_id: resourceId,
      action_taken: actionTaken,
      action_successful: true,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, event: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getTamperAlerts(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("tamper_detection_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("detected_at", { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    alerts: data || [],
    unresolvedCount: (data || []).filter((a: any) => !a.is_resolved).length,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function rotateEncryptionKey(supabase: any, userId: string, params: any) {
  const { affectedTables } = params;

  // Mark current key as rotating
  await supabase
    .from("encryption_key_rotations")
    .update({ status: "rotating", rotated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");

  // Create new key version
  const { data: currentKey } = await supabase
    .from("encryption_key_rotations")
    .select("key_version")
    .eq("user_id", userId)
    .order("key_version", { ascending: false })
    .limit(1)
    .single();

  const newVersion = (currentKey?.key_version || 0) + 1;

  const { data: newKey, error } = await supabase
    .from("encryption_key_rotations")
    .insert({
      user_id: userId,
      key_version: newVersion,
      algorithm: "AES-256-GCM",
      status: "active",
      affected_tables: affectedTables || [],
      rotation_started_by: "user",
    })
    .select()
    .single();

  if (error) throw error;

  // Retire old key
  await supabase
    .from("encryption_key_rotations")
    .update({ status: "retired", rotation_completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "rotating");

  // Log security event
  await supabase.from("security_events").insert({
    user_id: userId,
    event_type: "key_rotation",
    severity: "info",
    action_taken: "rotate_key",
    action_successful: true,
    metadata: { newVersion, affectedTables },
  });

  return new Response(JSON.stringify({
    success: true,
    newKeyVersion: newVersion,
    key: newKey,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function classifyData(supabase: any, userId: string, params: any) {
  const { tableName, columnName, classification, requiresEncryption, piiType, retentionDays } = params;

  const { data, error } = await supabase
    .from("data_classification_tags")
    .upsert({
      user_id: userId,
      table_name: tableName,
      column_name: columnName,
      classification,
      requires_encryption: requiresEncryption || false,
      pii_type: piiType,
      retention_days: retentionDays,
    }, { onConflict: "user_id,table_name,column_name" })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, classification: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getFieldAccessControls(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("field_access_controls")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, controls: data || [] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function setFieldAccessControl(supabase: any, userId: string, params: any) {
  const { tableName, fieldName, requiredClearance, requiredRoles, encryptionRequired, maskPattern } = params;

  const { data, error } = await supabase
    .from("field_access_controls")
    .upsert({
      user_id: userId,
      table_name: tableName,
      field_name: fieldName,
      required_clearance: requiredClearance,
      required_roles: requiredRoles,
      encryption_required: encryptionRequired,
      mask_pattern: maskPattern,
    }, { onConflict: "user_id,table_name,field_name" })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, control: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function checkDataResidency(supabase: any, userId: string, profileId: string) {
  const { data, error } = await supabase
    .from("data_residency_controls")
    .select("*")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return new Response(JSON.stringify({
    success: true,
    residencyControl: data || null,
    hasControl: !!data,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function runSecurityScan(supabase: any, userId: string) {
  const findings: any[] = [];
  
  // Check for unverified audit chain
  const { data: lastVerification } = await supabase
    .from("audit_chain_verifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastVerification) {
    findings.push({
      type: "missing_verification",
      severity: "warning",
      message: "Audit chain has never been verified",
      recommendation: "Run audit chain verification",
    });
  } else if (lastVerification.status === "broken") {
    findings.push({
      type: "broken_chain",
      severity: "critical",
      message: "Audit chain integrity is broken",
      recommendation: "Investigate tampered records immediately",
    });
  }

  // Check for missing encryption key
  const { data: keyStatus } = await supabase
    .from("encryption_key_rotations")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!keyStatus) {
    findings.push({
      type: "no_encryption_key",
      severity: "warning",
      message: "No active encryption key found",
      recommendation: "Initialize encryption key rotation",
    });
  } else {
    const keyAge = Date.now() - new Date(keyStatus.created_at).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (keyAge > thirtyDays) {
      findings.push({
        type: "old_encryption_key",
        severity: "info",
        message: "Encryption key is older than 30 days",
        recommendation: "Consider rotating encryption key",
      });
    }
  }

  // Check for unclassified sensitive tables
  const sensitiveTables = ["profiles", "contact_methods", "communications", "documents"];
  const { data: classifications } = await supabase
    .from("data_classification_tags")
    .select("table_name")
    .eq("user_id", userId);

  const classifiedTables = new Set((classifications || []).map((c: any) => c.table_name));
  for (const table of sensitiveTables) {
    if (!classifiedTables.has(table)) {
      findings.push({
        type: "unclassified_table",
        severity: "info",
        message: `Table '${table}' has no data classification`,
        recommendation: `Add classification for ${table}`,
      });
    }
  }

  // Check for unresolved tamper alerts
  const { data: unresolvedAlerts } = await supabase
    .from("tamper_detection_alerts")
    .select("id")
    .eq("user_id", userId)
    .eq("is_resolved", false);

  if ((unresolvedAlerts?.length || 0) > 0) {
    findings.push({
      type: "unresolved_alerts",
      severity: "critical",
      message: `${unresolvedAlerts?.length} unresolved tamper detection alerts`,
      recommendation: "Review and resolve tamper alerts immediately",
    });
  }

  // Log scan
  await supabase.from("security_events").insert({
    user_id: userId,
    event_type: "security_scan",
    severity: findings.some(f => f.severity === "critical") ? "warning" : "info",
    action_taken: "full_scan",
    action_successful: true,
    metadata: { findingsCount: findings.length, findings },
  });

  return new Response(JSON.stringify({
    success: true,
    findings,
    summary: {
      total: findings.length,
      critical: findings.filter(f => f.severity === "critical").length,
      warnings: findings.filter(f => f.severity === "warning").length,
      info: findings.filter(f => f.severity === "info").length,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
