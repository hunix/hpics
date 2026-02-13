/**
 * Dependency Injection Container
 * 
 * Simple DI container for managing service dependencies across domains.
 * Supports singleton and transient lifetimes.
 */

export type ServiceFactory<T> = () => T;
export type ServiceLifetime = 'singleton' | 'transient';

interface ServiceRegistration<T = unknown> {
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

class DIContainer {
  private services: Map<string, ServiceRegistration> = new Map();
  private resolving: Set<string> = new Set();

  /**
   * Register a service with the container
   */
  register<T>(
    key: string, 
    factory: ServiceFactory<T>, 
    lifetime: ServiceLifetime = 'singleton'
  ): this {
    this.services.set(key, { factory, lifetime });
    return this;
  }

  /**
   * Register a service lazily - factory is only called on first resolve.
   * Equivalent to register() with singleton lifetime but makes intent explicit.
   */
  registerLazy<T>(key: string, factory: ServiceFactory<T>): this {
    this.services.set(key, { factory, lifetime: 'singleton' });
    return this;
  }

  /**
   * Register a singleton instance directly
   */
  registerInstance<T>(key: string, instance: T): this {
    this.services.set(key, { 
      factory: () => instance, 
      lifetime: 'singleton',
      instance 
    });
    return this;
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(key: string): T {
    const registration = this.services.get(key);
    
    if (!registration) {
      throw new Error(`Service not registered: ${key}`);
    }

    // Check for circular dependencies
    if (this.resolving.has(key)) {
      throw new Error(`Circular dependency detected: ${key}`);
    }

    // Return singleton instance if available
    if (registration.lifetime === 'singleton' && registration.instance !== undefined) {
      return registration.instance as T;
    }

    // Resolve the service
    this.resolving.add(key);
    try {
      const instance = registration.factory() as T;
      
      // Cache singleton instances
      if (registration.lifetime === 'singleton') {
        registration.instance = instance;
      }
      
      return instance;
    } finally {
      this.resolving.delete(key);
    }
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Remove a service registration
   */
  unregister(key: string): boolean {
    return this.services.delete(key);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get all registered service keys
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.services.keys());
  }
}

// ============================================
// Service Keys (Type-safe service identifiers)
// ============================================

export const ServiceKeys = {
  // Event Bus
  EventBus: 'EventBus',
  
  // Repositories
  ProfileRepository: 'ProfileRepository',
  AnalysisRepository: 'AnalysisRepository',
  DossierRepository: 'DossierRepository',
  InsightRepository: 'InsightRepository',
  FusionRepository: 'FusionRepository',
  DigitalTwinRepository: 'DigitalTwinRepository',
  NetworkRepository: 'NetworkRepository',
  WarfareRepository: 'WarfareRepository',
  
  // Domain Services
  ProfileService: 'ProfileService',
  IntelligenceService: 'IntelligenceService',
  FusionService: 'FusionService',
  NetworkService: 'NetworkService',
  WarfareService: 'WarfareService',
  BiometricService: 'BiometricService',
  PsychologyService: 'PsychologyService',
  
  // Application Services
  AnalysisOrchestrator: 'AnalysisOrchestrator',
  DossierOrchestrator: 'DossierOrchestrator',
  FusionOrchestrator: 'FusionOrchestrator',
  
  // Facades
  ProfileFacade: 'ProfileFacade',
  IntelligenceFacade: 'IntelligenceFacade',
  FusionFacade: 'FusionFacade',
  NetworkFacade: 'NetworkFacade',
  WarfareFacade: 'WarfareFacade',
  
  // Infrastructure
  SupabaseClient: 'SupabaseClient',
  AIGateway: 'AIGateway',
  CacheManager: 'CacheManager',
} as const;

export type ServiceKey = typeof ServiceKeys[keyof typeof ServiceKeys];

// ============================================
// Singleton Container Instance
// ============================================

let containerInstance: DIContainer | null = null;

export function getContainer(): DIContainer {
  if (!containerInstance) {
    containerInstance = new DIContainer();
  }
  return containerInstance;
}

export function resetContainer(): void {
  containerInstance?.clear();
  containerInstance = null;
}

// ============================================
// React Hook for DI
// ============================================

import { useMemo } from 'react';

/**
 * React hook to resolve a service from the container
 */
export function useService<T>(key: string): T {
  return useMemo(() => getContainer().resolve<T>(key), [key]);
}

/**
 * React hook to resolve multiple services
 */
export function useServices<T extends Record<string, unknown>>(keys: Record<keyof T, string>): T {
  return useMemo(() => {
    const container = getContainer();
    const services: Record<string, unknown> = {};
    
    for (const [prop, key] of Object.entries(keys)) {
      services[prop] = container.resolve(key);
    }
    
    return services as T;
  }, [keys]);
}
