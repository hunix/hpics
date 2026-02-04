/**
 * Infrastructure Repositories - Barrel Export (v4.0.0)
 * 
 * Concrete Supabase implementations of domain repository interfaces.
 * Includes new unified analysis repository for consolidated storage.
 */

export { SupabaseProfileRepository } from './SupabaseProfileRepository';
export { 
  SupabaseCampaignRepository, 
  SupabaseThreatRepository 
} from './SupabaseWarfareRepository';
export { SupabaseNetworkRepository } from './SupabaseNetworkRepository';

// Modular analysis repositories (v3.7.0)
export { 
  SupabaseAnalysisRepository,
  SupabaseDossierRepository,
  SupabaseInsightRepository 
} from './analysis';

// Fusion repositories (v3.9.0)
export { SupabaseFusionRepository } from './SupabaseFusionRepository';
export { SupabaseDigitalTwinRepository } from './SupabaseDigitalTwinRepository';

// Unified repositories (v4.0.0 - Consolidation)
export { 
  UnifiedAnalysisRepository,
  getUnifiedAnalysisRepository,
  type UnifiedAnalysis,
  type AnalysisInput,
  type AnalysisFilters,
  type AnalysisDomain,
  type RiskLevel,
  LEGACY_TYPE_MAP,
  mapLegacyType,
} from './UnifiedAnalysisRepository';
