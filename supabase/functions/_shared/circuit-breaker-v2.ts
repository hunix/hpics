/**
 * Circuit Breaker V2 (v4.0.0)
 * 
 * Enhanced circuit breaker pattern for external service calls.
 * Prevents cascade failures by isolating failing services.
 * 
 * @module _shared/circuit-breaker-v2
 */

/**
 * Circuit breaker states.
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration.
 */
interface CircuitConfig {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold: number;
  /** Time in ms before attempting recovery (default: 60000) */
  recoveryTimeout: number;
  /** Number of successful calls to close circuit (default: 3) */
  successThreshold: number;
  /** Optional circuit name for logging */
  name?: string;
}

/**
 * Circuit state tracking.
 */
interface CircuitRecord {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number;
  lastSuccess: number;
  totalCalls: number;
  totalFailures: number;
}

// Global circuit registry
const circuits = new Map<string, CircuitRecord>();

// Default configuration
const defaultConfig: CircuitConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000,
  successThreshold: 3,
};

/**
 * Get or create circuit record.
 */
function getCircuit(name: string): CircuitRecord {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailure: 0,
      lastSuccess: 0,
      totalCalls: 0,
      totalFailures: 0,
    });
  }
  return circuits.get(name)!;
}

/**
 * Execute function with circuit breaker protection.
 * 
 * @param name - Circuit identifier
 * @param fn - Function to execute
 * @param config - Circuit configuration
 * @returns Function result
 * @throws CircuitOpenError if circuit is open
 * 
 * @example
 * const result = await withCircuitBreaker(
 *   'openai-api',
 *   () => callOpenAI(prompt),
 *   { failureThreshold: 3, recoveryTimeout: 30000 }
 * );
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config: Partial<CircuitConfig> = {}
): Promise<T> {
  const cfg = { ...defaultConfig, ...config };
  const circuit = getCircuit(name);
  const now = Date.now();

  // Check circuit state
  if (circuit.state === 'open') {
    // Check if recovery period has passed
    if (now - circuit.lastFailure >= cfg.recoveryTimeout) {
      circuit.state = 'half-open';
      circuit.successes = 0;
      console.log(`[CircuitBreaker:${name}] Transitioning to half-open`);
    } else {
      const remainingMs = cfg.recoveryTimeout - (now - circuit.lastFailure);
      throw new CircuitOpenError(name, remainingMs);
    }
  }

  circuit.totalCalls++;

  try {
    const result = await fn();

    // Success handling
    circuit.lastSuccess = now;

    if (circuit.state === 'half-open') {
      circuit.successes++;
      if (circuit.successes >= cfg.successThreshold) {
        circuit.state = 'closed';
        circuit.failures = 0;
        console.log(`[CircuitBreaker:${name}] Circuit closed after recovery`);
      }
    } else {
      // Reset failures on success in closed state
      circuit.failures = 0;
    }

    return result;
  } catch (error) {
    // Failure handling
    circuit.failures++;
    circuit.totalFailures++;
    circuit.lastFailure = now;

    if (circuit.state === 'half-open') {
      // Immediate open on failure during half-open
      circuit.state = 'open';
      console.log(`[CircuitBreaker:${name}] Circuit re-opened during recovery`);
    } else if (circuit.failures >= cfg.failureThreshold) {
      circuit.state = 'open';
      console.log(`[CircuitBreaker:${name}] Circuit opened after ${circuit.failures} failures`);
    }

    throw error;
  }
}

/**
 * Error thrown when circuit is open.
 */
export class CircuitOpenError extends Error {
  constructor(
    public circuitName: string,
    public retryAfterMs: number
  ) {
    super(`Circuit '${circuitName}' is open. Retry after ${Math.ceil(retryAfterMs / 1000)}s`);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Get circuit status.
 * 
 * @param name - Circuit identifier
 * @returns Circuit state and statistics
 */
export function getCircuitStatus(name: string): CircuitRecord & { name: string } {
  const circuit = getCircuit(name);
  return { name, ...circuit };
}

/**
 * Get all circuit statuses.
 */
export function getAllCircuitStatuses(): Array<CircuitRecord & { name: string }> {
  return Array.from(circuits.entries()).map(([name, record]) => ({
    name,
    ...record,
  }));
}

/**
 * Reset a circuit to closed state.
 * Use with caution - primarily for testing.
 */
export function resetCircuit(name: string): void {
  circuits.delete(name);
  console.log(`[CircuitBreaker:${name}] Circuit reset`);
}

/**
 * Reset all circuits.
 */
export function resetAllCircuits(): void {
  circuits.clear();
  console.log('[CircuitBreaker] All circuits reset');
}

/**
 * Force open a circuit.
 * Useful for manual intervention during incidents.
 */
export function forceOpenCircuit(name: string): void {
  const circuit = getCircuit(name);
  circuit.state = 'open';
  circuit.lastFailure = Date.now();
  console.log(`[CircuitBreaker:${name}] Circuit force-opened`);
}

/**
 * Force close a circuit.
 * Useful for manual recovery after fixing issues.
 */
export function forceCloseCircuit(name: string): void {
  const circuit = getCircuit(name);
  circuit.state = 'closed';
  circuit.failures = 0;
  console.log(`[CircuitBreaker:${name}] Circuit force-closed`);
}

// ============================================================================
// Retry with Circuit Breaker
// ============================================================================

/**
 * Retry configuration.
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Execute with retry and circuit breaker.
 * 
 * @param name - Circuit identifier
 * @param fn - Function to execute
 * @param circuitConfig - Circuit breaker config
 * @param retryConfig - Retry config
 * @returns Function result
 */
export async function withRetryAndCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  circuitConfig: Partial<CircuitConfig> = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...defaultRetryConfig, ...retryConfig };
  let lastError: Error | null = null;
  let delay = cfg.initialDelayMs;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await withCircuitBreaker(name, fn, circuitConfig);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if circuit is open
      if (error instanceof CircuitOpenError) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === cfg.maxRetries) {
        break;
      }

      // Wait before retry
      console.log(`[Retry:${name}] Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay = Math.min(delay * cfg.backoffMultiplier, cfg.maxDelayMs);
    }
  }

  throw lastError;
}
