/**
 * useSemanticMemory — Phase 1 World-Class Hook
 *
 * Provides unified access to the 4-layer intelligence memory system:
 *   - Semantic search (hybrid vector + keyword with temporal decay)
 *   - Episodic recall (time-indexed event timeline)
 *   - Event recording (with AI narrative generation)
 *   - Memory consolidation (episodic → semantic facts)
 *   - Contradiction detection (belief conflict monitoring)
 *   - Intelligence convergence score
 *   - Behavioral state machine
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────── Types ────────────

export interface SemanticSearchResult {
  searchMethod: "semantic" | "keyword" | "hybrid";
  sourceCount: number;
  citations: Array<{
    source: string;
    type: string;
    id: string;
    content: string;
    relevance: number;
  }>;
  context: string;
  episodicEvents: Array<{
    id: string;
    event_type: string;
    event_title: string;
    event_narrative: string | null;
    significance_score: number;
    trust_delta: number;
    occurred_at: string;
  }>;
}

export interface EpisodicEvent {
  id: string;
  profile_id: string;
  event_type: string;
  event_title: string;
  event_narrative: string | null;
  emotional_valence: number;
  significance_score: number;
  trust_delta: number;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

export interface BehavioralState {
  id: string;
  profile_id: string;
  trust_score: number;
  stress_level: number;
  deception_risk: number;
  openness_index: number;
  agreeableness: number;
  machiavellianism: number;
  narcissism: number;
  psychopathy: number;
  anomaly_score: number;
  vulnerability_window_active: boolean;
  vulnerability_window_expires_at: string | null;
  last_updated_at: string;
}

export interface ConvergenceScore {
  overall: number;
  dimensions: {
    behavioral: number;
    intelligence_depth: number;
    biometric: number;
    semantic: number;
    temporal: number;
    psychological: number;
    network: number;
  };
  gapCategories: string[];
}

export interface ContradictionResult {
  contradictions: Array<{
    existing_fact: string;
    new_evidence_excerpt: string;
    conflict_score: number;
    contradiction_type: string;
  }>;
  conflict_score: number;
}

export interface SemanticFact {
  id: string;
  fact_category: string;
  fact_statement: string;
  confidence: number;
  evidence_count: number;
  last_confirmed_at: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────── Core Invoker ─────────

async function invokeMemoryRouter(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("intelligence-memory-router", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─────────────────────────────────────────────────────── Hooks ────────────────

/**
 * Semantic search across all intelligence sources for a contact.
 * Automatically uses hybrid vector + keyword search with temporal decay.
 */
export function useSemanticSearch(
  profileId: string | undefined,
  query: string,
  options: {
    enabled?: boolean;
    sourceTypes?: string[];
    maxResults?: number;
    minRelevance?: number;
    maxAgeDays?: number;
  } = {}
) {
  return useQuery<SemanticSearchResult>({
    queryKey: ["semantic-search", profileId, query, options],
    queryFn: () =>
      invokeMemoryRouter("semantic_search", {
        profileId,
        query,
        ...options,
      }),
    enabled: (options.enabled ?? true) && !!profileId && query.length >= 3,
    staleTime: 1000 * 60 * 5, // 5 minutes — search results are stable
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Episodic memory timeline for a contact — time-indexed events.
 */
export function useEpisodicTimeline(
  profileId: string | undefined,
  options: {
    fromDate?: string;
    toDate?: string;
    eventTypes?: string[];
    limit?: number;
    enabled?: boolean;
  } = {}
) {
  return useQuery<{ events: EpisodicEvent[]; count: number }>({
    queryKey: ["episodic-timeline", profileId, options],
    queryFn: () =>
      invokeMemoryRouter("episodic_recall", {
        profileId,
        ...options,
      }),
    enabled: (options.enabled ?? true) && !!profileId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });
}

/**
 * Store a new episodic intelligence event with AI narrative generation.
 */
export function useStoreMemoryEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      profileId: string;
      event: {
        event_type: string;
        event_title: string;
        event_narrative?: string;
        emotional_valence?: number;
        significance_score?: number;
        trust_delta?: number;
        occurred_at?: string;
        metadata?: Record<string, unknown>;
      };
    }) => invokeMemoryRouter("store_event", params),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["episodic-timeline", vars.profileId] });
      qc.invalidateQueries({ queryKey: ["convergence-score", vars.profileId] });
    },
    onError: (err) => toast.error(`Failed to record event: ${err.message}`),
  });
}

