// Unified AI Client for all edge functions
// Provides consistent logging, error handling, and cost tracking

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, createRateLimitResponse, type RateLimitResult } from './rate-limiter.ts';

interface AIMessage {
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
  // Gemini 2.5 family
  'google/gemini-2.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30 },
  'google/gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10.00 },
  'google/gemini-2.5-flash-lite': { inputPer1M: 0.01875, outputPer1M: 0.075 },
  'google/gemini-2.5-flash-image': { inputPer1M: 0.10, outputPer1M: 0.40 },
  // Gemini 3 family (next-gen)
  'google/gemini-3-pro-preview': { inputPer1M: 1.50, outputPer1M: 12.00 },
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
      .select('ai_budget_daily_cents, ai_budget_weekly_cents, ai_budget_monthly_cents')
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
    if (prefs.ai_budget_daily_cents && dailySpend >= prefs.ai_budget_daily_cents) {
      return { exceeded: true, period: 'daily' };
    }
    if (prefs.ai_budget_weekly_cents && weeklySpend >= prefs.ai_budget_weekly_cents) {
      return { exceeded: true, period: 'weekly' };
    }
    if (prefs.ai_budget_monthly_cents && monthlySpend >= prefs.ai_budget_monthly_cents) {
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
  const rateLimitResult = checkRateLimit(options.userId, options.functionName);
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
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        ...(options.maxTokens && { max_completion_tokens: options.maxTokens }),
      }),
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
    
    aiResponse = {
      content: data.choices?.[0]?.message?.content || '',
      inputTokens,
      outputTokens,
      totalTokens,
      costCents,
      responseTimeMs,
      model,
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

// Model tier selector with provider options
export type ModelTier = 'speed' | 'balanced' | 'quality' | 'nextgen';
export type ModelProvider = 'google' | 'openai';

const TIER_MODELS: Record<ModelTier, Record<ModelProvider, string>> = {
  speed: { google: 'google/gemini-2.5-flash-lite', openai: 'openai/gpt-5-nano' },
  balanced: { google: 'google/gemini-2.5-flash', openai: 'openai/gpt-5-mini' },
  quality: { google: 'google/gemini-2.5-pro', openai: 'openai/gpt-5' },
  nextgen: { google: 'google/gemini-3-pro-preview', openai: 'openai/gpt-5' },
};

export function selectModel(tier: ModelTier = 'balanced', provider: ModelProvider = 'google'): string {
  return TIER_MODELS[tier][provider];
}

// Image generation model selector
export function selectImageModel(quality: 'fast' | 'quality' = 'fast'): string {
  return quality === 'fast' 
    ? 'google/gemini-2.5-flash-image' 
    : 'google/gemini-3-pro-image-preview';
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
};
