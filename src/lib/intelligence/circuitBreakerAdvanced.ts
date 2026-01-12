/**
 * @fileoverview Advanced Circuit Breaker System with Cascading Protection
 * Extended fault tolerance for agency-grade intelligence operations.
 */

import { CircuitState, CircuitBreakerStats, CircuitBreakerConfig, getCircuitBreaker, CircuitOpenError } from '../circuitBreaker';

// ============= DEGRADATION MODES =============
export type DegradationMode = 'full' | 'cached' | 'minimal' | 'offline';

export interface DegradationStrategy {
  mode: DegradationMode;
  capabilities: string[];
  fallbackData?: () => Promise<unknown>;
  notifyUser: boolean;
}

// ============= CASCADING FAILURE PREVENTION =============
export interface DependencyGraph {
  name: string;
  dependencies: string[];
  criticalPath: boolean;
}

const INTELLIGENCE_DEPENDENCY_GRAPH: DependencyGraph[] = [
  { name: 'embeddings', dependencies: [], criticalPath: true },
  { name: 'rag', dependencies: ['embeddings'], criticalPath: true },
  { name: 'analysis', dependencies: ['embeddings'], criticalPath: false },
  { name: 'enrichment', dependencies: [], criticalPath: false },
  { name: 'behavioral', dependencies: ['analysis'], criticalPath: false },
  { name: 'deception', dependencies: ['behavioral', 'analysis'], criticalPath: false },
  { name: 'prediction', dependencies: ['analysis', 'behavioral'], criticalPath: false },
  { name: 'network', dependencies: ['analysis'], criticalPath: false },
  { name: 'romantic', dependencies: ['behavioral', 'analysis'], criticalPath: false },
  { name: 'shadow-network', dependencies: ['network', 'analysis'], criticalPath: false },
  { name: 'fortune', dependencies: ['prediction', 'behavioral'], criticalPath: false },
  { name: 'community-class', dependencies: ['enrichment', 'behavioral'], criticalPath: false },
];

// ============= JITTERED BACKOFF =============
export interface BackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
  multiplier: number;
}

const DEFAULT_BACKOFF: BackoffConfig = {
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  jitterFactor: 0.3,
  multiplier: 2,
};

export function calculateJitteredBackoff(attempt: number, config: BackoffConfig = DEFAULT_BACKOFF): number {
  const exponentialDelay = Math.min(
    config.baseDelayMs * Math.pow(config.multiplier, attempt),
    config.maxDelayMs
  );
  const jitter = exponentialDelay * config.jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, exponentialDelay + jitter);
}

// ============= FALLBACK CHAIN =============
export interface FallbackOption<T> {
  name: string;
  execute: () => Promise<T>;
  condition?: () => boolean;
  timeout?: number;
}

