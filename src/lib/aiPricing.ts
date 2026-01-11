// AI Model Pricing (per 1M tokens in USD)
export interface ModelPricing {
  provider: string;
  model: string;
  inputPer1M: number;
  outputPer1M: number;
  displayName: string;
}

export const AI_MODEL_PRICING: Record<string, ModelPricing> = {
  // Lovable AI Gateway (Google) - Current Models
  'google/gemini-2.5-flash': {
    provider: 'google',
    model: 'google/gemini-2.5-flash',
    inputPer1M: 0.075,
    outputPer1M: 0.30,
    displayName: 'Gemini 2.5 Flash',
  },
  'google/gemini-2.5-pro': {
    provider: 'google',
    model: 'google/gemini-2.5-pro',
    inputPer1M: 1.25,
    outputPer1M: 10.00,
    displayName: 'Gemini 2.5 Pro',
  },
  'google/gemini-2.5-flash-lite': {
    provider: 'google',
    model: 'google/gemini-2.5-flash-lite',
    inputPer1M: 0.01875,
    outputPer1M: 0.075,
    displayName: 'Gemini 2.5 Flash Lite',
  },
  // Google Gemini 3 Models (Next Gen)
  'google/gemini-3-pro-preview': {
    provider: 'google',
    model: 'google/gemini-3-pro-preview',
    inputPer1M: 1.50,
    outputPer1M: 12.00,
    displayName: 'Gemini 3 Pro Preview',
  },
  'google/gemini-2.5-flash-image': {
    provider: 'google',
    model: 'google/gemini-2.5-flash-image',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    displayName: 'Gemini 2.5 Flash Image',
  },
  'google/gemini-3-pro-image-preview': {
    provider: 'google',
    model: 'google/gemini-3-pro-image-preview',
    inputPer1M: 2.00,
    outputPer1M: 15.00,
    displayName: 'Gemini 3 Pro Image Preview',
  },
  
  // OpenAI GPT-5 Models
  'openai/gpt-5': {
    provider: 'openai',
    model: 'openai/gpt-5',
    inputPer1M: 5.00,
    outputPer1M: 15.00,
    displayName: 'GPT-5',
  },
  'openai/gpt-5-mini': {
    provider: 'openai',
    model: 'openai/gpt-5-mini',
    inputPer1M: 0.40,
    outputPer1M: 1.60,
    displayName: 'GPT-5 Mini',
  },
  'openai/gpt-5-nano': {
    provider: 'openai',
    model: 'openai/gpt-5-nano',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    displayName: 'GPT-5 Nano',
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    inputPer1M: 2.50,
    outputPer1M: 10.00,
    displayName: 'GPT-4o',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
    displayName: 'GPT-4o Mini',
  },
  
  // ElevenLabs (per character, converted to approximate tokens)
  'elevenlabs/scribe': {
    provider: 'elevenlabs',
    model: 'elevenlabs/scribe',
    inputPer1M: 0.40, // Approximate based on audio duration
    outputPer1M: 0,
    displayName: 'ElevenLabs Scribe',
  },
  
  // Local models (free)
  'local/llama': {
    provider: 'local',
    model: 'local/llama',
    inputPer1M: 0,
    outputPer1M: 0,
    displayName: 'Local LLaMA',
  },
  'local/custom': {
    provider: 'local',
    model: 'local/custom',
    inputPer1M: 0,
    outputPer1M: 0,
    displayName: 'Local Custom Model',
  },
};

// Estimate tokens from text (rough approximation: 1 token ≈ 4 characters)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Calculate cost in cents
export function calculateCostCents(
  modelKey: string,
  inputTokens: number,
  outputTokens: number = 0
): number {
  const pricing = AI_MODEL_PRICING[modelKey] || AI_MODEL_PRICING['google/gemini-2.5-flash'];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  return Math.ceil((inputCost + outputCost) * 100); // Convert to cents
}

// Format cents to USD display
export function formatCentsToUSD(cents: number): string {
  return `$${(cents / 100).toFixed(4)}`;
}

// Get provider color for UI
export function getProviderColor(provider: string): string {
  switch (provider) {
    case 'google':
      return 'bg-blue-500';
    case 'openai':
      return 'bg-green-500';
    case 'elevenlabs':
      return 'bg-purple-500';
    case 'local':
      return 'bg-gray-500';
    default:
      return 'bg-muted';
  }
}

// Model tiers for simplified selection
export interface ModelTier {
  id: string;
  name: string;
  description: string;
  models: {
    google: string;
    openai: string;
  };
  costMultiplier: number; // Relative cost (1 = baseline)
  qualityScore: number; // 1-10 quality rating
  speedScore: number; // 1-10 speed rating
}

export const MODEL_TIERS: ModelTier[] = [
  {
    id: 'speed',
    name: 'Speed',
    description: 'Fastest responses, lowest cost. Best for simple tasks.',
    models: {
      google: 'google/gemini-2.5-flash-lite',
      openai: 'openai/gpt-5-nano',
    },
    costMultiplier: 0.25,
    qualityScore: 6,
    speedScore: 10,
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good performance at reasonable cost. Recommended for most tasks.',
    models: {
      google: 'google/gemini-2.5-flash',
      openai: 'openai/gpt-5-mini',
    },
    costMultiplier: 1,
    qualityScore: 8,
    speedScore: 8,
  },
  {
    id: 'quality',
    name: 'Quality',
    description: 'Best accuracy and reasoning. Use for complex analysis.',
    models: {
      google: 'google/gemini-2.5-pro',
      openai: 'openai/gpt-5',
    },
    costMultiplier: 4,
    qualityScore: 10,
    speedScore: 5,
  },
  {
    id: 'nextgen',
    name: 'Next Gen',
    description: 'Cutting-edge models with latest capabilities.',
    models: {
      google: 'google/gemini-3-pro-preview',
      openai: 'openai/gpt-5',
    },
    costMultiplier: 5,
    qualityScore: 10,
    speedScore: 4,
  },
];

export function getModelForTier(tierId: string, preferredProvider: 'google' | 'openai' = 'google'): string {
  const tier = MODEL_TIERS.find(t => t.id === tierId) || MODEL_TIERS[1]; // Default to balanced
  return tier.models[preferredProvider];
}

export function getTierById(tierId: string): ModelTier | undefined {
  return MODEL_TIERS.find(t => t.id === tierId);
}
