/**
 * Platform Configuration Utilities
 * 
 * Provides a centralized way to access configuration values with proper
 * fallback hierarchy: Contact Override → User Override → Platform Default
 */

import { supabase } from '@/integrations/supabase/client';

export interface PlatformConfigItem {
  config_key: string;
  config_value: unknown;
  category: string;
  subcategory: string | null;
  display_name: string;
  description: string | null;
  value_type: 'number' | 'boolean' | 'string' | 'json' | 'percentage' | 'enum';
  value_constraints: {
    min?: number;
    max?: number;
    options?: string[];
  } | null;
  default_value: unknown;
}

export type ConfigCategory = 
  | 'ai' 
  | 'analysis' 
  | 'biometric' 
  | 'intelligence' 
  | 'relationship' 
  | 'security' 
  | 'enrichment' 
  | 'automation';

export const CONFIG_CATEGORY_LABELS: Record<ConfigCategory, string> = {
  ai: 'AI & Processing',
  analysis: 'Analysis Settings',
  biometric: 'Biometric Recognition',
  intelligence: 'Intelligence Engine',
  relationship: 'Relationship Scoring',
  security: 'Security & Safety',
  enrichment: 'Data Enrichment',
  automation: 'Automation Rules',
};

export const CONFIG_CATEGORY_ICONS: Record<ConfigCategory, string> = {
  ai: 'Brain',
  analysis: 'BarChart3',
  biometric: 'Fingerprint',
  intelligence: 'Lightbulb',
  relationship: 'Heart',
  security: 'Shield',
  enrichment: 'Sparkles',
  automation: 'Workflow',
};

/**
 * Get effective config value with proper fallback hierarchy
 */
export async function getConfigValue<T = unknown>(
  configKey: string,
  userId?: string,
  profileId?: string
): Promise<T> {
  // 1. Check contact-level override
  if (userId && profileId) {
    const { data: contactOverride } = await supabase
      .from('contact_config_overrides')
      .select('config_value')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .eq('config_key', configKey)
      .maybeSingle();
    
    if (contactOverride) {
      return contactOverride.config_value as T;
    }
  }

  // 2. Check user-level override
  if (userId) {
    const { data: userOverride } = await supabase
      .from('user_config_overrides')
      .select('config_value')
      .eq('user_id', userId)
      .eq('config_key', configKey)
      .maybeSingle();
    
    if (userOverride) {
      return userOverride.config_value as T;
    }
  }

  // 3. Fall back to platform default
  const { data: platformConfig } = await supabase
    .from('platform_config')
    .select('config_value')
    .eq('config_key', configKey)
    .maybeSingle();
  
  return (platformConfig?.config_value ?? null) as T;
}

/**
 * Get multiple config values efficiently
 */
export async function getConfigValues(
  configKeys: string[],
  userId?: string,
  profileId?: string
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  // Fetch all in parallel
  const [platformConfigs, userOverrides, contactOverrides] = await Promise.all([
    supabase
      .from('platform_config')
      .select('config_key, config_value')
      .in('config_key', configKeys),
    userId
      ? supabase
          .from('user_config_overrides')
          .select('config_key, config_value')
          .eq('user_id', userId)
          .in('config_key', configKeys)
      : Promise.resolve({ data: [] }),
    userId && profileId
      ? supabase
          .from('contact_config_overrides')
          .select('config_key, config_value')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .in('config_key', configKeys)
      : Promise.resolve({ data: [] }),
  ]);

  // Build lookup maps
  const platformMap = new Map(
    (platformConfigs.data || []).map(c => [c.config_key, c.config_value])
  );
  const userMap = new Map(
    (userOverrides.data || []).map(c => [c.config_key, c.config_value])
  );
  const contactMap = new Map(
    (contactOverrides.data || []).map(c => [c.config_key, c.config_value])
  );

  // Apply hierarchy
  for (const key of configKeys) {
    result[key] = contactMap.get(key) ?? userMap.get(key) ?? platformMap.get(key) ?? null;
  }

  return result;
}

/**
 * Set user-level config override
 */
export async function setUserConfigOverride(
  userId: string,
  configKey: string,
  configValue: unknown
): Promise<void> {
  const { error } = await supabase
    .from('user_config_overrides')
    .upsert({
      user_id: userId,
      config_key: configKey,
      config_value: configValue as any,
    });
  
  if (error) throw error;
}

/**
 * Set contact-level config override
 */
