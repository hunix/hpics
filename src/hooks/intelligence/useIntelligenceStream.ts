/**
 * useIntelligenceStream — Phase 3 Hooks
 *
 * Real-time intelligence feed, OSINT collection, and threat management:
 *   - Live event feed with Supabase Realtime subscription
 *   - OSINT collection triggers and status monitoring
 *   - Threat assessment access
 *   - Event acknowledgment
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { invokeFunction } from '@/lib/api';

// ─────────────────────────────────────────────── Types ────────────────────────

export interface IntelligenceEvent {
  id: string;
  profile_id: string | null;
  event_type: string;
  severity: string;
  title: string;
  description: string | null;
  source_function: string | null;
  source_type: string | null;
  anomaly_score: number | null;
  baseline_deviation: number | null;
  acknowledged: boolean;
  resolved: boolean;
  occurred_at: string;
  created_at: string;
}

export interface OSINTCollection {
  id: string;
  profile_id: string;
  collection_type: string;
  source_name: string;
  status: string;
  mentions_found: number;
  entities_extracted: Array<{ entity: string; type: string; confidence: number }>;
  duration_ms: number | null;
  created_at: string;
}

export interface OSINTMention {
  id: string;
  profile_id: string | null;
  source_type: string;
  source_url: string | null;
  source_name: string | null;
  title: string | null;
  snippet: string;
  sentiment: string | null;
  sentiment_score: number | null;
  relevance_score: number;
  is_actionable: boolean;
  reviewed: boolean;
  discovered_at: string;
}

export interface ThreatAssessment {
  id: string;
  profile_id: string;
  overall_threat_level: string;
  threat_score: number;
  deception_threat: number;
  financial_threat: number;
  operational_threat: number;
  loyalty_threat: number;
  external_threat: number;
  contributing_events: Array<{ event_id: string; weight: number; description: string }>;
  score_delta: number | null;
  created_at: string;
}

// ─────────────────────────────────────────────── Helpers ──────────────────────

async function invokeStream(body: Record<string, unknown>) {
  const { data, error } = await invokeFunction("stream-processor", body);
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

async function invokeOSINT(body: Record<string, unknown>) {
  const { data, error } = await invokeFunction("osint-collector", body);
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─────────────────────────────────────────────── Event Feed ───────────────────

/**
 * Live intelligence event feed with real-time subscription.
 * Auto-updates when new events are emitted.
 */
export function useIntelligenceFeed(params?: {
  profileId?: string;
  eventTypes?: string[];
  severities?: string[];
  unacknowledgedOnly?: boolean;
  limit?: number;
}) {
  const qc = useQueryClient();
  const [realtimeEvents, setRealtimeEvents] = useState<IntelligenceEvent[]>([]);

  const query = useQuery<{ events: IntelligenceEvent[]; total: number }>({
    queryKey: ["intelligence-feed", params],
    queryFn: () => invokeStream({ action: "get_feed", ...params }),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30, // Fallback polling every 30s
  });

  // Subscribe to real-time inserts
  useEffect(() => {
    const channel = supabase
      .channel("intelligence-events-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "intelligence_events",
      }, (payload) => {
        const newEvent = payload.new as IntelligenceEvent;
        setRealtimeEvents((prev) => [newEvent, ...prev].slice(0, 10));
        qc.invalidateQueries({ queryKey: ["intelligence-feed"] });

        // Toast for high/critical events
        if (newEvent.severity === "high" || newEvent.severity === "critical") {
          toast.warning(newEvent.title, {
            description: newEvent.description ?? undefined,
            duration: 8000,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const allEvents = [
    ...realtimeEvents.filter((re) => !(query.data?.events ?? []).some((e) => e.id === re.id)),
    ...(query.data?.events ?? []),
  ];

  return {
    events: allEvents,
    total: (query.data?.total ?? 0) + realtimeEvents.length,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/**
 * Emit a new intelligence event.
 */
export function useEmitEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      profileId?: string;
      eventType: string;
      severity?: string;
      title: string;
      description?: string;
      sourceFunction?: string;
      anomalyScore?: number;
    }) => invokeStream({ action: "emit_event", ...params }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intelligence-feed"] }),
  });
}

/**
 * Acknowledge an event.
 */
export function useAcknowledgeEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { eventId: string; notes?: string }) =>
      invokeStream({ action: "acknowledge", ...params }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence-feed"] });
      toast.success("Event acknowledged");
    },
  });
}

