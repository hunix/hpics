/**
 * Cache Utilities (v4.0.0)
 * 
 * In-memory caching for edge function responses.
 * Reduces redundant computation and API calls.
 * 
 * @module _shared/cache
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
  hits: number;
}

/**
 * Simple in-memory cache with TTL support.
 * Note: Cache is per-function-instance, not shared across instances.
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 1000;

  /**
   * Get cached value or execute fetcher.
   * 
   * @param key - Cache key
   * @param ttlSeconds - Time-to-live in seconds
   * @param fetcher - Function to get fresh data
   * @returns Cached or fresh data
   */
  async getOrFetch<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (cached && cached.expires > Date.now()) {
      cached.hits++;
      return cached.data;
    }

    const data = await fetcher();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Set a cached value.
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict if at max size
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
      hits: 0,
    });
  }

  /**
   * Get a cached value without refreshing.
   */
  get<T>(key: string): T | undefined {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (cached && cached.expires > Date.now()) {
      cached.hits++;
      return cached.data;
    }

    // Expired, remove it
    if (cached) {
      this.cache.delete(key);
    }

    return undefined;
  }

  /**
   * Invalidate cache entry.
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching a pattern.
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  stats(): { size: number; totalHits: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    return { size: this.cache.size, totalHits };
  }

  private evictOldest(): void {
    // Simple LRU: remove entry with lowest hits
    let lowestKey: string | null = null;
    let lowestHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lowestHits) {
        lowestHits = entry.hits;
        lowestKey = key;
      }
    }

    if (lowestKey) {
      this.cache.delete(lowestKey);
    }
  }
}

// Singleton cache instance
const cache = new MemoryCache();

/**
 * Cache wrapper for async functions.
 * 
 * @param key - Cache key
 * @param ttlSeconds - Time-to-live in seconds
 * @param fetcher - Function to get fresh data
 * @returns Cached or fresh data
 * 
 * @example
 * const config = await withCache(
 *   `config:${userId}`,
 *   300, // 5 minutes
 *   () => fetchUserConfig(userId)
 * );
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  return cache.getOrFetch(key, ttlSeconds, fetcher);
}

/**
 * Generate cache key for profile analysis.
 * 
 * @param userId - User ID
 * @param profileId - Profile ID
 * @param analysisType - Type of analysis
 * @returns Cache key
 */
export function analysisKey(
  userId: string,
  profileId: string,
  analysisType: string
): string {
  return `analysis:${userId}:${profileId}:${analysisType}`;
}

/**
 * Generate cache key for config values.
 */
export function configKey(userId: string, configKey: string): string {
  return `config:${userId}:${configKey}`;
}

/**
 * Invalidate all cache entries for a profile.
 */
export function invalidateProfile(userId: string, profileId: string): number {
  return cache.invalidatePattern(`.*:${userId}:${profileId}:.*`);
}

/**
 * Invalidate all cache entries for a user.
 */
export function invalidateUser(userId: string): number {
  return cache.invalidatePattern(`.*:${userId}:.*`);
}

/**
 * Get cache statistics.
 */
export function getCacheStats() {
  return cache.stats();
}

/**
 * Clear entire cache.
 */
export function clearCache(): void {
  cache.clear();
}

// Export singleton for direct access if needed
export { cache };

// ============================================================================
// Response Caching Utilities
// ============================================================================

/**
 * Cache headers for HTTP responses.
 */
export function cacheHeaders(maxAgeSeconds: number): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${maxAgeSeconds}`,
    'CDN-Cache-Control': `public, max-age=${maxAgeSeconds}`,
  };
}

/**
 * No-cache headers for dynamic responses.
 */
export function noCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}
