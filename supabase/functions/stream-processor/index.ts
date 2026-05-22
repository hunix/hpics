/**
 * Stream Processor — Phase 3 Real-Time Intelligence
 *
 * Complex Event Processing (CEP) engine that:
 *   1. Receives intelligence events from other edge functions
 *   2. Evaluates CEP rules for event correlation within time windows
 *   3. Computes anomaly scores based on behavioral baselines
 *   4. Generates composite threat assessments
 *   5. Emits derived events (ThreatDetected, escalations)
 *   6. Builds temporal attack graph nodes
 *
 * Actions:
 *   - emit_event: Record a new intelligence event
 *   - process_rules: Run CEP rules against recent events for a user
 *   - compute_anomaly: Score an interaction against behavioral baseline
 *   - assess_threat: Generate/update composite threat assessment for a contact
 *   - get_feed: Get recent intelligence events (paginated)
 *   - acknowledge: Mark event as acknowledged
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logLLMObservability, startTimer } from "../_shared/llm-observability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_BASE_URL = "https://ai.gateway.lovable.dev/v1";

// ──────────────────────────────────────────────────────────────────────────────
// Emit Event
// ──────────────────────────────────────────────────────────────────────────────

async function emitEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("intelligence_events")
    .insert({
      user_id: userId,
      profile_id: params.profileId ?? null,
      event_type: params.eventType,
      severity: params.severity ?? "info",
      title: params.title,
      description: params.description ?? null,
      raw_data: params.rawData ?? {},
      source_function: params.sourceFunction ?? "stream-processor",
      source_type: params.sourceType ?? "internal",
      correlation_id: params.correlationId ?? null,
      anomaly_score: params.anomalyScore ?? null,
      baseline_deviation: params.baselineDeviation ?? null,
      occurred_at: params.occurredAt ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to emit event: ${error.message}`);
  return data;
}

// ──────────────────────────────────────────────────────────────────────────────
// CEP Rules Engine
// ──────────────────────────────────────────────────────────────────────────────

async function processRules(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  profileId?: string,
) {
  // Load active CEP rules
  const { data: rules } = await supabase
    .from("cep_rules")
    .select("*")
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (!rules?.length) return { triggered: [], evaluated: 0 };

  const triggered: Array<{ ruleId: string; ruleName: string; outputEvent: Record<string, unknown> }> = [];

  for (const rule of rules) {
    const windowCutoff = new Date(Date.now() - rule.time_window_hours * 60 * 60 * 1000).toISOString();

    // Query events matching trigger types within time window
    let query = supabase
      .from("intelligence_events")
      .select("id, event_type, profile_id, severity, anomaly_score, occurred_at, title, raw_data")
      .eq("user_id", userId)
      .in("event_type", rule.trigger_events)
      .gte("occurred_at", windowCutoff)
      .order("occurred_at", { ascending: false })
      .limit(50);

    if (profileId) {
      query = query.eq("profile_id", profileId);
    }

    const { data: matchingEvents } = await query;

    if (!matchingEvents || matchingEvents.length < rule.min_event_count) continue;

    // Apply additional condition expression if present
    if (rule.condition_expression) {
      const cond = rule.condition_expression as { field: string; op: string; value: number };
      const filtered = matchingEvents.filter((e) => {
        const val = (e as Record<string, unknown>)[cond.field] as number;
        if (val === null || val === undefined) return false;
        switch (cond.op) {
          case ">": return val > cond.value;
          case "<": return val < cond.value;
          case ">=": return val >= cond.value;
          case "==": return val === cond.value;
          default: return true;
        }
      });
      if (filtered.length < rule.min_event_count) continue;
    }

    // Rule triggered — emit derived event
    const affectedProfile = profileId ?? matchingEvents[0]?.profile_id;
    const outputTitle = rule.output_title_template
      .replace("{contact_name}", affectedProfile ?? "Unknown")
      .replace("{count}", String(matchingEvents.length));

    const outputEvent = await emitEvent(supabase, userId, {
      profileId: affectedProfile,
      eventType: rule.output_event_type,
      severity: rule.output_severity,
      title: outputTitle,
      description: rule.output_description_template,
      sourceType: "cep_rule",
      sourceFunction: "stream-processor",
      rawData: {
        cep_rule_id: rule.id,
        cep_rule_name: rule.rule_name,
        trigger_event_ids: matchingEvents.slice(0, 10).map((e) => e.id),
        trigger_event_count: matchingEvents.length,
      },
    });

    // Update rule stats
    await supabase
      .from("cep_rules")
      .update({
        times_triggered: (rule.times_triggered ?? 0) + 1,
        last_triggered_at: new Date().toISOString(),
      })
      .eq("id", rule.id);

    triggered.push({ ruleId: rule.id, ruleName: rule.rule_name, outputEvent });
  }

  return { triggered, evaluated: rules.length };
}

// ──────────────────────────────────────────────────────────────────────────────
// Anomaly Scoring
// ──────────────────────────────────────────────────────────────────────────────

async function computeAnomaly(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  profileId: string,
  interaction: Record<string, unknown>,
) {
  // Get behavioral baseline from contact_behavioral_states
  const { data: state } = await supabase
    .from("contact_behavioral_states")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (!state) return { anomalyScore: 0, baselineDeviation: 0, details: "No baseline available" };

  // Compare current interaction metrics to baseline
  const dimensions: Array<{ name: string; current: number; baseline: number }> = [];

  if (typeof interaction.trust_signal === "number") {
    dimensions.push({
      name: "trust",
      current: interaction.trust_signal as number,
      baseline: (state as Record<string, unknown>).trust_score as number ?? 50,
    });
  }
  if (typeof interaction.stress_signal === "number") {
    dimensions.push({
      name: "stress",
      current: interaction.stress_signal as number,
      baseline: (state as Record<string, unknown>).stress_level as number ?? 30,
    });
  }
  if (typeof interaction.deception_signal === "number") {
    dimensions.push({
      name: "deception",
      current: interaction.deception_signal as number,
      baseline: (state as Record<string, unknown>).deception_risk as number ?? 20,
    });
  }

  if (dimensions.length === 0) {
    return { anomalyScore: 0, baselineDeviation: 0, details: "No measurable dimensions" };
  }

  // Compute deviation (simple z-score-like approach with assumed σ=15)
  const sigma = 15;
  const deviations = dimensions.map((d) => Math.abs(d.current - d.baseline) / sigma);
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const anomalyScore = Math.min(100, Math.round(avgDeviation * 30));

  // Auto-emit event if anomaly is significant
  if (anomalyScore >= 60) {
    await emitEvent(supabase, userId, {
      profileId,
      eventType: "BehaviorAnomaly",
      severity: anomalyScore >= 80 ? "high" : "medium",
      title: `Behavioral anomaly detected (score: ${anomalyScore})`,
      description: `Dimensions: ${dimensions.map((d) => `${d.name}: ${d.current} vs baseline ${d.baseline}`).join(", ")}`,
      sourceType: "behavioral",
      anomalyScore,
      baselineDeviation: avgDeviation,
    });
  }

  return {
    anomalyScore,
    baselineDeviation: Math.round(avgDeviation * 100) / 100,
    dimensions: dimensions.map((d) => ({
      name: d.name,
      current: d.current,
      baseline: d.baseline,
      deviation: Math.abs(d.current - d.baseline),
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Threat Assessment
// ──────────────────────────────────────────────────────────────────────────────

async function assessThreat(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  profileId: string,
) {
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date().toISOString();

  // Gather recent events for this contact
  const { data: events } = await supabase
    .from("intelligence_events")
    .select("*")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .gte("occurred_at", windowStart)
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (!events?.length) {
    return { threat_level: "minimal", threat_score: 0, message: "No events in assessment window" };
  }

  // Compute dimension scores from event types
  const typeScores: Record<string, number[]> = {};
  for (const e of events) {
    const rec = e as Record<string, unknown>;
    const type = rec.event_type as string;
    const anomaly = (rec.anomaly_score as number) ?? 0;
    const sevWeight = { info: 0.1, low: 0.3, medium: 0.5, high: 0.8, critical: 1.0 }[rec.severity as string] ?? 0.3;
    if (!typeScores[type]) typeScores[type] = [];
    typeScores[type].push(anomaly * sevWeight);
  }

  const avgScore = (scores: number[]) =>
    scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const deception = avgScore(typeScores["DeceptionMarker"] ?? []);
  const financial = avgScore(typeScores["FinancialAnomaly"] ?? []);
  const operational = avgScore([
    ...typeScores["TravelDetected"] ?? [],
    ...typeScores["CommunicationPattern"] ?? [],
  ]);
  const loyalty = avgScore(typeScores["BehaviorAnomaly"] ?? []);
  const external = avgScore(typeScores["OSINTHit"] ?? []);

  const overallScore = Math.min(100, Math.round(
    deception * 0.25 + financial * 0.2 + operational * 0.2 + loyalty * 0.2 + external * 0.15
  ));

  const threatLevel =
    overallScore >= 80 ? "critical" :
    overallScore >= 60 ? "high" :
    overallScore >= 40 ? "elevated" :
    overallScore >= 20 ? "medium" :
    overallScore >= 10 ? "low" : "minimal";

  // Get previous assessment for delta
  const { data: prev } = await supabase
    .from("threat_assessments")
    .select("id, threat_score")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: assessment } = await supabase
    .from("threat_assessments")
    .insert({
      user_id: userId,
      profile_id: profileId,
      overall_threat_level: threatLevel,
      threat_score: overallScore,
      deception_threat: Math.round(deception),
      financial_threat: Math.round(financial),
      operational_threat: Math.round(operational),
      loyalty_threat: Math.round(loyalty),
      external_threat: Math.round(external),
      contributing_events: events.slice(0, 20).map((e) => ({
        event_id: (e as Record<string, unknown>).id,
        weight: ((e as Record<string, unknown>).anomaly_score as number) ?? 0,
        description: (e as Record<string, unknown>).title,
      })),
      assessment_window_start: windowStart,
      assessment_window_end: windowEnd,
      previous_assessment_id: prev?.id ?? null,
      score_delta: prev ? overallScore - (prev.threat_score as number) : null,
    })
    .select()
    .single();

  return assessment;
}

// ──────────────────────────────────────────────────────────────────────────────
// Get Feed (paginated)
// ──────────────────────────────────────────────────────────────────────────────

async function getFeed(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: Record<string, unknown>,
) {
  const limit = Math.min((params.limit as number) ?? 20, 50);
  const offset = (params.offset as number) ?? 0;
  const profileId = params.profileId as string | undefined;
  const eventTypes = params.eventTypes as string[] | undefined;
  const severities = params.severities as string[] | undefined;
  const unacknowledgedOnly = params.unacknowledgedOnly as boolean ?? false;

  let query = supabase
    .from("intelligence_events")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (profileId) query = query.eq("profile_id", profileId);
  if (eventTypes?.length) query = query.in("event_type", eventTypes);
  if (severities?.length) query = query.in("severity", severities);
  if (unacknowledgedOnly) query = query.eq("acknowledged", false);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to get feed: ${error.message}`);

  return { events: data ?? [], total: count ?? 0 };
}

// ──────────────────────────────────────────────────────────────────────────────
// Acknowledge Event
// ──────────────────────────────────────────────────────────────────────────────

async function acknowledgeEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  eventId: string,
  notes?: string,
) {
  const updates: Record<string, unknown> = {
    acknowledged: true,
    acknowledged_at: new Date().toISOString(),
  };
  if (notes) {
    updates.resolved = true;
    updates.resolution_notes = notes;
  }

  const { error } = await supabase
    .from("intelligence_events")
    .update(updates)
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to acknowledge: ${error.message}`);
  return { acknowledged: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const timer = startTimer();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let result: unknown;

    switch (action) {
      case "emit_event":
        result = await emitEvent(supabase, user.id, params);
        break;

      case "process_rules":
        result = await processRules(supabase, user.id, params.profileId);
        break;

      case "compute_anomaly":
        if (!params.profileId) throw new Error("profileId required");
        result = await computeAnomaly(supabase, user.id, params.profileId, params.interaction ?? {});
        break;

      case "assess_threat":
        if (!params.profileId) throw new Error("profileId required");
        result = await assessThreat(supabase, user.id, params.profileId);
        break;

      case "get_feed":
        result = await getFeed(supabase, user.id, params);
        break;

      case "acknowledge":
        if (!params.eventId) throw new Error("eventId required");
        result = await acknowledgeEvent(supabase, user.id, params.eventId, params.notes);
        break;

      default:
        return new Response(JSON.stringify({
          error: `Unknown action: ${action}`,
          available: ["emit_event", "process_rules", "compute_anomaly", "assess_threat", "get_feed", "acknowledge"],
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    logLLMObservability({
      userId: user.id,
      edgeFunction: "stream-processor",
      model: "none",
      latencyMs: timer(),
      success: true,
      searchMethod: action,
    }).catch(() => null);

    return new Response(JSON.stringify({ success: true, action, ...result as Record<string, unknown> }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stream-processor] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
