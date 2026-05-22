/**
 * Autonomy Engine — Phase 5 Edge Function
 *
 * Goal-directed intelligence, proactive briefings, memory consolidation,
 * adaptive prompt evolution, and convergence gap detection:
 *
 *   - create_goal: Define a strategic intelligence objective
 *   - execute_goal: Run autonomous sub-task generation + agent dispatch
 *   - generate_briefing: Produce daily proactive intelligence briefing
 *   - consolidate_memory: Compress episodic → semantic, prune low-confidence
 *   - compute_convergence: Gap analysis for a contact's intelligence picture
 *   - evolve_prompts: Multi-armed bandit prompt selection + UCB update
 *   - dashboard_stats: Return aggregated stats from materialized views
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
// LLM Call Helper
// ──────────────────────────────────────────────────────────────────────────────

async function callLLM(system: string, user: string, model = "gpt-4o-mini", temp = 0.4, maxTokens = 2000) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");
  const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: temp, max_tokens: maxTokens,
    }),
  });
  if (!resp.ok) throw new Error(`LLM error ${resp.status}`);
  const json = await resp.json();
  return json.choices?.[0]?.message?.content ?? "";
}

function parseJSON(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()); }
  catch { return { raw_output: raw }; }
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. Strategic Goals
// ──────────────────────────────────────────────────────────────────────────────

async function createGoal(supabase: ReturnType<typeof createClient>, userId: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.from("strategic_goals").insert({
    user_id: userId,
    profile_id: params.profileId ?? null,
    title: params.title,
    description: params.description ?? null,
    goal_type: params.goalType ?? "investigation",
    priority: params.priority ?? "medium",
    execution_frequency: params.frequency ?? "daily",
    next_execution_at: new Date(Date.now() + 3600000).toISOString(),
  }).select().single();
  if (error) throw new Error(`Create goal failed: ${error.message}`);
  return data;
}

async function executeGoal(supabase: ReturnType<typeof createClient>, userId: string, goalId: string) {
  const { data: goal, error } = await supabase.from("strategic_goals").select("*").eq("id", goalId).eq("user_id", userId).single();
  if (error || !goal) throw new Error("Goal not found");

  const rec = goal as Record<string, unknown>;

  // Use LLM to decompose goal into sub-tasks
  const decomposition = await callLLM(
    `You are an intelligence operations planner. Decompose the following strategic goal into 3-5 actionable sub-tasks.
Return JSON: {"sub_tasks": [{"id": "st1", "description": "...", "assigned_agent": "researcher|analyst|strategist", "priority": "high|medium|low"}], "estimated_completeness": 0-100}`,
    `Goal: ${rec.title}\nDescription: ${rec.description ?? "None"}\nContact ID: ${rec.profile_id ?? "General"}\nCurrent progress: ${rec.progress_pct ?? 0}%\nExisting findings: ${JSON.stringify((rec.findings as unknown[])?.slice(0, 5) ?? [])}`,
    "gpt-4o", 0.5, 2000,
  );

  const parsed = parseJSON(decomposition);
  const subTasks = Array.isArray(parsed.sub_tasks) ? parsed.sub_tasks : [];

  // Execute each sub-task by invoking the AGIS orchestrator
  const results: Array<Record<string, unknown>> = [];
  for (const task of subTasks.slice(0, 3)) {
    try {
      const { data: result } = await supabase.functions.invoke("agis-orchestrator", {
        body: {
          goal: `${rec.title}: ${(task as Record<string, unknown>).description}`,
          profileId: rec.profile_id ?? "general",
          mode: "standard",
        },
      });
      results.push({ task, result: result?.report ?? null, success: true });
    } catch {
      results.push({ task, success: false });
    }
  }

  // Update goal with findings
  const newFindings = results
    .filter((r) => r.success && r.result)
    .map((r) => ({
      finding: ((r.result as Record<string, unknown>)?.executive_summary as string)?.slice(0, 500) ?? "Completed",
      confidence: (r.result as Record<string, unknown>)?.confidence_score ?? 50,
      source: "agis-orchestrator",
      timestamp: new Date().toISOString(),
    }));

  const existingFindings = (rec.findings as unknown[]) ?? [];
  const progress = Math.min(100, (rec.progress_pct as number ?? 0) + (parsed.estimated_completeness as number ?? 20));

  await supabase.from("strategic_goals").update({
    sub_tasks: subTasks,
    findings: [...existingFindings, ...newFindings],
    progress_pct: progress,
    last_execution_at: new Date().toISOString(),
    executions_count: ((rec.executions_count as number) ?? 0) + 1,
    status: progress >= 100 ? "completed" : "active",
    completed_at: progress >= 100 ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", goalId);

  return { goal_id: goalId, sub_tasks_executed: results.length, new_findings: newFindings.length, progress };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Proactive Briefing
// ──────────────────────────────────────────────────────────────────────────────

async function generateBriefing(supabase: ReturnType<typeof createClient>, userId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Check if briefing already exists
  const { data: existing } = await supabase.from("intelligence_briefings").select("id").eq("user_id", userId).eq("briefing_date", today).single();
  if (existing) return { briefing_id: existing.id, already_generated: true };

  // Gather intelligence inputs
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const [events, threats, goals, sessions] = await Promise.all([
    supabase.from("intelligence_events").select("event_type, severity, title, profile_id, anomaly_score").eq("user_id", userId).gte("occurred_at", yesterday).order("severity").limit(20),
    supabase.from("threat_assessments").select("profile_id, overall_threat_level, threat_score, score_delta").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("strategic_goals").select("title, progress_pct, status, priority").eq("user_id", userId).eq("status", "active").limit(10),
    supabase.from("agent_sessions").select("goal, confidence_score, status").eq("user_id", userId).gte("created_at", yesterday).limit(5),
  ]);

  const briefingInput = {
    date: today,
    recent_events: events.data ?? [],
    active_threats: threats.data ?? [],
    active_goals: goals.data ?? [],
    recent_sessions: sessions.data ?? [],
  };

  const briefingContent = await callLLM(
    `You are a senior intelligence analyst producing a daily morning briefing.
Generate a structured briefing in JSON:
{
  "headline": "One-line summary of intelligence posture",
  "priority_contacts": [{"name_or_id": "...", "reason": "...", "recommended_action": "...", "urgency": "immediate|today|this_week"}],
  "emerging_threats": [{"threat": "...", "severity": "...", "sources": "..."}],
  "opportunity_windows": [{"opportunity": "...", "window": "...", "confidence": 0-100}],
  "behavioral_changes": [{"contact_or_id": "...", "change": "...", "significance": "..."}],
  "collection_priorities": [{"gap": "...", "suggested_action": "...", "priority": "high|medium|low"}],
  "overall_assessment": "2-3 sentence overall intelligence posture assessment"
}`,
    JSON.stringify(briefingInput),
    "gpt-4o", 0.4, 3000,
  );

  const parsed = parseJSON(briefingContent);

  const { data: briefing } = await supabase.from("intelligence_briefings").insert({
    user_id: userId,
    briefing_date: today,
    headline: parsed.headline ?? "Daily Intelligence Briefing",
    priority_contacts: parsed.priority_contacts ?? [],
    emerging_threats: parsed.emerging_threats ?? [],
    opportunity_windows: parsed.opportunity_windows ?? [],
    behavioral_changes: parsed.behavioral_changes ?? [],
    collection_priorities: parsed.collection_priorities ?? [],
    overall_assessment: parsed.overall_assessment ?? "No significant developments.",
    full_content: JSON.stringify(parsed),
    event_count: (events.data ?? []).length,
    threat_count: (threats.data ?? []).length,
  }).select().single();

  return { briefing_id: briefing?.id, generated: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Memory Consolidation
// ──────────────────────────────────────────────────────────────────────────────

async function consolidateMemory(supabase: ReturnType<typeof createClient>, userId: string) {
  const timer = startTimer();

  const { data: log } = await supabase.from("memory_consolidation_log").insert({
    user_id: userId, run_type: "manual", status: "running",
  }).select().single();

  try {
    // 1. Get recent episodic events not yet consolidated
    const { data: episodes } = await supabase
      .from("intelligence_memory_events")
      .select("*")
      .eq("user_id", userId)
      .eq("is_consolidated", false)
      .order("occurred_at", { ascending: false })
      .limit(100);

    const episodeCount = episodes?.length ?? 0;
    let factsCreated = 0;
    let factsPruned = 0;

    if (episodeCount > 0) {
      // Group episodes by profile_id
      const byProfile: Record<string, Record<string, unknown>[]> = {};
      for (const ep of (episodes ?? []) as Record<string, unknown>[]) {
        const pid = (ep.profile_id as string) ?? "general";
        if (!byProfile[pid]) byProfile[pid] = [];
        byProfile[pid].push(ep);
      }

      // For each profile group, extract semantic facts
      for (const [profileId, eps] of Object.entries(byProfile)) {
        const summary = eps.map((e) => `[${e.event_type}] ${e.description ?? e.event_type}`).join("\n");

        const extraction = await callLLM(
          `You are a memory consolidation agent. Extract durable semantic facts from these episodic events.
Return JSON: {"facts": [{"fact": "...", "confidence": 0-100, "category": "behavioral|financial|relational|operational|personal", "source_events": []}]}
Only extract facts that are stable truths, not ephemeral observations.`,
          `Events for profile ${profileId}:\n${summary}`,
          "gpt-4o-mini", 0.3, 1500,
        );

        const parsed = parseJSON(extraction);
        const facts = Array.isArray(parsed.facts) ? parsed.facts : [];

        for (const fact of facts) {
          await supabase.from("semantic_memory_facts").insert({
            user_id: userId,
            profile_id: profileId === "general" ? null : profileId,
            fact_text: (fact as Record<string, unknown>).fact,
            category: (fact as Record<string, unknown>).category ?? "behavioral",
            confidence: ((fact as Record<string, unknown>).confidence as number ?? 50) / 100,
            source_type: "consolidation",
          }).catch(() => null);
          factsCreated++;
        }

        // Mark episodes as consolidated
        const epIds = eps.map((e) => e.id);
        await supabase.from("intelligence_memory_events").update({ is_consolidated: true }).in("id", epIds).catch(() => null);
      }
    }

    // 2. Prune low-confidence facts (below 0.2)
    const { data: pruned } = await supabase
      .from("semantic_memory_facts")
      .delete()
      .eq("user_id", userId)
      .lt("confidence", 0.2)
      .select("id");
    factsPruned = pruned?.length ?? 0;

    const durationMs = timer();

    await supabase.from("memory_consolidation_log").update({
      status: "completed",
      episodic_events_processed: episodeCount,
      semantic_facts_created: factsCreated,
      low_confidence_pruned: factsPruned,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    }).eq("id", (log as Record<string, unknown>)?.id);

    return { episodes_processed: episodeCount, facts_created: factsCreated, facts_pruned: factsPruned, duration_ms: durationMs };

  } catch (err) {
    await supabase.from("memory_consolidation_log").update({ status: "failed" }).eq("id", (log as Record<string, unknown>)?.id).catch(() => null);
    throw err;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Intelligence Convergence
// ──────────────────────────────────────────────────────────────────────────────

async function computeConvergence(supabase: ReturnType<typeof createClient>, userId: string, profileId: string) {
  // Gather all intelligence dimensions
  const [observations, biometrics, osint, events, facts, reports] = await Promise.all([
    supabase.from("contact_observations").select("observation_type").eq("profile_id", profileId).limit(200),
    supabase.from("biometric_embeddings").select("modality").eq("profile_id", profileId).eq("is_active", true),
    supabase.from("osint_mentions").select("source_type").eq("profile_id", profileId),
    supabase.from("intelligence_events").select("event_type").eq("profile_id", profileId).limit(100),
    supabase.from("semantic_memory_facts").select("category").eq("profile_id", profileId),
    supabase.from("intelligence_reports").select("id").eq("profile_id", profileId),
  ]);

  const obsTypes = new Set((observations.data ?? []).map((o) => (o as Record<string, unknown>).observation_type));
  const bioModalities = new Set((biometrics.data ?? []).map((b) => (b as Record<string, unknown>).modality));
  const osintTypes = new Set((osint.data ?? []).map((o) => (o as Record<string, unknown>).source_type));
  const factCats = new Set((facts.data ?? []).map((f) => (f as Record<string, unknown>).category));

  // Score each dimension (0-100)
  const dimensions = {
    financial_depth: obsTypes.has("financial") || factCats.has("financial") ? 70 : obsTypes.has("spending") ? 40 : 10,
    family_network: factCats.has("relational") ? 60 : obsTypes.has("relationship") ? 30 : 5,
    professional_network: obsTypes.has("professional") || factCats.has("professional") ? 55 : 10,
    behavioral_baseline: obsTypes.has("behavioral") || factCats.has("behavioral") ? 65 : (events.data ?? []).length > 5 ? 40 : 10,
    stress_triggers: factCats.has("personal") ? 50 : obsTypes.has("emotional") ? 25 : 5,
    communication_patterns: obsTypes.has("communication") ? 60 : (events.data ?? []).length > 3 ? 30 : 5,
    travel_patterns: obsTypes.has("travel") ? 55 : 5,
    digital_footprint: osintTypes.size > 0 ? Math.min(80, osintTypes.size * 20) : 5,
    biometric_coverage: Math.min(90, bioModalities.size * 30),
    osint_coverage: Math.min(80, (osint.data ?? []).length * 5),
  };

  const dimValues = Object.values(dimensions);
  const convergenceScore = dimValues.reduce((a, b) => a + b, 0) / dimValues.length;

  // Identify gaps
  const gaps = Object.entries(dimensions)
    .filter(([, score]) => score < 30)
    .map(([dim, score]) => ({
      dimension: dim.replace(/_/g, " "),
      current_score: score,
      priority: score < 10 ? "high" : "medium",
      suggested_collection_action: `Collect more ${dim.replace(/_/g, " ")} intelligence`,
    }));

  // Get previous
  const { data: prev } = await supabase.from("intelligence_convergence").select("convergence_score").eq("profile_id", profileId).order("computed_at", { ascending: false }).limit(1).single();

  const { data: convergence } = await supabase.from("intelligence_convergence").insert({
    user_id: userId,
    profile_id: profileId,
    convergence_score: Math.round(convergenceScore),
    ...dimensions,
    identified_gaps: gaps,
    previous_score: prev?.convergence_score ?? null,
    score_delta: prev ? Math.round(convergenceScore - (prev.convergence_score as number)) : null,
  }).select().single();

  return convergence;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. Prompt Evolution (UCB1 Multi-Armed Bandit)
// ──────────────────────────────────────────────────────────────────────────────

async function selectPrompt(supabase: ReturnType<typeof createClient>, agentRole: string) {
  // UCB1: pick variant with highest UCB score
  const { data: variants } = await supabase
    .from("prompt_variants")
    .select("*")
    .eq("agent_role", agentRole)
    .eq("is_active", true)
    .order("ucb_score", { ascending: false })
    .limit(1);

  if (!variants?.length) return null;
  return variants[0];
}

async function updatePromptReward(supabase: ReturnType<typeof createClient>, variantId: string, reward: number) {
  const { data: variant } = await supabase.from("prompt_variants").select("*").eq("id", variantId).single();
  if (!variant) return;

  const rec = variant as Record<string, unknown>;
  const totalUses = ((rec.total_uses as number) ?? 0) + 1;
  const totalReward = ((rec.total_reward as number) ?? 0) + reward;
  const avgReward = totalReward / totalUses;

  // UCB1: avg_reward + sqrt(2 * ln(N) / n_i) where N = total across all variants
  const { count } = await supabase.from("prompt_variants").select("*", { count: "exact", head: true }).eq("agent_role", rec.agent_role).eq("is_active", true);
  const totalN = (count ?? 1);
  const ucb = avgReward + Math.sqrt(2 * Math.log(totalN) / totalUses);

  await supabase.from("prompt_variants").update({
    total_uses: totalUses,
    total_reward: totalReward,
    average_reward: avgReward,
    ucb_score: ucb,
    updated_at: new Date().toISOString(),
  }).eq("id", variantId);

  return { average_reward: avgReward, ucb_score: ucb, total_uses: totalUses };
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. Dashboard Stats
// ──────────────────────────────────────────────────────────────────────────────

async function getDashboardStats(supabase: ReturnType<typeof createClient>, userId: string) {
  // Try materialized view first, fall back to live queries
  const { data: mvStats } = await supabase.from("mv_dashboard_stats").select("*").eq("user_id", userId).single();

  if (mvStats) return mvStats;

  // Fallback: live queries
  const [events, goals, sessions] = await Promise.all([
    supabase.from("intelligence_events").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("strategic_goals").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active"),
    supabase.from("agent_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  return {
    total_events: events.count ?? 0,
    active_goals: goals.count ?? 0,
    total_agent_sessions: sessions.count ?? 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const timer = startTimer();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { action, ...params } = body;
    let result: unknown;

    switch (action) {
      case "create_goal": result = await createGoal(supabase, user.id, params); break;
      case "execute_goal": result = await executeGoal(supabase, user.id, params.goalId); break;
      case "list_goals": {
        const { data } = await supabase.from("strategic_goals").select("*").eq("user_id", user.id).order("priority").order("created_at", { ascending: false });
        result = { goals: data ?? [] }; break;
      }
      case "generate_briefing": result = await generateBriefing(supabase, user.id); break;
      case "consolidate_memory": result = await consolidateMemory(supabase, user.id); break;
      case "compute_convergence":
        if (!params.profileId) throw new Error("profileId required");
        result = await computeConvergence(supabase, user.id, params.profileId); break;
      case "select_prompt": result = await selectPrompt(supabase, params.agentRole ?? "researcher"); break;
      case "update_prompt_reward": result = await updatePromptReward(supabase, params.variantId, params.reward ?? 0.5); break;
      case "dashboard_stats": result = await getDashboardStats(supabase, user.id); break;
      default:
        return new Response(JSON.stringify({ error: `Unknown: ${action}`, available: ["create_goal", "execute_goal", "list_goals", "generate_briefing", "consolidate_memory", "compute_convergence", "select_prompt", "update_prompt_reward", "dashboard_stats"] }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    logLLMObservability({ userId: user.id, edgeFunction: "autonomy-engine", model: "multi", latencyMs: timer(), success: true, searchMethod: action }).catch(() => null);
    return new Response(JSON.stringify({ success: true, action, ...result as Record<string, unknown> }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[autonomy-engine] Error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
