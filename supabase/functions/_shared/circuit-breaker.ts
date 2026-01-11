/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for external service calls
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;               // Time in ms before trying half-open
  halfOpenRequests: number;      // Number of test requests in half-open
  monitorWindow: number;         // Time window for counting failures (ms)
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  openedAt: number | null;
  halfOpenAttempts: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000, // 30 seconds
  halfOpenRequests: 1,
  monitorWindow: 60000 // 1 minute
};

// In-memory circuit states (per function invocation)
const circuitStates = new Map<string, CircuitBreakerState>();

/**
 * Gets the current state of a circuit
 */
function getCircuitState(component: string): CircuitBreakerState {
  if (!circuitStates.has(component)) {
    circuitStates.set(component, {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      openedAt: null,
      halfOpenAttempts: 0
    });
  }
  return circuitStates.get(component)!;
}

/**
 * Updates circuit state in database for persistence across invocations
 */
async function persistCircuitState(
  supabase: ReturnType<typeof createClient>,
  component: string,
  state: CircuitBreakerState
): Promise<void> {
  await supabase
    .from('system_health')
    .update({
      circuit_state: state.state,
      circuit_opened_at: state.openedAt ? new Date(state.openedAt).toISOString() : null,
      circuit_failure_count: state.failures,
      consecutive_failures: state.failures,
      updated_at: new Date().toISOString()
    })
    .eq('component', component);
}

/**
 * Loads circuit state from database
 */
async function loadCircuitState(
  supabase: ReturnType<typeof createClient>,
  component: string
): Promise<CircuitBreakerState | null> {
  const { data } = await supabase
    .from('system_health')
    .select('circuit_state, circuit_opened_at, circuit_failure_count')
    .eq('component', component)
    .maybeSingle();

  if (!data) return null;

  return {
    state: (data.circuit_state as CircuitState) || 'closed',
    failures: data.circuit_failure_count || 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    openedAt: data.circuit_opened_at ? new Date(data.circuit_opened_at).getTime() : null,
    halfOpenAttempts: 0
  };
}

/**
 * Checks if the circuit should transition states
 */
function checkStateTransition(
  state: CircuitBreakerState,
  config: CircuitBreakerConfig
): CircuitState {
  const now = Date.now();

  switch (state.state) {
    case 'closed':
      // Check if we should open
      if (state.failures >= config.failureThreshold) {
        return 'open';
      }
      // Reset failures if outside monitor window
      if (state.lastFailure && now - state.lastFailure > config.monitorWindow) {
        state.failures = 0;
      }
      return 'closed';

    case 'open':
      // Check if timeout has passed to try half-open
      if (state.openedAt && now - state.openedAt >= config.timeout) {
        return 'half_open';
      }
      return 'open';

    case 'half_open':
      // Check if we should close or re-open
      if (state.successes >= config.successThreshold) {
        return 'closed';
      }
      if (state.halfOpenAttempts >= config.halfOpenRequests && state.failures > 0) {
        return 'open';
      }
      return 'half_open';

    default:
      return 'closed';
  }
}

/**
 * Records a successful operation
 */
function recordSuccess(state: CircuitBreakerState): void {
  state.successes++;
  state.lastSuccess = Date.now();
  
  if (state.state === 'half_open') {
    state.halfOpenAttempts++;
  }
  
  // In closed state, reset failure count on success
  if (state.state === 'closed') {
    state.failures = 0;
  }
}

/**
 * Records a failed operation
 */
function recordFailure(state: CircuitBreakerState): void {
  state.failures++;
  state.lastFailure = Date.now();
  state.successes = 0;
  
  if (state.state === 'half_open') {
    state.halfOpenAttempts++;
  }
}

/**
 * Circuit Breaker wrapper for async operations
 */
export async function withCircuitBreaker<T>(
  component: string,
  operation: () => Promise<T>,
  options: {
    config?: Partial<CircuitBreakerConfig>;
    fallback?: () => Promise<T> | T;
    supabase?: ReturnType<typeof createClient>;
  } = {}
): Promise<T> {
  const config = { ...DEFAULT_CONFIG, ...options.config };
  
  // Try to load persisted state
  let state = getCircuitState(component);
  if (options.supabase) {
    const persisted = await loadCircuitState(options.supabase, component);
    if (persisted) {
      state = { ...state, ...persisted };
      circuitStates.set(component, state);
    }
  }

  // Check for state transition
  const newState = checkStateTransition(state, config);
  if (newState !== state.state) {
    state.state = newState;
    if (newState === 'open') {
      state.openedAt = Date.now();
    } else if (newState === 'closed') {
      state.failures = 0;
      state.successes = 0;
      state.openedAt = null;
    } else if (newState === 'half_open') {
      state.halfOpenAttempts = 0;
      state.successes = 0;
    }
  }

  // If circuit is open, use fallback or throw
  if (state.state === 'open') {
    if (options.fallback) {
      return options.fallback();
    }
    throw new Error(`Circuit breaker OPEN for ${component}. Service unavailable.`);
  }

  try {
    const result = await operation();
    recordSuccess(state);
    
    // Check if we should close the circuit
    const updatedState = checkStateTransition(state, config);
    if (updatedState !== state.state) {
      state.state = updatedState;
      if (updatedState === 'closed') {
        state.failures = 0;
        state.openedAt = null;
      }
    }

    // Persist state
    if (options.supabase) {
      await persistCircuitState(options.supabase, component, state);
    }

    return result;
  } catch (error) {
    recordFailure(state);
    
    // Check if we should open the circuit
    const updatedState = checkStateTransition(state, config);
    if (updatedState !== state.state) {
      state.state = updatedState;
      if (updatedState === 'open') {
        state.openedAt = Date.now();
      }
    }

    // Persist state
    if (options.supabase) {
      await persistCircuitState(options.supabase, component, state);
    }

    // Use fallback if available
    if (options.fallback) {
      return options.fallback();
    }

    throw error;
  }
}

/**
 * Gets circuit breaker status for monitoring
 */
export function getCircuitStatus(component: string): {
  state: CircuitState;
  failures: number;
  isHealthy: boolean;
  canAttempt: boolean;
} {
  const state = getCircuitState(component);
  const now = Date.now();
  
  let canAttempt = true;
  if (state.state === 'open' && state.openedAt) {
    canAttempt = now - state.openedAt >= DEFAULT_CONFIG.timeout;
  }

  return {
    state: state.state,
    failures: state.failures,
    isHealthy: state.state === 'closed',
    canAttempt
  };
}

/**
 * Manually resets a circuit breaker
 */
export async function resetCircuit(
  component: string,
  supabase?: ReturnType<typeof createClient>
): Promise<void> {
  const state: CircuitBreakerState = {
    state: 'closed',
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    openedAt: null,
    halfOpenAttempts: 0
  };
  
  circuitStates.set(component, state);
  
  if (supabase) {
    await persistCircuitState(supabase, component, state);
  }
}

/**
 * Retry with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Dead Letter Queue handler
 */
export async function sendToDeadLetter(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  userId: string,
  jobSnapshot: Record<string, unknown>,
  failureReason: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('orchestrator_dead_letter')
    .insert({
      original_job_id: jobId,
      user_id: userId,
      job_snapshot: jobSnapshot,
      failure_reason: failureReason,
      first_failure_at: new Date().toISOString(),
      last_failure_at: new Date().toISOString(),
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to send to dead letter queue:', error);
    return null;
  }

  // Update original job status
  await supabase
    .from('orchestrator_jobs')
    .update({ status: 'dead_letter', updated_at: new Date().toISOString() })
    .eq('id', jobId);

  return data.id;
}
