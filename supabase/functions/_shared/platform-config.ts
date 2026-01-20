/**
 * @fileoverview Shared Platform Configuration Reader for Edge Functions
 * Provides database-driven configuration instead of hardcoded values
 */

// Use 'any' type for SupabaseClient to avoid version mismatch issues between edge functions
type SupabaseClientAny = any;

export interface PlatformConfigValue {
  config_key: string;
  config_value: any;
  data_type: string;
  category: string;
  default_value: any;
}

// Default values for all platform configurations - GEMINI 3 OPTIMIZED
export const CONFIG_DEFAULTS: Record<string, any> = {
  // AI Configuration - Gemini 3 Family (v5.3)
  'ai.default_model': 'google/gemini-3-flash-preview',
  'ai.quality_model': 'google/gemini-3-pro-preview',
  'ai.speed_model': 'google/gemini-3-flash-preview',
  'ai.reasoning_model': 'google/gemini-3-pro-preview',
  'ai.vision_model': 'google/gemini-3-pro-image-preview',
  'ai.max_tokens_per_request': 16000,  // Increased for Gemini 3
  'ai.temperature_default': 0.55,
  'ai.daily_budget_cents': 5000,
  'ai.weekly_budget_cents': 25000,
  'ai.monthly_budget_cents': 100000,
  'ai.budget_alert_threshold': 80,
  'ai.cache_enabled': true,
  'ai.cache_ttl_hours': 24,
  
  // RAG Configuration
  'rag.max_results': 20,
  'rag.similarity_threshold': 0.7,
  'rag.rerank_enabled': true,
  'rag.cross_encoder_model': 'cross-encoder/ms-marco-MiniLM-L-6-v2',
  'rag.hybrid_search_alpha': 0.5, // Balance between semantic (0) and keyword (1)
  'rag.context_window_tokens': 8000,
  'rag.citation_required': true,
  
  // Relationship Configuration
  'relationship.decay_enabled': true,
  'relationship.decay_rate_daily': 0.5,
  'relationship.max_decay_percent': 50,
  'relationship.priority_boost_vip': 2.0,
  'relationship.contact_reminder_days': 30,
  
  // Biometric Configuration
  'biometric.face_match_threshold': 0.85,
  'biometric.voice_match_threshold': 0.80,
  'biometric.auto_tag_enabled': true,
  'biometric.min_samples_for_enrollment': 3,
  
  // Analysis Configuration
  'analysis.batch_size': 10,
  'analysis.max_concurrent_jobs': 5,
  'analysis.auto_analysis_enabled': true,
  'analysis.deep_analysis_threshold': 5,
  
  // Intelligence Configuration
  'intelligence.enrichment_enabled': true,
  'intelligence.enrichment_interval_hours': 72,
  'intelligence.vip_enrichment_interval_hours': 24,
  'intelligence.max_enrichment_sources': 5,
  
  // Enrichment Configuration
  'enrichment.auto_enrich_new_contacts': true,
  'enrichment.linkedin_enabled': true,
  'enrichment.web_search_enabled': true,
  'enrichment.news_monitoring_enabled': true,
  
  // Automation Configuration
  'automation.max_rules_per_user': 50,
  'automation.max_daily_executions': 1000,
  'automation.cooldown_minutes': 5,
  
  // Security Configuration
  'security.session_timeout_minutes': 60,
  'security.max_failed_logins': 5,
  'security.require_2fa': false,
  'security.audit_log_retention_days': 90,
};

