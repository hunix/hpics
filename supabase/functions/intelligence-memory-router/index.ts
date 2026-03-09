/**
 * Intelligence Memory Router — Phase 1 World-Class Implementation
 *
 * Central hub for the 4-layer memory architecture:
 *   1. Working Memory  — current session context (handled by React Query)
 *   2. Episodic Memory — time-indexed events per contact
 *   3. Semantic Memory — distilled facts with vector similarity search
 *   4. Procedural Memory — operator-specific patterns (Phase 2+)
 *
 * Actions:
 *   semantic_search      — hybrid vector + keyword search with decay scoring
 *   episodic_recall      — timeline retrieval with temporal window
 *   store_event          — write new episodic event
 *   consolidate          — episodic → semantic fact extraction (background)
 *   detect_contradictions — cross-check new evidence vs stored facts
 *   convergence_score    — compute intelligence completeness for a contact
 *   behavioral_state     — get/update behavioral state machine for a contact
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getRAGContext } from "../_shared/rag-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface MemoryRouterRequest {
  action:
    | "semantic_search"
    | "episodic_recall"
    | "store_event"
    | "consolidate"
    | "detect_contradictions"
    | "convergence_score"
    | "behavioral_state"
    | "update_behavioral_state";
  profileId?: string;
  query?: string;
  // semantic_search options
  sourceTypes?: string[];
  maxResults?: number;
  minRelevance?: number;
  maxAgeDays?: number;
  // episodic_recall options
  fromDate?: string;
  toDate?: string;
  eventTypes?: string[];
  limit?: number;
  // store_event options
  event?: {
    event_type: string;
    event_title: string;
    event_narrative?: string;
    emotional_valence?: number;
    significance_score?: number;
    trust_delta?: number;
    occurred_at?: string;
    metadata?: Record<string, unknown>;
  };
  // detect_contradictions options
  newEvidenceText?: string;
  // behavioral_state options
  stateDelta?: Record<string, number>;
  triggerEvent?: string;
  triggerSourceId?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  try {
    const resp = await fetch(`${LOVABLE_AI_URL}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 32000) }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json.data[0].embedding;
  } catch {
    return null;
  }
}

async function callLLM(systemPrompt: string, userContent: string, model = "gpt-4o-mini"): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return "";
  const resp = await fetch(`${LOVABLE_AI_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });
  if (!resp.ok) return "";
  const json = await resp.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// ──────────────────────────────────────────────────────────────────────────────
// Action Handlers
// ──────────────────────────────────────────────────────────────────────────────

/** Hybrid semantic + keyword search with temporal decay */
async function semanticSearch(supabase: ReturnType<typeof createClient>, userId: string, req: MemoryRouterRequest) {
  const { query = "", profileId, sourceTypes, maxResults = 15, minRelevance = 0.3, maxAgeDays } = req;

  // Use the shared RAG helper for retrieval
  const ragCtx = await getRAGContext(userId, profileId ?? null, query, {
    maxResults,
    sourceTypes: (sourceTypes as Parameters<typeof getRAGContext>[3]["sourceTypes"]) ??
      ["document", "observation", "analysis", "message"],
    minRelevance,
    useSemanticSearch: true,
  });

  // Also fetch matching episodic events
  let episodicEvents: unknown[] = [];
  if (profileId) {
    let q = supabase
      .from("intelligence_memory_events")
      .select("id, event_type, event_title, event_narrative, significance_score, trust_delta, occurred_at")
      .eq("user_id", userId)
      .eq("profile_id", profileId)
      .order("significance_score", { ascending: false });

    if (maxAgeDays) {
      const cutoff = new Date(Date.now() - maxAgeDays * 86400000).toISOString();
      q = q.gte("occurred_at", cutoff);
    }

    const { data } = await q.limit(5);
    episodicEvents = data ?? [];
  }

  return {
    searchMethod: ragCtx.searchMethod,
    sourceCount: ragCtx.sourceCount,
    citations: ragCtx.citations,
    context: ragCtx.context,
    episodicEvents,
  };
}

