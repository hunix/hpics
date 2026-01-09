import { lazy, ComponentType, LazyExoticComponent } from 'react';

type LazyComponentCache = Map<string, LazyExoticComponent<ComponentType<any>>>;

const componentCache: LazyComponentCache = new Map();

export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  cacheKey: string
): LazyExoticComponent<T> {
  if (!componentCache.has(cacheKey)) {
    componentCache.set(cacheKey, lazy(importFn));
  }
  return componentCache.get(cacheKey) as LazyExoticComponent<T>;
}

// Pre-defined lazy components for heavy widgets
export const LazyNetworkGraph = lazy(() => 
  import('@/components/network/NetworkGraph').then(m => ({ default: m.NetworkGraph }))
);

export const LazyUnifiedIntelligenceDashboard = lazy(() => 
  import('@/components/intelligence/UnifiedIntelligenceDashboard').then(m => ({ default: m.UnifiedIntelligenceDashboard }))
);

export const LazyBehavioralAnomalyDashboard = lazy(() => 
  import('@/components/intelligence/BehavioralAnomalyDashboard').then(m => ({ default: m.BehavioralAnomalyDashboard }))
);

export const LazyRelationshipAnalytics = lazy(() => 
  import('@/components/dashboard/RelationshipAnalytics').then(m => ({ default: m.RelationshipAnalytics }))
);

export const LazyAIChatAssistant = lazy(() => 
  import('@/components/ai/AIChatAssistant').then(m => ({ default: m.AIChatAssistant }))
);
