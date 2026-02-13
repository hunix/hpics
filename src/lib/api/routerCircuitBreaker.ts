/**
 * Router-Level Circuit Breaker (v4.0.0)
 * 
 * Consolidates per-function circuit breakers into per-router breakers.
 * Instead of 407 individual breakers, we maintain ~15 router-level ones.
 * 
 * @module lib/api/routerCircuitBreaker
 */

import { getCircuitBreaker, type CircuitBreakerConfig } from '@/lib/circuitBreaker';
import { getRouterName, getRouterNames } from '@/lib/api/edgeFunctionRouter';

/**
 * Router-specific circuit breaker configurations.
 * Higher-traffic routers get more lenient thresholds.
 */
const ROUTER_CONFIGS: Record<string, Partial<CircuitBreakerConfig>> = {
  'analysis-router': { failureThreshold: 5, resetTimeoutMs: 60000 },
  'intelligence-router': { failureThreshold: 5, resetTimeoutMs: 60000 },
  'prediction-router': { failureThreshold: 4, resetTimeoutMs: 45000 },
  'warfare-router': { failureThreshold: 4, resetTimeoutMs: 45000 },
  'biometric-router': { failureThreshold: 3, resetTimeoutMs: 30000 },
  'network-router': { failureThreshold: 4, resetTimeoutMs: 45000 },
  'enrichment-router': { failureThreshold: 3, resetTimeoutMs: 60000 },
  'fusion-router': { failureThreshold: 4, resetTimeoutMs: 45000 },
  'agis-router': { failureThreshold: 5, resetTimeoutMs: 60000 },
  'utility-router': { failureThreshold: 3, resetTimeoutMs: 30000 },
  'hardware-router': { failureThreshold: 3, resetTimeoutMs: 30000 },
  'voice-router': { failureThreshold: 3, resetTimeoutMs: 45000 },
  'document-router': { failureThreshold: 3, resetTimeoutMs: 30000 },
  'security-router': { failureThreshold: 3, resetTimeoutMs: 45000 },
};

/**
 * Get a circuit breaker for a router (not per-function).
 * Legacy function names are resolved to their router first.
 */
export function getRouterBreaker(functionOrRouterName: string) {
  const routerName = getRouterName(functionOrRouterName) ?? functionOrRouterName;
  const config = ROUTER_CONFIGS[routerName] ?? { failureThreshold: 4, resetTimeoutMs: 45000 };
  return getCircuitBreaker(`router:${routerName}`, config);
}

/**
 * Get health status for all routers.
 */
export function getAllRouterHealth(): Record<string, {
  state: string;
  failures: number;
  successRate: number;
  isHealthy: boolean;
}> {
  const health: Record<string, { state: string; failures: number; successRate: number; isHealthy: boolean }> = {};

  for (const routerName of getRouterNames()) {
    const breaker = getRouterBreaker(routerName);
    const stats = breaker.getStats();
    health[routerName] = {
      state: stats.state,
      failures: stats.failures,
      successRate: stats.totalRequests > 0
        ? (stats.totalRequests - stats.failures) / stats.totalRequests
        : 1,
      isHealthy: stats.state === 'closed',
    };
  }

  return health;
}

/**
 * Execute a function call with router-level circuit breaker protection.
 */
export async function withRouterBreaker<T>(
  functionName: string,
  fn: () => Promise<T>
): Promise<T> {
  const breaker = getRouterBreaker(functionName);
  return breaker.execute(fn);
}

/**
 * Get summary of router health for dashboard display.
 */
export function getRouterHealthSummary(): {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
} {
  const health = getAllRouterHealth();
  const values = Object.values(health);
  return {
    total: values.length,
    healthy: values.filter(v => v.state === 'closed').length,
    degraded: values.filter(v => v.state === 'half-open').length,
    down: values.filter(v => v.state === 'open').length,
  };
}
