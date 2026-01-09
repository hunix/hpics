import { useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useQueryCache<T>() {
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());

  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      cache.current.delete(key);
      return null;
    }
    
    return entry.data;
  }, []);

  const set = useCallback((key: string, data: T, options?: CacheOptions) => {
    const ttl = options?.ttl ?? DEFAULT_TTL;
    const now = Date.now();
    
    cache.current.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }, []);

  const invalidate = useCallback((key: string) => {
    cache.current.delete(key);
  }, []);

  const invalidatePattern = useCallback((pattern: RegExp) => {
    const keys = Array.from(cache.current.keys());
    keys.forEach(key => {
      if (pattern.test(key)) {
        cache.current.delete(key);
      }
    });
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  const getOrFetch = useCallback(async <R extends T>(
    key: string,
    fetcher: () => Promise<R>,
    options?: CacheOptions
  ): Promise<R> => {
    const cached = get(key);
    if (cached !== null) {
      return cached as R;
    }
    
    const data = await fetcher();
    set(key, data, options);
    return data;
  }, [get, set]);

  return {
    get,
    set,
    invalidate,
    invalidatePattern,
    clear,
    getOrFetch,
  };
}

// Global cache instance for cross-component sharing
const globalCache = new Map<string, CacheEntry<unknown>>();

export function getGlobalCache<T>(key: string): T | null {
  const entry = globalCache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    globalCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

export function setGlobalCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  const now = Date.now();
  globalCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  });
}

export function clearGlobalCache(): void {
  globalCache.clear();
}