export async function executeFallbackChain<T>(
  options: FallbackOption<T>[],
  context: string
): Promise<{ result: T; usedFallback: string } | null> {
  for (const option of options) {
    if (option.condition && !option.condition()) {
      continue;
    }

    try {
      const timeoutPromise = option.timeout
        ? new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Fallback ${option.name} timeout`)), option.timeout)
          )
        : null;

      const result = timeoutPromise
        ? await Promise.race([option.execute(), timeoutPromise])
        : await option.execute();

      console.log(`[FallbackChain:${context}] Used fallback: ${option.name}`);
      return { result, usedFallback: option.name };
    } catch (error) {
      console.warn(`[FallbackChain:${context}] Fallback ${option.name} failed:`, error);
    }
  }
  return null;
}

// ============= HEALTH PROPAGATION =============
export interface CircuitHealthStatus {
  name: string;
  state: CircuitState;
  healthScore: number; // 0-100
  affectedDependents: string[];
  degradationMode: DegradationMode;
  lastCheck: Date;
}

export function calculateHealthScore(stats: CircuitBreakerStats): number {
  if (stats.state === 'open') return 0;
  if (stats.state === 'half-open') return 30;
  
  const failureWeight = Math.max(0, 100 - stats.failureRate * 200);
  const recentActivity = stats.totalRequests > 0 ? 1 : 0.5;
  
  return Math.round(failureWeight * recentActivity);
}

export function getAffectedDependents(circuitName: string): string[] {
  const affected: string[] = [];
  
  for (const node of INTELLIGENCE_DEPENDENCY_GRAPH) {
    if (node.dependencies.includes(circuitName)) {
      affected.push(node.name);
      affected.push(...getAffectedDependents(node.name));
    }
  }
  
  return [...new Set(affected)];
}

export function determineDegradationMode(healthScore: number): DegradationMode {
  if (healthScore >= 80) return 'full';
  if (healthScore >= 50) return 'cached';
  if (healthScore >= 20) return 'minimal';
  return 'offline';
}

// ============= CIRCUIT PERSISTENCE =============
const STORAGE_KEY = 'circuit_breaker_state';

export interface PersistedCircuitState {
  name: string;
  state: CircuitState;
  failures: number;
  lastFailure: string | null;
  persistedAt: string;
}

export function persistCircuitStates(): void {
  try {
    const breakers = getAllCircuitHealthStatuses();
    const states: PersistedCircuitState[] = breakers.map(b => ({
      name: b.name,
      state: b.state,
      failures: 0, // Would need access to internal state
      lastFailure: null,
      persistedAt: new Date().toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    console.warn('[CircuitPersistence] Failed to persist states:', error);
  }
}

export function restoreCircuitStates(): PersistedCircuitState[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// ============= EXTENDED CIRCUIT BREAKERS =============
export const EXTENDED_CIRCUIT_CONFIGS: Record<string, Partial<CircuitBreakerConfig>> = {
  'behavioral-dna': { failureThreshold: 3, resetTimeoutMs: 45000, halfOpenMaxAttempts: 2 },
  'romantic-intel': { failureThreshold: 4, resetTimeoutMs: 60000, halfOpenMaxAttempts: 2 },
  'community-class': { failureThreshold: 4, resetTimeoutMs: 60000, halfOpenMaxAttempts: 2 },
  'fortune-engine': { failureThreshold: 3, resetTimeoutMs: 45000, halfOpenMaxAttempts: 2 },
  'shadow-network': { failureThreshold: 3, resetTimeoutMs: 60000, halfOpenMaxAttempts: 2 },
  'influence-cascade': { failureThreshold: 4, resetTimeoutMs: 45000, halfOpenMaxAttempts: 3 },
  'deception-detection': { failureThreshold: 3, resetTimeoutMs: 30000, halfOpenMaxAttempts: 2 },
  'manipulation-assess': { failureThreshold: 4, resetTimeoutMs: 45000, halfOpenMaxAttempts: 2 },
  'osint-scan': { failureThreshold: 5, resetTimeoutMs: 90000, halfOpenMaxAttempts: 3 },
  'chrome-extension': { failureThreshold: 5, resetTimeoutMs: 30000, halfOpenMaxAttempts: 3 },
  'mobile-sensors': { failureThreshold: 6, resetTimeoutMs: 20000, halfOpenMaxAttempts: 4 },
  'rag-query': { failureThreshold: 3, resetTimeoutMs: 30000, halfOpenMaxAttempts: 2 },
};

// Initialize all extended circuit breakers
Object.entries(EXTENDED_CIRCUIT_CONFIGS).forEach(([name, config]) => {
  getCircuitBreaker(name, config);
});

// ============= HEALTH STATUS AGGREGATOR =============
export function getAllCircuitHealthStatuses(): CircuitHealthStatus[] {
  const allNames = [
    'intelligence', 'embeddings', 'enrichment', 'analysis',
    ...Object.keys(EXTENDED_CIRCUIT_CONFIGS)
  ];

  return allNames.map(name => {
    const breaker = getCircuitBreaker(name);
    const stats = breaker.getStats();
    const healthScore = calculateHealthScore(stats);

    return {
      name,
      state: stats.state,
      healthScore,
      affectedDependents: getAffectedDependents(name),
      degradationMode: determineDegradationMode(healthScore),
      lastCheck: new Date(),
    };
  });
}

export function getSystemHealthScore(): number {
  const statuses = getAllCircuitHealthStatuses();
  const criticalCircuits = INTELLIGENCE_DEPENDENCY_GRAPH.filter(g => g.criticalPath).map(g => g.name);
  
  const criticalHealth = statuses
    .filter(s => criticalCircuits.includes(s.name))
    .reduce((sum, s) => sum + s.healthScore, 0) / Math.max(1, criticalCircuits.length);

  const overallHealth = statuses.reduce((sum, s) => sum + s.healthScore, 0) / statuses.length;

  // Weight critical paths more heavily
  return Math.round(criticalHealth * 0.6 + overallHealth * 0.4);
}

// ============= INTELLIGENT RETRY =============
export interface RetryConfig {
  maxAttempts: number;
  backoffConfig?: BackoffConfig;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: unknown) => void;
}

export async function executeWithIntelligentRetry<T>(
  operation: () => Promise<T>,
  circuitName: string,
  config: RetryConfig = { maxAttempts: 3 }
): Promise<T> {
  const breaker = getCircuitBreaker(circuitName);
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await breaker.execute(operation);
    } catch (error) {
      lastError = error;

      if (error instanceof CircuitOpenError) {
        throw error; // Don't retry circuit open errors
      }

      const isRetryable = !config.retryableErrors || 
        config.retryableErrors.some(e => String(error).includes(e));

      if (!isRetryable || attempt === config.maxAttempts - 1) {
        throw error;
      }

      const delay = calculateJitteredBackoff(attempt, config.backoffConfig);
      config.onRetry?.(attempt + 1, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============= CIRCUIT BREAKER EVENT EMITTER =============
type CircuitEventType = 'stateChange' | 'failure' | 'success' | 'healthChange';

interface CircuitEvent {
  type: CircuitEventType;
  circuitName: string;
  data: unknown;
  timestamp: Date;
}

const eventListeners = new Map<CircuitEventType, Set<(event: CircuitEvent) => void>>();

export function subscribeToCircuitEvents(
  eventType: CircuitEventType,
  handler: (event: CircuitEvent) => void
): () => void {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Set());
  }
  eventListeners.get(eventType)!.add(handler);
  return () => eventListeners.get(eventType)?.delete(handler);
}

export function emitCircuitEvent(event: CircuitEvent): void {
  const handlers = eventListeners.get(event.type);
  handlers?.forEach(handler => handler(event));
}

// Auto-persist on state changes
subscribeToCircuitEvents('stateChange', () => {
  persistCircuitStates();
});

export { CircuitOpenError };
