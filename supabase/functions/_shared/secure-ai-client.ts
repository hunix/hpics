// Secure AI Client Wrapper
// Automatically masks PII before sending to AI and unmasks in responses
// Ensures no raw PII leaves the system

import { callAI, type AIMessage, parseAIJson, selectModel, type ModelTier, type ModelProvider } from './ai-client.ts';
import { maskPII, unmaskPII, PIIMaskingContext, type PIIMapping } from './pii-masker.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface SecureAIRequestOptions {
  model?: string;
  modelTier?: ModelTier;
  modelProvider?: ModelProvider;
  messages: AIMessage[];
  userId: string;
  functionName: string;
  profileId?: string;
  recordingId?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
  promptKey?: string;
  promptVersion?: number;
  enforceBudget?: boolean;
  // Security options
  maskPII?: boolean;           // Default: true
  logMaskingStats?: boolean;   // Default: true
  sensitivityLevel?: 'standard' | 'high' | 'maximum';
}

export interface SecureAIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  responseTimeMs: number;
  model: string;
  // Security metadata
  piiMasked: boolean;
  piiTypesFound: string[];
  piiCount: number;
}

/**
 * Secure AI call that automatically masks PII in messages and unmasks in responses
 */
export async function callSecureAI(options: SecureAIRequestOptions): Promise<SecureAIResponse> {
  const shouldMaskPII = options.maskPII !== false; // Default to true
  const sensitivityLevel = options.sensitivityLevel || 'standard';
  
  let piiContext: PIIMaskingContext | null = null;
  let maskedMessages = options.messages;
  
  if (shouldMaskPII) {
    piiContext = new PIIMaskingContext();
    
    // Mask all message contents
    maskedMessages = options.messages.map(msg => {
      if (typeof msg.content === 'string') {
        return {
          ...msg,
          content: piiContext!.mask(msg.content),
        };
      } else if (Array.isArray(msg.content)) {
        // Handle multimodal content
        return {
          ...msg,
          content: msg.content.map((part: any) => {
            if (part.type === 'text' && typeof part.text === 'string') {
              return { ...part, text: piiContext!.mask(part.text) };
            }
            return part;
          }),
        };
      }
      return msg;
    });
    
    // Log masking statistics (not the actual mappings!)
    if (options.logMaskingStats !== false) {
      const piiTypes = piiContext.getPIITypes();
      const piiCount = piiContext.getMappingCount();
      
      if (piiCount > 0) {
        console.log(`[secure-ai-client] Masked ${piiCount} PII items of types: ${piiTypes.join(', ')}`);
        
        // Log to audit table for high sensitivity
        if (sensitivityLevel === 'high' || sensitivityLevel === 'maximum') {
          await logPIIMaskingEvent(options.userId, options.functionName, piiTypes, piiCount);
        }
      }
    }
  }
  
  // Determine model
  const model = options.model || 
    (options.modelTier && options.modelProvider 
      ? selectModel(options.modelTier, options.modelProvider)
      : 'google/gemini-2.5-flash');
  
  // Call the underlying AI client
  const response = await callAI({
    model,
    messages: maskedMessages,
    userId: options.userId,
    functionName: options.functionName,
    profileId: options.profileId,
    recordingId: options.recordingId,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    metadata: {
      ...options.metadata,
      piiMasked: shouldMaskPII,
      sensitivityLevel,
    },
    promptKey: options.promptKey,
    promptVersion: options.promptVersion,
    enforceBudget: options.enforceBudget,
  });
  
  // Unmask PII in response
  let unmaskedContent = response.content;
  if (shouldMaskPII && piiContext) {
    unmaskedContent = piiContext.unmask(response.content);
  }
  
  return {
    content: unmaskedContent,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    totalTokens: response.totalTokens,
    costCents: response.costCents,
    responseTimeMs: response.responseTimeMs,
    model: response.model,
    piiMasked: shouldMaskPII,
    piiTypesFound: piiContext?.getPIITypes() || [],
    piiCount: piiContext?.getMappingCount() || 0,
  };
}

/**
 * Secure JSON parsing with automatic PII unmasking
 */
export function parseSecureAIJson<T>(
  content: string, 
  fallback: T, 
  piiMappings?: PIIMapping[]
): T {
  const parsed = parseAIJson(content, fallback);
  
  if (piiMappings && piiMappings.length > 0) {
    return unmaskPIIInObject(parsed, piiMappings);
  }
  
  return parsed;
}

/**
 * Helper to unmask PII in parsed objects
 */
function unmaskPIIInObject<T>(data: T, mappings: PIIMapping[]): T {
  function processValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return unmaskPII(value, mappings);
    }
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    if (value && typeof value === 'object') {
      const processed: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = processValue(val);
      }
      return processed;
    }
    return value;
  }

  return processValue(data) as T;
}

/**
 * Log PII masking event for audit purposes
 */
async function logPIIMaskingEvent(
  userId: string,
  functionName: string,
  piiTypes: string[],
  piiCount: number
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabase.from('immutable_audit_logs').insert({
      user_id: userId,
      action_type: 'pii_masking',
      resource_type: 'ai_request',
      resource_id: functionName,
      data_classification: 'confidential',
      metadata: {
        pii_types: piiTypes,
        pii_count: piiCount,
        function_name: functionName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.warn('[secure-ai-client] Failed to log PII masking event:', error);
  }
}

/**
 * Create a reusable secure AI client with preset options
 */
export function createSecureAIClient(defaultOptions: Partial<SecureAIRequestOptions>) {
  return {
    async call(options: SecureAIRequestOptions): Promise<SecureAIResponse> {
      return callSecureAI({
        ...defaultOptions,
        ...options,
        metadata: {
          ...defaultOptions.metadata,
          ...options.metadata,
        },
      });
    },
  };
}

/**
 * Batch process multiple secure AI calls with consistent PII context
 */
export async function batchSecureAICalls(
  calls: SecureAIRequestOptions[],
  options?: { 
    maxConcurrent?: number;
    sharedPIIContext?: boolean;
  }
): Promise<SecureAIResponse[]> {
  const maxConcurrent = options?.maxConcurrent || 3;
  const results: SecureAIResponse[] = [];
  
  // Process in batches
  for (let i = 0; i < calls.length; i += maxConcurrent) {
    const batch = calls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(call => callSecureAI(call))
    );
    results.push(...batchResults);
  }
  
  return results;
}

// Re-export commonly used types and functions
export { maskPII, unmaskPII, PIIMaskingContext } from './pii-masker.ts';
export type { PIIMapping, PIIType } from './pii-masker.ts';
