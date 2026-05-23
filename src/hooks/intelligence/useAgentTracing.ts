/**
 * Agent Tracing Hook (v3.9.35)
 * React hooks for agent observability and trace visualization
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
type SpanType = 'AGENT' | 'TOOL' | 'RETRIEVER' | 'GUARDRAIL' | 'EVALUATOR';

interface TraceSession {
  id: string;
  user_id: string;
  session_type: string;
  trace_id: string;
  parent_trace_id: string | null;
  status: 'in_progress' | 'completed' | 'failed';
  started_at: string;
  ended_at: string | null;
  total_spans: number;
  total_cost_cents: number;
  error_count: number;
  metadata: Record<string, unknown>;
}

interface AgentSpan {
  id: string;
  trace_session_id: string;
  span_id: string;
  parent_span_id: string | null;
  span_type: SpanType;
  span_name: string;
  agent_type: string | null;
  function_name: string | null;
  status: 'ok' | 'error' | 'timeout';
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  input_summary: string | null;
  output_summary: string | null;
  attributes: Record<string, unknown>;
  events: Array<{ name: string; timestamp: string; attributes: Record<string, unknown> }>;
  cost_cents: number;
  error_message: string | null;
}

interface SpanTypeDefinition {
  id: string;
  span_type: SpanType;
  display_name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  tracked_attributes: string[];
  is_active: boolean;
}

interface ObservabilityConfig {
  id: string;
  config_key: string;
  display_name: string;
  description: string | null;
  config_value: Record<string, unknown>;
  is_active: boolean;
}

interface TraceStats {
  totalTraces: number;
  completedTraces: number;
  failedTraces: number;
  totalSpans: number;
  totalCostCents: number;
  avgDurationMs: number;
  errorRate: number;
}

// Query keys
const traceKeys = {
  all: ['agent-tracing'] as const,
  sessions: () => [...traceKeys.all, 'sessions'] as const,
  session: (id: string) => [...traceKeys.sessions(), id] as const,
  spans: (sessionId: string | null) => [...traceKeys.all, 'spans', sessionId] as const,
  spanTypes: () => [...traceKeys.all, 'span-types'] as const,
  configs: () => [...traceKeys.all, 'configs'] as const,
  stats: (period: string) => [...traceKeys.all, 'stats', period] as const,
};

/**
 * Fetch recent trace sessions
 */
export function useTraceSessions(options?: { limit?: number; status?: string; sessionType?: string }) {
  return useQuery({
    queryKey: [...traceKeys.sessions(), options?.limit, options?.status, options?.sessionType],
    queryFn: async () => {
      let query = supabase
        .from('agent_trace_sessions')
        .select('*')
        .order('started_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.sessionType) {
        query = query.eq('session_type', options.sessionType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as TraceSession[];
    },
  });
}

/**
 * Fetch a specific trace session with its spans
 */
export function useTraceSessionWithSpans(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: traceKeys.session(sessionId || ''),
    queryFn: async () => {
      const [sessionResult, spansResult] = await Promise.all([
        supabase.from('agent_trace_sessions').select('*').eq('id', sessionId!).single(),
        supabase.from('agent_spans').select('*').eq('trace_session_id', sessionId!).order('started_at'),
      ]);

      if (sessionResult.error) throw sessionResult.error;

      return {
        session: sessionResult.data as unknown as TraceSession,
        spans: (spansResult.data || []) as unknown as AgentSpan[],
      };
    },
    enabled: !!sessionId,
  });
}

/**
 * Fetch spans for a session
 */
export function useSessionSpans(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: traceKeys.spans(sessionId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_spans')
        .select('*')
        .eq('trace_session_id', sessionId!)
        .order('started_at');

      if (error) throw error;
      return data as unknown as AgentSpan[];
    },
    enabled: !!sessionId,
  });
}

/**
 * Fetch span type definitions
 */
