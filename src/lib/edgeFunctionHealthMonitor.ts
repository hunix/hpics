/**
 * Edge Function Health Monitor v1.0
 * Tracks success/failure rates per edge function
 * Provides real-time health statistics for intelligent retry decisions
 */

export interface FunctionHealthStats {
  functionName: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgResponseTimeMs: number;
  lastCallAt: Date | null;
  lastError: string | null;
  lastErrorAt: Date | null;
  consecutiveFailures: number;
  isHealthy: boolean;
}

interface CallRecord {
  timestamp: number;
  success: boolean;
  responseTimeMs: number;
  error?: string;
}

const HEALTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const UNHEALTHY_THRESHOLD = 0.5; // 50% failure rate = unhealthy
const MAX_RECORDS_PER_FUNCTION = 50;

class EdgeFunctionHealthMonitor {
  private callRecords = new Map<string, CallRecord[]>();
  private consecutiveFailures = new Map<string, number>();
  private lastErrors = new Map<string, { error: string; at: Date }>();
  private listeners = new Set<(stats: Map<string, FunctionHealthStats>) => void>();

  /**
   * Record a successful call
   */
  recordSuccess(functionName: string, responseTimeMs: number): void {
    this.addRecord(functionName, { 
      timestamp: Date.now(), 
      success: true, 
      responseTimeMs 
    });
    this.consecutiveFailures.set(functionName, 0);
    this.notifyListeners();
  }

  /**
   * Record a failed call
   */
  recordFailure(functionName: string, responseTimeMs: number, error: string): void {
    this.addRecord(functionName, { 
      timestamp: Date.now(), 
      success: false, 
      responseTimeMs,
      error 
    });
    const current = this.consecutiveFailures.get(functionName) || 0;
    this.consecutiveFailures.set(functionName, current + 1);
    this.lastErrors.set(functionName, { error, at: new Date() });
    this.notifyListeners();
  }

  private addRecord(functionName: string, record: CallRecord): void {
    if (!this.callRecords.has(functionName)) {
      this.callRecords.set(functionName, []);
    }
    const records = this.callRecords.get(functionName)!;
    records.push(record);
    
    // Keep only recent records within window
    const cutoff = Date.now() - HEALTH_WINDOW_MS;
    const filtered = records.filter(r => r.timestamp > cutoff);
    
    // Also limit total records
    if (filtered.length > MAX_RECORDS_PER_FUNCTION) {
      filtered.splice(0, filtered.length - MAX_RECORDS_PER_FUNCTION);
    }
    
    this.callRecords.set(functionName, filtered);
  }

  /**
   * Get health stats for a specific function
   */
  getStats(functionName: string): FunctionHealthStats {
    const records = this.callRecords.get(functionName) || [];
    const cutoff = Date.now() - HEALTH_WINDOW_MS;
    const recentRecords = records.filter(r => r.timestamp > cutoff);
    
    const totalCalls = recentRecords.length;
    const successCount = recentRecords.filter(r => r.success).length;
    const failureCount = totalCalls - successCount;
    const successRate = totalCalls > 0 ? successCount / totalCalls : 1;
    
    const responseTimes = recentRecords.map(r => r.responseTimeMs);
    const avgResponseTimeMs = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const lastRecord = recentRecords[recentRecords.length - 1];
    const lastCallAt = lastRecord ? new Date(lastRecord.timestamp) : null;
    
    const lastErrorInfo = this.lastErrors.get(functionName);
    const consecutiveFailures = this.consecutiveFailures.get(functionName) || 0;
    
    return {
      functionName,
      totalCalls,
      successCount,
      failureCount,
      successRate,
      avgResponseTimeMs: Math.round(avgResponseTimeMs),
      lastCallAt,
      lastError: lastErrorInfo?.error || null,
      lastErrorAt: lastErrorInfo?.at || null,
      consecutiveFailures,
      isHealthy: successRate >= UNHEALTHY_THRESHOLD && consecutiveFailures < 3,
    };
  }

  /**
   * Get all function stats
   */
  getAllStats(): Map<string, FunctionHealthStats> {
    const stats = new Map<string, FunctionHealthStats>();
    for (const functionName of this.callRecords.keys()) {
      stats.set(functionName, this.getStats(functionName));
    }
    return stats;
  }

  /**
   * Check if a function is healthy enough to call
   */
  isHealthy(functionName: string): boolean {
    return this.getStats(functionName).isHealthy;
  }

  /**
   * Get recommended delay before calling an unhealthy function
   */
  getRecommendedDelay(functionName: string): number {
    const stats = this.getStats(functionName);
    if (stats.isHealthy) return 0;
    
    // Exponential backoff based on consecutive failures
    const baseDelay = 2000; // 2 seconds
    const maxDelay = 60000; // 1 minute
    const delay = Math.min(
      baseDelay * Math.pow(2, stats.consecutiveFailures - 1),
      maxDelay
    );
    return delay;
  }

  /**
   * Subscribe to health updates
   */
  subscribe(listener: (stats: Map<string, FunctionHealthStats>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const stats = this.getAllStats();
    this.listeners.forEach(listener => listener(stats));
  }

  /**
   * Reset all stats (for testing or fresh start)
   */
  reset(): void {
    this.callRecords.clear();
    this.consecutiveFailures.clear();
    this.lastErrors.clear();
    this.notifyListeners();
  }

  /**
   * Get summary for logging/debugging
   */
  getSummary(): { healthy: number; unhealthy: number; total: number; functions: string[] } {
    const stats = this.getAllStats();
    const healthyCount = Array.from(stats.values()).filter(s => s.isHealthy).length;
    return {
      healthy: healthyCount,
      unhealthy: stats.size - healthyCount,
      total: stats.size,
      functions: Array.from(stats.keys()),
    };
  }
}

// Singleton instance
export const edgeFunctionHealthMonitor = new EdgeFunctionHealthMonitor();