/**
 * Run CEP rules for a user/contact.
 */
export function useProcessCEPRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId?: string) =>
      invokeStream({ action: "process_rules", profileId }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["intelligence-feed"] });
      const triggered = data.triggered?.length ?? 0;
      if (triggered > 0) {
        toast.warning(`${triggered} CEP rule(s) triggered`);
      } else {
        toast.info("No CEP rules triggered");
      }
    },
  });
}

// ─────────────────────────────────────────────── Threat Assessment ────────────

/**
 * Get latest threat assessment for a contact.
 */
export function useThreatAssessment(profileId: string | undefined) {
  return useQuery<ThreatAssessment | null>({
    queryKey: ["threat-assessment", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("threat_assessments")
        .select("*")
        .eq("profile_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data as unknown as ThreatAssessment) ?? null;
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Compute a new threat assessment.
 */
export function useComputeThreatAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) =>
      invokeStream({ action: "assess_threat", profileId }),
    onSuccess: (_, profileId) => {
      qc.invalidateQueries({ queryKey: ["threat-assessment", profileId] });
      toast.success("Threat assessment updated");
    },
  });
}

// ─────────────────────────────────────────────── OSINT ────────────────────────

/**
 * Run OSINT collection for a contact.
 */
export function useRunOSINTCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { profileId: string; contactName: string; collectionType?: string }) =>
      invokeOSINT({ action: "collect", ...params }),
    onMutate: (vars) => {
      toast.info(`OSINT collection started (${vars.collectionType ?? "news"})…`, { id: "osint-run", duration: 60000 });
    },
    onSuccess: (data, vars) => {
      toast.dismiss("osint-run");
      toast.success(`OSINT: ${data.mentions_found ?? 0} mentions found`);
      qc.invalidateQueries({ queryKey: ["osint-status", vars.profileId] });
      qc.invalidateQueries({ queryKey: ["osint-mentions", vars.profileId] });
      qc.invalidateQueries({ queryKey: ["intelligence-feed"] });
    },
    onError: (err) => {
      toast.dismiss("osint-run");
      toast.error(`OSINT failed: ${err.message}`);
    },
  });
}

/**
 * OSINT collection status for a contact.
 */
export function useOSINTStatus(profileId: string | undefined) {
  return useQuery({
    queryKey: ["osint-status", profileId],
    queryFn: () => invokeOSINT({ action: "get_status", profileId }),
    enabled: !!profileId,
    staleTime: 1000 * 60,
  });
}

/**
 * OSINT mentions for a contact (paginated).
 */
export function useOSINTMentions(profileId: string | undefined, actionableOnly = false) {
  return useQuery<{ mentions: OSINTMention[]; total: number }>({
    queryKey: ["osint-mentions", profileId, actionableOnly],
    queryFn: () => invokeOSINT({ action: "get_mentions", profileId, actionableOnly }),
    enabled: !!profileId,
    staleTime: 1000 * 60,
  });
}

/**
 * Dismiss an OSINT mention.
 */
export function useDismissMention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mentionId: string) => invokeOSINT({ action: "dismiss", mentionId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["osint-mentions"] }),
  });
}

// ─────────────────────────────────────────────── Combined ─────────────────────

/**
 * Combined hook for the Intelligence Feed page.
 */
export function useIntelligenceFeedPage(profileId: string | undefined) {
  const feed = useIntelligenceFeed({ profileId, limit: 30 });
  const threat = useThreatAssessment(profileId);
  const osintStatus = useOSINTStatus(profileId);
  const osintMentions = useOSINTMentions(profileId);
  const acknowledge = useAcknowledgeEvent();
  const processRules = useProcessCEPRules();
  const runOSINT = useRunOSINTCollection();
  const computeThreat = useComputeThreatAssessment();

  return {
    events: feed.events,
    totalEvents: feed.total,
    threat: threat.data,
    osintStatus: osintStatus.data,
    osintMentions: osintMentions.data?.mentions ?? [],
    isLoading: feed.isLoading || threat.isLoading,
    acknowledge,
    processRules,
    runOSINT,
    computeThreat,
  };
}
