// Safe operation wrappers with comprehensive error handling
import { toast } from 'sonner';
import { handleAIError, isRateLimitError, isBudgetExceededError } from './aiErrorHandler';

// ==================== Result Types ====================

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// ==================== Safe Async Operations ====================

export interface SafeAsyncOptions {
  showErrorToast?: boolean;
  errorMessage?: string;
  onError?: (error: unknown) => void;
  timeout?: number;
  retries?: number;
}

/**
 * Wrap any async operation with comprehensive error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options: SafeAsyncOptions = {}
): Promise<Result<T, Error>> {
  const {
    showErrorToast = true,
    errorMessage = 'Operation failed',
    onError,
    timeout = 30000,
    retries = 0,
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout wrapper
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), timeout)
        ),
      ]);
      
      return ok(result);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check for AI-specific errors
      const aiErrorResult = handleAIError(error);
      if (aiErrorResult.handled) {
        return err(lastError);
      }
      
      // Don't retry rate limit errors
      if (isRateLimitError(error) || isBudgetExceededError(error)) {
        break;
      }
      
      // Wait before retrying
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  if (showErrorToast && lastError) {
    toast.error(errorMessage, {
      description: lastError.message,
    });
  }

  onError?.(lastError);
  return err(lastError!);
}

/**
 * Safe fetch wrapper with automatic retry and error handling
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit & { 
    parseJson?: boolean;
    validateResponse?: (data: unknown) => data is T;
  }
): Promise<Result<T, Error>> {
  return safeAsync(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Check for specific error codes
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please check your subscription.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Request failed (${response.status}): ${errorText}`);
    }
    
    if (options?.parseJson !== false) {
      const data = await response.json();
      
      if (options?.validateResponse && !options.validateResponse(data)) {
        throw new Error('Invalid response format');
      }
      
      return data as T;
    }
    
    return response as unknown as T;
  }, { showErrorToast: false });
}

// ==================== Safe Supabase Operations ====================

interface SupabaseResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Safe wrapper for Supabase operations with automatic error handling
 */
export async function safeSupabase<T>(
  operation: () => Promise<SupabaseResult<T>>,
  options: SafeAsyncOptions = {}
): Promise<Result<T, Error>> {
  const result = await safeAsync(async () => {
    const { data, error } = await operation();
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (data === null) {
      throw new Error('No data returned');
    }
    
    return data;
  }, options);
  
  return result;
}

/**
 * Safe wrapper for Supabase operations that may return null (single item queries)
 */
export async function safeSupabaseMaybe<T>(
  operation: () => Promise<SupabaseResult<T>>,
  options: SafeAsyncOptions = {}
): Promise<Result<T | null, Error>> {
  const result = await safeAsync(async () => {
    const { data, error } = await operation();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }, options);
  
  return result;
}

// ==================== Debounced Operations ====================

const debounceMap = new Map<string, NodeJS.Timeout>();

/**
 * Debounce an operation to prevent rapid repeated calls
 */
export function debounced<T extends (...args: unknown[]) => void>(
  key: string,
  fn: T,
  delayMs: number = 300
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    const existing = debounceMap.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    
    const timeout = setTimeout(() => {
      debounceMap.delete(key);
      fn(...args);
    }, delayMs);
    
    debounceMap.set(key, timeout);
  };
}

// ==================== Queued Operations ====================

interface QueuedOperation {
  id: string;
  operation: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;
  private concurrency: number;
  private activeCount = 0;

  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      this.queue.push({ id, operation, resolve: resolve as (v: unknown) => void, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;

    try {
      const result = await item.operation();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  get pending(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.activeCount;
  }
}

// Singleton queues for different operation types
export const aiOperationQueue = new OperationQueue(2);
export const dbOperationQueue = new OperationQueue(5);
export const embeddingQueue = new OperationQueue(3);

// ==================== Circuit Breaker ====================

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

export function withCircuitBreaker<T>(
  key: string,
  operation: () => Promise<T>,
  options: {
    failureThreshold?: number;
    resetTimeMs?: number;
  } = {}
): Promise<T> {
  const { failureThreshold = 5, resetTimeMs = 30000 } = options;
  
  let state = circuitBreakers.get(key);
  
  if (!state) {
    state = { failures: 0, lastFailure: 0, isOpen: false };
    circuitBreakers.set(key, state);
  }
  
  // Check if circuit should be reset
  if (state.isOpen && Date.now() - state.lastFailure > resetTimeMs) {
    state.isOpen = false;
    state.failures = 0;
  }
  
  if (state.isOpen) {
    return Promise.reject(new Error(`Circuit breaker open for ${key}. Try again later.`));
  }
  
  return operation().then(
    result => {
      // Success - reset failures
      state!.failures = 0;
      return result;
    },
    error => {
      // Failure - increment counter
      state!.failures++;
      state!.lastFailure = Date.now();
      
      if (state!.failures >= failureThreshold) {
        state!.isOpen = true;
      }
      
      throw error;
    }
  );
}

// ==================== Graceful Degradation ====================

export interface FallbackOptions<T> {
  fallbackValue?: T;
  fallbackOperation?: () => Promise<T>;
  shouldFallback?: (error: unknown) => boolean;
}

/**
 * Execute operation with graceful fallback on failure
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  options: FallbackOptions<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const shouldFallback = options.shouldFallback?.(error) ?? true;
    
    if (!shouldFallback) {
      throw error;
    }
    
    if (options.fallbackOperation) {
      return await options.fallbackOperation();
    }
    
    if (options.fallbackValue !== undefined) {
      return options.fallbackValue;
    }
    
    throw error;
  }
}

// ==================== Cleanup Helpers ====================

type CleanupFn = () => void | Promise<void>;

class CleanupManager {
  private cleanups: CleanupFn[] = [];

  add(cleanup: CleanupFn): void {
    this.cleanups.push(cleanup);
  }

  async runAll(): Promise<void> {
    const errors: Error[] = [];
    
    for (const cleanup of this.cleanups.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
    
    this.cleanups = [];
    
    if (errors.length > 0) {
      console.error('Cleanup errors:', errors);
    }
  }
}

export function createCleanupManager(): CleanupManager {
  return new CleanupManager();
}
