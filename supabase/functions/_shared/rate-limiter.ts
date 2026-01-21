// Per-User Rate Limiter for Edge Functions
// Uses in-memory storage with sliding window algorithm

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// In-memory store (resets on cold start, acceptable for rate limiting)
const rateLimitStore = new Map<string, RateLimitEntry>();

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
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  userId: string,
  functionName: string
): RateLimitResult {
  const now = Date.now();
  const category = FUNCTION_CATEGORIES[functionName] || 'default';
  const config = RATE_LIMITS[category];
  const key = `${userId}:${category}`;
  
  // Get or create entry
  let entry = rateLimitStore.get(key);
  
  // Check if window has expired
  if (!entry || now - entry.windowStart >= config.windowMs) {
    entry = { count: 0, windowStart: now };
  }
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = config.windowMs - (now - entry.windowStart);
  
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      retryAfter: Math.ceil(resetIn / 1000),
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: remaining - 1,
    resetIn,
  };
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
 * Middleware function to apply rate limiting
 * Returns null if allowed, Response if rate limited
 */
export function applyRateLimit(
  userId: string,
  functionName: string
): Response | null {
  const result = checkRateLimit(userId, functionName);
  
  if (!result.allowed) {
    console.warn(`Rate limit exceeded for user ${userId} on ${functionName}`);
    return createRateLimitResponse(result);
  }
  
  return null;
}

/**
 * Clean up old entries periodically (call this occasionally)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const maxAge = 600000; // 10 minutes
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// Periodic cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 300000);
