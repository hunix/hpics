/**
 * Query Defaults & Key Factory (v4.0.0)
 * 
 * Centralized query configuration for TanStack Query.
 * Prevents inconsistent staleTime/gcTime across 73+ hooks.
 * 
 * @module lib/api/queryDefaults
 */

// ============================================================================
// Stale Time Presets (how long data is considered fresh)
// ============================================================================

export const STALE_TIMES = {
  /** Real-time data: alerts, notifications (10s) */
  REALTIME: 10 * 1000,
  /** Fast-changing data: health checks, active sessions (30s) */
  FAST: 30 * 1000,
  /** Standard data: contacts, analyses (5min) */
  STANDARD: 5 * 60 * 1000,
  /** Slow-changing data: config, profiles (15min) */
  SLOW: 15 * 60 * 1000,
  /** Near-static data: integration guides, schemas (1hr) */
  STATIC: 60 * 60 * 1000,
} as const;

// ============================================================================
// GC Time Presets (how long inactive data stays in cache)
// ============================================================================

export const GC_TIMES = {
  /** Short-lived cache (5min) */
  SHORT: 5 * 60 * 1000,
  /** Standard cache (30min) */
  STANDARD: 30 * 60 * 1000,
  /** Long-lived cache (2hr) */
  LONG: 2 * 60 * 60 * 1000,
} as const;

// ============================================================================
// Query Key Factories (type-safe, hierarchical)
// ============================================================================

export const queryKeys = {
  // Profile domain
  profiles: {
    all: ['profiles'] as const,
    list: (userId: string) => ['profiles', 'list', userId] as const,
    detail: (profileId: string) => ['profiles', 'detail', profileId] as const,
    search: (query: string) => ['profiles', 'search', query] as const,
  },

  // Analysis domain
  analysis: {
    all: ['analysis'] as const,
    byProfile: (profileId: string) => ['analysis', 'profile', profileId] as const,
    byType: (profileId: string, type: string) => ['analysis', 'profile', profileId, type] as const,
    unified: (profileId: string) => ['analysis', 'unified', profileId] as const,
  },

  // Intelligence domain
  intelligence: {
    all: ['intelligence'] as const,
    dossier: (profileId: string) => ['intelligence', 'dossier', profileId] as const,
    insights: (profileId: string) => ['intelligence', 'insights', profileId] as const,
    briefing: (userId: string) => ['intelligence', 'briefing', userId] as const,
    actions: (userId: string) => ['intelligence', 'actions', userId] as const,
  },

  // Prediction domain
  predictions: {
    all: ['predictions'] as const,
    byProfile: (profileId: string) => ['predictions', 'profile', profileId] as const,
    churn: (profileId: string) => ['predictions', 'churn', profileId] as const,
    trajectory: (profileId: string) => ['predictions', 'trajectory', profileId] as const,
  },

  // Network domain
  network: {
    all: ['network'] as const,
    graph: (userId: string) => ['network', 'graph', userId] as const,
    communities: (userId: string) => ['network', 'communities', userId] as const,
  },

  // Biometric domain
  biometrics: {
    all: ['biometrics'] as const,
    byProfile: (profileId: string) => ['biometrics', 'profile', profileId] as const,
    embeddings: (profileId: string) => ['biometrics', 'embeddings', profileId] as const,
  },

  // Fusion domain
  fusion: {
    all: ['fusion'] as const,
    byProfile: (profileId: string) => ['fusion', 'profile', profileId] as const,
    digitalTwin: (profileId: string) => ['fusion', 'digital-twin', profileId] as const,
  },

  // Config & system
  config: {
    all: ['config'] as const,
    key: (configKey: string) => ['config', 'key', configKey] as const,
    budget: (userId: string) => ['config', 'budget', userId] as const,
  },

  // Health & monitoring
  health: {
    all: ['health'] as const,
    routers: () => ['health', 'routers'] as const,
    functions: () => ['health', 'functions'] as const,
  },
} as const;

// ============================================================================
// Query Option Presets
// ============================================================================

/** Standard query options for profile-related data */
export const profileQueryOptions = {
  staleTime: STALE_TIMES.STANDARD,
  gcTime: GC_TIMES.STANDARD,
} as const;

/** Query options for real-time monitoring data */
export const realtimeQueryOptions = {
  staleTime: STALE_TIMES.REALTIME,
  gcTime: GC_TIMES.SHORT,
  refetchInterval: 10_000,
} as const;

/** Query options for analysis results (expensive to compute) */
export const analysisQueryOptions = {
  staleTime: STALE_TIMES.SLOW,
  gcTime: GC_TIMES.LONG,
} as const;

/** Query options for config/static data */
export const configQueryOptions = {
  staleTime: STALE_TIMES.STATIC,
  gcTime: GC_TIMES.LONG,
} as const;
