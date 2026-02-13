/**
 * @fileoverview Advanced Circuit Breaker Implementation
 * Provides fault tolerance patterns for all intelligence operations.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  resetTimeoutMs: number;        // Time to wait before half-open
  halfOpenMaxAttempts: number;   // Attempts allowed in half-open state
  successThreshold: number;      // Successes needed to close from half-open
  monitoringWindowMs: number;    // Time window for failure rate calculation
  fallbackFn?: () => Promise<any>; // Optional fallback function
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  lastStateChange: Date;
  totalRequests: number;
  failureRate: number;
  halfOpenAttempts: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenMaxAttempts: 3,
  successThreshold: 2,
  monitoringWindowMs: 60000,
};

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private halfOpenSuccesses = 0;
  private halfOpenAttempts = 0;
  private lastFailure: Date | null = null;
  private lastSuccess: Date | null = null;
  private lastStateChange: Date = new Date();
  private totalRequests = 0;
  private failureTimestamps: number[] = [];
  private listeners: Set<(stats: CircuitBreakerStats) => void> = new Set();

  constructor(private name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('half-open');
      } else {
        if (this.config.fallbackFn) {
          console.warn(`[CircuitBreaker:${this.name}] Open - executing fallback`);
          return this.config.fallbackFn();
        }
        throw new CircuitOpenError(`Circuit breaker '${this.name}' is open`);
      }
    }

    if (this.state === 'half-open') {
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.transitionTo('open');
        throw new CircuitOpenError(`Circuit breaker '${this.name}' exceeded half-open attempts`);
      }
      this.halfOpenAttempts++;
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordSuccess(): void {
    this.successes++;
    this.lastSuccess = new Date();

    if (this.state === 'half-open') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.successThreshold) {
        this.transitionTo('closed');
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success
      this.failures = Math.max(0, this.failures - 1);
    }

    this.notifyListeners();
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailure = new Date();
    this.failureTimestamps.push(Date.now());

    // Clean old timestamps
    const windowStart = Date.now() - this.config.monitoringWindowMs;
    this.failureTimestamps = this.failureTimestamps.filter(t => t > windowStart);

    if (this.state === 'half-open') {
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo('open');
      }
    }

    this.notifyListeners();
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailure) return true;
    return Date.now() - this.lastFailure.getTime() >= this.config.resetTimeoutMs;
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    if (newState === 'closed') {
      this.failures = 0;
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
    } else if (newState === 'half-open') {
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
    }

    console.log(`[CircuitBreaker:${this.name}] State transition: ${oldState} -> ${newState}`);
    this.notifyListeners();
  }

  getStats(): CircuitBreakerStats {
    const windowStart = Date.now() - this.config.monitoringWindowMs;
    const recentFailures = this.failureTimestamps.filter(t => t > windowStart).length;
    const failureRate = this.totalRequests > 0 ? recentFailures / this.totalRequests : 0;

    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      lastStateChange: this.lastStateChange,
      totalRequests: this.totalRequests,
      failureRate,
      halfOpenAttempts: this.halfOpenAttempts,
    };
  }

  subscribe(listener: (stats: CircuitBreakerStats) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  reset(): void {
    this.transitionTo('closed');
    this.failures = 0;
    this.successes = 0;
    this.failureTimestamps = [];
    this.totalRequests = 0;
  }
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

// Global circuit breaker registry with LRU eviction
const circuitBreakers = new Map<string, CircuitBreaker>();
const circuitBreakerLastUsed = new Map<string, number>();
const MAX_CIRCUIT_BREAKERS = 100;

function evictStaleBreakers() {
  if (circuitBreakers.size <= MAX_CIRCUIT_BREAKERS) return;
  
  // Evict oldest entries beyond the limit
  const entries = [...circuitBreakerLastUsed.entries()]
    .sort((a, b) => a[1] - b[1]);
  
  const toRemove = entries.slice(0, circuitBreakers.size - MAX_CIRCUIT_BREAKERS);
  for (const [name] of toRemove) {
    circuitBreakers.delete(name);
    circuitBreakerLastUsed.delete(name);
  }
}

export function getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  circuitBreakerLastUsed.set(name, Date.now());
  if (!circuitBreakers.has(name)) {
    evictStaleBreakers();
    circuitBreakers.set(name, new CircuitBreaker(name, config));
  }
  return circuitBreakers.get(name)!;
}

export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  const stats: Record<string, CircuitBreakerStats> = {};
  circuitBreakers.forEach((breaker, name) => {
    stats[name] = breaker.getStats();
  });
  return stats;
}

export function resetAllCircuitBreakers(): void {
  circuitBreakers.forEach(breaker => breaker.reset());
}

// Pre-configured circuit breakers for common operations
export const intelligenceCircuitBreaker = getCircuitBreaker('intelligence', {
  failureThreshold: 3,
  resetTimeoutMs: 60000,  // 1 minute pause when open
  halfOpenMaxAttempts: 2,
  successThreshold: 2,
  monitoringWindowMs: 120000,  // 2 minute window
});

export const embeddingCircuitBreaker = getCircuitBreaker('embeddings', {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenMaxAttempts: 3,
});

export const enrichmentCircuitBreaker = getCircuitBreaker('enrichment', {
  failureThreshold: 4,
  resetTimeoutMs: 45000,
  halfOpenMaxAttempts: 2,
});

export const analysisCircuitBreaker = getCircuitBreaker('analysis', {
  failureThreshold: 3,
  resetTimeoutMs: 60000,
  halfOpenMaxAttempts: 2,
});

/**
 * Per-function circuit breakers for edge functions
 * Automatically creates a breaker for each function
 */
export function getEdgeFunctionBreaker(functionName: string): CircuitBreaker {
  const breakerName = `edge:${functionName}`;
  return getCircuitBreaker(breakerName, {
    failureThreshold: 3,
    resetTimeoutMs: 60000,  // 1 minute cooldown
    halfOpenMaxAttempts: 2,
    successThreshold: 2,
    monitoringWindowMs: 120000,
  });
}

/**
 * Check if any edge function breakers are open
 */
export function getOpenEdgeFunctionBreakers(): string[] {
  const openBreakers: string[] = [];
  circuitBreakers.forEach((breaker, name) => {
    if (name.startsWith('edge:') && breaker.getStats().state === 'open') {
      openBreakers.push(name.replace('edge:', ''));
    }
  });
  return openBreakers;
}

/**
 * Get time until a specific breaker might reset (0 if closed/half-open)
 */
export function getTimeUntilReset(functionName: string): number {
  const breakerName = `edge:${functionName}`;
  if (!circuitBreakers.has(breakerName)) return 0;
  
  const stats = circuitBreakers.get(breakerName)!.getStats();
  if (stats.state !== 'open' || !stats.lastFailure) return 0;
  
  const breaker = circuitBreakers.get(breakerName)!;
  const config = (breaker as any).config as CircuitBreakerConfig;
  const elapsed = Date.now() - stats.lastFailure.getTime();
  const remaining = config.resetTimeoutMs - elapsed;
  
  return Math.max(0, remaining);
}

/**
 * Decorator for wrapping async functions with circuit breaker protection
 */
export function withCircuitBreaker<
  TArgs extends unknown[] = unknown[],
  TResult = unknown
>(
  breakerName: string,
  fn: (...args: TArgs) => Promise<TResult>,
  config?: Partial<CircuitBreakerConfig>
): (...args: TArgs) => Promise<TResult> {
  const breaker = getCircuitBreaker(breakerName, config);
  return async (...args: TArgs) => {
    return breaker.execute(() => fn(...args));
  };
}
