/**
 * Hono Router Factory (v4.0.0)
 * 
 * Creates standardized Hono routers for domain-based edge function consolidation.
 * Reduces 407 individual functions to ~25 domain routers.
 * 
 * @module _shared/router
 */

import { Hono } from 'https://deno.land/x/hono@v3.12.0/mod.ts';
import { cors } from 'https://deno.land/x/hono@v3.12.0/middleware.ts';
import type { Context, Next } from 'https://deno.land/x/hono@v3.12.0/mod.ts';
import { corsHeaders, jsonResponse, healthCheckResponse, errorResponse } from './http-helpers.ts';
import { validateAuth, normalizeParams, type AuthResult } from './auth-handler.ts';
import { getServiceClient } from './auth-handler.ts';

// Re-export Hono types
export { Hono };
export type { Context, Next };

/**
 * Extended context with auth and normalized params.
 */
export interface RouterContext {
  userId: string;
  profileId: string;
  isServiceRole: boolean;
  supabase: ReturnType<typeof getServiceClient>;
  body: Record<string, unknown>;
  params: ReturnType<typeof normalizeParams>;
}

/**
 * Create a domain router with standard middleware.
 * 
 * @param routerName - Name of the router (for logging/health checks)
 * @param options - Router configuration options
 * @returns Configured Hono app
 * 
 * @example
 * const app = createRouter('analysis-router');
 * app.post('/mice', handleMICEAnalysis);
 * serve(app.fetch);
 */
export function createRouter(
  routerName: string,
  options: {
    requireAuth?: boolean;
    basePath?: string;
  } = {}
): Hono {
  const { requireAuth = true, basePath = '' } = options;
  const app = new Hono();

  // CORS middleware - handle preflight
  app.options('*', (c) => {
    return new Response(null, { headers: corsHeaders });
  });

  // Add CORS headers to all responses
  app.use('*', async (c, next) => {
    await next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      c.res.headers.set(key, value);
    });
  });

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({
      ok: true,
      router: routerName,
      timestamp: Date.now(),
      routes: app.routes.map(r => `${r.method} ${r.path}`),
    });
  });

  // Health check via query param (GET /?healthCheck=1)
  app.get('/', (c) => {
    if (c.req.query('healthCheck') === '1') {
      return c.json({ ok: true, router: routerName, timestamp: Date.now() });
    }
    return c.json({ router: routerName, status: 'ready' });
  });

  // Auth middleware for POST/PUT/DELETE
  if (requireAuth) {
    app.use('*', async (c, next) => {
      // Skip auth for GET requests and health checks
      if (c.req.method === 'GET' || c.req.method === 'OPTIONS') {
        return next();
      }

      try {
        const body = await c.req.json().catch(() => ({}));
        
        // Check for health check in body
        if (body.healthCheck === true) {
          return c.json({ ok: true, router: routerName, timestamp: Date.now() });
        }

        const auth = await validateAuth(c.req.raw, body);

        if (auth.error) {
          return c.json({ error: auth.error }, 401);
        }

        // Attach to context
        c.set('auth', auth);
        c.set('body', body);
        c.set('params', normalizeParams(body));

        return next();
      } catch (error) {
        console.error(`[${routerName}] Auth middleware error:`, error);
        return c.json({ error: 'Authentication failed' }, 401);
      }
    });
  }

  // Error boundary
  app.onError((err, c) => {
    console.error(`[${routerName}] Unhandled error:`, err);
    return c.json({ error: err.message || 'Internal server error' }, 500);
  });

  // 404 handler
  app.notFound((c) => {
    return c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404);
  });

  return app;
}

/**
 * Get auth context from Hono context.
 * Use in route handlers after auth middleware.
 * 
 * @param c - Hono context
 * @returns Router context with auth info
 */
export function getRouterContext(c: Context): RouterContext {
  const auth = c.get('auth') as AuthResult;
  const body = c.get('body') as Record<string, unknown>;
  const params = c.get('params') as ReturnType<typeof normalizeParams>;

  return {
    userId: auth?.userId || '',
    profileId: params?.profileId || '',
    isServiceRole: auth?.isServiceRole || false,
    supabase: auth?.supabase || getServiceClient(),
    body: body || {},
    params: params || normalizeParams({}),
  };
}

/**
 * Wrapper for route handlers with standard error handling.
 * 
 * @param handler - Async handler function
 * @returns Wrapped handler with error boundary
 * 
 * @example
 * app.post('/mice', withHandler(async (c) => {
 *   const { userId, profileId, supabase } = getRouterContext(c);
 *   // ... process request
 *   return c.json({ success: true, data });
 * }));
 */
export function withHandler(
  handler: (c: Context) => Promise<Response>
): (c: Context) => Promise<Response> {
  return async (c: Context) => {
    try {
      return await handler(c);
    } catch (error) {
      console.error('[Handler Error]:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: message }, 500);
    }
  };
}

/**
 * Create a route handler that validates request body.
 * 
 * @param schema - Zod schema for validation
 * @param handler - Handler that receives validated data
 * @returns Route handler
 */
export function withValidation<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ message: string; path: (string | number)[] }> } } },
  handler: (c: Context, data: T) => Promise<Response>
): (c: Context) => Promise<Response> {
  return async (c: Context) => {
    const body = c.get('body') as Record<string, unknown>;
    const result = schema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error?.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join('; ') || 'Validation failed';
      return c.json({ error: errorMessage }, 400);
    }

    return handler(c, result.data as T);
  };
}

/**
 * Middleware for rate limiting (simple in-memory implementation).
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(
  requestsPerMinute: number
): (c: Context, next: Next) => Promise<Response | void> {
  return async (c, next) => {
    const auth = c.get('auth') as AuthResult;
    const key = auth?.userId || c.req.header('x-forwarded-for') || 'anonymous';
    
    const now = Date.now();
    const limit = rateLimits.get(key);

    if (limit && limit.resetAt > now) {
      if (limit.count >= requestsPerMinute) {
        return c.json({ error: 'Rate limit exceeded' }, 429);
      }
      limit.count++;
    } else {
      rateLimits.set(key, { count: 1, resetAt: now + 60000 });
    }

    return next();
  };
}

/**
 * Middleware for request timing.
 */
export function timingMiddleware(): (c: Context, next: Next) => Promise<void> {
  return async (c, next) => {
    const start = performance.now();
    await next();
    const duration = Math.round(performance.now() - start);
    c.res.headers.set('X-Response-Time', `${duration}ms`);
  };
}
