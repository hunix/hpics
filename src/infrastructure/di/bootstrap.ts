/**
 * DI Container Bootstrap
 * 
 * Initializes the dependency injection container with all services.
 * This should be called once at application startup.
 */

import { getContainer, ServiceKeys } from './Container';
import { getEventBus } from '@/domains/shared/events/EventBus';
import { getFusionService } from '@/domains/fusion/services/FusionService';
import { getIntelligenceService } from '@/domains/intelligence/services/IntelligenceService';
import { getFusionFacade } from '@/application/facades/FusionFacade';
import { getIntelligenceFacade } from '@/application/facades/IntelligenceFacade';
import { supabase } from '@/integrations/supabase/client';

let isBootstrapped = false;

/**
 * Bootstrap the DI container with all services
 */
export function bootstrapContainer(): void {
  if (isBootstrapped) {
    console.log('[DI] Container already bootstrapped');
    return;
  }

  const container = getContainer();

  // Infrastructure
  container.registerInstance(ServiceKeys.SupabaseClient, supabase);
  container.registerInstance(ServiceKeys.EventBus, getEventBus());

  // Domain Services - Fusion
  container.register(ServiceKeys.FusionService, getFusionService, 'singleton');

  // Domain Services - Intelligence
  container.register(ServiceKeys.IntelligenceService, getIntelligenceService, 'singleton');

  // Application Facades
  container.register(ServiceKeys.FusionFacade, getFusionFacade, 'singleton');
  container.register(ServiceKeys.IntelligenceFacade, getIntelligenceFacade, 'singleton');

  // TODO: Register remaining domains as they are migrated
  // container.register(ServiceKeys.ProfileService, getProfileService, 'singleton');
  // container.register(ServiceKeys.WarfareService, getWarfareService, 'singleton');

  isBootstrapped = true;
  console.log('[DI] Container bootstrapped with services:', container.getRegisteredKeys());
}

/**
 * Reset the container (for testing)
 */
export function resetBootstrap(): void {
  isBootstrapped = false;
}

/**
 * Check if container is bootstrapped
 */
export function isContainerReady(): boolean {
  return isBootstrapped;
}
