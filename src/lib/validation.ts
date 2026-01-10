// Comprehensive validation utilities for error-free operations
import { z } from 'zod';

// ==================== Base Schemas ====================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string()
  .trim()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

export const phoneSchema = z.string()
  .trim()
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format')
  .min(7, 'Phone number too short')
  .max(20, 'Phone number too long')
  .optional()
  .or(z.literal(''));

export const urlSchema = z.string()
  .trim()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .optional()
  .or(z.literal(''));

export const dateSchema = z.string()
  .datetime({ offset: true })
  .or(z.date())
  .optional();

// ==================== Contact Schemas ====================

export const contactNameSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100, 'First name too long'),
  last_name: z.string().trim().max(100, 'Last name too long').optional().or(z.literal('')),
  nickname: z.string().trim().max(50, 'Nickname too long').optional().or(z.literal('')),
});

export const contactCreateSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().max(100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  company: z.string().trim().max(200).optional(),
  title: z.string().trim().max(200).optional(),
  notes: z.string().max(10000).optional(),
});

export const contactUpdateSchema = contactCreateSchema.partial();

// ==================== Message Schemas ====================

export const messageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(50000, 'Message too long'),
  channel: z.enum(['email', 'sms', 'call', 'meeting', 'social', 'other']).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  profile_id: uuidSchema,
});

// ==================== AI/Intelligence Schemas ====================

export const aiQuerySchema = z.object({
  query: z.string().trim().min(1, 'Query cannot be empty').max(10000, 'Query too long'),
  profileId: uuidSchema.optional(),
  includeContext: z.boolean().optional(),
  maxTokens: z.number().min(100).max(8000).optional(),
});

export const embeddingRequestSchema = z.object({
  content: z.string().trim().min(1, 'Content required').max(100000, 'Content too long'),
  contentType: z.enum(['message', 'observation', 'analysis', 'document', 'voice']),
  sourceId: uuidSchema,
  profileId: uuidSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const insightSchema = z.object({
  insight_type: z.string().min(1).max(50),
  title: z.string().trim().min(1, 'Title required').max(200, 'Title too long'),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.string().max(50).optional(),
  profile_id: uuidSchema.optional(),
  action_type: z.string().max(50).optional(),
  action_data: z.record(z.unknown()).optional(),
});

export const patternSchema = z.object({
  pattern_type: z.string().min(1).max(50),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  confidence_score: z.number().min(0).max(1).default(0.5),
  profiles_involved: z.array(uuidSchema).optional(),
  evidence: z.record(z.unknown()).optional(),
});

// ==================== Queue/Job Schemas ====================

export const queueJobSchema = z.object({
  job_type: z.enum([
    'embed_content',
    'extract_entities',
    'detect_patterns',
    'generate_insights',
    'process_voice',
    'sync_device',
    'refresh_embeddings',
  ]),
  payload: z.record(z.unknown()),
  priority: z.number().min(1).max(10).default(5),
  scheduled_for: dateSchema,
});

// ==================== Device/Capture Schemas ====================

export const deviceCaptureSchema = z.object({
  device_type: z.enum(['chrome_extension', 'mobile_app', 'wearable', 'voice_recorder', 'other']),
  capture_type: z.enum(['social_profile', 'health_data', 'voice_sample', 'photo', 'document', 'other']),
  source_url: urlSchema,
  raw_data: z.record(z.unknown()),
  profile_id: uuidSchema.optional(),
});

// ==================== Validation Helpers ====================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Validate data against a schema with detailed error reporting
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.') || 'root',
      message: err.message,
    }));
    
    return { success: false, errors };
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed unexpectedly' }],
    };
  }
}

/**
 * Validate and throw on failure
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = validate(schema, data);
  
  if (!result.success) {
    const errorMessages = result.errors?.map(e => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Validation failed${context ? ` for ${context}` : ''}: ${errorMessages}`);
  }
  
  return result.data!;
}

/**
 * Safely parse JSON with validation
 */
export function safeJsonParse<T>(
  json: string,
  schema?: z.ZodSchema<T>
): { success: boolean; data?: T; error?: string } {
  try {
    const parsed = JSON.parse(json);
    
    if (schema) {
      const result = schema.safeParse(parsed);
      if (!result.success) {
        return { success: false, error: result.error.message };
      }
      return { success: true, data: result.data };
    }
    
    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: 'Invalid JSON' };
  }
}

/**
 * Sanitize string input for safe display
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, char => ({
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
      '&': '&amp;',
    }[char] || char));
}

/**
 * Validate array of items with individual error tracking
 */
export function validateArray<T>(
  schema: z.ZodSchema<T>,
  items: unknown[]
): { valid: T[]; invalid: Array<{ index: number; errors: Array<{ field: string; message: string }> }> } {
  const valid: T[] = [];
  const invalid: Array<{ index: number; errors: Array<{ field: string; message: string }> }> = [];
  
  items.forEach((item, index) => {
    const result = validate(schema, item);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ index, errors: result.errors || [] });
    }
  });
  
  return { valid, invalid };
}

// ==================== Rate Limiting ====================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
  
  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: existing.resetAt - now };
  }
  
  existing.count++;
  return { allowed: true, remaining: maxRequests - existing.count, resetIn: existing.resetAt - now };
}

// ==================== Retry Logic ====================

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    retryableErrors = () => true,
  } = options;
  
  let lastError: unknown;
  let delay = initialDelayMs;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !retryableErrors(error)) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }
  
  throw lastError;
}

// ==================== Type Guards ====================

export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}
