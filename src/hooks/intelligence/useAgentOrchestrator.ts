/**
 * useAgentOrchestrator — Phase 2 World-Class Hook Collection
 *
 * Provides React access to the AGIS multi-agent system:
 *   - Run standard 5-agent intelligence pipeline
 *   - Run Agent Debate Mode (Optimist vs Pessimist + Judge)
 *   - Stream agent turns in real-time via Supabase Realtime
 *   - Access session history, reports, reasoning chains
 *   - Vulnerability window predictions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────── Types ────────────────

export type AgentRole = "researcher" | "analyst" | "strategist" | "critic" | "synthesizer";
export type SessionMode = "standard" | "debate" | "deep_analysis";
export type SessionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface AgentTurn {
  agent_role: AgentRole;
  model: string;
  thinking: string | null;
  output: Record<string, unknown>;
  duration_ms: number;
  tokens: number;
}

export interface AgentSession {
  id: string;
  profile_id: string;
  session_type: SessionMode;
  goal: string;
  status: SessionStatus;
  agent_turns: AgentTurn[];
  final_report: string | null;
  confidence_score: number | null;
  self_verification_score: number | null;
  contradiction_count: number;
  complexity_score: number | null;
  models_used: Record<string, string>;
  duration_ms: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  phase_ids: number[];
  sources_retrieved: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface IntelligenceReport {
  id: string;
  profile_id: string;
  report_type: string;
  title: string;
  executive_summary: string | null;
  full_content: string | null;
  confidence_score: number;
  completeness_score: number;
  reasoning_quality: number;
  key_findings: Array<{ finding: string; confidence: number; evidence_basis: string }>;
  uncertainty_flags: string[];
  contradictions_detected: number;
  citation_count: number;
  phase_coverage: number[];
  report_version: number;
  created_at: string;
}

export interface ReasoningChain {
  id: string;
  agis_phase: number | null;
  initial_query: string;
  steps: Array<{
    step_number: number;
    type: string;
    content: string;
    duration_ms: number;
    confidence: number;
  }>;
  conclusion: string | null;
  confidence_score: number | null;
  uncertainty_flags: string[];
  model_used: string | null;
  created_at: string;
}

export interface VulnerabilityWindow {
  id: string;
  window_start: string;
  window_end: string;
  vulnerability_type: string;
  predicted_intensity: number;
  confidence: number;
  contributing_factors: Array<{ factor: string; weight: number; description: string }>;
  behavioral_signals: string[];
  status: string;
  recommended_actions: Array<{ action: string; timing: string; expected_effectiveness: number }>;
  computed_at: string;
}

export interface OrchestratorRunParams {
  goal: string;
  profileId: string;
  mode?: SessionMode;
  agisPhases?: number[];
}

export interface DebateRunParams {
  topic: string;
  profileId: string;
}

// ─────────────────────────────────────────────────────── Core ─────────────────

async function invokeOrchestrator(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("agis-orchestrator", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─────────────────────────────────────────────────────── Hooks ────────────────

/**
 * Run the full 5-agent intelligence pipeline for a contact.
 * Standard mode: Research→Analyze→Strategize→Critique→Synthesize
 * Deep analysis: Same pipeline with complex model routing
 */
export function useRunAgentPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: OrchestratorRunParams) =>
      invokeOrchestrator({ ...params, mode: params.mode ?? "standard" }),
    onMutate: () => {
      toast.info("AGIS agents initializing…", { id: "agis-run", duration: 60000 });
    },
    onSuccess: (data, vars) => {
      toast.dismiss("agis-run");
      toast.success(
        `Intelligence report generated (confidence: ${Math.round(data.confidence ?? 0)}%)`,
        { duration: 5000 }
      );
      qc.invalidateQueries({ queryKey: ["agent-sessions", vars.profileId] });
      qc.invalidateQueries({ queryKey: ["intelligence-reports", vars.profileId] });
      qc.invalidateQueries({ queryKey: ["reasoning-chains", vars.profileId] });
    },
    onError: (err) => {
      toast.dismiss("agis-run");
      toast.error(`Agent pipeline failed: ${err.message}`);
    },
  });
}

