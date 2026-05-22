/**
 * HTTP Response Helpers (v4.0.0)
 * 
 * Unified CORS headers and response utilities for all edge functions.
 * Eliminates 405+ duplicate corsHeaders definitions across the codebase.
 * 
 * @module _shared/http-helpers
 */

/**
 * Allowed CORS origin. Set CORS_ALLOWED_ORIGIN in the function environment
 * (e.g. https://hpics.example.com). Falls back to '*' only when unset, so
 * unconfigured deployments fail open with a logged warning rather than
 * silently locking out the frontend.
 */
const ALLOWED_ORIGIN = (() => {
  const v = Deno.env.get('CORS_ALLOWED_ORIGIN');
  if (!v || v.trim() === '') {
    console.warn('[http-helpers] CORS_ALLOWED_ORIGIN not set; defaulting to "*"');
    return '*';
  }
  return v.trim();
})();

/**
 * Standard CORS headers for all edge function responses.
 * Supports Supabase client headers and standard auth patterns.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Vary': 'Origin',
};

/**
 * Extended CORS headers for functions that need additional header support.
 */
export const extendedCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Create a JSON response with CORS headers.
 * 
 * @param data - Response payload (will be JSON serialized)
 * @param status - HTTP status code (default: 200)
 * @returns Response object with JSON content-type and CORS headers
 * 
 * @example
 * return jsonResponse({ success: true, data: result });
 * return jsonResponse({ items: [] }, 200);
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create a success response with standard structure.
 * 
 * @param data - Success payload
 * @param meta - Optional metadata (tokens, cost, timing)
 * @returns Response with { success: true, ...data, ...meta }
 * 
 * @example
 * return successResponse({ analysis: result }, { tokensUsed: 150 });
 */
export function successResponse(
  data: Record<string, unknown>,
  meta?: { tokensUsed?: number; costCents?: number; processingTimeMs?: number }
): Response {
  return jsonResponse({ success: true, ...data, ...meta });
}

/**
 * Create an error response with CORS headers.
 * 
 * @param message - Error message to return
 * @param status - HTTP status code (default: 500)
 * @param details - Optional additional error details
 * @returns Response with { error: message, details? }
 * 
 * @example
 * return errorResponse('Invalid profile ID', 400);
 * return errorResponse('Analysis failed', 500, { step: 'ai-call' });
 */
export function errorResponse(
  message: string,
  status = 500,
  details?: Record<string, unknown>
): Response {
  const body: Record<string, unknown> = { error: message };
  if (details) body.details = details;
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create a 401 Unauthorized response.
 * Always returns 401 explicitly to avoid platform converting to 500.
 * 
 * @param message - Optional custom message
 * @returns Response with 401 status
 */
export function unauthorizedResponse(message = 'Unauthorized'): Response {
  return errorResponse(message, 401);
}

/**
 * Create a 400 Bad Request response.
 * 
 * @param message - Validation error message
 * @param fields - Optional field-specific errors
 * @returns Response with 400 status
 */
export function badRequestResponse(
  message: string,
  fields?: Record<string, string>
): Response {
  return errorResponse(message, 400, fields ? { fields } : undefined);
}

/**
 * Create a 404 Not Found response.
 * 
 * @param resource - Name of the resource not found
 * @param id - Optional ID that was searched
 * @returns Response with 404 status
 */
export function notFoundResponse(resource: string, id?: string): Response {
  const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
  return errorResponse(message, 404);
}

/**
 * Create a standard health check response.
 * 
 * @param functionName - Name of the edge function
 * @param extras - Optional additional health info
 * @returns Response with health status
 * 
 * @example
 * if (url.searchParams.get('healthCheck') === '1') {
 *   return healthCheckResponse('analyze-profile');
 * }
 */
export function healthCheckResponse(
  functionName: string,
  extras?: Record<string, unknown>
): Response {
  return jsonResponse({
    ok: true,
    function: functionName,
    timestamp: Date.now(),
    ...extras,
  });
}

/**
 * Create a CORS preflight (OPTIONS) response.
 * 
 * @returns Response with only CORS headers, no body
 * 
 * @example
 * if (req.method === 'OPTIONS') {
 *   return optionsResponse();
 * }
 */
export function optionsResponse(): Response {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Standard request handler wrapper with CORS and health check support.
 * 
 * @param functionName - Name for health check response
 * @param handler - Async function to handle the request
 * @returns Wrapped handler with CORS/health check pre-handling
 * 
 * @example
 * serve(withStandardHandling('my-function', async (req) => {
 *   const body = await req.json();
 *   // ... process request
 *   return successResponse({ result });
 * }));
 */
export function withStandardHandling(
  functionName: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return optionsResponse();
    }

    // Handle health check (GET or POST)
    const url = new URL(req.url);
    if (url.searchParams.get('healthCheck') === '1') {
      return healthCheckResponse(functionName);
    }

    // Check for health check in body for POST requests
    if (req.method === 'POST') {
      const clonedReq = req.clone();
      try {
        const body = await clonedReq.json();
        if (body.healthCheck === true) {
          return healthCheckResponse(functionName);
        }
      } catch {
        // Not JSON or empty body, continue to handler
      }
    }

    // Execute main handler with error boundary
    try {
      return await handler(req);
    } catch (error) {
      console.error(`[${functionName}] Unhandled error:`, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return errorResponse(message, 500);
    }
  };
}

/**
 * Parse request body safely with error handling.
 * 
 * @param req - Request object
 * @returns Parsed body or null on error
 */
export async function safeParseBody<T = Record<string, unknown>>(
  req: Request
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const data = await req.json() as T;
    return { data, error: null };
  } catch {
    return { data: null, error: 'Invalid JSON body' };
  }
}

/**
 * Measure and log execution time for a function.
 * 
 * @param label - Label for the timing log
 * @param fn - Async function to time
 * @returns Result of the function with timing logged
 */
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round(performance.now() - start);
  console.log(`[Timing] ${label}: ${durationMs}ms`);
  return { result, durationMs };
}
