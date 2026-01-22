/**
 * Model Tier Selection System
 * 
 * Dynamic AI model routing based on task type, complexity, and user preferences.
 * Implements the Enhancement Roadmap Phase 3-4 specifications.
 */

export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'expert';
export type ModelTier = 'speed' | 'balanced' | 'quality' | 'nextgen';
export type ModelProvider = 'google' | 'openai';

export interface ModelSelection {
  model: string;
  displayName: string;
  tier: ModelTier;
  estimatedCostPer1k: number;
  maxTokens: number;
  temperature: number;
  provider: ModelProvider;
}

export interface TaskProfile {
  taskType: string;
  complexity: TaskComplexity;
  requiresVision?: boolean;
  requiresReasoning?: boolean;
  isRealtime?: boolean;
  maxLatencyMs?: number;
}

// Model definitions with full metadata
const MODEL_REGISTRY: Record<string, Omit<ModelSelection, 'tier'>> = {
  // Google Gemini 3 Family (Primary)
  'google/gemini-3-pro-preview': {
    model: 'google/gemini-3-pro-preview',
    displayName: 'Gemini 3 Pro',
    estimatedCostPer1k: 1.50,
    maxTokens: 32000,
    temperature: 0.7,
    provider: 'google',
  },
  'google/gemini-3-flash-preview': {
    model: 'google/gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash',
    estimatedCostPer1k: 0.10,
    maxTokens: 16000,
    temperature: 0.7,
    provider: 'google',
  },
  'google/gemini-3-pro-image-preview': {
    model: 'google/gemini-3-pro-image-preview',
    displayName: 'Gemini 3 Pro Vision',
    estimatedCostPer1k: 2.00,
    maxTokens: 16000,
    temperature: 0.7,
    provider: 'google',
  },
  // Google Gemini 2.5 Family (Legacy but stable)
  'google/gemini-2.5-flash': {
    model: 'google/gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    estimatedCostPer1k: 0.075,
    maxTokens: 8000,
    temperature: 0.7,
    provider: 'google',
  },
  'google/gemini-2.5-flash-lite': {
    model: 'google/gemini-2.5-flash-lite',
    displayName: 'Gemini 2.5 Flash Lite',
    estimatedCostPer1k: 0.019,
    maxTokens: 4000,
    temperature: 0.7,
    provider: 'google',
  },
  'google/gemini-2.5-pro': {
    model: 'google/gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    estimatedCostPer1k: 1.25,
    maxTokens: 16000,
    temperature: 0.7,
    provider: 'google',
  },
  // OpenAI GPT-5 Family
  'openai/gpt-5': {
    model: 'openai/gpt-5',
    displayName: 'GPT-5',
    estimatedCostPer1k: 5.00,
    maxTokens: 32000,
    temperature: 0.7,
    provider: 'openai',
  },
  'openai/gpt-5-mini': {
    model: 'openai/gpt-5-mini',
    displayName: 'GPT-5 Mini',
    estimatedCostPer1k: 0.40,
    maxTokens: 16000,
    temperature: 0.7,
    provider: 'openai',
  },
  'openai/gpt-5-nano': {
    model: 'openai/gpt-5-nano',
    displayName: 'GPT-5 Nano',
    estimatedCostPer1k: 0.10,
    maxTokens: 8000,
    temperature: 0.7,
    provider: 'openai',
  },
  'openai/gpt-5.2': {
    model: 'openai/gpt-5.2',
    displayName: 'GPT-5.2',
    estimatedCostPer1k: 6.00,
    maxTokens: 64000,
    temperature: 0.7,
    provider: 'openai',
  },
};

// Tier to model mappings
const MODEL_TIERS: Record<ModelTier, Record<ModelProvider, string>> = {
  speed: {
    google: 'google/gemini-2.5-flash-lite',
    openai: 'openai/gpt-5-nano',
  },
  balanced: {
    google: 'google/gemini-3-flash-preview',
    openai: 'openai/gpt-5-mini',
  },
  quality: {
    google: 'google/gemini-3-pro-preview',
    openai: 'openai/gpt-5',
  },
  nextgen: {
    google: 'google/gemini-3-pro-preview',
    openai: 'openai/gpt-5.2',
  },
};

// Task type to complexity mapping
const TASK_COMPLEXITY_MAP: Record<string, TaskComplexity> = {
  // Simple tasks - fast, cheap
  'quick-summary': 'simple',
  'entity-extraction': 'simple',
  'sentiment-analysis': 'simple',
  'classification': 'simple',
  'keyword-extraction': 'simple',
  'translation': 'simple',
  
  // Moderate tasks - balanced
  'behavioral-analysis': 'moderate',
  'gift-suggestions': 'moderate',
  'milestone-detection': 'moderate',
  'communication-style': 'moderate',
  'topic-extraction': 'moderate',
  'relationship-analysis': 'moderate',
  
  // Complex tasks - quality focused
  'network-analysis': 'complex',
  'influence-mapping': 'complex',
  'vulnerability-assessment': 'complex',
  'deception-detection': 'complex',
  'cognitive-warfare': 'complex',
  'mice-assessment': 'complex',
  
  // Expert tasks - highest quality
  'dossier-generation': 'expert',
  'strategic-synthesis': 'expert',
  'reality-engineering': 'expert',
  'omniscient-orchestration': 'expert',
  'fusion-analysis': 'expert',
  'digital-twin-simulation': 'expert',
};

