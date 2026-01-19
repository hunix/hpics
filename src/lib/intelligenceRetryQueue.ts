/**
 * Intelligence Retry Queue v1.0
 * Background queue for retrying failed intelligence tasks
 * Persists to localStorage for cross-session recovery
 */

import { edgeFunctionHealthMonitor } from './edgeFunctionHealthMonitor';

export interface QueuedTask {
  id: string;
  taskName: string;
  edgeFunction: string;
  profileId: string;
  userId: string;
  failureCount: number;
  maxRetries: number;
  lastError: string;
  queuedAt: number;
  nextRetryAt: number;
  priority: number;
}

interface QueueState {
  tasks: QueuedTask[];
  lastUpdated: number;
  version: string;
}

const STORAGE_KEY = 'intelligence_retry_queue';
const QUEUE_VERSION = '1.0';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 30000; // 30 seconds
const MAX_RETRY_DELAY_MS = 300000; // 5 minutes

class IntelligenceRetryQueue {
  private queue: QueuedTask[] = [];
  private isProcessing = false;
  private processingTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<(queue: QueuedTask[]) => void>();
  private invoker: ((edgeFunction: string, body: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>) | null = null;

  constructor() {
    this.loadFromStorage();
    this.startProcessing();
  }

  /**
   * Set the edge function invoker (dependency injection for supabase)
   */
  setInvoker(invoker: (edgeFunction: string, body: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>): void {
    this.invoker = invoker;
  }

  /**
   * Add a failed task to the retry queue
   */
  enqueue(task: Omit<QueuedTask, 'id' | 'queuedAt' | 'nextRetryAt' | 'failureCount' | 'maxRetries'>): void {
    // Check if already queued
    const existing = this.queue.find(
      t => t.edgeFunction === task.edgeFunction && t.profileId === task.profileId
    );

    if (existing) {
      // Update existing task
      existing.failureCount++;
      existing.lastError = task.lastError;
      existing.nextRetryAt = this.calculateNextRetry(existing.failureCount);
      this.saveToStorage();
      this.notifyListeners();
      return;
    }

    // Add new task
    const queuedTask: QueuedTask = {
      ...task,
      id: crypto.randomUUID(),
      failureCount: 1,
      maxRetries: MAX_RETRIES,
      queuedAt: Date.now(),
      nextRetryAt: this.calculateNextRetry(1),
    };

    this.queue.push(queuedTask);

    // Limit queue size
    if (this.queue.length > MAX_QUEUE_SIZE) {
      // Remove oldest, lowest priority tasks
      this.queue.sort((a, b) => b.priority - a.priority || a.queuedAt - b.queuedAt);
      this.queue = this.queue.slice(0, MAX_QUEUE_SIZE);
    }

    this.saveToStorage();
    this.notifyListeners();
    console.log(`[RetryQueue] Enqueued: ${task.taskName} for profile ${task.profileId}`);
  }

  /**
   * Remove a task from the queue (on success or max retries)
   */
  dequeue(taskId: string): void {
    this.queue = this.queue.filter(t => t.id !== taskId);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get tasks ready for retry
   */
  getReadyTasks(): QueuedTask[] {
    const now = Date.now();
    return this.queue
      .filter(t => t.nextRetryAt <= now && t.failureCount < t.maxRetries)
      .sort((a, b) => b.priority - a.priority || a.nextRetryAt - b.nextRetryAt);
  }

  /**
   * Get all queued tasks
   */
  getAll(): QueuedTask[] {
    return [...this.queue];
  }

  /**
   * Get queue statistics
   */
  getStats(): { total: number; ready: number; waiting: number; exhausted: number } {
    const now = Date.now();
    const ready = this.queue.filter(t => t.nextRetryAt <= now && t.failureCount < t.maxRetries).length;
    const exhausted = this.queue.filter(t => t.failureCount >= t.maxRetries).length;
    return {
      total: this.queue.length,
      ready,
      waiting: this.queue.length - ready - exhausted,
      exhausted,
    };
  }

  /**
   * Process retry queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.invoker) return;

    this.isProcessing = true;
    const readyTasks = this.getReadyTasks();

    for (const task of readyTasks.slice(0, 3)) { // Process up to 3 at a time
      // Check function health before retrying
      const health = edgeFunctionHealthMonitor.getStats(task.edgeFunction);
      if (!health.isHealthy) {
        const delay = edgeFunctionHealthMonitor.getRecommendedDelay(task.edgeFunction);
        task.nextRetryAt = Date.now() + delay;
        console.log(`[RetryQueue] Delaying ${task.taskName} by ${delay}ms due to unhealthy function`);
        continue;
      }

      const startTime = Date.now();
      try {
        console.log(`[RetryQueue] Retrying: ${task.taskName} (attempt ${task.failureCount + 1})`);
        
        const { error } = await this.invoker(task.edgeFunction, {
          profileId: task.profileId,
          userId: task.userId,
          analysisDepth: 'comprehensive',
        });

        const responseTime = Date.now() - startTime;

        if (error) {
          throw error;
        }

        // Success!
        edgeFunctionHealthMonitor.recordSuccess(task.edgeFunction, responseTime);
        this.dequeue(task.id);
        console.log(`[RetryQueue] Success: ${task.taskName}`);
      } catch (err) {
        const responseTime = Date.now() - startTime;
        const errorMsg = err instanceof Error ? err.message : String(err);
        
        edgeFunctionHealthMonitor.recordFailure(task.edgeFunction, responseTime, errorMsg);
        
        task.failureCount++;
        task.lastError = errorMsg;
        task.nextRetryAt = this.calculateNextRetry(task.failureCount);

        if (task.failureCount >= task.maxRetries) {
          console.log(`[RetryQueue] Exhausted retries: ${task.taskName}`);
        } else {
          console.log(`[RetryQueue] Failed: ${task.taskName}, next retry in ${(task.nextRetryAt - Date.now()) / 1000}s`);
        }
      }

      // Small delay between tasks
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.saveToStorage();
    this.notifyListeners();
    this.isProcessing = false;
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    if (this.processingTimer) return;

    const processLoop = async () => {
      await this.processQueue();
      this.processingTimer = setTimeout(processLoop, 10000); // Check every 10 seconds
    };

    // Start after a short delay
    this.processingTimer = setTimeout(processLoop, 5000);
  }

  /**
   * Stop background processing
   */
  stopProcessing(): void {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = null;
    }
  }

  /**
   * Subscribe to queue updates
   */
  subscribe(listener: (queue: QueuedTask[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAll()));
  }

  private calculateNextRetry(failureCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = BASE_RETRY_DELAY_MS * Math.pow(2, failureCount - 1);
    const jitter = Math.random() * 0.2 * baseDelay; // 20% jitter
    const delay = Math.min(baseDelay + jitter, MAX_RETRY_DELAY_MS);
    return Date.now() + delay;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const state: QueueState = JSON.parse(stored);
      if (state.version !== QUEUE_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Filter out expired tasks (older than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      this.queue = state.tasks.filter(t => Date.now() - t.queuedAt < maxAge);
    } catch (err) {
      console.warn('[RetryQueue] Failed to load from storage:', err);
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    try {
      const state: QueueState = {
        tasks: this.queue,
        lastUpdated: Date.now(),
        version: QUEUE_VERSION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[RetryQueue] Failed to save to storage:', err);
    }
  }

  /**
   * Clear all queued tasks
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Remove exhausted tasks
   */
  clearExhausted(): void {
    this.queue = this.queue.filter(t => t.failureCount < t.maxRetries);
    this.saveToStorage();
    this.notifyListeners();
  }
}

// Singleton instance
export const intelligenceRetryQueue = new IntelligenceRetryQueue();
