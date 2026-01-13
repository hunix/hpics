// Client-Side Rate Limiter with Sliding Window Algorithm

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  timestamps: number[];
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  retryAfter?: number;
}

// Default rate limits per endpoint pattern
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  'ai': { maxRequests: 10, windowMs: 60000 },           // 10 AI calls per minute
  'auth': { maxRequests: 5, windowMs: 60000 },          // 5 auth attempts per minute
  'upload': { maxRequests: 20, windowMs: 60000 },       // 20 uploads per minute
  'mutation': { maxRequests: 30, windowMs: 60000 },     // 30 mutations per minute
  'query': { maxRequests: 100, windowMs: 60000 },       // 100 queries per minute
  'default': { maxRequests: 60, windowMs: 60000 },      // 60 requests per minute default
};

// Storage for rate limit entries
const rateLimitStore = new Map<string, RateLimitEntry>();

// Penalty multiplier for repeated violations
const PENALTY_MULTIPLIER = 2;
const MAX_PENALTY_DURATION = 300000; // 5 minutes max penalty

/**
 * Clean up old timestamps from the sliding window
 */
function cleanupOldTimestamps(timestamps: number[], windowMs: number): number[] {
  const now = Date.now();
  const cutoff = now - windowMs;
  return timestamps.filter(ts => ts > cutoff);
}

/**
 * Get rate limit configuration for an endpoint
 */
function getConfigForEndpoint(endpoint: string): RateLimitConfig {
  // Check for specific patterns
  if (endpoint.includes('/ai/') || endpoint.includes('openai') || endpoint.includes('anthropic')) {
    return DEFAULT_LIMITS.ai;
  }
  if (endpoint.includes('/auth/')) {
    return DEFAULT_LIMITS.auth;
  }
  if (endpoint.includes('/upload') || endpoint.includes('/storage/')) {
    return DEFAULT_LIMITS.upload;
  }
  if (endpoint.includes('mutation') || endpoint.includes('insert') || endpoint.includes('update') || endpoint.includes('delete')) {
    return DEFAULT_LIMITS.mutation;
  }
  if (endpoint.includes('query') || endpoint.includes('select') || endpoint.includes('fetch')) {
    return DEFAULT_LIMITS.query;
  }
  
  return DEFAULT_LIMITS.default;
}

/**
 * Check if request is allowed under rate limit
 */
export function checkRateLimit(
  key: string, 
  config?: RateLimitConfig
): RateLimitResult {
  const effectiveConfig = config || getConfigForEndpoint(key);
  const now = Date.now();
  
  // Get or create entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [], blocked: false };
    rateLimitStore.set(key, entry);
  }
  
  // Check if currently blocked (penalty)
  if (entry.blocked && entry.blockedUntil) {
    if (now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.blockedUntil - now,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }
    // Penalty expired, reset
    entry.blocked = false;
    entry.blockedUntil = undefined;
  }
  
  // Clean up old timestamps
  entry.timestamps = cleanupOldTimestamps(entry.timestamps, effectiveConfig.windowMs);
  
  // Check if limit exceeded
  if (entry.timestamps.length >= effectiveConfig.maxRequests) {
    // Calculate when oldest request will fall out of window
    const oldestTimestamp = entry.timestamps[0];
    const resetIn = oldestTimestamp + effectiveConfig.windowMs - now;
    
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      retryAfter: Math.ceil(resetIn / 1000),
    };
  }
  
  // Request allowed
  return {
    allowed: true,
    remaining: effectiveConfig.maxRequests - entry.timestamps.length - 1,
    resetIn: entry.timestamps.length > 0 
      ? entry.timestamps[0] + effectiveConfig.windowMs - now 
      : effectiveConfig.windowMs,
  };
}

/**
 * Record a request in the rate limiter
 */
export function recordRequest(key: string): void {
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [], blocked: false };
    rateLimitStore.set(key, entry);
  }
  
  entry.timestamps.push(Date.now());
}

/**
 * Apply a penalty for violations (e.g., after receiving 429 from server)
 */
export function applyPenalty(key: string, durationMs?: number): void {
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [], blocked: false };
    rateLimitStore.set(key, entry);
  }
  
  const config = getConfigForEndpoint(key);
  const baseDuration = durationMs || config.windowMs;
  
  // Calculate penalty with multiplier for repeat violations
  let penaltyDuration = baseDuration;
  if (entry.blocked && entry.blockedUntil && entry.blockedUntil > Date.now()) {
    // Already blocked - increase penalty
    penaltyDuration = Math.min(baseDuration * PENALTY_MULTIPLIER, MAX_PENALTY_DURATION);
  }
  
  entry.blocked = true;
  entry.blockedUntil = Date.now() + penaltyDuration;
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Reset all rate limits
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current status for a key
 */
export function getRateLimitStatus(key: string): {
  currentRequests: number;
  isBlocked: boolean;
  blockedUntil?: Date;
} {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return { currentRequests: 0, isBlocked: false };
  }
  
  const config = getConfigForEndpoint(key);
  const cleanedTimestamps = cleanupOldTimestamps(entry.timestamps, config.windowMs);
  
  return {
    currentRequests: cleanedTimestamps.length,
    isBlocked: entry.blocked && entry.blockedUntil ? Date.now() < entry.blockedUntil : false,
    blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil) : undefined,
  };
}

/**
 * Higher-order function to wrap async functions with rate limiting
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  key: string,
  config?: RateLimitConfig
): T {
  return (async (...args: Parameters<T>) => {
    const result = checkRateLimit(key, config);
    
    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        result.retryAfter || 0
      );
    }
    
    recordRequest(key);
    
    try {
      return await fn(...args);
    } catch (error) {
      // Check if error indicates server-side rate limit
      if (error instanceof Error && error.message.includes('429')) {
        applyPenalty(key);
      }
      throw error;
    }
  }) as T;
}

/**
 * Custom error for rate limit violations
 */
export class RateLimitError extends Error {
  retryAfter: number;
  
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * React hook helper for rate limiting
 */
export function createRateLimitedFn<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  key: string,
  options?: {
    config?: RateLimitConfig;
    onRateLimited?: (result: RateLimitResult) => void;
    queue?: boolean; // If true, queue requests instead of rejecting
  }
): {
  execute: T;
  status: () => RateLimitResult;
  reset: () => void;
} {
  const { config, onRateLimited, queue = false } = options || {};
  
  const pendingQueue: Array<{
    args: Parameters<T>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  
  let processingQueue = false;
  
  const processQueue = async () => {
    if (processingQueue || pendingQueue.length === 0) return;
    processingQueue = true;
    
    while (pendingQueue.length > 0) {
      const result = checkRateLimit(key, config);
      
      if (!result.allowed) {
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, result.resetIn));
        continue;
      }
      
      const item = pendingQueue.shift()!;
      recordRequest(key);
      
      try {
        const result = await fn(...item.args);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
    
    processingQueue = false;
  };
  
  const execute = (async (...args: Parameters<T>) => {
    const result = checkRateLimit(key, config);
    
    if (!result.allowed) {
      onRateLimited?.(result);
      
      if (queue) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ args, resolve, reject });
          processQueue();
        });
      }
      
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        result.retryAfter || 0
      );
    }
    
    recordRequest(key);
    return fn(...args);
  }) as T;
  
  return {
    execute,
    status: () => checkRateLimit(key, config),
    reset: () => resetRateLimit(key),
  };
}