/**
 * Trigger memory consolidation: extract durable semantic facts from recent events.
 * Best called after a session of intelligence collection.
 */
export function useConsolidateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) =>
      invokeMemoryRouter("consolidate", { profileId }),
    onSuccess: (data, profileId) => {
      qc.invalidateQueries({ queryKey: ["semantic-facts", profileId] });
      const casted = data as { consolidated: number; facts: unknown[] };
      toast.success(`Memory consolidated: ${casted.consolidated} semantic facts extracted`);
    },
    onError: (err) => toast.error(`Consolidation failed: ${err.message}`),
  });
}

/**
 * Detect contradictions between new evidence and stored intelligence.
 * Returns contradictions, conflict score, and triggers DB storage of conflicts.
 */
export function useDetectContradictions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { profileId: string; newEvidenceText: string }) =>
      invokeMemoryRouter("detect_contradictions", params) as Promise<ContradictionResult>,
    onSuccess: (data, vars) => {
      if (data.conflict_score > 0.5) {
        qc.invalidateQueries({ queryKey: ["contradictions", vars.profileId] });
        toast.warning(
          `Belief conflict detected (score: ${Math.round(data.conflict_score * 100)}%). Review contradictions.`,
          { duration: 6000 }
        );
      }
    },
  });
}

/**
 * Compute Intelligence Convergence Score — how thoroughly is this contact profiled?
 */
export function useConvergenceScore(profileId: string | undefined) {
  return useQuery<ConvergenceScore>({
    queryKey: ["convergence-score", profileId],
    queryFn: () => invokeMemoryRouter("convergence_score", { profileId }),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
}

/**
 * Get the behavioral state machine for a contact.
 * Provides psychological dimension scores and anomaly detection.
 */
export function useBehavioralState(profileId: string | undefined) {
  return useQuery<{ state: BehavioralState; isNew: boolean }>({
    queryKey: ["behavioral-state", profileId],
    queryFn: () => invokeMemoryRouter("behavioral_state", { profileId }),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Update behavioral state with Bayesian delta updates.
 * Automatically stores history snapshot before applying changes.
 */
export function useUpdateBehavioralState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      profileId: string;
      stateDelta: Record<string, number>;
      triggerEvent?: string;
      triggerSourceId?: string;
    }) => invokeMemoryRouter("update_behavioral_state", params),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["behavioral-state", vars.profileId] });
    },
    onError: (err) => toast.error(`State update failed: ${err.message}`),
  });
}

/**
 * Fetch stored semantic facts for a contact from Supabase directly.
 * These are durable intelligence facts extracted by the consolidation engine.
 */
export function useSemanticFacts(profileId: string | undefined) {
  return useQuery<SemanticFact[]>({
    queryKey: ["semantic-facts", profileId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("semantic_memory_facts")
        .select("id, fact_category, fact_statement, confidence, evidence_count, last_confirmed_at, created_at")
        .eq("profile_id", profileId!)
        .order("confidence", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SemanticFact[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Fetch unresolved contradictions for a contact.
 */
export function useContradictions(profileId: string | undefined) {
  return useQuery<Record<string, unknown>[]>({
    queryKey: ["contradictions", profileId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("intelligence_contradictions")
        .select("*")
        .eq("profile_id", profileId!)
        .eq("resolution_status", "unresolved")
        .order("conflict_score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Combined hook for the Memory Explorer page — loads all memory layers.
 */
export function useMemoryExplorer(profileId: string | undefined) {
  const semanticFacts = useSemanticFacts(profileId);
  const episodicTimeline = useEpisodicTimeline(profileId, { limit: 100 });
  const convergenceScore = useConvergenceScore(profileId);
  const behavioralState = useBehavioralState(profileId);
  const contradictions = useContradictions(profileId);

  const isLoading =
    semanticFacts.isLoading ||
    episodicTimeline.isLoading ||
    convergenceScore.isLoading ||
    behavioralState.isLoading;

  return {
    semanticFacts: semanticFacts.data ?? [],
    episodicEvents: episodicTimeline.data?.events ?? [],
    convergenceScore: convergenceScore.data,
    behavioralState: behavioralState.data?.state ?? null,
    contradictions: contradictions.data ?? [],
    isLoading,
    refetch: () => {
      semanticFacts.refetch();
      episodicTimeline.refetch();
      convergenceScore.refetch();
      behavioralState.refetch();
      contradictions.refetch();
    },
  };
}
