// Unified AI Client for all edge functions
// Provides consistent logging, error handling, and cost tracking

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimitAsync, createRateLimitResponse, type RateLimitResult } from './rate-limiter.ts';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | any[]; // Allow multimodal content
}

interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface AIRequestOptions {
  model?: string;
  messages: AIMessage[];
  userId: string;
  functionName: string;
  profileId?: string;
  recordingId?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
  // Prompt tracking for A/B testing
  promptKey?: string;
  promptVersion?: number;
  // Budget enforcement
  enforceBudget?: boolean;
  // Tool calling support
  tools?: AITool[];
  toolChoice?: { type: 'function'; function: { name: string } } | 'auto' | 'none';
}

interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  responseTimeMs: number;
  model: string;
  toolCalls?: any[]; // Raw tool calls from response
}

interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

// Model pricing (in USD per 1M tokens) - Updated Jan 2026
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Gemini 2.5 family (legacy)
  'google/gemini-2.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30 },
  'google/gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10.00 },
  'google/gemini-2.5-flash-lite': { inputPer1M: 0.01875, outputPer1M: 0.075 },
  'google/gemini-2.5-flash-image': { inputPer1M: 0.10, outputPer1M: 0.40 },
  // Gemini 3 family (next-gen) - PRIMARY MODELS
  'google/gemini-3-pro-preview': { inputPer1M: 1.50, outputPer1M: 12.00 },
  'google/gemini-3-flash-preview': { inputPer1M: 0.10, outputPer1M: 0.40 },
  'google/gemini-3-pro-image-preview': { inputPer1M: 2.00, outputPer1M: 15.00 },
  // OpenAI GPT-5 family
  'openai/gpt-5': { inputPer1M: 5.00, outputPer1M: 15.00 },
  'openai/gpt-5-mini': { inputPer1M: 0.40, outputPer1M: 1.60 },
  'openai/gpt-5-nano': { inputPer1M: 0.10, outputPer1M: 0.40 },
};

function calculateCostCents(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['google/gemini-2.5-flash'];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  return Math.ceil((inputCost + outputCost) * 100);
}

function getProvider(model: string): string {
  if (model.startsWith('google/')) return 'google';
  if (model.startsWith('openai/')) return 'openai';
  return 'unknown';
}

// Custom error types for AI operations
export class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number = 60000) {
    super('Rate limit exceeded. Please try again later.');
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class CreditsExhaustedError extends Error {
  constructor() {
    super('AI credits exhausted. Please add credits to continue.');
    this.name = 'CreditsExhaustedError';
  }
}

export class BudgetExceededError extends Error {
  period: string;
  constructor(period: string) {
    super(`AI budget limit exceeded for ${period}. Please wait until the limit resets or increase your budget.`);
    this.name = 'BudgetExceededError';
    this.period = period;
  }
}

// Budget check helper
async function checkUserBudget(
  supabase: any,
  userId: string
): Promise<{ exceeded: boolean; period: string | null }> {
  try {
    // Get user preferences with budget settings
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('ai_budget_daily_limit_cents, ai_budget_weekly_limit_cents, ai_budget_monthly_limit_cents')
      .eq('user_id', userId)
      .maybeSingle();

    if (!prefs) return { exceeded: false, period: null };

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartISO = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get current spending
    const { data: usage } = await supabase
      .from('ai_usage_logs')
      .select('actual_cost_cents, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', monthStart);

    if (!usage) return { exceeded: false, period: null };

    const dailySpend = usage
      .filter((u: any) => u.created_at >= dayStart)
      .reduce((sum: number, u: any) => sum + (u.actual_cost_cents || 0), 0);

    const weeklySpend = usage
      .filter((u: any) => u.created_at >= weekStartISO)
      .reduce((sum: number, u: any) => sum + (u.actual_cost_cents || 0), 0);

    const monthlySpend = usage
      .reduce((sum: number, u: any) => sum + (u.actual_cost_cents || 0), 0);

    // Check limits
    if (prefs.ai_budget_daily_limit_cents && dailySpend >= prefs.ai_budget_daily_limit_cents) {
      return { exceeded: true, period: 'daily' };
    }
    if (prefs.ai_budget_weekly_limit_cents && weeklySpend >= prefs.ai_budget_weekly_limit_cents) {
      return { exceeded: true, period: 'weekly' };
    }
    if (prefs.ai_budget_monthly_limit_cents && monthlySpend >= prefs.ai_budget_monthly_limit_cents) {
      return { exceeded: true, period: 'monthly' };
    }

    return { exceeded: false, period: null };
  } catch (error) {
    console.warn('Budget check failed:', error);
    return { exceeded: false, period: null }; // Fail open
  }
}

export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  const startTime = Date.now();
  const model = options.model || 'google/gemini-2.5-flash';
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Server-side rate limiting check
  const rateLimitResult = await checkRateLimitAsync(options.userId, options.functionName);
  if (!rateLimitResult.allowed) {
    throw new RateLimitError((rateLimitResult.retryAfter || 60) * 1000);
  }