// Cache for config values
const configCache: Map<string, { value: any; timestamp: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get a platform configuration value with fallback hierarchy:
 * Contact Override → User Override → Platform Config → Default
 */
export async function getPlatformConfig(
  supabaseClient: SupabaseClientAny,
  configKey: string,
  options?: {
    userId?: string;
    contactId?: string;
    skipCache?: boolean;
  }
): Promise<any> {
  const cacheKey = `${configKey}:${options?.userId || 'global'}:${options?.contactId || 'none'}`;
  
  // Check cache first
  if (!options?.skipCache) {
    const cached = configCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.value;
    }
  }
  
  let value: any = CONFIG_DEFAULTS[configKey];
  
  try {
    // 1. Check contact-level override if contactId provided
    if (options?.contactId && options?.userId) {
      const { data: contactOverride } = await supabaseClient
        .from('contact_config_overrides')
        .select('config_value')
        .eq('profile_id', options.contactId)
        .eq('config_key', configKey)
        .eq('user_id', options.userId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (contactOverride?.config_value !== undefined) {
        value = contactOverride.config_value;
        configCache.set(cacheKey, { value, timestamp: Date.now() });
        return value;
      }
    }
    
    // 2. Check user-level override if userId provided
    if (options?.userId) {
      const { data: userOverride } = await supabaseClient
        .from('user_config_overrides')
        .select('config_value')
        .eq('user_id', options.userId)
        .eq('config_key', configKey)
        .eq('is_active', true)
        .maybeSingle();
      
      if (userOverride?.config_value !== undefined) {
        value = userOverride.config_value;
        configCache.set(cacheKey, { value, timestamp: Date.now() });
        return value;
      }
    }
    
    // 3. Check platform-level config
    const { data: platformConfig } = await supabaseClient
      .from('platform_config')
      .select('config_value')
      .eq('config_key', configKey)
      .maybeSingle();
    
    if (platformConfig?.config_value !== undefined) {
      value = platformConfig.config_value;
    }
  } catch (error) {
    console.error(`Error fetching config ${configKey}:`, error);
    // Fall back to default value
  }
  
  configCache.set(cacheKey, { value, timestamp: Date.now() });
  return value;
}

/**
 * Get multiple configuration values at once (more efficient for batch reads)
 */
export async function getPlatformConfigs(
  supabaseClient: SupabaseClientAny,
  configKeys: string[],
  options?: {
    userId?: string;
    contactId?: string;
  }
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  // Initialize with defaults
  for (const key of configKeys) {
    results[key] = CONFIG_DEFAULTS[key];
  }
  
  try {
    // Fetch all platform configs at once
    const { data: platformConfigs } = await supabaseClient
      .from('platform_config')
      .select('config_key, config_value')
      .in('config_key', configKeys);
    
    if (platformConfigs) {
      for (const config of platformConfigs) {
        results[config.config_key] = config.config_value;
      }
    }
    
    // Fetch user overrides if userId provided
    if (options?.userId) {
      const { data: userOverrides } = await supabaseClient
        .from('user_config_overrides')
        .select('config_key, config_value')
        .eq('user_id', options.userId)
        .eq('is_active', true)
        .in('config_key', configKeys);
      
      if (userOverrides) {
        for (const override of userOverrides) {
          results[override.config_key] = override.config_value;
        }
      }
    }
    
    // Fetch contact overrides if contactId provided
    if (options?.contactId && options?.userId) {
      const { data: contactOverrides } = await supabaseClient
        .from('contact_config_overrides')
        .select('config_key, config_value')
        .eq('profile_id', options.contactId)
        .eq('user_id', options.userId)
        .eq('is_active', true)
        .in('config_key', configKeys);
      
      if (contactOverrides) {
        for (const override of contactOverrides) {
          results[override.config_key] = override.config_value;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching configs:', error);
  }
  
  return results;
}

/**
 * Clear the config cache (useful after updates)
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Get AI-specific configuration values - GEMINI 3 OPTIMIZED
 */
export async function getAIConfig(
  supabaseClient: SupabaseClientAny,
  userId?: string,
  analysisType?: string  // NEW: Optional analysis type for task-specific config
): Promise<{
  defaultModel: string;
  qualityModel: string;
  speedModel: string;
  reasoningModel: string;
  visionModel: string;
  maxTokens: number;
  temperature: number;
  dailyBudgetCents: number;
  weeklyBudgetCents: number;
  monthlyBudgetCents: number;
  cacheEnabled: boolean;
  cacheTTLHours: number;
}> {
  const configs = await getPlatformConfigs(supabaseClient, [
    'ai.default_model',
    'ai.quality_model',
    'ai.speed_model',
    'ai.reasoning_model',
    'ai.vision_model',
    'ai.max_tokens_per_request',
    'ai.temperature_default',
    'ai.daily_budget_cents',
    'ai.weekly_budget_cents',
    'ai.monthly_budget_cents',
    'ai.cache_enabled',
    'ai.cache_ttl_hours',
  ], { userId });
  
  return {
    defaultModel: configs['ai.default_model'] || 'google/gemini-3-flash-preview',
    qualityModel: configs['ai.quality_model'] || 'google/gemini-3-pro-preview',
    speedModel: configs['ai.speed_model'] || 'google/gemini-3-flash-preview',
    reasoningModel: configs['ai.reasoning_model'] || 'google/gemini-3-pro-preview',
    visionModel: configs['ai.vision_model'] || 'google/gemini-3-pro-image-preview',
    maxTokens: configs['ai.max_tokens_per_request'] || 16000,
    temperature: configs['ai.temperature_default'] || 0.55,
    dailyBudgetCents: configs['ai.daily_budget_cents'],
    weeklyBudgetCents: configs['ai.weekly_budget_cents'],
    monthlyBudgetCents: configs['ai.monthly_budget_cents'],
    cacheEnabled: configs['ai.cache_enabled'],
    cacheTTLHours: configs['ai.cache_ttl_hours'],
  };
}

/**
 * Get relationship-specific configuration values
 */
export async function getRelationshipConfig(
  supabaseClient: SupabaseClientAny,
  userId?: string
): Promise<{
  decayEnabled: boolean;
  decayRateDaily: number;
  favoriteDecayMultiplier: number;
  maxDecayPercent: number;
  priorityBoostVip: number;
  contactReminderDays: number;
}> {
  const configs = await getPlatformConfigs(supabaseClient, [
    'relationship.decay_enabled',
    'relationship.decay_rate_daily',
    'relationship.max_decay_percent',
    'relationship.priority_boost_vip',
    'relationship.contact_reminder_days',
  ], { userId });
  
  return {
    decayEnabled: configs['relationship.decay_enabled'],
    decayRateDaily: configs['relationship.decay_rate_daily'],
    favoriteDecayMultiplier: 0.5, // Favorites decay at 50% the rate
    maxDecayPercent: configs['relationship.max_decay_percent'],
    priorityBoostVip: configs['relationship.priority_boost_vip'],
    contactReminderDays: configs['relationship.contact_reminder_days'],
  };
}

/**
 * Get biometric-specific configuration values
 */
export async function getBiometricConfig(
  supabaseClient: SupabaseClientAny,
  userId?: string
): Promise<{
  faceMatchThreshold: number;
  voiceMatchThreshold: number;
  autoTagEnabled: boolean;
  minSamplesForEnrollment: number;
}> {
  const configs = await getPlatformConfigs(supabaseClient, [
    'biometric.face_match_threshold',
    'biometric.voice_match_threshold',
    'biometric.auto_tag_enabled',
    'biometric.min_samples_for_enrollment',
  ], { userId });
  
  return {
    faceMatchThreshold: configs['biometric.face_match_threshold'],
    voiceMatchThreshold: configs['biometric.voice_match_threshold'],
    autoTagEnabled: configs['biometric.auto_tag_enabled'],
    minSamplesForEnrollment: configs['biometric.min_samples_for_enrollment'],
  };
}

/**
 * Get enrichment-specific configuration values
 */
export async function getEnrichmentConfig(
  supabaseClient: SupabaseClientAny,
  userId?: string,
  contactId?: string
): Promise<{
  enrichmentEnabled: boolean;
  enrichmentIntervalHours: number;
  vipEnrichmentIntervalHours: number;
  maxEnrichmentSources: number;
  autoEnrichNewContacts: boolean;
  linkedinEnabled: boolean;
  webSearchEnabled: boolean;
  newsMonitoringEnabled: boolean;
}> {
  const configs = await getPlatformConfigs(supabaseClient, [
    'intelligence.enrichment_enabled',
    'intelligence.enrichment_interval_hours',
    'intelligence.vip_enrichment_interval_hours',
    'intelligence.max_enrichment_sources',
    'enrichment.auto_enrich_new_contacts',
    'enrichment.linkedin_enabled',
    'enrichment.web_search_enabled',
    'enrichment.news_monitoring_enabled',
  ], { userId, contactId });
  
  return {
    enrichmentEnabled: configs['intelligence.enrichment_enabled'],
    enrichmentIntervalHours: configs['intelligence.enrichment_interval_hours'],
    vipEnrichmentIntervalHours: configs['intelligence.vip_enrichment_interval_hours'],
    maxEnrichmentSources: configs['intelligence.max_enrichment_sources'],
    autoEnrichNewContacts: configs['enrichment.auto_enrich_new_contacts'],
    linkedinEnabled: configs['enrichment.linkedin_enabled'],
    webSearchEnabled: configs['enrichment.web_search_enabled'],
    newsMonitoringEnabled: configs['enrichment.news_monitoring_enabled'],
  };
}

/**
 * Get RAG-specific configuration values
 */
export async function getRAGConfig(
  supabaseClient: SupabaseClientAny,
  userId?: string
): Promise<{
  maxResults: number;
  similarityThreshold: number;
  rerankEnabled: boolean;
  crossEncoderModel: string;
  hybridSearchAlpha: number;
  contextWindowTokens: number;
  citationRequired: boolean;
}> {
  const configs = await getPlatformConfigs(supabaseClient, [
    'rag.max_results',
    'rag.similarity_threshold',
    'rag.rerank_enabled',
    'rag.cross_encoder_model',
    'rag.hybrid_search_alpha',
    'rag.context_window_tokens',
    'rag.citation_required',
  ], { userId });
  
  return {
    maxResults: configs['rag.max_results'],
    similarityThreshold: configs['rag.similarity_threshold'],
    rerankEnabled: configs['rag.rerank_enabled'],
    crossEncoderModel: configs['rag.cross_encoder_model'],
    hybridSearchAlpha: configs['rag.hybrid_search_alpha'],
    contextWindowTokens: configs['rag.context_window_tokens'],
    citationRequired: configs['rag.citation_required'],
  };
}
