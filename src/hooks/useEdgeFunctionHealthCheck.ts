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

// All 30 intelligence edge functions from intelligence-session-runner
const INTELLIGENCE_FUNCTIONS: Omit<FunctionHealth, 'status' | 'latency' | 'error' | 'lastChecked'>[] = [
  // Core Intelligence (5)
  { name: 'MICE Assessment', edgeFunction: 'mice-recruitment-analyzer', category: 'core' },
  { name: 'Behavioral DNA', edgeFunction: 'behavioral-dna-sequencer', category: 'core' },
  { name: 'Attachment Vulnerability', edgeFunction: 'attachment-vulnerability-analyzer', category: 'core' },
  { name: 'Manipulation Susceptibility', edgeFunction: 'manipulation-vulnerability-assessment', category: 'core' },
  { name: 'Phobia Exploitation', edgeFunction: 'phobia-exploitation-engine', category: 'core' },
  
  // Psychological Operations (6)
  { name: 'Cognitive Warfare', edgeFunction: 'cognitive-warfare-engine', category: 'psychological' },
  { name: 'Trauma Exploitation', edgeFunction: 'trauma-exploitation-engine', category: 'psychological' },
  { name: 'Deception Detection', edgeFunction: 'enhanced-deception-detector', category: 'psychological' },
  { name: 'Influence Profile', edgeFunction: 'analyze-influence-profile', category: 'psychological' },
  { name: 'Coercion Resistance', edgeFunction: 'coercion-resistance-assessor', category: 'psychological' },
  { name: 'Existential Leverage', edgeFunction: 'existential-leverage-calculator', category: 'psychological' },
  
  // Advanced Warfare (6)
  { name: 'Memetic Propagation', edgeFunction: 'memetic-propagation-engine', category: 'warfare' },
  { name: 'Reality Consensus', edgeFunction: 'reality-consensus-engine', category: 'warfare' },
  { name: 'Mass Formation', edgeFunction: 'mass-formation-analyzer', category: 'warfare' },
  { name: 'Narrative Control', edgeFunction: 'narrative-control-engine', category: 'warfare' },
  { name: 'Predictive Behavior', edgeFunction: 'predict-behavioral-scenarios', category: 'warfare' },
  { name: 'Precognitive Patterns', edgeFunction: 'precognitive-pattern-engine', category: 'warfare' },
  
  // Network Intelligence (4)
  { name: 'Network Graph', edgeFunction: 'analyze-network-graph', category: 'network' },
  { name: 'Power Network', edgeFunction: 'power-network-analyzer', category: 'network' },
  { name: 'Relationship Trajectory', edgeFunction: 'predict-relationship-trajectory', category: 'network' },
  { name: 'Network Exploitation', edgeFunction: 'network-exploitation-mapper', category: 'network' },
  
  // Temporal & Quantum (4)
  { name: 'Temporal Fusion', edgeFunction: 'temporal-fusion-transformer', category: 'temporal' },
  { name: 'Quantum Cognition', edgeFunction: 'quantum-cognition-engine', category: 'temporal' },
  { name: 'Morphic Resonance', edgeFunction: 'morphic-resonance-detector', category: 'temporal' },
  { name: 'Omega Point Tracking', edgeFunction: 'omega-point-tracker', category: 'temporal' },
  
  // Fusion Intelligence (5)
  { name: 'Mosaic Intelligence', edgeFunction: 'mosaic-intelligence-fuser', category: 'fusion' },
  { name: 'Unified Data Fusion', edgeFunction: 'unified-data-fusion', category: 'fusion' },
  { name: 'Omniscient Orchestrator', edgeFunction: 'omniscient-orchestrator', category: 'fusion' },
  { name: 'Intelligence Dossier', edgeFunction: 'generate-intelligence-dossier', category: 'fusion' },
  { name: 'Aggregate Intelligence', edgeFunction: 'aggregate-media-intelligence', category: 'fusion' },
];

// Critical functions that must be available for generation to work
const CRITICAL_FUNCTIONS = [
  'mice-recruitment-analyzer',
  'behavioral-dna-sequencer',
  'cognitive-warfare-engine',
  'generate-intelligence-dossier',
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
      // Use POST with minimal body - any response except 404 means function exists
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn.edgeFunction}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ healthCheck: true }),
        }
      );
      
      const latency = Date.now() - startTime;
      
      // 404 means function doesn't exist
      if (response.status === 404) {
        return {
          ...fn,
          status: 'unhealthy',
          latency,
          error: 'Function not deployed',
          lastChecked: new Date(),
        };
      }
      
      // 200 with healthCheck response = function is healthy and supports health checks
      // Any other 2xx/4xx response (except 404) also means function exists
      return {
        ...fn,
        status: 'healthy',
        latency,
        error: undefined,
        lastChecked: new Date(),
      };
    } catch (err) {
      const latency = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Network errors or timeouts
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('timeout')) {
        return {
          ...fn,
          status: 'unhealthy',
          latency,
          error: 'Network error or timeout',
          lastChecked: new Date(),
        };
      }
      
      return {
        ...fn,
        status: 'unhealthy',
        latency,
        error: errorMessage,
        lastChecked: new Date(),
      };
    }
  };

  const runHealthCheck = useCallback(async () => {
    if (checkInProgressRef.current) return;
    checkInProgressRef.current = true;
    setIsChecking(true);

    // Reset all to checking state
    setFunctions(prev => prev.map(f => ({ ...f, status: 'checking' as const })));

    const results: FunctionHealth[] = [];
    const queue = [...functions];

    // Process in batches with concurrency limit
    while (queue.length > 0) {
      const batch = queue.splice(0, CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(batch.map(checkSingleFunction));
      results.push(...batchResults);
      
      // Update state incrementally for better UX
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

  // Auto-run health check on mount if cache is stale
  useEffect(() => {
    const shouldCheck = !lastFullCheck || 
      (Date.now() - lastFullCheck.getTime()) > CACHE_DURATION_MS;
    
    if (shouldCheck && !isChecking) {
      runHealthCheck();
    }
  }, []); // Only run once on mount

  // Compute derived state
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
