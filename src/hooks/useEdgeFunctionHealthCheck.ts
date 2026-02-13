import { useState, useCallback, useRef, useEffect } from 'react';

export interface FunctionHealth {
  name: string;
  edgeFunction: string;
  category: 'core' | 'psychological' | 'warfare' | 'network' | 'temporal' | 'fusion';
  status: 'checking' | 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  error?: string;
  lastChecked: Date | null;
  schemaValidated?: boolean;
  schemaWarnings?: string[];
}

export interface HealthSummary {
  total: number;
  healthy: number;
  unhealthy: number;
  checking: number;
  schemaIssues: number;
}

export interface EdgeFunctionHealthResult {
  functions: FunctionHealth[];
  byCategory: Record<string, FunctionHealth[]>;
  summary: HealthSummary;
  isReady: boolean;
  isChecking: boolean;
  lastFullCheck: Date | null;
  runHealthCheck: () => Promise<void>;
  getCriticalMissing: () => FunctionHealth[];
}

/**
 * Health check targets: consolidated domain routers instead of deleted standalone functions.
 * Each router supports `?healthCheck=1` query param.
 */
const INTELLIGENCE_FUNCTIONS: Omit<FunctionHealth, 'status' | 'latency' | 'error' | 'lastChecked'>[] = [
  // Core routers
  { name: 'Analysis Router', edgeFunction: 'analysis-router', category: 'core' },
  { name: 'Intelligence Router', edgeFunction: 'intelligence-router', category: 'core' },
  { name: 'Prediction Router', edgeFunction: 'prediction-router', category: 'core' },
  
  // Psychological / Warfare
  { name: 'Warfare Router', edgeFunction: 'warfare-router', category: 'psychological' },
  
  // Network
  { name: 'Network Router', edgeFunction: 'network-router', category: 'network' },
  { name: 'Enrichment Router', edgeFunction: 'enrichment-router', category: 'network' },
  
  // Biometric & Voice
  { name: 'Biometric Router', edgeFunction: 'biometric-router', category: 'warfare' },
  { name: 'Voice Router', edgeFunction: 'voice-router', category: 'warfare' },
  
  // Fusion & AGIS
  { name: 'Fusion Router', edgeFunction: 'fusion-router', category: 'fusion' },
  { name: 'AGIS Router', edgeFunction: 'agis-router', category: 'temporal' },
  
  // Infrastructure
  { name: 'Utility Router', edgeFunction: 'utility-router', category: 'core' },
  { name: 'Hardware Router', edgeFunction: 'hardware-router', category: 'network' },
  { name: 'Document Router', edgeFunction: 'document-router', category: 'fusion' },
  { name: 'Security Router', edgeFunction: 'security-router', category: 'warfare' },
  { name: 'Media Router', edgeFunction: 'media-router', category: 'fusion' },
];

// Critical routers that must be available
const CRITICAL_FUNCTIONS = [
  'analysis-router',
  'intelligence-router',
  'prediction-router',
  'warfare-router',
];

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CONCURRENCY_LIMIT = 5;

export function useEdgeFunctionHealthCheck(): EdgeFunctionHealthResult {
  const [functions, setFunctions] = useState<FunctionHealth[]>(() => 
    INTELLIGENCE_FUNCTIONS.map(f => ({
      ...f,
      status: 'unknown' as const,
      lastChecked: null,
    }))
  );
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);
  const checkInProgressRef = useRef(false);

  const checkSingleFunction = async (fn: FunctionHealth): Promise<FunctionHealth> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn.edgeFunction}?healthCheck=1`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ healthCheck: true }),
        }
      );
      
      const latency = Date.now() - startTime;
      
      if (response.status === 404) {
        return { ...fn, status: 'unhealthy', latency, error: 'Router not deployed', lastChecked: new Date() };
      }
      
      if (response.status === 200 || response.status === 400 || response.status === 401) {
        return { ...fn, status: 'healthy', latency, error: undefined, lastChecked: new Date() };
      }
      
      if (response.status === 502 || response.status === 503) {
        return { ...fn, status: 'unhealthy', latency, error: response.status === 502 ? 'CPU timeout' : 'Service unavailable', lastChecked: new Date() };
      }
      
      return { ...fn, status: 'healthy', latency, error: undefined, lastChecked: new Date() };
    } catch (err) {
      const latency = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { ...fn, status: 'unhealthy', latency, error: errorMessage.includes('Failed to fetch') ? 'Network error' : errorMessage, lastChecked: new Date() };
    }
  };

  const runHealthCheck = useCallback(async () => {
    if (checkInProgressRef.current) return;
    checkInProgressRef.current = true;
    setIsChecking(true);

    setFunctions(prev => prev.map(f => ({ ...f, status: 'checking' as const })));

    const results: FunctionHealth[] = [];
    const queue = [...functions];

    while (queue.length > 0) {
      const batch = queue.splice(0, CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(batch.map(checkSingleFunction));
      results.push(...batchResults);
      
      setFunctions(prev => {
        const updated = [...prev];
        for (const result of batchResults) {
          const idx = updated.findIndex(f => f.edgeFunction === result.edgeFunction);
          if (idx !== -1) updated[idx] = result;
        }
        return updated;
      });
    }

    setLastFullCheck(new Date());
    setIsChecking(false);
    checkInProgressRef.current = false;
  }, [functions]);

  useEffect(() => {
    const shouldCheck = !lastFullCheck || 
      (Date.now() - lastFullCheck.getTime()) > CACHE_DURATION_MS;
    
    if (shouldCheck && !isChecking) {
      runHealthCheck();
    }
  }, []); // Only run once on mount

  const byCategory = functions.reduce((acc, fn) => {
    if (!acc[fn.category]) acc[fn.category] = [];
    acc[fn.category].push(fn);
    return acc;
  }, {} as Record<string, FunctionHealth[]>);

  const summary: HealthSummary = {
    total: functions.length,
    healthy: functions.filter(f => f.status === 'healthy').length,
    unhealthy: functions.filter(f => f.status === 'unhealthy').length,
    checking: functions.filter(f => f.status === 'checking').length,
    schemaIssues: functions.filter(f => f.schemaWarnings && f.schemaWarnings.length > 0).length,
  };

  const getCriticalMissing = useCallback(() => {
    return functions.filter(
      f => CRITICAL_FUNCTIONS.includes(f.edgeFunction) && f.status === 'unhealthy'
    );
  }, [functions]);

  const isReady = summary.checking === 0 && getCriticalMissing().length === 0;

  return {
    functions,
    byCategory,
    summary,
    isReady,
    isChecking,
    lastFullCheck,
    runHealthCheck,
    getCriticalMissing,
  };
}