// Complexity to tier mapping
const COMPLEXITY_TIER_MAP: Record<TaskComplexity, ModelTier> = {
  simple: 'speed',
  moderate: 'balanced',
  complex: 'quality',
  expert: 'nextgen',
};

/**
 * Check if a model string is valid
 */
export function isValidModel(model: string): boolean {
  return model in MODEL_REGISTRY;
}

/**
 * Get model info from registry
 */
export function getModelInfo(model: string): ModelSelection | null {
  const info = MODEL_REGISTRY[model];
  if (!info) return null;
  
  // Determine tier based on cost
  let tier: ModelTier = 'balanced';
  if (info.estimatedCostPer1k < 0.05) tier = 'speed';
  else if (info.estimatedCostPer1k < 0.5) tier = 'balanced';
  else if (info.estimatedCostPer1k < 2.0) tier = 'quality';
  else tier = 'nextgen';
  
  return { ...info, tier };
}

/**
 * Select the optimal model for a task
 */
export function selectModelForTask(
  taskProfile: TaskProfile,
  userPreference?: string,
  providerPreference: ModelProvider = 'google'
): ModelSelection {
  // If user has explicit preference and it's valid, use it
  if (userPreference && isValidModel(userPreference)) {
    const info = getModelInfo(userPreference);
    if (info) return info;
  }
  
  // Get task complexity
  const complexity = taskProfile.complexity || 
    TASK_COMPLEXITY_MAP[taskProfile.taskType] || 
    'moderate';
  
  // Map complexity to tier
  let tier = COMPLEXITY_TIER_MAP[complexity];
  
  // Adjust for special requirements
  if (taskProfile.isRealtime && taskProfile.maxLatencyMs && taskProfile.maxLatencyMs < 2000) {
    // Force speed tier for real-time low-latency requirements
    tier = 'speed';
  }
  
  if (taskProfile.requiresReasoning && tier === 'speed') {
    // Bump up if reasoning is required
    tier = 'balanced';
  }
  
  // Select model from tier
  const modelId = MODEL_TIERS[tier][providerPreference];
  
  // Handle vision requirements
  if (taskProfile.requiresVision) {
    const visionModel = providerPreference === 'google' 
      ? 'google/gemini-3-pro-image-preview'
      : 'openai/gpt-5'; // GPT-5 supports vision natively
    
    const info = getModelInfo(visionModel);
    if (info) return info;
  }
  
  const info = getModelInfo(modelId);
  if (info) return info;
  
  // Fallback to Gemini 3 Flash
  return getModelInfo('google/gemini-3-flash-preview')!;
}

/**
 * Get recommended temperature for task type
 */
export function getTaskTemperature(taskType: string): number {
  const temperatureMap: Record<string, number> = {
    // Factual/extraction - low temperature
    'entity-extraction': 0.3,
    'classification': 0.3,
    'translation': 0.3,
    'sentiment-analysis': 0.35,
    
    // Analysis - moderate temperature
    'behavioral-analysis': 0.5,
    'milestone-detection': 0.5,
    'network-analysis': 0.55,
    'deception-detection': 0.45,
    
    // Creative/strategic - higher temperature
    'gift-suggestions': 0.7,
    'strategic-synthesis': 0.65,
    'dossier-generation': 0.6,
    'cognitive-warfare': 0.7,
    
    // Speculative - highest temperature
    'reality-engineering': 0.8,
    'digital-twin-simulation': 0.75,
  };
  
  return temperatureMap[taskType] ?? 0.7;
}

/**
 * Get all available models
 */
export function getAvailableModels(): ModelSelection[] {
  return Object.keys(MODEL_REGISTRY).map(key => getModelInfo(key)!);
}

/**
 * Get models by tier
 */
export function getModelsByTier(tier: ModelTier): ModelSelection[] {
  const models: ModelSelection[] = [];
  for (const provider of ['google', 'openai'] as ModelProvider[]) {
    const modelId = MODEL_TIERS[tier][provider];
    const info = getModelInfo(modelId);
    if (info) models.push(info);
  }
  return models;
}

/**
 * Estimate cost for a task
 */
export function estimateTaskCost(
  taskType: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  modelOverride?: string
): { model: string; costCents: number } {
  const selection = modelOverride 
    ? getModelInfo(modelOverride) 
    : selectModelForTask({ taskType, complexity: TASK_COMPLEXITY_MAP[taskType] || 'moderate' });
  
  if (!selection) {
    return { model: 'google/gemini-3-flash-preview', costCents: 0 };
  }
  
  // Cost per 1k tokens
  const inputCost = (estimatedInputTokens / 1000) * selection.estimatedCostPer1k;
  const outputCost = (estimatedOutputTokens / 1000) * selection.estimatedCostPer1k * 3; // Output typically costs 3x
  
  return {
    model: selection.model,
    costCents: Math.ceil((inputCost + outputCost) * 100),
  };
}