export async function setContactConfigOverride(
  userId: string,
  profileId: string,
  configKey: string,
  configValue: unknown
): Promise<void> {
  const { error } = await supabase
    .from('contact_config_overrides')
    .upsert({
      user_id: userId,
      profile_id: profileId,
      config_key: configKey,
      config_value: configValue as any,
    });
  
  if (error) throw error;
}

/**
 * Remove user config override (revert to platform default)
 */
export async function removeUserConfigOverride(
  userId: string,
  configKey: string
): Promise<void> {
  const { error } = await supabase
    .from('user_config_overrides')
    .delete()
    .eq('user_id', userId)
    .eq('config_key', configKey);
  
  if (error) throw error;
}

/**
 * Remove contact config override (revert to user/platform default)
 */
export async function removeContactConfigOverride(
  userId: string,
  profileId: string,
  configKey: string
): Promise<void> {
  const { error } = await supabase
    .from('contact_config_overrides')
    .delete()
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('config_key', configKey);
  
  if (error) throw error;
}

// Common config keys for easy access
export const CONFIG_KEYS = {
  // AI
  AI_BATCH_SIZE: 'ai.batch_size',
  AI_RATE_LIMIT_DELAY: 'ai.rate_limit_delay_ms',
  AI_MAX_CONCURRENT: 'ai.max_concurrent_requests',
  AI_CACHE_TTL: 'ai.cache_ttl_hours',
  AI_DEFAULT_TEMPERATURE: 'ai.default_temperature',
  AI_MAX_TOKENS: 'ai.max_tokens_default',
  
  // Relationship
  RELATIONSHIP_DECAY_RATE: 'relationship.decay_rate_daily',
  RELATIONSHIP_FAVORITE_DECAY: 'relationship.favorite_decay_rate',
  RELATIONSHIP_MIN_SCORE: 'relationship.minimum_score',
  RELATIONSHIP_HIGH_VALUE: 'relationship.high_value_threshold',
  RELATIONSHIP_AT_RISK: 'relationship.at_risk_threshold',
  
  // Biometric
  BIOMETRIC_FACE_THRESHOLD: 'biometric.face_match_threshold',
  BIOMETRIC_VOICE_THRESHOLD: 'biometric.voice_match_threshold',
  BIOMETRIC_AUTO_TAG_THRESHOLD: 'biometric.auto_tag_threshold',
  BIOMETRIC_MIN_QUALITY: 'biometric.min_face_quality',
  BIOMETRIC_SAMPLES_REQUIRED: 'biometric.enrollment_samples_required',
  
  // Analysis
  ANALYSIS_DECEPTION_THRESHOLD: 'analysis.deception_high_threshold',
  ANALYSIS_PERSONALITY_CONFIDENCE: 'analysis.personality_confidence_min',
  ANALYSIS_SENTIMENT_NEUTRAL: 'analysis.sentiment_neutral_range',
  ANALYSIS_MAX_SAMPLES: 'analysis.max_message_samples',
  ANALYSIS_RECENCY_WEIGHT: 'analysis.recency_weight',
  
  // Intelligence
  INTEL_CHURN_PREDICTION_DAYS: 'intelligence.churn_prediction_days',
  INTEL_OPPORTUNITY_CONFIDENCE: 'intelligence.opportunity_min_confidence',
  INTEL_RISK_THRESHOLD: 'intelligence.risk_alert_threshold',
  INTEL_BRIEFING_LOOKAHEAD: 'intelligence.briefing_lookahead_days',
  INTEL_NETWORK_DEPTH: 'intelligence.network_depth',
  
  // Enrichment
  ENRICHMENT_AUTO_ENABLED: 'enrichment.auto_enrich_enabled',
  ENRICHMENT_RATE_LIMIT: 'enrichment.rate_limit_per_hour',
  ENRICHMENT_MAX_COST: 'enrichment.max_cost_per_contact',
  ENRICHMENT_STALE_DAYS: 'enrichment.stale_data_days',
  
  // Automation
  AUTOMATION_COOLDOWN: 'automation.cooldown_minutes',
  AUTOMATION_MAX_DAILY: 'automation.max_daily_actions',
  AUTOMATION_APPROVAL_THRESHOLD: 'automation.require_approval_threshold',
  
  // Security
  SECURITY_ANOMALY_MULTIPLIER: 'security.anomaly_deviation_multiplier',
  SECURITY_THREAT_FREQUENCY: 'security.threat_assessment_frequency_hours',
  SECURITY_MAX_FAILED_AUTH: 'security.max_failed_auth_attempts',
  SECURITY_SESSION_TIMEOUT: 'security.session_timeout_hours',
} as const;
