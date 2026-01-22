/**
 * Agent Observability Layer (v3.9.35)
 * OpenTelemetry-compatible tracing for multi-agent workflows
 * All configuration is loaded from database tables
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Span Types - loaded from span_type_definitions table
export type SpanType = 'AGENT' | 'TOOL' | 'RETRIEVER' | 'GUARDRAIL' | 'EVALUATOR';

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sessionId: string;
}

export interface SpanOptions {
  spanType: SpanType;
  spanName: string;
  agentType?: string;
  functionName?: string;
  attributes?: Record<string, unknown>;
  inputSummary?: string;
}

export interface SpanResult {
  status: 'ok' | 'error' | 'timeout';
  outputSummary?: string;
  error?: string;
  costCents?: number;
}

interface ObservabilityConfig {
  sampleRate: number;
  sampleErrorTraces: boolean;
  maxSpansPerTrace: number;
  includeUserId: boolean;
  includeCost: boolean;
  includeModel: boolean;
}

// Config cache
let configCache: { config: ObservabilityConfig; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a unique trace ID (16 hex chars)
 */
export function generateTraceId(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Generate a unique span ID (8 hex chars)
 */
export function generateSpanId(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 8);
}

/**
 * Load observability configuration from database
 */
async function loadObservabilityConfig(supabase: SupabaseClient): Promise<ObservabilityConfig> {
  // Check cache
  if (configCache && Date.now() - configCache.timestamp < CACHE_TTL_MS) {
    return configCache.config;
  }

  const defaults: ObservabilityConfig = {
    sampleRate: 1.0,
    sampleErrorTraces: true,
    maxSpansPerTrace: 500,
    includeUserId: true,
    includeCost: true,
    includeModel: true,
  };

  try {
    const { data: configs } = await supabase
      .from('observability_config')
      .select('config_key, config_value')
      .eq('is_active', true);

    if (configs) {
      for (const c of configs) {
        if (c.config_key === 'sampling' && c.config_value) {
          defaults.sampleRate = c.config_value.sample_rate ?? defaults.sampleRate;
          defaults.sampleErrorTraces = c.config_value.sample_error_traces ?? defaults.sampleErrorTraces;
          defaults.maxSpansPerTrace = c.config_value.max_spans_per_trace ?? defaults.maxSpansPerTrace;
        }
        if (c.config_key === 'attributes' && c.config_value) {
          defaults.includeUserId = c.config_value.include_user_id ?? defaults.includeUserId;
          defaults.includeCost = c.config_value.include_cost ?? defaults.includeCost;
          defaults.includeModel = c.config_value.include_model ?? defaults.includeModel;
        }
      }
    }

    configCache = { config: defaults, timestamp: Date.now() };
    return defaults;
  } catch (error) {
    console.warn('Failed to load observability config, using defaults:', error);
    return defaults;
  }
}

/**
 * Check if this trace should be sampled
 */
async function shouldSample(supabase: SupabaseClient, isError: boolean = false): Promise<boolean> {
  const config = await loadObservabilityConfig(supabase);
  
  if (isError && config.sampleErrorTraces) {
    return true;
  }
  
  return Math.random() < config.sampleRate;
}

/**
 * Start a new trace session
 */
