/**
 * Infrastructure Repositories - Barrel Export
 * 
 * Concrete Supabase implementations of domain repository interfaces.
 */

export { SupabaseProfileRepository } from './SupabaseProfileRepository';
export { 
  SupabaseCampaignRepository, 
  SupabaseThreatRepository 
} from './SupabaseWarfareRepository';
export { SupabaseNetworkRepository } from './SupabaseNetworkRepository';
export { 
  SupabaseAnalysisRepository,
  SupabaseDossierRepository,
  SupabaseInsightRepository 
} from './SupabaseAnalysisRepository';