  // Budget enforcement check
  if (options.enforceBudget && options.userId) {
    const budgetCheck = await checkUserBudget(supabase, options.userId);
    if (budgetCheck.exceeded) {
      throw new BudgetExceededError(budgetCheck.period || 'unknown');
    }
  }

  let aiResponse: AIResponse;
  let errorMessage: string | null = null;

  try {
    // Build request body with optional tool calling
    const requestBody: Record<string, unknown> = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
    };

    if (options.maxTokens) {
      requestBody.max_completion_tokens = options.maxTokens;
    }

    // Add tool calling if specified
    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools;
      if (options.toolChoice) {
        requestBody.tool_choice = options.toolChoice;
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limit errors specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter ? parseInt(retryAfter) * 1000 : 60000);
      }
      
      // Handle credits exhausted
      if (response.status === 402) {
        throw new CreditsExhaustedError();
      }
      
      throw new Error(`AI Gateway error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const responseTimeMs = Date.now() - startTime;
    
    // Extract usage from response
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    
    // Calculate cost
    const costCents = calculateCostCents(model, inputTokens, outputTokens);
    
    // Extract content - handle both regular and tool call responses
    let content = '';
    let toolCalls: any[] | undefined;
    
    const choice = data.choices?.[0];
    if (choice?.message) {
      content = choice.message.content || '';
      
      // Extract tool calls if present
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        toolCalls = choice.message.tool_calls;
        // For tool calls, extract the structured data from the function arguments
        const firstToolCall = choice.message.tool_calls[0];
        if (firstToolCall?.function?.arguments) {
          content = firstToolCall.function.arguments;
        }
      }
    }
    
    aiResponse = {
      content,
      inputTokens,
      outputTokens,
      totalTokens,
      costCents,
      responseTimeMs,
      model,
      toolCalls,
    };

  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const responseTimeMs = Date.now() - startTime;
    
    // Log failure
    await supabase.from('ai_usage_logs').insert({
      user_id: options.userId,
      function_name: options.functionName,
      model_name: model,
      provider: getProvider(model),
      prompt_summary: (typeof options.messages[options.messages.length - 1]?.content === 'string' ? (options.messages[options.messages.length - 1].content as string).substring(0, 500) : 'multimodal'),
      prompt_key: options.promptKey || null,
      prompt_version: options.promptVersion || null,
      estimated_cost_cents: 0,
      actual_cost_cents: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      response_time_ms: responseTimeMs,
      profile_id: options.profileId || null,
      recording_id: options.recordingId || null,
      status: 'failed',
      error_message: errorMessage,
      request_metadata: options.metadata || {},
      outcome_success: false,
    });

    throw error;
  }

  // Log success
  await supabase.from('ai_usage_logs').insert({
    user_id: options.userId,
    function_name: options.functionName,
    model_name: model,
    provider: getProvider(model),
    prompt_summary: (typeof options.messages[options.messages.length - 1]?.content === 'string' ? (options.messages[options.messages.length - 1].content as string).substring(0, 500) : 'multimodal'),
    prompt_key: options.promptKey || null,
    prompt_version: options.promptVersion || null,
    estimated_cost_cents: aiResponse.costCents,
    actual_cost_cents: aiResponse.costCents,
    input_tokens: aiResponse.inputTokens,
    output_tokens: aiResponse.outputTokens,
    total_tokens: aiResponse.totalTokens,
    response_time_ms: aiResponse.responseTimeMs,
    profile_id: options.profileId || null,
    recording_id: options.recordingId || null,
    status: 'completed',
    request_metadata: options.metadata || {},
    response_metadata: {
      model: aiResponse.model,
      tokens: aiResponse.totalTokens,
    },
    outcome_success: null, // Will be updated later via recordPromptOutcome
  });

  return aiResponse;
}

// Helper to parse JSON from AI response with fallback
export function parseAIJson<T>(content: string, fallback: T): T {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
    return JSON.parse(jsonStr);
  } catch {
    console.warn('Failed to parse AI JSON response:', content.substring(0, 200));
    return fallback;
  }
}

// Model tier selector with provider options - GEMINI 3 OPTIMIZED
export type ModelTier = 'speed' | 'balanced' | 'quality' | 'nextgen';
export type ModelProvider = 'google' | 'openai';
export type TaskComplexityLevel = 'light' | 'standard' | 'complex' | 'extreme';

// Tier models now use Gemini 3 family as primary
const TIER_MODELS: Record<ModelTier, Record<ModelProvider, string>> = {
  speed: { google: 'google/gemini-3-flash-preview', openai: 'openai/gpt-5-nano' },
  balanced: { google: 'google/gemini-3-flash-preview', openai: 'openai/gpt-5-mini' },
  quality: { google: 'google/gemini-3-pro-preview', openai: 'openai/gpt-5' },
  nextgen: { google: 'google/gemini-3-pro-preview', openai: 'openai/gpt-5' },
};

export function selectModel(tier: ModelTier = 'balanced', provider: ModelProvider = 'google'): string {
  return TIER_MODELS[tier][provider];
}

// Image generation model selector
export function selectImageModel(quality: 'fast' | 'quality' = 'fast'): string {
  return quality === 'fast' 
    ? 'google/gemini-3-flash-preview'  // Gemini 3 Flash handles vision
    : 'google/gemini-3-pro-image-preview';
}

// Vision model selector for multimodal analysis
export function selectVisionModel(quality: 'fast' | 'quality' = 'fast'): string {
  return quality === 'fast' 
    ? 'google/gemini-3-flash-preview' 
    : 'google/gemini-3-pro-image-preview';
}

/**
 * INTELLIGENCE TASK CONFIGURATION
 * Maps analysis types to optimal Gemini 3 model configurations
 * 
 * TEMPERATURE GUIDELINES:
 * 0.3-0.4: Factual extraction, data parsing, structured output
 * 0.5-0.6: Analytical tasks requiring consistency
 * 0.65-0.75: Complex reasoning with creative elements
 * 0.75-0.85: Highly creative/speculative analysis
 * 
 * TOKEN GUIDELINES FOR GEMINI 3:
 * 3000-4000: Simple analysis, single-focus outputs
 * 5000-8000: Standard multi-section analysis
 * 10000-12000: Complex multi-dimensional analysis
 * 16000-20000: Fusion/synthesis across multiple data sources
 */
export interface IntelligenceTaskConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  complexity: TaskComplexityLevel;
}

export const INTELLIGENCE_TASK_CONFIGS: Record<string, IntelligenceTaskConfig> = {
  // ============ LIGHT COMPLEXITY - Gemini 3 Flash (temp 0.3-0.5, 3000-4000 tokens) ============
  'trauma_exploitation': { model: 'google/gemini-3-flash-preview', temperature: 0.45, maxTokens: 4000, complexity: 'light' },
  'phobia_exploitation': { model: 'google/gemini-3-flash-preview', temperature: 0.45, maxTokens: 4000, complexity: 'light' },
  'digital_footprint': { model: 'google/gemini-3-flash-preview', temperature: 0.35, maxTokens: 4000, complexity: 'light' },
  'opsec_assessment': { model: 'google/gemini-3-flash-preview', temperature: 0.4, maxTokens: 4000, complexity: 'light' },
  'behavioral_baseline': { model: 'google/gemini-3-flash-preview', temperature: 0.4, maxTokens: 4000, complexity: 'light' },
  'tscm_sweep': { model: 'google/gemini-3-flash-preview', temperature: 0.35, maxTokens: 3500, complexity: 'light' },
  'family_protection': { model: 'google/gemini-3-flash-preview', temperature: 0.4, maxTokens: 4000, complexity: 'light' },
  
  // ============ STANDARD COMPLEXITY - Gemini 3 Flash (temp 0.5-0.6, 5000-8000 tokens) ============
  'behavioral_dna': { model: 'google/gemini-3-flash-preview', temperature: 0.55, maxTokens: 8000, complexity: 'standard' },
  'attachment_vulnerability': { model: 'google/gemini-3-flash-preview', temperature: 0.55, maxTokens: 6000, complexity: 'standard' },
  'manipulation_susceptibility': { model: 'google/gemini-3-flash-preview', temperature: 0.5, maxTokens: 6000, complexity: 'standard' },
  'social_engineering': { model: 'google/gemini-3-flash-preview', temperature: 0.5, maxTokens: 5000, complexity: 'standard' },
  'coercion_resistance': { model: 'google/gemini-3-flash-preview', temperature: 0.5, maxTokens: 5000, complexity: 'standard' },
  'deception_detection': { model: 'google/gemini-3-flash-preview', temperature: 0.45, maxTokens: 5000, complexity: 'standard' },
  'influence_profile': { model: 'google/gemini-3-flash-preview', temperature: 0.55, maxTokens: 6000, complexity: 'standard' },
  'existential_leverage': { model: 'google/gemini-3-flash-preview', temperature: 0.55, maxTokens: 6000, complexity: 'standard' },
  'crisis_response': { model: 'google/gemini-3-flash-preview', temperature: 0.5, maxTokens: 5000, complexity: 'standard' },
  'lawfare_defense': { model: 'google/gemini-3-flash-preview', temperature: 0.5, maxTokens: 5000, complexity: 'standard' },
  'reputation_defense': { model: 'google/gemini-3-flash-preview', temperature: 0.5, maxTokens: 5000, complexity: 'standard' },
  'economic_warfare': { model: 'google/gemini-3-flash-preview', temperature: 0.5, maxTokens: 5000, complexity: 'standard' },
  
  // ============ COMPLEX REASONING - Gemini 3 Pro (temp 0.65-0.75, 10000-12000 tokens) ============
  'mice_assessment': { model: 'google/gemini-3-pro-preview', temperature: 0.65, maxTokens: 12000, complexity: 'complex' },
  'cognitive_warfare': { model: 'google/gemini-3-pro-preview', temperature: 0.7, maxTokens: 12000, complexity: 'complex' },
  'memetic_propagation': { model: 'google/gemini-3-pro-preview', temperature: 0.75, maxTokens: 10000, complexity: 'complex' },
  'reality_consensus': { model: 'google/gemini-3-pro-preview', temperature: 0.7, maxTokens: 10000, complexity: 'complex' },
  'quantum_cognition': { model: 'google/gemini-3-pro-preview', temperature: 0.75, maxTokens: 12000, complexity: 'complex' },
  'precognitive_pattern': { model: 'google/gemini-3-pro-preview', temperature: 0.7, maxTokens: 10000, complexity: 'complex' },
  'mass_formation': { model: 'google/gemini-3-pro-preview', temperature: 0.7, maxTokens: 10000, complexity: 'complex' },
  'narrative_control': { model: 'google/gemini-3-pro-preview', temperature: 0.7, maxTokens: 10000, complexity: 'complex' },
  'behavioral_prediction': { model: 'google/gemini-3-pro-preview', temperature: 0.65, maxTokens: 10000, complexity: 'complex' },
  'morphic_resonance': { model: 'google/gemini-3-pro-preview', temperature: 0.75, maxTokens: 10000, complexity: 'complex' },
  'omega_point': { model: 'google/gemini-3-pro-preview', temperature: 0.75, maxTokens: 10000, complexity: 'complex' },
  'temporal_fusion': { model: 'google/gemini-3-pro-preview', temperature: 0.7, maxTokens: 10000, complexity: 'complex' },
  
  // ============ EXTREME/FUSION - Gemini 3 Pro MAX (temp 0.6-0.7, 16000-20000 tokens) ============
  'omniscient_synthesis': { model: 'google/gemini-3-pro-preview', temperature: 0.65, maxTokens: 16000, complexity: 'extreme' },
  'unified_fusion': { model: 'google/gemini-3-pro-preview', temperature: 0.6, maxTokens: 16000, complexity: 'extreme' },
  'mosaic_intelligence': { model: 'google/gemini-3-pro-preview', temperature: 0.6, maxTokens: 16000, complexity: 'extreme' },
  'full_dossier': { model: 'google/gemini-3-pro-preview', temperature: 0.6, maxTokens: 20000, complexity: 'extreme' },
  'aggregate_intelligence': { model: 'google/gemini-3-pro-preview', temperature: 0.6, maxTokens: 16000, complexity: 'extreme' },
  'network_graph': { model: 'google/gemini-3-pro-preview', temperature: 0.55, maxTokens: 12000, complexity: 'extreme' },
  'power_network': { model: 'google/gemini-3-pro-preview', temperature: 0.6, maxTokens: 12000, complexity: 'extreme' },
  'relationship_trajectory': { model: 'google/gemini-3-pro-preview', temperature: 0.65, maxTokens: 10000, complexity: 'extreme' },
  'network_exploitation': { model: 'google/gemini-3-pro-preview', temperature: 0.6, maxTokens: 10000, complexity: 'extreme' },
  
  // ============ VISION TASKS - Gemini 3 Pro Image (temp 0.5, 8000 tokens) ============
  'facial_analysis': { model: 'google/gemini-3-pro-image-preview', temperature: 0.5, maxTokens: 8000, complexity: 'complex' },
  'body_language': { model: 'google/gemini-3-pro-image-preview', temperature: 0.5, maxTokens: 8000, complexity: 'complex' },
  'media_grid': { model: 'google/gemini-3-pro-image-preview', temperature: 0.5, maxTokens: 10000, complexity: 'complex' },
};

/**
 * Get task-specific AI configuration for intelligence analysis
 * Uses analysis type to determine optimal model, temperature, and token limits
 */
export function getTaskConfig(analysisType: string): IntelligenceTaskConfig {
  // Normalize analysis type (handle various naming conventions)
  const normalizedType = analysisType
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
    .replace('full_', '')
    .replace('_analysis', '')
    .replace('_assessment', '')
    .replace('_detection', '')
    .replace('_prediction', '')
    .replace('_mapping', '')
    .replace('_calculation', '')
    .replace('_sequence', '')
    .replace('comprehensive', 'attachment_vulnerability');
  
  return INTELLIGENCE_TASK_CONFIGS[normalizedType] || {
    model: 'google/gemini-3-flash-preview',
    temperature: 0.55,
    maxTokens: 6000,
    complexity: 'standard',
  };
}

// Get user's preferred model for a specific analysis type
export async function getUserPreferredModel(
  userId: string,
  analysisType: string,
  defaultModel: string
): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data } = await supabase
      .from('ai_model_preferences')
      .select('model_key')
      .eq('user_id', userId)
      .eq('analysis_type', analysisType)
      .maybeSingle();

    return data?.model_key || defaultModel;
  } catch (error) {
    console.warn('Failed to fetch user model preference:', error);
    return defaultModel;
  }
}

// Map function names to analysis types for model preferences
export const FUNCTION_TO_ANALYSIS_TYPE: Record<string, string> = {
  'analyze-profile': 'profile_analysis',
  'analyze-behavioral': 'behavioral_analysis',
  'analyze-conversation': 'conversation_analysis',
  'deep-psychological-analysis': 'psychological_analysis',
  'generate-briefing': 'briefing',
  'generate-dossier': 'dossier',
  'generate-playbook': 'playbook',
  'suggest-followups': 'followup_suggestions',
  'suggest-gifts': 'gift_suggestions',
  'suggest-introductions': 'introduction_suggestions',
  'predict-risks': 'risk_prediction',
  'extract-body-biometrics': 'biometric_analysis',
  'extract-handwriting-biometrics': 'biometric_analysis',
  'extract-facial-multiview': 'facial_analysis',
  'aggregate-bulk-results': 'bulk_analysis',
  'generate-weekly-summary': 'weekly_summary',
  'generate-media-metadata': 'media_analysis',
  'rag-query': 'rag_query',
  // Intelligence edge functions
  'mice-recruitment-analyzer': 'mice_assessment',
  'behavioral-dna-sequencer': 'behavioral_dna',
  'attachment-vulnerability-analyzer': 'attachment_vulnerability',
  'manipulation-vulnerability-assessment': 'manipulation_susceptibility',
  'phobia-exploitation-engine': 'phobia_exploitation',
  'cognitive-warfare-engine': 'cognitive_warfare',
  'trauma-exploitation-engine': 'trauma_exploitation',
  'enhanced-deception-detector': 'deception_detection',
  'analyze-influence-profile': 'influence_profile',
  'coercion-resistance-assessor': 'coercion_resistance',
  'existential-leverage-calculator': 'existential_leverage',
  'memetic-propagation-engine': 'memetic_propagation',
  'reality-consensus-engine': 'reality_consensus',
  'mass-formation-analyzer': 'mass_formation',
  'narrative-control-engine': 'narrative_control',
  'predict-behavioral-scenarios': 'behavioral_prediction',
  'precognitive-pattern-engine': 'precognitive_pattern',
  'analyze-network-graph': 'network_graph',
  'power-network-analyzer': 'power_network',
  'predict-relationship-trajectory': 'relationship_trajectory',
  'network-exploitation-mapper': 'network_exploitation',
  'temporal-fusion-transformer': 'temporal_fusion',
  'quantum-cognition-engine': 'quantum_cognition',
  'morphic-resonance-detector': 'morphic_resonance',
  'omega-point-tracker': 'omega_point',
  'mosaic-intelligence-fuser': 'mosaic_intelligence',
  'unified-data-fusion': 'unified_fusion',
  'omniscient-orchestrator': 'omniscient_synthesis',
  'generate-intelligence-dossier': 'full_dossier',
  'aggregate-media-intelligence': 'aggregate_intelligence',
  'opsec-vulnerability-analyzer': 'opsec_assessment',
  'social-engineering-detector': 'social_engineering',
  'crisis-response-orchestrator': 'crisis_response',
  'lawfare-defense-analyzer': 'lawfare_defense',
  'reputation-defense-engine': 'reputation_defense',
  'behavioral-baseline-monitor': 'behavioral_baseline',
  'family-protection-analyzer': 'family_protection',
  'economic-warfare-detector': 'economic_warfare',
  'tscm-sweep-analyzer': 'tscm_sweep',
  'digital-footprint-scanner': 'digital_footprint',
};
