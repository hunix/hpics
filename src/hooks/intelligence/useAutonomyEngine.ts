/**
 * useAutonomyEngine — Phase 5 Hooks
 *
 * Strategic goals, proactive briefings, memory consolidation,
 * convergence gaps, prompt evolution, and dashboard stats.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─────────────────────────────────────────────── Types ────────────────────────

export interface StrategicGoal {
  id: string;
  profile_id: string | null;
  title: string;
  description: string | null;
  goal_type: string;
  priority: string;
  status: string;
  progress_pct: number;
  sub_tasks: Array<{ id: string; description: string; assigned_agent: string; status: string }>;
  findings: Array<{ finding: string; confidence: number; source: string; timestamp: string }>;
  intelligence_gaps: Array<{ gap: string; priority: string; suggested_action: string }>;
  execution_frequency: string;
  last_execution_at: string | null;
  executions_count: number;
  created_at: string;
}

export interface IntelligenceConvergence {
  id: string;
  profile_id: string;
  convergence_score: number;
  financial_depth: number;
  family_network: number;
  professional_network: number;
  behavioral_baseline: number;
  stress_triggers: number;
  communication_patterns: number;
  travel_patterns: number;
  digital_footprint: number;
  biometric_coverage: number;
  osint_coverage: number;
  identified_gaps: Array<{ dimension: string; current_score: number; priority: string; suggested_collection_action: string }>;
  previous_score: number | null;
  score_delta: number | null;
  computed_at: string;
}

export interface DashboardStats {
  total_events: number;
  urgent_events: number;
  contacts_with_events: number;
  total_osint_mentions: number;
  actionable_osint: number;
  total_biometric_templates: number;
  total_agent_sessions: number;
  completed_sessions: number;
  avg_session_confidence: number;
  active_goals: number;
}

// ─────────────────────────────────────────────── Helper ───────────────────────

async function invokeAutonomy(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("autonomy-engine", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─────────────────────────────────────────────── Goals ────────────────────────

export function useStrategicGoals() {
  return useQuery<StrategicGoal[]>({
    queryKey: ["strategic-goals"],
    queryFn: async () => {
      const data = await invokeAutonomy({ action: "list_goals" });
      return (data.goals ?? []) as StrategicGoal[];
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { title: string; description?: string; profileId?: string; goalType?: string; priority?: string; frequency?: string }) =>
      invokeAutonomy({ action: "create_goal", ...params }),
    onSuccess: () => {
      toast.success("Strategic goal created");
      qc.invalidateQueries({ queryKey: ["strategic-goals"] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });
}

export function useExecuteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => invokeAutonomy({ action: "execute_goal", goalId }),
    onMutate: () => toast.info("Executing goal (agents working)…", { id: "goal-exec", duration: 120000 }),
    onSuccess: (data) => {
      toast.dismiss("goal-exec");
      toast.success(`Goal advanced: ${data.new_findings ?? 0} new findings, ${Math.round(data.progress ?? 0)}% complete`);
      qc.invalidateQueries({ queryKey: ["strategic-goals"] });
    },
    onError: (err) => { toast.dismiss("goal-exec"); toast.error(`Execution failed: ${err.message}`); },
  });
}

// ─────────────────────────────────────────────── Briefing ─────────────────────

export function useGenerateBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => invokeAutonomy({ action: "generate_briefing" }),
    onSuccess: (data) => {
      if (data.already_generated) toast.info("Today's briefing already exists");
      else toast.success("Daily briefing generated");
      qc.invalidateQueries({ queryKey: ["daily-briefing"] });
    },
  });
}

// ─────────────────────────────────────────────── Memory ───────────────────────

export function useConsolidateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => invokeAutonomy({ action: "consolidate_memory" }),
    onMutate: () => toast.info("Consolidating memory…", { id: "mem-consol", duration: 60000 }),
    onSuccess: (data) => {
      toast.dismiss("mem-consol");
      toast.success(`Memory consolidated: ${data.facts_created ?? 0} facts created, ${data.facts_pruned ?? 0} pruned`);
      qc.invalidateQueries({ queryKey: ["memory-consolidation"] });
    },
    onError: (err) => { toast.dismiss("mem-consol"); toast.error(`Consolidation failed: ${err.message}`); },
  });
}

// ─────────────────────────────────────────────── Convergence ──────────────────

export function useConvergence(profileId: string | undefined) {
  return useQuery<IntelligenceConvergence | null>({
    queryKey: ["convergence", profileId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("intelligence_convergence")
        .select("*")
        .eq("profile_id", profileId!)
        .order("computed_at", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data as unknown as IntelligenceConvergence) ?? null;
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useComputeConvergence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => invokeAutonomy({ action: "compute_convergence", profileId }),
    onSuccess: (_, profileId) => {
      toast.success("Convergence score updated");
      qc.invalidateQueries({ queryKey: ["convergence", profileId] });
    },
  });
}

// ─────────────────────────────────────────────── Dashboard ────────────────────

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => invokeAutonomy({ action: "dashboard_stats" }) as Promise<DashboardStats>,
    staleTime: 1000 * 60 * 5,
  });
}

// ─────────────────────────────────────────────── Combined ─────────────────────

export function useAutonomyDashboard(profileId: string | undefined) {
  const goals = useStrategicGoals();
  const convergence = useConvergence(profileId);
  const stats = useDashboardStats();
  const createGoal = useCreateGoal();
  const executeGoal = useExecuteGoal();
  const generateBriefing = useGenerateBriefing();
  const consolidateMemory = useConsolidateMemory();
  const computeConvergence = useComputeConvergence();

  return {
    goals: goals.data ?? [],
    convergence: convergence.data,
    stats: stats.data,
    isLoading: goals.isLoading || stats.isLoading,
    createGoal, executeGoal, generateBriefing,
    consolidateMemory, computeConvergence,
  };
}
