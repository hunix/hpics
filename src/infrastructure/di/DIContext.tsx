/**
 * DI Context for React
 */

import React, { createContext, useContext, useMemo } from 'react';
import { getContainer, ServiceKeys } from './Container';
import { NetworkService } from '@/domains/network/services/NetworkService';
import { ProfileService } from '@/domains/profile/services/ProfileService';

interface DIContextValue {
  getNetworkService: () => NetworkService;
  getProfileService: () => ProfileService;
}

const DIContext = createContext<DIContextValue | null>(null);

export function DIProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<DIContextValue>(() => ({
    getNetworkService: () => {
      const container = getContainer();
      let service = container.resolve<NetworkService>(ServiceKeys.NetworkService);
      if (!service) {
        service = new NetworkService();
        container.registerInstance(ServiceKeys.NetworkService, service);
      }
      return service;
    },
    getProfileService: () => {
      const container = getContainer();
      return container.resolve<ProfileService>(ServiceKeys.ProfileService);
    },
  }), []);

  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
}

export function useDI(): DIContextValue {
  const context = useContext(DIContext);
  if (!context) {
    // Fallback - resolve from container
    const container = getContainer();
    return {
      getNetworkService: () => container.resolve<NetworkService>(ServiceKeys.NetworkService) || new NetworkService(),
      getProfileService: () => container.resolve<ProfileService>(ServiceKeys.ProfileService),
    };
  }
  return context;
}
