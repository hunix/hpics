// Unified AI Client for all edge functions
// Provides consistent logging, error handling, and cost tracking

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
}

interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  responseTimeMs: number;
  model: string;
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
      prompt_summary: options.messages[options.messages.length - 1]?.content?.substring(0, 500) || '',
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
    });

    throw error;
  }

  // Log success
  await supabase.from('ai_usage_logs').insert({
    user_id: options.userId,
    function_name: options.functionName,
    model_name: model,
    provider: getProvider(model),
    prompt_summary: options.messages[options.messages.length - 1]?.content?.substring(0, 500) || '',
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
