// Client-side Request Queue for AI Operations
// Prevents flooding the server with too many concurrent requests

import { handleAIError } from './aiErrorHandler';

interface QueuedRequest<T> {
  id: string;
  priority: number; // Higher = more urgent
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
}

interface QueueConfig {
  maxConcurrent: number;
  minDelayMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrent: 3,
  minDelayMs: 200,
  maxRetries: 3,
  retryDelayMs: 1000,
};

class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private activeRequests = 0;
  private config: QueueConfig;
  private lastRequestTime = 0;
  private isProcessing = false;
  private pendingRequests = new Map<string, QueuedRequest<unknown>>();

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a request to the queue
   */
  enqueue<T>(
    execute: () => Promise<T>,
    options: {
      priority?: number;
      maxRetries?: number;
      dedupeKey?: string;
    } = {}
  ): Promise<T> {
    const { priority = 5, maxRetries = this.config.maxRetries, dedupeKey } = options;

    // Deduplicate requests with the same key
    if (dedupeKey && this.pendingRequests.has(dedupeKey)) {
      const existing = this.pendingRequests.get(dedupeKey) as QueuedRequest<T>;
      return new Promise((resolve, reject) => {
        const originalResolve = existing.resolve;
        const originalReject = existing.reject;
        existing.resolve = (value) => {
          originalResolve(value);
          resolve(value as T);
        };
        existing.reject = (error) => {
          originalReject(error);
          reject(error);
        };
      });
    }

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: dedupeKey || crypto.randomUUID(),
        priority,
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
        retryCount: 0,
        maxRetries,
        createdAt: Date.now(),
      };

      if (dedupeKey) {
        this.pendingRequests.set(dedupeKey, request as QueuedRequest<unknown>);
      }

      // Insert sorted by priority (higher priority first)
      const insertIndex = this.queue.findIndex(r => r.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(request as QueuedRequest<unknown>);
      } else {
        this.queue.splice(insertIndex, 0, request as QueuedRequest<unknown>);
      }

      this.processQueue();
    });
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeRequests < this.config.maxConcurrent) {
      // Enforce minimum delay between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.config.minDelayMs) {
        await this.sleep(this.config.minDelayMs - timeSinceLastRequest);
      }

      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;
      this.lastRequestTime = Date.now();

      this.executeRequest(request).finally(() => {
        this.activeRequests--;
        this.pendingRequests.delete(request.id);
        // Continue processing after request completes
        if (this.queue.length > 0) {
          this.processQueue();
        }
      });
    }

    this.isProcessing = false;
  }

  /**
   * Execute a single request with retry logic
   */
  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      const errorResult = handleAIError(error);

      // Check if we should retry
      if (
        errorResult.shouldRetry &&
        request.retryCount < request.maxRetries
      ) {
        request.retryCount++;
        
        // Calculate delay with exponential backoff
        const delay = errorResult.retryAfterMs || 
          this.config.retryDelayMs * Math.pow(2, request.retryCount - 1);

        console.log(
          `Retrying request ${request.id} (attempt ${request.retryCount}/${request.maxRetries}) in ${delay}ms`
        );

        await this.sleep(delay);

        // Re-add to queue with boosted priority
        request.priority = Math.min(10, request.priority + 1);
        this.queue.unshift(request as QueuedRequest<unknown>);
        this.processQueue();
        return;
      }

      // If error was handled (toast shown), still reject for caller awareness
      request.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queued: number;
    active: number;
    pending: number;
  } {
    return {
      queued: this.queue.length,
      active: this.activeRequests,
      pending: this.pendingRequests.size,
    };
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    for (const request of this.queue) {
      request.reject(new Error('Queue cleared'));
    }
    this.queue = [];
    this.pendingRequests.clear();
  }
}

// Singleton instances for different request types
export const aiRequestQueue = new RequestQueue({
  maxConcurrent: 2,
  minDelayMs: 500,
  maxRetries: 3,
  retryDelayMs: 2000,
});

export const bulkRequestQueue = new RequestQueue({
  maxConcurrent: 1,
  minDelayMs: 1000,
  maxRetries: 2,
  retryDelayMs: 5000,
});

export const queryRequestQueue = new RequestQueue({
  maxConcurrent: 5,
  minDelayMs: 100,
  maxRetries: 2,
  retryDelayMs: 1000,
});

/**
 * Helper to queue an AI request with the default queue
 */
export function queueAIRequest<T>(
  execute: () => Promise<T>,
  options?: { priority?: number; dedupeKey?: string }
): Promise<T> {
  return aiRequestQueue.enqueue(execute, options);
}

/**
 * Helper to queue a bulk operation request
 */
export function queueBulkRequest<T>(
  execute: () => Promise<T>,
  options?: { priority?: number; dedupeKey?: string }
): Promise<T> {
  return bulkRequestQueue.enqueue(execute, {
    ...options,
    maxRetries: 1, // Bulk operations shouldn't auto-retry as much
  });
}