/**
 * Run Agent Debate Mode — Optimist vs Pessimist with Judge.
 * For high-stakes intelligence assessments requiring adversarial analysis.
 */
export function useRunDebateMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: DebateRunParams) =>
      invokeOrchestrator({
        goal: params.topic,
        profileId: params.profileId,
        mode: "debate",
      }),
    onMutate: () => {
      toast.info("Starting agent debate (Optimist vs Pessimist)…", { id: "debate-run", duration: 90000 });
    },
    onSuccess: (data, vars) => {
      toast.dismiss("debate-run");
      toast.success("Debate resolved — calibrated assessment ready");
      qc.invalidateQueries({ queryKey: ["agent-sessions", vars.profileId] });
    },
    onError: (err) => {
      toast.dismiss("debate-run");
      toast.error(`Debate failed: ${err.message}`);
    },
  });
}

/**
 * List all agent sessions for a contact, most recent first.
 */
export function useAgentSessions(profileId: string | undefined) {
  return useQuery<AgentSession[]>({
    queryKey: ["agent-sessions", profileId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_sessions")
        .select("*")
        .eq("profile_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as AgentSession[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 30,
  });
}

/**
 * Get a single agent session with full turn details.
 */
export function useAgentSession(sessionId: string | undefined) {
  return useQuery<AgentSession>({
    queryKey: ["agent-session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_sessions")
        .select("*")
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data as unknown as AgentSession;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 10,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 3000 : false,
  });
}

/**
 * List intelligence reports for a contact.
 */
export function useIntelligenceReports(profileId: string | undefined) {
  return useQuery<IntelligenceReport[]>({
    queryKey: ["intelligence-reports", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intelligence_reports")
        .select("*")
        .eq("profile_id", profileId!)
        .is("superseded_by", null)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as IntelligenceReport[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get reasoning chain for a specific session or contact.
 */
export function useReasoningChains(profileId: string | undefined) {
  return useQuery<ReasoningChain[]>({
    queryKey: ["reasoning-chains", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intelligence_reasoning_chains")
        .select("*")
        .eq("profile_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as unknown as ReasoningChain[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Current active vulnerability windows for a contact.
 */
export function useVulnerabilityWindows(profileId: string | undefined) {
  return useQuery<VulnerabilityWindow[]>({
    queryKey: ["vulnerability-windows", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vulnerability_window_predictions")
        .select("*")
        .eq("profile_id", profileId!)
        .in("status", ["predicted", "active"])
        .gte("window_end", new Date().toISOString())
        .order("window_start")
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as VulnerabilityWindow[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Today's intelligence briefing for the current user.
 */
export function useDailyBriefing() {
  return useQuery({
    queryKey: ["daily-briefing"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("intelligence_briefings")
        .select("*")
        .eq("briefing_date", today)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Mark today's briefing as read.
 */
export function useMarkBriefingRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (briefingId: string) => {
      const { error } = await supabase
        .from("intelligence_briefings")
        .update({ read_at: new Date().toISOString() })
        .eq("id", briefingId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-briefing"] }),
  });
}

/**
 * Combined hook for the Agent Console page.
 */
export function useAgentConsole(profileId: string | undefined) {
  const sessions = useAgentSessions(profileId);
  const reports = useIntelligenceReports(profileId);
  const reasoningChains = useReasoningChains(profileId);
  const vulnerabilityWindows = useVulnerabilityWindows(profileId);
  const runPipeline = useRunAgentPipeline();
  const runDebate = useRunDebateMode();

  return {
    sessions: sessions.data ?? [],
    reports: reports.data ?? [],
    reasoningChains: reasoningChains.data ?? [],
    vulnerabilityWindows: vulnerabilityWindows.data ?? [],
    isLoading: sessions.isLoading || reports.isLoading,
    runPipeline,
    runDebate,
    latestReport: reports.data?.[0] ?? null,
    latestSession: sessions.data?.[0] ?? null,
  };
}
