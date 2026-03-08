/**
 * Supabase Functions Invoke Proxy (v1.0)
 * 
 * Intercepts all `supabase.functions.invoke()` calls and routes them through
 * the domain router adapter (ROUTE_MAP). This eliminates the need to modify 
 * 86+ hook files individually.
 * 
 * Import this module once in main.tsx (after supabase client init) to activate.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Reference to the original (unproxied) `supabase.functions.invoke`.
 * Exported so `invokeFn` in edgeFunctionRouter can bypass the proxy
 * for domain-router calls, avoiding a redundant async hop.
 */
export let originalInvoke: typeof supabase.functions.invoke | null = null;

/**
 * Install the invoke proxy. Call once at app startup.
 * 
 * After installation, all calls to `supabase.functions.invoke(name, { body })`
 * will automatically route through the domain routers when a mapping exists.
 */
export function installInvokeProxy() {
  const originalInvoke = supabase.functions.invoke.bind(supabase.functions);

  // We dynamically import the router to avoid circular deps
  let invokeFnRef: typeof import('@/lib/api/edgeFunctionRouter').invokeFn | null = null;
  let routeMapRef: Record<string, { router: string; path: string }> | null = null;

  const loadRouter = async () => {
    if (!invokeFnRef) {
      const mod = await import('@/lib/api/edgeFunctionRouter');
      invokeFnRef = mod.invokeFn;
    }
    return invokeFnRef;
  };

  // Check if function is in ROUTE_MAP synchronously after first load
  const loadRouteMap = async () => {
    if (!routeMapRef) {
      const mod = await import('@/lib/api/edgeFunctionRouter');
      // Build a quick lookup from isMigratedFunction
      const names = mod.getRouterNames();
      routeMapRef = {};
      for (const router of names) {
        for (const fn of mod.getFunctionsByRouter(router)) {
          routeMapRef[fn] = { router, path: '' }; // path not needed, invokeFn handles it
        }
      }
    }
    return routeMapRef;
  };

  // Eagerly load the router module
  loadRouter();
  loadRouteMap();

  supabase.functions.invoke = (async (
    functionName: string,
    options?: { body?: Record<string, unknown> | null; headers?: Record<string, string>; method?: string }
  ) => {
    // If custom headers are passed (e.g., Authorization overrides), use original invoke
    // to avoid breaking auth patterns
    if (options?.headers) {
      return originalInvoke(functionName, options as never);
    }

    const invokeFn = await loadRouter();
    const map = await loadRouteMap();
    
    // Only proxy if the function is in the ROUTE_MAP
    if (invokeFn && map && functionName in map) {
      return invokeFn(functionName, { body: options?.body ?? undefined });
    }

    // Fallback to original for unmapped functions
    return originalInvoke(functionName, options as never);
  }) as typeof supabase.functions.invoke;
}
