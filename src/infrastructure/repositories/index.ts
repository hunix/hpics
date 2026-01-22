/**
 * Infrastructure Repositories - Barrel Export (v3.9.0)
 * 
 * Concrete Supabase implementations of domain repository interfaces.
 * Analysis repositories now split into modular files in analysis/ folder.
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
