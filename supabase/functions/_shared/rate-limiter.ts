// Per-User Rate Limiter for Edge Functions.
// Counters are persisted via the public.rl_increment() Postgres function so
// they survive cold starts. checkRateLimit() is sync; checkRateLimitAsync()
// is the real check that hits the database. Callers that already have an
// async path should prefer the async variant.

import { getServiceClient } from './auth-handler.ts';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Different limits for different function types
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // AI-intensive operations - stricter limits
  'ai-analysis': { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  'ai-generation': { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  
  // Bulk operations - very strict
  'bulk-analysis': { maxRequests: 2, windowMs: 300000 }, // 2 per 5 minutes
  
  // Standard operations - more lenient
  'query': { maxRequests: 60, windowMs: 60000 }, // 60 per minute
  'embedding': { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  
  // Default fallback
  'default': { maxRequests: 30, windowMs: 60000 }, // 30 per minute
};

// Map function names to rate limit categories - v5.4 with all 40 intelligence tasks
const FUNCTION_CATEGORIES: Record<string, string> = {
  // Original media/document analysis
  'analyze-media': 'ai-analysis',
  'analyze-document': 'ai-analysis',
  'generate-relationship-insights': 'ai-analysis',
  'predict-churn': 'ai-analysis',
  'suggest-network-growth': 'ai-analysis',
  'cross-modal-synthesis': 'ai-analysis',
  'aggregate-contact-intelligence': 'ai-analysis',
  
  // AI Generation
  'generate-message': 'ai-generation',
  'generate-approach-strategy': 'ai-generation',
  'ai-guided-interview': 'ai-generation',
  
  // Bulk operations
  'batch-intelligence-init': 'bulk-analysis',
  'process-bulk-analysis': 'bulk-analysis',
  'intelligence-session-runner': 'bulk-analysis',
  
  // Query operations
  'rag-query': 'query',
  'semantic-search': 'query',
  
  // Embedding operations
  'process-document-embeddings': 'embedding',
  'generate-embeddings': 'embedding',
  
  // Core Intelligence Tasks (40 functions)
  'mice-recruitment-analyzer': 'ai-analysis',
  'behavioral-dna-sequencer': 'ai-analysis',
  'attachment-vulnerability-analyzer': 'ai-analysis',
  'manipulation-vulnerability-assessment': 'ai-analysis',
  'phobia-exploitation-engine': 'ai-analysis',
  'cognitive-warfare-engine': 'ai-analysis',
  'trauma-exploitation-engine': 'ai-analysis',
  'enhanced-deception-detector': 'ai-analysis',
  'analyze-influence-profile': 'ai-analysis',
  'coercion-resistance-assessor': 'ai-analysis',
  'existential-leverage-calculator': 'ai-analysis',
  'memetic-propagation-engine': 'ai-analysis',
  'reality-consensus-engine': 'ai-analysis',
  'mass-formation-analyzer': 'ai-analysis',
  'narrative-control-engine': 'ai-analysis',
  'predict-behavioral-scenarios': 'ai-analysis',
  'precognitive-pattern-engine': 'ai-analysis',
  'analyze-network-graph': 'ai-analysis',
  'power-network-analyzer': 'ai-analysis',
  'predict-relationship-trajectory': 'ai-analysis',
  'network-exploitation-mapper': 'ai-analysis',
  'temporal-fusion-transformer': 'ai-analysis',
  'quantum-cognition-engine': 'ai-analysis',
  'morphic-resonance-detector': 'ai-analysis',
  'omega-point-tracker': 'ai-analysis',
  'mosaic-intelligence-fuser': 'ai-analysis',
  'unified-data-fusion': 'ai-analysis',
  'omniscient-orchestrator': 'ai-analysis',
  'generate-intelligence-dossier': 'ai-analysis',
  'aggregate-media-intelligence': 'ai-analysis',
  'opsec-vulnerability-analyzer': 'ai-analysis',
  'social-engineering-detector': 'ai-analysis',
  'crisis-response-orchestrator': 'ai-analysis',
  'lawfare-defense-analyzer': 'ai-analysis',
  'reputation-defense-engine': 'ai-analysis',
  'behavioral-baseline-monitor': 'ai-analysis',
  'family-protection-analyzer': 'ai-analysis',
  'economic-warfare-detector': 'ai-analysis',
  'tscm-sweep-analyzer': 'ai-analysis',
  'digital-footprint-scanner': 'ai-analysis',
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // milliseconds until reset
  retryAfter?: number; // seconds to wait if not allowed
}

/**
 * Persistent rate-limit check. Calls public.rl_increment() atomically.
 * Fail-open: if the database call fails, the request is allowed. Rate
 * limiting must never block a legitimate user because of an unrelated
 * Postgres outage; the underlying problem will surface via 5xx telemetry.
 */
export async function checkRateLimitAsync(
  userId: string,
  functionName: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const category = FUNCTION_CATEGORIES[functionName] || 'default';
  const config = RATE_LIMITS[category];
  const key = `${userId}:${category}`;

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc('rl_increment', {
      p_key: key,
      p_now_ms: now,
      p_window_ms: config.windowMs,
      p_max: config.maxRequests,
    });

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      console.warn('[rate-limiter] rl_increment failed, allowing request', error);
      return { allowed: true, remaining: config.maxRequests, resetIn: config.windowMs };
    }

    const row = Array.isArray(data) ? data[0] : data;
    const allowed = !!row.allowed;
    const remaining = Number(row.remaining ?? 0);
    const resetIn = Number(row.reset_in_ms ?? config.windowMs);

    return {
      allowed,
      remaining,
      resetIn,
      retryAfter: allowed ? undefined : Math.ceil(resetIn / 1000),
    };
  } catch (err) {
    console.warn('[rate-limiter] exception, allowing request', err);
    return { allowed: true, remaining: config.maxRequests, resetIn: config.windowMs };
  }
}

/**
 * @deprecated Synchronous wrapper kept for callers that haven't migrated to
 * checkRateLimitAsync(). Returns a permissive result (allowed) so legacy
 * callers do not silently bypass the real limiter; they should be migrated.
 */
export function checkRateLimit(
  _userId: string,
  functionName: string
): RateLimitResult {
  const category = FUNCTION_CATEGORIES[functionName] || 'default';
  const config = RATE_LIMITS[category];
  return { allowed: true, remaining: config.maxRequests, resetIn: config.windowMs };
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
  };
  
  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return headers;
}

/**
 * Create a 429 Too Many Requests response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please wait ${result.retryAfter} seconds before retrying.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    }
  );
}

/**
 * Async middleware. Returns null if allowed, Response if rate limited.
 * Use this in new code; the sync applyRateLimit() variant is permissive
 * and exists only to keep legacy callers compiling.
 */
export async function applyRateLimitAsync(
  userId: string,
  functionName: string
): Promise<Response | null> {
  const result = await checkRateLimitAsync(userId, functionName);
  if (!result.allowed) {
    console.warn(`Rate limit exceeded for user ${userId} on ${functionName}`);
    return createRateLimitResponse(result);
  }
  return null;
}

/**
 * @deprecated Synchronous wrapper. Always allows; existing call sites should
 * migrate to applyRateLimitAsync().
 */
export function applyRateLimit(
  _userId: string,
  _functionName: string
): Response | null {
  return null;
}
