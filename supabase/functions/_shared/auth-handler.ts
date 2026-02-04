/**
 * Unified Auth Handler (v4.0.0)
 * 
 * Standardized authentication for all edge functions.
 * Supports dual-auth pattern: User JWT and Service Role Key.
 * 
 * @module _shared/auth-handler
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Result of authentication validation.
 */
export interface AuthResult {
  /** User ID from auth token or body */
  userId: string;
  /** Whether request is using service role key */
  isServiceRole: boolean;
  /** Error message if authentication failed */
  error?: string;
  /** The authenticated Supabase client */
  supabase: SupabaseClient;
}

/**
 * Options for auth validation.
 */
export interface AuthOptions {
  /** Whether to require authentication (default: true) */
  required?: boolean;
  /** Whether to allow service role authentication (default: true) */
  allowServiceRole?: boolean;
  /** Whether to trust userId from body for service role requests (default: true) */
  trustBodyUserId?: boolean;
}

/**
 * Create a Supabase client with service role key.
 * Use for operations that need elevated permissions.
 */
export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

/**
 * Create a Supabase client with the provided auth token.
 * Use for user-scoped operations.
 */
export function getAuthClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );
}

/**
 * Validate authentication from request.
 * Supports both user JWT tokens and service role key authentication.
 * 
 * @param req - The incoming request
 * @param body - Parsed request body (for userId fallback)
 * @param options - Auth validation options
 * @returns AuthResult with userId, isServiceRole flag, and supabase client
 * 
 * @example
 * const auth = await validateAuth(req, body);
 * if (auth.error) {
 *   return unauthorizedResponse(auth.error);
 * }
 * // Use auth.userId and auth.supabase
 */
export async function validateAuth(
  req: Request,
  body: Record<string, unknown> = {},
  options: AuthOptions = {}
): Promise<AuthResult> {
  const {
    required = true,
    allowServiceRole = true,
    trustBodyUserId = true,
  } = options;

  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = authHeader?.replace('Bearer ', '');

  // Create service client for validation
  const supabase = getServiceClient();

  // Check for service role authentication
  if (allowServiceRole && token === serviceRoleKey) {
    const userId = normalizeParam(body, 'userId', 'user_id') as string;
    
    if (!userId && required) {
      return {
        userId: '',
        isServiceRole: true,
        error: 'Service role request requires userId in body',
        supabase,
      };
    }

    return {
      userId: userId || '',
      isServiceRole: true,
      supabase,
    };
  }

  // Validate user JWT token
  if (authHeader && token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        return {
          userId: user.id,
          isServiceRole: false,
          supabase,
        };
      }

      // Token is invalid
      if (required) {
        return {
          userId: '',
          isServiceRole: false,
          error: error?.message || 'Invalid authentication token',
          supabase,
        };
      }
    } catch (err) {
      console.error('[auth-handler] Token validation error:', err);
      if (required) {
        return {
          userId: '',
          isServiceRole: false,
          error: 'Authentication validation failed',
          supabase,
        };
      }
    }
  }

  // Fallback to userId in body (for backward compatibility)
  if (trustBodyUserId) {
    const bodyUserId = normalizeParam(body, 'userId', 'user_id') as string;
    if (bodyUserId) {
      console.warn('[auth-handler] Using userId from body - consider migrating to proper auth');
      return {
        userId: bodyUserId,
        isServiceRole: false,
        supabase,
      };
    }
  }

  // No valid auth found
  if (required) {
    return {
      userId: '',
      isServiceRole: false,
      error: 'No authorization header provided',
      supabase,
    };
  }

  // Auth not required, return empty userId
  return {
    userId: '',
    isServiceRole: false,
    supabase,
  };
}

/**
 * Normalize parameter names between camelCase and snake_case.
 * 
 * @param body - Request body object
 * @param camelCase - camelCase parameter name
 * @param snakeCase - snake_case parameter name
 * @returns The parameter value (prefers camelCase if both exist)
 */
export function normalizeParam(
  body: Record<string, unknown>,
  camelCase: string,
  snakeCase: string
): unknown {
  return body[camelCase] ?? body[snakeCase];
}

/**
 * Extract and normalize common parameters from request body.
 * Handles both camelCase and snake_case variants.
 * 
 * @param body - Request body object
 * @returns Normalized parameters object
 * 
 * @example
 * const { userId, profileId, analysisType } = normalizeParams(body);
 */
export function normalizeParams(body: Record<string, unknown>): {
  userId: string;
  profileId: string;
  analysisType: string;
  model: string;
  modelTier: string;
} {
  return {
    userId: (normalizeParam(body, 'userId', 'user_id') || '') as string,
    profileId: (normalizeParam(body, 'profileId', 'profile_id') || '') as string,
    analysisType: (normalizeParam(body, 'analysisType', 'analysis_type') || '') as string,
    model: (normalizeParam(body, 'model', 'model') || '') as string,
    modelTier: (normalizeParam(body, 'modelTier', 'model_tier') || 'balanced') as string,
  };
}

/**
 * Validate that required parameters are present.
 * 
 * @param params - Object with parameter values
 * @param required - Array of required parameter names
 * @returns Error message if validation fails, null otherwise
 * 
 * @example
 * const error = validateRequiredParams({ profileId, userId }, ['profileId', 'userId']);
 * if (error) return badRequestResponse(error);
 */
export function validateRequiredParams(
  params: Record<string, unknown>,
  required: string[]
): string | null {
  const missing = required.filter(key => !params[key]);
  
  if (missing.length > 0) {
    return `Missing required parameters: ${missing.join(', ')}`;
  }
  
  return null;
}

/**
 * Quick auth check for functions that just need userId.
 * Combines validateAuth and error checking.
 * 
 * @param req - The incoming request
 * @param body - Parsed request body
 * @returns userId or throws with error message
 * 
 * @example
 * const userId = await requireAuth(req, body);
 * // If we get here, userId is valid
 */
export async function requireAuth(
  req: Request,
  body: Record<string, unknown> = {}
): Promise<{ userId: string; supabase: SupabaseClient }> {
  const auth = await validateAuth(req, body);
  
  if (auth.error) {
    throw new Error(auth.error);
  }
  
  if (!auth.userId) {
    throw new Error('User ID not found');
  }
  
  return { userId: auth.userId, supabase: auth.supabase };
}

/**
 * Extract user claims from JWT without full validation.
 * Useful for non-critical operations where speed matters.
 * 
 * @param authHeader - Authorization header value
 * @returns Decoded claims or null
 */
export function extractTokenClaims(authHeader: string | null): Record<string, unknown> | null {
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}
