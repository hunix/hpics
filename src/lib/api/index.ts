/**
 * API Layer - Barrel Export (v4.0.0)
 * 
 * Consolidated exports for the API adapter, circuit breakers, and query config.
 */

export {
  invokeFunction,
  isMigratedFunction,
  getRouterName,
  getFunctionsByRouter,
  getRouterNames,
} from './edgeFunctionRouter';

export {
  getRouterBreaker,
  getAllRouterHealth,
  withRouterBreaker,
  getRouterHealthSummary,
} from './routerCircuitBreaker';

export {
  STALE_TIMES,
  GC_TIMES,
  queryKeys,
  profileQueryOptions,
  realtimeQueryOptions,
  analysisQueryOptions,
  configQueryOptions,
} from './queryDefaults';