export async function startTraceSession(
  supabase: SupabaseClient,
  userId: string,
  sessionType: string,
  parentTraceId?: string
): Promise<{ sessionId: string; traceId: string } | null> {
  const shouldTrace = await shouldSample(supabase);
  if (!shouldTrace) {
    return null; // Skip tracing for this session
  }

  const traceId = generateTraceId();
  
  const { data, error } = await supabase
    .from('agent_trace_sessions')
    .insert({
      user_id: userId,
      session_type: sessionType,
      trace_id: traceId,
      parent_trace_id: parentTraceId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to start trace session:', error);
    return null;
  }

  return { sessionId: data.id, traceId };
}

/**
 * End a trace session
 */
export async function endTraceSession(
  supabase: SupabaseClient,
  sessionId: string,
  status: 'completed' | 'failed' = 'completed',
  additionalCostCents: number = 0
): Promise<void> {
  // Get span counts and costs
  const { data: spanStats } = await supabase
    .from('agent_spans')
    .select('cost_cents, status')
    .eq('trace_session_id', sessionId);

  const totalSpans = spanStats?.length || 0;
  const errorCount = spanStats?.filter((s: { status: string }) => s.status === 'error').length || 0;
  const totalCostCents = (spanStats?.reduce((sum: number, s: { cost_cents: number | null }) => sum + (s.cost_cents || 0), 0) || 0) + additionalCostCents;

  const { error } = await supabase
    .from('agent_trace_sessions')
    .update({
      status,
      ended_at: new Date().toISOString(),
      total_spans: totalSpans,
      error_count: errorCount,
      total_cost_cents: totalCostCents
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to end trace session:', error);
  }
}

/**
 * Start a span within a trace session
 */
export async function startSpan(
  supabase: SupabaseClient,
  sessionId: string,
  options: SpanOptions,
  parentSpanId?: string
): Promise<SpanContext | null> {
  if (!sessionId) return null;

  const spanId = generateSpanId();
  
  // Get trace_id from session
  const { data: session } = await supabase
    .from('agent_trace_sessions')
    .select('trace_id, total_spans')
    .eq('id', sessionId)
    .single();

  if (!session) return null;

  // Check max spans limit
  const config = await loadObservabilityConfig(supabase);
  if (session.total_spans >= config.maxSpansPerTrace) {
    console.warn(`Max spans (${config.maxSpansPerTrace}) reached for session ${sessionId}`);
    return null;
  }

  const { error } = await supabase
    .from('agent_spans')
    .insert({
      trace_session_id: sessionId,
      span_id: spanId,
      parent_span_id: parentSpanId,
      span_type: options.spanType,
      span_name: options.spanName,
      agent_type: options.agentType,
      function_name: options.functionName,
      status: 'ok',
      started_at: new Date().toISOString(),
      input_summary: options.inputSummary,
      attributes: options.attributes || {},
    });

  if (error) {
    console.error('Failed to start span:', error);
    return null;
  }

  // Increment span count
  await supabase
    .from('agent_trace_sessions')
    .update({ total_spans: session.total_spans + 1 })
    .eq('id', sessionId);

  return {
    traceId: session.trace_id,
    spanId,
    parentSpanId,
    sessionId,
  };
}

/**
 * End a span with results
 */
export async function endSpan(
  supabase: SupabaseClient,
  sessionId: string,
  spanId: string,
  result: SpanResult
): Promise<void> {
  if (!sessionId || !spanId) return;

  const endedAt = new Date();
  
  // Get span start time for duration calculation
  const { data: span } = await supabase
    .from('agent_spans')
    .select('started_at')
    .eq('trace_session_id', sessionId)
    .eq('span_id', spanId)
    .single();

  const durationMs = span 
    ? endedAt.getTime() - new Date(span.started_at).getTime()
    : null;

  const { error } = await supabase
    .from('agent_spans')
    .update({
      status: result.status,
      ended_at: endedAt.toISOString(),
      duration_ms: durationMs,
      output_summary: result.outputSummary,
      error_message: result.error,
      cost_cents: result.costCents || 0,
    })
    .eq('trace_session_id', sessionId)
    .eq('span_id', spanId);

  if (error) {
    console.error('Failed to end span:', error);
  }

  // Update session error count if error
  if (result.status === 'error') {
    await supabase.rpc('increment_session_error_count', { session_id: sessionId });
  }

  // Update session total cost
  if (result.costCents) {
    await supabase.rpc('increment_session_cost', { 
      session_id: sessionId, 
      cost: result.costCents 
    });
  }
}

/**
 * Add an event to a span
 */
export async function addSpanEvent(
  supabase: SupabaseClient,
  sessionId: string,
  spanId: string,
  eventName: string,
  attributes?: Record<string, unknown>
): Promise<void> {
  if (!sessionId || !spanId) return;

  const event = {
    name: eventName,
    timestamp: new Date().toISOString(),
    attributes: attributes || {},
  };

  const { data: span } = await supabase
    .from('agent_spans')
    .select('events')
    .eq('trace_session_id', sessionId)
    .eq('span_id', spanId)
    .single();

  if (span) {
    const events = [...(span.events || []), event];
    await supabase
      .from('agent_spans')
      .update({ events })
      .eq('trace_session_id', sessionId)
      .eq('span_id', spanId);
  }
}

/**
 * Wrapper for executing operations with automatic span tracking
 */
export async function withSpan<T>(
  supabase: SupabaseClient,
  sessionId: string | null,
  options: SpanOptions,
  operation: () => Promise<T>,
  parentSpanId?: string
): Promise<T> {
  // If no session, just execute the operation
  if (!sessionId) {
    return operation();
  }

  const context = await startSpan(supabase, sessionId, options, parentSpanId);
  
  if (!context) {
    return operation();
  }

  try {
    const result = await operation();
    await endSpan(supabase, sessionId, context.spanId, {
      status: 'ok',
      outputSummary: typeof result === 'string' 
        ? result.substring(0, 500) 
        : JSON.stringify(result).substring(0, 500),
    });
    return result;
  } catch (error) {
    await endSpan(supabase, sessionId, context.spanId, {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Create a trace context for passing between functions
 */
export function serializeContext(context: SpanContext): string {
  return btoa(JSON.stringify(context));
}

/**
 * Parse a serialized trace context
 */
export function deserializeContext(encoded: string): SpanContext | null {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}