/** Retrieve episodic timeline for a contact */
async function episodicRecall(supabase: ReturnType<typeof createClient>, userId: string, req: MemoryRouterRequest) {
  const { profileId, fromDate, toDate, eventTypes, limit = 50 } = req;
  if (!profileId) throw new Error("profileId required for episodic recall");

  let q = supabase
    .from("intelligence_memory_events")
    .select("*")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .order("occurred_at", { ascending: false });

  if (fromDate) q = q.gte("occurred_at", fromDate);
  if (toDate) q = q.lte("occurred_at", toDate);
  if (eventTypes?.length) q = q.in("event_type", eventTypes);

  const { data, error } = await q.limit(limit);
  if (error) throw error;
  return { events: data ?? [], count: data?.length ?? 0 };
}

/** Store a new episodic event with AI-generated narrative */
async function storeEvent(supabase: ReturnType<typeof createClient>, userId: string, req: MemoryRouterRequest) {
  const { profileId, event } = req;
  if (!event) throw new Error("event data required");

  // Generate narrative if not provided
  let narrative = event.event_narrative;
  if (!narrative && event.event_title) {
    narrative = await callLLM(
      "You are an intelligence analyst writing concise memory entries. Write a 1-2 sentence intelligence narrative for this event, in past tense, third person. Be specific and factual.",
      `Event: ${event.event_title}\nContext: ${JSON.stringify(event.metadata ?? {})}`,
    );
  }

  const { data, error } = await supabase
    .from("intelligence_memory_events")
    .insert({
      user_id: userId,
      profile_id: profileId,
      event_type: event.event_type,
      event_title: event.event_title,
      event_narrative: narrative,
      emotional_valence: event.emotional_valence ?? 0,
      significance_score: event.significance_score ?? 0.5,
      trust_delta: event.trust_delta ?? 0,
      occurred_at: event.occurred_at ?? new Date().toISOString(),
      metadata: event.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;

  // Update behavioral state trust score if delta provided
  if (event.trust_delta && profileId) {
    await supabase.rpc("update_trust_score_delta", {
      p_user_id: userId,
      p_profile_id: profileId,
      p_delta: event.trust_delta,
    }).catch(() => null); // non-blocking
  }

  return { event: data };
}

/** Episodic → Semantic consolidation: extract durable facts from recent events */
async function consolidate(supabase: ReturnType<typeof createClient>, userId: string, req: MemoryRouterRequest) {
  const { profileId } = req;
  if (!profileId) throw new Error("profileId required for consolidation");

  // Fetch recent high-significance events not yet consolidated
  const { data: events, error } = await supabase
    .from("intelligence_memory_events")
    .select("*")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .gte("significance_score", 0.5)
    .order("occurred_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  if (!events?.length) return { consolidated: 0, facts: [] };

  // Ask LLM to extract durable semantic facts
  const eventSummary = events.map((e) =>
    `[${e.occurred_at}] ${e.event_type}: ${e.event_title}. ${e.event_narrative ?? ""}`
  ).join("\n");

  const factsRaw = await callLLM(
    `You are an intelligence analyst extracting durable facts from episodic events.
Extract 3-7 concise, declarative semantic facts that are likely to remain true over time.
Return ONLY a JSON array of objects: [{fact_category, fact_statement, confidence (0.0-1.0)}]
Categories: personality | preference | relationship_pattern | behavioral_tendency | vulnerability`,
    `Contact events:\n${eventSummary}`,
    "gpt-4o",
  );

  let facts: Array<{ fact_category: string; fact_statement: string; confidence: number }> = [];
  try {
    const parsed = JSON.parse(factsRaw.replace(/```json\n?|\n?```/g, "").trim());
    facts = Array.isArray(parsed) ? parsed : [];
  } catch {
    facts = [];
  }

  // Upsert semantic facts with embeddings
  let consolidated = 0;
  for (const fact of facts) {
    const embedding = await generateEmbedding(fact.fact_statement);
    const { error: upsertErr } = await supabase.from("semantic_memory_facts").insert({
      user_id: userId,
      profile_id: profileId,
      fact_category: fact.fact_category,
      fact_statement: fact.fact_statement,
      confidence: fact.confidence ?? 0.7,
      evidence_count: events.length,
      source_event_ids: events.map((e) => e.id),
      embedding,
    });
    if (!upsertErr) consolidated++;
  }

  return { consolidated, facts };
}

/** Detect contradictions between new evidence and stored facts */
async function detectContradictions(supabase: ReturnType<typeof createClient>, userId: string, req: MemoryRouterRequest) {
  const { profileId, newEvidenceText, query } = req;
  const evidenceText = newEvidenceText ?? query ?? "";
  if (!profileId || !evidenceText) return { contradictions: [], conflict_score: 0 };

  // Get embedding of new evidence
  const evidenceEmbedding = await generateEmbedding(evidenceText);
  if (!evidenceEmbedding) return { contradictions: [], conflict_score: 0 };

  // Find semantically close existing facts
  const { data: closeFacts } = await supabase.rpc("match_semantic_facts", {
    p_user_id: userId,
    p_profile_id: profileId,
    p_query_embedding: `[${evidenceEmbedding.join(",")}]`,
    p_match_threshold: 0.6,
    p_match_count: 5,
  }).catch(() => ({ data: null }));

  if (!closeFacts?.length) return { contradictions: [], conflict_score: 0 };

  // Ask LLM to identify genuine contradictions
  const factsText = closeFacts.map((f: { fact_statement: string; confidence: number }) =>
    `- ${f.fact_statement} (confidence: ${f.confidence})`
  ).join("\n");

  const result = await callLLM(
    `You are a contradiction detection system. Identify ONLY genuine logical contradictions between new evidence and stored facts.
Return JSON: [{existing_fact, new_evidence_excerpt, conflict_score (0.0-1.0), contradiction_type}]
If no contradictions, return [].`,
    `New evidence: "${evidenceText}"\n\nStored facts:\n${factsText}`,
  );

  let contradictions: unknown[] = [];
  try {
    contradictions = JSON.parse(result.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    contradictions = [];
  }

  // Store detected contradictions
  if (Array.isArray(contradictions) && contradictions.length > 0) {
    for (const c of contradictions as Array<Record<string, unknown>>) {
      if ((c.conflict_score as number) >= 0.5) {
        await supabase.from("intelligence_contradictions").insert({
          user_id: userId,
          profile_id: profileId,
          contradiction_type: c.contradiction_type ?? "statement_conflict",
          existing_fact: c.existing_fact,
          new_evidence: evidenceText,
          conflict_score: c.conflict_score,
        }).catch(() => null);
      }
    }
  }

  const maxConflict = Array.isArray(contradictions) && contradictions.length > 0
    ? Math.max(...contradictions.map((c) => (c as Record<string, unknown>).conflict_score as number))
    : 0;

  return { contradictions, conflict_score: maxConflict };
}

/** Compute Intelligence Convergence Score for a contact */
async function computeConvergenceScore(supabase: ReturnType<typeof createClient>, userId: string, req: MemoryRouterRequest) {
  const { profileId } = req;
  if (!profileId) throw new Error("profileId required");

  // Check volume across key intelligence dimensions
  const dimensionQueries = await Promise.all([
    supabase.from("contact_observations").select("id", { count: "exact" }).eq("user_id", userId).eq("profile_id", profileId),
    supabase.from("document_embeddings").select("id", { count: "exact" }).eq("user_id", userId).eq("profile_id", profileId),
    supabase.from("biometric_profiles").select("id", { count: "exact" }).eq("user_id", userId).eq("profile_id", profileId).catch(() => ({ count: 0 })),
    supabase.from("semantic_memory_facts").select("id", { count: "exact" }).eq("user_id", userId).eq("profile_id", profileId),
    supabase.from("intelligence_memory_events").select("id", { count: "exact" }).eq("user_id", userId).eq("profile_id", profileId),
    supabase.from("contact_behavioral_states").select("trust_score, deception_risk, machiavellianism").eq("user_id", userId).eq("profile_id", profileId).single(),
  ]);

  const [obsResult, embResult, bioResult, factsResult, eventsResult, stateResult] = dimensionQueries;

  const dimensions = {
    behavioral: Math.min(100, ((obsResult.count ?? 0) / 10) * 100),
    intelligence_depth: Math.min(100, ((embResult.count ?? 0) / 50) * 100),
    biometric: Math.min(100, ((bioResult.count ?? 0) / 3) * 100),
    semantic: Math.min(100, ((factsResult.count ?? 0) / 5) * 100),
    temporal: Math.min(100, ((eventsResult.count ?? 0) / 20) * 100),
    psychological: stateResult.data ? 70 : 0,
    network: 0, // Phase 1: placeholder — network graph assessment in Phase 2
  };

  const overall = Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.keys(dimensions).length;
  const gapCategories = Object.entries(dimensions)
    .filter(([, v]) => v < 50)
    .map(([k]) => k);

  // Upsert convergence score
  await supabase.from("intelligence_convergence_scores").upsert({
    user_id: userId,
    profile_id: profileId,
    overall_score: Math.round(overall * 10) / 10,
    dimension_scores: dimensions,
    gap_categories: gapCategories,
    last_computed_at: new Date().toISOString(),
  }, { onConflict: "user_id,profile_id" });

  return { overall: Math.round(overall * 10) / 10, dimensions, gapCategories };
}

/** Get or initialize behavioral state for a contact */
async function getBehavioralState(supabase: ReturnType<typeof createClient>, userId: string, req: MemoryRouterRequest) {
  const { profileId } = req;
  if (!profileId) throw new Error("profileId required");

  const { data, error } = await supabase
    .from("contact_behavioral_states")
    .select("*")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .single();

  if (error && error.code === "PGRST116") {
    // Create default row
    const { data: created } = await supabase
      .from("contact_behavioral_states")
      .insert({ user_id: userId, profile_id: profileId })
      .select()
      .single();
    return { state: created, isNew: true };
  }

  return { state: data, isNew: false };
}

/** Update behavioral state with Bayesian delta */
async function updateBehavioralState(supabase: ReturnType<typeof createClient>, userId: string, req: MemoryRouterRequest) {
  const { profileId, stateDelta, triggerEvent, triggerSourceId } = req;
  if (!profileId || !stateDelta) throw new Error("profileId and stateDelta required");

  // Fetch current state
  const { data: current } = await supabase
    .from("contact_behavioral_states")
    .select("*")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .single();

  if (!current) throw new Error("No behavioral state found for contact");

  // Apply Bayesian update (weighted average: 80% existing, 20% new signal)
  const ALPHA = 0.2; // learning rate
  const updates: Record<string, number> = {};
  for (const [key, delta] of Object.entries(stateDelta)) {
    const currentVal = (current[key] as number) ?? 50;
    updates[key] = Math.max(0, Math.min(100, currentVal * (1 - ALPHA) + (currentVal + delta) * ALPHA));
  }

  // Compute anomaly score (how far from baseline)
  const baseline = current.baseline_computed_at ? current : null;
  let anomalyScore = 0;
  if (baseline) {
    const deltas = Object.keys(updates).map((k) => Math.abs((updates[k] ?? 0) - ((baseline[k] as number) ?? 50)));
    anomalyScore = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  }

  // Store history snapshot before update
  await supabase.from("contact_behavioral_state_history").insert({
    user_id: userId,
    profile_id: profileId,
    state_snapshot: current,
    trigger_event: triggerEvent,
    trigger_source_id: triggerSourceId,
  });

  // Apply update
  const { data: updated } = await supabase
    .from("contact_behavioral_states")
    .update({
      ...updates,
      anomaly_score: anomalyScore,
      last_updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .select()
    .single();

  return { state: updated, anomalyScore, delta: updates };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    const body: MemoryRouterRequest = await req.json();
    const { action } = body;

    let result: unknown;

    switch (action) {
      case "semantic_search":
        result = await semanticSearch(supabase, user.id, body);
        break;
      case "episodic_recall":
        result = await episodicRecall(supabase, user.id, body);
        break;
      case "store_event":
        result = await storeEvent(supabase, user.id, body);
        break;
      case "consolidate":
        result = await consolidate(supabase, user.id, body);
        break;
      case "detect_contradictions":
        result = await detectContradictions(supabase, user.id, body);
        break;
      case "convergence_score":
        result = await computeConvergenceScore(supabase, user.id, body);
        break;
      case "behavioral_state":
        result = await getBehavioralState(supabase, user.id, body);
        break;
      case "update_behavioral_state":
        result = await updateBehavioralState(supabase, user.id, body);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Log to LLM observability (non-blocking)
    supabase.from("llm_observability_log").insert({
      user_id: user.id,
      edge_function: "intelligence-memory-router",
      model: "system",
      latency_ms: Date.now() - startTime,
      success: true,
      metadata: { action },
    }).catch(() => null);

    return new Response(JSON.stringify({ success: true, ...result as object }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[intelligence-memory-router] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
