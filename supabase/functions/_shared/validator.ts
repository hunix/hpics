/**
 * Request Validation Utilities (v4.0.0)
 * 
 * Zod-based schema validation for edge function requests.
 * Provides type-safe validation with clear error messages.
 * 
 * @module _shared/validator
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Re-export Zod for convenience
export { z };

/**
 * Result type for validation.
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodIssue[] };

/**
 * Validate request data against a Zod schema.
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with typed data or error
 * 
 * @example
 * const result = validateRequest(ProfileAnalysisSchema, body);
 * if (!result.success) {
 *   return badRequestResponse(result.error);
 * }
 * const { profileId, userId } = result.data;
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    
    return {
      success: false,
      error: errorMessage,
      details: result.error.issues,
    };
  }
  
  return { success: true, data: result.data };
}

/**
 * Validate and throw if invalid.
 * Use when you want to handle errors at a higher level.
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws Error with validation message
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = validateRequest(schema, data);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID string validation.
 */
export const UUIDSchema = z.string().uuid();

/**
 * Optional UUID that accepts empty string as undefined.
 */
export const OptionalUUIDSchema = z
  .string()
  .optional()
  .transform(val => (val === '' ? undefined : val))
  .refine(val => val === undefined || z.string().uuid().safeParse(val).success, {
    message: 'Invalid UUID format',
  });

/**
 * Base schema for profile-related requests.
 * Accepts both camelCase and snake_case parameter names.
 */
export const ProfileAnalysisSchema = z.object({
  profileId: z.string().uuid().optional(),
  profile_id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  model: z.string().optional(),
  modelTier: z.enum(['fast', 'balanced', 'premium']).optional(),
  model_tier: z.enum(['fast', 'balanced', 'premium']).optional(),
}).refine(
  data => data.profileId || data.profile_id,
  { message: 'profileId is required', path: ['profileId'] }
);

/**
 * Schema for bulk profile operations.
 */
export const BulkProfileSchema = z.object({
  profileIds: z.array(z.string().uuid()).optional(),
  profile_ids: z.array(z.string().uuid()).optional(),
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
}).refine(
  data => (data.profileIds?.length || 0) > 0 || (data.profile_ids?.length || 0) > 0,
  { message: 'profileIds array is required and must not be empty' }
);

/**
 * Schema for AI analysis requests.
 */
export const AIAnalysisSchema = z.object({
  profileId: z.string().uuid().optional(),
  profile_id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  analysisType: z.string().optional(),
  analysis_type: z.string().optional(),
  model: z.string().optional(),
  modelTier: z.enum(['fast', 'balanced', 'premium']).optional(),
  maxTokens: z.number().int().min(100).max(32000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  includeHistory: z.boolean().optional(),
  context: z.record(z.unknown()).optional(),
});

/**
 * Schema for biometric extraction requests.
 */
export const BiometricExtractionSchema = z.object({
  profileId: z.string().uuid().optional(),
  profile_id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  audioUrls: z.array(z.string().url()).optional(),
  signatureUrls: z.array(z.string().url()).optional(),
  videoUrls: z.array(z.string().url()).optional(),
  extractionType: z.enum(['face', 'voice', 'gait', 'signature', 'body']).optional(),
}).refine(
  data => data.profileId || data.profile_id,
  { message: 'profileId is required' }
);

/**
 * Schema for network analysis requests.
 */
export const NetworkAnalysisSchema = z.object({
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  profileIds: z.array(z.string().uuid()).optional(),
  depth: z.number().int().min(1).max(5).optional().default(2),
  includeMetrics: z.boolean().optional().default(true),
  algorithm: z.enum(['pagerank', 'betweenness', 'closeness', 'eigenvector']).optional(),
});

/**
 * Schema for prediction requests.
 */
export const PredictionSchema = z.object({
  profileId: z.string().uuid().optional(),
  profile_id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  predictionType: z.string(),
  timeHorizonDays: z.number().int().min(1).max(365).optional().default(30),
  confidence_threshold: z.number().min(0).max(1).optional().default(0.7),
});

/**
 * Schema for warfare/influence operations.
 */
export const WarfareOperationSchema = z.object({
  profileId: z.string().uuid().optional(),
  profile_id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  operationType: z.string(),
  targetObjective: z.string().optional(),
  constraints: z.record(z.unknown()).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

/**
 * Schema for AGIS cascade requests.
 */
export const AGISCascadeSchema = z.object({
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  profileId: z.string().uuid().optional(),
  profile_id: z.string().uuid().optional(),
  sourcePhase: z.number().int().min(1).max(22),
  targetPhase: z.number().int().min(1).max(22).optional(),
  triggerType: z.string(),
  cascadeData: z.record(z.unknown()).optional(),
});

/**
 * Schema for hardware integration requests.
 */
export const HardwareRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  deviceType: z.enum(['raspberry_pi', 'flipper_zero', 'flir', 'dji_drone', 'gopro', 'sdr', 'lora']),
  deviceId: z.string().optional(),
  command: z.string(),
  parameters: z.record(z.unknown()).optional(),
});

/**
 * Schema for search/query requests.
 */
export const SearchQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  filters: z.record(z.unknown()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for pagination.
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

/**
 * Schema for date range filters.
 */
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
}).refine(
  data => {
    const start = data.startDate || data.start_date;
    const end = data.endDate || data.end_date;
    if (start && end) {
      return new Date(start) <= new Date(end);
    }
    return true;
  },
  { message: 'startDate must be before endDate' }
);

// ============================================================================
// Type Exports
// ============================================================================

export type ProfileAnalysisInput = z.infer<typeof ProfileAnalysisSchema>;
export type BulkProfileInput = z.infer<typeof BulkProfileSchema>;
export type AIAnalysisInput = z.infer<typeof AIAnalysisSchema>;
export type BiometricExtractionInput = z.infer<typeof BiometricExtractionSchema>;
export type NetworkAnalysisInput = z.infer<typeof NetworkAnalysisSchema>;
export type PredictionInput = z.infer<typeof PredictionSchema>;
export type WarfareOperationInput = z.infer<typeof WarfareOperationSchema>;
export type AGISCascadeInput = z.infer<typeof AGISCascadeSchema>;
export type HardwareRequestInput = z.infer<typeof HardwareRequestSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a custom schema with common fields included.
 * 
 * @param fields - Additional fields for the schema
 * @returns Combined schema with userId/profileId support
 */
export function createRequestSchema<T extends z.ZodRawShape>(fields: T) {
  return z.object({
    userId: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    profileId: z.string().uuid().optional(),
    profile_id: z.string().uuid().optional(),
    ...fields,
  });
}

/**
 * Validate an array of items against a schema.
 * Returns partial results with errors for invalid items.
 * 
 * @param schema - Schema for individual items
 * @param items - Array of items to validate
 * @returns Valid items and errors
 */
export function validateArray<T>(
  schema: z.ZodSchema<T>,
  items: unknown[]
): { valid: T[]; errors: Array<{ index: number; error: string }> } {
  const valid: T[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  items.forEach((item, index) => {
    const result = validateRequest(schema, item);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({ index, error: result.error });
    }
  });

  return { valid, errors };
}
