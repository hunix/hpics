/**
 * Query Cleanup Hook
 * AGIS Phase 5 - Memory leak prevention and subscription management
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CleanupOptions {
  /** Query keys to cleanup on unmount */
  queryKeys?: string[][];
  /** Whether to cancel in-flight queries on unmount */
  cancelOnUnmount?: boolean;
  /** Debounce cleanup by this many ms */
  cleanupDelay?: number;
}

/**
 * Hook to manage React Query cleanup on component unmount
 * Prevents memory leaks from orphaned queries
 */
export function useQueryCleanup(options: CleanupOptions = {}) {
  const queryClient = useQueryClient();
  const { queryKeys = [], cancelOnUnmount = true, cleanupDelay = 0 } = options;

  // Stabilize queryKeys to prevent re-running effect on every render
  const serializedKeys = useMemo(() => JSON.stringify(queryKeys), [queryKeys]);

  useEffect(() => {
    return () => {
      const keys = JSON.parse(serializedKeys) as string[][];
      const cleanup = () => {
        if (cancelOnUnmount) {
          keys.forEach(queryKey => {
            queryClient.cancelQueries({ queryKey });
          });
        }
      };

      if (cleanupDelay > 0) {
        setTimeout(cleanup, cleanupDelay);
      } else {
        cleanup();
      }
    };
  }, [queryClient, serializedKeys, cancelOnUnmount, cleanupDelay]);
}

/**
 * Hook to manage Supabase Realtime subscriptions with automatic cleanup
 */
export function useRealtimeSubscription() {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const reconnectTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const subscribe = useCallback((
    channelName: string,
    table: string,
    filter: string | undefined,
    callback: (payload: unknown) => void,
    options: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema?: string;
      retryOnError?: boolean;
      maxRetries?: number;
    } = {}
  ) => {
    const { event = '*', schema = 'public', retryOnError = true, maxRetries = 3 } = options;
    let retryCount = 0;

    // Cleanup existing channel with same name
    if (channelsRef.current.has(channelName)) {
      const existingChannel = channelsRef.current.get(channelName);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }
      channelsRef.current.delete(channelName);
    }

    const createChannel = () => {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event,
            schema,
            table,
            filter,
          } as any,
          (payload: unknown) => {
            try {
              callback(payload);
            } catch (error) {
              console.error(`Realtime callback error for ${channelName}:`, error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            retryCount = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (retryOnError && retryCount < maxRetries) {
              retryCount++;
              const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
              
              const timeout = setTimeout(() => {
                createChannel();
              }, delay);
              
              reconnectTimeoutsRef.current.set(channelName, timeout);
            }
          }
        });

      channelsRef.current.set(channelName, channel);
      return channel;
    };

    return createChannel();
  }, []);

  const unsubscribe = useCallback((channelName: string) => {
    const channel = channelsRef.current.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      channelsRef.current.delete(channelName);
    }

    const timeout = reconnectTimeoutsRef.current.get(channelName);
    if (timeout) {
      clearTimeout(timeout);
      reconnectTimeoutsRef.current.delete(channelName);
    }
  }, []);

  const unsubscribeAll = useCallback(() => {
    channelsRef.current.forEach((channel, name) => {
      supabase.removeChannel(channel);
      channelsRef.current.delete(name);
    });

    reconnectTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    reconnectTimeoutsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
    activeChannels: () => Array.from(channelsRef.current.keys()),
  };
}

/**
 * Hook to create AbortController for fetch operations with automatic cleanup
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  const getController = useCallback(() => {
    // Abort previous controller if exists
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    
    controllerRef.current = new AbortController();
    return controllerRef.current;
  }, []);

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  return {
    getController,
    abort,
    signal: () => controllerRef.current?.signal,
  };
}

/**
 * Hook to manage D3 visualization cleanup
 */
export function useD3Cleanup() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cleanupFnsRef = useRef<Array<() => void>>([]);

  const registerCleanup = useCallback((fn: () => void) => {
    cleanupFnsRef.current.push(fn);
  }, []);

  const cleanup = useCallback(() => {
    // Run registered cleanup functions
    cleanupFnsRef.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('D3 cleanup error:', error);
      }
    });
    cleanupFnsRef.current = [];

    // Clear SVG content
    if (svgRef.current) {
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    svgRef,
    registerCleanup,
    cleanup,
  };
}
