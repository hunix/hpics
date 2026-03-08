/**
 * API Layer - Barrel Export (v4.1.0)
 * 
 * Consolidated exports for the API adapter, circuit breakers, query config, and invoke proxy.
 */

export {
  invokeFunction,
  invokeFn,
  isMigratedFunction,
  getRouterName,
  getFunctionsByRouter,
  getRouterNames,
} from './edgeFunctionRouter';

export {
  installInvokeProxy,
  originalInvoke,
} from './invokeProxy';

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