export function useSpanTypeDefinitions() {
  return useQuery({
    queryKey: traceKeys.spanTypes(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('span_type_definitions')
        .select('*')
        .eq('is_active', true)
        .order('span_type');

      if (error) throw error;
      return data as unknown as SpanTypeDefinition[];
    },
  });
}

/**
 * Fetch observability configurations
 */
export function useObservabilityConfigs() {
  return useQuery({
    queryKey: traceKeys.configs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observability_config')
        .select('*')
        .eq('is_active', true)
        .order('config_key');

      if (error) throw error;
      return data as unknown as ObservabilityConfig[];
    },
  });
}

/**
 * Calculate trace statistics for a time period
 */
export function useTraceStats(period: 'hour' | 'day' | 'week' = 'day') {
  return useQuery({
    queryKey: traceKeys.stats(period),
    queryFn: async () => {
      const now = new Date();
      let since: Date;
      
      switch (period) {
        case 'hour':
          since = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'week':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const { data: sessions, error } = await supabase
        .from('agent_trace_sessions')
        .select('status, total_spans, total_cost_cents, error_count, started_at, ended_at')
        .gte('started_at', since.toISOString());

      if (error) throw error;

      const sessionsData = sessions as unknown as TraceSession[];
      
      const stats: TraceStats = {
        totalTraces: sessionsData.length,
        completedTraces: sessionsData.filter(s => s.status === 'completed').length,
        failedTraces: sessionsData.filter(s => s.status === 'failed').length,
        totalSpans: sessionsData.reduce((sum, s) => sum + (s.total_spans || 0), 0),
        totalCostCents: sessionsData.reduce((sum, s) => sum + (s.total_cost_cents || 0), 0),
        avgDurationMs: 0,
        errorRate: 0,
      };

      // Calculate average duration
      const completedSessions = sessionsData.filter(s => s.ended_at);
      if (completedSessions.length > 0) {
        const totalDuration = completedSessions.reduce((sum, s) => {
          return sum + (new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime());
        }, 0);
        stats.avgDurationMs = totalDuration / completedSessions.length;
      }

      // Calculate error rate
      if (stats.totalTraces > 0) {
        stats.errorRate = stats.failedTraces / stats.totalTraces;
      }

      return stats;
    },
  });
}

/**
 * Build a span tree from flat spans list
 */
export function buildSpanTree(spans: AgentSpan[]): AgentSpan[] {
  const spanMap = new Map(spans.map(s => [s.span_id, { ...s, children: [] as AgentSpan[] }]));
  const roots: AgentSpan[] = [];

  spans.forEach(span => {
    if (span.parent_span_id) {
      const parent = spanMap.get(span.parent_span_id);
      if (parent) {
        (parent as AgentSpan & { children: AgentSpan[] }).children.push(spanMap.get(span.span_id)!);
      } else {
        roots.push(spanMap.get(span.span_id)!);
      }
    } else {
      roots.push(spanMap.get(span.span_id)!);
    }
  });

  return roots;
}

/**
 * Calculate span timeline data for visualization
 */
export function calculateSpanTimeline(spans: AgentSpan[]) {
  if (spans.length === 0) return { startTime: 0, endTime: 0, spans: [] };

  const startTime = Math.min(...spans.map(s => new Date(s.started_at).getTime()));
  const endTime = Math.max(...spans.map(s => 
    s.ended_at ? new Date(s.ended_at).getTime() : new Date(s.started_at).getTime() + (s.duration_ms || 0)
  ));

  const timelineSpans = spans.map(span => ({
    ...span,
    relativeStart: new Date(span.started_at).getTime() - startTime,
    relativeEnd: span.ended_at 
      ? new Date(span.ended_at).getTime() - startTime 
      : new Date(span.started_at).getTime() + (span.duration_ms || 0) - startTime,
  }));

  return {
    startTime,
    endTime,
    totalDuration: endTime - startTime,
    spans: timelineSpans,
  };
}

/**
 * Hook to refresh trace data
 */
export function useRefreshTraces() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: traceKeys.all });
  };
}
