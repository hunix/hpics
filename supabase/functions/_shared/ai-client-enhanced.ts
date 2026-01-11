// Enhanced Unified AI Client with batching, caching, and smart routing
// Extends ai-client.ts with advanced optimizations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel, type AIMessage, type ModelTier, type ModelProvider } from './ai-client.ts';

// ============================================
// SEMANTIC CACHING
// ============================================

interface CacheEntry {
  content: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
}

// In-memory cache for this edge function instance
const memoryCache = new Map<string, CacheEntry>();

// Generate cache key from prompt content
function generateCacheKey(
  messages: AIMessage[],
  model: string,
  temperature: number
): string {
  const promptContent = messages.map(m => 
    typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
  ).join('|||');
  
  // Simple hash function
  let hash = 0;
  const str = `${model}:${temperature}:${promptContent}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `cache_${Math.abs(hash).toString(36)}`;
}

// Check memory cache
function checkMemoryCache(cacheKey: string): CacheEntry | null {
  const entry = memoryCache.get(cacheKey);
  if (entry && entry.expiresAt > Date.now()) {
    return entry;
  }
  if (entry) {
    memoryCache.delete(cacheKey);
  }
  return null;
}

// Check database cache
async function checkDatabaseCache(
  supabase: any,
  userId: string,
  cacheKey: string
): Promise<{ content: string; metadata: any } | null> {
  try {
    const { data } = await supabase
      .from('ai_request_cache')
      .select('response_content, response_metadata')
      .eq('user_id', userId)
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (data) {
      // Update hit count
      await supabase
        .from('ai_request_cache')
        .update({ 
          hit_count: supabase.sql`hit_count + 1`,
          last_hit_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('cache_key', cacheKey);

      return {
        content: data.response_content,
        metadata: data.response_metadata,
      };
    }
    return null;
  } catch (error) {
    console.warn('Cache check failed:', error);
    return null;
  }
}

// Store in cache
async function storeInCache(
  supabase: any,
  userId: string,
  cacheKey: string,
  promptHash: string,
  model: string,
  content: string,
  metadata: Record<string, unknown>,
  tokensSaved: number,
  costSavedCents: number,
  ttlMinutes: number = 60
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    
    // Memory cache
    memoryCache.set(cacheKey, {
      content,
      metadata,
      createdAt: Date.now(),
      expiresAt: expiresAt.getTime(),
    });

    // Database cache
    await supabase
      .from('ai_request_cache')
      .upsert({
        user_id: userId,
        cache_key: cacheKey,
        prompt_hash: promptHash,
        model_name: model,
        response_content: content,
        response_metadata: metadata,
        tokens_saved: tokensSaved,
        cost_saved_cents: costSavedCents,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id,cache_key' });
  } catch (error) {
    console.warn('Failed to store in cache:', error);
  }
}

// ============================================
// REQUEST BATCHING
// ============================================

interface BatchedRequest {
  id: string;
  options: EnhancedAIRequestOptions;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const pendingBatches = new Map<string, BatchedRequest[]>();
const BATCH_DELAY_MS = 50;
const MAX_BATCH_SIZE = 5;

function getBatchKey(functionName: string, model: string): string {
  return `${functionName}:${model}`;
}

// ============================================
// SMART MODEL ROUTING
// ============================================

interface TaskComplexity {
  inputTokens: number;
  requiresReasoning: boolean;
  isMultimodal: boolean;
  hasStructuredOutput: boolean;
  contextWindowNeeded: number;
}

function analyzeTaskComplexity(messages: AIMessage[]): TaskComplexity {
  const inputContent = messages.map(m => 
    typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
  ).join(' ');
  
  const estimatedTokens = Math.ceil(inputContent.length / 4);
  const hasImages = messages.some(m => 
    Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
  );
  
  // Detect reasoning requirements
  const reasoningKeywords = ['analyze', 'compare', 'evaluate', 'synthesize', 'deduce', 'infer', 'complex'];
  const requiresReasoning = reasoningKeywords.some(kw => 
    inputContent.toLowerCase().includes(kw)
  );
  
  // Detect structured output requirements
  const hasStructuredOutput = inputContent.includes('JSON') || 
    inputContent.includes('structured') ||
    inputContent.includes('schema');

  return {
    inputTokens: estimatedTokens,
    requiresReasoning,
    isMultimodal: hasImages,
    hasStructuredOutput,
    contextWindowNeeded: estimatedTokens + 2000, // Buffer for response
  };
}

function selectOptimalModel(
  complexity: TaskComplexity,
  preferredTier?: ModelTier,
  preferredProvider?: ModelProvider
): string {
  const provider = preferredProvider || 'google';
  
  // If tier is specified, use it
  if (preferredTier) {
    return selectModel(preferredTier, provider);
  }
  
  // Auto-select based on complexity
  if (complexity.isMultimodal || complexity.contextWindowNeeded > 50000) {
    return selectModel('quality', provider);
  }
  
  if (complexity.requiresReasoning && complexity.hasStructuredOutput) {
    return selectModel('balanced', provider);
  }
  
  if (complexity.inputTokens < 1000 && !complexity.requiresReasoning) {
    return selectModel('speed', provider);
  }
  
  return selectModel('balanced', provider);
}

// ============================================
// COST PREDICTION
// ============================================

interface CostPrediction {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostCents: number;
  model: string;
  withinBudget: boolean;
}

function predictCost(
  messages: AIMessage[],
  model: string,
  expectedOutputLength: 'short' | 'medium' | 'long' = 'medium'
): CostPrediction {
  const inputContent = messages.map(m => 
    typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
  ).join(' ');
  
  const estimatedInputTokens = Math.ceil(inputContent.length / 4);
  
  const outputMultiplier = {
    short: 0.3,
    medium: 0.7,
    long: 1.5,
  };
  
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * outputMultiplier[expectedOutputLength]);
  
  // Model pricing (cents per 1M tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    'google/gemini-2.5-flash': { input: 7.5, output: 30 },
    'google/gemini-2.5-pro': { input: 125, output: 1000 },
    'google/gemini-2.5-flash-lite': { input: 1.875, output: 7.5 },
    'google/gemini-3-pro-preview': { input: 150, output: 1200 },
    'openai/gpt-5': { input: 500, output: 1500 },
    'openai/gpt-5-mini': { input: 40, output: 160 },
    'openai/gpt-5-nano': { input: 10, output: 40 },
  };
  
  const modelPricing = pricing[model] || pricing['google/gemini-2.5-flash'];
  
  const inputCostCents = (estimatedInputTokens / 1_000_000) * modelPricing.input;
  const outputCostCents = (estimatedOutputTokens / 1_000_000) * modelPricing.output;
  const estimatedCostCents = Math.ceil(inputCostCents + outputCostCents);
  
  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCostCents,
    model,
    withinBudget: true, // Will be checked against actual budget
  };
}

// ============================================
// ENHANCED AI REQUEST OPTIONS
// ============================================

export interface EnhancedAIRequestOptions {
  messages: AIMessage[];
  userId: string;
  functionName: string;
  // Model selection
  model?: string;
  tier?: ModelTier;
  provider?: ModelProvider;
  autoSelectModel?: boolean;
  // Profile/recording context
  profileId?: string;
  recordingId?: string;
  // Generation params
  temperature?: number;
  maxTokens?: number;
  // Caching
  enableCache?: boolean;
  cacheTTLMinutes?: number;
  // Batching
  enableBatching?: boolean;
  // Budget
  enforceBudget?: boolean;
  maxCostCents?: number;
  // Prompt tracking
  promptKey?: string;
  promptVersion?: number;
  // Tool calling
  tools?: any[];
  toolChoice?: any;
  // Metadata
  metadata?: Record<string, unknown>;
  // Expected output length for cost prediction
  expectedOutputLength?: 'short' | 'medium' | 'long';
}

export interface EnhancedAIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  responseTimeMs: number;
  model: string;
  fromCache: boolean;
  cacheKey?: string;
  toolCalls?: any[];
  costPrediction?: CostPrediction;
}

// ============================================
// MAIN ENHANCED CALL FUNCTION
// ============================================

export async function callAIEnhanced(options: EnhancedAIRequestOptions): Promise<EnhancedAIResponse> {
  const startTime = Date.now();
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Determine model
  let model = options.model;
  if (!model) {
    if (options.autoSelectModel) {
      const complexity = analyzeTaskComplexity(options.messages);
      model = selectOptimalModel(complexity, options.tier, options.provider);
    } else if (options.tier) {
      model = selectModel(options.tier, options.provider || 'google');
    } else {
      model = 'google/gemini-2.5-flash';
    }
  }
  
  // Cost prediction
  const costPrediction = predictCost(
    options.messages,
    model,
    options.expectedOutputLength || 'medium'
  );
  
  // Check max cost limit
  if (options.maxCostCents && costPrediction.estimatedCostCents > options.maxCostCents) {
    throw new Error(`Predicted cost ${costPrediction.estimatedCostCents}¢ exceeds limit ${options.maxCostCents}¢`);
  }
  
  // Check cache if enabled
  if (options.enableCache !== false) {
    const cacheKey = generateCacheKey(
      options.messages,
      model,
      options.temperature ?? 0.7
    );
    
    // Check memory cache first
    const memoryHit = checkMemoryCache(cacheKey);
    if (memoryHit) {
      return {
        content: memoryHit.content,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costCents: 0,
        responseTimeMs: Date.now() - startTime,
        model,
        fromCache: true,
        cacheKey,
        costPrediction,
      };
    }
    
    // Check database cache
    const dbHit = await checkDatabaseCache(supabase, options.userId, cacheKey);
    if (dbHit) {
      return {
        content: dbHit.content,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costCents: 0,
        responseTimeMs: Date.now() - startTime,
        model,
        fromCache: true,
        cacheKey,
        costPrediction,
      };
    }
  }
  
  // Call the base AI client
  const response = await callAI({
    model,
    messages: options.messages,
    userId: options.userId,
    functionName: options.functionName,
    profileId: options.profileId,
    recordingId: options.recordingId,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    enforceBudget: options.enforceBudget,
    promptKey: options.promptKey,
    promptVersion: options.promptVersion,
    tools: options.tools,
    toolChoice: options.toolChoice,
    metadata: options.metadata,
  });
  
  // Store in cache if enabled
  if (options.enableCache !== false && response.content) {
    const cacheKey = generateCacheKey(
      options.messages,
      model,
      options.temperature ?? 0.7
    );
    
    await storeInCache(
      supabase,
      options.userId,
      cacheKey,
      cacheKey, // Using same as prompt hash for simplicity
      model,
      response.content,
      { tokens: response.totalTokens },
      response.totalTokens,
      response.costCents,
      options.cacheTTLMinutes || 60
    );
  }
  
  return {
    ...response,
    fromCache: false,
    costPrediction,
  };
}

// ============================================
// BATCH PROCESSING HELPERS
// ============================================

export interface BatchItem<T> {
  id: string;
  data: T;
}

export interface BatchResult<T, R> {
  id: string;
  success: boolean;
  result?: R;
  error?: string;
}

export async function processBatch<T, R>(
  items: BatchItem<T>[],
  processor: (item: T) => Promise<R>,
  options: {
    maxConcurrent?: number;
    delayBetweenMs?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<BatchResult<T, R>[]> {
  const { maxConcurrent = 3, delayBetweenMs = 100, onProgress } = options;
  const results: BatchResult<T, R>[] = [];
  let completed = 0;
  
  // Process in chunks
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const chunk = items.slice(i, i + maxConcurrent);
    
    const chunkResults = await Promise.all(
      chunk.map(async (item) => {
        try {
          const result = await processor(item.data);
          return { id: item.id, success: true, result };
        } catch (error) {
          return { 
            id: item.id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );
    
    results.push(...chunkResults);
    completed += chunk.length;
    
    if (onProgress) {
      onProgress(completed, items.length);
    }
    
    // Delay between chunks
    if (i + maxConcurrent < items.length && delayBetweenMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenMs));
    }
  }
  
  return results;
}

// ============================================
// RAG CONTEXT INTEGRATION
// ============================================

export interface RAGContext {
  documents: Array<{
    content: string;
    source: string;
    relevance: number;
  }>;
  totalTokens: number;
}

export async function enrichWithRAGContext(
  supabase: any,
  userId: string,
  query: string,
  options: {
    profileId?: string;
    maxDocuments?: number;
    minRelevance?: number;
  } = {}
): Promise<RAGContext> {
  try {
    const { data } = await supabase.functions.invoke('rag-query-v3', {
      body: {
        query,
        profileId: options.profileId,
        maxResults: options.maxDocuments || 5,
        minSimilarity: options.minRelevance || 0.7,
        returnContext: true,
      },
    });
    
    if (data?.context) {
      return {
        documents: data.context.map((doc: any) => ({
          content: doc.content,
          source: doc.source || 'unknown',
          relevance: doc.similarity || 0.8,
        })),
        totalTokens: Math.ceil(
          data.context.reduce((sum: number, doc: any) => sum + doc.content.length, 0) / 4
        ),
      };
    }
  } catch (error) {
    console.warn('RAG context enrichment failed:', error);
  }
  
  return { documents: [], totalTokens: 0 };
}

// ============================================
// PROMPT OPTIMIZATION
// ============================================

export function optimizePrompt(prompt: string, maxTokens: number = 4000): string {
  // Estimate current tokens
  const currentTokens = Math.ceil(prompt.length / 4);
  
  if (currentTokens <= maxTokens) {
    return prompt;
  }
  
  // Apply compression strategies
  let optimized = prompt;
  
  // 1. Remove excessive whitespace
  optimized = optimized.replace(/\s+/g, ' ');
  
  // 2. Truncate if still too long
  const targetLength = maxTokens * 4;
  if (optimized.length > targetLength) {
    // Keep first 70% and last 20%, truncate middle
    const keepStart = Math.floor(targetLength * 0.7);
    const keepEnd = Math.floor(targetLength * 0.2);
    optimized = optimized.substring(0, keepStart) + 
      '\n\n[... content truncated for brevity ...]\n\n' +
      optimized.substring(optimized.length - keepEnd);
  }
  
  return optimized;
}

// Re-export from base client
export { parseAIJson, selectModel } from './ai-client.ts';
export type { AIMessage, ModelTier, ModelProvider } from './ai-client.ts';
