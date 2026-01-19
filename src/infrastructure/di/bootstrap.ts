/**
 * DI Container Bootstrap
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

let isBootstrapped = false;

export function bootstrapContainer(): void {
  if (isBootstrapped) return;

  const container = getContainer();

  container.registerInstance(ServiceKeys.SupabaseClient, supabase);
  container.registerInstance(ServiceKeys.EventBus, getEventBus());

  container.register(ServiceKeys.FusionService, getFusionService, 'singleton');
  container.register(ServiceKeys.IntelligenceService, getIntelligenceService, 'singleton');
  container.register(ServiceKeys.ProfileService, () => new ProfileService(), 'singleton');
  container.register(ServiceKeys.NetworkService, () => new NetworkService(), 'singleton');

  container.register(ServiceKeys.WarfareService, () => new WarfareService(), 'singleton');

  container.register(ServiceKeys.FusionFacade, getFusionFacade, 'singleton');
  container.register(ServiceKeys.IntelligenceFacade, getIntelligenceFacade, 'singleton');
  container.register(ServiceKeys.ProfileFacade, getProfileFacade, 'singleton');
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
