/**
 * DI Container Bootstrap (v3.9.0)
 * 
 * Initializes all domain services, facades, and infrastructure.
 * Must be called before rendering the React app.
 */

import { getContainer, ServiceKeys } from './Container';
import { getEventBus } from '@/domains/shared/events/EventBus';
import { getFusionService } from '@/domains/fusion/services/FusionService';
import { getIntelligenceService } from '@/domains/intelligence/services/IntelligenceService';
import { getFusionFacade } from '@/application/facades/FusionFacade';
import { getIntelligenceFacade } from '@/application/facades/IntelligenceFacade';
import { ProfileService } from '@/domains/profile/services/ProfileService';
import { getProfileFacade } from '@/application/facades/ProfileFacade';
import { NetworkService } from '@/domains/network/services/NetworkService';
import { NetworkFacade } from '@/application/facades/NetworkFacade';
import { WarfareService } from '@/domains/warfare/services/WarfareService';
import { WarfareFacade } from '@/application/facades/WarfareFacade';
import { supabase } from '@/integrations/supabase/client';

// Repository implementations
import { SupabaseProfileRepository } from '@/infrastructure/repositories/SupabaseProfileRepository';
import { SupabaseNetworkRepository } from '@/infrastructure/repositories/SupabaseNetworkRepository';
import { 
  SupabaseAnalysisRepository, 
  SupabaseDossierRepository, 
  SupabaseInsightRepository 
} from '@/infrastructure/repositories/SupabaseAnalysisRepository';
import { SupabaseCampaignRepository, SupabaseThreatRepository, SupabaseStrategyRepository } from '@/infrastructure/repositories/SupabaseWarfareRepository';
import { SupabaseFusionRepository } from '@/infrastructure/repositories/SupabaseFusionRepository';
import { SupabaseDigitalTwinRepository } from '@/infrastructure/repositories/SupabaseDigitalTwinRepository';

let isBootstrapped = false;

export function bootstrapContainer(): void {
  if (isBootstrapped) return;

  const container = getContainer();

  // Infrastructure
  container.registerInstance(ServiceKeys.SupabaseClient, supabase);
  container.registerInstance(ServiceKeys.EventBus, getEventBus());

  // Repositories
  container.register(ServiceKeys.ProfileRepository, () => new SupabaseProfileRepository(supabase), 'singleton');
  container.register(ServiceKeys.NetworkRepository, () => new SupabaseNetworkRepository(), 'singleton');
  container.register(ServiceKeys.AnalysisRepository, () => new SupabaseAnalysisRepository(), 'singleton');
  container.register(ServiceKeys.DossierRepository, () => new SupabaseDossierRepository(), 'singleton');
  container.register(ServiceKeys.InsightRepository, () => new SupabaseInsightRepository(), 'singleton');
  container.register(ServiceKeys.FusionRepository, () => new SupabaseFusionRepository(supabase), 'singleton');
  container.register(ServiceKeys.DigitalTwinRepository, () => new SupabaseDigitalTwinRepository(supabase), 'singleton');
  container.register(ServiceKeys.WarfareRepository, () => ({
    campaigns: new SupabaseCampaignRepository(supabase),
    threats: new SupabaseThreatRepository(supabase),
    strategies: new SupabaseStrategyRepository(supabase)
  }), 'singleton');

  // Domain Services - inject repositories
  container.register(ServiceKeys.FusionService, () => {
    const fusionRepo = container.resolve<import('@/domains/fusion/repositories/IFusionRepository').IFusionRepository>(ServiceKeys.FusionRepository);
    const twinRepo = container.resolve<import('@/domains/fusion/repositories/IFusionRepository').IDigitalTwinRepository>(ServiceKeys.DigitalTwinRepository);
    return new (require('@/domains/fusion/services/FusionService').FusionService)(fusionRepo, twinRepo);
  }, 'singleton');
  container.register(ServiceKeys.IntelligenceService, getIntelligenceService, 'singleton');
  container.register(ServiceKeys.ProfileService, () => {
    const repo = container.resolve<import('@/domains/profile/repositories/IProfileRepository').IProfileRepository>(ServiceKeys.ProfileRepository);
    return new ProfileService(repo);
  }, 'singleton');
  container.register(ServiceKeys.NetworkService, () => new NetworkService(), 'singleton');
  container.register(ServiceKeys.WarfareService, () => {
    const warfareRepo = container.resolve<import('@/domains/warfare/repositories/IWarfareRepository').IWarfareRepository>(ServiceKeys.WarfareRepository);
    return new WarfareService(warfareRepo);
  }, 'singleton');

  // Facades
  container.register(ServiceKeys.FusionFacade, getFusionFacade, 'singleton');
  container.register(ServiceKeys.IntelligenceFacade, getIntelligenceFacade, 'singleton');
  container.register(ServiceKeys.ProfileFacade, () => {
    const profileService = container.resolve<ProfileService>(ServiceKeys.ProfileService)!;
    return new (getProfileFacade().constructor as any)(profileService);
  }, 'singleton');
  container.register(ServiceKeys.NetworkFacade, () => {
    const networkService = container.resolve<NetworkService>(ServiceKeys.NetworkService)!;
    return new NetworkFacade(networkService);
  }, 'singleton');
  container.register(ServiceKeys.WarfareFacade, () => {
    const warfareService = container.resolve<WarfareService>(ServiceKeys.WarfareService)!;
    return new WarfareFacade(warfareService);
  }, 'singleton');

  isBootstrapped = true;
  console.log('[DI] Container bootstrapped:', container.getRegisteredKeys());
}

export function resetBootstrap(): void { isBootstrapped = false; }
export function isContainerReady(): boolean { return isBootstrapped; }
