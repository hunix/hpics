/**
 * DI Container Bootstrap
 */

import { getContainer, ServiceKeys } from './Container';
import { getEventBus } from '@/domains/shared/events/EventBus';
import { getFusionService } from '@/domains/fusion/services/FusionService';
import { getIntelligenceService } from '@/domains/intelligence/services/IntelligenceService';
import { getFusionFacade } from '@/application/facades/FusionFacade';
import { getIntelligenceFacade } from '@/application/facades/IntelligenceFacade';
import { ProfileService } from '@/domains/profile/services/ProfileService';
import { getProfileFacade } from '@/application/facades/ProfileFacade';
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

  container.register(ServiceKeys.FusionFacade, getFusionFacade, 'singleton');
  container.register(ServiceKeys.IntelligenceFacade, getIntelligenceFacade, 'singleton');
  container.register(ServiceKeys.ProfileFacade, getProfileFacade, 'singleton');

  isBootstrapped = true;
  console.log('[DI] Container bootstrapped:', container.getRegisteredKeys());
}

export function resetBootstrap(): void { isBootstrapped = false; }
export function isContainerReady(): boolean { return isBootstrapped; }
