/**
 * LLM Observability Logger — Phase 1 World-Class Implementation
 *
 * Shared helper for all edge functions to log LLM calls with:
 *   - Token usage, cost, latency
 *   - Model routing decisions
 *   - Reasoning chain capture
 *   - Self-verification scores
 *   - Search method used (semantic/keyword/hybrid/graphrag)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export interface LLMObservabilityEntry {
  userId?: string;
  sessionId?: string;
  agisPhase?: number;
  edgeFunction: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
  costUsd?: number;
  promptHash?: string;
  complexityScore?: number;
  searchMethod?: "semantic" | "keyword" | "hybrid" | "graphrag";
  sourcesRetrieved?: number;
  selfVerificationScore?: number;
  contradictionDetected?: boolean;
  errorType?: string;
  success?: boolean;
  reasoningChain?: Record<string, unknown>[];
}

// Cost per 1k tokens by model (USD)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "o3": { input: 0.015, output: 0.06 },
  "o3-pro": { input: 0.02, output: 0.08 },
  "o3-mini": { input: 0.001, output: 0.004 },
  "claude-3-7-sonnet": { input: 0.003, output: 0.015 },
  "gemini-2.5-pro": { input: 0.0035, output: 0.0105 },
  "text-embedding-3-small": { input: 0.00002, output: 0 },
  "text-embedding-3-large": { input: 0.00013, output: 0 },
};

export function computeCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs = MODEL_COSTS[model];
  if (!costs) return 0;
  return (promptTokens / 1000) * costs.input + (completionTokens / 1000) * costs.output;
}

export async function logLLMObservability(entry: LLMObservabilityEntry): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const costUsd = entry.costUsd ?? (
      entry.promptTokens && entry.completionTokens
        ? computeCost(entry.model, entry.promptTokens, entry.completionTokens)
        : undefined
    );

    await supabase.from("llm_observability_log").insert({
      user_id: entry.userId ?? null,
      session_id: entry.sessionId ?? null,
      agis_phase: entry.agisPhase ?? null,
      edge_function: entry.edgeFunction,
      model: entry.model,
      prompt_tokens: entry.promptTokens ?? null,
      completion_tokens: entry.completionTokens ?? null,
      total_tokens: entry.totalTokens ?? (entry.promptTokens ?? 0) + (entry.completionTokens ?? 0),
      latency_ms: entry.latencyMs,
      cost_usd: costUsd ?? null,
      prompt_hash: entry.promptHash ?? null,
      complexity_score: entry.complexityScore ?? null,
      search_method: entry.searchMethod ?? null,
      sources_retrieved: entry.sourcesRetrieved ?? 0,
      self_verification_score: entry.selfVerificationScore ?? null,
      contradiction_detected: entry.contradictionDetected ?? false,
      error_type: entry.errorType ?? null,
      success: entry.success ?? true,
      reasoning_chain: entry.reasoningChain ?? null,
    });
  } catch {
    // Non-blocking — observability must never break the main flow
  }
}

/**
 * Timer helper for tracking edge function latency.
 * Usage:
 *   const timer = startTimer();
 *   // ... do work ...
 *   const ms = timer();
 */
export function startTimer() {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * Compute a SHA-256 hash of a prompt string for dedup analysis.
 */
export async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
